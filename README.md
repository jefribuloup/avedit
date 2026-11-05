# AVEdit — Audio & Video Cutter

🇬🇧 English · [🇮🇩 Bahasa Indonesia](#-bahasa-indonesia)

A simple audio & video cutter that runs in the browser (ffmpeg.wasm). Pick a range on the waveform, cut, and download — no installation, files are processed locally on your device.

## Features
- ✂️ Cut audio/video (MP4, MOV, WEBM, MKV, MP3, WAV, M4A, AAC, OGG)
- 📁 Upload a local file or 🔗 load from a link (**https only**)
- 🌊 Waveform with zoom/pan and draggable start/end markers
- ⚡ Fast mode (no re-encode) or 🎯 Precise mode (re-encode)
- 🌐 Multi-language: **English / Bahasa Indonesia** (auto-detected, switchable in the navbar)
- 🌗 **Dark / Light theme** (follows system preference, switchable, remembered)

## Link security (https only)
- The client rejects any URL that is not `https://`.
- The server proxy (`/api/fetch`) also accepts `https` only, validates every redirect, and blocks private/loopback/link-local addresses (SSRF protection). Max proxy size ≈ 4 MB (Vercel limit).
- Redirects from https to http are rejected.

## Project structure
```
api/index.py          Flask app (HTML page, /api/health, /api/fetch, cron)
static/app.js         Editor logic
static/i18n.js        Translations (id/en) + theme switcher
static/style.css      Styles (dark & light theme via CSS variables)
static/ffmpeg/        ffmpeg.wasm wrapper
vercel.json           Vercel config
```

## Run locally
```bash
pip install -r requirements.txt
cd api && flask --app index run
# open http://127.0.0.1:5000
```

## Deploy
Push to GitHub and import into [Vercel](https://vercel.com) — `vercel.json` is already configured.

## Customize
- **Add/edit text or a language:** edit the dictionary in `static/i18n.js`; use `data-i18n`, `data-i18n-html`, `data-i18n-ph`, `data-i18n-title` in HTML and `tr('key')` in JS.
- **Theme colors:** edit the CSS variables in `:root` and `:root[data-theme="light"]` in `static/style.css`.
- Preferences are stored in `localStorage` (`avedit-lang`, `avedit-theme`).

## License
See [LICENSE](LICENSE).

---

## 🇮🇩 Bahasa Indonesia

Pemotong audio & video sederhana yang berjalan di browser (ffmpeg.wasm). Pilih rentang di waveform, potong, lalu unduh — tanpa instalasi, file diproses lokal di perangkatmu.

### Fitur
- ✂️ Potong audio/video (MP4, MOV, WEBM, MKV, MP3, WAV, M4A, AAC, OGG)
- 📁 Unggah file lokal atau 🔗 ambil dari link (**hanya https**)
- 🌊 Waveform dengan zoom/geser dan penanda awal/akhir yang bisa diseret
- ⚡ Mode Cepat (tanpa re-encode) atau 🎯 Mode Presisi (re-encode)
- 🌐 Multi bahasa: **English / Bahasa Indonesia** (terdeteksi otomatis, bisa diganti di navbar)
- 🌗 **Tema Gelap / Terang** (mengikuti sistem, bisa diganti, tersimpan)

### Keamanan link (hanya https)
- Klien menolak URL selain `https://`.
- Proxy server (`/api/fetch`) juga hanya menerima `https`, memvalidasi setiap redirect, dan memblokir alamat privat/loopback/link-local (proteksi SSRF). Batas proxy ±4 MB (limit Vercel).
- Redirect dari https ke http ditolak.

### Menjalankan lokal
```bash
pip install -r requirements.txt
cd api && flask --app index run
```

### Kustomisasi
- **Teks/bahasa:** ubah kamus di `static/i18n.js`.
- **Warna tema:** ubah variabel CSS di `static/style.css` (`:root` dan `:root[data-theme="light"]`).
