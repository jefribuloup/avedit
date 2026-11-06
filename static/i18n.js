/* AVEdit — i18n (ID/EN) + tema gelap/terang */
(() => {
  const D = {
    id: {
      'title': 'AVEdit — Potong Audio & Video',
      'nav.guide': 'Panduan', 'nav.new': 'Mulai Baru',
      'hero.title': 'Potong <span class="grad">Audio &amp; Video</span>',
      'hero.sub': 'Pilih bagian yang kamu mau, potong, lalu unduh. Simpel dan cepat.',
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
      'w.na': 'Waveform tidak tersedia (tanpa audio / format tidak terbaca). Pemotongan tetap bisa.',
      'st.loadEngine': 'Memuat mesin pemotong (sekali saja, ±30 MB)…', 'st.cancelled': 'Proses dibatalkan.',
      'st.badRange': 'Rentang potongan tidak valid.', 'st.waitWave': 'Menunggu analisis audio selesai…',
      'st.reading': 'Membaca file…', 'st.cutting': 'Memotong…',
      'e.ffFail': 'ffmpeg gagal (kode {code}). Coba mode Presisi.',
      'r.dl': 'Unduh {name} ({size})', 'r.edit': 'Edit hasil ini', 'st.done': 'Selesai', 'st.error': 'Error: '
    },
    en: {
      'title': 'AVEdit — Cut Audio & Video',
      'nav.guide': 'Guide', 'nav.new': 'Start New',
      'hero.title': 'Cut <span class="grad">Audio &amp; Video</span>',
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
    document.title = t('title');
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
