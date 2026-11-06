/* AVEdit — pengendali navbar (tetap hidup antar halaman): menu mobile, link aktif, kotak akun */
(() => {
  const nav = document.getElementById('nav');
  const box = document.getElementById('authBox');
  const menu = document.getElementById('menu');
  const burger = document.getElementById('burger');
  if (!nav || !box || !menu || !burger || !window.I18N) return;
  const tr = (k) => window.I18N.t(k);
  const mk = (tag, cls, parent) => { const e = document.createElement(tag); if (cls) e.className = cls; if (parent) parent.appendChild(e); return e; };
  const icon = (name, parent) => parent.insertAdjacentHTML('beforeend', window.ICON(name));
  const label = (key, parent) => { const s = mk('span', '', parent); s.textContent = tr(key); return s; };
  let me = null, meKey = '';

  /* ---------- menu mobile ---------- */
  const setMenu = (open) => { menu.classList.toggle('open', open); burger.setAttribute('aria-expanded', String(open)); };
  const closeUser = () => {
    const p = box.querySelector('.user-panel'), b = box.querySelector('.user-btn');
    if (p) p.hidden = true;
    if (b) b.setAttribute('aria-expanded', 'false');
  };
  burger.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target)) setMenu(false);
    else if (e.target.closest('.menu a')) setMenu(false);
    if (!e.target.closest('.user-menu')) closeUser();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { setMenu(false); closeUser(); } });
  window.addEventListener('resize', () => { if (window.innerWidth > 760) setMenu(false); });

  /* ---------- link aktif + bayangan saat scroll ---------- */
  const links = nav.querySelectorAll('.nav-link');
  function paintActive() {
    let cur = null;
    if (location.pathname === '/') {
      const g = document.getElementById('panduan');
      cur = (g && window.scrollY > 40 && g.getBoundingClientRect().top < window.innerHeight * 0.5) ? 'guide' : 'editor';
    }
    links.forEach((a) => {
      const on = a.dataset.nav === cur;
      a.classList.toggle('active', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    box.querySelectorAll('[data-path]').forEach((a) => a.classList.toggle('current', a.dataset.path === location.pathname));
    nav.classList.toggle('scrolled', window.scrollY > 4);
  }
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; paintActive(); });
  }, { passive: true });
  window.addEventListener('hashchange', paintActive);

  /* ---------- kotak akun ---------- */
  function logout(e) {
    const out = e.currentTarget;
    out.disabled = true;
    fetch('/auth/logout', { method: 'POST', credentials: 'same-origin', headers: { Accept: 'application/json' } })
      .catch(() => {})
      .then(() => refresh())
      .then(() => { if (window.AVRouter) window.AVRouter.go('/'); else window.location.href = '/'; });
  }

  function render() {
    box.textContent = '';
    if (!me || !me.enabled) { paintActive(); return; }
    if (!me.authenticated) {
      const a = mk('a', 'auth-link', box); a.href = '/login'; a.dataset.path = '/login'; icon('log-in', a); label('nav.login', a);
      const b = mk('a', 'auth-reg', box); b.href = '/daftar'; b.dataset.path = '/daftar'; icon('user-plus', b); label('nav.register', b);
    } else {
      const u = me.user || {};
      const name = u.name || u.username || '';
      const wrap = mk('div', 'user-menu', box);
      const btn = mk('button', 'user-btn', wrap);
      btn.type = 'button'; btn.setAttribute('aria-haspopup', 'true'); btn.setAttribute('aria-expanded', 'false');
      if (typeof u.picture === 'string' && u.picture.startsWith('https://')) {
        const img = mk('img', 'avatar', btn); img.src = u.picture; img.alt = ''; img.referrerPolicy = 'no-referrer'; img.width = img.height = 26;
      } else {
        const av = mk('span', 'avatar avatar-ph', btn); av.textContent = (name || '?').trim().charAt(0).toUpperCase();
      }
      mk('span', 'auth-name', btn).textContent = name;
      mk('span', 'caret', btn);

      const panel = mk('div', 'user-panel', wrap);
      panel.hidden = true; panel.setAttribute('role', 'menu');
      const head = mk('div', 'user-head', panel);
      mk('strong', '', head).textContent = name;
      if (u.username) mk('small', '', head).textContent = '@' + u.username;
      if (u.email) mk('small', '', head).textContent = u.email;
      const out = mk('button', 'user-item user-out', panel);
      out.type = 'button'; out.setAttribute('role', 'menuitem'); icon('log-out', out); label('nav.logout', out);
      out.addEventListener('click', logout);
      btn.addEventListener('click', () => {
        const open = panel.hidden;
        closeUser();
        panel.hidden = !open;
        btn.setAttribute('aria-expanded', String(open));
      });
    }
    paintActive();
  }

  function refresh() {
    return fetch('/api/me', { credentials: 'same-origin' })
      .then((r) => r.json())
      .then((j) => { const k = JSON.stringify(j); if (k !== meKey) { meKey = k; me = j; render(); } })
      .catch(() => {});
  }
  window.AVAuth = { refresh };

  document.addEventListener('langchange', render);
  window.addEventListener('avedit:pageenter', () => { setMenu(false); closeUser(); paintActive(); refresh(); });
  paintActive();
  refresh();
})();
