/*
 * AVEdit — router tanpa reload (mengikuti pola router.js di Talkins).
 * Klik link internal -> ambil HTML halaman tujuan lewat fetch -> ganti HANYA konten di antara
 * navbar dan footer -> jalankan script halaman tujuan -> perbarui URL (History API).
 * Navbar, footer, tema, bahasa, dan mesin ffmpeg tetap hidup (tidak dimuat ulang).
 *
 * - Bila ada yang gagal (server error, format tak dikenal), otomatis kembali ke navigasi biasa.
 * - Opt-out per link: <a data-no-router>.
 * - API: AVRouter.go(url, {replace})  -> pindah halaman tanpa reload (fallback ke navigasi biasa)
 *        AVRouter.signal              -> AbortSignal halaman aktif; batal otomatis saat pindah halaman
 *                                        (dipakai script halaman untuk listener global window/document).
 * - Event: "avedit:pageleave" (sebelum konten diganti), "avedit:pageenter" (setelah halaman baru siap).
 */
(function () {
  'use strict';

  var PERSISTENT = ['i18n.js', 'authnav.js', 'router.js', 'ffmpeg.js'];
  var supported = !!(window.fetch && window.history && window.history.pushState &&
                     window.AbortController && window.DOMParser);

  var pageCtl = new AbortController();
  var navCtl = null;
  var barTimer = 0;

  function keyOf(href) {
    var u = new URL(href, window.location.href);
    return u.pathname + u.search;
  }
  var currentKey = keyOf(window.location.href);

  /* ---- progress bar tipis di bawah navbar ---- */
  function progress(action) {
    var el = document.querySelector('#navProgress span');
    if (!el) return;
    var host = el.parentNode;
    clearTimeout(barTimer);
    if (action === 'start') {
      host.classList.add('on');
      el.style.transition = 'none';
      el.style.width = '0';
      void el.offsetWidth;
      el.style.transition = 'width 8s cubic-bezier(.1,.7,.2,1)';
      el.style.width = '85%';
    } else {
      el.style.transition = 'width .2s';
      el.style.width = '100%';
      barTimer = setTimeout(function () {
        host.classList.remove('on');
        el.style.transition = 'none';
        el.style.width = '0';
      }, 300);
    }
  }

  function fallback(url) {
    window.location.href = url; // navigasi biasa (reload penuh)
  }

  function scriptName(src) {
    try { return new URL(src, window.location.href).pathname.split('/').pop(); }
    catch (e) { return ''; }
  }
  function isPersistent(s) {
    return !!s.getAttribute('src') && PERSISTENT.indexOf(scriptName(s.getAttribute('src'))) !== -1;
  }
  function isKeep(el) {
    return el.tagName === 'SCRIPT' || el.matches('nav.nav, footer.footer');
  }

  function swap(doc, finalUrl, push) {
    // 1) halaman lama selesai: batalkan listener global miliknya
    window.dispatchEvent(new CustomEvent('avedit:pageleave'));
    pageCtl.abort();
    pageCtl = new AbortController();

    var body = document.body;
    var footer = body.querySelector('footer.footer');

    // 2) buang konten & script halaman lama (navbar, footer, script bersama tetap)
    Array.prototype.slice.call(body.children).forEach(function (el) {
      if (el.tagName === 'SCRIPT') { if (!isPersistent(el)) el.remove(); return; }
      if (!isKeep(el)) el.remove();
    });

    // 3) pasang konten halaman baru tepat sebelum footer
    Array.prototype.slice.call(doc.body.children).forEach(function (el) {
      if (isKeep(el)) return;
      var n = document.importNode(el, true);
      n.classList.add('page-in');
      body.insertBefore(n, footer || null);
    });

    // 4) judul, kunci judul i18n, URL
    var tk = doc.documentElement.getAttribute('data-title-key');
    if (tk) document.documentElement.setAttribute('data-title-key', tk);
    else document.documentElement.removeAttribute('data-title-key');
    if (doc.title) document.title = doc.title;
    if (push) {
      window.history.pushState({ av: 1 }, '', finalUrl);
    } else if (keyOf(finalUrl) !== keyOf(window.location.href)) {
      window.history.replaceState({ av: 1 }, '', finalUrl);
    }
    currentKey = keyOf(window.location.href);

    // 5) terjemahkan teks statis konten baru sesuai bahasa yang dipilih (sekaligus mengatur judul)
    if (window.I18N) window.I18N.setLang(window.I18N.getLang());
  }

  // Jalankan ulang script milik halaman tujuan secara berurutan.
  function runPageScripts(doc) {
    var scripts = Array.prototype.filter.call(doc.body.children, function (el) {
      return el.tagName === 'SCRIPT' && !isPersistent(el);
    });
    return scripts.reduce(function (chain, s) {
      return chain.then(function () {
        return new Promise(function (resolve) {
          var n = document.createElement('script');
          if (s.getAttribute('src')) {
            n.async = false;
            n.onload = n.onerror = resolve;
            n.src = s.getAttribute('src');
            document.body.appendChild(n);
          } else {
            n.textContent = s.textContent;
            document.body.appendChild(n);
            resolve();
          }
        });
      });
    }, Promise.resolve());
  }

  function navigate(url, push, scrollTop) {
    if (navCtl) navCtl.abort();
    var ctl = (navCtl = new AbortController());
    progress('start');

    var finalUrl = url;
    return window.fetch(url, {
      credentials: 'same-origin',
      signal: ctl.signal,
      headers: { Accept: 'text/html' },
    })
      .then(function (res) {
        var type = res.headers.get('content-type') || '';
        if (!res.ok || type.indexOf('text/html') === -1) throw new Error('bukan halaman');
        finalUrl = res.url || url;
        var h = url.indexOf('#') > -1 ? url.slice(url.indexOf('#')) : ''; // fetch membuang #hash; kembalikan
        if (h && finalUrl.indexOf('#') === -1) finalUrl += h;
        return res.text();
      })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        if (!doc.body || !doc.querySelector('nav.nav')) throw new Error('struktur tidak dikenali');
        return doc;
      })
      .then(function (doc) {
        if (ctl.signal.aborted) return;
        swap(doc, finalUrl, push);
        return runPageScripts(doc).then(function () {
          if (push || scrollTop) {
            window.scrollTo(0, 0);
            var hashId = url.indexOf('#') > -1 ? url.split('#')[1] : '';
            if (hashId) {
              try { hashId = decodeURIComponent(hashId); } catch (e) { /* biarkan apa adanya */ }
              var target = document.getElementById(hashId);
              if (target && target.scrollIntoView) target.scrollIntoView();
            }
          }
          window.dispatchEvent(new CustomEvent('avedit:pageenter'));
          progress('done');
        });
      })
      .catch(function () {
        if (ctl.signal.aborted) return; // digantikan navigasi yang lebih baru
        fallback(url);
      });
  }

  function eligible(a, e) {
    if (!a || !a.href) return null;
    if (e && (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)) return null;
    if (a.target && a.target !== '_self') return null;
    if (a.hasAttribute('download') || a.hasAttribute('data-no-router')) return null;
    var u;
    try { u = new URL(a.href, window.location.href); } catch (err) { return null; }
    if (u.origin !== window.location.origin) return null;
    // /api/* = JSON, /static/* = berkas, /auth/* = alur OAuth (redirect ke Google): selalu navigasi biasa
    if (/^\/(api|static|auth)\//.test(u.pathname)) return null;
    return u;
  }

  window.AVRouter = {
    // opts.replace = true: ganti entri riwayat saat ini (bukan menambah), mis. setelah login
    // supaya tombol Back tidak kembali ke halaman login.
    go: function (url, opts) {
      var u = new URL(url, window.location.href);
      if (!supported || u.origin !== window.location.origin) { fallback(u.href); return; }
      var replace = !!(opts && opts.replace);
      navigate(u.href, !replace, replace);
    },
  };
  Object.defineProperty(window.AVRouter, 'signal', { get: function () { return pageCtl.signal; } });

  if (!supported) return;

  document.addEventListener('click', function (e) {
    if (e.defaultPrevented) return;
    var a = e.target.closest ? e.target.closest('a') : null;
    var u = eligible(a, e);
    if (!u) return;
    var same = u.pathname === window.location.pathname && u.search === window.location.search;
    if (same && u.hash) return; // anchor di halaman yang sama: biarkan browser
    e.preventDefault();
    if (same) { // link ke halaman yang sedang dibuka: tidak perlu reload, cukup ke atas
      window.history.replaceState(window.history.state, '', u.pathname + u.search);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    navigate(u.href, true);
  });

  // Tombol Back/Forward browser
  window.addEventListener('popstate', function () {
    if (keyOf(window.location.href) === currentKey) return; // hanya ganti #hash
    navigate(window.location.href, false);
  });
})();
