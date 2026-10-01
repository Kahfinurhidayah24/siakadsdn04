import './src/server/env';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db, testConnection, DB_CONFIG } from './src/server/db';
import { initDatabase } from './src/server/schema';
import { loadState, applyChanges, tableCounts, COLLECTIONS, type Changes } from './src/server/sync';
import { registerAuthRoutes, requireAdmin, securityHeaders, ensureAdminAccount } from './src/server/auth';
import { registerUserAuthRoutes } from './src/server/userAuth';

let dbReady = false;
let lastInitError = '';

/** Menyiapkan database; bisa dicoba ulang kapan saja (mis. setelah MySQL XAMPP di-START). */
async function ensureDatabase(): Promise<boolean> {
  if (dbReady) return true;
  try {
    await initDatabase();
    dbReady = true;
    lastInitError = '';
    console.log(`✅ MySQL siap: database "${DB_CONFIG.database}" @ ${DB_CONFIG.host}:${DB_CONFIG.port}`);
  } catch (err: any) {
    lastInitError = err?.message || String(err);
  }
  return dbReady;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.disable('x-powered-by');
  // Di belakang proxy/hosting (Nginx, Cloudflare, dsb.) isi TRUST_PROXY=1 di .env
  // agar IP asli pengunjung & status HTTPS terbaca benar.
  if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY) || 1);
  app.use(securityHeaders);

  // Rute login/logout admin (memakai pembaca JSON kecil sendiri, harus di atas express.json besar)
  registerAuthRoutes(app, ensureDatabase);
  registerUserAuthRoutes(app, ensureDatabase);

  app.use(express.json({ limit: '100mb' }));

  // 1. API Health Check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', name: 'SIAKAD SDN Lubang Buaya 04 Pagi' });
  });

  // 2. Status koneksi MySQL
  app.get('/api/db/status', requireAdmin, async (req, res) => {
    const ok = await ensureDatabase();
    if (!ok) {
      const conn = await testConnection();
      return res.json({
        success: false,
        connected: false,
        message: conn.success ? `Database belum siap: ${lastInitError}` : lastInitError || conn.message,
        database: DB_CONFIG.database,
      });
    }
    try {
      const [tables] = await db.query<any[]>('SHOW TABLES');
      const counts = await tableCounts();
      res.json({
        success: true,
        connected: true,
        message: `Terhubung ke MySQL — database "${DB_CONFIG.database}"`,
        database: DB_CONFIG.database,
        tables: tables.map((r) => Object.values(r)[0]),
        counts,
      });
    } catch (err: any) {
      res.json({ success: false, connected: false, message: err.message, database: DB_CONFIG.database });
    }
  });

  // 3. Ambil seluruh data dari MySQL (dipanggil aplikasi saat dibuka)
  app.get('/api/db/state', async (req, res) => {
    if (!(await ensureDatabase())) {
      return res.status(503).json({ success: false, error: lastInitError });
    }
    try {
      const counts = await tableCounts();
      const empty = counts.siswa === 0 && counts.guru === 0;
      const data = await loadState();
      res.json({ success: true, empty, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 4. Simpan perubahan (hanya baris yang berubah) — satu transaksi
  app.post('/api/db/sync', async (req, res) => {
    if (!(await ensureDatabase())) {
      return res.status(503).json({ success: false, error: lastInitError });
    }
    try {
      const result = await applyChanges((req.body?.changes || {}) as Changes);
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 5. Kirim SEMUA data aplikasi ke MySQL (tombol "Sinkronkan Data ke MySQL")
  //    Menimpa baris dengan id yang sama, tidak menghapus baris lain di database.
  app.post('/api/db/sync-all', requireAdmin, async (req, res) => {
    if (!(await ensureDatabase())) {
      return res.status(503).json({ success: false, message: lastInitError });
    }
    try {
      const changes: Changes = {};
      const synced: Record<string, number> = {};
      for (const key of Object.keys(COLLECTIONS)) {
        const items = Array.isArray(req.body?.[key]) ? req.body[key] : [];
        (changes as any)[key] = { upsert: items };
        synced[key] = items.length;
      }
      const result = await applyChanges(changes);
      res.json({
        success: true,
        syncedStudents: synced.students,
        syncedTeachers: synced.teachers,
        synced,
        skipped: result.skipped,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 6. Tema warna aplikasi (dipilih Admin, berlaku untuk semua akun)
  const THEME_KEY = 'tema';
  const HEX = /^#[0-9a-f]{6}$/i;

  app.get('/api/settings/theme', async (req, res) => {
    if (!(await ensureDatabase())) {
      return res.status(503).json({ success: false, error: lastInitError });
    }
    try {
      const [rows] = await db.query<any[]>('SELECT nilai FROM pengaturan_aplikasi WHERE kunci = ?', [THEME_KEY]);
      let theme = null;
      if (rows[0]) {
        try { theme = JSON.parse(rows[0].nilai); } catch { theme = null; }
      }
      res.json({ success: true, theme });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.put('/api/settings/theme', requireAdmin, async (req, res) => {
    const t = req.body?.theme;
    if (!t || typeof t.id !== 'string' || t.id.length > 20 || !HEX.test(t.bg) || !HEX.test(t.accent)) {
      return res.status(400).json({ success: false, error: 'Format tema tidak valid' });
    }
    if (!(await ensureDatabase())) {
      return res.status(503).json({ success: false, error: lastInitError });
    }
    try {
      const value = JSON.stringify({ id: t.id, bg: t.bg.toLowerCase(), accent: t.accent.toLowerCase() });
      await db.query(
        'INSERT INTO pengaturan_aplikasi (kunci, nilai) VALUES (?, ?) ON DUPLICATE KEY UPDATE nilai = VALUES(nilai)',
        [THEME_KEY, value]
      );
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 7. Logo & foto sampul sekolah (diatur Admin, berlaku untuk semua akun)
  const MEDIA_KEY = 'sekolah_media';
  const okImg = (v: any) => v === undefined || v === null || v === '' ||
    (typeof v === 'string' && /^data:image\/(png|jpe?g|webp);base64,/i.test(v) && v.length < 4_000_000);

  app.get('/api/settings/school-media', async (req, res) => {
    if (!(await ensureDatabase())) {
      return res.status(503).json({ success: false, error: lastInitError });
    }
    try {
      const [rows] = await db.query<any[]>('SELECT nilai FROM pengaturan_aplikasi WHERE kunci = ?', [MEDIA_KEY]);
      let media = null;
      if (rows[0]) {
        try { media = JSON.parse(rows[0].nilai); } catch { media = null; }
      }
      res.json({ success: true, media });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.put('/api/settings/school-media', requireAdmin, async (req, res) => {
    const m = req.body?.media;
    if (!m || typeof m !== 'object' || !okImg(m.logo) || !okImg(m.coverPhoto)) {
      return res.status(400).json({ success: false, error: 'Format gambar tidak valid (gunakan PNG/JPG/WEBP, maks ±3 MB)' });
    }
    if (!(await ensureDatabase())) {
      return res.status(503).json({ success: false, error: lastInitError });
    }
    try {
      const value = JSON.stringify({ logo: m.logo || '', coverPhoto: m.coverPhoto || '' });
      await db.query(
        'INSERT INTO pengaturan_aplikasi (kunci, nilai) VALUES (?, ?) ON DUPLICATE KEY UPDATE nilai = VALUES(nilai)',
        [MEDIA_KEY, value]
      );
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    if (await ensureDatabase()) {
      await ensureAdminAccount().catch((e) => console.error('Gagal menyiapkan akun admin:', e?.message));
    } else {
      console.warn(`⚠️  MySQL belum tersambung: ${lastInitError}`);
      console.warn('   Pastikan MySQL di XAMPP sudah di-START. Aplikasi tetap jalan (data disimpan di browser) dan akan tersambung otomatis setelah MySQL aktif.');
    }
  });
}

startServer();
