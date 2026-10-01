import crypto from 'crypto';
import { promisify } from 'util';
import type { Express, Request, Response, NextFunction } from 'express';
import express from 'express';
import { db } from './db';

/**
 * KEAMANAN LOGIN ADMIN (di sisi server)
 *
 *  - Kata sandi disimpan sebagai hash scrypt + salt acak (bukan teks biasa).
 *  - Sesi berupa token acak di cookie HttpOnly + SameSite=Strict (tidak bisa dibaca JavaScript).
 *  - Batas percobaan gagal: IP dikunci setelah 5x salah, akun setelah 10x salah (waktu kunci makin lama).
 *  - Sesi habis otomatis: 30 menit tidak aktif, atau maksimal 8 jam.
 *  - Semua endpoint penulisan/pengaturan wajib sesi admin (middleware requireAdmin).
 */

const scrypt = promisify(crypto.scrypt) as (
  pw: crypto.BinaryLike, salt: crypto.BinaryLike, keylen: number, opts: crypto.ScryptOptions
) => Promise<Buffer>;

const SCRYPT = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const KEY_LEN = 64;
const ADMIN_USERNAME = 'admin';
const SETTING_KEY = 'admin_auth';
const COOKIE_NAME = 'siakad_admin_sid';

const IDLE_MS = 30 * 60 * 1000;
const ABSOLUTE_MS = 8 * 60 * 60 * 1000;

// ---------------------------------------------------------------- hash kata sandi

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16);
  const hash = await scrypt(password, salt, KEY_LEN, SCRYPT);
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString('base64')}$${hash.toString('base64')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const [algo, N, r, p, saltB64, hashB64] = stored.split('$');
    if (algo !== 'scrypt') return false;
    const expected = Buffer.from(hashB64, 'base64');
    const actual = await scrypt(password, Buffer.from(saltB64, 'base64'), expected.length, {
      N: Number(N), r: Number(r), p: Number(p), maxmem: SCRYPT.maxmem,
    });
    return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

/** Aturan kata sandi. Mengembalikan pesan kesalahan, atau null jika sudah kuat. */
export function checkPasswordPolicy(pw: string): string | null {
  if (pw.length < 12) return 'Kata sandi minimal 12 karakter.';
  if (pw.length > 128) return 'Kata sandi maksimal 128 karakter.';
  if (!/[a-z]/.test(pw) || !/[A-Z]/.test(pw) || !/[0-9]/.test(pw)) {
    return 'Kata sandi harus mengandung huruf kecil, huruf BESAR, dan angka.';
  }
  const low = pw.toLowerCase();
  for (const bad of ['admin', 'siakad', 'lubang', 'buaya', 'password', 'sandi', '123456', 'qwerty']) {
    if (low.includes(bad)) return `Kata sandi tidak boleh mengandung kata yang mudah ditebak ("${bad}").`;
  }
  return null;
}

// ---------------------------------------------------------------- data admin di MySQL

interface AdminRecord { username: string; hash: string; updatedAt: string }

async function readAdmin(): Promise<AdminRecord | null> {
  const [rows] = await db.query<any[]>('SELECT nilai FROM pengaturan_aplikasi WHERE kunci = ?', [SETTING_KEY]);
  if (!rows[0]) return null;
  try { return JSON.parse(rows[0].nilai); } catch { return null; }
}

export async function saveAdminPassword(password: string, keepSessionKey?: string): Promise<void> {
  const rec: AdminRecord = { username: ADMIN_USERNAME, hash: await hashPassword(password), updatedAt: new Date().toISOString() };
  await db.query(
    'INSERT INTO pengaturan_aplikasi (kunci, nilai) VALUES (?, ?) ON DUPLICATE KEY UPDATE nilai = VALUES(nilai)',
    [SETTING_KEY, JSON.stringify(rec)]
  );
  // Kata sandi berubah → semua sesi lain dicabut (sesi yang sedang dipakai boleh tetap)
  for (const k of [...sessions.keys()]) if (k !== keepSessionKey) sessions.delete(k);
}

/**
 * Menyiapkan akun admin pertama kali. TIDAK ADA kata sandi bawaan:
 *  - jika ADMIN_INITIAL_PASSWORD di .env memenuhi aturan → dipakai
 *  - jika tidak → dibuat kata sandi acak yang dicetak SEKALI di terminal server
 */
export async function ensureAdminAccount(): Promise<void> {
  if (await readAdmin()) return;
  const fromEnv = process.env.ADMIN_INITIAL_PASSWORD || '';
  let password = '';
  if (fromEnv && !checkPasswordPolicy(fromEnv)) {
    password = fromEnv;
    console.log('🔐 Akun admin dibuat dari ADMIN_INITIAL_PASSWORD. Hapus nilai itu dari file .env sekarang.');
  } else {
    if (fromEnv) console.warn('⚠️  ADMIN_INITIAL_PASSWORD terlalu lemah, diabaikan.');
    password = crypto.randomBytes(12).toString('base64url') + 'aA1';
    console.log('\n==================================================');
    console.log('🔐 AKUN ADMIN BARU DIBUAT (kata sandi hanya tampil sekali)');
    console.log('   Username : admin');
    console.log(`   Password : ${password}`);
    console.log('   Ganti dengan:  npm run admin:password');
    console.log('==================================================\n');
  }
  await saveAdminPassword(password);
}

// ---------------------------------------------------------------- batas percobaan login

export interface Attempt { fails: number; windowStart: number; lockedUntil: number; level: number }
const WINDOW_MS = 15 * 60 * 1000;
const BASE_LOCK_MS = 15 * 60 * 1000;
const MAX_LOCK_MS = 4 * 60 * 60 * 1000;
const ipAttempts = new Map<string, Attempt>();
const accountAttempts = new Map<string, Attempt>();
// Login guru/kepsek/siswa: batas IP dibuat longgar karena banyak murid memakai satu jaringan sekolah.
export const userIpAttempts = new Map<string, Attempt>();
export const userNameAttempts = new Map<string, Attempt>();
export const USER_IP_MAX = 40;
export const USER_NAME_MAX = 8;
const IP_MAX = 5;
const ACCOUNT_MAX = 10;

export function getAttempt(map: Map<string, Attempt>, key: string): Attempt {
  let a = map.get(key);
  if (!a) { a = { fails: 0, windowStart: Date.now(), lockedUntil: 0, level: 0 }; map.set(key, a); }
  if (Date.now() - a.windowStart > WINDOW_MS && a.lockedUntil < Date.now()) {
    a.fails = 0; a.windowStart = Date.now();
  }
  return a;
}

export function registerFail(a: Attempt, max: number) {
  a.fails += 1;
  if (a.fails >= max) {
    a.lockedUntil = Date.now() + Math.min(BASE_LOCK_MS * 2 ** a.level, MAX_LOCK_MS);
    a.level += 1;
    a.fails = 0;
    a.windowStart = Date.now();
  }
}

export function lockRemainingSec(...list: Attempt[]): number {
  const until = Math.max(...list.map(a => a.lockedUntil));
  return until > Date.now() ? Math.ceil((until - Date.now()) / 1000) : 0;
}

setInterval(() => {
  const now = Date.now();
  for (const m of [ipAttempts, accountAttempts, userIpAttempts, userNameAttempts]) {
    for (const [k, a] of m) if (a.lockedUntil < now && now - a.windowStart > WINDOW_MS * 4) m.delete(k);
  }
  for (const [k, s] of sessions) if (now - s.lastSeen > IDLE_MS || now - s.created > ABSOLUTE_MS) sessions.delete(k);
}, 5 * 60 * 1000).unref();

// ---------------------------------------------------------------- sesi

interface Session { created: number; lastSeen: number }
const sessions = new Map<string, Session>(); // kunci = SHA-256 dari token
const sha256 = (v: string) => crypto.createHash('sha256').update(v).digest('hex');

function readCookie(req: Request, name: string): string | null {
  const raw = req.headers.cookie;
  if (!raw) return null;
  for (const part of raw.split(';')) {
    const i = part.indexOf('=');
    if (i > 0 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return null;
}

function setSessionCookie(req: Request, res: Response, token: string) {
  const flags = ['HttpOnly', 'SameSite=Strict', 'Path=/'];
  if (req.secure) flags.push('Secure');
  res.append('Set-Cookie', `${COOKIE_NAME}=${token}; ${flags.join('; ')}`);
}

function clearSessionCookie(req: Request, res: Response) {
  const flags = ['HttpOnly', 'SameSite=Strict', 'Path=/', 'Max-Age=0'];
  if (req.secure) flags.push('Secure');
  res.append('Set-Cookie', `${COOKIE_NAME}=; ${flags.join('; ')}`);
}

function currentSession(req: Request): { key: string; s: Session } | null {
  const token = readCookie(req, COOKIE_NAME);
  if (!token || token.length > 200) return null;
  const key = sha256(token);
  const s = sessions.get(key);
  if (!s) return null;
  const now = Date.now();
  if (now - s.lastSeen > IDLE_MS || now - s.created > ABSOLUTE_MS) { sessions.delete(key); return null; }
  s.lastSeen = now;
  return { key, s };
}

// ---------------------------------------------------------------- middleware

/** Tolak permintaan tulis dari situs lain (perlindungan CSRF tambahan di atas SameSite=Strict). */
export function sameOriginOnly(req: Request): boolean {
  if (req.method === 'GET' || req.method === 'HEAD') return true;
  const origin = req.headers.origin;
  if (!origin) return true; // permintaan non-browser (curl) tetap wajib sesi yang valid
  try { return new URL(origin).host === req.headers.host; } catch { return false; }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!sameOriginOnly(req)) return res.status(403).json({ success: false, error: 'Asal permintaan tidak diizinkan.' });
  if (!currentSession(req)) {
    return res.status(401).json({ success: false, error: 'Sesi admin tidak valid atau sudah berakhir. Silakan login ulang.' });
  }
  next();
}

export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'same-origin');
  if (req.path.startsWith('/api/')) res.setHeader('Cache-Control', 'no-store');
  next();
}

// ---------------------------------------------------------------- rute

export const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export function registerAuthRoutes(app: Express, ensureDatabase: () => Promise<boolean>) {
  const json = express.json({ limit: '2kb' });

  app.post('/api/auth/admin/login', json, async (req, res) => {
    if (!sameOriginOnly(req)) return res.status(403).json({ success: false, message: 'Asal permintaan tidak diizinkan.' });
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const ipA = getAttempt(ipAttempts, ip);
    const accA = getAttempt(accountAttempts, ADMIN_USERNAME);

    const wait = lockRemainingSec(ipA, accA);
    if (wait > 0) {
      res.setHeader('Retry-After', String(wait));
      return res.status(429).json({
        success: false,
        message: `Terlalu banyak percobaan gagal. Coba lagi dalam ${Math.ceil(wait / 60)} menit.`,
        retryAfter: wait,
      });
    }

    const username = String(req.body?.username ?? '').trim().toLowerCase();
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!password || password.length > 256) {
      return res.status(400).json({ success: false, message: 'Harap masukkan nama pengguna dan kata sandi.' });
    }

    if (!(await ensureDatabase())) {
      return res.status(503).json({ success: false, message: 'Database belum siap. Pastikan MySQL aktif.' });
    }

    try {
      await ensureAdminAccount();
      const rec = await readAdmin();
      // Hash selalu diperiksa, walau username salah, agar waktu respons tidak membocorkan apa pun.
      const ok = await verifyPassword(password, rec?.hash ?? 'scrypt$32768$8$1$AAAAAAAAAAAAAAAAAAAAAA==$AAAA');
      if (!ok || username !== ADMIN_USERNAME || !rec) {
        registerFail(ipA, IP_MAX);
        registerFail(accA, ACCOUNT_MAX);
        console.warn(`[AUTH] Login admin GAGAL dari ${ip} (${new Date().toISOString()})`);
        await sleep(600);
        return res.status(401).json({ success: false, message: 'Username atau kata sandi tidak cocok.' });
      }

      ipA.fails = 0; ipA.level = 0; accA.fails = 0; accA.level = 0;
      const token = crypto.randomBytes(32).toString('base64url');
      const now = Date.now();
      sessions.set(sha256(token), { created: now, lastSeen: now });
      setSessionCookie(req, res, token);
      console.log(`[AUTH] Login admin berhasil dari ${ip} (${new Date().toISOString()})`);
      res.json({ success: true });
    } catch (err: any) {
      console.error('[AUTH] error:', err?.message);
      res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
    }
  });

  // Admin mengganti kata sandinya sendiri (wajib sesi aktif + kata sandi lama)
  app.post('/api/auth/admin/change-password', requireAdmin, json, async (req, res) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const ipA = getAttempt(ipAttempts, ip);
    const accA = getAttempt(accountAttempts, ADMIN_USERNAME);
    const wait = lockRemainingSec(ipA, accA);
    if (wait > 0) {
      res.setHeader('Retry-After', String(wait));
      return res.status(429).json({ success: false, message: `Terlalu banyak percobaan gagal. Coba lagi dalam ${Math.ceil(wait / 60)} menit.` });
    }

    const current = typeof req.body?.currentPassword === 'string' ? req.body.currentPassword : '';
    const next = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';
    if (!current || !next) return res.status(400).json({ success: false, message: 'Isi kata sandi lama dan kata sandi baru.' });
    if (current.length > 256) return res.status(400).json({ success: false, message: 'Data tidak valid.' });

    try {
      const rec = await readAdmin();
      if (!rec || !(await verifyPassword(current, rec.hash))) {
        registerFail(ipA, IP_MAX);
        registerFail(accA, ACCOUNT_MAX);
        console.warn(`[AUTH] Ganti sandi admin GAGAL (sandi lama salah) dari ${ip}`);
        await sleep(600);
        return res.status(401).json({ success: false, message: 'Kata sandi lama salah.' });
      }
      const problem = checkPasswordPolicy(next);
      if (problem) return res.status(400).json({ success: false, message: problem });
      if (next === current) return res.status(400).json({ success: false, message: 'Kata sandi baru harus berbeda dari yang lama.' });

      await saveAdminPassword(next, currentSession(req)?.key);
      console.log(`[AUTH] Kata sandi admin diganti dari ${ip} (${new Date().toISOString()})`);
      res.json({ success: true, message: 'Kata sandi berhasil diganti. Sesi admin di perangkat lain telah dikeluarkan.' });
    } catch (err: any) {
      console.error('[AUTH] error:', err?.message);
      res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
    }
  });

  app.get('/api/auth/me', (req, res) => {
    res.json({ authenticated: !!currentSession(req) });
  });

  app.post('/api/auth/logout', (req, res) => {
    if (!sameOriginOnly(req)) return res.status(403).json({ success: false });
    const cur = currentSession(req);
    if (cur) sessions.delete(cur.key);
    clearSessionCookie(req, res);
    res.json({ success: true });
  });
}
