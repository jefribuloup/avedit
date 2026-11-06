"""
Login & daftar AVEdit: manual (username/email + kata sandi) ATAU Google (One Tap / ID token),
dengan cadangan alur OAuth 2.0 redirect (/auth/google) bila script Google gagal dimuat.
Diadaptasi dari pola aplikasi Talkins. "Daftar" via Google = otomatis membuat akun bila belum ada.

Environment variable:
  SECRET_KEY            (wajib di produksi; string acak >= 32 karakter untuk menandatangani cookie sesi)
  DATABASE_URL          (Postgres, mis. Neon/Vercel Postgres; lihat lib/db.py)
  GOOGLE_CLIENT_ID      (Google Cloud Console; daftarkan domain di "Authorized JavaScript origins")
  GOOGLE_CLIENT_SECRET  (hanya untuk alur cadangan /auth/google)
  APP_BASE_URL          (opsional, mis. https://avedit.vercel.app; dasar redirect URI)
  GOOGLE_REDIRECT_URI   (opsional, menimpa APP_BASE_URL + /auth/google/callback)
  REQUIRE_LOGIN=1       (opsional; default 0 = login opsional. 1 = halaman editor butuh login)
"""
import os
import re
import secrets
from urllib.parse import urlencode, urlparse

import requests
from flask import g, jsonify, redirect, render_template_string, request, session
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from werkzeug.security import check_password_hash, generate_password_hash

from lib import db
from lib.authpage import AUTH_HTML

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo"
GOOGLE_ISSUERS = ("accounts.google.com", "https://accounts.google.com")
DEFAULT_SECRET = "dev-secret-change-me"

USERNAME_RE = re.compile(r"^[a-z0-9_.]{3,30}$")
EMAIL_RE = re.compile(r"^[^@\s]{1,64}@[^@\s]+\.[^@\s]{2,}$")
PASSWORD_MIN, PASSWORD_MAX = 8, 128
MAX_FAILED_ATTEMPTS, LOCK_MINUTES = 5, 15
# Hash palsu: waktu respons sama saat akun tidak ada (cegah user enumeration)
_DUMMY_HASH = generate_password_hash("dummy-password-for-timing")


def load_secret_key():
    """Di produksi (Vercel) SECRET_KEY wajib kuat; kalau tidak, aplikasi sengaja gagal start (fail-fast)."""
    key = os.environ.get("SECRET_KEY", "")
    prod = bool(os.environ.get("VERCEL") or os.environ.get("VERCEL_ENV")
                or os.environ.get("FLASK_ENV", "").lower() == "production")
    if not key or key == DEFAULT_SECRET:
        if prod:
            raise RuntimeError("SECRET_KEY belum diisi. Isi env SECRET_KEY di Vercel dengan string acak 32+ karakter: "
                               "python -c \"import secrets; print(secrets.token_hex(32))\"")
        return DEFAULT_SECRET
    if prod and len(key) < 16:
        raise RuntimeError("SECRET_KEY terlalu pendek (minimal 16 karakter, disarankan 32+).")
    return key


def _client_id():
    return os.environ.get("GOOGLE_CLIENT_ID", "").strip()


def _client_secret():
    return os.environ.get("GOOGLE_CLIENT_SECRET", "").strip()


def _require_login():
    return os.environ.get("REQUIRE_LOGIN", "0").strip().lower() in ("1", "true", "yes", "on")


def _redirect_uri():
    explicit = os.environ.get("GOOGLE_REDIRECT_URI", "").strip()
    if explicit:
        return explicit
    base = os.environ.get("APP_BASE_URL", "").strip().rstrip("/") or request.host_url.rstrip("/")
    host = urlparse(base).hostname or ""
    if base.startswith("http://") and host not in ("localhost", "127.0.0.1"):
        base = "https://" + base[len("http://"):]  # di balik proxy Vercel request tampak http
    return base + "/auth/google/callback"


def _safe_next(value):
    """Cegah open-redirect: hanya path internal."""
    if not value or not value.startswith("/") or value.startswith("//") or "\\" in value:
        return "/"
    return value


def _client_ip():
    if os.environ.get("VERCEL"):
        for h in ("x-vercel-forwarded-for", "x-real-ip", "x-forwarded-for"):
            v = request.headers.get(h)
            if v:
                return v.split(",")[0].strip()
    return request.remote_addr or "unknown"


def _limited(kind, limit, window):
    """Menit tunggu (int) bila kena batas, selain itu None."""
    retry = db.rate_hit(kind, _client_ip(), window, limit)
    return max(1, round(retry / 60)) if retry else None


def current_user():
    uid = session.get("user_id")
    if not uid:
        return None
    if "avedit_user" not in g:
        try:
            g.avedit_user = db.get_user(uid) or False
        except Exception:
            g.avedit_user = False
    return g.avedit_user or None


def _login(user):
    session.clear()  # buang state lama (cegah session fixation)
    session.permanent = True
    session["user_id"] = user["id"]


def _csrf_token():
    if "csrf" not in session:
        session["csrf"] = secrets.token_urlsafe(32)
    return session["csrf"]


def _csrf_ok():
    expected = session.get("csrf", "")
    return bool(expected) and secrets.compare_digest(expected, request.headers.get("X-CSRF-Token", ""))


def _err(code, status, **extra):
    return jsonify(dict(error=code, **extra)), status


def _mode(value):
    return "register" if value == "register" else "login"


def _fail(code, mode="login"):
    return redirect(("/daftar" if mode == "register" else "/login") + "?" + urlencode({"error": code}))


def _google_finish(profile, mode):
    """Masuk/daftar dari profil Google terverifikasi. Return (kode_error | None, is_new)."""
    sub, email = profile.get("sub"), (profile.get("email") or "").lower()
    if not sub or not email:
        return "failed", False
    if not profile.get("email_verified"):
        return "email_unverified", False
    try:
        if mode == "login" and not db.find_user_by_google_sub(sub):
            return "not_registered", False
        user = db.upsert_user(sub, email, profile.get("name") or email.split("@")[0], profile.get("picture"))
        _login(user)
        return None, bool(user.get("is_new"))
    except Exception:
        return "failed", False


def register_routes(app, index_html):
    """Pasang semua rute auth. `index_html` dipakai untuk meniru brand & skrip tema halaman utama."""
    secure_cookie = bool(os.environ.get("VERCEL")) or bool(os.environ.get("COOKIE_SECURE"))
    app.config.update(
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SAMESITE="Lax",
        SESSION_COOKIE_SECURE=secure_cookie,
        PERMANENT_SESSION_LIFETIME=60 * 60 * 24 * 30,
    )
    boot = re.search(r"<script>.*?</script>", index_html, re.S)
    brand = re.search(r'<a class="brand".*?</a>', index_html, re.S)
    ctx = {
        "theme_boot": boot.group(0) if boot else "",
        "brand": brand.group(0) if brand else '<a class="brand" href="/"><span>AVEdit</span></a>',
    }

    @app.before_request
    def gate():
        # Opsional (REQUIRE_LOGIN=1): halaman editor butuh login. /login, /daftar, /auth/*, /api/* tetap terbuka.
        if _require_login() and request.path == "/" and db.configured() and not current_user():
            return redirect("/login?" + urlencode({"next": "/"}))
        return None

    def _page(mode):
        nxt = _safe_next(request.args.get("next"))
        if current_user():
            return redirect(nxt)
        return render_template_string(AUTH_HTML, mode=mode, next_url=nxt, csrf_token=_csrf_token(),
                                      google_client_id=_client_id(), **ctx)

    @app.get("/login")
    def login_page():
        return _page("login")

    @app.get("/daftar")
    def register_page():
        return _page("register")

    @app.post("/auth/register")
    def auth_register():
        if not _csrf_ok():
            return _err("csrf", 403)
        wait = _limited("register", 10, 3600)
        if wait:
            return _err("rate_limited", 429, minutes=wait)
        data = request.get_json(silent=True) or {}
        name = " ".join(str(data.get("name", "")).split())[:80]
        email = str(data.get("email", "")).strip().lower()
        username = str(data.get("username", "")).strip().lower()
        password = str(data.get("password", ""))

        if not name:
            return _err("name_required", 400)
        if len(email) > 254 or not EMAIL_RE.match(email):
            return _err("email_invalid", 400)
        if not USERNAME_RE.match(username):
            return _err("username_invalid", 400)
        if len(password) < PASSWORD_MIN:
            return _err("password_short", 400)
        if len(password) > PASSWORD_MAX:
            return _err("password_long", 400)
        if password.lower() in (username, email):
            return _err("password_weak", 400)
        try:
            conflict = db.find_register_conflict(username, email)
            if conflict:
                return _err(conflict, 409)
            user = db.create_manual_user(username, name, email, generate_password_hash(password))
            if not user:  # kalah balapan dgn pendaftar lain
                return _err(db.find_register_conflict(username, email) or "username_taken", 409)
        except Exception:
            return _err("failed", 500)
        _login(user)
        return jsonify({"ok": True, "redirect": _safe_next(data.get("next"))})

    @app.post("/auth/login")
    def auth_login():
        if not _csrf_ok():
            return _err("csrf", 403)
        wait = _limited("login", 30, 900)
        if wait:
            return _err("rate_limited", 429, minutes=wait)
        data = request.get_json(silent=True) or {}
        identifier = str(data.get("identifier") or "").strip().lower()
        password = str(data.get("password", ""))
        valid_id = bool(EMAIL_RE.match(identifier)) if "@" in identifier else bool(USERNAME_RE.match(identifier))
        try:
            user = db.get_user_for_login(identifier) if valid_id else None
        except Exception:
            return _err("failed", 500)

        if user and user.get("is_locked"):  # tolak sebelum cek kata sandi
            return _err("locked", 429, minutes=max(int(user.get("lock_minutes") or 1), 1))

        stored = (user or {}).get("password_hash")
        if stored and stored.startswith("!"):
            stored = None
        ok = check_password_hash(stored or _DUMMY_HASH, password[:PASSWORD_MAX]) and bool(stored)
        if not ok:
            if user and stored:
                try:
                    db.record_login_failure(user["id"], MAX_FAILED_ATTEMPTS, LOCK_MINUTES)
                except Exception:
                    pass
            return _err("invalid_credentials", 401)  # pesan sama untuk semua kasus gagal

        try:
            db.reset_login_failures(user["id"])
        except Exception:
            pass
        _login(user)
        return jsonify({"ok": True, "redirect": _safe_next(data.get("next"))})

    @app.get("/auth/google")
    def auth_google():
        mode = _mode(request.args.get("mode"))
        if not _client_id() or not _client_secret():
            return _fail("not_configured", mode)
        if app.secret_key == DEFAULT_SECRET and os.environ.get("VERCEL"):
            return _fail("not_configured", mode)
        state = secrets.token_urlsafe(32)
        session["oauth_state"] = state
        session["oauth_next"] = _safe_next(request.args.get("next"))
        session["oauth_mode"] = mode
        params = {"client_id": _client_id(), "redirect_uri": _redirect_uri(), "response_type": "code",
                  "scope": "openid email profile", "state": state, "prompt": "select_account", "access_type": "online"}
        return redirect(GOOGLE_AUTH_URL + "?" + urlencode(params))

    @app.post("/auth/google/onetap")
    def auth_google_onetap():
        """Browser mengirim ID token (JWT) di `credential`; server memverifikasi tanda tangan, aud, iss, expiry."""
        if not _csrf_ok():
            return _err("csrf", 403)
        if not _client_id() or not db.configured():
            return _err("not_configured", 503)
        if app.secret_key == DEFAULT_SECRET and os.environ.get("VERCEL"):
            return _err("not_configured", 503)
        data = request.get_json(silent=True) or {}
        credential = str(data.get("credential", "")).strip()
        if not credential or len(credential) > 8192:
            return _err("failed", 400)
        try:
            profile = google_id_token.verify_oauth2_token(
                credential, google_requests.Request(), _client_id(), clock_skew_in_seconds=10)
        except ValueError:
            return _err("failed", 401)
        except Exception:
            return _err("failed", 502)
        if profile.get("iss") not in GOOGLE_ISSUERS:
            return _err("failed", 401)
        code_err, is_new = _google_finish(profile, _mode(data.get("mode")))
        if code_err:
            return _err(code_err, 403 if code_err in ("email_unverified", "not_registered") else 500)
        return jsonify({"ok": True, "is_new": is_new, "redirect": _safe_next(data.get("next"))})

    @app.get("/auth/google/callback")
    def auth_google_callback():
        mode = _mode(session.pop("oauth_mode", None))
        if request.args.get("error"):
            return _fail("access_denied" if request.args["error"] == "access_denied" else "failed", mode)
        expected = session.pop("oauth_state", None)
        if not expected or not secrets.compare_digest(expected, request.args.get("state", "")):
            return _fail("state", mode)
        code = request.args.get("code")
        if not code:
            return _fail("failed", mode)
        next_url = _safe_next(session.pop("oauth_next", None))
        try:
            tok = requests.post(GOOGLE_TOKEN_URL, data={
                "code": code, "client_id": _client_id(), "client_secret": _client_secret(),
                "redirect_uri": _redirect_uri(), "grant_type": "authorization_code"}, timeout=10)
            tok.raise_for_status()
            access_token = tok.json().get("access_token")
            if not access_token:
                return _fail("failed", mode)
            info = requests.get(GOOGLE_USERINFO_URL, headers={"Authorization": f"Bearer {access_token}"}, timeout=10)
            info.raise_for_status()
            profile = info.json()
        except Exception:
            return _fail("failed", mode)
        code_err, _ = _google_finish(profile, mode)
        return _fail(code_err, mode) if code_err else redirect(next_url)

    @app.post("/auth/logout")
    def auth_logout():
        session.clear()
        if "application/json" in request.headers.get("Accept", ""):
            return jsonify({"ok": True, "redirect": "/"})
        return redirect("/")

    @app.get("/api/me")
    def api_me():
        enabled = db.configured()
        user = current_user() if enabled else None
        if not user:
            return jsonify({"enabled": enabled, "authenticated": False})
        return jsonify({"enabled": True, "authenticated": True,
                        "user": {k: user.get(k) for k in ("id", "username", "email", "name", "picture")}})
