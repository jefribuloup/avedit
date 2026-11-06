/* AVEdit — kotak akun di navbar: tombol Masuk/Daftar, atau nama + Keluar bila sudah login */
(() => {
  const box = document.getElementById('authBox');
  if (!box || !window.I18N) return;
  const tr = (k) => window.I18N.t(k);
  let me = null;

  const mk = (tag, cls, parent) => { const e = document.createElement(tag); if (cls) e.className = cls; if (parent) parent.appendChild(e); return e; };
  const icon = (name, parent) => { parent.insertAdjacentHTML('beforeend', window.ICON(name)); };
  const label = (key, parent) => { const s = mk('span', '', parent); s.textContent = tr(key); return s; };

  function render() {
    box.textContent = '';
    if (!me || !me.enabled) return;
    if (!me.authenticated) {
      const a = mk('a', 'auth-link', box); a.href = '/login'; icon('log-in', a); label('nav.login', a);
      const b = mk('a', 'auth-reg', box); b.href = '/daftar'; icon('user-plus', b); label('nav.register', b);
      return;
    }
    const u = me.user || {};
    const who = mk('span', 'auth-user', box);
    if (typeof u.picture === 'string' && u.picture.startsWith('https://')) {
      const img = mk('img', 'avatar', who); img.src = u.picture; img.alt = ''; img.referrerPolicy = 'no-referrer'; img.width = img.height = 26;
    } else {
      const av = mk('span', 'avatar avatar-ph', who); av.textContent = (u.name || u.username || '?').trim().charAt(0).toUpperCase();
    }
    const nm = mk('span', 'auth-name', who); nm.textContent = u.name || u.username || '';
    const out = mk('button', 'auth-out', box); out.type = 'button'; icon('log-out', out); label('nav.logout', out);
    out.onclick = () => {
      out.disabled = true;
      fetch('/auth/logout', { method: 'POST', credentials: 'same-origin', headers: { Accept: 'application/json' } })
        .catch(() => {}).finally(() => { window.location.href = '/'; });
    };
  }

  document.addEventListener('langchange', render);
  fetch('/api/me', { credentials: 'same-origin' })
    .then((r) => r.json()).then((j) => { me = j; render(); }).catch(() => {});
})();
