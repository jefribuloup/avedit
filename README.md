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
static/icons.svg      SVG icon sprite (Lucide)
static/ffmpeg/        ffmpeg.wasm wrapper
static/auth.js        Login/sign-up page logic (manual form + Google One Tap)
static/authnav.js     Navbar account box (Sign in / Sign up / user + Sign out)
lib/auth.py           Auth routes: /login /daftar /auth/* /api/me
lib/db.py             Postgres accounts + rate limit (tables avedit_users, avedit_rate_limits)
lib/authpage.py       Login/sign-up page template
.env.example          Environment variable template
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

## Accounts (Login & Sign-up)
Optional accounts, modeled on the [Talkins](https://github.com/jefribuloup/talkins) auth flow:
- **Manual**: sign-up form (name, email, username, password) and login with username *or* email. Passwords are hashed (Werkzeug); 5 wrong attempts lock the account for 15 minutes; login/sign-up are rate-limited per IP; CSRF token on every auth POST.
- **Google**: One Tap / official Google button (ID token verified server-side: signature, audience, issuer, expiry). Falls back to OAuth 2.0 redirect (`/auth/google`) if the Google script can't load. Signing in with Google creates the account automatically if it doesn't exist.
- Pages: `/login`, `/daftar`. Navbar shows **Sign in / Sign up**, or the user's name + **Sign out**. The account box is hidden when `DATABASE_URL` is not set, so the editor keeps working without a database.
- `REQUIRE_LOGIN=1` makes the editor page require login (default `0`, optional). Note: editing runs in the browser, so this gates the page, not the processing.

**Setup**
1. Create a Postgres database (Neon / Vercel Postgres) → set `DATABASE_URL`. Tables are created automatically.
2. Set `SECRET_KEY` (32+ random chars): `python -c "import secrets; print(secrets.token_hex(32))"`.
3. Google Cloud Console → *APIs & Services → Credentials → OAuth client ID (Web)*:
   - **Authorized JavaScript origins**: `https://avedit.vercel.app` (+ `http://localhost:5000` for local)
   - **Authorized redirect URIs** (fallback flow): `https://avedit.vercel.app/auth/google/callback`
   - Set `GOOGLE_CLIENT_ID` (+ `GOOGLE_CLIENT_SECRET` for the fallback flow). Optionally `APP_BASE_URL`.
4. Redeploy. See `.env.example` for all variables.

## Icons
Icons are from [Lucide](https://lucide.dev) (ISC license — free for commercial use). Sprite: `static/icons.svg`; license text: `static/LICENSE-lucide.txt`. To add an icon, copy its `<symbol>` into the sprite and use `<svg class="ic"><use href="/static/icons.svg#name"/></svg>`.

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

### Ikon
Ikon memakai [Lucide](https://lucide.dev) (lisensi ISC — gratis untuk komersial). Sprite: `static/icons.svg`; teks lisensi: `static/LICENSE-lucide.txt`.

### Akun (Login & Daftar)
Akun bersifat opsional, mengikuti alur auth aplikasi [Talkins](https://github.com/jefribuloup/talkins):
- **Manual**: formulir daftar (nama, email, username, kata sandi) dan masuk dengan username *atau* email. Kata sandi di-hash; 5 kali salah mengunci akun 15 menit; login/daftar dibatasi per IP; semua POST auth memakai token CSRF.
- **Google**: One Tap / tombol resmi Google (ID token diverifikasi di server). Cadangan: OAuth 2.0 redirect (`/auth/google`). Masuk dengan Google otomatis membuat akun bila belum ada.
- Halaman: `/login`, `/daftar`. Navbar menampilkan **Masuk / Daftar**, atau nama pengguna + **Keluar**. Kotak akun disembunyikan bila `DATABASE_URL` belum diisi, jadi editor tetap jalan tanpa database.
- `REQUIRE_LOGIN=1` mewajibkan login untuk halaman editor (default `0`). Catatan: pemotongan berjalan di browser, jadi yang dikunci halamannya, bukan prosesnya.

**Pengaturan**
1. Buat database Postgres (Neon / Vercel Postgres) → isi `DATABASE_URL`. Tabel dibuat otomatis.
2. Isi `SECRET_KEY` (32+ karakter acak): `python -c "import secrets; print(secrets.token_hex(32))"`.
3. Google Cloud Console → *APIs & Services → Credentials → OAuth client ID (Web)*:
   - **Authorized JavaScript origins**: `https://avedit.vercel.app` (+ `http://localhost:5000` untuk lokal)
   - **Authorized redirect URIs** (alur cadangan): `https://avedit.vercel.app/auth/google/callback`
   - Isi `GOOGLE_CLIENT_ID` (+ `GOOGLE_CLIENT_SECRET` untuk alur cadangan). Opsional `APP_BASE_URL`.
4. Deploy ulang. Daftar lengkap variabel ada di `.env.example`.
