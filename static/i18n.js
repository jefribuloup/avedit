/* AVEdit — i18n (ID/EN) + tema gelap/terang */
(() => {
  const D = {
    id: {
      "nav.login": "Masuk",
      "nav.register": "Daftar",
      "nav.logout": "Keluar",
      "auth.back": "Kembali ke editor",
      "auth.title.login": "Masuk — AVEdit",
      "auth.title.register": "Daftar — AVEdit",
      "auth.tab.login": "Masuk",
      "auth.tab.register": "Daftar",
      "auth.h.login": "Selamat datang kembali",
      "auth.sub.login": "Masuk untuk memakai AVEdit dari perangkat mana saja.",
      "auth.h.register": "Buat akun gratis",
      "auth.side.title": "Potong audio & video tanpa ribet",
      "auth.side.sub": "Akun gratis untuk memakai AVEdit dari perangkat mana saja.",
      "auth.side.f1": "Pilih bagian, potong, unduh — cepat",
      "auth.side.f2": "Waveform, zoom, dan ketelitian hingga detik",
      "auth.side.f3": "File diproses langsung di browser Anda",
      "auth.sub.register": "Daftar dengan formulir, atau satu klik dengan akun Google.",
      "auth.f.name": "Nama lengkap",
      "auth.f.email": "Email",
      "auth.f.username": "Username",
      "auth.f.identifier": "Username atau email",
      "auth.f.password": "Kata sandi",
      "auth.f.confirm": "Ulangi kata sandi",
      "auth.hint.username": "3–30 karakter: huruf kecil, angka, titik, garis bawah.",
      "auth.hint.password": "Minimal 8 karakter.",
      "auth.hint.google": "Akun Google tidak memakai kata sandi — gunakan tombol Google di bawah.",
      "auth.pw.toggle": "Tampilkan / sembunyikan kata sandi",
      "auth.submit.login": "Masuk",
      "auth.submit.register": "Daftar",
      "auth.submit.loading": "Memproses…",
      "auth.or": "atau",
      "auth.google.login": "Masuk dengan Google",
      "auth.google.register": "Daftar dengan Google",
      "auth.goRegister": "Belum punya akun? Daftar sekarang",
      "auth.err.name_required": "Nama wajib diisi.",
      "auth.err.email_invalid": "Format email tidak valid.",
      "auth.err.username_invalid": "Username harus 3–30 karakter: huruf kecil, angka, titik, atau garis bawah.",
      "auth.err.password_short": "Kata sandi minimal 8 karakter.",
      "auth.err.password_long": "Kata sandi terlalu panjang (maks 128).",
      "auth.err.password_weak": "Kata sandi tidak boleh sama dengan username atau email.",
      "auth.err.password_mismatch": "Kata sandi dan ulangannya tidak sama.",
      "auth.err.username_taken": "Username sudah dipakai.",
      "auth.err.email_taken": "Email sudah terdaftar. Silakan masuk.",
      "auth.err.email_google": "Email ini terdaftar lewat Google. Gunakan tombol Google.",
      "auth.err.invalid_credentials": "Username/email atau kata sandi salah.",
      "auth.err.locked": "Akun dikunci sementara karena terlalu banyak percobaan. Coba lagi dalam {minutes} menit.",
      "auth.err.rate_limited": "Terlalu banyak permintaan. Coba lagi dalam {minutes} menit.",
      "auth.err.csrf": "Sesi habis. Muat ulang halaman lalu coba lagi.",
      "auth.err.not_configured": "Fitur ini belum dikonfigurasi di server.",
      "auth.err.not_registered": "Akun Google ini belum terdaftar. Silakan daftar dulu.",
      "auth.err.email_unverified": "Email Google belum terverifikasi.",
      "auth.err.access_denied": "Akses Google dibatalkan.",
      "auth.err.state": "Sesi Google tidak valid. Coba lagi.",
      "auth.err.network": "Jaringan bermasalah. Coba lagi.",
      "auth.err.failed": "Terjadi kesalahan. Coba lagi.",
      'title': 'AVEdit — Audio & Video Editor',
      'nav.guide': 'Panduan', 'nav.new': 'Mulai Baru',
      'hero.title': '<span class="grad">Audio &amp; Video</span> Editor',
      'hero.sub': 'Pilih bagian yang kamu mau, potong, lalu unduh. Simpel dan cepat bro.',
      'tab.local': 'File Lokal', 'tab.link': 'Dari Link',
      'drop.main': '<strong>Klik atau seret file</strong> audio / video ke sini',
      'drop.sub': 'MP4, MOV, WEBM, MKV, MP3, WAV, M4A, AAC, OGG — disarankan &lt; 500 MB',
      'ph.url': 'https://contoh.com/video.mp4', 'btn.fetch': 'Ambil',
      'hint.link': 'Hanya link <b>https://</b> yang diizinkan. Gunakan link langsung ke file (berakhiran .mp4, .mp3, dst). Link YouTube dan halaman streaming tidak didukung.',
      'z.sel': 'Zoom ke pilihan', 'z.all': 'Lihat semua',
      'hint.wave': 'Seret penanda putih (awal) dan ungu (akhir) untuk memilih bagian. Klik gelombang untuk pindah posisi putar. Desktop: Ctrl + scroll = zoom, Shift + scroll = geser.',
      'l.start': 'Mulai (detik)', 'l.end': 'Selesai (detik)', 'ttl.pos': 'Pakai posisi player',
      'opt.fast': 'Cepat — tanpa re-encode, kualitas asli (video bisa geser beberapa detik)',
      'opt.precise': 'Presisi — re-encode, tepat di detik, lebih lambat',
      'btn.preview': 'Putar bagian terpilih', 'btn.cut': 'Potong & Unduh', 'btn.cancel': 'Batalkan proses',
      'btn.reset': 'Reset rentang', 'btn.change': 'Ganti / Unggah ulang file',
      'guide.h': 'Panduan singkat',
      'guide.1': 'Unggah file dari perangkat atau tempel link <b>https</b> langsung ke file.',
      'guide.2': 'Geser penanda di waveform atau isi detik Mulai &amp; Selesai. Tombol <svg class="ic" aria-hidden="true"><use href="/static/icons.svg#map-pin"/></svg> mengambil posisi player saat ini.',
      'guide.3': 'Pilih mode, klik <b>Potong &amp; Unduh</b>.',
      'guide.4': 'Salah potong? Klik <b>Reset rentang</b>, <b>Ganti file</b>, atau <b>Edit hasil ini</b> untuk memotong lagi.',
      'foot.desc': 'Pemotong audio & video sederhana yang berjalan langsung di browser. Tanpa instalasi, tanpa ribet.',
      'foot.menu': 'Menu', 'foot.status': 'Status layanan', 'foot.formats': 'Format didukung',
      'foot.rights': 'Semua hak dilindungi.', 'foot.top': 'Kembali ke atas',
      'lang.switch': 'Ganti ke English', 'theme.toLight': 'Ganti ke tema terang', 'theme.toDark': 'Ganti ke tema gelap',
      's.downloading': 'Mengunduh…', 's.connecting': 'Menghubungi link…',
      's.viaServer': 'Link tidak bisa diakses langsung, mencoba lewat server…',
      'e.fetch': 'Gagal mengambil link.', 'e.fallback': ' Unduh file lalu unggah lewat tab File Lokal.',
      'e.invalid': 'URL tidak valid atau tidak diizinkan (hanya https).', 'e.tooLarge': 'File terlalu besar untuk proxy (maks 4 MB).',
      'e.notMedia': 'Link bukan file audio/video langsung.',
      'e.https': 'Hanya link yang diawali https:// yang diizinkan.',
      'e.httpsRedirect': 'Link dialihkan ke alamat non-https, ditolak.',
      'e.noDur': 'Durasi file tidak terbaca.', 'e.noPlay': 'Browser tidak bisa memutar file ini (format/codec tidak didukung).',
      'e.noAudio': 'tidak ada audio', 'e.loadFail': 'Gagal memuat',
      'info': 'Durasi potongan: {len}  ({s} → {e})', 'st.reset': 'Rentang dikembalikan ke seluruh durasi.',
      'w.big': 'File besar — waveform dinonaktifkan agar tidak kehabisan memori (pemotongan tetap bisa).',
      'w.unsupported': 'Browser tidak mendukung waveform.', 'w.analyzing': 'Menganalisis audio…',
      'w.analyzingFF': 'Menganalisis audio lewat mesin ffmpeg…',
      'w.analyzingBig': 'Menganalisis file besar… ini bisa memakan beberapa menit.',
      'w.naWhy': 'Waveform tidak tersedia ({why}). Pemotongan tetap bisa.',
      'loading': 'Memuat halaman…',
      'sz.large': 'File besar — analisis dan pemotongan berjalan di latar belakang dan bisa memakan waktu.',
      'sz.huge': 'File sangat besar — Mode Cepat dipilih otomatis agar aman. Proses bisa lama dan memakai banyak memori; tutup tab lain bila perlu.',
      'sz.precise': 'Mode Presisi pada file besar bisa sangat lambat dan berisiko kehabisan memori. Disarankan Mode Cepat.',
      'sz.reject': 'File {size} melebihi batas {max}. Potong atau kecilkan dulu dengan aplikasi lain, lalu unggah lagi.',
      'sz.rejectMobile': 'File {size} melebihi batas {max} untuk perangkat mobile. Gunakan desktop atau kecilkan file dulu.',
      'w.na': 'Waveform tidak tersedia (tanpa audio / format tidak terbaca). Pemotongan tetap bisa.',
      'st.loadEngine': 'Memuat mesin pemotong (sekali saja, ±30 MB)…', 'st.cancelled': 'Proses dibatalkan.',
      'st.badRange': 'Rentang potongan tidak valid.', 'st.waitWave': 'Menunggu analisis audio selesai…',
      'st.reading': 'Membaca file…', 'st.cutting': 'Memotong…',
      'e.ffFail': 'ffmpeg gagal (kode {code}). Coba mode Presisi.',
      'r.dl': 'Unduh {name} ({size})', 'r.edit': 'Edit hasil ini', 'st.done': 'Selesai', 'st.error': 'Error: '
    },
    en: {
      "nav.login": "Sign in",
      "nav.register": "Sign up",
      "nav.logout": "Sign out",
      "auth.back": "Back to editor",
      "auth.title.login": "Sign in — AVEdit",
      "auth.title.register": "Sign up — AVEdit",
      "auth.tab.login": "Sign in",
      "auth.tab.register": "Sign up",
      "auth.h.login": "Welcome back",
      "auth.sub.login": "Sign in to use AVEdit from any device.",
      "auth.h.register": "Create a free account",
      "auth.side.title": "Cut audio & video, hassle-free",
      "auth.side.sub": "A free account to use AVEdit from any device.",
      "auth.side.f1": "Pick a part, cut, download — fast",
      "auth.side.f2": "Waveform, zoom, and second-level precision",
      "auth.side.f3": "Files are processed right in your browser",
      "auth.sub.register": "Sign up with the form, or in one click with your Google account.",
      "auth.f.name": "Full name",
      "auth.f.email": "Email",
      "auth.f.username": "Username",
      "auth.f.identifier": "Username or email",
      "auth.f.password": "Password",
      "auth.f.confirm": "Confirm password",
      "auth.hint.username": "3–30 characters: lowercase letters, digits, dot, underscore.",
      "auth.hint.password": "At least 8 characters.",
      "auth.hint.google": "Google accounts have no password — use the Google button below.",
      "auth.pw.toggle": "Show / hide password",
      "auth.submit.login": "Sign in",
      "auth.submit.register": "Sign up",
      "auth.submit.loading": "Please wait…",
      "auth.or": "or",
      "auth.google.login": "Sign in with Google",
      "auth.google.register": "Sign up with Google",
      "auth.goRegister": "No account yet? Sign up now",
      "auth.err.name_required": "Name is required.",
      "auth.err.email_invalid": "Invalid email format.",
      "auth.err.username_invalid": "Username must be 3–30 characters: lowercase letters, digits, dot, or underscore.",
      "auth.err.password_short": "Password must be at least 8 characters.",
      "auth.err.password_long": "Password is too long (max 128).",
      "auth.err.password_weak": "Password must not equal your username or email.",
      "auth.err.password_mismatch": "Passwords do not match.",
      "auth.err.username_taken": "Username is already taken.",
      "auth.err.email_taken": "Email is already registered. Please sign in.",
      "auth.err.email_google": "This email is registered via Google. Use the Google button.",
      "auth.err.invalid_credentials": "Wrong username/email or password.",
      "auth.err.locked": "Account temporarily locked due to too many attempts. Try again in {minutes} minutes.",
      "auth.err.rate_limited": "Too many requests. Try again in {minutes} minutes.",
      "auth.err.csrf": "Session expired. Reload the page and try again.",
      "auth.err.not_configured": "This feature is not configured on the server.",
      "auth.err.not_registered": "This Google account is not registered yet. Please sign up first.",
      "auth.err.email_unverified": "Your Google email is not verified.",
      "auth.err.access_denied": "Google access was cancelled.",
      "auth.err.state": "Invalid Google session. Please try again.",
      "auth.err.network": "Network problem. Please try again.",
      "auth.err.failed": "Something went wrong. Please try again.",
      'title': 'AVEdit — Audio & Video Editor',
      'nav.guide': 'Guide', 'nav.new': 'Start New',
      'hero.title': '<span class="grad">Audio &amp; Video</span> Editor',
      'hero.sub': 'Pick the part you want, cut it, then download. Simple and fast.',
      'tab.local': 'Local File', 'tab.link': 'From Link',
      'drop.main': '<strong>Click or drag a file</strong> (audio / video) here',
      'drop.sub': 'MP4, MOV, WEBM, MKV, MP3, WAV, M4A, AAC, OGG — recommended &lt; 500 MB',
      'ph.url': 'https://example.com/video.mp4', 'btn.fetch': 'Fetch',
      'hint.link': 'Only <b>https://</b> links are allowed. Use a direct link to the file (ending in .mp4, .mp3, etc.). YouTube links and streaming pages are not supported.',
      'z.sel': 'Zoom to selection', 'z.all': 'View all',
      'hint.wave': 'Drag the white (start) and purple (end) markers to select a part. Click the waveform to move the playhead. Desktop: Ctrl + scroll = zoom, Shift + scroll = pan.',
      'l.start': 'Start (seconds)', 'l.end': 'End (seconds)', 'ttl.pos': 'Use player position',
      'opt.fast': 'Fast — no re-encode, original quality (video may shift by a few seconds)',
      'opt.precise': 'Precise — re-encode, frame-accurate, slower',
      'btn.preview': 'Play selected part', 'btn.cut': 'Cut & Download', 'btn.cancel': 'Cancel process',
      'btn.reset': 'Reset range', 'btn.change': 'Change / Re-upload file',
      'guide.h': 'Quick guide',
      'guide.1': 'Upload a file from your device or paste a direct <b>https</b> link to the file.',
      'guide.2': 'Drag the markers on the waveform or enter Start &amp; End seconds. The <svg class="ic" aria-hidden="true"><use href="/static/icons.svg#map-pin"/></svg> button takes the current player position.',
      'guide.3': 'Choose a mode, then click <b>Cut &amp; Download</b>.',
      'guide.4': 'Made a mistake? Click <b>Reset range</b>, <b>Change file</b>, or <b>Edit this result</b> to cut again.',
      'foot.desc': 'A simple audio & video cutter that runs right in your browser. No installation, no hassle.',
      'foot.menu': 'Menu', 'foot.status': 'Service status', 'foot.formats': 'Supported formats',
      'foot.rights': 'All rights reserved.', 'foot.top': 'Back to top',
      'lang.switch': 'Switch to Bahasa Indonesia', 'theme.toLight': 'Switch to light theme', 'theme.toDark': 'Switch to dark theme',
      's.downloading': 'Downloading…', 's.connecting': 'Contacting link…',
      's.viaServer': 'Link is not directly reachable, trying via server…',
      'e.fetch': 'Failed to fetch the link.', 'e.fallback': ' Download the file and upload it via the Local File tab.',
      'e.invalid': 'Invalid or disallowed URL (https only).', 'e.tooLarge': 'File too large for the proxy (max 4 MB).',
      'e.notMedia': 'The link is not a direct audio/video file.',
      'e.https': 'Only links starting with https:// are allowed.',
      'e.httpsRedirect': 'The link redirected to a non-https address, rejected.',
      'e.noDur': 'Could not read the file duration.', 'e.noPlay': 'This browser cannot play this file (unsupported format/codec).',
      'e.noAudio': 'no audio', 'e.loadFail': 'Failed to load',
      'info': 'Clip duration: {len}  ({s} → {e})', 'st.reset': 'Range reset to the full duration.',
      'w.big': 'Large file — waveform disabled to avoid running out of memory (cutting still works).',
      'w.unsupported': 'This browser does not support waveform.', 'w.analyzing': 'Analyzing audio…',
      'w.analyzingFF': 'Analyzing audio with the ffmpeg engine…',
      'w.analyzingBig': 'Analyzing large file… this may take a few minutes.',
      'w.naWhy': 'Waveform unavailable ({why}). Cutting still works.',
      'loading': 'Loading page…',
      'sz.large': 'Large file — analysis and cutting run in the background and may take a while.',
      'sz.huge': 'Very large file — Fast mode was selected automatically to be safe. Processing may be slow and memory-heavy; close other tabs if needed.',
      'sz.precise': 'Precise mode on large files can be very slow and may run out of memory. Fast mode is recommended.',
      'sz.reject': 'File {size} exceeds the {max} limit. Please trim or shrink it with another app first, then upload again.',
      'sz.rejectMobile': 'File {size} exceeds the {max} limit for mobile devices. Use a desktop or shrink the file first.',
      'w.na': 'Waveform unavailable (no audio / unreadable format). Cutting still works.',
      'st.loadEngine': 'Loading the cutting engine (one time, ~30 MB)…', 'st.cancelled': 'Process cancelled.',
      'st.badRange': 'Invalid cut range.', 'st.waitWave': 'Waiting for audio analysis to finish…',
      'st.reading': 'Reading file…', 'st.cutting': 'Cutting…',
      'e.ffFail': 'ffmpeg failed (code {code}). Try Precise mode.',
      'r.dl': 'Download {name} ({size})', 'r.edit': 'Edit this result', 'st.done': 'Done', 'st.error': 'Error: '
    }
  };
  const KL = 'avedit-lang', KT = 'avedit-theme';
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (_) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (_) {} }
  };
  const $ = (id) => document.getElementById(id);
  const qa = (s) => document.querySelectorAll(s);
  const ICON = (n) => '<svg class="ic" aria-hidden="true"><use href="/static/icons.svg#' + n + '"/></svg>';
  window.ICON = ICON;
  let lang = store.get(KL);
  if (!D[lang]) lang = (navigator.language || 'id').toLowerCase().startsWith('id') ? 'id' : 'en';

  const t = (k, p) => {
    let s = D[lang][k] ?? D.id[k] ?? k;
    for (const n in (p || {})) s = s.split('{' + n + '}').join(p[n]);
    return s;
  };
  const theme = () => document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';

  function paintTheme() {
    const light = theme() === 'light';
    const b = $('themeBtn');
    if (b) { b.innerHTML = ICON(light ? 'moon' : 'sun'); b.title = b.ariaLabel = t(light ? 'theme.toDark' : 'theme.toLight'); }
    const m = document.querySelector('meta[name="theme-color"]');
    if (m) m.content = light ? '#f6f3fc' : '#0a0612';
  }
  function apply() {
    document.documentElement.lang = lang;
    document.title = t(document.documentElement.dataset.titleKey || 'title');
    qa('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    qa('[data-i18n-html]').forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
    qa('[data-i18n-ph]').forEach((el) => { el.placeholder = t(el.dataset.i18nPh); });
    qa('[data-i18n-title]').forEach((el) => { el.title = t(el.dataset.i18nTitle); });
    const lb = $('langBtn');
    if (lb) { const ll = $('langLbl'); if (ll) ll.textContent = lang === 'id' ? 'EN' : 'ID'; lb.title = lb.ariaLabel = t('lang.switch'); }
    paintTheme();
    document.dispatchEvent(new Event('langchange'));
  }
  function setLang(l) { lang = D[l] ? l : 'id'; store.set(KL, lang); apply(); }
  function setTheme(m) {
    document.documentElement.dataset.theme = m === 'light' ? 'light' : 'dark';
    store.set(KT, theme()); paintTheme();
    document.dispatchEvent(new Event('themechange'));
  }

  $('langBtn').onclick = () => setLang(lang === 'id' ? 'en' : 'id');
  $('themeBtn').onclick = () => setTheme(theme() === 'light' ? 'dark' : 'light');
  window.I18N = { t, setLang, getLang: () => lang, setTheme, getTheme: theme };
  apply();
})();
