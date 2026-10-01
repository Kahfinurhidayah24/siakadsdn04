import mysql from 'mysql2/promise';
import { db, DB_CONFIG } from './db';
import { ALL_18_CLASSES, INITIAL_SUBJECTS, INITIAL_CALENDAR } from '../data/initialData';

/**
 * Menyiapkan database saat server start:
 *  1. Membuat database jika belum ada
 *  2. Membuat semua tabel jika belum ada (aman jika sudah di-import dari file .sql)
 *  3. Menyesuaikan kolom lama agar cocok dengan aplikasi
 *  4. Mengisi data referensi kelas & mata pelajaran jika masih kosong
 *
 * Tidak ada perintah DROP / TRUNCATE di sini, jadi data yang sudah ada aman.
 */

const TABLES: string[] = [
  `CREATE TABLE IF NOT EXISTS pengaturan_aplikasi (
    kunci VARCHAR(50) PRIMARY KEY,
    nilai MEDIUMTEXT NOT NULL,
    diubah_pada TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS kelas (
    id VARCHAR(10) PRIMARY KEY,
    tingkat INT NOT NULL,
    nama_kelas VARCHAR(20) NOT NULL,
    wali_kelas_id VARCHAR(50) DEFAULT NULL,
    wali_kelas_nama VARCHAR(150) DEFAULT NULL,
    kapasitas_maksimal INT DEFAULT 32,
    jumlah_siswa INT DEFAULT 0,
    ruang_kelas VARCHAR(50) DEFAULT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS guru (
    id VARCHAR(50) PRIMARY KEY,
    nip VARCHAR(30) NOT NULL,
    nuptk VARCHAR(30) DEFAULT NULL,
    nama_lengkap VARCHAR(150) NOT NULL,
    jenis_kelamin ENUM('L','P') NOT NULL,
    tempat_lahir VARCHAR(100) DEFAULT NULL,
    tanggal_lahir DATE DEFAULT NULL,
    no_telepon VARCHAR(30) DEFAULT NULL,
    email VARCHAR(100) NOT NULL DEFAULT '',
    mata_pelajaran_ampu TEXT DEFAULT NULL,
    is_wali_kelas BOOLEAN NOT NULL DEFAULT FALSE,
    wali_kelas_id VARCHAR(10) DEFAULT NULL,
    status_kepegawaian ENUM('PNS','PPPK','Honorer') NOT NULL DEFAULT 'PNS',
    foto_url LONGTEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS mata_pelajaran (
    id VARCHAR(50) PRIMARY KEY,
    kode_mapel VARCHAR(20) NOT NULL UNIQUE,
    nama_mapel VARCHAR(100) NOT NULL,
    kategori ENUM('Wajib','Muatan Lokal','Pilihan') NOT NULL DEFAULT 'Wajib',
    kkm_kktp INT NOT NULL DEFAULT 75,
    tingkat_kelas VARCHAR(50) NOT NULL DEFAULT '1,2,3,4,5,6'
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS siswa (
    id VARCHAR(50) PRIMARY KEY,
    nis VARCHAR(20) NOT NULL,
    nisn VARCHAR(20) NOT NULL,
    nama_lengkap VARCHAR(150) NOT NULL,
    jenis_kelamin ENUM('L','P') NOT NULL,
    tempat_lahir VARCHAR(100) NOT NULL DEFAULT '',
    tanggal_lahir DATE DEFAULT NULL,
    agama VARCHAR(50) NOT NULL DEFAULT 'Islam',
    alamat TEXT NOT NULL,
    no_telepon VARCHAR(30) DEFAULT NULL,
    email VARCHAR(100) DEFAULT NULL,
    foto_url LONGTEXT DEFAULT NULL,
    tanda_tangan_url LONGTEXT DEFAULT NULL,
    tahun_masuk VARCHAR(10) NOT NULL DEFAULT '2022',
    kelas_id VARCHAR(10) NOT NULL,
    status ENUM('Aktif','Lulus','Mutasi Keluar','Pindah Kelas') NOT NULL DEFAULT 'Aktif',
    nama_ayah VARCHAR(100) DEFAULT NULL,
    pekerjaan_ayah VARCHAR(100) DEFAULT NULL,
    nama_ibu VARCHAR(100) DEFAULT NULL,
    pekerjaan_ibu VARCHAR(100) DEFAULT NULL,
    nama_wali VARCHAR(100) DEFAULT NULL,
    no_telepon_ortu VARCHAR(30) DEFAULT NULL,
    alamat_ortu TEXT DEFAULT NULL,
    nik_ortu VARCHAR(30) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (kelas_id) REFERENCES kelas(id) ON UPDATE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS nilai_rapor (
    id VARCHAR(50) PRIMARY KEY,
    siswa_id VARCHAR(50) NOT NULL,
    mapel_id VARCHAR(50) NOT NULL,
    kelas_id VARCHAR(10) NOT NULL,
    tahun_ajaran VARCHAR(20) NOT NULL DEFAULT '2025/2026',
    semester ENUM('Ganjil','Genap') NOT NULL DEFAULT 'Genap',
    nilai_formatif DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    nilai_pts_uts DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    nilai_pas_uas DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    nilai_akhir DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    capaian_kompetensi TEXT DEFAULT NULL,
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (siswa_id) REFERENCES siswa(id) ON DELETE CASCADE,
    FOREIGN KEY (mapel_id) REFERENCES mata_pelajaran(id),
    FOREIGN KEY (kelas_id) REFERENCES kelas(id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS presensi_harian (
    id VARCHAR(50) PRIMARY KEY,
    siswa_id VARCHAR(50) NOT NULL,
    kelas_id VARCHAR(10) NOT NULL,
    tanggal DATE NOT NULL,
    status ENUM('Hadir','Sakit','Izin','Alpa') NOT NULL DEFAULT 'Hadir',
    keterangan VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (siswa_id) REFERENCES siswa(id) ON DELETE CASCADE,
    FOREIGN KEY (kelas_id) REFERENCES kelas(id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS jadwal_pelajaran (
    id VARCHAR(50) PRIMARY KEY,
    hari ENUM('Senin','Selasa','Rabu','Kamis','Jumat') NOT NULL,
    jam_mulai TIME NOT NULL,
    jam_selesai TIME NOT NULL,
    kelas_id VARCHAR(10) NOT NULL,
    mapel_id VARCHAR(50) NOT NULL,
    guru_id VARCHAR(50) NOT NULL,
    ruangan VARCHAR(50) DEFAULT NULL,
    FOREIGN KEY (kelas_id) REFERENCES kelas(id),
    FOREIGN KEY (mapel_id) REFERENCES mata_pelajaran(id),
    FOREIGN KEY (guru_id) REFERENCES guru(id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS prestasi_siswa (
    id VARCHAR(50) PRIMARY KEY,
    siswa_id VARCHAR(50) NOT NULL,
    judul_prestasi VARCHAR(200) NOT NULL,
    tingkat ENUM('Sekolah','Kecamatan','Kota','Provinsi','Nasional','Internasional') NOT NULL,
    peringkat VARCHAR(50) NOT NULL,
    tahun VARCHAR(10) NOT NULL,
    no_sertifikat VARCHAR(100) DEFAULT NULL,
    FOREIGN KEY (siswa_id) REFERENCES siswa(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS kalender_akademik (
    id VARCHAR(50) PRIMARY KEY,
    tanggal_mulai DATE NOT NULL,
    tanggal_selesai DATE DEFAULT NULL,
    kegiatan VARCHAR(255) NOT NULL,
    kategori ENUM('KBM','Ujian','Libur','Kegiatan','Rapor','Upacara') NOT NULL,
    deskripsi TEXT DEFAULT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // ---- Tabel baru (belum ada di file .sql lama) ----
  `CREATE TABLE IF NOT EXISTS pelanggaran_siswa (
    id VARCHAR(50) PRIMARY KEY,
    siswa_id VARCHAR(50) NOT NULL,
    nama_siswa VARCHAR(150) NOT NULL,
    kelas_id VARCHAR(10) NOT NULL,
    tanggal DATE NOT NULL,
    jenis_pelanggaran VARCHAR(200) NOT NULL,
    poin INT NOT NULL DEFAULT 0,
    tindakan VARCHAR(255) DEFAULT NULL,
    catatan TEXT DEFAULT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS mutasi_siswa (
    id VARCHAR(50) PRIMARY KEY,
    siswa_id VARCHAR(50) NOT NULL,
    nama_siswa VARCHAR(150) NOT NULL,
    nisn VARCHAR(20) DEFAULT NULL,
    jenis_mutasi VARCHAR(30) NOT NULL,
    tanggal DATE NOT NULL,
    dari VARCHAR(200) DEFAULT NULL,
    ke VARCHAR(200) DEFAULT NULL,
    alasan TEXT DEFAULT NULL,
    no_dokumen VARCHAR(100) DEFAULT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS surat_keterangan (
    id VARCHAR(50) PRIMARY KEY,
    nomor_surat VARCHAR(100) NOT NULL,
    siswa_id VARCHAR(50) NOT NULL,
    nama_siswa VARCHAR(150) NOT NULL,
    nis VARCHAR(20) DEFAULT NULL,
    nisn VARCHAR(20) DEFAULT NULL,
    kelas_id VARCHAR(10) DEFAULT NULL,
    jenis_surat VARCHAR(60) NOT NULL,
    tanggal_terbit VARCHAR(50) NOT NULL,
    keperluan TEXT DEFAULT NULL,
    nama_kepsek VARCHAR(150) DEFAULT NULL,
    nip_kepsek VARCHAR(30) DEFAULT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // log_aktivitas memakai id teks dari aplikasi (log-xxxx). Jika tabel lama
  // (id INT AUTO_INCREMENT) sudah ada, kolom di-migrasi di bawah.
  `CREATE TABLE IF NOT EXISTS log_aktivitas (
    id VARCHAR(50) PRIMARY KEY,
    waktu VARCHAR(30) NOT NULL,
    user_nama VARCHAR(150) NOT NULL,
    user_role VARCHAR(50) NOT NULL,
    aksi VARCHAR(100) NOT NULL,
    rincian TEXT DEFAULT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
];

async function columnInfo(table: string, column: string) {
  const [rows] = await db.query<any[]>(
    `SELECT COLUMN_TYPE, IS_NULLABLE, EXTRA FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  return rows[0] as { COLUMN_TYPE: string; IS_NULLABLE: string; EXTRA: string } | undefined;
}

async function addColumnIfMissing(table: string, column: string, ddl: string) {
  if (!(await columnInfo(table, column))) {
    await db.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${ddl}`);
  }
}

async function dropUniqueIfExists(table: string, column: string) {
  const [rows] = await db.query<any[]>(
    `SELECT INDEX_NAME FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? AND NON_UNIQUE = 0 AND INDEX_NAME <> 'PRIMARY'`,
    [table, column]
  );
  for (const r of rows) {
    await db.query(`ALTER TABLE \`${table}\` DROP INDEX \`${r.INDEX_NAME}\``);
  }
}

async function migrate() {
  // --- siswa: kolom tambahan untuk data orang tua yang dipakai aplikasi
  await addColumnIfMissing('siswa', 'alamat_ortu', 'TEXT DEFAULT NULL');
  await addColumnIfMissing('siswa', 'nik_ortu', 'VARCHAR(30) DEFAULT NULL');
  // Tanggal lahir boleh kosong (data import Excel kadang tidak lengkap)
  await db.query('ALTER TABLE siswa MODIFY tanggal_lahir DATE NULL');
  await db.query("ALTER TABLE siswa MODIFY tempat_lahir VARCHAR(100) NOT NULL DEFAULT ''");
  await db.query('ALTER TABLE siswa MODIFY foto_url LONGTEXT NULL');
  // Logo & foto sampul sekolah disimpan sebagai data gambar -> butuh kolom besar
  await db.query('ALTER TABLE pengaturan_aplikasi MODIFY nilai MEDIUMTEXT NOT NULL');

  // --- guru: foto bisa berupa data base64 panjang
  await db.query('ALTER TABLE guru MODIFY foto_url LONGTEXT NULL');
  await db.query("ALTER TABLE guru MODIFY email VARCHAR(100) NOT NULL DEFAULT ''");

  // --- kalender: kategori 'KBM' dipakai aplikasi
  await db.query(
    "ALTER TABLE kalender_akademik MODIFY kategori ENUM('KBM','Ujian','Libur','Kegiatan','Rapor','Upacara') NOT NULL"
  );

  // --- log_aktivitas versi lama memakai id INT AUTO_INCREMENT & waktu TIMESTAMP
  const logId = await columnInfo('log_aktivitas', 'id');
  if (logId && /int/i.test(logId.COLUMN_TYPE)) {
    await db.query('ALTER TABLE log_aktivitas MODIFY id INT NOT NULL');
    await db.query('ALTER TABLE log_aktivitas DROP PRIMARY KEY');
    await db.query('ALTER TABLE log_aktivitas MODIFY id VARCHAR(50) NOT NULL');
    await db.query("UPDATE log_aktivitas SET id = CONCAT('log-db-', id) WHERE id REGEXP '^[0-9]+$'");
    await db.query('ALTER TABLE log_aktivitas ADD PRIMARY KEY (id)');
  }
  const logTime = await columnInfo('log_aktivitas', 'waktu');
  if (logTime && !/varchar/i.test(logTime.COLUMN_TYPE)) {
    await db.query('ALTER TABLE log_aktivitas MODIFY waktu VARCHAR(30) NOT NULL');
  }

  // NIS/NISN unik dicek oleh aplikasi; index UNIQUE dari file .sql lama dilepas
  // supaya data import massal yang belum lengkap tidak menggagalkan penyimpanan.
  // (Kolom tetap ter-index untuk pencarian cepat.)
  for (const [table, col] of [['siswa', 'nis'], ['siswa', 'nisn'], ['guru', 'nip']] as const) {
    await dropUniqueIfExists(table, col);
    const [idx] = await db.query<any[]>(
      `SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1`,
      [table, col]
    );
    if (idx.length === 0) await db.query(`ALTER TABLE \`${table}\` ADD INDEX (\`${col}\`)`);
  }
}

async function seedReferenceData() {
  const [k] = await db.query<any[]>('SELECT COUNT(*) AS n FROM kelas');
  if (k[0].n === 0) {
    for (const id of ALL_18_CLASSES) {
      const tingkat = Number(id[0]);
      await db.query(
        'INSERT INTO kelas (id, tingkat, nama_kelas, kapasitas_maksimal) VALUES (?, ?, ?, 32)',
        [id, tingkat, `Kelas ${id}`]
      );
    }
  }
  const [m] = await db.query<any[]>('SELECT COUNT(*) AS n FROM mata_pelajaran');
  if (m[0].n === 0) {
    for (const s of INITIAL_SUBJECTS) {
      await db.query(
        'INSERT INTO mata_pelajaran (id, kode_mapel, nama_mapel, kategori, kkm_kktp, tingkat_kelas) VALUES (?, ?, ?, ?, ?, ?)',
        [s.id, s.code, s.name, s.category, s.kkm, s.gradeLevels.join(',')]
      );
    }
  }
}

async function seedCalendar() {
  const [c] = await db.query<any[]>('SELECT COUNT(*) AS n FROM kalender_akademik');
  if (c[0].n === 0) {
    for (const e of INITIAL_CALENDAR) {
      await db.query(
        'INSERT INTO kalender_akademik (id, tanggal_mulai, tanggal_selesai, kegiatan, kategori, deskripsi) VALUES (?, ?, ?, ?, ?, ?)',
        [e.id, e.startDate, e.endDate, e.title, e.category, e.description || null]
      );
    }
  }
}

export async function initDatabase(): Promise<void> {
  // 1. Buat database bila belum ada
  const conn = await mysql.createConnection({
    host: DB_CONFIG.host,
    port: DB_CONFIG.port,
    user: DB_CONFIG.user,
    password: DB_CONFIG.password,
  });
  try {
    await conn.query(
      `CREATE DATABASE IF NOT EXISTS \`${DB_CONFIG.database}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
  } finally {
    await conn.end();
  }

  // 2. Tabel
  for (const ddl of TABLES) await db.query(ddl);

  // 3. Migrasi & 4. Data referensi
  await migrate();
  await seedReferenceData();
  await seedCalendar();
}
