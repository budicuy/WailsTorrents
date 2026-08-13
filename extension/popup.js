// TorrentLite Chrome Extension Popup Logic
document.addEventListener("DOMContentLoaded", () => {
  const torrentUrlInput = document.getElementById("torrentUrl");
  const btnSend = document.getElementById("btnSend");
  const autoInterceptToggle = document.getElementById("autoIntercept");
  const msgBox = document.getElementById("msgBox");

  // Load saved preference
  chrome.storage.local.get({ autoIntercept: true }, (items) => {
    autoInterceptToggle.checked = items.autoIntercept;
  });

  // Save preference on change
  autoInterceptToggle.addEventListener("change", () => {
    chrome.storage.local.set({ autoIntercept: autoInterceptToggle.checked });
  });

  // Handle Send button click
  btnSend.addEventListener("click", () => {
    const url = torrentUrlInput.value.trim();
    if (!url) {
      showAlert("Harap masukkan Magnet URI atau URL .torrent", false);
      return;
    }

    btnSend.disabled = true;
    btnSend.innerText = "Mengirim...";

    const isMagnet = url.startsWith("magnet:");
    const payload = {
      action: isMagnet ? "add_magnet" : "add_torrent",
      url: url,
      type: isMagnet ? "magnet" : "torrent"
    };

    chrome.runtime.sendNativeMessage("com.torrentlite.chrome", payload, (response) => {
      btnSend.disabled = false;
      btnSend.innerText = "⚡ Kirim ke TorrentLite";

      if (chrome.runtime.lastError) {
        console.warn("Native Messaging Error:", chrome.runtime.lastError.message);
        // Protocol fallback
        const protocolUrl = `torrentlite:${encodeURIComponent(url)}`;
        chrome.tabs.create({ url: protocolUrl, active: false });
        showAlert("Tautan dikirim via protokol TorrentLite!", true);
        torrentUrlInput.value = "";
      } else {
        showAlert(response?.message || "Berhasil dikirim ke TorrentLite!", true);
        torrentUrlInput.value = "";
      }
    });
  });

  function showAlert(text, isSuccess) {
    msgBox.innerText = text;
    msgBox.style.display = "block";
    msgBox.className = "alert " + (isSuccess ? "alert-success" : "alert-error");
    setTimeout(() => {
      msgBox.style.display = "none";
    }, 4000);
  }
});
