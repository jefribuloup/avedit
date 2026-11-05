(() => {
  const $ = (id) => document.getElementById(id);
  const rS = $('rStart'), rE = $('rEnd'), nS = $('nStart'), nE = $('nEnd'), sel = $('sel');
  let file = null, media = null, dur = 0, ff = null, objUrl = null, stopAt = null;
  let cancelled = false, resultBlob = null, resultName = '';

  const fmt = (s) => `${Math.floor(s / 60)}:${(s % 60).toFixed(2).padStart(5, '0')}`;
  const mb = (n) => (n / 1048576).toFixed(1) + ' MB';
  const status = (t, err = false) => { const el = $('status'); el.textContent = t; el.classList.toggle('err', err); };
  const startStatus = (t, err = false) => { const el = $('startStatus'); el.textContent = t; el.classList.toggle('err', err); };

  /* ---------- NAVBAR ---------- */
  $('burger').onclick = () => {
    const open = $('links').classList.toggle('open');
    $('burger').setAttribute('aria-expanded', open);
  };
  $('links').addEventListener('click', (e) => { if (e.target.closest('a,button')) $('links').classList.remove('open'); });
  $('navNew').onclick = () => { resetAll(); window.scrollTo({ top: 0, behavior: 'smooth' }); };

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
      startStatus(`Mengunduh… ${mb(got)}${total ? ' / ' + mb(total) : ''}`);
    }
    return new Blob(chunks, { type: res.headers.get('Content-Type') || '' });
  }

  async function fromUrl(url) {
    let res;
    try {
      startStatus('Menghubungi link…');
      res = await fetch(url);
      if (!res.ok) throw new Error('HTTP ' + res.status);
    } catch (e) {
      // kemungkinan CORS → coba lewat proxy server
      startStatus('Link tidak bisa diakses langsung, mencoba lewat server…');
      res = await fetch('/api/fetch?url=' + encodeURIComponent(url));
      if (!res.ok) {
        let msg = 'Gagal mengambil link.';
        try { msg = (await res.json()).error || msg; } catch (_) {}
        throw new Error(msg + ' Unduh file lalu unggah lewat tab File Lokal.');
      }
    }
    const blob = await readWithProgress(res);
    const type = (blob.type || '').split(';')[0];
    let name = decodeURIComponent((new URL(url).pathname.split('/').pop() || '').trim());
    const hasExt = /\.(mp4|mov|mkv|webm|avi|mp3|wav|m4a|aac|ogg|flac)$/i.test(name);
    if (!hasExt) {
      const ext = EXT[type];
      if (!ext) throw new Error('Link bukan file audio/video langsung.');
      name = (name || 'media') + '.' + ext;
    }
    return new File([blob], name, { type: type || '' });
  }

  $('urlGo').onclick = async () => {
    const url = $('urlIn').value.trim();
    if (!/^https?:\/\//i.test(url)) return startStatus('Masukkan link yang diawali http:// atau https://', true);
    $('urlGo').disabled = true;
    try { load(await fromUrl(url)); startStatus(''); }
    catch (e) { startStatus(e.message || String(e), true); }
    finally { $('urlGo').disabled = false; }
  };
  $('urlIn').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('urlGo').click(); });

  /* ---------- LOAD KE EDITOR ---------- */
  function load(f) {
    file = f;
    if (objUrl) URL.revokeObjectURL(objUrl);
    objUrl = URL.createObjectURL(f);
    const isVideo = f.type.startsWith('video') || /\.(mp4|mov|mkv|webm|avi)$/i.test(f.name);
    $('playerBox').innerHTML = '';
    media = document.createElement(isVideo ? 'video' : 'audio');
    media.controls = true; media.preload = 'metadata'; media.playsInline = true; media.src = objUrl;
    $('playerBox').appendChild(media);
    $('fname').textContent = `${f.name} — ${mb(f.size)}`;
    $('result').innerHTML = ''; status(''); $('progWrap').classList.add('hidden');
    media.onloadedmetadata = () => {
      dur = media.duration || 0;
      [rS, rE].forEach((r) => (r.max = dur));
      setRange(0, dur);
      $('startCard').classList.add('hidden'); $('editor').classList.remove('hidden');
      $('editor').scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    media.onerror = () => {
      startStatus('Browser tidak bisa memutar file ini (format/codec tidak didukung).', true);
      status('Browser tidak bisa memutar file ini (format/codec tidak didukung).', true);
    };
    media.ontimeupdate = () => { if (stopAt !== null && media.currentTime >= stopAt) { media.pause(); stopAt = null; } };
  }

  /* ---------- RENTANG ---------- */
  function setRange(s, e) {
    s = Math.max(0, Math.min(s, dur)); e = Math.max(0, Math.min(e, dur));
    if (s > e) [s, e] = [e, s];
    rS.value = nS.value = s.toFixed(2); rE.value = nE.value = e.toFixed(2);
    const p = (v) => (dur ? (v / dur) * 100 : 0);
    sel.style.left = p(s) + '%'; sel.style.width = (p(e) - p(s)) + '%';
    rE.style.zIndex = 4; rS.style.zIndex = s >= dur / 2 ? 5 : 3;
    $('info').textContent = `Durasi potongan: ${fmt(e - s)}  (${fmt(s)} → ${fmt(e)})`;
  }
  const clampS = (v) => Math.min(+v, +rE.value);
  const clampE = (v) => Math.max(+v, +rS.value);
  rS.oninput = () => setRange(clampS(rS.value), +rE.value);
  rE.oninput = () => setRange(+rS.value, clampE(rE.value));
  nS.oninput = () => setRange(clampS(nS.value || 0), +rE.value);
  nE.oninput = () => setRange(+rS.value, clampE(nE.value || 0));
  $('setStart').onclick = () => setRange(clampS(media.currentTime), +rE.value);
  $('setEnd').onclick = () => setRange(+rS.value, clampE(media.currentTime));
  $('preview').onclick = () => { media.currentTime = +nS.value; stopAt = +nE.value; media.play(); };
  $('resetRange').onclick = () => { setRange(0, dur); $('result').innerHTML = ''; status('Rentang dikembalikan ke seluruh durasi.'); };

  /* ---------- RESET / GANTI FILE ---------- */
  function resetAll() {
    if (ff) { try { ff.terminate(); } catch (_) {} ff = null; }
    if (media) { media.pause(); }
    if (objUrl) { URL.revokeObjectURL(objUrl); objUrl = null; }
    file = null; media = null; dur = 0; resultBlob = null; stopAt = null;
    $('playerBox').innerHTML = ''; $('result').innerHTML = ''; status(''); startStatus('');
    $('progWrap').classList.add('hidden'); $('prog').style.width = '0';
    $('cut').disabled = false; $('cut').classList.remove('hidden'); $('cancel').classList.add('hidden');
    fileIn.value = ''; $('urlIn').value = '';
    $('editor').classList.add('hidden'); $('startCard').classList.remove('hidden');
  }
  $('changeFile').onclick = resetAll;

  /* ---------- FFMPEG ---------- */
  async function getFF() {
    if (ff) return ff;
    status('Memuat mesin pemotong (sekali saja, ±30 MB)…');
    const inst = new FFmpegWASM.FFmpeg();
    inst.on('progress', ({ progress }) => { $('prog').style.width = Math.max(0, Math.min(100, progress * 100)) + '%'; });
    const base = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd/';
    const blobURL = async (url, type) => {
      const r = await fetch(url);
      if (!r.ok) throw new Error('Gagal memuat ' + url);
      return URL.createObjectURL(new Blob([await r.arrayBuffer()], { type }));
    };
    await inst.load({
      coreURL: await blobURL(base + 'ffmpeg-core.js', 'text/javascript'),
      wasmURL: await blobURL(base + 'ffmpeg-core.wasm', 'application/wasm'),
    });
    ff = inst;
    return ff;
  }

  $('cancel').onclick = () => {
    cancelled = true;
    if (ff) { try { ff.terminate(); } catch (_) {} ff = null; }
    status('Proses dibatalkan.');
  };

  /* ---------- POTONG ---------- */
  $('cut').onclick = async () => {
    const s = +nS.value, e = +nE.value, d = e - s;
    if (d <= 0) return status('Rentang potongan tidak valid.', true);
    cancelled = false;
    $('cut').classList.add('hidden'); $('cancel').classList.remove('hidden');
    $('result').innerHTML = ''; $('prog').style.width = '0'; $('progWrap').classList.remove('hidden');
    try {
      const f = await getFF();
      const isVideo = media.tagName === 'VIDEO';
      const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
      const inName = 'input.' + ext;
      const precise = $('mode').value === 'precise';
      let outExt = ext, args;
      status('Membaca file…');
      await f.writeFile(inName, new Uint8Array(await file.arrayBuffer()));
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
      status('Memotong…');
      const code = await f.exec([...args, outName]);
      if (cancelled) return;
      if (code !== 0) throw new Error('ffmpeg gagal (kode ' + code + '). Coba mode Presisi.');
      const data = await f.readFile(outName);
      await f.deleteFile(inName).catch(() => {}); await f.deleteFile(outName).catch(() => {});
      const mime = (isVideo ? 'video/' : 'audio/') + (outExt === 'mp3' ? 'mpeg' : outExt);
      resultBlob = new Blob([data], { type: mime });
      resultName = `${file.name.replace(/\.[^.]+$/, '')}_cut.${outExt}`;
      const url = URL.createObjectURL(resultBlob);
      const pv = document.createElement(isVideo ? 'video' : 'audio'); pv.controls = true; pv.playsInline = true; pv.src = url;
      const acts = document.createElement('div'); acts.className = 'acts';
      const a = document.createElement('a'); a.className = 'dl'; a.href = url; a.download = resultName;
      a.textContent = `⬇ Unduh ${resultName} (${mb(resultBlob.size)})`;
      const again = document.createElement('button'); again.type = 'button'; again.textContent = '✏️ Edit hasil ini';
      again.onclick = () => load(new File([resultBlob], resultName, { type: mime }));
      acts.append(a, again);
      $('result').append(pv, acts);
      $('prog').style.width = '100%'; status('Selesai ✔');
    } catch (err) {
      if (cancelled) { status('Proses dibatalkan.'); }
      else { console.error(err); status('Error: ' + (err.message || err), true); }
    } finally {
      $('cut').classList.remove('hidden'); $('cancel').classList.add('hidden');
      if (cancelled) $('progWrap').classList.add('hidden');
    }
  };
})();
