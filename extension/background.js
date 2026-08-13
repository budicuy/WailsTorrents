// TorrentLite Chrome Extension — Background Service Worker (IDM-Style Confirmation)
const NATIVE_HOST = "com.torrentlite.chrome";

// Create context menu items on installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "send-to-torrentlite",
    title: "⚡ Download dengan TorrentLite",
    contexts: ["link"]
  });
  console.log("[TorrentLite Extension] Installed. Extension ID:", chrome.runtime.id);
});

// Handle Context Menu clicks on magnet / torrent links
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "send-to-torrentlite" && info.linkUrl) {
    const isMagnet = info.linkUrl.startsWith("magnet:");
    triggerConfirmationFlow({
      action: isMagnet ? "add_magnet" : "add_torrent",
      url: info.linkUrl,
      type: isMagnet ? "magnet" : "torrent"
    }, tab);
  }
});

// Intercept .torrent downloads
chrome.downloads.onCreated.addListener((downloadItem) => {
  chrome.storage.local.get({ autoIntercept: true }, (prefs) => {
    if (!prefs.autoIntercept) return;

    const url = downloadItem.url || downloadItem.finalUrl || "";
    const filename = downloadItem.filename || "";

    if (url.endsWith(".torrent") || filename.endsWith(".torrent") || downloadItem.mime === "application/x-bittorrent" || url.includes(".torrent") || url.startsWith("blob:")) {
      console.log("[TorrentLite Extension] Intercepted torrent download:", url);
      
      // Cancel Chrome built-in download
      chrome.downloads.cancel(downloadItem.id);
      chrome.downloads.erase({ id: downloadItem.id });

      // Handle blob: URLs or standard URLs
      if (url.startsWith("blob:")) {
        fetchBlobAsBase64(url).then(base64Data => {
          triggerConfirmationFlow({
            action: "add_torrent_bytes",
            base64_data: base64Data,
            filename: filename || "download.torrent",
            url: url
          });
        }).catch(err => {
          console.error("[TorrentLite Extension] Failed to read blob URL:", err);
        });
      } else {
        triggerConfirmationFlow({
          action: url.startsWith("magnet:") ? "add_magnet" : "add_torrent",
          url: url,
          filename: filename,
          type: url.startsWith("magnet:") ? "magnet" : "torrent"
        });
      }
    }
  });
});

// Listen for approval message from content.js modal
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "confirm_download_approved" && message.payload) {
    sendPayloadToTorrentLite(message.payload);
    sendResponse({ status: "approved" });
  }
  return true;
});

// Trigger confirmation modal injected into active webpage tab in Chrome
function triggerConfirmationFlow(payload, targetTab) {
  if (targetTab && targetTab.id) {
    chrome.tabs.sendMessage(targetTab.id, {
      action: "show_torrentlite_modal",
      payload: payload
    }).catch(err => {
      // Fallback if tab script not injected
      sendPayloadToTorrentLite(payload);
    });
  } else {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "show_torrentlite_modal",
          payload: payload
        }).catch(err => {
          // Fallback if tab script not injected
          sendPayloadToTorrentLite(payload);
        });
      } else {
        sendPayloadToTorrentLite(payload);
      }
    });
  }
}

function fetchBlobAsBase64(blobUrl) {
  return fetch(blobUrl)
    .then(res => res.blob())
    .then(blob => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    }));
}

// Helper function to communicate with TorrentLite via Native Messaging API & Protocol launcher
function sendPayloadToTorrentLite(payload) {
  // 1. Send via Native Messaging API
  chrome.runtime.sendNativeMessage(NATIVE_HOST, payload, (response) => {
    if (chrome.runtime.lastError) {
      console.warn("[TorrentLite Extension] Native Messaging error:", chrome.runtime.lastError.message);
      if (chrome.notifications && chrome.notifications.create) {
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icon48.png",
          title: "TorrentLite Extension",
          message: `Gagal mengirim ke Native Host: ${chrome.runtime.lastError.message}`
        });
      }
    } else {
      console.log("[TorrentLite Extension] Response from Native Host:", response);
      if (chrome.notifications && chrome.notifications.create) {
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icon48.png",
          title: "⚡ TorrentLite Downloader",
          message: response?.message || "Torrent berhasil dikirim ke TorrentLite!"
        });
      }
    }
  });

  // 2. Launch TorrentLite protocol so main window pops up
  if (payload.url && !payload.url.startsWith("blob:")) {
    const protocolUrl = `torrentlite:${encodeURIComponent(payload.url)}`;
    chrome.tabs.create({ url: protocolUrl, active: false }, (tab) => {
      setTimeout(() => {
        if (tab && tab.id) chrome.tabs.remove(tab.id);
      }, 1200);
    });
  }
}
