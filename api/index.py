import os
from datetime import datetime, timezone

from flask import Flask, jsonify, request, Response

app = Flask(__name__)

INDEX_HTML = r"""<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>CutIt — Potong Audio & Video</title>
<link rel="stylesheet" href="/static/style.css">
</head>
<body>
<main class="wrap">
  <header>
    <h1>✂️ CutIt</h1>
    <p class="sub">Potong audio &amp; video langsung di browser. File tidak diunggah ke server.</p>
  </header>

  <section id="drop" class="drop">
    <input type="file" id="file" accept="audio/*,video/*" hidden>
    <p><strong>Klik atau seret file</strong> audio / video ke sini</p>
    <small>MP4, MOV, WEBM, MKV, MP3, WAV, M4A, AAC, OGG — disarankan &lt; 500 MB</small>
  </section>

  <section id="editor" class="hidden">
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
          <input type="number" id="nStart" min="0" step="0.01" value="0">
          <button type="button" id="setStart" title="Pakai posisi player">📍</button>
        </div>
      </label>
      <label>Selesai (detik)
        <div class="row">
          <input type="number" id="nEnd" min="0" step="0.01" value="0">
          <button type="button" id="setEnd" title="Pakai posisi player">📍</button>
        </div>
      </label>
    </div>
    <div class="info" id="info"></div>

    <label class="mode">Mode
      <select id="mode">
        <option value="fast">Cepat (tanpa re-encode, kualitas asli, potongan bisa geser ±beberapa detik di video)</option>
        <option value="precise">Presisi (re-encode, tepat di detik, lebih lambat)</option>
      </select>
    </label>

    <div class="actions">
      <button type="button" id="preview" class="ghost">▶ Putar bagian terpilih</button>
      <button type="button" id="cut" class="primary">✂️ Potong &amp; Unduh</button>
    </div>

    <div class="progress hidden" id="progWrap"><div id="prog"></div></div>
    <div class="status" id="status"></div>
    <div id="result" class="result"></div>
  </section>
</main>

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


@app.get("/api/cron/purge")
def cron_purge():
    # Pemrosesan dilakukan di browser, jadi tidak ada file di server yang perlu dihapus.
    # Endpoint ini disediakan agar cron di vercel.json tetap valid;
    # tambahkan logika purge di sini jika nanti ada penyimpanan (Blob/S3/dll).
    secret = os.environ.get("CRON_SECRET")
    if secret and request.headers.get("Authorization") != f"Bearer {secret}":
        return jsonify(error="unauthorized"), 401
    return jsonify(purged=0, note="no server-side files")
