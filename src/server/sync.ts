import type { PoolConnection } from 'mysql2/promise';
import { db } from './db';

/**
 * Pemetaan dua arah antara bentuk data di aplikasi (camelCase) dan kolom
 * tabel MySQL (snake_case, bahasa Indonesia) yang terlihat di phpMyAdmin.
 */

type Row = Record<string, any>;

const s = (v: any): string => (v === undefined || v === null ? '' : String(v));
const n = (v: any): number => (Number.isFinite(Number(v)) ? Number(v) : 0);
const bool = (v: any): boolean => v === true || v === 1 || v === '1';
const dateOrNull = (v: any): string | null => {
  const t = s(v).trim();
  return /^\d{4}-\d{2}-\d{2}/.test(t) ? t.slice(0, 10) : null;
};
const nullIfEmpty = (v: any): string | null => {
  const t = s(v);
  return t === '' ? null : t;
};
const hhmm = (v: any): string => s(v).slice(0, 5);
const hhmmss = (v: any): string => {
  const t = s(v);
  return t.length === 5 ? `${t}:00` : t || '00:00:00';
};

// Nama mata pelajaran yang dikenal (diisi saat loadState). Dipakai untuk membaca
// kolom guru.mata_pelajaran_ampu yang berisi daftar dipisah koma, padahal sebagian
// nama mapel sendiri mengandung koma ("Pendidikan Jasmani, Olahraga & Kesehatan").
let KNOWN_SUBJECT_NAMES: string[] = [];

export function parseSubjectList(raw: string): string[] {
  let rest = raw;
  const found: string[] = [];
  for (const name of [...KNOWN_SUBJECT_NAMES].sort((a, b) => b.length - a.length)) {
    if (name && rest.includes(name)) {
      found.push(name);
      rest = rest.split(name).join(',');
    }
  }
  const others = rest.split(',').map((v) => v.trim()).filter(Boolean);
  // pertahankan urutan asli seperti tertulis di database
  return [...found, ...others].sort((a, b) => raw.indexOf(a) - raw.indexOf(b));
}

interface Collection {
  table: string;
  /** kolom untuk dipakai INSERT; urutan sama dengan toRow */
  columns: string[];
  toRow: (item: any) => any[];
  fromRow: (row: Row) => any;
  orderBy?: string;
}

export const COLLECTIONS: Record<string, Collection> = {
  // ------------------------------------------------------------- SISWA
  students: {
    table: 'siswa',
    orderBy: 'nama_lengkap ASC',
    columns: [
      'id', 'nis', 'nisn', 'nama_lengkap', 'jenis_kelamin', 'tempat_lahir', 'tanggal_lahir', 'agama',
      'alamat', 'no_telepon', 'email', 'foto_url', 'tanda_tangan_url', 'tahun_masuk', 'kelas_id', 'status',
      'nama_ayah', 'pekerjaan_ayah', 'nama_ibu', 'pekerjaan_ibu', 'nama_wali', 'no_telepon_ortu',
      'alamat_ortu', 'nik_ortu',
    ],
    toRow: (x) => [
      x.id, s(x.nis), s(x.nisn), s(x.name), x.gender === 'P' ? 'P' : 'L', s(x.birthPlace), dateOrNull(x.birthDate),
      s(x.religion) || 'Islam', s(x.address), nullIfEmpty(x.phone), nullIfEmpty(x.email), nullIfEmpty(x.photo),
      nullIfEmpty(x.signature), s(x.admissionYear) || '2022', s(x.classId), s(x.status) || 'Aktif',
      nullIfEmpty(x.parent?.fatherName), nullIfEmpty(x.parent?.fatherOccupation),
      nullIfEmpty(x.parent?.motherName), nullIfEmpty(x.parent?.motherOccupation),
      nullIfEmpty(x.parent?.guardianName), nullIfEmpty(x.parent?.phone),
      nullIfEmpty(x.parent?.address), nullIfEmpty(x.parent?.nik),
    ],
    fromRow: (r) => ({
      id: r.id,
      nis: s(r.nis),
      nisn: s(r.nisn),
      name: s(r.nama_lengkap),
      gender: r.jenis_kelamin === 'P' ? 'P' : 'L',
      birthPlace: s(r.tempat_lahir),
      birthDate: s(r.tanggal_lahir).slice(0, 10),
      religion: s(r.agama),
      address: s(r.alamat),
      phone: s(r.no_telepon),
      email: s(r.email),
      photo: r.foto_url || undefined,
      signature: r.tanda_tangan_url || undefined,
      admissionYear: s(r.tahun_masuk),
      classId: s(r.kelas_id),
      status: s(r.status) || 'Aktif',
      parent: {
        fatherName: s(r.nama_ayah),
        motherName: s(r.nama_ibu),
        guardianName: r.nama_wali || undefined,
        fatherOccupation: s(r.pekerjaan_ayah),
        motherOccupation: s(r.pekerjaan_ibu),
        phone: s(r.no_telepon_ortu),
        address: s(r.alamat_ortu),
        nik: r.nik_ortu || undefined,
      },
    }),
  },

  // -------------------------------------------------------------- GURU
  teachers: {
    table: 'guru',
    orderBy: 'nama_lengkap ASC',
    columns: [
      'id', 'nip', 'nuptk', 'nama_lengkap', 'jenis_kelamin', 'tempat_lahir', 'tanggal_lahir', 'no_telepon',
      'email', 'mata_pelajaran_ampu', 'is_wali_kelas', 'wali_kelas_id', 'status_kepegawaian', 'foto_url',
    ],
    toRow: (x) => [
      x.id, s(x.nip), nullIfEmpty(x.nuptk), s(x.name), x.gender === 'P' ? 'P' : 'L', nullIfEmpty(x.birthPlace),
      dateOrNull(x.birthDate), nullIfEmpty(x.phone), s(x.email), (x.subjects || []).join(', '),
      x.isWaliKelas ? 1 : 0, x.isWaliKelas ? nullIfEmpty(x.assignedClass) : null, s(x.status) || 'PNS',
      nullIfEmpty(x.photo),
    ],
    fromRow: (r) => ({
      id: r.id,
      nip: s(r.nip),
      nuptk: r.nuptk || undefined,
      name: s(r.nama_lengkap),
      gender: r.jenis_kelamin === 'P' ? 'P' : 'L',
      birthPlace: s(r.tempat_lahir),
      birthDate: s(r.tanggal_lahir).slice(0, 10),
      phone: s(r.no_telepon),
      email: s(r.email),
      photo: r.foto_url || undefined,
      subjects: parseSubjectList(s(r.mata_pelajaran_ampu)),
      isWaliKelas: bool(r.is_wali_kelas),
      assignedClass: r.wali_kelas_id || undefined,
      status: s(r.status_kepegawaian) || 'PNS',
    }),
  },

  // ----------------------------------------------------------- JADWAL
  schedules: {
    table: 'jadwal_pelajaran',
    orderBy: 'FIELD(hari,"Senin","Selasa","Rabu","Kamis","Jumat"), jam_mulai ASC',
    columns: ['id', 'hari', 'jam_mulai', 'jam_selesai', 'kelas_id', 'mapel_id', 'guru_id', 'ruangan'],
    toRow: (x) => [
      x.id, x.day, hhmmss(x.startTime), hhmmss(x.endTime), s(x.classId), s(x.subjectId), s(x.teacherId),
      nullIfEmpty(x.room),
    ],
    // subjectName / teacherName diisi ulang di loadState (join)
    fromRow: (r) => ({
      id: r.id,
      day: r.hari,
      startTime: hhmm(r.jam_mulai),
      endTime: hhmm(r.jam_selesai),
      subjectId: s(r.mapel_id),
      subjectName: s(r.nama_mapel),
      teacherId: s(r.guru_id),
      teacherName: s(r.nama_guru),
      classId: s(r.kelas_id),
      room: s(r.ruangan),
    }),
  },

  // ------------------------------------------------------------ NILAI
  grades: {
    table: 'nilai_rapor',
    orderBy: 'kelas_id, siswa_id, mapel_id',
    columns: [
      'id', 'siswa_id', 'mapel_id', 'kelas_id', 'tahun_ajaran', 'semester', 'nilai_formatif',
      'nilai_pts_uts', 'nilai_pas_uas', 'nilai_akhir', 'capaian_kompetensi', 'is_locked',
    ],
    toRow: (x) => [
      x.id, s(x.studentId), s(x.subjectId), s(x.classId), s(x.academicYear) || '2025/2026',
      x.semester === 'Ganjil' ? 'Ganjil' : 'Genap', n(x.formatif), n(x.uts), n(x.uas), n(x.finalScore),
      nullIfEmpty(x.achievementDescription), x.isLocked ? 1 : 0,
    ],
    fromRow: (r) => ({
      id: r.id,
      studentId: s(r.siswa_id),
      studentNisn: s(r.nisn),
      studentName: s(r.nama_siswa),
      classId: s(r.kelas_id),
      subjectId: s(r.mapel_id),
      subjectName: s(r.nama_mapel),
      academicYear: s(r.tahun_ajaran),
      semester: r.semester,
      formatif: Number(r.nilai_formatif),
      uts: Number(r.nilai_pts_uts),
      uas: Number(r.nilai_pas_uas),
      finalScore: Number(r.nilai_akhir),
      achievementDescription: s(r.capaian_kompetensi),
      isLocked: bool(r.is_locked),
    }),
  },

  // ---------------------------------------------------------- PRESENSI
  attendance: {
    table: 'presensi_harian',
    orderBy: 'tanggal DESC, kelas_id',
    columns: ['id', 'siswa_id', 'kelas_id', 'tanggal', 'status', 'keterangan'],
    toRow: (x) => [x.id, s(x.studentId), s(x.classId), dateOrNull(x.date), x.status, nullIfEmpty(x.notes)],
    fromRow: (r) => ({
      id: r.id,
      studentId: s(r.siswa_id),
      studentName: s(r.nama_siswa),
      classId: s(r.kelas_id),
      date: s(r.tanggal).slice(0, 10),
      status: r.status,
      notes: r.keterangan || undefined,
    }),
  },

  // ---------------------------------------------------------- PRESTASI
  achievements: {
    table: 'prestasi_siswa',
    columns: ['id', 'siswa_id', 'judul_prestasi', 'tingkat', 'peringkat', 'tahun', 'no_sertifikat'],
    toRow: (x) => [x.id, s(x.studentId), s(x.title), x.level, s(x.rank), s(x.year), nullIfEmpty(x.certificateNo)],
    fromRow: (r) => ({
      id: r.id,
      studentId: s(r.siswa_id),
      studentName: s(r.nama_siswa),
      classId: s(r.kelas_id),
      title: s(r.judul_prestasi),
      level: r.tingkat,
      rank: s(r.peringkat),
      year: s(r.tahun),
      certificateNo: r.no_sertifikat || undefined,
    }),
  },

  // -------------------------------------------------------- PELANGGARAN
  violations: {
    table: 'pelanggaran_siswa',
    orderBy: 'tanggal DESC',
    columns: ['id', 'siswa_id', 'nama_siswa', 'kelas_id', 'tanggal', 'jenis_pelanggaran', 'poin', 'tindakan', 'catatan'],
    toRow: (x) => [
      x.id, s(x.studentId), s(x.studentName), s(x.classId), dateOrNull(x.date) || '1970-01-01', s(x.type),
      n(x.points), nullIfEmpty(x.actionTaken), nullIfEmpty(x.notes),
    ],
    fromRow: (r) => ({
      id: r.id,
      studentId: s(r.siswa_id),
      studentName: s(r.nama_siswa),
      classId: s(r.kelas_id),
      date: s(r.tanggal).slice(0, 10),
      type: s(r.jenis_pelanggaran),
      points: Number(r.poin),
      actionTaken: s(r.tindakan),
      notes: r.catatan || undefined,
    }),
  },

  // ------------------------------------------------------------ MUTASI
  mutations: {
    table: 'mutasi_siswa',
    orderBy: 'tanggal DESC',
    columns: ['id', 'siswa_id', 'nama_siswa', 'nisn', 'jenis_mutasi', 'tanggal', 'dari', 'ke', 'alasan', 'no_dokumen'],
    toRow: (x) => [
      x.id, s(x.studentId), s(x.studentName), nullIfEmpty(x.nisn), s(x.type), dateOrNull(x.date) || '1970-01-01',
      nullIfEmpty(x.fromSchoolOrClass), nullIfEmpty(x.toSchoolOrClass), nullIfEmpty(x.reason), nullIfEmpty(x.documentNo),
    ],
    fromRow: (r) => ({
      id: r.id,
      studentId: s(r.siswa_id),
      studentName: s(r.nama_siswa),
      nisn: s(r.nisn),
      type: r.jenis_mutasi,
      date: s(r.tanggal).slice(0, 10),
      fromSchoolOrClass: r.dari || undefined,
      toSchoolOrClass: r.ke || undefined,
      reason: s(r.alasan),
      documentNo: r.no_dokumen || undefined,
    }),
  },

  // ------------------------------------------------------------- SURAT
  letters: {
    table: 'surat_keterangan',
    columns: [
      'id', 'nomor_surat', 'siswa_id', 'nama_siswa', 'nis', 'nisn', 'kelas_id', 'jenis_surat',
      'tanggal_terbit', 'keperluan', 'nama_kepsek', 'nip_kepsek',
    ],
    toRow: (x) => [
      x.id, s(x.letterNumber), s(x.studentId), s(x.studentName), nullIfEmpty(x.studentNis), nullIfEmpty(x.studentNisn),
      nullIfEmpty(x.classId), s(x.type), s(x.dateIssued), nullIfEmpty(x.purpose), nullIfEmpty(x.principalName),
      nullIfEmpty(x.principalNip),
    ],
    fromRow: (r) => ({
      id: r.id,
      letterNumber: s(r.nomor_surat),
      studentId: s(r.siswa_id),
      studentName: s(r.nama_siswa),
      studentNis: s(r.nis),
      studentNisn: s(r.nisn),
      classId: s(r.kelas_id),
      type: r.jenis_surat,
      dateIssued: s(r.tanggal_terbit),
      purpose: s(r.keperluan),
      principalName: s(r.nama_kepsek),
      principalNip: s(r.nip_kepsek),
    }),
  },

  // -------------------------------------------------------- LOG AKTIVITAS
  activityLogs: {
    table: 'log_aktivitas',
    orderBy: 'waktu DESC, id DESC',
    columns: ['id', 'waktu', 'user_nama', 'user_role', 'aksi', 'rincian'],
    toRow: (x) => [x.id, s(x.timestamp), s(x.user), s(x.role), s(x.action), nullIfEmpty(x.details)],
    fromRow: (r) => ({
      id: s(r.id),
      timestamp: s(r.waktu),
      user: s(r.user_nama),
      role: s(r.user_role),
      action: s(r.aksi),
      details: s(r.rincian),
    }),
  },
};

// Data referensi yang hanya dibaca aplikasi (diubah lewat phpMyAdmin)
const subjectFromRow = (r: Row) => ({
  id: r.id,
  code: s(r.kode_mapel),
  name: s(r.nama_mapel),
  category: r.kategori,
  kkm: Number(r.kkm_kktp),
  gradeLevels: s(r.tingkat_kelas).split(',').map((v) => Number(v.trim())).filter((v) => v > 0),
});

const calendarFromRow = (r: Row) => ({
  id: r.id,
  title: s(r.kegiatan),
  startDate: s(r.tanggal_mulai).slice(0, 10),
  endDate: s(r.tanggal_selesai || r.tanggal_mulai).slice(0, 10),
  category: r.kategori,
  description: r.deskripsi || undefined,
});

// Query baca; beberapa koleksi butuh JOIN agar field turunan (nama) terisi
const SELECTS: Record<string, string> = {
  students: 'SELECT * FROM siswa ORDER BY nama_lengkap ASC',
  teachers: 'SELECT * FROM guru ORDER BY nama_lengkap ASC',
  schedules: `SELECT j.*, m.nama_mapel, g.nama_lengkap AS nama_guru
              FROM jadwal_pelajaran j
              LEFT JOIN mata_pelajaran m ON m.id = j.mapel_id
              LEFT JOIN guru g ON g.id = j.guru_id
              ORDER BY FIELD(j.hari,'Senin','Selasa','Rabu','Kamis','Jumat'), j.jam_mulai ASC`,
  grades: `SELECT r.*, s.nisn, s.nama_lengkap AS nama_siswa, m.nama_mapel
           FROM nilai_rapor r
           LEFT JOIN siswa s ON s.id = r.siswa_id
           LEFT JOIN mata_pelajaran m ON m.id = r.mapel_id
           ORDER BY r.kelas_id, r.siswa_id, r.mapel_id`,
  attendance: `SELECT p.*, s.nama_lengkap AS nama_siswa
               FROM presensi_harian p LEFT JOIN siswa s ON s.id = p.siswa_id
               ORDER BY p.tanggal DESC, p.kelas_id`,
  achievements: `SELECT a.*, s.nama_lengkap AS nama_siswa, s.kelas_id
                 FROM prestasi_siswa a LEFT JOIN siswa s ON s.id = a.siswa_id`,
  violations: 'SELECT * FROM pelanggaran_siswa ORDER BY tanggal DESC',
  mutations: 'SELECT * FROM mutasi_siswa ORDER BY tanggal DESC',
  letters: 'SELECT * FROM surat_keterangan',
  activityLogs: 'SELECT * FROM log_aktivitas ORDER BY waktu DESC, id DESC LIMIT 500',
};

export async function loadState() {
  const state: Record<string, any[]> = {};
  const [subjRows] = await db.query<any[]>('SELECT nama_mapel FROM mata_pelajaran');
  KNOWN_SUBJECT_NAMES = subjRows.map((r) => s(r.nama_mapel));
  for (const key of Object.keys(COLLECTIONS)) {
    const [rows] = await db.query<any[]>(SELECTS[key]);
    state[key] = rows.map(COLLECTIONS[key].fromRow);
  }
  const [subj] = await db.query<any[]>('SELECT * FROM mata_pelajaran ORDER BY kode_mapel');
  const [cal] = await db.query<any[]>('SELECT * FROM kalender_akademik ORDER BY tanggal_mulai');
  state.subjects = subj.map(subjectFromRow);
  state.calendar = cal.map(calendarFromRow);
  return state;
}

export async function tableCounts() {
  const out: Record<string, number> = {};
  for (const c of Object.values(COLLECTIONS)) {
    const [r] = await db.query<any[]>(`SELECT COUNT(*) AS n FROM \`${c.table}\``);
    out[c.table] = Number(r[0].n);
  }
  return out;
}

// ---------------------------------------------------------------------
// Menyimpan perubahan
// ---------------------------------------------------------------------

export interface ChangeSet {
  upsert?: any[];
  delete?: string[];
}
export type Changes = Partial<Record<keyof typeof COLLECTIONS, ChangeSet>>;

const CHUNK = 200;

async function upsertRows(conn: PoolConnection, col: Collection, items: any[]) {
  for (let i = 0; i < items.length; i += CHUNK) {
    const part = items.slice(i, i + CHUNK).map(col.toRow);
    const updates = col.columns
      .filter((c) => c !== 'id')
      .map((c) => `\`${c}\` = VALUES(\`${c}\`)`)
      .join(', ');
    await conn.query(
      `INSERT INTO \`${col.table}\` (${col.columns.map((c) => `\`${c}\``).join(', ')}) VALUES ? ON DUPLICATE KEY UPDATE ${updates}`,
      [part]
    );
  }
}

async function deleteRows(conn: PoolConnection, table: string, ids: string[]) {
  for (let i = 0; i < ids.length; i += 500) {
    await conn.query(`DELETE FROM \`${table}\` WHERE id IN (?)`, [ids.slice(i, i + 500)]);
  }
}

async function idSet(conn: PoolConnection, table: string): Promise<Set<string>> {
  const [rows] = await conn.query<any[]>(`SELECT id FROM \`${table}\``);
  return new Set(rows.map((r) => String(r.id)));
}

/**
 * Terapkan perubahan dalam SATU transaksi: kalau ada yang gagal, semuanya
 * dibatalkan sehingga database tidak pernah setengah-tersimpan.
 * Urutan: hapus anak → hapus induk → upsert induk → upsert anak.
 */
export async function applyChanges(changes: Changes): Promise<{ skipped: Record<string, number> }> {
  const conn = await db.getConnection();
  const skipped: Record<string, number> = {};
  try {
    await conn.beginTransaction();

    const del = (k: string) => (changes as any)[k]?.delete || [];
    const ups = (k: string) => (changes as any)[k]?.upsert || [];

    // 1. hapus (anak dulu)
    // (log aktivitas bersifat append-only: tidak pernah dihapus dari database)
    for (const k of ['grades', 'attendance', 'achievements', 'schedules', 'violations', 'mutations', 'letters', 'students', 'teachers']) {
      if (del(k).length) await deleteRows(conn, COLLECTIONS[k].table, del(k));
    }

    // 2. upsert induk
    // pastikan kelas yang dirujuk ada (aplikasi bisa membuat kelas baru)
    const classIds = new Set<string>();
    for (const k of ['students', 'grades', 'attendance', 'schedules']) {
      for (const it of ups(k)) if (it.classId) classIds.add(String(it.classId));
    }
    if (classIds.size) {
      const known = await idSet(conn, 'kelas');
      for (const id of classIds) {
        if (!known.has(id)) {
          await conn.query('INSERT INTO kelas (id, tingkat, nama_kelas, kapasitas_maksimal) VALUES (?, ?, ?, 32)', [
            id, Number(id[0]) || 1, `Kelas ${id}`,
          ]);
        }
      }
    }
    if (ups('teachers').length) await upsertRows(conn, COLLECTIONS.teachers, ups('teachers'));
    if (ups('students').length) await upsertRows(conn, COLLECTIONS.students, ups('students'));

    // 3. upsert anak — lewati yang merujuk siswa/guru/mapel yang tidak ada
    const siswaIds = await idSet(conn, 'siswa');
    const guruIds = await idSet(conn, 'guru');
    const mapelIds = await idSet(conn, 'mata_pelajaran');

    const filterChild = (key: string, ok: (x: any) => boolean) => {
      const all = ups(key);
      const good = all.filter(ok);
      if (good.length !== all.length) skipped[key] = all.length - good.length;
      return good;
    };

    const grades = filterChild('grades', (x) => siswaIds.has(x.studentId) && mapelIds.has(x.subjectId));
    const attendance = filterChild('attendance', (x) => siswaIds.has(x.studentId));
    const achievements = filterChild('achievements', (x) => siswaIds.has(x.studentId));
    const schedules = filterChild('schedules', (x) => guruIds.has(x.teacherId) && mapelIds.has(x.subjectId));

    if (grades.length) await upsertRows(conn, COLLECTIONS.grades, grades);
    if (attendance.length) await upsertRows(conn, COLLECTIONS.attendance, attendance);
    if (achievements.length) await upsertRows(conn, COLLECTIONS.achievements, achievements);
    if (schedules.length) await upsertRows(conn, COLLECTIONS.schedules, schedules);
    for (const k of ['violations', 'mutations', 'letters', 'activityLogs']) {
      if (ups(k).length) await upsertRows(conn, COLLECTIONS[k], ups(k));
    }

    await conn.commit();
    return { skipped };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
