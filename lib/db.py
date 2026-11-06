"""
Koneksi Postgres (Neon / Vercel Postgres) khusus akun pengguna + rate limit.
AVEdit TIDAK menyimpan file audio/video apa pun; DB hanya berisi akun.

Tabel memakai awalan `avedit_` supaya aman bila memakai database yang sama dengan aplikasi lain.
Skema dibuat otomatis (idempoten) saat koneksi pertama per proses.

Env: DATABASE_URL (atau POSTGRES_URL / POSTGRES_PRISMA_URL), DB_SSLMODE (default "require").
"""
import os
import re
import secrets
import time
import uuid

import psycopg2
import psycopg2.extras

DATABASE_URL = (
    os.environ.get("DATABASE_URL")
    or os.environ.get("POSTGRES_URL")
    or os.environ.get("POSTGRES_PRISMA_URL")
)
# Isi password_hash untuk akun Google: bukan hash valid ("!" = terkunci untuk login kata sandi)
GOOGLE_NO_PASSWORD = "!google-oauth"

_SCHEMA = (
    """CREATE TABLE IF NOT EXISTS avedit_users (
        id TEXT PRIMARY KEY,
        google_sub TEXT UNIQUE,
        email TEXT,
        name TEXT,
        picture TEXT,
        username TEXT,
        password_hash TEXT,
        provider TEXT NOT NULL DEFAULT 'manual',
        failed_attempts INTEGER NOT NULL DEFAULT 0,
        locked_until TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        last_login_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )""",
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_avedit_users_username ON avedit_users(username) WHERE username IS NOT NULL",
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_avedit_users_email_manual ON avedit_users(lower(email)) WHERE provider = 'manual'",
    "CREATE INDEX IF NOT EXISTS idx_avedit_users_email ON avedit_users(lower(email))",
    """CREATE TABLE IF NOT EXISTS avedit_rate_limits (
        key TEXT NOT NULL, bucket TEXT NOT NULL, window_id BIGINT NOT NULL,
        count INTEGER NOT NULL DEFAULT 0, expires_at TIMESTAMPTZ NOT NULL,
        PRIMARY KEY (key, bucket, window_id)
    )""",
)
_ready = False


def configured():
    return bool(DATABASE_URL)


def get_conn():
    global _ready
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL / POSTGRES_URL belum di-set di environment variable")
    conn = psycopg2.connect(DATABASE_URL, sslmode=os.environ.get("DB_SSLMODE", "require"), connect_timeout=8)
    if not _ready:
        try:
            cur = conn.cursor()
            for stmt in _SCHEMA:
                cur.execute(stmt)
            conn.commit()
            cur.close()
            _ready = True
        except Exception:
            conn.rollback()  # mis. balapan CREATE antar instance; coba lagi di koneksi berikutnya
    return conn


def _run(sql, params, one=True, commit=False):
    """Jalankan satu query; kembalikan satu baris (dict) atau None."""
    conn = get_conn()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(sql, params)
        row = cur.fetchone() if one else None
        if commit:
            conn.commit()
        cur.close()
        return dict(row) if row else None
    finally:
        conn.close()


# ---------- Username ----------

def username_from_email(email):
    local = (email or "").split("@")[0].split("+")[0].lower()
    base = re.sub(r"[^a-z0-9_.]", "", local).strip("._")
    if len(base) < 3:
        base = "user" + base
    return base[:24]


def assign_username(user_id, email):
    """Isi username kosong dari email (budi, budi2, ...). Aman dari balapan lewat indeks unik."""
    base = username_from_email(email)
    candidates = [base] + [f"{base}{n}" for n in range(2, 60)] + [f"{base}{secrets.token_hex(3)}"]
    conn = get_conn()
    cur = conn.cursor()
    try:
        for cand in candidates:
            try:
                cur.execute("UPDATE avedit_users SET username=%s WHERE id=%s AND username IS NULL RETURNING username", (cand, user_id))
                row = cur.fetchone()
                conn.commit()
                if row:
                    return row[0]
                cur.execute("SELECT username FROM avedit_users WHERE id=%s", (user_id,))
                got = cur.fetchone()
                return got[0] if got else None
            except Exception as e:
                conn.rollback()
                if getattr(e, "pgcode", None) != "23505":  # bukan unique_violation
                    raise
        return None
    finally:
        cur.close()
        conn.close()


# ---------- Google ----------

def upsert_user(google_sub, email, name, picture):
    """Daftar lewat Google bila belum ada, atau perbarui profil bila sudah ada. Identitas = `sub` Google."""
    row = _run(
        """
        INSERT INTO avedit_users (id, google_sub, email, name, picture, provider, password_hash)
        VALUES (%s,%s,%s,%s,%s,'google',%s)
        ON CONFLICT (google_sub) DO UPDATE
           SET email=EXCLUDED.email, name=EXCLUDED.name, picture=EXCLUDED.picture,
               last_login_at=now()
        RETURNING id, username, email, name, picture, (xmax = 0) AS is_new
        """,
        (str(uuid.uuid4()), google_sub, email, name, picture, GOOGLE_NO_PASSWORD),
        commit=True,
    )
    if not row.get("username"):
        row["username"] = assign_username(row["id"], email)
    return row


def find_user_by_google_sub(google_sub):
    return _run("SELECT id FROM avedit_users WHERE google_sub=%s", (google_sub,))


def get_user(user_id):
    return _run("SELECT id, username, email, name, picture, provider FROM avedit_users WHERE id=%s", (user_id,))


# ---------- Manual ----------

def find_register_conflict(username, email):
    """username_taken | email_taken | email_google | None"""
    if _run("SELECT 1 AS x FROM avedit_users WHERE username=%s", (username,)):
        return "username_taken"
    row = _run(
        "SELECT (password_hash IS NOT NULL AND password_hash NOT LIKE '!%%') AS manual FROM avedit_users "
        "WHERE lower(email)=%s ORDER BY (password_hash IS NOT NULL AND password_hash NOT LIKE '!%%') DESC LIMIT 1",
        (email,),
    )
    if not row:
        return None
    return "email_taken" if row["manual"] else "email_google"


def create_manual_user(username, name, email, password_hash):
    """Mengembalikan user, atau None bila bentrok (dua pendaftar bersamaan)."""
    return _run(
        """
        INSERT INTO avedit_users (id, username, email, name, password_hash, provider)
        VALUES (%s,%s,%s,%s,%s,'manual')
        ON CONFLICT DO NOTHING
        RETURNING id, username, email, name, picture
        """,
        (str(uuid.uuid4()), username, email, name, password_hash),
        commit=True,
    )


def get_user_for_login(identifier):
    """Cari akun ber-kata-sandi lewat username ATAU email, termasuk status kunci akun."""
    col = "lower(email)=%s" if "@" in identifier else "username=%s"
    return _run(
        """
        SELECT id, username, email, name, picture, password_hash,
               (locked_until IS NOT NULL AND locked_until > now()) AS is_locked,
               CEIL(GREATEST(EXTRACT(EPOCH FROM (locked_until - now())), 0) / 60.0)::int AS lock_minutes
        FROM avedit_users
        WHERE password_hash IS NOT NULL AND password_hash NOT LIKE '!%%' AND """ + col + """
        ORDER BY (provider = 'manual') DESC LIMIT 1""",
        (identifier,),
    )


def record_login_failure(user_id, max_attempts, lock_minutes):
    _run(
        """
        UPDATE avedit_users SET
          locked_until = CASE WHEN failed_attempts + 1 >= %s THEN now() + make_interval(mins => %s) ELSE locked_until END,
          failed_attempts = CASE WHEN failed_attempts + 1 >= %s THEN 0 ELSE failed_attempts + 1 END
        WHERE id=%s
        """,
        (max_attempts, lock_minutes, max_attempts, user_id),
        one=False, commit=True,
    )


def reset_login_failures(user_id):
    _run("UPDATE avedit_users SET failed_attempts=0, locked_until=NULL, last_login_at=now() WHERE id=%s",
         (user_id,), one=False, commit=True)


# ---------- Rate limit (fixed window, fail-open) ----------

def rate_hit(kind, ident, window, limit):
    """Hitung 1 permintaan. Return None bila lolos, atau detik tunggu bila melewati batas."""
    now = int(time.time())
    wid = now // window
    try:
        conn = get_conn()
        try:
            cur = conn.cursor()
            cur.execute(
                """INSERT INTO avedit_rate_limits (key, bucket, window_id, count, expires_at)
                   VALUES (%s,%s,%s,1,to_timestamp(%s))
                   ON CONFLICT (key, bucket, window_id) DO UPDATE SET count = avedit_rate_limits.count + 1
                   RETURNING count""",
                (ident, f"{kind}:{window}", wid, (wid + 2) * window),
            )
            n = cur.fetchone()[0]
            if secrets.randbelow(50) == 0:
                cur.execute("DELETE FROM avedit_rate_limits WHERE expires_at < now()")
            conn.commit()
            cur.close()
        finally:
            conn.close()
    except Exception:
        return None
    return max(1, (wid + 1) * window - now) if n > limit else None
