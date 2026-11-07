"""Halaman Masuk / Daftar (Jinja, dirender lewat render_template_string; otomatis di-escape)."""

GOOGLE_SVG = (
    '<svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">'
    '<path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/>'
    '<path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z"/>'
    '<path fill="#FBBC05" d="M10.5 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.9-6.1z"/>'
    '<path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg>'
)


def _ic(name):
    return f'<svg class="ic" aria-hidden="true"><use href="/static/icons.svg#{name}"/></svg>'


def _pw(name, auto):
    return (
        f'<span class="pw-wrap"><input type="password" name="{name}" autocomplete="{auto}" maxlength="128" required>'
        f'<button type="button" class="pw-toggle" aria-label="Show / Hide" data-i18n-title="auth.pw.toggle">{_ic("eye")}</button></span>'
    )


AUTH_HTML = """<!DOCTYPE html>
<html lang="id" data-theme="dark" data-title-key="auth.title.{{ mode }}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#0a0612">
<meta name="robots" content="noindex">
<title>{{ 'Daftar' if mode == 'register' else 'Masuk' }} — AVEdit</title>
{{ theme_boot|safe }}
<link rel="stylesheet" href="/static/style.css">
</head>
<body>
{{ nav|safe }}

<main class="login-wrap">
  <section class="login-card" id="loginCard" data-next="{{ next_url }}" data-csrf="{{ csrf_token }}" data-client-id="{{ google_client_id }}" data-mode="{{ mode }}">
    <aside class="login-side" aria-hidden="true">
      <span class="side-badge">""" + _ic("audio-lines") + """<b>AVEdit</b></span>
      <h2 data-i18n="auth.side.title">Edit audio &amp; video dengan hasil profesional</h2>
      <p data-i18n="auth.side.sub">Satu akun untuk mengakses AVEditor dari perangkat mana saja.</p>
      <ul class="side-list">
        <li>""" + _ic("pencil") + """<span data-i18n="auth.side.f1">Pilih bagian, edit, unduh — cepat</span></li>
        <li>""" + _ic("audio-lines") + """<span data-i18n="auth.side.f2">Timeline audio dengan zoom dan ketelitian hingga detik</span></li>
        <li>""" + _ic("cloud-upload") + """<span data-i18n="auth.side.f3">Mendukung beberapa jenis file audio dan video</span></li>
      </ul>
    </aside>
    <div class="login-main">
    <div class="login-tabs" role="tablist">
      <a class="login-tab{% if mode != 'register' %} active{% endif %}" href="/login{% if next_url != '/dashboard' %}?next={{ next_url|urlencode }}{% endif %}" role="tab" data-i18n="auth.tab.login">Masuk</a>
      <a class="login-tab{% if mode == 'register' %} active{% endif %}" href="/daftar{% if next_url != '/dashboard' %}?next={{ next_url|urlencode }}{% endif %}" role="tab" data-i18n="auth.tab.register">Daftar</a>
    </div>

    {% if mode == 'register' %}
    <h1 data-i18n="auth.h.register">Buat akun Anda</h1>
    <p class="login-sub" data-i18n="auth.sub.register">Daftar dengan formulir, atau satu klik dengan akun Google.</p>
    <form class="login-form" id="formRegister" novalidate>
      <label class="login-field"><span data-i18n="auth.f.name">Nama lengkap</span>
        <input type="text" name="name" autocomplete="name" maxlength="80" required></label>
      <label class="login-field"><span data-i18n="auth.f.email">Email</span>
        <input type="email" name="email" autocomplete="email" maxlength="254" autocapitalize="none" spellcheck="false" required></label>
      <label class="login-field"><span data-i18n="auth.f.username">Username</span>
        <input type="text" name="username" autocomplete="username" maxlength="30" autocapitalize="none" spellcheck="false" required>
        <small class="login-hint" data-i18n="auth.hint.username">3–30 karakter: huruf kecil, angka, titik, garis bawah.</small></label>
      <label class="login-field"><span data-i18n="auth.f.password">Kata sandi</span>
        """ + _pw("password", "new-password") + """
        <small class="login-hint" data-i18n="auth.hint.password">Minimal 8 karakter.</small></label>
      <label class="login-field"><span data-i18n="auth.f.confirm">Ulangi kata sandi</span>
        """ + _pw("confirm", "new-password") + """</label>
      <button type="submit" class="primary login-submit">""" + _ic("user-plus") + """<span data-i18n="auth.submit.register">Daftar</span></button>
    </form>
    {% else %}
    <h1 data-i18n="auth.h.login">Selamat datang kembali</h1>
    <p class="login-sub" data-i18n="auth.sub.login">Masuk untuk memakai AVEdit dari perangkat mana saja.</p>
    <form class="login-form" id="formLogin" novalidate>
      <label class="login-field"><span data-i18n="auth.f.identifier">Username atau email</span>
        <input type="text" name="identifier" autocomplete="username" maxlength="254" autocapitalize="none" spellcheck="false" required></label>
      <label class="login-field"><span data-i18n="auth.f.password">Kata sandi</span>
        """ + _pw("password", "current-password") + """</label>
      <button type="submit" class="primary login-submit">""" + _ic("log-in") + """<span data-i18n="auth.submit.login">Masuk</span></button>
      <small class="login-hint" data-i18n="auth.hint.google">Akun Google tidak memakai kata sandi — gunakan tombol Google di bawah.</small>
    </form>
    {% endif %}

    <p class="login-error" id="loginError" role="alert" hidden></p>
    <button type="button" class="login-error-link" id="goRegister" data-i18n="auth.goRegister" hidden>Belum punya akun? Daftar sekarang</button>

    <div class="login-divider"><span data-i18n="auth.or">atau</span></div>

    <div class="gsi-wrap" id="gsiButton"></div>
    <a class="btn-google" id="googleFallback" href="/auth/google?next={{ next_url|urlencode }}&mode={{ mode }}" hidden>
      """ + GOOGLE_SVG + """
      <span data-i18n="auth.google.{{ mode }}">{{ 'Daftar dengan Google' if mode == 'register' else 'Masuk dengan Google' }}</span>
    </a>
    </div>
  </section>
</main>

{{ footer|safe }}

<script src="/static/i18n.js"></script>
<script src="/static/authnav.js"></script>
<script src="/static/router.js"></script>
<script src="/static/auth.js"></script>
</body>
</html>
"""
