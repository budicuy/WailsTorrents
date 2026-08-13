// TorrentLite Chrome Content Script — In-Page Confirmation Modal (IDM-Style)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "show_torrentlite_modal") {
    createTorrentLiteConfirmationModal(message.payload);
    sendResponse({ status: "modal_shown" });
  }
  return true;
});

// Intercept direct clicks on magnet: links on any webpage
document.addEventListener("click", (e) => {
  const link = e.target.closest("a");
  if (link && link.href && link.href.startsWith("magnet:")) {
    e.preventDefault();
    e.stopPropagation();

    const magnetUrl = link.href;
    const dnMatch = magnetUrl.match(/dn=([^&]+)/);
    const displayName = dnMatch ? decodeURIComponent(dnMatch[1].replace(/\+/g, ' ')) : "Tautan Magnet Link";

    createTorrentLiteConfirmationModal({
      action: "add_magnet",
      url: magnetUrl,
      filename: displayName,
      type: "magnet"
    });
  }
}, true);

function createTorrentLiteConfirmationModal(payload) {
  // Remove existing modal if any
  const existingModal = document.getElementById("torrentlite-chrome-modal-root");
  if (existingModal) {
    existingModal.remove();
  }

  const isMagnet = payload.url && payload.url.startsWith("magnet:");
  let displayName = "Torrent File";
  if (isMagnet) {
    const dnMatch = payload.url.match(/dn=([^&]+)/);
    displayName = dnMatch ? decodeURIComponent(dnMatch[1].replace(/\+/g, ' ')) : "Magnet Download";
  } else if (payload.filename) {
    displayName = payload.filename;
  } else if (payload.url) {
    const parts = payload.url.split('/');
    displayName = parts[parts.length - 1] || "Torrent Download";
  }

  // Create Root Container
  const modalRoot = document.createElement("div");
  modalRoot.id = "torrentlite-chrome-modal-root";
  modalRoot.style.cssText = `
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    background-color: rgba(15, 23, 42, 0.75) !important;
    backdrop-filter: blur(8px) !important;
    z-index: 2147483647 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
    color: #f8fafc !important;
    animation: tlFadeIn 0.15s ease-out !important;
  `;

  // Inject CSS Keyframes
  if (!document.getElementById("torrentlite-modal-styles")) {
    const styleEl = document.createElement("style");
    styleEl.id = "torrentlite-modal-styles";
    styleEl.textContent = `
      @keyframes tlFadeIn {
        from { opacity: 0; transform: scale(0.96); }
        to { opacity: 1; transform: scale(1); }
      }
      .tl-btn-primary {
        background-color: #ea580c !important;
        color: #ffffff !important;
        transition: all 0.15s ease !important;
      }
      .tl-btn-primary:hover {
        background-color: #c2410c !important;
        transform: translateY(-1px) !important;
      }
      .tl-btn-secondary {
        background-color: #334155 !important;
        color: #f8fafc !important;
        transition: all 0.15s ease !important;
      }
      .tl-btn-secondary:hover {
        background-color: #475569 !important;
      }
    `;
    document.head.appendChild(styleEl);
  }

  modalRoot.innerHTML = `
    <div style="
      width: 440px;
      max-width: 90vw;
      background-color: #0f172a;
      border: 1px solid #334155;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
    ">
      <!-- Header -->
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background-color: rgba(234, 88, 12, 0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
          ">⚡</div>
          <div>
            <div style="font-size: 16px; font-weight: 700; color: #ea580c; line-height: 1.2;">TorrentLite</div>
            <div style="font-size: 12px; color: #94a3b8;">Konfirmasi Unduhan (IDM-Style)</div>
          </div>
        </div>
        <button id="tl-btn-close" style="
          background: none;
          border: none;
          color: #94a3b8;
          font-size: 20px;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
        ">✕</button>
      </div>

      <!-- Content Card -->
      <div style="
        background-color: #1e293b;
        border: 1px solid #334155;
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 20px;
      ">
        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #ea580c; margin-bottom: 6px;">
          ${isMagnet ? "🧲 Tautan Magnet URI" : "📄 File Torrent"}
        </div>
        <div style="
          font-size: 14px;
          font-weight: 600;
          color: #ffffff;
          word-break: break-all;
          line-height: 1.4;
          max-height: 80px;
          overflow-y: auto;
        ">${escapeHtml(displayName)}</div>
      </div>

      <!-- Information Banner -->
      <div style="
        font-size: 12px;
        color: #94a3b8;
        margin-bottom: 20px;
        line-height: 1.4;
      ">
        Apakah Anda yakin ingin mengunduh file ini dan mentransfernya ke aplikasi <strong>TorrentLite Desktop</strong>?
      </div>

      <!-- Action Buttons -->
      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button id="tl-btn-cancel" class="tl-btn-secondary" style="
          padding: 10px 20px;
          border-radius: 9999px;
          border: none;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        ">Batal</button>
        <button id="tl-btn-confirm" class="tl-btn-primary" style="
          padding: 10px 24px;
          border-radius: 9999px;
          border: none;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        ">⚡ Download Sekarang</button>
      </div>
    </div>
  `;

  document.body.appendChild(modalRoot);

  // Event Listeners
  const btnClose = modalRoot.querySelector("#tl-btn-close");
  const btnCancel = modalRoot.querySelector("#tl-btn-cancel");
  const btnConfirm = modalRoot.querySelector("#tl-btn-confirm");

  const closeModal = () => {
    modalRoot.remove();
  };

  btnClose.addEventListener("click", closeModal);
  btnCancel.addEventListener("click", closeModal);

  btnConfirm.addEventListener("click", () => {
    btnConfirm.disabled = true;
    btnConfirm.innerText = "Mengirim...";
    
    // Send confirmation back to background.js
    chrome.runtime.sendMessage({
      action: "confirm_download_approved",
      payload: payload
    }, (res) => {
      closeModal();
    });
  });
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.innerText = text;
  return div.innerHTML;
}
