(() => {
  const $ = (id) => document.getElementById(id);
  const drop = $('drop'), fileIn = $('file'), editor = $('editor');
  const rS = $('rStart'), rE = $('rEnd'), nS = $('nStart'), nE = $('nEnd'), sel = $('sel');
  let file = null, media = null, dur = 0, ff = null, objUrl = null, stopAt = null;

  const fmt = (s) => {
    const m = Math.floor(s / 60), r = (s % 60).toFixed(2).padStart(5, '0');
    return `${m}:${r}`;
  };
  const status = (t) => ($('status').textContent = t);

  drop.onclick = () => fileIn.click();
  fileIn.onchange = () => fileIn.files[0] && load(fileIn.files[0]);
  ['dragover', 'dragenter'].forEach((e) => drop.addEventListener(e, (ev) => { ev.preventDefault(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach((e) => drop.addEventListener(e, (ev) => { ev.preventDefault(); drop.classList.remove('over'); }));
  drop.addEventListener('drop', (ev) => { const f = ev.dataTransfer.files[0]; f && load(f); });

  function load(f) {
    file = f;
    if (objUrl) URL.revokeObjectURL(objUrl);
    objUrl = URL.createObjectURL(f);
    const isVideo = f.type.startsWith('video') || /\.(mp4|mov|mkv|webm|avi)$/i.test(f.name);
    $('playerBox').innerHTML = '';
    media = document.createElement(isVideo ? 'video' : 'audio');
    media.controls = true; media.preload = 'metadata'; media.src = objUrl;
    $('playerBox').appendChild(media);
    $('fname').textContent = `${f.name} — ${(f.size / 1048576).toFixed(1)} MB`;
    $('result').innerHTML = ''; status(''); $('progWrap').classList.add('hidden');
    media.onloadedmetadata = () => {
      dur = media.duration || 0;
      [rS, rE].forEach((r) => (r.max = dur));
      rS.value = 0; rE.value = dur; sync('range');
      drop.classList.add('hidden'); editor.classList.remove('hidden');
    };
    media.onerror = () => { status('Browser tidak bisa memutar file ini (format/codec tidak didukung untuk preview).'); };
    media.ontimeupdate = () => { if (stopAt !== null && media.currentTime >= stopAt) { media.pause(); stopAt = null; } };
  }

  function sync(from) {
    let s, e;
    if (from === 'range') { s = +rS.value; e = +rE.value; }
    else { s = +nS.value; e = +nE.value; }
    s = Math.max(0, Math.min(s, dur)); e = Math.max(0, Math.min(e, dur));
    if (e < s) { if (from === 'end' || document.activeElement === rE || document.activeElement === nE) s = e; else e = s; }
    rS.value = nS.value = s.toFixed(2); rE.value = nE.value = e.toFixed(2);
    const p = (v) => (dur ? (v / dur) * 100 : 0);
    sel.style.left = p(s) + '%'; sel.style.width = (p(e) - p(s)) + '%';
    $('info').textContent = `Durasi potongan: ${fmt(e - s)}  (${fmt(s)} → ${fmt(e)})`;
  }
  rS.oninput = rE.oninput = () => sync('range');
  nS.oninput = () => sync('num'); nE.oninput = () => sync('end');
  $('setStart').onclick = () => { nS.value = media.currentTime.toFixed(2); sync('num'); };
  $('setEnd').onclick = () => { nE.value = media.currentTime.toFixed(2); sync('end'); };
  $('preview').onclick = () => { media.currentTime = +nS.value; stopAt = +nE.value; media.play(); };

  async function getFF() {
    if (ff) return ff;
    status('Memuat mesin pemotong (sekali saja, ±30 MB)…');
    ff = new FFmpegWASM.FFmpeg();
    ff.on('progress', ({ progress }) => {
      $('prog').style.width = Math.max(0, Math.min(100, progress * 100)) + '%';
    });
    const base = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd/';
    const blobURL = async (url, type) => {
      const r = await fetch(url);
      if (!r.ok) throw new Error('Gagal memuat ' + url);
      return URL.createObjectURL(new Blob([await r.arrayBuffer()], { type }));
    };
    await ff.load({
      coreURL: await blobURL(base + 'ffmpeg-core.js', 'text/javascript'),
      wasmURL: await blobURL(base + 'ffmpeg-core.wasm', 'application/wasm'),
    });
    return ff;
  }

  $('cut').onclick = async () => {
    const s = +nS.value, e = +nE.value, d = e - s;
    if (d <= 0) return status('Rentang potongan tidak valid.');
    const btn = $('cut'); btn.disabled = true;
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
      if (code !== 0) throw new Error('ffmpeg gagal (kode ' + code + '). Coba mode Presisi.');
      const data = await f.readFile(outName);
      await f.deleteFile(inName).catch(() => {}); await f.deleteFile(outName).catch(() => {});
      const mime = (isVideo ? 'video/' : 'audio/') + (outExt === 'mp3' ? 'mpeg' : outExt);
      const url = URL.createObjectURL(new Blob([data.buffer], { type: mime }));
      const base = file.name.replace(/\.[^.]+$/, '');
      const dl = `${base}_cut.${outExt}`;
      const pv = document.createElement(isVideo ? 'video' : 'audio'); pv.controls = true; pv.src = url;
      const a = document.createElement('a'); a.href = url; a.download = dl;
      a.textContent = `⬇ Unduh ${dl} (${(data.length / 1048576).toFixed(2)} MB)`;
      $('result').append(pv, a);
      $('prog').style.width = '100%'; status('Selesai ✔');
    } catch (err) {
      console.error(err); status('Error: ' + (err.message || err));
    } finally { btn.disabled = false; }
  };
})();
