import crypto from 'crypto';
import express from 'express';
import type { Express } from 'express';
import { db } from './db';
import {
  hashPassword, verifyPassword, requireAdmin, sameOriginOnly, sleep,
  getAttempt, registerFail, lockRemainingSec,
  userIpAttempts, userNameAttempts, USER_IP_MAX, USER_NAME_MAX,
} from './auth';

/**
 * LOGIN & KATA SANDI KEPSEK / GURU / SISWA (diperiksa di server)
 *
 *  - Sandi yang diatur Admin disimpan sebagai hash scrypt di MySQL (tabel pengaturan_aplikasi).
 *  - Akun yang BELUM pernah diatur Admin tetap bisa masuk dengan sandi bawaan lama
 *    (guru123 / siswa123 / kepsek123 / NIP / NISN / NIS) sampai Admin menggantinya.
 *  - Begitu Admin mengatur sandi sebuah akun, sandi bawaan akun itu otomatis TIDAK berlaku lagi.
 *  - Login dibatasi percobaannya (per IP dan per username).
 *
 * Identitas akun = "peran:referenceId", contoh "siswa:std-1", "guru:tch-3", "kepsek:kepsek".
 * Akun contoh 'guru' / 'siswa' memakai referenceId "demo".
 */

const STORE_KEY = 'user_credentials';
type Role = 'kepsek' | 'guru' | 'siswa';
type CredMap = Record<string, { hash: string; updatedAt: string }>;

// ------------------------------------------------------------- penyimpanan

let chain: Promise<unknown> = Promise.resolve();
/** Serialisasi baca-ubah-tulis agar dua perubahan sandi bersamaan tidak saling menimpa. */
function serialized<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(fn);
  chain = run.catch(() => undefined);
  return run;
}

async function readCreds(): Promise<CredMap> {
  const [rows] = await db.query<any[]>('SELECT nilai FROM pengaturan_aplikasi WHERE kunci = ?', [STORE_KEY]);
  if (!rows[0]) return {};
  try {
    const parsed = JSON.parse(rows[0].nilai);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch { return {}; }
}

async function writeCreds(map: CredMap): Promise<void> {
  await db.query(
    'INSERT INTO pengaturan_aplikasi (kunci, nilai) VALUES (?, ?) ON DUPLICATE KEY UPDATE nilai = VALUES(nilai)',
    [STORE_KEY, JSON.stringify(map)]
  );
}

// ------------------------------------------------------------- aturan sandi

const WEAK = new Set([
  '12345678', '123456789', '1234567890', 'password', 'password1', 'qwertyui', 'siakad123',
  'guru123', 'siswa123', 'kepsek123', 'admin123', 'sekolah123', '11111111', '00000000',
]);

/** Aturan sandi guru/kepsek/siswa (lebih ringan dari admin agar murid SD masih bisa mengingat). */
export function checkUserPasswordPolicy(pw: string, username: string): string | null {
  if (pw.length < 8) return 'Kata sandi minimal 8 karakter.';
  if (pw.length > 128) return 'Kata sandi maksimal 128 karakter.';
  if (/^(.)\1+$/.test(pw)) return 'Kata sandi tidak boleh berisi karakter yang sama semua.';
  if (WEAK.has(pw.toLowerCase())) return 'Kata sandi terlalu mudah ditebak. Pilih yang lain.';
  if (username && pw.toLowerCase() === username.toLowerCase()) return 'Kata sandi tidak boleh sama dengan username/NISN/NIP.';
  if (!/[a-zA-Z]/.test(pw) || !/[0-9]/.test(pw)) return 'Kata sandi harus mengandung huruf dan angka.';
  return null;
}

// ------------------------------------------------------------- bantu

const sha = (v: string) => crypto.createHash('sha256').update(v).digest();
function safeEqual(a: string, b: string): boolean {
  return crypto.timingSafeEqual(sha(a), sha(b));
}
const ID_RE = /^[A-Za-z0-9._:-]{1,50}$/;

interface Candidate { role: Role; refId: string; defaults: string[]; returnRef?: string }

async function resolveCandidates(rawUser: string): Promise<Candidate[]> {
  const u = rawUser.trim();
  const lower = u.toLowerCase();
  const out: Candidate[] = [];

  if (lower === 'kepsek') out.push({ role: 'kepsek', refId: 'kepsek', defaults: ['kepsek123'] });
  if (lower === 'guru') out.push({ role: 'guru', refId: 'demo', defaults: ['guru123'] });
  if (lower === 'siswa') out.push({ role: 'siswa', refId: 'demo', defaults: ['siswa123'] });

  const [teachers] = await db.query<any[]>(
    'SELECT id, nip FROM guru WHERE nip = ? OR LOWER(email) = ? LIMIT 5', [u, lower]
  );
  for (const t of teachers) {
    out.push({ role: 'guru', refId: t.id, returnRef: t.id, defaults: ['guru123', String(t.nip || '')] });
  }

  const [students] = await db.query<any[]>(
    'SELECT id, nis, nisn FROM siswa WHERE nisn = ? OR nis = ? LIMIT 5', [u, u]
  );
  for (const s of students) {
    out.push({ role: 'siswa', refId: s.id, returnRef: s.id, defaults: ['siswa123', String(s.nisn || ''), String(s.nis || '')] });
  }
  return out;
}

// ------------------------------------------------------------- rute

export function registerUserAuthRoutes(app: Express, ensureDatabase: () => Promise<boolean>) {
  const json = express.json({ limit: '4kb' });

  // ---- Login kepsek / guru / siswa
  app.post('/api/auth/user/login', json, async (req, res) => {
    if (!sameOriginOnly(req)) return res.status(403).json({ success: false, message: 'Asal permintaan tidak diizinkan.' });

    const username = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password.trim() : '';
    if (!username || !password || username.length > 100 || password.length > 256) {
      return res.status(400).json({ success: false, message: 'Harap masukkan nama pengguna dan kata sandi Anda.' });
    }
    // Admin tidak boleh masuk lewat jalur ini
    if (username.toLowerCase() === 'admin') {
      return res.status(400).json({ success: false, message: 'Gunakan form login admin.' });
    }

    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const ipA = getAttempt(userIpAttempts, ip);
    const nameA = getAttempt(userNameAttempts, username.toLowerCase());
    const wait = lockRemainingSec(ipA, nameA);
    if (wait > 0) {
      res.setHeader('Retry-After', String(wait));
      return res.status(429).json({
        success: false,
        message: `Terlalu banyak percobaan gagal. Coba lagi dalam ${Math.ceil(wait / 60)} menit.`,
      });
    }

    if (!(await ensureDatabase())) {
      return res.status(503).json({ success: false, message: 'Database belum siap. Hubungi Administrator (pastikan MySQL aktif).' });
    }

    try {
      const candidates = await resolveCandidates(username);
      const creds = await readCreds();
      let matched: Candidate | null = null;

      for (const c of candidates) {
        const rec = creds[`${c.role}:${c.refId}`];
        if (rec) {
          // Admin sudah mengatur sandi akun ini → hanya sandi itu yang berlaku
          if (await verifyPassword(password, rec.hash)) { matched = c; break; }
        } else if (c.defaults.some(d => d && safeEqual(password, d))) {
          matched = c; break;
        }
      }
      // Jika tidak ada kandidat, tetap buang waktu hash agar waktu respons tidak membocorkan apa pun.
      if (candidates.length === 0) await verifyPassword(password, 'scrypt$32768$8$1$AAAAAAAAAAAAAAAAAAAAAA==$AAAA');

      if (!matched) {
        registerFail(ipA, USER_IP_MAX);
        registerFail(nameA, USER_NAME_MAX);
        await sleep(500);
        return res.status(401).json({
          success: false,
          message: 'Username atau kata sandi tidak cocok. Silakan periksa kembali kredensial Anda atau hubungi Administrator Sekolah.',
        });
      }

      nameA.fails = 0; nameA.level = 0;
      res.json({ success: true, role: matched.role, referenceId: matched.returnRef });
    } catch (err: any) {
      console.error('[AUTH] user login error:', err?.message);
      res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
    }
  });

  // ---- Admin mengatur sandi kepsek / guru / siswa
  app.put('/api/admin/user-password', requireAdmin, json, async (req, res) => {
    const role = req.body?.role as Role;
    const username = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
    const referenceId = typeof req.body?.referenceId === 'string' ? req.body.referenceId.trim() : '';
    const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword.trim() : '';

    if (!['kepsek', 'guru', 'siswa'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Peran akun tidak valid (admin diganti lewat menu profil).' });
    }
    const problem = checkUserPasswordPolicy(newPassword, username);
    if (problem) return res.status(400).json({ success: false, message: problem });

    if (!(await ensureDatabase())) {
      return res.status(503).json({ success: false, message: 'Database belum siap. Pastikan MySQL aktif.' });
    }

    try {
      const keys: string[] = [];
      if (role === 'kepsek') {
        keys.push('kepsek:kepsek');
      } else {
        if (referenceId) {
          if (!ID_RE.test(referenceId)) return res.status(400).json({ success: false, message: 'ID akun tidak valid.' });
          const table = role === 'guru' ? 'guru' : 'siswa';
          const [found] = await db.query<any[]>(`SELECT id FROM \`${table}\` WHERE id = ? LIMIT 1`, [referenceId]);
          if (found[0]) keys.push(`${role}:${referenceId}`);
        }
        // akun contoh "guru" / "siswa" ikut diatur agar sandi lamanya tidak tetap berlaku
        if (username.toLowerCase() === role) keys.push(`${role}:demo`);
        if (keys.length === 0) {
          return res.status(404).json({
            success: false,
            message: `Data ${role === 'guru' ? 'guru' : 'siswa'} ini belum tersimpan di MySQL. Buka menu Backup lalu klik "Sinkronkan Data ke MySQL", kemudian coba lagi.`,
          });
        }
      }

      const hash = await hashPassword(newPassword);
      await serialized(async () => {
        const creds = await readCreds();
        const now = new Date().toISOString();
        for (const k of keys) creds[k] = { hash, updatedAt: now };
        await writeCreds(creds);
        const pend = await readReqs();
        const left = pend.filter(r => !keys.includes(`${r.role}:${r.refId}`));
        if (left.length !== pend.length) await writeReqs(left);
      });
      // buka kunci akun ini jika sebelumnya terkunci karena salah sandi
      if (username) userNameAttempts.delete(username.toLowerCase());

      console.log(`[AUTH] Admin mengatur sandi akun ${keys.join(', ')} (${new Date().toISOString()})`);
      res.json({ success: true });
    } catch (err: any) {
      console.error('[AUTH] set user password error:', err?.message);
      res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
    }
  });


  // ---- Lupa sandi: pengguna mengirim permintaan, Admin yang mengatur sandi barunya
  const REQ_KEY = 'reset_requests';
  type ResetReq = { id: string; role: Role; refId: string; username: string; name: string; contact: string; at: string };
  const readReqs = async (): Promise<ResetReq[]> => {
    const [rows] = await db.query<any[]>('SELECT nilai FROM pengaturan_aplikasi WHERE kunci = ?', [REQ_KEY]);
    try { const p = JSON.parse(rows[0]?.nilai || '[]'); return Array.isArray(p) ? p : []; } catch { return []; }
  };
  const writeReqs = (list: ResetReq[]) => db.query(
    'INSERT INTO pengaturan_aplikasi (kunci, nilai) VALUES (?, ?) ON DUPLICATE KEY UPDATE nilai = VALUES(nilai)',
    [REQ_KEY, JSON.stringify(list)]
  );
  const forgotHits = new Map<string, { n: number; start: number }>();
  const GENERIC = 'Permintaan diterima. Administrator sekolah akan memeriksa data Anda dan memberi tahu kata sandi baru secara langsung.';

  app.post('/api/auth/user/forgot', json, async (req, res) => {
    if (!sameOriginOnly(req)) return res.status(403).json({ success: false, message: 'Asal permintaan tidak diizinkan.' });
    const username = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
    const name = typeof req.body?.name === 'string' ? req.body.name.trim().slice(0, 100) : '';
    const contact = typeof req.body?.contact === 'string' ? req.body.contact.trim().slice(0, 40) : '';
    if (!username || username.length > 100 || name.length < 3) {
      return res.status(400).json({ success: false, message: 'Isi username/NISN/NIP dan nama lengkap Anda.' });
    }
    if (username.toLowerCase() === 'admin') {
      return res.status(400).json({ success: false, message: 'Kata sandi admin diatur lewat server (lihat panduan: npm run admin:password).' });
    }
    // batasi 5 permintaan / jam / IP
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const h = forgotHits.get(ip);
    if (!h || now - h.start > 3600_000) forgotHits.set(ip, { n: 1, start: now });
    else if (++h.n > 5) return res.status(429).json({ success: false, message: 'Terlalu banyak permintaan. Coba lagi satu jam lagi.' });

    if (!(await ensureDatabase())) {
      return res.status(503).json({ success: false, message: 'Database belum siap. Hubungi Administrator.' });
    }
    try {
      const cands = await resolveCandidates(username);
      // Respons selalu sama agar orang luar tidak bisa menebak akun mana yang ada.
      if (cands.length > 0) {
        const c = cands[0];
        const list = await serialized(async () => {
          const cur = (await readReqs()).filter(r => !(r.role === c.role && r.refId === c.refId));
          cur.unshift({ id: crypto.randomBytes(6).toString('hex'), role: c.role, refId: c.refId, username, name, contact, at: new Date().toISOString() });
          const trimmed = cur.slice(0, 100);
          await writeReqs(trimmed);
          return trimmed;
        });
        console.log(`[AUTH] Permintaan reset sandi: ${c.role}:${c.refId} (${list.length} menunggu)`);
      }
      res.json({ success: true, message: GENERIC });
    } catch (err: any) {
      console.error('[AUTH] forgot error:', err?.message);
      res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
    }
  });

  app.get('/api/admin/reset-requests', requireAdmin, async (_req, res) => {
    try {
      if (!(await ensureDatabase())) return res.json({ success: true, requests: [] });
      res.json({ success: true, requests: await readReqs() });
    } catch { res.json({ success: true, requests: [] }); }
  });

  app.delete('/api/admin/reset-requests/:id', requireAdmin, async (req, res) => {
    try {
      const id = String(req.params.id);
      await serialized(async () => writeReqs((await readReqs()).filter(r => r.id !== id)));
      res.json({ success: true });
    } catch { res.status(500).json({ success: false, message: 'Gagal menghapus permintaan.' }); }
  });

  // ---- Daftar akun yang sandinya sudah diatur Admin (tanpa hash), untuk label di tabel
  app.get('/api/admin/user-password/list', requireAdmin, async (_req, res) => {
    try {
      if (!(await ensureDatabase())) return res.json({ success: true, keys: {} });
      const creds = await readCreds();
      const keys: Record<string, string> = {};
      for (const [k, v] of Object.entries(creds)) keys[k] = v.updatedAt;
      res.json({ success: true, keys });
    } catch {
      res.json({ success: true, keys: {} });
    }
  });
}
