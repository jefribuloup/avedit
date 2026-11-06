/* AVEdit — logika halaman Masuk / Daftar (form manual + Google One Tap) */
(() => {
  const $ = (id) => document.getElementById(id);
  const tr = (k, p) => window.I18N.t(k, p);
  const card = $('loginCard');
  if (!card) return;
  const errEl = $('loginError'), goRegister = $('goRegister'), btnBox = $('gsiButton'), fallback = $('googleFallback');
  const clientId = card.dataset.clientId || '';
  const nextUrl = card.dataset.next || '/';
  const csrf = card.dataset.csrf || '';
  const mode = card.dataset.mode === 'register' ? 'register' : 'login';
  let busy = false, loadTimer = null, lastErr = null;

  const goTo = (url) => { window.location.href = url; };
  const gid = () => window.google && window.google.accounts && window.google.accounts.id;

  function showError(code, minutes) {
    lastErr = { code, minutes };
    let key = 'auth.err.' + code, text = tr(key, { minutes: minutes || 1 });
    if (text === key) text = tr('auth.err.failed');
    errEl.hidden = false; errEl.textContent = text;
    goRegister.hidden = !((code === 'invalid_credentials' || code === 'not_registered') && mode === 'login');
  }
  function clearError() { lastErr = null; errEl.hidden = true; goRegister.hidden = true; }
  document.addEventListener('langchange', () => { if (lastErr) showError(lastErr.code, lastErr.minutes); });
  goRegister.addEventListener('click', () => goTo('/daftar'));

  const urlErr = new URLSearchParams(location.search).get('error');
  if (urlErr) showError(urlErr);

  // tampilkan / sembunyikan kata sandi
  document.querySelectorAll('.pw-toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      const input = btn.parentNode.querySelector('input');
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      const use = btn.querySelector('use');
      if (use) use.setAttribute('href', '/static/icons.svg#' + (show ? 'eye-off' : 'eye'));
    });
  });

  // ---------- Form manual ----------
  function bindForm(form, endpoint, validate) {
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      clearError();
      const data = {};
      new FormData(form).forEach((v, k) => { data[k] = v; });
      const bad = validate(data);
      if (bad) { showError(bad); return; }
      data.next = nextUrl;
      const btn = form.querySelector('.login-submit'), label = btn.querySelector('span');
      btn.disabled = true; label.textContent = tr('auth.submit.loading');
      const restore = () => { btn.disabled = false; label.textContent = tr(label.dataset.i18n); };
      fetch(endpoint, {
        method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
        body: JSON.stringify(data),
      })
        .then((res) => res.json().then((j) => ({ ok: res.ok, body: j })))
        .then((r) => {
          if (r.ok && r.body.redirect) { goTo(r.body.redirect); return; }
          showError(r.body.error || 'failed', r.body.minutes); restore();
        })
        .catch(() => { showError('network'); restore(); });
    });
  }
  bindForm($('formLogin'), '/auth/login', (d) => (!d.identifier.trim() || !d.password) ? 'invalid_credentials' : null);
  bindForm($('formRegister'), '/auth/register', (d) => {
    if (!d.name.trim()) return 'name_required';
    if (!/^[^@\s]{1,64}@[^@\s]+\.[^@\s]{2,}$/.test(d.email.trim()) || d.email.length > 254) return 'email_invalid';
    if (!/^[a-zA-Z0-9_.]{3,30}$/.test(d.username.trim())) return 'username_invalid';
    if (d.password.length < 8) return 'password_short';
    if (d.password !== d.confirm) return 'password_mismatch';
    return null;
  });

  // ---------- Google One Tap (ID token) ----------
  function onCredential(resp) {
    if (busy || !resp || !resp.credential) return;
    busy = true; clearError();
    btnBox.style.opacity = '0.5'; btnBox.style.pointerEvents = 'none';
    fetch('/auth/google/onetap', {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
      body: JSON.stringify({ credential: resp.credential, next: nextUrl, mode }),
    })
      .then((res) => res.json().then((j) => ({ ok: res.ok, body: j })))
      .then((r) => {
        if (r.ok && r.body.redirect) { goTo(r.body.redirect); return; }
        throw r.body.error || 'failed';
      })
      .catch((e) => {
        busy = false; btnBox.style.opacity = ''; btnBox.style.pointerEvents = '';
        showError(typeof e === 'string' ? e : 'network');
      });
  }

  function startGoogle() {
    if (!gid()) return;
    clearTimeout(loadTimer);
    gid().initialize({
      client_id: clientId, callback: onCredential, auto_select: false, cancel_on_tap_outside: false,
      itp_support: true, use_fedcm_for_prompt: true, context: mode === 'register' ? 'signup' : 'signin',
    });
    gid().renderButton(btnBox, {
      type: 'standard', theme: 'outline', size: 'large', shape: 'pill',
      text: mode === 'register' ? 'signup_with' : 'signin_with', logo_alignment: 'left',
      width: Math.min(320, Math.max(200, btnBox.clientWidth || 280)), locale: window.I18N.getLang(),
    });
  }
  function useFallback() { if (gid()) return; btnBox.hidden = true; fallback.hidden = false; }

  if (!clientId) { btnBox.hidden = true; $('googleFallback').hidden = true; document.querySelector('.login-divider').hidden = true; return; }
  if (gid()) { startGoogle(); return; }
  const s = document.createElement('script');
  s.src = 'https://accounts.google.com/gsi/client'; s.async = true; s.defer = true;
  s.onload = startGoogle; s.onerror = useFallback;
  document.head.appendChild(s);
  loadTimer = setTimeout(useFallback, 8000);
})();
