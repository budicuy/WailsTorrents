<div align="center">

  <img src="frontend/public/appicon.png" alt="TorrentLite Logo" width="120" height="120" style="aspect-ratio: 1/1; object-fit: contain;" />

  # ⚡ TorrentLite

  **Aplikasi BitTorrent Downloader Berkinerja Tinggi, Ringan, & Modern**

  [![Go Version](https://img.shields.io/badge/Go-1.24%2B-00ADD8?style=for-the-badge&logo=go)](https://go.dev/)
  [![Wails Version](https://img.shields.io/badge/Wails-v3.0--beta-red?style=for-the-badge&logo=wails)](https://v3.wails.io/)
  [![React Version](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4.0-06B6D4?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
  [![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20Linux%20%7C%20macOS-orange?style=for-the-badge)](#-download--instalasi)

</div>

---

## 📌 Tentang TorrentLite

**TorrentLite** adalah aplikasi pengunduh torrent (*BitTorrent Client*) desktop generasi baru yang dibangun menggunakan kombinasi **Go (Wails v3)** di sisi backend dan **React + TypeScript + Tailwind CSS** di sisi frontend. 

TorrentLite dirancang untuk memberikan pengalaman mengunduh torrent yang **sangat cepat**, **ringan konsumsi memori**, **bebas iklan**, serta menyajikan antarmuka pengguna yang cantik, modern, dan mudah dibaca dengan skema warna khas **Orange + Hitam/Putih + Merah Accent**.

---

## ✨ Fitur Unggulan

- ⚡ **Engine BitTorrent Berkecepatan Tinggi**: Ditenagai oleh Go engine yang efisien dalam manajemen peer (DHT, PEX, Tracker) dan I/O disk.
- 🎨 **Desain UI Pekat & Modern**: Mengusung warna utama *Warm Orange*, latar belakang Obsidian Slate/White, dan tombol-tombol berbentuk kapsul pekat (*pill-shaped buttons*) yang kontras dan jelas.
- 🌓 **Dark Mode & Light Mode**: Mendukung tema Gelap dan Terang yang dapat disesuaikan sesuai kenyamanan mata pengguna.
- ⚡ **Responsif & Bebas Lag (0ms Delay)**: Seluruh transisi UI, checkbox selection, dan penggantian tab berjalan secara instan tanpa delay animasi yang memperlambat.
- 🧲 **Dukungan File `.torrent` & Magnet Link**: Memungkinkan penambahan torrent lewat file lokal maupun tautan Magnet URI dengan fitur inspeksi metadata sebelum download.
- 📊 **Batch Action Toolbar**: Kemudahan kontrol masal seperti **Pause All**, **Resume All**, **Delete All**, serta **Checklist Mode** untuk memilih dan menghapus beberapa torrent sekaligus.
- 🔍 **Detail & Struktur File**: Pratinjau struktur file di dalam torrent, indikator progres per file, status hash, dan opsi menyalin Magnet URI.
- 🎚️ **Pengaturan Kecepatan & UI Scale**: Batasi kecepatan download/upload global serta atur skala tampilan antarmuka (75% hingga 150%).
- ⌨️ **Pintasan Keyboard (Shortcuts)**: Navigasi cepat dengan keyboard untuk pengguna tingkat lanjut.
- 📦 **Kompresi UPX & Ukuran Ringkas**: Binary executable diompres dengan UPX untuk menghemat ruang penyimpanan.

---

## 💻 Skema Warna UI

| Elemen UI | Warna & Gaya | Penggunaan |
| :--- | :--- | :--- |
| **Primary Brand** | 🟧 `Orange-600` (`#ea580c`) | Logo, Tombol **+ Torrent**, Tab Aktif, Checkbox, Slider Scale |
| **Accent / Danger** | 🔴 `Red-600` (`#dc2626`) | Tombol **🔗 Magnet**, Aksi **Delete All / Delete Selected**, Modal Hapus |
| **Warning / Pause** | 🟡 `Amber-500` (`#f59e0b`) | Tombol **Pause All**, Tombol Pause Card, Badge Status Paused |
| **Success / Play** | 🟢 `Emerald-600` (`#059669`) | Tombol **Resume All**, Tombol Play Card, Speed Monitor Download |
| **Progress Fill** | 🔵 `Blue-600` (`#2563eb`) | Batang Progres Download (*Progress Bar*), Speed Monitor Upload |

---

## ⌨️ Pintasan Keyboard (Keyboard Shortcuts)

| Pintasan Keyboard | Aksi |
| :--- | :--- |
| <kbd>Ctrl</kbd> + <kbd>N</kbd> / <kbd>Cmd</kbd> + <kbd>N</kbd> | Buka Modal **Add Torrent File** |
| <kbd>Ctrl</kbd> + <kbd>M</kbd> / <kbd>Cmd</kbd> + <kbd>M</kbd> | Buka Modal **Add Magnet Link** |
| <kbd>Ctrl</kbd> + <kbd>P</kbd> / <kbd>Cmd</kbd> + <kbd>P</kbd> | Jeda Semua Download (**Pause All**) |
| <kbd>Ctrl</kbd> + <kbd>R</kbd> / <kbd>Cmd</kbd> + <kbd>R</kbd> | Lanjutkan Semua Download (**Resume All**) |
| <kbd>Ctrl</kbd> + <kbd>S</kbd> / <kbd>Cmd</kbd> + <kbd>S</kbd> | Buka Halaman Pengaturan (**Settings**) |
| <kbd>Esc</kbd> | Tutup Modal Dialog yang Sedang Terbuka |

---

## 📥 Download & Instalasi

Unduh versi rilis terbaru TorrentLite sesuai dengan sistem operasi Anda dari halaman [GitHub Releases](https://github.com/budicuy/WailsTorrents/releases):

- 🪟 **Windows**: Extract dan jalankan `TorrentLite-Windows-amd64.exe` (Portabel).
- 🐧 **Linux**: Extract file `TorrentLite-Linux-amd64.tar.gz` dan jalankan biner `./TorrentLite-Linux-amd64`.
- 🍎 **macOS**: Extract `TorrentLite-macOS-universal.zip` dan jalankan aplikasi `TorrentLite` (Universal Binary Intel + Apple Silicon).

---

## 🛠️ Panduan Pengembang (Developer Guide)

### Prasyarat Sistem
- **Go**: versi 1.24 atau lebih baru
- **Bun** (atau Node.js & npm)
- **Wails 3 CLI**:
  ```bash
  go install github.com/wailsapp/wails/v3/cmd/wails3@latest
  ```
- **Task CLI**:
  ```bash
  go install github.com/go-task/task/v3/cmd/task@latest
  ```

### Jalankan Mode Pengembangan (Development)
```bash
# Clone repository
git clone https://github.com/budicuy/WailsTorrents.git
cd WailsTorrents

# Jalankan dalam dev mode (Hot-reload Frontend & Backend)
wails3 dev
```

### Kompilasi Produksi (Production Build)
```bash
# Build executable produksi di folder bin/
wails3 task prod
```

---

## 🤖 GitHub Actions Multi-Platform Release

Proyek ini telah dilengkapi dengan workflow CI/CD otomatis di `.github/workflows/release.yml`.

### Cara Melakukan Rilis Tag Baru:
```bash
# 1. Commit dan push kode ke branch main
git add .
git commit -m "feat: release version v1.0.0"
git push origin main

# 2. Buat tag release baru
git tag -a v1.0.0 -m "Release TorrentLite v1.0.0"

# 3. Push tag ke GitHub
git push origin v1.0.0
```
GitHub Actions secara otomatis akan mengompilasi biner untuk **Windows**, **Linux**, dan **macOS**, mengompres dengan **UPX**, lalu mempublikasikannya langsung ke **GitHub Releases**.

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah lisensi **MIT License**. Bebas digunakan dan dikembangkan kembali.
