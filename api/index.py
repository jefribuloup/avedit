import ipaddress
import os
import socket
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone

from flask import Flask, jsonify, request, Response

app = Flask(__name__)

INDEX_HTML = r"""<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#0a0612">
<title>CutIt — Potong Audio & Video</title>
<link rel="stylesheet" href="/static/style.css">
</head>
<body>

<nav class="nav">
  <div class="nav-in">
    <a class="brand" href="/"><span class="logo">✂️</span><span>CutIt</span></a>
    <button class="burger" id="burger" aria-label="Menu" aria-expanded="false">☰</button>
    <div class="links" id="links">
      <a href="#editor-sec">Editor</a>
      <a href="#panduan">Panduan</a>
      <button type="button" id="navNew" class="btn-sm">＋ Mulai Baru</button>
    </div>
  </div>
</nav>

<main class="wrap">
  <header class="hero">
    <h1>Potong <span class="grad">Audio &amp; Video</span></h1>
    <p class="sub">Pilih bagian yang kamu mau, potong, lalu unduh. Simpel dan cepat.</p>
  </header>

  <section id="editor-sec" class="card">
    <!-- LAYAR AWAL -->
    <div id="startCard">
      <div class="tabs" role="tablist">
        <button type="button" class="tab active" data-tab="local">📁 File Lokal</button>
        <button type="button" class="tab" data-tab="link">🔗 Dari Link</button>
      </div>

      <div id="paneLocal" class="pane">
        <input type="file" id="file" accept="audio/*,video/*" hidden>
        <div id="drop" class="drop">
          <p><strong>Klik atau seret file</strong> audio / video ke sini</p>
          <small>MP4, MOV, WEBM, MKV, MP3, WAV, M4A, AAC, OGG — disarankan &lt; 500 MB</small>
        </div>
      </div>

      <div id="paneLink" class="pane hidden">
        <div class="linkrow">
          <input type="url" id="urlIn" placeholder="https://contoh.com/video.mp4" autocomplete="off">
          <button type="button" id="urlGo" class="primary">Ambil</button>
        </div>
        <small class="hint">Gunakan link langsung ke file (berakhiran .mp4, .mp3, dst). Link YouTube dan halaman streaming tidak didukung.</small>
      </div>
      <div class="status" id="startStatus"></div>
    </div>

    <!-- LAYAR EDITOR -->
    <div id="editor" class="hidden">
      <div class="player" id="playerBox"></div>
      <div class="fname" id="fname"></div>

      <div class="timeline">
        <div class="track"><div class="sel" id="sel"></div></div>
        <input type="range" id="rStart" min="0" max="100" step="0.01" value="0">
        <input type="range" id="rEnd" min="0" max="100" step="0.01" value="100">
      </div>

      <div class="grid">
        <label>Mulai (detik)
          <div class="row">
            <input type="number" id="nStart" min="0" step="0.01" value="0" inputmode="decimal">
            <button type="button" id="setStart" title="Pakai posisi player">📍</button>
          </div>
        </label>
        <label>Selesai (detik)
          <div class="row">
            <input type="number" id="nEnd" min="0" step="0.01" value="0" inputmode="decimal">
            <button type="button" id="setEnd" title="Pakai posisi player">📍</button>
          </div>
        </label>
      </div>
      <div class="info" id="info"></div>

      <label class="mode">Mode
        <select id="mode">
          <option value="fast">Cepat — tanpa re-encode, kualitas asli (video bisa geser beberapa detik)</option>
          <option value="precise">Presisi — re-encode, tepat di detik, lebih lambat</option>
        </select>
      </label>

      <div class="actions">
        <button type="button" id="preview" class="ghost">▶ Putar bagian terpilih</button>
        <button type="button" id="cut" class="primary">✂️ Potong &amp; Unduh</button>
        <button type="button" id="cancel" class="danger hidden">✖ Batalkan proses</button>
      </div>
      <div class="actions sec">
        <button type="button" id="resetRange" class="ghost">↺ Reset rentang</button>
        <button type="button" id="changeFile" class="ghost">🔄 Ganti / Unggah ulang file</button>
      </div>

      <div class="progress hidden" id="progWrap"><div id="prog"></div></div>
      <div class="status" id="status"></div>
      <div id="result" class="result"></div>
    </div>
  </section>

  <section id="panduan" class="card guide">
    <h2>Panduan singkat</h2>
    <ol>
      <li>Unggah file dari perangkat atau tempel link langsung ke file.</li>
      <li>Geser slider atau isi detik Mulai &amp; Selesai. Tombol 📍 mengambil posisi player saat ini.</li>
      <li>Pilih mode, klik <b>Potong &amp; Unduh</b>.</li>
      <li>Salah potong? Klik <b>Reset rentang</b>, <b>Ganti file</b>, atau <b>Edit hasil ini</b> untuk memotong lagi.</li>
    </ol>
  </section>
</main>

<footer class="foot">© CutIt</footer>

<script src="/static/ffmpeg/ffmpeg.js"></script>
<script src="/static/app.js"></script>
</body>
</html>
"""


@app.get("/")
def index():
    return Response(INDEX_HTML, mimetype="text/html")


@app.get("/api/health")
def health():
    return jsonify(status="ok", time=datetime.now(timezone.utc).isoformat())


# ---------- Proxy ambil file dari link (fallback bila browser terblokir CORS) ----------
MAX_PROXY = 4 * 1024 * 1024  # batas respons serverless Vercel ±4,5 MB


def _safe(url: str) -> bool:
    p = urllib.parse.urlparse(url)
    if p.scheme not in ("http", "https") or not p.hostname:
        return False
    try:
        infos = socket.getaddrinfo(p.hostname, p.port or (443 if p.scheme == "https" else 80))
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
        return jsonify(error="URL tidak valid atau tidak diizinkan"), 400
    opener = urllib.request.build_opener(_SafeRedirect)
    req = urllib.request.Request(url, headers={"User-Agent": "CutIt/1.0"})
    try:
        with opener.open(req, timeout=20) as r:
            ctype = (r.headers.get("Content-Type") or "application/octet-stream").split(";")[0]
            clen = r.headers.get("Content-Length")
            if clen and clen.isdigit() and int(clen) > MAX_PROXY:
                return jsonify(error="File terlalu besar untuk proxy (maks 4 MB)"), 413
            data = r.read(MAX_PROXY + 1)
    except Exception as e:  # noqa: BLE001
        return jsonify(error=f"Gagal mengambil link: {e}"), 502
    if len(data) > MAX_PROXY:
        return jsonify(error="File terlalu besar untuk proxy (maks 4 MB)"), 413
    return Response(data, mimetype=ctype)


@app.get("/api/cron/purge")
def cron_purge():
    # Tidak ada file tersimpan di server; endpoint ini menjaga cron vercel.json tetap valid.
    secret = os.environ.get("CRON_SECRET")
    if secret and request.headers.get("Authorization") != f"Bearer {secret}":
        return jsonify(error="unauthorized"), 401
    return jsonify(purged=0, note="no server-side files")
