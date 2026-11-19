import { Student, Teacher, Subject, GradeItem, AttendanceRecord, User, AcademicCalendarItem } from '../types';

export interface ExportDataPayload {
  schoolProfile: any;
  userAccounts: User[];
  teachers: Teacher[];
  students: Student[];
  subjects: Subject[];
  grades: GradeItem[];
  attendance: AttendanceRecord[];
  calendar: AcademicCalendarItem[];
}

export function generateSqlDump(data: ExportDataPayload): string {
  const { schoolProfile, userAccounts, teachers, students, subjects, grades, attendance, calendar } = data;
  const now = new Date().toISOString();

  const escapeSql = (str: string | undefined | null) => {
    if (str === undefined || str === null) return "''";
    return "'" + String(str).replace(/'/g, "''").replace(/\\/g, "\\\\") + "'";
  };

  let sql = `-- =======================================================================
-- BACKUP / EKSPOR DATABASE SQL RESMI
-- SISTEM INFORMASI AKADEMIK (SIAKAD) SDN LUBANG BUAYA 04 PAGI
-- Tanggal Ekspor: ${now}
-- NPSN: ${schoolProfile.npsn} | Akreditasi: ${schoolProfile.accreditation}
-- =======================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+07:00";

CREATE DATABASE IF NOT EXISTS \`siakad_lubang_buaya_04\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE \`siakad_lubang_buaya_04\`;

-- -----------------------------------------------------------------------
-- 1. TABEL: profil_sekolah
-- -----------------------------------------------------------------------
DROP TABLE IF EXISTS \`profil_sekolah\`;
CREATE TABLE \`profil_sekolah\` (
  \`id\` INT PRIMARY KEY AUTO_INCREMENT,
  \`nama_sekolah\` VARCHAR(150) NOT NULL,
  \`npsn\` VARCHAR(20) NOT NULL UNIQUE,
  \`nss\` VARCHAR(30) DEFAULT NULL,
  \`akreditasi\` VARCHAR(10) NOT NULL,
  \`kurikulum\` VARCHAR(50) NOT NULL,
  \`alamat_jalan\` TEXT NOT NULL,
  \`kelurahan\` VARCHAR(100) NOT NULL,
  \`kecamatan\` VARCHAR(100) NOT NULL,
  \`kab_kota\` VARCHAR(100) NOT NULL,
  \`provinsi\` VARCHAR(100) NOT NULL,
  \`telepon\` VARCHAR(30) DEFAULT NULL,
  \`email_resmi\` VARCHAR(100) DEFAULT NULL,
  \`website\` VARCHAR(150) DEFAULT NULL,
  \`nama_kepsek\` VARCHAR(150) NOT NULL,
  \`nip_kepsek\` VARCHAR(30) NOT NULL,
  \`total_rombel\` INT NOT NULL DEFAULT 18,
  \`total_siswa\` INT NOT NULL DEFAULT 573,
  \`siswa_laki\` INT NOT NULL DEFAULT 274,
  \`siswa_perempuan\` INT NOT NULL DEFAULT 299,
  \`total_guru\` INT NOT NULL DEFAULT 22,
  \`visi\` TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO \`profil_sekolah\` (
  \`id\`, \`nama_sekolah\`, \`npsn\`, \`nss\`, \`akreditasi\`, \`kurikulum\`,
  \`alamat_jalan\`, \`kelurahan\`, \`kecamatan\`, \`kab_kota\`, \`provinsi\`,
  \`telepon\`, \`email_resmi\`, \`website\`, \`nama_kepsek\`, \`nip_kepsek\`,
  \`total_rombel\`, \`total_siswa\`, \`siswa_laki\`, \`siswa_perempuan\`, \`total_guru\`, \`visi\`
) VALUES (
  1, 
  ${escapeSql(schoolProfile.name)},
  ${escapeSql(schoolProfile.npsn)},
  ${escapeSql(schoolProfile.nss)},
  ${escapeSql(schoolProfile.accreditation)},
  ${escapeSql(schoolProfile.curriculum)},
  ${escapeSql(schoolProfile.address)},
  ${escapeSql(schoolProfile.desaKelurahan)},
  ${escapeSql(schoolProfile.kecamatan)},
  ${escapeSql(schoolProfile.kabKota)},
  ${escapeSql(schoolProfile.provinsi)},
  ${escapeSql(schoolProfile.phone)},
  ${escapeSql(schoolProfile.email)},
  ${escapeSql(schoolProfile.website)},
  ${escapeSql(schoolProfile.principal?.name)},
  ${escapeSql(schoolProfile.principal?.nip)},
  ${schoolProfile.stats?.rombel || 18},
  ${schoolProfile.stats?.totalStudents || 573},
  ${schoolProfile.stats?.maleStudents || 274},
  ${schoolProfile.stats?.femaleStudents || 299},
  ${schoolProfile.stats?.teachers || 22},
  ${escapeSql(schoolProfile.vision)}
);

-- -----------------------------------------------------------------------
-- 2. TABEL: users (Akun Pengguna)
-- -----------------------------------------------------------------------
DROP TABLE IF EXISTS \`users\`;
CREATE TABLE \`users\` (
  \`id\` VARCHAR(50) PRIMARY KEY,
  \`username\` VARCHAR(50) NOT NULL UNIQUE,
  \`password_hash\` VARCHAR(255) NOT NULL,
  \`nama_lengkap\` VARCHAR(150) NOT NULL,
  \`role\` ENUM('admin', 'kepsek', 'guru', 'siswa') NOT NULL,
  \`email\` VARCHAR(100) DEFAULT NULL,
  \`reference_id\` VARCHAR(50) DEFAULT NULL,
  \`is_wali_kelas\` BOOLEAN DEFAULT FALSE,
  \`assigned_class\` VARCHAR(10) DEFAULT NULL,
  \`is_active\` BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

`;

  if (userAccounts.length > 0) {
    sql += `INSERT INTO \`users\` (\`id\`, \`username\`, \`password_hash\`, \`nama_lengkap\`, \`role\`, \`email\`, \`reference_id\`, \`is_wali_kelas\`, \`assigned_class\`, \`is_active\`) VALUES\n`;
    sql += userAccounts.map(u => {
      return `(${escapeSql(u.id)}, ${escapeSql(u.username)}, '$2y$10$SiakadSecuredHash778899', ${escapeSql(u.name)}, ${escapeSql(u.role)}, ${escapeSql(u.email)}, ${escapeSql(u.referenceId)}, ${u.isWaliKelas ? 1 : 0}, ${escapeSql(u.assignedClass)}, ${u.isActive ? 1 : 0})`;
    }).join(',\n') + ';\n\n';
  }

  // 3. Teachers
  sql += `-- -----------------------------------------------------------------------
-- 3. TABEL: guru
-- -----------------------------------------------------------------------
DROP TABLE IF EXISTS \`guru\`;
CREATE TABLE \`guru\` (
  \`id\` VARCHAR(50) PRIMARY KEY,
  \`nip\` VARCHAR(30) NOT NULL UNIQUE,
  \`nuptk\` VARCHAR(30) DEFAULT NULL,
  \`nama_lengkap\` VARCHAR(150) NOT NULL,
  \`jenis_kelamin\` ENUM('L', 'P') NOT NULL,
  \`tempat_lahir\` VARCHAR(100) DEFAULT NULL,
  \`tanggal_lahir\` DATE DEFAULT NULL,
  \`no_telepon\` VARCHAR(30) DEFAULT NULL,
  \`email\` VARCHAR(100) NOT NULL,
  \`mata_pelajaran_ampu\` TEXT DEFAULT NULL,
  \`is_wali_kelas\` BOOLEAN NOT NULL DEFAULT FALSE,
  \`wali_kelas_id\` VARCHAR(10) DEFAULT NULL,
  \`status_kepegawaian\` ENUM('PNS', 'PPPK', 'Honorer') NOT NULL DEFAULT 'PNS'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

`;

  if (teachers.length > 0) {
    sql += `INSERT INTO \`guru\` (\`id\`, \`nip\`, \`nuptk\`, \`nama_lengkap\`, \`jenis_kelamin\`, \`tempat_lahir\`, \`tanggal_lahir\`, \`no_telepon\`, \`email\`, \`mata_pelajaran_ampu\`, \`is_wali_kelas\`, \`wali_kelas_id\`, \`status_kepegawaian\`) VALUES\n`;
    sql += teachers.map(t => {
      return `(${escapeSql(t.id)}, ${escapeSql(t.nip)}, ${escapeSql(t.nuptk)}, ${escapeSql(t.name)}, ${escapeSql(t.gender)}, ${escapeSql(t.birthPlace)}, ${escapeSql(t.birthDate)}, ${escapeSql(t.phone)}, ${escapeSql(t.email)}, ${escapeSql(t.subjects?.join(', '))}, ${t.isWaliKelas ? 1 : 0}, ${escapeSql(t.assignedClass)}, ${escapeSql(t.status)})`;
    }).join(',\n') + ';\n\n';
  }

  // 4. Subjects
  sql += `-- -----------------------------------------------------------------------
-- 4. TABEL: mata_pelajaran
-- -----------------------------------------------------------------------
DROP TABLE IF EXISTS \`mata_pelajaran\`;
CREATE TABLE \`mata_pelajaran\` (
  \`id\` VARCHAR(50) PRIMARY KEY,
  \`kode_mapel\` VARCHAR(20) NOT NULL UNIQUE,
  \`nama_mapel\` VARCHAR(100) NOT NULL,
  \`kategori\` ENUM('Wajib', 'Muatan Lokal', 'Pilihan') NOT NULL DEFAULT 'Wajib',
  \`kkm_kktp\` INT NOT NULL DEFAULT 75
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

`;

  if (subjects.length > 0) {
    sql += `INSERT INTO \`mata_pelajaran\` (\`id\`, \`kode_mapel\`, \`nama_mapel\`, \`kategori\`, \`kkm_kktp\`) VALUES\n`;
    sql += subjects.map(s => {
      return `(${escapeSql(s.id)}, ${escapeSql(s.code)}, ${escapeSql(s.name)}, ${escapeSql(s.category)}, ${s.kkm || 75})`;
    }).join(',\n') + ';\n\n';
  }

  // 5. Students
  sql += `-- -----------------------------------------------------------------------
-- 5. TABEL: siswa
-- -----------------------------------------------------------------------
DROP TABLE IF EXISTS \`siswa\`;
CREATE TABLE \`siswa\` (
  \`id\` VARCHAR(50) PRIMARY KEY,
  \`nis\` VARCHAR(20) NOT NULL UNIQUE,
  \`nisn\` VARCHAR(20) NOT NULL UNIQUE,
  \`nama_lengkap\` VARCHAR(150) NOT NULL,
  \`jenis_kelamin\` ENUM('L', 'P') NOT NULL,
  \`tempat_lahir\` VARCHAR(100) NOT NULL,
  \`tanggal_lahir\` DATE NOT NULL,
  \`agama\` VARCHAR(50) NOT NULL,
  \`alamat\` TEXT NOT NULL,
  \`no_telepon\` VARCHAR(30) DEFAULT NULL,
  \`email\` VARCHAR(100) DEFAULT NULL,
  \`tahun_masuk\` VARCHAR(10) NOT NULL,
  \`kelas_id\` VARCHAR(10) NOT NULL,
  \`status\` ENUM('Aktif', 'Lulus', 'Mutasi Keluar', 'Pindah Kelas') NOT NULL DEFAULT 'Aktif',
  \`nama_ayah\` VARCHAR(100) DEFAULT NULL,
  \`nama_ibu\` VARCHAR(100) DEFAULT NULL,
  \`no_telepon_ortu\` VARCHAR(30) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

`;

  if (students.length > 0) {
    sql += `INSERT INTO \`siswa\` (\`id\`, \`nis\`, \`nisn\`, \`nama_lengkap\`, \`jenis_kelamin\`, \`tempat_lahir\`, \`tanggal_lahir\`, \`agama\`, \`alamat\`, \`no_telepon\`, \`email\`, \`tahun_masuk\`, \`kelas_id\`, \`status\`, \`nama_ayah\`, \`nama_ibu\`, \`no_telepon_ortu\`) VALUES\n`;
    sql += students.map(st => {
      return `(${escapeSql(st.id)}, ${escapeSql(st.nis)}, ${escapeSql(st.nisn)}, ${escapeSql(st.name)}, ${escapeSql(st.gender)}, ${escapeSql(st.birthPlace)}, ${escapeSql(st.birthDate)}, ${escapeSql(st.religion)}, ${escapeSql(st.address)}, ${escapeSql(st.phone)}, ${escapeSql(st.email)}, ${escapeSql(st.admissionYear)}, ${escapeSql(st.classId)}, ${escapeSql(st.status)}, ${escapeSql(st.parent?.fatherName)}, ${escapeSql(st.parent?.motherName)}, ${escapeSql(st.parent?.phone)})`;
    }).join(',\n') + ';\n\n';
  }

  // 6. Grades
  sql += `-- -----------------------------------------------------------------------
-- 6. TABEL: nilai_rapor
-- -----------------------------------------------------------------------
DROP TABLE IF EXISTS \`nilai_rapor\`;
CREATE TABLE \`nilai_rapor\` (
  \`id\` VARCHAR(50) PRIMARY KEY,
  \`siswa_id\` VARCHAR(50) NOT NULL,
  \`mapel_id\` VARCHAR(50) NOT NULL,
  \`kelas_id\` VARCHAR(10) NOT NULL,
  \`tahun_ajaran\` VARCHAR(20) NOT NULL,
  \`semester\` ENUM('Ganjil', 'Genap') NOT NULL,
  \`nilai_formatif\` DECIMAL(5,2) NOT NULL,
  \`nilai_pts_uts\` DECIMAL(5,2) NOT NULL,
  \`nilai_pas_uas\` DECIMAL(5,2) NOT NULL,
  \`nilai_akhir\` DECIMAL(5,2) NOT NULL,
  \`capaian_kompetensi\` TEXT DEFAULT NULL,
  \`is_locked\` BOOLEAN NOT NULL DEFAULT FALSE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

`;

  if (grades.length > 0) {
    sql += `INSERT INTO \`nilai_rapor\` (\`id\`, \`siswa_id\`, \`mapel_id\`, \`kelas_id\`, \`tahun_ajaran\`, \`semester\`, \`nilai_formatif\`, \`nilai_pts_uts\`, \`nilai_pas_uas\`, \`nilai_akhir\`, \`capaian_kompetensi\`, \`is_locked\`) VALUES\n`;
    sql += grades.map(g => {
      return `(${escapeSql(g.id)}, ${escapeSql(g.studentId)}, ${escapeSql(g.subjectId)}, ${escapeSql(g.classId)}, ${escapeSql(g.academicYear)}, ${escapeSql(g.semester)}, ${g.formatif || 0}, ${g.uts || 0}, ${g.uas || 0}, ${g.finalScore || 0}, ${escapeSql(g.achievementDescription)}, ${g.isLocked ? 1 : 0})`;
    }).join(',\n') + ';\n\n';
  }

  // 7. Attendance
  sql += `-- -----------------------------------------------------------------------
-- 7. TABEL: presensi_harian
-- -----------------------------------------------------------------------
DROP TABLE IF EXISTS \`presensi_harian\`;
CREATE TABLE \`presensi_harian\` (
  \`id\` VARCHAR(50) PRIMARY KEY,
  \`siswa_id\` VARCHAR(50) NOT NULL,
  \`kelas_id\` VARCHAR(10) NOT NULL,
  \`tanggal\` DATE NOT NULL,
  \`status\` ENUM('Hadir', 'Sakit', 'Izin', 'Alpa') NOT NULL,
  \`keterangan\` VARCHAR(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

`;

  if (attendance.length > 0) {
    sql += `INSERT INTO \`presensi_harian\` (\`id\`, \`siswa_id\`, \`kelas_id\`, \`tanggal\`, \`status\`, \`keterangan\`) VALUES\n`;
    sql += attendance.map(a => {
      return `(${escapeSql(a.id)}, ${escapeSql(a.studentId)}, ${escapeSql(a.classId)}, ${escapeSql(a.date)}, ${escapeSql(a.status)}, ${escapeSql(a.notes)})`;
    }).join(',\n') + ';\n\n';
  }

  // 8. Academic Calendar
  sql += `-- -----------------------------------------------------------------------
-- 8. TABEL: kalender_akademik
-- -----------------------------------------------------------------------
DROP TABLE IF EXISTS \`kalender_akademik\`;
CREATE TABLE \`kalender_akademik\` (
  \`id\` VARCHAR(50) PRIMARY KEY,
  \`tanggal_mulai\` DATE NOT NULL,
  \`tanggal_selesai\` DATE DEFAULT NULL,
  \`kegiatan\` VARCHAR(255) NOT NULL,
  \`kategori\` ENUM('Ujian', 'Libur', 'Kegiatan', 'Rapor', 'Upacara') NOT NULL,
  \`deskripsi\` TEXT DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

`;

  if (calendar.length > 0) {
    sql += `INSERT INTO \`kalender_akademik\` (\`id\`, \`tanggal_mulai\`, \`tanggal_selesai\`, \`kegiatan\`, \`kategori\`, \`deskripsi\`) VALUES\n`;
    sql += calendar.map(c => {
      return `(${escapeSql(c.id)}, ${escapeSql(c.startDate)}, ${escapeSql(c.endDate)}, ${escapeSql(c.title)}, ${escapeSql(c.category)}, ${escapeSql(c.description)})`;
    }).join(',\n') + ';\n\n';
  }

  sql += `COMMIT;
SET FOREIGN_KEY_CHECKS = 1;
-- AKHIR DOKUMEN EKSPOR SQL
`;

  return sql;
}

export function downloadSqlBlob(sqlContent: string, filename = 'siakad_sdn_lubang_buaya_04.sql') {
  const blob = new Blob([sqlContent], { type: 'application/sql;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
