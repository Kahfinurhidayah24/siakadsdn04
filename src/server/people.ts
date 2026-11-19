import crypto from 'crypto';
import type { Express, Request, Response } from 'express';
import type { PoolConnection } from 'mysql2/promise';
import { db } from './db';
import { requireAdmin } from './auth';
import { COLLECTIONS, upsertRows, ensureClasses, loadSubjectNames } from './sync';

/**
 * TAMBAH / UBAH / HAPUS GURU & SISWA — LANGSUNG KE MYSQL
 *
 * Berbeda dengan sinkronisasi umum (yang berjalan di latar belakang), rute di sini
 * disimpan SEKARANG dalam satu transaksi dan hasilnya (berhasil / gagal + alasannya)
 * dikembalikan ke layar Admin. Jadi data yang muncul di aplikasi pasti sudah ada di
 * database, tanpa perlu membuka phpMyAdmin.
 *
 * Semua rute wajib sesi Admin.
 */

class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

const str = (v: any, max: number): string => (v === undefined || v === null ? '' : String(v).trim().slice(0, max));
const IMG_RE = /^data:image\/(png|jpe?g|webp|gif);base64,/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const CLASS_RE = /^[A-Za-z0-9]{1,10}$/;
const rid = () => crypto.randomBytes(4).toString('hex');

function img(v: any): string | undefined {
  if (typeof v !== 'string' || !v) return undefined;
  if (/^https?:\/\//i.test(v) && v.length < 2000) return v; // foto lama berupa tautan
  if (!IMG_RE.test(v)) throw new HttpError(400, 'Format foto tidak valid (gunakan PNG/JPG/WEBP).');
  if (v.length > 4_000_000) throw new HttpError(400, 'Ukuran foto terlalu besar (maks ±3 MB).');
  return v;
}

function dateStr(v: any, label: string, required = false): string {
  const t = str(v, 10);
  if (!t) {
    if (required) throw new HttpError(400, `${label} wajib diisi.`);
    return '';
  }
  if (!DATE_RE.test(t) || Number.isNaN(Date.parse(t))) throw new HttpError(400, `${label} tidak valid (format YYYY-MM-DD).`);
  return t;
}

// ---------------------------------------------------------------- GURU

const TEACHER_STATUS = ['PNS', 'PPPK', 'Honorer'];

function cleanTeacher(raw: any, id: string): any {
  if (!raw || typeof raw !== 'object') throw new HttpError(400, 'Data guru tidak valid.');
  const name = str(raw.name, 150);
  const nip = str(raw.nip, 30);
  if (!name) throw new HttpError(400, 'Nama guru wajib diisi.');
  if (!nip) throw new HttpError(400, 'NIP wajib diisi (dipakai sebagai username login guru).');
  const status = str(raw.status, 20) || 'PNS';
  if (!TEACHER_STATUS.includes(status)) throw new HttpError(400, 'Status kepegawaian harus PNS, PPPK, atau Honorer.');
  const email = str(raw.email, 100);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, 'Format email tidak valid.');
  const subjects = Array.isArray(raw.subjects) ? raw.subjects.map((x: any) => str(x, 100)).filter(Boolean).slice(0, 30) : [];
  const isWali = raw.isWaliKelas === true;
  const cls = str(raw.assignedClass, 10);
  if (isWali && cls && !CLASS_RE.test(cls)) throw new HttpError(400, 'Kode kelas wali tidak valid.');
  return {
    id,
    nip,
    nuptk: str(raw.nuptk, 30) || undefined,
    name,
    gender: raw.gender === 'P' ? 'P' : 'L',
    birthPlace: str(raw.birthPlace, 100),
    birthDate: dateStr(raw.birthDate, 'Tanggal lahir'),
    phone: str(raw.phone, 30),
    email,
    photo: img(raw.photo),
    subjects,
    isWaliKelas: isWali && !!cls,
    assignedClass: isWali && cls ? cls : undefined,
    status,
  };
}

async function assertTeacherUnique(conn: PoolConnection, t: any) {
  const [byNip] = await conn.query<any[]>('SELECT nama_lengkap FROM guru WHERE nip = ? AND id <> ? LIMIT 1', [t.nip, t.id]);
  if (byNip[0]) throw new HttpError(409, `NIP ${t.nip} sudah dipakai guru lain (${byNip[0].nama_lengkap}).`);
  if (t.email) {
    const [byMail] = await conn.query<any[]>('SELECT nama_lengkap FROM guru WHERE LOWER(email) = ? AND id <> ? LIMIT 1', [t.email.toLowerCase(), t.id]);
    if (byMail[0]) throw new HttpError(409, `Email ${t.email} sudah dipakai guru lain (${byMail[0].nama_lengkap}).`);
  }
}

/** Satu kelas hanya boleh punya satu wali: wali lama dilepas. Mengembalikan guru yang ikut berubah. */
async function releaseOtherWali(conn: PoolConnection, t: any): Promise<string[]> {
  if (!t.isWaliKelas || !t.assignedClass) return [];
  const [rows] = await conn.query<any[]>('SELECT id FROM guru WHERE wali_kelas_id = ? AND id <> ?', [t.assignedClass, t.id]);
  if (rows.length) {
    await conn.query('UPDATE guru SET is_wali_kelas = 0, wali_kelas_id = NULL WHERE wali_kelas_id = ? AND id <> ?', [t.assignedClass, t.id]);
  }
  return rows.map((r) => String(r.id));
}

// ---------------------------------------------------------------- SISWA

const STUDENT_STATUS = ['Aktif', 'Lulus', 'Mutasi Keluar', 'Pindah Kelas'];

function cleanStudent(raw: any, id: string): any {
  if (!raw || typeof raw !== 'object') throw new HttpError(400, 'Data siswa tidak valid.');
  const name = str(raw.name, 150);
  const nisn = str(raw.nisn, 20);
  const classId = str(raw.classId, 10);
  if (!name) throw new HttpError(400, 'Nama siswa wajib diisi.');
  if (!nisn) throw new HttpError(400, 'NISN wajib diisi (dipakai sebagai username login siswa).');
  if (!classId || !CLASS_RE.test(classId)) throw new HttpError(400, 'Kelas wajib dipilih.');
  const status = str(raw.status, 20) || 'Aktif';
  if (!STUDENT_STATUS.includes(status)) throw new HttpError(400, 'Status siswa tidak valid.');
  const email = str(raw.email, 100);
  const p = raw.parent && typeof raw.parent === 'object' ? raw.parent : {};
  return {
    id,
    nis: str(raw.nis, 20),
    nisn,
    name,
    gender: raw.gender === 'P' ? 'P' : 'L',
    birthPlace: str(raw.birthPlace, 100),
    birthDate: dateStr(raw.birthDate, 'Tanggal lahir'),
    religion: str(raw.religion, 50) || 'Islam',
    address: str(raw.address, 1000),
    phone: str(raw.phone, 30),
    email,
    photo: img(raw.photo),
    signature: img(raw.signature),
    admissionYear: str(raw.admissionYear, 10) || String(new Date().getFullYear()),
    classId,
    status,
    parent: {
      fatherName: str(p.fatherName, 100),
      motherName: str(p.motherName, 100),
      guardianName: str(p.guardianName, 100) || undefined,
      fatherOccupation: str(p.fatherOccupation, 100),
      motherOccupation: str(p.motherOccupation, 100),
      phone: str(p.phone, 30),
      address: str(p.address, 1000),
      nik: str(p.nik, 30) || undefined,
    },
  };
}

/** NIS berikutnya yang pasti belum dipakai: TTNNxxx (tahun masuk + 04 + urutan). */
async function nextNis(conn: PoolConnection, admissionYear: string, taken: { has(nis: string): boolean }): Promise<string> {
  const prefix = `${(admissionYear || '2025').slice(-2)}04`;
  const [rows] = await conn.query<any[]>('SELECT nis FROM siswa WHERE nis LIKE ?', [`${prefix}%`]);
  let max = 0;
  for (const r of rows) {
    const n = Number(String(r.nis).slice(prefix.length));
    if (Number.isFinite(n) && n > max) max = n;
  }
  let seq = max + 1;
  let nis = `${prefix}${String(seq).padStart(3, '0')}`;
  while (taken.has(nis)) { seq++; nis = `${prefix}${String(seq).padStart(3, '0')}`; }
  return nis;
}

async function assertStudentUnique(conn: PoolConnection, s: any) {
  const [byNisn] = await conn.query<any[]>('SELECT nama_lengkap FROM siswa WHERE nisn = ? AND id <> ? LIMIT 1', [s.nisn, s.id]);
  if (byNisn[0]) throw new HttpError(409, `NISN ${s.nisn} sudah terdaftar atas nama ${byNisn[0].nama_lengkap}.`);
  const [byNis] = await conn.query<any[]>('SELECT nama_lengkap FROM siswa WHERE nis = ? AND id <> ? LIMIT 1', [s.nis, s.id]);
  if (byNis[0]) throw new HttpError(409, `NIS ${s.nis} sudah dipakai siswa lain (${byNis[0].nama_lengkap}).`);
}

// ---------------------------------------------------------------- rute

async function inTransaction<T>(fn: (conn: PoolConnection) => Promise<T>): Promise<T> {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const out = await fn(conn);
    await conn.commit();
    return out;
  } catch (err) {
    await conn.rollback().catch(() => undefined);
    throw err;
  } finally {
    conn.release();
  }
}

function fail(res: Response, err: any) {
  if (err instanceof HttpError) return res.status(err.status).json({ success: false, message: err.message });
  const code = err?.code;
  let message = 'Terjadi kesalahan saat menyimpan ke database.';
  if (code === 'ER_DUP_ENTRY') message = 'Data ganda: ada data lain dengan nilai unik yang sama.';
  else if (code === 'ECONNREFUSED' || code === 'PROTOCOL_CONNECTION_LOST') message = 'MySQL tidak tersambung. Pastikan MySQL (XAMPP) aktif.';
  else if (code === 'ER_DATA_TOO_LONG') message = 'Ada isian yang terlalu panjang untuk kolom database.';
  console.error('[PEOPLE]', err?.code || '', err?.message);
  return res.status(500).json({ success: false, message });
}

export function registerPeopleRoutes(app: Express, ensureDatabase: () => Promise<boolean>) {
  const dbGuard = async (_req: Request, res: Response, next: () => void) => {
    if (!(await ensureDatabase())) {
      return res.status(503).json({ success: false, message: 'Database MySQL belum tersambung. Aktifkan MySQL lalu coba lagi.' });
    }
    next();
  };

  // ============ GURU ============
  app.post('/api/admin/teachers', requireAdmin, dbGuard, async (req, res) => {
    try {
      const teacher = cleanTeacher(req.body, `tch-${Date.now()}-${rid()}`);
      const changedWali = await inTransaction(async (conn) => {
        await assertTeacherUnique(conn, teacher);
        if (teacher.assignedClass) await ensureClasses(conn, [teacher.assignedClass]);
        const released = await releaseOtherWali(conn, teacher);
        await upsertRows(conn, COLLECTIONS.teachers, [teacher]);
        return released;
      });
      res.json({ success: true, teacher, releasedWali: changedWali });
    } catch (err) { fail(res, err); }
  });

  app.put('/api/admin/teachers/:id', requireAdmin, dbGuard, async (req, res) => {
    try {
      const id = String(req.params.id);
      let saved: any;
      await loadSubjectNames();
      const released = await inTransaction(async (conn) => {
        const [found] = await conn.query<any[]>('SELECT * FROM guru WHERE id = ? LIMIT 1', [id]);
        if (!found[0]) throw new HttpError(404, 'Data guru tidak ditemukan di database. Muat ulang halaman.');
        const existing = COLLECTIONS.teachers.fromRow(found[0]);
        // gabungkan: kolom yang tidak dikirim tetap seperti di database
        const body = req.body && typeof req.body === 'object' ? req.body : {};
        saved = cleanTeacher({ ...existing, ...body }, id);
        await assertTeacherUnique(conn, saved);
        if (saved.assignedClass) await ensureClasses(conn, [saved.assignedClass]);
        const rel = await releaseOtherWali(conn, saved);
        await upsertRows(conn, COLLECTIONS.teachers, [saved]);
        return rel;
      });
      res.json({ success: true, teacher: saved, releasedWali: released });
    } catch (err) { fail(res, err); }
  });

  app.delete('/api/admin/teachers/:id', requireAdmin, dbGuard, async (req, res) => {
    try {
      const id = String(req.params.id);
      const removedSchedules = await inTransaction(async (conn) => {
        // jadwal merujuk guru lewat foreign key → hapus dulu agar penghapusan guru tidak gagal
        const [sch] = await conn.query<any[]>('SELECT id FROM jadwal_pelajaran WHERE guru_id = ?', [id]);
        if (sch.length) await conn.query('DELETE FROM jadwal_pelajaran WHERE guru_id = ?', [id]);
        await conn.query('DELETE FROM guru WHERE id = ?', [id]);
        return sch.map((r) => String(r.id));
      });
      res.json({ success: true, removedScheduleIds: removedSchedules });
    } catch (err) { fail(res, err); }
  });

  // ============ SISWA ============
  app.post('/api/admin/students', requireAdmin, dbGuard, async (req, res) => {
    try {
      const student = cleanStudent(req.body, `std-${Date.now()}-${rid()}`);
      await inTransaction(async (conn) => {
        if (!student.nis) student.nis = await nextNis(conn, student.admissionYear, new Set());
        await assertStudentUnique(conn, student);
        await ensureClasses(conn, [student.classId]);
        await upsertRows(conn, COLLECTIONS.students, [student]);
      });
      res.json({ success: true, student });
    } catch (err) { fail(res, err); }
  });

  app.put('/api/admin/students/:id', requireAdmin, dbGuard, async (req, res) => {
    try {
      const id = String(req.params.id);
      let saved: any;
      await inTransaction(async (conn) => {
        const [found] = await conn.query<any[]>('SELECT * FROM siswa WHERE id = ? LIMIT 1', [id]);
        if (!found[0]) throw new HttpError(404, 'Data siswa tidak ditemukan di database. Muat ulang halaman.');
        const existing = COLLECTIONS.students.fromRow(found[0]);
        const body = req.body && typeof req.body === 'object' ? req.body : {};
        const merged = { ...existing, ...body, parent: { ...existing.parent, ...(body.parent || {}) } };
        saved = cleanStudent(merged, id);
        if (!saved.nis) saved.nis = existing.nis;
        await assertStudentUnique(conn, saved);
        await ensureClasses(conn, [saved.classId]);
        await upsertRows(conn, COLLECTIONS.students, [saved]);
      });
      res.json({ success: true, student: saved });
    } catch (err) { fail(res, err); }
  });

  app.delete('/api/admin/students/:id', requireAdmin, dbGuard, async (req, res) => {
    try {
      const id = String(req.params.id);
      // nilai, presensi & prestasi ikut terhapus otomatis (ON DELETE CASCADE)
      await inTransaction(async (conn) => {
        await conn.query('DELETE FROM siswa WHERE id = ?', [id]);
      });
      res.json({ success: true });
    } catch (err) { fail(res, err); }
  });

  // Import Excel: banyak siswa sekaligus, satu transaksi
  app.post('/api/admin/students/batch', requireAdmin, dbGuard, async (req, res) => {
    try {
      const list: any[] = Array.isArray(req.body?.students) ? req.body.students : [];
      const overwrite = req.body?.overwriteExisting === true;
      if (list.length === 0) throw new HttpError(400, 'Tidak ada data siswa untuk diimpor.');
      if (list.length > 3000) throw new HttpError(400, 'Maksimal 3000 siswa per impor.');

      const result = await inTransaction(async (conn) => {
        const [rows] = await conn.query<any[]>('SELECT * FROM siswa');
        const byNisn = new Map<string, any>();
        const nisOwner = new Map<string, string>(); // NIS -> id siswa pemiliknya
        for (const r of rows) {
          const st = COLLECTIONS.students.fromRow(r);
          byNisn.set(st.nisn, st);
          if (st.nis) nisOwner.set(st.nis, st.id);
        }

        const saved: any[] = [];
        const errors: { row: number; nisn: string; message: string }[] = [];
        let added = 0, updated = 0, ignored = 0;

        for (let i = 0; i < list.length; i++) {
          try {
            const nisn = str(list[i]?.nisn, 20);
            const existing = byNisn.get(nisn);
            if (existing) {
              if (!overwrite) { ignored++; continue; }
              const merged = { ...existing, ...list[i], parent: { ...existing.parent, ...(list[i].parent || {}) } };
              const st = cleanStudent(merged, existing.id);
              // NIS tidak boleh bentrok dengan siswa lain: bila bentrok, pertahankan NIS lama
              const owner = nisOwner.get(st.nis);
              if (!st.nis || (owner && owner !== existing.id)) st.nis = existing.nis;
              nisOwner.set(st.nis, existing.id);
              saved.push(st); byNisn.set(st.nisn, st); updated++;
            } else {
              const id = `std-${Date.now()}-${i}-${rid()}`;
              const st = cleanStudent(list[i], id);
              if (!st.nis || nisOwner.has(st.nis)) st.nis = await nextNis(conn, st.admissionYear, nisOwner);
              nisOwner.set(st.nis, id);
              saved.push(st); byNisn.set(st.nisn, st); added++;
            }
          } catch (e: any) {
            if (!(e instanceof HttpError)) throw e;
            errors.push({ row: i + 1, nisn: str(list[i]?.nisn, 20), message: e.message });
          }
        }

        await ensureClasses(conn, saved.map((s) => s.classId));
        if (saved.length) await upsertRows(conn, COLLECTIONS.students, saved);
        return { saved, added, updated, ignored, errors };
      });

      res.json({ success: true, students: result.saved, added: result.added, updated: result.updated, ignored: result.ignored, errors: result.errors });
    } catch (err) { fail(res, err); }
  });
}
