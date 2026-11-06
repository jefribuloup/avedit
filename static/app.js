(() => {
  const $ = (id) => document.getElementById(id);
  const nS = $('nStart'), nE = $('nEnd'), wave = $('wave'), zoomR = $('zoom'), pan = $('pan');
  let file = null, media = null, dur = 0, ff = window.__avFF || null, objUrl = null, stopAt = null;
  let cancelled = false, resultBlob = null, resultName = '';
  let selS = 0, selE = 0, vStart = 0, vEnd = 0, drag = null, raf = 0;
  let mono = null, peaks = null, wsr = 8000, waveMsg = '', waveId = 0, waveBusy = null;
  const SIG = window.AVRouter ? window.AVRouter.signal : undefined; // listener global batal otomatis saat pindah halaman
  let busyFF = 0;

  const BUCKET = 80, TARGET_SR = 8000, MINSPAN = 0.5;
  /* Batas ukuran file (MB) — ubah di sini. Di atas warnMB: mode "file besar" (proses di background).
     Di atas hugeMB: Mode Cepat otomatis. Di atas max: ditolak. */
  const SIZE = { warnMB: 200, hugeMB: 1024, maxMB: 2048, maxMobileMB: 500 };
  const isMobile = () => !!(navigator.userAgentData && navigator.userAgentData.mobile) ||
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && Math.min(screen.width, screen.height) < 820);
  const fmtLimit = (m) => (m >= 1024 ? (m / 1024) + ' GB' : m + ' MB');
  const NATIVE = /\.(mp4|m4v|mov|webm|mp3|wav|m4a|aac|ogg|oga|opus|flac)$/i;
  const STEPS = [0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600];

  const tr = (k, p) => window.I18N.t(k, p);
  const fmt = (s) => `${Math.floor(s / 60)}:${(s % 60).toFixed(2).padStart(5, '0')}`;
  const mb = (n) => (n / 1048576).toFixed(1) + ' MB';
  const status = (t, err = false) => { const el = $('status'); el.textContent = t; el.classList.toggle('err', err); };
  const startStatus = (t, err = false) => { const el = $('startStatus'); el.textContent = t; el.classList.toggle('err', err); };

  /* ---------- TABS ---------- */
  document.querySelectorAll('.tab').forEach((t) => {
    t.onclick = () => {
      document.querySelectorAll('.tab').forEach((x) => x.classList.toggle('active', x === t));
      $('paneLocal').classList.toggle('hidden', t.dataset.tab !== 'local');
      $('paneLink').classList.toggle('hidden', t.dataset.tab !== 'link');
      startStatus('');
    };
  });

  /* ---------- UPLOAD LOKAL ---------- */
  const drop = $('drop'), fileIn = $('file');
  drop.onclick = () => fileIn.click();
  fileIn.onchange = () => fileIn.files[0] && load(fileIn.files[0]);
  ['dragover', 'dragenter'].forEach((e) => drop.addEventListener(e, (ev) => { ev.preventDefault(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach((e) => drop.addEventListener(e, (ev) => { ev.preventDefault(); drop.classList.remove('over'); }));
  drop.addEventListener('drop', (ev) => { const f = ev.dataTransfer.files[0]; f && load(f); });

  /* ---------- UPLOAD DARI LINK ---------- */
  const EXT = { 'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov', 'video/x-matroska': 'mkv',
    'audio/mpeg': 'mp3', 'audio/mp3': 'mp3', 'audio/wav': 'wav', 'audio/x-wav': 'wav', 'audio/mp4': 'm4a',
    'audio/aac': 'aac', 'audio/ogg': 'ogg', 'audio/webm': 'webm' };

  async function readWithProgress(res) {
    const total = +res.headers.get('Content-Length') || 0;
    if (!res.body) return res.blob();
    const reader = res.body.getReader(), chunks = [];
    let got = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value); got += value.length;
      startStatus(`${tr('s.downloading')} ${mb(got)}${total ? ' / ' + mb(total) : ''}`);
    }
    return new Blob(chunks, { type: res.headers.get('Content-Type') || '' });
  }

  async function fromUrl(url) {
    let res;
    try {
      startStatus(tr('s.connecting'));
      res = await fetch(url);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      if (res.url && !/^https:\/\//i.test(res.url)) throw new Error(tr('e.httpsRedirect'));
    } catch (e) {
      startStatus(tr('s.viaServer'));
      res = await fetch('/api/fetch?url=' + encodeURIComponent(url));
      if (!res.ok) {
        let msg = tr('e.fetch');
        try {
          const j = await res.json();
          msg = { invalid_url: tr('e.invalid'), too_large: tr('e.tooLarge') }[j.code] || msg;
        } catch (_) {}
        throw new Error(msg + tr('e.fallback'));
      }
    }
    const blob = await readWithProgress(res);
    const type = (blob.type || '').split(';')[0];
    let name = decodeURIComponent((new URL(url).pathname.split('/').pop() || '').trim());
    const hasExt = /\.(mp4|mov|mkv|webm|avi|mp3|wav|m4a|aac|ogg|flac)$/i.test(name);
    if (!hasExt) {
      const ext = EXT[type];
      if (!ext) throw new Error(tr('e.notMedia'));
      name = (name || 'media') + '.' + ext;
    }
    return new File([blob], name, { type: type || '' });
  }

  $('urlGo').onclick = async () => {
    const url = $('urlIn').value.trim();
    let u; try { u = new URL(url); } catch (_) { u = null; }
    if (!u || u.protocol !== 'https:' || !u.hostname) return startStatus(tr('e.https'), true);
    $('urlGo').disabled = true;
    try { load(await fromUrl(url)); startStatus(''); }
    catch (e) { startStatus(e.message || String(e), true); }
    finally { $('urlGo').disabled = false; }
  };
  $('urlIn').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('urlGo').click(); });

  /* ---------- LOAD KE EDITOR ---------- */
  function tick() {
    if (!media) return;
    const t = media.currentTime, span = vEnd - vStart;
    if (stopAt !== null && t >= stopAt) { media.pause(); stopAt = null; }
    if (!drag && !media.paused && span < dur - 0.01 && (t > vEnd || t < vStart)) setView(t - span * 0.05, t - span * 0.05 + span);
    else draw();
    if (!media.paused) raf = requestAnimationFrame(tick);
  }

  function load(f) {
    const limit = isMobile() ? SIZE.maxMobileMB : SIZE.maxMB;
    if (f.size > limit * 1048576) {
      startStatus(tr(isMobile() ? 'sz.rejectMobile' : 'sz.reject', { size: mb(f.size), max: fmtLimit(limit) }), true);
      fileIn.value = ''; return;
    }
    file = f;
    waveId++; mono = null; peaks = null; waveMsg = '';
    if (objUrl) URL.revokeObjectURL(objUrl);
    objUrl = URL.createObjectURL(f);
    const isVideo = f.type.startsWith('video') || /\.(mp4|mov|mkv|webm|avi)$/i.test(f.name);
    $('playerBox').innerHTML = '';
    media = document.createElement(isVideo ? 'video' : 'audio');
    media.controls = true; media.preload = 'metadata'; media.playsInline = true; media.src = objUrl;
    $('playerBox').appendChild(media);
    $('fname').textContent = `${f.name} — ${mb(f.size)}`;
    $('result').innerHTML = ''; status(''); $('progWrap').classList.add('hidden');
    if (f.size >= SIZE.hugeMB * 1048576) { $('mode').value = 'fast'; status(tr('sz.huge')); }
    else if (f.size > SIZE.warnMB * 1048576) status(tr('sz.large'));
    media.onloadedmetadata = () => {
      dur = isFinite(media.duration) ? media.duration : 0;
      if (!dur) { startStatus(tr('e.noDur'), true); return; }
      $('startCard').classList.add('hidden'); $('editor').classList.remove('hidden');
      setRange(0, dur); setView(0, dur);
      $('editor').scrollIntoView({ behavior: 'smooth', block: 'start' });
      waveBusy = buildWave(f);
    };
    media.onerror = () => {
      startStatus(tr('e.noPlay'), true);
      status(tr('e.noPlay'), true);
    };
    media.onplay = () => { cancelAnimationFrame(raf); tick(); };
    media.onpause = media.onended = media.onseeked = media.ontimeupdate = () => { if (media.paused) draw(); };
  }

  /* ---------- RENTANG PILIHAN ---------- */
  function setRange(s, e) {
    s = Math.max(0, Math.min(s, dur)); e = Math.max(0, Math.min(e, dur));
    if (s > e) [s, e] = [e, s];
    selS = s; selE = e;
    if (document.activeElement !== nS) nS.value = s.toFixed(2);
    if (document.activeElement !== nE) nE.value = e.toFixed(2);
    $('info').textContent = tr('info', { len: fmt(e - s), s: fmt(s), e: fmt(e) });
    draw();
  }
  nS.oninput = () => setRange(Math.min(+nS.value || 0, selE), selE);
  nE.oninput = () => setRange(selS, Math.max(+nE.value || 0, selS));
  nS.onchange = nE.onchange = () => { nS.value = selS.toFixed(2); nE.value = selE.toFixed(2); };
  $('setStart').onclick = () => setRange(Math.min(media.currentTime, selE), selE);
  $('setEnd').onclick = () => setRange(selS, Math.max(media.currentTime, selS));
  $('preview').onclick = () => { media.currentTime = selS; stopAt = selE; media.play(); };
  $('resetRange').onclick = () => { setRange(0, dur); setView(0, dur); $('result').innerHTML = ''; status(tr('st.reset')); };

  /* ---------- VIEW / ZOOM ---------- */
  const xOf = (t) => ((t - vStart) / (vEnd - vStart)) * wave.clientWidth;
  const tOf = (x) => vStart + (x / wave.clientWidth) * (vEnd - vStart);

  function setView(vs, ve) {
    if (!dur) return;
    const minSpan = Math.min(dur, MINSPAN);
    const span = Math.max(minSpan, Math.min(dur, ve - vs));
    vs = Math.max(0, Math.min(vs, dur - span));
    vStart = vs; vEnd = vs + span;
    if (dur <= minSpan + 1e-6) {
      zoomR.disabled = true; pan.disabled = true; zoomR.value = 0; pan.max = 0; pan.value = 0;
    } else {
      zoomR.disabled = false;
      if (document.activeElement !== zoomR) zoomR.value = Math.round((Math.log(span / dur) / Math.log(minSpan / dur)) * 100);
      pan.max = Math.max(0, dur - span).toFixed(3);
      if (document.activeElement !== pan) pan.value = vStart;
      pan.disabled = dur - span < 0.01;
    }
    draw();
  }
  const zoomBy = (f, ct) => {
    const span = vEnd - vStart, ns = span * f;
    if (ct === undefined) ct = (vStart + vEnd) / 2;
    const ratio = (ct - vStart) / span;
    setView(ct - ratio * ns, ct - ratio * ns + ns);
  };
  zoomR.oninput = () => {
    const minSpan = Math.min(dur, MINSPAN);
    const span = dur * Math.pow(minSpan / dur, +zoomR.value / 100), c = (vStart + vEnd) / 2;
    setView(c - span / 2, c + span / 2);
  };
  pan.oninput = () => { const span = vEnd - vStart; setView(+pan.value, +pan.value + span); };
  $('zIn').onclick = () => zoomBy(0.5);
  $('zOut').onclick = () => zoomBy(2);
  $('zAll').onclick = () => setView(0, dur);
  $('zSel').onclick = () => { const len = Math.max(selE - selS, 0.1), pad = len * 0.1; setView(selS - pad, selE + pad); };

  wave.addEventListener('wheel', (e) => {
    if (!dur) return;
    const rect = wave.getBoundingClientRect(), span = vEnd - vStart;
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault(); zoomBy(e.deltaY < 0 ? 0.8 : 1.25, tOf(e.clientX - rect.left));
    } else if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      e.preventDefault();
      const dx = e.deltaX || e.deltaY, d = (dx / rect.width) * span;
      setView(vStart + d, vEnd + d);
    }
  }, { passive: false });

  /* ---------- INTERAKSI KANVAS (seret penanda / klik untuk seek) ---------- */
  const TOL = 16;
  function hit(x) {
    const xs = xOf(selS), xe = xOf(selE);
    const dS = Math.abs(x - xs), dE = Math.abs(x - xe);
    if (dS <= TOL && dE <= TOL) return x <= (xs + xe) / 2 ? 'start' : 'end';
    if (dS <= TOL) return 'start';
    if (dE <= TOL) return 'end';
    return null;
  }
  function dragTo(x) {
    const t = Math.max(0, Math.min(dur, tOf(x)));
    if (drag === 'start') setRange(Math.min(t, selE), selE);
    else if (drag === 'end') setRange(selS, Math.max(t, selS));
    else if (drag === 'seek' && media) { media.currentTime = t; draw(); }
  }
  wave.addEventListener('pointerdown', (e) => {
    if (!dur) return;
    const x = e.clientX - wave.getBoundingClientRect().left;
    drag = hit(x) || 'seek';
    wave.setPointerCapture(e.pointerId);
    dragTo(x);
  });
  wave.addEventListener('pointermove', (e) => {
    const x = e.clientX - wave.getBoundingClientRect().left;
    if (drag) {
      dragTo(x);
      const W = wave.clientWidth, span = vEnd - vStart;
      if (drag !== 'seek' && span < dur) {
        if (x < 20) setView(vStart - span * 0.02, vEnd - span * 0.02);
        else if (x > W - 20) setView(vStart + span * 0.02, vEnd + span * 0.02);
      }
    } else if (dur) wave.style.cursor = hit(x) ? 'ew-resize' : 'pointer';
  });
  const endDrag = () => { drag = null; };
  wave.addEventListener('pointerup', endDrag);
  wave.addEventListener('pointercancel', endDrag);

  /* ---------- GAMBAR WAVEFORM ---------- */
  function draw() {
    const W = wave.clientWidth, H = wave.clientHeight;
    if (!W || !H) return;
    const dpr = window.devicePixelRatio || 1;
    if (wave.width !== Math.round(W * dpr) || wave.height !== Math.round(H * dpr)) {
      wave.width = Math.round(W * dpr); wave.height = Math.round(H * dpr);
    }
    const g = wave.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    if (!dur || vEnd <= vStart) return;
    const RULER = 20, mid = RULER + (H - RULER) / 2, amp = (H - RULER) / 2 - 4, span = vEnd - vStart;

    // ruler
    const pps = W / span;
    const step = STEPS.find((s) => s * pps >= 80) || 3600;
    g.font = '11px system-ui,sans-serif'; g.textBaseline = 'top';
    g.fillStyle = 'rgba(154,140,184,.9)';
    for (let i = Math.ceil(vStart / step); i * step <= vEnd; i++) {
      const t = i * step, x = Math.round(xOf(t));
      g.fillRect(x, 0, 1, 6);
      const m = Math.floor(t / 60), s = t % 60;
      g.fillText(step < 1 ? `${m}:${s.toFixed(2).padStart(5, '0')}` : `${m}:${String(Math.floor(s)).padStart(2, '0')}`, x + 3, 5);
    }
    g.fillStyle = 'rgba(139,92,246,.18)'; g.fillRect(0, mid, W, 1);

    // waveform
    if (peaks && mono) {
      const n = mono.length, gain = peaks.gain, nb = peaks.min.length;
      for (let x = 0; x < W; x++) {
        const t0 = vStart + (x / W) * span, t1 = vStart + ((x + 1) / W) * span;
        const s0 = Math.floor(t0 * wsr);
        if (s0 >= n) break;
        const s1 = Math.max(s0 + 1, Math.ceil(t1 * wsr));
        let mn = 1, mx = -1;
        if (s1 - s0 > BUCKET * 2) {
          const b0 = Math.floor(s0 / BUCKET), b1 = Math.min(nb, Math.ceil(s1 / BUCKET));
          for (let b = b0; b < b1; b++) { if (peaks.min[b] < mn) mn = peaks.min[b]; if (peaks.max[b] > mx) mx = peaks.max[b]; }
        } else {
          const e = Math.min(s1, n);
          for (let i = s0; i < e; i++) { const v = mono[i]; if (v < mn) mn = v; if (v > mx) mx = v; }
        }
        if (mx < mn) continue;
        const inSel = t1 >= selS && t0 <= selE;
        g.fillStyle = inSel ? '#c084fc' : 'rgba(154,140,184,.45)';
        const y1 = mid - Math.min(1, mx * gain) * amp, y2 = mid - Math.max(-1, mn * gain) * amp;
        g.fillRect(x, y1, 1, Math.max(1, y2 - y1));
      }
    } else if (waveMsg) {
      g.fillStyle = 'rgba(154,140,184,.9)'; g.font = '13px system-ui,sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(waveMsg, W / 2, mid - 14); g.textAlign = 'start';
    }

    // area di luar pilihan diredupkan
    const xs = xOf(selS), xe = xOf(selE);
    g.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--dim').trim() || 'rgba(7,4,13,.55)';
    if (xs > 0) g.fillRect(0, RULER, Math.min(W, xs), H - RULER);
    if (xe < W) g.fillRect(Math.max(0, xe), RULER, W - Math.max(0, xe), H - RULER);

    // penanda awal/akhir
    const handle = (x, color) => {
      if (x < -2 || x > W + 2) return;
      g.fillStyle = color; g.fillRect(x - 1, RULER, 2, H - RULER);
      const gy = mid - 15; g.fillRect(x - 6, gy, 12, 30);
      g.fillStyle = '#1b1130'; g.fillRect(x - 2, gy + 8, 1, 14); g.fillRect(x + 1, gy + 8, 1, 14);
    };
    handle(xs, '#ffffff'); handle(xe, '#a78bfa');

    // playhead
    if (media) {
      const t = media.currentTime;
      if (t >= vStart && t <= vEnd) {
        const x = xOf(t);
        g.fillStyle = '#f472b6'; g.fillRect(x - 1, RULER, 2, H - RULER);
        g.beginPath(); g.moveTo(x - 5, RULER); g.lineTo(x + 5, RULER); g.lineTo(x, RULER + 7); g.closePath(); g.fill();
      }
    }
  }
  window.addEventListener('resize', draw, { signal: SIG });
  if (window.ResizeObserver) {
    const ro = new ResizeObserver(draw); ro.observe(wave);
    window.addEventListener('avedit:pageleave', () => ro.disconnect(), { once: true });
  }

  /* ---------- ANALISIS AUDIO -> WAVEFORM ---------- */
  /* Worker (thread terpisah) untuk menghitung puncak waveform file besar agar UI tidak membeku. */
  function peakWorker() {
    self.onmessage = (e) => {
      const buf = e.data.buf, B = e.data.bucket, dv = new DataView(buf);
      let o = 12, sr = 8000, ds = 0, dl = 0;
      while (o + 8 <= dv.byteLength) {
        const id = String.fromCharCode(dv.getUint8(o), dv.getUint8(o + 1), dv.getUint8(o + 2), dv.getUint8(o + 3));
        const sz = dv.getUint32(o + 4, true);
        if (id === 'fmt ') sr = dv.getUint32(o + 12, true);
        if (id === 'data') { ds = o + 8; dl = Math.min(sz, dv.byteLength - ds); break; }
        o += 8 + sz + (sz & 1);
      }
      const n = dl >> 1, m = new Float32Array(n);
      for (let i = 0; i < n; i++) m[i] = dv.getInt16(ds + i * 2, true) / 32768;
      const nb = Math.ceil(n / B), pmin = new Float32Array(nb), pmax = new Float32Array(nb);
      let top = 0;
      for (let b = 0; b < nb; b++) {
        let mn = 1, mx = -1; const end = Math.min(n, (b + 1) * B);
        for (let i = b * B; i < end; i++) { const v = m[i]; if (v < mn) mn = v; if (v > mx) mx = v; }
        pmin[b] = mn; pmax[b] = mx;
        const a = Math.max(Math.abs(mn), Math.abs(mx)); if (a > top) top = a;
      }
      self.postMessage({ m, pmin, pmax, sr, gain: top > 0.001 ? Math.min(0.95 / top, 30) : 1 }, [m.buffer, pmin.buffer, pmax.buffer]);
    };
  }
  function analyzeInWorker(bytes) {
    return new Promise((res, rej) => {
      const url = URL.createObjectURL(new Blob(['(' + peakWorker.toString() + ')()'], { type: 'text/javascript' }));
      const w = new Worker(url);
      const end = () => { w.terminate(); URL.revokeObjectURL(url); };
      w.onmessage = (e) => { end(); res(e.data); };
      w.onerror = (e) => { end(); rej(e.error || new Error('worker')); };
      const whole = bytes.byteOffset === 0 && bytes.byteLength === bytes.buffer.byteLength;
      const buf = whole ? bytes.buffer : bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
      w.postMessage({ buf, bucket: BUCKET }, [buf]);
    });
  }

  async function decodeViaFFmpeg(f, ctx, raw, sr) {
    const inst = await getFF();
    busyFF++;
    try { return await decodeWith(inst, f, ctx, raw, sr); } finally { busyFF--; }
  }
  /* Baca file lewat WORKERFS (dibaca bertahap dari disk, tidak dimuat penuh ke RAM) -> aman untuk file >1 GB.
     Jika mount gagal, fallback ke writeFile (hanya untuk file kecil). */
  async function mountInput(inst, f, base) {
    const dir = '/' + base + '_src';
    try {
      await inst.unmount(dir).catch(() => {});          // bersihkan sisa mount sebelumnya
      await inst.createDir(dir).catch(() => {});        // abaikan jika folder sudah ada
      const ok = await inst.mount('WORKERFS', { files: [f] }, dir);
      if (!ok) throw new Error('WORKERFS tidak tersedia');
      return { path: dir + '/' + f.name, done: async () => { await inst.unmount(dir).catch(() => {}); await inst.deleteDir(dir).catch(() => {}); } };
    } catch (e) {
      await inst.deleteDir(dir).catch(() => {});
      if (f.size > 400 * 1048576) throw new Error('mount gagal: ' + ((e && e.message) || e)); // file besar tidak boleh dimuat penuh ke RAM
      const name = base + '_in.' + ((f.name.split('.').pop() || 'bin').toLowerCase());
      await inst.writeFile(name, new Uint8Array(await f.arrayBuffer()));
      return { path: name, done: async () => { await inst.deleteFile(name).catch(() => {}); } };
    }
  }

  async function decodeWith(inst, f, ctx, raw, sr) {
    const src = await mountInput(inst, f, 'wave');
    let code;
    try { code = await inst.exec(['-i', src.path, '-vn', '-sn', '-dn', '-ac', '1', '-ar', String(sr || TARGET_SR), '-c:a', 'pcm_s16le', 'wave.wav']); }
    finally { await src.done(); }
    if (code !== 0) throw new Error(tr('e.noAudio'));
    const data = await inst.readFile('wave.wav');
    await inst.deleteFile('wave.wav').catch(() => {});
    if (raw) return data;
    return ctx.decodeAudioData(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength));
  }

  async function buildWave(f) {
    const id = ++waveId;
    peaks = null; mono = null;
    const big = f.size > SIZE.warnMB * 1048576;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) { waveMsg = tr('w.unsupported'); draw(); return; }
    waveMsg = tr(big ? 'w.analyzingBig' : 'w.analyzing'); draw();
    let ctx;
    try {
      ctx = new Ctx({ sampleRate: TARGET_SR });
      if (big) { /* file besar: ffmpeg (worker) -> WAV -> hitung puncak di worker lain; main thread tetap bebas */
        const d0 = media && isFinite(media.duration) ? media.duration : 0;   // batasi total sampel (~40 juta) agar hemat memori
        const sr = d0 ? Math.max(1000, Math.min(TARGET_SR, Math.floor(40e6 / d0))) : TARGET_SR;
        const bytes = await decodeViaFFmpeg(f, ctx, true, sr);
        if (id !== waveId) return;
        const r = await analyzeInWorker(bytes);
        if (id !== waveId) return;
        wsr = r.sr; mono = r.m; peaks = { min: r.pmin, max: r.pmax, gain: r.gain }; waveMsg = '';
        return;
      }
      let buf;
      try { buf = await ctx.decodeAudioData(await f.arrayBuffer()); }
      catch (e) {
        if (NATIVE.test(f.name)) throw e;
        waveMsg = tr('w.analyzingFF'); draw();
        buf = await decodeViaFFmpeg(f, ctx);
      }
      if (id !== waveId) return;
      const n = buf.length, chn = buf.numberOfChannels, m = new Float32Array(n);
      m.set(buf.getChannelData(0));
      for (let c = 1; c < chn; c++) { const d = buf.getChannelData(c); for (let i = 0; i < n; i++) m[i] += d[i]; }
      if (chn > 1) for (let i = 0; i < n; i++) m[i] /= chn;
      const nb = Math.ceil(n / BUCKET), pmin = new Float32Array(nb), pmax = new Float32Array(nb);
      let top = 0;
      for (let b = 0; b < nb; b++) {
        let mn = 1, mx = -1; const e = Math.min(n, (b + 1) * BUCKET);
        for (let i = b * BUCKET; i < e; i++) { const v = m[i]; if (v < mn) mn = v; if (v > mx) mx = v; }
        pmin[b] = mn; pmax[b] = mx;
        const a = Math.max(Math.abs(mn), Math.abs(mx)); if (a > top) top = a;
      }
      wsr = buf.sampleRate; mono = m;
      peaks = { min: pmin, max: pmax, gain: top > 0.001 ? Math.min(0.95 / top, 30) : 1 };
      waveMsg = '';
    } catch (e) {
      console.error('[AVEdit] waveform gagal:', e);
      if (id === waveId) waveMsg = tr('w.naWhy', { why: String((e && e.message) || e).replace(/\s+/g, ' ').slice(0, 140) });
    } finally {
      if (ctx && ctx.close) ctx.close().catch(() => {});
      if (id === waveId) draw();
    }
  }

  /* ---------- RESET / GANTI FILE ---------- */
  function resetAll() {
    waveId++; cancelAnimationFrame(raf);
    if (ff) { try { ff.terminate(); } catch (_) {} ff = null; window.__avFF = null; }
    if (media) media.pause();
    if (objUrl) { URL.revokeObjectURL(objUrl); objUrl = null; }
    file = null; media = null; dur = 0; resultBlob = null; stopAt = null; mono = null; peaks = null; waveMsg = ''; waveBusy = null;
    $('playerBox').innerHTML = ''; $('result').innerHTML = ''; status(''); startStatus('');
    $('progWrap').classList.add('hidden'); $('prog').style.width = '0';
    $('cut').disabled = false; $('cut').classList.remove('hidden'); $('cancel').classList.add('hidden');
    fileIn.value = ''; $('urlIn').value = '';
    $('editor').classList.add('hidden'); $('startCard').classList.remove('hidden');
  }
  $('changeFile').onclick = resetAll;
  $('mode').addEventListener('change', () => {
    if (file && file.size > SIZE.warnMB * 1048576 && $('mode').value === 'precise') status(tr('sz.precise'));
  }, { signal: SIG });
  document.addEventListener('langchange', () => { if (dur) setRange(selS, selE); }, { signal: SIG });
  document.addEventListener('themechange', () => { if (dur) draw(); }, { signal: SIG });

  /* ---------- FFMPEG ---------- */
  async function getFF() {
    if (ff) return ff;
    status(tr('st.loadEngine'));
    const inst = new FFmpegWASM.FFmpeg();
    inst.on('progress', ({ progress }) => { $('prog').style.width = Math.max(0, Math.min(100, progress * 100)) + '%'; });
    const base = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd/';
    const blobURL = async (url, type) => {
      const r = await fetch(url);
      if (!r.ok) throw new Error(tr('e.loadFail') + ' ' + url);
      return URL.createObjectURL(new Blob([await r.arrayBuffer()], { type }));
    };
    await inst.load({
      coreURL: await blobURL(base + 'ffmpeg-core.js', 'text/javascript'),
      wasmURL: await blobURL(base + 'ffmpeg-core.wasm', 'application/wasm'),
    });
    ff = window.__avFF = inst; // mesin dipakai ulang saat kembali ke halaman editor
    return ff;
  }

  $('cancel').onclick = () => {
    cancelled = true;
    if (ff) { try { ff.terminate(); } catch (_) {} ff = null; window.__avFF = null; }
    status(tr('st.cancelled'));
  };

  /* ---------- POTONG ---------- */
  $('cut').onclick = async () => {
    const s = selS, e = selE, d = e - s;
    if (d <= 0) return status(tr('st.badRange'), true);
    cancelled = false; let counted = false;
    $('cut').classList.add('hidden'); $('cancel').classList.remove('hidden');
    $('result').innerHTML = ''; $('prog').style.width = '0'; $('progWrap').classList.remove('hidden');
    try {
      if (waveBusy) { status(tr('st.waitWave')); await waveBusy.catch(() => {}); }
      if (cancelled) return;
      const f = await getFF(); busyFF++; counted = true;
      const isVideo = media.tagName === 'VIDEO';
      const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
      let src, inName;
      const precise = $('mode').value === 'precise';
      let outExt = ext, args;
      status(tr('st.reading'));
      src = await mountInput(f, file, 'cut'); inName = src.path;
      if (!precise) {
        args = ['-ss', String(s), '-i', inName, '-t', String(d), '-c', 'copy', '-avoid_negative_ts', 'make_zero'];
      } else if (isVideo) {
        outExt = 'mp4';
        args = ['-ss', String(s), '-i', inName, '-t', String(d), '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '23', '-c:a', 'aac', '-movflags', '+faststart'];
      } else {
        outExt = 'mp3';
        args = ['-ss', String(s), '-i', inName, '-t', String(d), '-vn', '-c:a', 'libmp3lame', '-q:a', '2'];
      }
      const outName = 'output.' + outExt;
      status(tr('st.cutting'));
      let code;
      try { code = await f.exec([...args, outName]); } finally { if (src) await src.done(); }
      if (cancelled) return;
      if (code !== 0) throw new Error(tr('e.ffFail', { code }));
      const data = await f.readFile(outName);
      await f.deleteFile(outName).catch(() => {});
      const mime = (isVideo ? 'video/' : 'audio/') + (outExt === 'mp3' ? 'mpeg' : outExt);
      resultBlob = new Blob([data], { type: mime });
      resultName = `${file.name.replace(/\.[^.]+$/, '')}_cut.${outExt}`;
      const url = URL.createObjectURL(resultBlob);
      const pv = document.createElement(isVideo ? 'video' : 'audio'); pv.controls = true; pv.playsInline = true; pv.src = url;
      const acts = document.createElement('div'); acts.className = 'acts';
      const a = document.createElement('a'); a.className = 'dl'; a.href = url; a.download = resultName;
      a.innerHTML = window.ICON('download'); a.append(Object.assign(document.createElement('span'), { textContent: tr('r.dl', { name: resultName, size: mb(resultBlob.size) }) }));
      const again = document.createElement('button'); again.type = 'button'; again.innerHTML = window.ICON('pencil'); again.append(Object.assign(document.createElement('span'), { textContent: tr('r.edit') }));
      again.onclick = () => load(new File([resultBlob], resultName, { type: mime }));
      acts.append(a, again);
      $('result').append(pv, acts);
      $('prog').style.width = '100%'; status(tr('st.done'));
    } catch (err) {
      if (cancelled) status(tr('st.cancelled'));
      else { console.error(err); status(tr('st.error') + (err.message || err), true); }
    } finally {
      if (counted) busyFF--;
      $('cut').classList.remove('hidden'); $('cancel').classList.add('hidden');
      if (cancelled) $('progWrap').classList.add('hidden');
    }
  };
  /* ---------- BERSIH-BERSIH SAAT PINDAH HALAMAN (router tanpa reload) ---------- */
  window.addEventListener('avedit:pageleave', () => {
    waveId++; cancelAnimationFrame(raf);
    if (media) { try { media.pause(); } catch (_) {} }
    if (objUrl) { URL.revokeObjectURL(objUrl); objUrl = null; }
    if (busyFF > 0 && ff) { try { ff.terminate(); } catch (_) {} ff = null; window.__avFF = null; }
  }, { once: true });
})();
