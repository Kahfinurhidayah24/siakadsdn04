import type { Express } from 'express';
import { db } from './db';
import { requireAdmin } from './auth';

/**
 * Rute modul SPK SAW:
 *  - Konfigurasi bobot kriteria, ambang kategori & mode periode (tabel pengaturan_aplikasi, kunci "saw_config")
 *  - Arsip hasil perankingan per periode (tabel hasil_saw)
 * Membaca terbuka (sama seperti data siswa lain di aplikasi); menulis/menghapus wajib sesi Admin.
 */

const CONFIG_KEY = 'saw_config';
const CATS = ['Sangat Baik', 'Baik', 'Cukup', 'Perlu Pembinaan'];

const isNum = (v: any, min: number, max: number) => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;

function validConfig(c: any): string | null {
  if (!c || typeof c !== 'object') return 'Konfigurasi tidak valid';
  if (!Array.isArray(c.criteria) || c.criteria.length < 1 || c.criteria.length > 12) return 'Daftar kriteria tidak valid';
  for (const k of c.criteria) {
    if (typeof k.code !== 'string' || k.code.length > 10) return 'Kode kriteria tidak valid';
    if (k.type !== 'benefit' && k.type !== 'cost') return 'Jenis kriteria harus benefit atau cost';
    if (!isNum(k.weight, 0, 100)) return 'Bobot harus 0–100';
  }
  const total = c.criteria.reduce((s: number, k: any) => s + k.weight, 0);
  if (Math.abs(total - 100) > 0.01) return 'Total bobot harus 100%';
  const t = c.thresholds;
  if (!t || !isNum(t.sangatBaik, 0, 1) || !isNum(t.baik, 0, 1) || !isNum(t.cukup, 0, 1)) return 'Ambang kategori tidak valid';
  if (!(t.sangatBaik > t.baik && t.baik > t.cukup && t.cukup > 0)) return 'Ambang kategori harus menurun (Sangat Baik > Baik > Cukup > 0)';
  if (typeof c.periodOnly !== 'boolean') return 'Mode periode tidak valid';
  return null;
}

export function registerSawRoutes(app: Express, ensureDatabase: () => Promise<boolean>) {
  // ---- Konfigurasi
  app.get('/api/saw/config', async (_req, res) => {
    if (!(await ensureDatabase())) return res.status(503).json({ success: false, error: 'Database belum siap' });
    try {
      const [rows] = await db.query<any[]>('SELECT nilai FROM pengaturan_aplikasi WHERE kunci = ?', [CONFIG_KEY]);
      let config = null;
      if (rows[0]) { try { config = JSON.parse(rows[0].nilai); } catch { config = null; } }
      res.json({ success: true, config });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.put('/api/saw/config', requireAdmin, async (req, res) => {
    const c = req.body?.config;
    const problem = validConfig(c);
    if (problem) return res.status(400).json({ success: false, error: problem });
    if (!(await ensureDatabase())) return res.status(503).json({ success: false, error: 'Database belum siap' });
    try {
      const value = JSON.stringify({
        criteria: c.criteria.map((k: any) => ({ code: k.code, type: k.type, weight: k.weight })),
        thresholds: { sangatBaik: c.thresholds.sangatBaik, baik: c.thresholds.baik, cukup: c.thresholds.cukup },
        periodOnly: c.periodOnly,
      });
      await db.query(
        'INSERT INTO pengaturan_aplikasi (kunci, nilai) VALUES (?, ?) ON DUPLICATE KEY UPDATE nilai = VALUES(nilai)',
        [CONFIG_KEY, value]
      );
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ---- Arsip hasil
  app.get('/api/saw/archive', async (_req, res) => {
    if (!(await ensureDatabase())) return res.status(503).json({ success: false, error: 'Database belum siap' });
    try {
      const [rows] = await db.query<any[]>(
        `SELECT id, tahun_ajaran, semester, cakupan, jumlah_siswa, rata_vi, dibuat_oleh, dibuat_pada
         FROM hasil_saw ORDER BY dibuat_pada DESC LIMIT 200`
      );
      res.json({ success: true, items: rows });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/saw/archive/:id', async (req, res) => {
    if (!(await ensureDatabase())) return res.status(503).json({ success: false, error: 'Database belum siap' });
    try {
      const [rows] = await db.query<any[]>('SELECT * FROM hasil_saw WHERE id = ?', [req.params.id]);
      if (!rows[0]) return res.status(404).json({ success: false, error: 'Arsip tidak ditemukan' });
      const r = rows[0];
      res.json({
        success: true,
        item: {
          id: r.id, tahun_ajaran: r.tahun_ajaran, semester: r.semester, cakupan: r.cakupan,
          jumlah_siswa: r.jumlah_siswa, rata_vi: Number(r.rata_vi), dibuat_oleh: r.dibuat_oleh, dibuat_pada: r.dibuat_pada,
          kriteria: JSON.parse(r.kriteria_json), hasil: JSON.parse(r.hasil_json),
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/saw/archive', requireAdmin, async (req, res) => {
    const b = req.body || {};
    if (typeof b.tahunAjaran !== 'string' || !/^\d{4}\/\d{4}$/.test(b.tahunAjaran)) return res.status(400).json({ success: false, error: 'Tahun ajaran tidak valid' });
    if (b.semester !== 'Ganjil' && b.semester !== 'Genap') return res.status(400).json({ success: false, error: 'Semester tidak valid' });
    if (typeof b.cakupan !== 'string' || b.cakupan.length > 10) return res.status(400).json({ success: false, error: 'Cakupan tidak valid' });
    if (!Array.isArray(b.hasil) || b.hasil.length === 0 || b.hasil.length > 2000) return res.status(400).json({ success: false, error: 'Data hasil kosong atau terlalu besar' });
    if (!Array.isArray(b.kriteria)) return res.status(400).json({ success: false, error: 'Data kriteria tidak valid' });
    const hasil = b.hasil.map((r: any) => ({
      rank: Number(r.rank), studentId: String(r.studentId ?? ''), nisn: String(r.nisn ?? ''), name: String(r.name ?? ''),
      classId: String(r.classId ?? ''), values: Array.isArray(r.values) ? r.values.map(Number) : [],
      preference: Number(r.preference), category: CATS.includes(r.category) ? r.category : 'Perlu Pembinaan',
    }));
    if (!(await ensureDatabase())) return res.status(503).json({ success: false, error: 'Database belum siap' });
    try {
      const id = `saw-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      const avg = hasil.reduce((s: number, r: any) => s + (Number.isFinite(r.preference) ? r.preference : 0), 0) / hasil.length;
      // Satu arsip per (tahun, semester, cakupan): yang lama diganti agar tidak menumpuk.
      await db.query('DELETE FROM hasil_saw WHERE tahun_ajaran = ? AND semester = ? AND cakupan = ?', [b.tahunAjaran, b.semester, b.cakupan]);
      await db.query(
        `INSERT INTO hasil_saw (id, tahun_ajaran, semester, cakupan, jumlah_siswa, rata_vi, kriteria_json, hasil_json, dibuat_oleh)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, b.tahunAjaran, b.semester, b.cakupan, hasil.length, avg.toFixed(4),
          JSON.stringify(b.kriteria), JSON.stringify(hasil), String(b.dibuatOleh ?? 'Admin').slice(0, 150)]
      );
      res.json({ success: true, id });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/saw/archive/:id', requireAdmin, async (req, res) => {
    if (!(await ensureDatabase())) return res.status(503).json({ success: false, error: 'Database belum siap' });
    try {
      await db.query('DELETE FROM hasil_saw WHERE id = ?', [req.params.id]);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
}
