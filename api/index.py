import ipaddress
import math
import os
import re
import socket
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone

from flask import Flask, jsonify, request, Response

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
from lib import auth  # noqa: E402

app = Flask(__name__)
app.secret_key = auth.load_secret_key()

# ---------- Proteksi dari crawler & asisten AI ----------
# Dipakai untuk 3 lapis: (1) robots.txt, (2) blokir User-Agent di server (403), (3) header/meta noai.
# Catatan: lapis 1-3 hanya menghentikan bot yang jujur memakai User-Agent aslinya. Untuk bot yang menyamar,
# aktifkan juga Vercel Firewall (AI Bots + Bot Protection) — lihat README.
AI_BOTS = (
    "GPTBot", "ChatGPT-User", "OAI-SearchBot", "ClaudeBot", "Claude-User", "Claude-SearchBot", "Claude-Web",
    "anthropic-ai", "CCBot", "PerplexityBot", "Perplexity-User", "Bytespider", "Amazonbot", "cohere-ai",
    "cohere-training-data-crawler", "Diffbot", "FacebookBot", "meta-externalagent", "meta-externalfetcher",
    "omgili", "omgilibot", "ImagesiftBot", "Timpibot", "YouBot", "DuckAssistBot", "MistralAI-User",
    "AI2Bot", "Ai2Bot-Dolma", "PanguBot", "Google-Extended", "Applebot-Extended", "Google-CloudVertexBot",
)
_AI_UA = tuple(b.lower() for b in AI_BOTS)


@app.before_request
def block_ai_bots():
    if request.path == "/robots.txt":  # robots.txt harus tetap bisa dibaca bot
        return None
    ua = (request.headers.get("User-Agent") or "").lower()
    if ua and any(b in ua for b in _AI_UA):
        return Response("Akses oleh crawler/asisten AI tidak diizinkan.\n", status=403, mimetype="text/plain",
                        headers={"X-Robots-Tag": "noindex, noai, noimageai"})
    return None


@app.after_request
def bot_headers(resp):
    private = request.path in ("/dashboard", "/login", "/daftar") or request.path.startswith(("/auth/", "/api/"))
    resp.headers["X-Robots-Tag"] = "noindex, nofollow, noai, noimageai" if private else "noai, noimageai"
    return resp


@app.get("/robots.txt")
def robots_txt():
    lines = []
    for b in AI_BOTS:
        lines += [f"User-agent: {b}", "Disallow: /", ""]
    lines += ["User-agent: *", "Disallow: /dashboard", "Disallow: /login", "Disallow: /daftar",
              "Disallow: /auth/", "Disallow: /api/", "Allow: /", ""]
    return Response("\n".join(lines), mimetype="text/plain")


DASH_HTML = r"""<!DOCTYPE html>
<html lang="id" data-title-key="title.dash">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#0a0612">
<meta name="robots" content="noindex, nofollow, noai, noimageai">
<title>Dashboard — AVEditor</title>
<script>
(function(){try{var m=localStorage.getItem("avedit-theme");if(m!=="light"&&m!=="dark")m=window.matchMedia&&matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";document.documentElement.dataset.theme=m;var c=document.querySelector('meta[name="theme-color"]');if(c)c.content=m==="light"?"#f6f3fc":"#0a0612";}catch(e){document.documentElement.dataset.theme="dark";}})();
</script>
<link rel="stylesheet" href="/static/style.css">
</head>
<body>

<nav class="nav" id="nav">
  <div class="nav-in">
    <a class="brand" href="/"><svg class="ic" aria-hidden="true"><use href="/static/icons.svg#audio-lines"/></svg><span>AVEditor</span></a>

    <div class="menu" id="menu">
      <div class="menu-links">
        <a class="nav-link" href="/" data-nav="home" data-i18n="nav.home">Beranda</a>
        <a class="nav-link" href="/dashboard" data-nav="dashboard" data-i18n="nav.dashboard">Dashboard</a>
        <a class="nav-link" href="/#panduan" data-nav="guide" data-i18n="nav.guide">Panduan</a>
      </div>
      <div class="authbox" id="authBox"></div>
    </div>

    <div class="nav-tools">
      <button type="button" id="langBtn" class="btn-ico" aria-label="Language"><svg class="ic" aria-hidden="true"><use href="/static/icons.svg#globe"/></svg><span id="langLbl">EN</span></button>
      <button type="button" id="themeBtn" class="btn-ico" aria-label="Theme"><svg class="ic" aria-hidden="true"><use href="/static/icons.svg#sun"/></svg></button>
      <button type="button" id="burger" class="btn-ico burger" aria-label="Menu" aria-expanded="false" aria-controls="menu"><svg class="ic" aria-hidden="true"><use href="/static/icons.svg#menu"/></svg></button>
    </div>
  </div>
  <div class="nav-progress" id="navProgress" aria-hidden="true"><span></span></div>
</nav>

<main class="wrap">
  <header class="dash-head">
    <div>
      <h1 data-i18n="dash.h">Dashboard</h1>
      <p class="sub" data-i18n="dash.sub">Unggah file audio atau video, pilih bagian, lalu edit dan unduh.</p>
    </div>
    <span class="dash-hello" id="dashHello"></span>
  </header>

  <section id="editor-sec" class="card">
    <!-- LAYAR AWAL -->
    <div id="startCard">
      <div class="tabs" role="tablist">
        <button type="button" class="tab active" data-tab="local"><svg class="ic" aria-hidden="true"><use href="/static/icons.svg#folder-open"/></svg><span data-i18n="tab.local">File Lokal</span></button>
        <button type="button" class="tab" data-tab="link"><svg class="ic" aria-hidden="true"><use href="/static/icons.svg#link"/></svg><span data-i18n="tab.link">Dari Link</span></button>
      </div>

      <div id="paneLocal" class="pane">
        <input type="file" id="file" accept="audio/*,video/*" hidden>
        <div id="drop" class="drop">
          <svg class="ic ic-xl" aria-hidden="true"><use href="/static/icons.svg#cloud-upload"/></svg>
          <p data-i18n-html="drop.main"><strong>Klik atau seret file</strong> audio / video ke sini</p>
          <small data-i18n-html="drop.sub">MP4, MOV, WEBM, MKV, MP3, WAV, M4A, AAC, OGG — disarankan &lt; 500 MB</small>
        </div>
      </div>

      <div id="paneLink" class="pane hidden">
        <div class="linkrow">
          <input type="url" id="urlIn" placeholder="https://contoh.com/video.mp4" data-i18n-ph="ph.url" pattern="https://.*" inputmode="url" autocomplete="off">
          <button type="button" id="urlGo" class="primary" data-i18n="btn.fetch">Ambil</button>
        </div>
        <small class="hint" data-i18n-html="hint.link">Gunakan link langsung ke file (berakhiran .mp4, .mp3, dst). Link YouTube dan halaman streaming tidak didukung.</small>
      </div>
      <div class="status" id="startStatus"></div>
    </div>

    <!-- LAYAR EDITOR -->
    <div id="editor" class="hidden">
      <div class="player" id="playerBox"></div>
      <div class="fname" id="fname"></div>

      <div class="wavebox">
        <canvas id="wave"></canvas>
        <div class="wtools">
          <button type="button" id="zOut" title="Zoom out" aria-label="Zoom out"><svg class="ic" aria-hidden="true"><use href="/static/icons.svg#zoom-out"/></svg></button>
          <input type="range" id="zoom" min="0" max="100" step="1" value="0" aria-label="Zoom">
          <button type="button" id="zIn" title="Zoom in" aria-label="Zoom in"><svg class="ic" aria-hidden="true"><use href="/static/icons.svg#zoom-in"/></svg></button>
          <button type="button" id="zSel" class="ghost"><svg class="ic" aria-hidden="true"><use href="/static/icons.svg#search"/></svg><span data-i18n="z.sel">Zoom ke pilihan</span></button>
          <button type="button" id="zAll" class="ghost"><svg class="ic" aria-hidden="true"><use href="/static/icons.svg#maximize"/></svg><span data-i18n="z.all">Lihat semua</span></button>
        </div>
        <input type="range" id="pan" class="pan" min="0" max="0" step="0.01" value="0" aria-label="Geser tampilan">
        <small class="hint" data-i18n="hint.wave">Seret penanda putih (awal) dan ungu (akhir) untuk memilih bagian. Klik timeline untuk pindah posisi putar. Desktop: Ctrl + scroll = zoom, Shift + scroll = geser.</small>
      </div>

      <div class="grid">
        <label><span data-i18n="l.start">Mulai (detik)</span>
          <div class="row">
            <input type="number" id="nStart" min="0" step="0.01" value="0" inputmode="decimal">
            <button type="button" id="setStart" title="Pakai posisi player" data-i18n-title="ttl.pos"><svg class="ic" aria-hidden="true"><use href="/static/icons.svg#map-pin"/></svg></button>
          </div>
        </label>
        <label><span data-i18n="l.end">Selesai (detik)</span>
          <div class="row">
            <input type="number" id="nEnd" min="0" step="0.01" value="0" inputmode="decimal">
            <button type="button" id="setEnd" title="Pakai posisi player" data-i18n-title="ttl.pos"><svg class="ic" aria-hidden="true"><use href="/static/icons.svg#map-pin"/></svg></button>
          </div>
        </label>
      </div>
      <div class="info" id="info"></div>

      <label class="mode">Mode
        <select id="mode">
          <option value="fast" data-i18n="opt.fast">Cepat — tanpa re-encode, kualitas asli (video bisa geser beberapa detik)</option>
          <option value="precise" data-i18n="opt.precise">Presisi — re-encode, tepat di detik, lebih lambat</option>
        </select>
      </label>

      <div class="actions">
        <button type="button" id="preview" class="ghost"><svg class="ic" aria-hidden="true"><use href="/static/icons.svg#play"/></svg><span data-i18n="btn.preview">Putar bagian terpilih</span></button>
        <button type="button" id="cut" class="primary"><svg class="ic" aria-hidden="true"><use href="/static/icons.svg#pencil"/></svg><span data-i18n="btn.cut">Edit &amp; Unduh</span></button>
        <button type="button" id="cancel" class="danger hidden"><svg class="ic" aria-hidden="true"><use href="/static/icons.svg#x"/></svg><span data-i18n="btn.cancel">Batalkan proses</span></button>
      </div>
      <div class="actions sec">
        <button type="button" id="resetRange" class="ghost"><svg class="ic" aria-hidden="true"><use href="/static/icons.svg#rotate-ccw"/></svg><span data-i18n="btn.reset">Reset rentang</span></button>
        <button type="button" id="changeFile" class="ghost"><svg class="ic" aria-hidden="true"><use href="/static/icons.svg#refresh-cw"/></svg><span data-i18n="btn.change">Ganti / Unggah ulang file</span></button>
      </div>

      <div class="progress hidden" id="progWrap"><div id="prog"></div></div>
      <div class="status" id="status"></div>
      <div id="result" class="result"></div>
    </div>
  </section>

  <section id="guide-dash" class="card guide">
    <h2 data-i18n="guide.h">Panduan singkat</h2>
    <ol>
      <li data-i18n-html="guide.1">Unggah file dari perangkat atau tempel link langsung ke file.</li>
      <li data-i18n-html="guide.2">Geser penanda di timeline audio atau isi detik Mulai &amp; Selesai. Tombol <svg class="ic" aria-hidden="true"><use href="/static/icons.svg#map-pin"/></svg> mengambil posisi player saat ini.</li>
      <li data-i18n-html="guide.3">Pilih mode, klik <b>Edit &amp; Unduh</b>.</li>
      <li data-i18n-html="guide.4">Salah edit? Klik <b>Reset rentang</b>, <b>Ganti file</b>, atau <b>Edit hasil ini</b> untuk mengedit lagi.</li>
    </ol>
  </section>
</main>

<footer class="footer">
  <div class="footer-in">
    <div class="f-col f-brand">
      <a class="brand" href="/"><svg class="ic" aria-hidden="true"><use href="/static/icons.svg#audio-lines"/></svg><span>AVEditor</span></a>
      <p data-i18n="foot.desc">Platform editor audio &amp; video untuk hasil yang rapi dan presisi.</p>
    </div>
    <div class="f-col">
      <h3 data-i18n="foot.menu">Menu</h3>
      <ul>
        <li><a href="/" data-i18n="nav.home">Beranda</a></li>
        <li><a href="/dashboard" data-i18n="nav.dashboard">Dashboard</a></li>
        <li><a href="/#panduan" data-i18n="nav.guide">Panduan</a></li>
        <li><a href="/api/health" data-i18n="foot.status">Status layanan</a></li>
      </ul>
    </div>
    <div class="f-col">
      <h3 data-i18n="foot.formats">Format didukung</h3>
      <ul class="tags">
        <li>MP4</li><li>MOV</li><li>WEBM</li><li>MKV</li>
        <li>MP3</li><li>WAV</li><li>M4A</li><li>AAC</li><li>OGG</li>
      </ul>
    </div>
  </div>
  <div class="footer-bar">
    <span>© {{YEAR}} AVEditor. <span data-i18n="foot.rights">Semua hak dilindungi.</span></span>
    <a href="#top" class="totop"><svg class="ic" aria-hidden="true"><use href="/static/icons.svg#arrow-up"/></svg><span data-i18n="foot.top">Kembali ke atas</span></a>
  </div>
</footer>

<script src="/static/i18n.js"></script>
<script src="/static/authnav.js"></script>
<script src="/static/router.js"></script>
<script src="/static/ffmpeg/ffmpeg.js"></script>
<script src="/static/app.js"></script>
</body>
</html>
"""


# ---------- Landing page (/) ----------
def _i(name):
    return f'<svg class="ic" aria-hidden="true"><use href="/static/icons.svg#{name}"/></svg>'


def _bars(n=44, lo=14, hi=31):
    out = []
    for k in range(n):
        h = int(22 + 62 * abs(math.sin(k * 0.62) * math.cos(k * 0.21 + 0.6)))
        cls = ' class="on"' if lo <= k <= hi else ""
        out.append(f'<i{cls} style="--h:{h}%;--d:{(k % 11) * -0.22:.2f}s"></i>')
    return "".join(out)


_FEATS = [
    ("zap", "land.f1", "Pemrosesan cepat", "Mode Cepat menjaga kualitas asli file Anda tanpa kompresi ulang."),
    ("audio-lines", "land.f2", "Timeline presisi", "Pilih bagian yang tepat dengan zoom dan penanda hingga hitungan detik."),
    ("folder-open", "land.f3", "Banyak format", "Edit file populer seperti MP4, MOV, WEBM, MP3, WAV, dan M4A."),
    ("cloud-upload", "land.f4", "Siap untuk file besar", "Dirancang menangani file berukuran besar dengan proses yang tetap stabil."),
    ("monitor-smartphone", "land.f5", "Semua perangkat", "Tampilan menyesuaikan desktop, tablet, dan ponsel, lengkap dengan tema gelap dan terang."),
    ("log-in", "land.f6", "Akun &amp; dashboard pribadi", "Masuk dengan email atau Google, lalu kelola pekerjaan edit Anda dari satu tempat."),
]
_STEPS = [
    ("land.s1", "Masuk", "Buat akun Anda atau masuk dengan Google untuk membuka dashboard."),
    ("land.s2", "Unggah", "Pilih file audio/video dari perangkat, atau tempel link https."),
    ("land.s3", "Edit & unduh", "Tandai bagian yang diinginkan, lalu unduh hasilnya."),
]

LANDING_MAIN = (
    '<main class="land">\n'
    '  <section class="l-hero">\n'
    '    <div class="l-copy">\n'
    # '      <span class="l-badge">' + _i("sparkles") + '<span data-i18n="land.badge">Platform editor audio & video</span></span>\n'
    '      <h1 data-i18n-html="land.h1">Edit <span class="grad">audio &amp; video</span> dengan hasil profesional</h1>\n'
    '      <p class="l-lead" data-i18n="land.lead">Kelola pekerjaan edit Anda dari dashboard pribadi: timeline audio yang presisi, dua mode pengolahan, '
    'dan dukungan file berukuran besar untuk hasil yang konsisten.</p>\n'
    '      <div class="l-cta">\n'
    '        <a class="l-btn primary" href="/dashboard"><span data-i18n="land.cta">Mulai sekarang</span>' + _i("arrow-right") + '</a>\n'
    '        <a class="l-btn ghost" href="#panduan" data-no-router><span data-i18n="land.cta2">Lihat cara kerja</span></a>\n'
    '      </div>\n'
    '      <ul class="l-points">\n'
    '        <li>' + _i("check") + '<span data-i18n="land.p1">Akun &amp; dashboard pribadi</span></li>\n'
    '        <li>' + _i("check") + '<span data-i18n="land.p2">Mendukung beberapa jenis file audio dan video</span></li>\n'
    '        <li>' + _i("check") + '<span data-i18n="land.p3">Presisi hingga hitungan detik</span></li>\n'
    '      </ul>\n'
    '    </div>\n'
    '    <div class="l-demo" aria-hidden="true">\n'
    '      <div class="demo-top"><i></i><i></i><i></i><span>rekaman-kelas.mp4</span></div>\n'
    '      <div class="demo-wave">' + _bars() + '<div class="demo-sel"></div></div>\n'
    '      <div class="demo-foot"><span class="demo-time">0:12.40 → 0:48.10</span>'
    '<span class="demo-btn">' + _i("pencil") + '<span data-i18n="btn.cut">Edit &amp; Unduh</span></span></div>\n'
    '    </div>\n'
    '  </section>\n\n'
    '  <section class="l-sec" id="fitur">\n'
    '    <h2 data-i18n="land.fh">Fitur yang mendukung pekerjaan Anda</h2>\n'
    '    <p class="l-sub" data-i18n="land.fs">Dirancang untuk alur kerja yang efisien di desktop maupun ponsel.</p>\n'
    '    <div class="l-grid">\n'
    + "".join(
        f'      <article class="l-feat"><div class="l-ico">{_i(ic)}</div>'
        f'<h3 data-i18n="{k}t">{t}</h3><p data-i18n="{k}d">{d}</p></article>\n'
        for ic, k, t, d in _FEATS
    )
    + '    </div>\n'
    '  </section>\n\n'
    '  <section class="l-sec" id="panduan">\n'
    '    <h2 data-i18n="land.hh">Tiga langkah, selesai</h2>\n'
    '    <p class="l-sub" data-i18n="land.hs">Alur kerja yang jelas dari file mentah hingga hasil akhir.</p>\n'
    '    <ol class="l-steps">\n'
    + "".join(
        f'      <li class="l-step"><span class="l-num">{n}</span>'
        f'<h3 data-i18n="{k}t">{t}</h3><p data-i18n="{k}d">{d}</p></li>\n'
        for n, (k, t, d) in enumerate(_STEPS, 1)
    )
    + '    </ol>\n'
    '  </section>\n\n'
    '  <section class="l-band">\n'
    '    <h2 data-i18n="land.bh">Siap meningkatkan alur kerja edit Anda?</h2>\n'
    '    <p data-i18n="land.bs">Masuk ke dashboard dan mulai mengedit.</p>\n'
    '    <div class="l-cta"><a class="l-btn primary" href="/dashboard"><span data-i18n="land.cta">Mulai sekarang</span>' + _i("arrow-right") + '</a></div>\n'
    '  </section>\n'
    '</main>'
)

LANDING_HTML = re.sub(r'<main class="wrap">.*?</main>', lambda m: LANDING_MAIN, DASH_HTML, count=1, flags=re.S)
LANDING_HTML = LANDING_HTML.replace('data-title-key="title.dash"', 'data-title-key="title.home"')
LANDING_HTML = LANDING_HTML.replace('content="noindex, nofollow, noai, noimageai"', 'content="noai, noimageai"')
LANDING_HTML = LANDING_HTML.replace("<title>Dashboard — AVEditor</title>", "<title>AVEditor — Edit Audio & Video</title>")
LANDING_HTML = LANDING_HTML.replace(
    '<script src="/static/ffmpeg/ffmpeg.js"></script>\n<script src="/static/app.js"></script>\n', "")


# Login & daftar: /login, /daftar, /auth/*, /api/me (lihat lib/auth.py). /dashboard dijaga di sana juga.
auth.register_routes(app, LANDING_HTML)


def _html(page):
    return Response(page.replace("{{YEAR}}", str(datetime.now(timezone.utc).year)), mimetype="text/html")


@app.get("/")
def index():
    return _html(LANDING_HTML)


@app.get("/dashboard")
def dashboard():
    resp = _html(DASH_HTML)
    resp.headers["Cache-Control"] = "private, no-store"
    return resp


@app.get("/api/health")
def health():
    return jsonify(status="ok", time=datetime.now(timezone.utc).isoformat())


# ---------- Proxy ambil file dari link (fallback bila browser terblokir CORS) ----------
MAX_PROXY = 4 * 1024 * 1024  # batas respons serverless Vercel ±4,5 MB


def _safe(url: str) -> bool:
    p = urllib.parse.urlparse(url)
    if p.scheme != "https" or not p.hostname:  # hanya https
        return False
    try:
        infos = socket.getaddrinfo(p.hostname, p.port or 443)
    except socket.gaierror:
        return False
    for i in infos:
        ip = ipaddress.ip_address(i[4][0])
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved or ip.is_multicast:
            return False
    return True


class _SafeRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        if not _safe(newurl):
            raise urllib.error.URLError("redirect ke alamat tidak diizinkan")
        return super().redirect_request(req, fp, code, msg, headers, newurl)


@app.get("/api/fetch")
def fetch_url():
    url = request.args.get("url", "").strip()
    if not _safe(url):
        return jsonify(error="URL tidak valid atau tidak diizinkan (hanya https)", code="invalid_url"), 400
    opener = urllib.request.build_opener(_SafeRedirect)
    req = urllib.request.Request(url, headers={"User-Agent": "CutIt/1.0"})
    try:
        with opener.open(req, timeout=20) as r:
            ctype = (r.headers.get("Content-Type") or "application/octet-stream").split(";")[0]
            clen = r.headers.get("Content-Length")
            if clen and clen.isdigit() and int(clen) > MAX_PROXY:
                return jsonify(error="File terlalu besar untuk proxy (maks 4 MB)", code="too_large"), 413
            data = r.read(MAX_PROXY + 1)
    except Exception as e:  # noqa: BLE001
        return jsonify(error=f"Gagal mengambil link: {e}", code="fetch_failed"), 502
    if len(data) > MAX_PROXY:
        return jsonify(error="File terlalu besar untuk proxy (maks 4 MB)", code="too_large"), 413
    return Response(data, mimetype=ctype)


@app.get("/api/cron/purge")
def cron_purge():
    # Tidak ada file tersimpan di server; endpoint ini menjaga cron vercel.json tetap valid.
    secret = os.environ.get("CRON_SECRET")
    if secret and request.headers.get("Authorization") != f"Bearer {secret}":
        return jsonify(error="unauthorized"), 401
    return jsonify(purged=0, note="no server-side files")
