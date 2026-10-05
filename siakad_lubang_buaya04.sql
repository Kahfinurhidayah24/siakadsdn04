-- =======================================================================
-- SISTEM INFORMASI AKADEMIK (SIAKAD) & E-RAPOR RESMI
-- SEKOLAH DASAR NEGERI LUBANG BUAYA 04 PAGI
-- KECAMATAN CIPAYUNG - KOTA ADMINISTRASI JAKARTA TIMUR
-- PROVINSI D.K.I. JAKARTA
--
-- NPSN         : 20104241
-- NSS          : 101016408004
-- Akreditasi   : A (Unggul)
-- Kurikulum    : Kurikulum Merdeka
-- Dibuat       : Database Relasional MySQL / MariaDB / PostgreSQL
-- =======================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+07:00";

-- -----------------------------------------------------------------------
-- 1. DATABASE INITIALIZATION
-- -----------------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS `siakad_lubang_buaya_04` 
DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `siakad_lubang_buaya_04`;

-- -----------------------------------------------------------------------
-- 2. TABEL: profil_sekolah (School Profile)
-- -----------------------------------------------------------------------
DROP TABLE IF EXISTS `profil_sekolah`;
CREATE TABLE `profil_sekolah` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nama_sekolah` VARCHAR(150) NOT NULL,
  `npsn` VARCHAR(20) NOT NULL UNIQUE,
  `nss` VARCHAR(30) DEFAULT NULL,
  `akreditasi` VARCHAR(10) NOT NULL DEFAULT 'A',
  `kurikulum` VARCHAR(50) NOT NULL DEFAULT 'Kurikulum Merdeka',
  `alamat_jalan` TEXT NOT NULL,
  `kelurahan` VARCHAR(100) NOT NULL,
  `kecamatan` VARCHAR(100) NOT NULL,
  `kab_kota` VARCHAR(100) NOT NULL,
  `provinsi` VARCHAR(100) NOT NULL,
  `telepon` VARCHAR(30) DEFAULT NULL,
  `email_resmi` VARCHAR(100) DEFAULT NULL,
  `website` VARCHAR(150) DEFAULT NULL,
  `nama_kepsek` VARCHAR(150) NOT NULL,
  `nip_kepsek` VARCHAR(30) NOT NULL,
  `total_rombel` INT NOT NULL DEFAULT 18,
  `total_siswa` INT NOT NULL DEFAULT 573,
  `siswa_laki` INT NOT NULL DEFAULT 274,
  `siswa_perempuan` INT NOT NULL DEFAULT 299,
  `total_guru` INT NOT NULL DEFAULT 22,
  `visi` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `profil_sekolah` (
  `id`, `nama_sekolah`, `npsn`, `nss`, `akreditasi`, `kurikulum`,
  `alamat_jalan`, `kelurahan`, `kecamatan`, `kab_kota`, `provinsi`,
  `telepon`, `email_resmi`, `website`, `nama_kepsek`, `nip_kepsek`,
  `total_rombel`, `total_siswa`, `siswa_laki`, `siswa_perempuan`, `total_guru`, `visi`
) VALUES (
  1, 
  'SDN LUBANG BUAYA 04 PAGI', 
  '20104241', 
  '101016408004', 
  'A (Unggul)', 
  'Kurikulum Merdeka',
  'Jl. Monumen Pancasila Sakti Rt.001/02 No. 12, Kec. Cipayung', 
  'Lubang Buaya', 
  'Kec. Cipayung', 
  'Kota Adm. Jakarta Timur', 
  'Prov. D.K.I. Jakarta',
  '(021) 8408194', 
  'sdnlubangbuaya04@jakarta.go.id', 
  'https://sdnlubangbuaya04pagi.sch.id',
  'Hj. Sri Rahayu, M.Pd', 
  '196805121991032004',
  18, 573, 274, 299, 22,
  'Terwujudnya Peserta Didik yang Beriman, Berkarakter Luhur, Unggul dalam Prestasi, Berwawasan Global, dan Berbudaya Lingkungan.'
);

-- -----------------------------------------------------------------------
-- 3. TABEL: users (Akun Pengguna Sistem)
-- -----------------------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` VARCHAR(50) PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `nama_lengkap` VARCHAR(150) NOT NULL,
  `role` ENUM('admin', 'kepsek', 'guru', 'siswa') NOT NULL,
  `email` VARCHAR(100) DEFAULT NULL,
  `avatar_url` TEXT DEFAULT NULL,
  `reference_id` VARCHAR(50) DEFAULT NULL,
  `is_wali_kelas` BOOLEAN DEFAULT FALSE,
  `assigned_class` VARCHAR(10) DEFAULT NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `users` (`id`, `username`, `password_hash`, `nama_lengkap`, `role`, `email`, `is_wali_kelas`, `assigned_class`, `is_active`) VALUES
('usr-admin', 'admin', '$2y$10$AdminHash1234567890123456', 'Administrator SIAKAD (Pusat)', 'admin', 'admin.siakad@jakarta.go.id', FALSE, NULL, TRUE),
('usr-kepsek', 'kepsek', '$2y$10$KepsekHash123456789012345', 'Hj. Sri Rahayu, M.Pd', 'kepsek', 'kepsek@sdnlubangbuaya04pagi.sch.id', FALSE, NULL, TRUE),
('usr-guru-1', 'guru', '$2y$10$GuruHash12345678901234567', 'Budi Santoso, S.Pd', 'guru', 'budi.santoso@sekolah.id', TRUE, '4A', TRUE),
('usr-siswa-1', 'siswa', '$2y$10$SiswaHash1234567890123456', 'Muhammad Farhan Al-Faris', 'siswa', 'farhan.alfaris@siswa.sekolah.id', FALSE, NULL, TRUE),
('usr-siswa-nisn', '0098765432', '$2y$10$SiswaHash1234567890123456', 'Muhammad Farhan Al-Faris', 'siswa', 'farhan.alfaris@siswa.sekolah.id', FALSE, NULL, TRUE);

-- -----------------------------------------------------------------------
-- 4. TABEL: kelas (18 Rombongan Belajar)
-- -----------------------------------------------------------------------
DROP TABLE IF EXISTS `kelas`;
CREATE TABLE `kelas` (
  `id` VARCHAR(10) PRIMARY KEY,
  `tingkat` INT NOT NULL CHECK (`tingkat` BETWEEN 1 AND 6),
  `nama_kelas` VARCHAR(20) NOT NULL,
  `wali_kelas_id` VARCHAR(50) DEFAULT NULL,
  `wali_kelas_nama` VARCHAR(150) DEFAULT NULL,
  `kapasitas_maksimal` INT DEFAULT 32,
  `jumlah_siswa` INT DEFAULT 0,
  `ruang_kelas` VARCHAR(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `kelas` (`id`, `tingkat`, `nama_kelas`, `wali_kelas_nama`, `ruang_kelas`, `jumlah_siswa`) VALUES
('1A', 1, 'Kelas 1A', 'Dra. Siti Aminah', 'Ruang 01 (Lantai 1)', 32),
('1B', 1, 'Kelas 1B', 'Nurul Hidayah, S.Pd.SD', 'Ruang 02 (Lantai 1)', 32),
('1C', 1, 'Kelas 1C', 'Eka Prasetya, S.Pd', 'Ruang 03 (Lantai 1)', 31),
('2A', 2, 'Kelas 2A', 'Rina Marlina, S.Pd', 'Ruang 04 (Lantai 1)', 32),
('2B', 2, 'Kelas 2B', 'Dewi Lestari, S.Pd', 'Ruang 05 (Lantai 1)', 32),
('2C', 2, 'Kelas 2C', 'Bambang Supriyadi, S.Pd', 'Ruang 06 (Lantai 1)', 31),
('3A', 3, 'Kelas 3A', 'Fitri Handayani, S.Pd', 'Ruang 07 (Lantai 2)', 32),
('3B', 3, 'Kelas 3B', 'Agus Setiawan, S.Pd', 'Ruang 08 (Lantai 2)', 32),
('3C', 3, 'Kelas 3C', 'Indah Permatasari, S.Pd', 'Ruang 09 (Lantai 2)', 31),
('4A', 4, 'Kelas 4A', 'Budi Santoso, S.Pd', 'Ruang 01 (Sesi Siang)', 32),
('4B', 4, 'Kelas 4B', 'Ahmad Fauzi, M.Pd', 'Ruang 02 (Sesi Siang)', 32),
('4C', 4, 'Kelas 4C', 'Sri Wahyuni, S.Pd.SD', 'Ruang 03 (Sesi Siang)', 32),
('5A', 5, 'Kelas 5A', 'Hendro Wicaksono, S.Pd', 'Ruang 04 (Sesi Siang)', 32),
('5B', 5, 'Kelas 5B', 'Yulia Safitri, S.Pd', 'Ruang 05 (Sesi Siang)', 32),
('5C', 5, 'Kelas 5C', 'Dedi Kurniawan, S.Pd', 'Ruang 06 (Sesi Siang)', 31),
('6A', 6, 'Kelas 6A', 'Hj. Endang Sulastri, S.Pd', 'Ruang 07 (Sesi Siang)', 32),
('6B', 6, 'Kelas 6B', 'M. Rizky Pratama, M.Pd', 'Ruang 08 (Sesi Siang)', 32),
('6C', 6, 'Kelas 6C', 'Tri Susilowati, S.Pd', 'Ruang 09 (Sesi Siang)', 31);

-- -----------------------------------------------------------------------
-- 5. TABEL: guru (Tenaga Pendidik)
-- -----------------------------------------------------------------------
DROP TABLE IF EXISTS `guru`;
CREATE TABLE `guru` (
  `id` VARCHAR(50) PRIMARY KEY,
  `nip` VARCHAR(30) NOT NULL UNIQUE,
  `nuptk` VARCHAR(30) DEFAULT NULL,
  `nama_lengkap` VARCHAR(150) NOT NULL,
  `jenis_kelamin` ENUM('L', 'P') NOT NULL,
  `tempat_lahir` VARCHAR(100) DEFAULT NULL,
  `tanggal_lahir` DATE DEFAULT NULL,
  `no_telepon` VARCHAR(30) DEFAULT NULL,
  `email` VARCHAR(100) NOT NULL,
  `mata_pelajaran_ampu` TEXT DEFAULT NULL,
  `is_wali_kelas` BOOLEAN NOT NULL DEFAULT FALSE,
  `wali_kelas_id` VARCHAR(10) DEFAULT NULL,
  `status_kepegawaian` ENUM('PNS', 'PPPK', 'Honorer') NOT NULL DEFAULT 'PNS',
  `foto_url` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `guru` (`id`, `nip`, `nuptk`, `nama_lengkap`, `jenis_kelamin`, `tempat_lahir`, `tanggal_lahir`, `no_telepon`, `email`, `mata_pelajaran_ampu`, `is_wali_kelas`, `wali_kelas_id`, `status_kepegawaian`) VALUES
('tch-1', '198203152006041008', '4534760662200022', 'Budi Santoso, S.Pd', 'L', 'Jakarta', '1982-03-15', '081287654321', 'budi.santoso@sekolah.id', 'Matematika, IPAS', TRUE, '4A', 'PNS'),
('tch-2', '198507202009022005', '7845763665210013', 'Dra. Siti Aminah', 'P', 'Bogor', '1985-07-20', '081398765412', 'siti.aminah@sekolah.id', 'Bahasa Indonesia, Pendidikan Pancasila', TRUE, '1A', 'PNS'),
('tch-3', '197911102005011003', '3456761663200032', 'Ahmad Fauzi, M.Pd', 'L', 'Jakarta', '1979-11-10', '085712345678', 'ahmad.fauzi@sekolah.id', 'Pendidikan Agama & Budi Pekerti', TRUE, '4B', 'PNS'),
('tch-4', '199004122019032015', '8956768670230002', 'Sri Wahyuni, S.Pd.SD', 'P', 'Bekasi', '1990-04-12', '087812349876', 'sri.wahyuni@sekolah.id', 'IPAS, Seni Rupa & Budaya', TRUE, '4C', 'PPPK'),
('tch-5', '198812052014021002', '5678766668200043', 'Reza Kurniawan, S.Pd', 'L', 'Jakarta', '1988-12-05', '081987651234', 'reza.kurniawan@sekolah.id', 'PJOK', FALSE, NULL, 'PNS'),
('tch-6', '199208182020122018', '9012770672230014', 'Nurul Hidayah, S.Pd', 'P', 'Depok', '1992-08-18', '085698741235', 'nurul.hidayah@sekolah.id', 'Bahasa Inggris, PLBJ', FALSE, NULL, 'PPPK');

-- -----------------------------------------------------------------------
-- 6. TABEL: mata_pelajaran (Subjects Kurikulum Merdeka)
-- -----------------------------------------------------------------------
DROP TABLE IF EXISTS `mata_pelajaran`;
CREATE TABLE `mata_pelajaran` (
  `id` VARCHAR(50) PRIMARY KEY,
  `kode_mapel` VARCHAR(20) NOT NULL UNIQUE,
  `nama_mapel` VARCHAR(100) NOT NULL,
  `kategori` ENUM('Wajib', 'Muatan Lokal', 'Pilihan') NOT NULL DEFAULT 'Wajib',
  `kkm_kktp` INT NOT NULL DEFAULT 75,
  `tingkat_kelas` VARCHAR(50) NOT NULL DEFAULT '1,2,3,4,5,6'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `mata_pelajaran` (`id`, `kode_mapel`, `nama_mapel`, `kategori`, `kkm_kktp`, `tingkat_kelas`) VALUES
('sub-1', 'PAIBP', 'Pendidikan Agama & Budi Pekerti', 'Wajib', 75, '1,2,3,4,5,6'),
('sub-2', 'PPKN', 'Pendidikan Pancasila', 'Wajib', 75, '1,2,3,4,5,6'),
('sub-3', 'BIND', 'Bahasa Indonesia', 'Wajib', 75, '1,2,3,4,5,6'),
('sub-4', 'MTK', 'Matematika', 'Wajib', 70, '1,2,3,4,5,6'),
('sub-5', 'IPAS', 'Ilmu Pengetahuan Alam & Sosial (IPAS)', 'Wajib', 75, '3,4,5,6'),
('sub-6', 'PJOK', 'Pendidikan Jasmani, Olahraga & Kesehatan', 'Wajib', 75, '1,2,3,4,5,6'),
('sub-7', 'SNRB', 'Seni Rupa & Budaya', 'Wajib', 75, '1,2,3,4,5,6'),
('sub-8', 'BING', 'Bahasa Inggris', 'Pilihan', 72, '1,2,3,4,5,6'),
('sub-9', 'PLBJ', 'Pendidikan Lingkungan & Budaya Jakarta', 'Muatan Lokal', 75, '1,2,3,4,5,6');

-- -----------------------------------------------------------------------
-- 7. TABEL: siswa (Peserta Didik)
-- -----------------------------------------------------------------------
DROP TABLE IF EXISTS `siswa`;
CREATE TABLE `siswa` (
  `id` VARCHAR(50) PRIMARY KEY,
  `nis` VARCHAR(20) NOT NULL UNIQUE,
  `nisn` VARCHAR(20) NOT NULL UNIQUE,
  `nama_lengkap` VARCHAR(150) NOT NULL,
  `jenis_kelamin` ENUM('L', 'P') NOT NULL,
  `tempat_lahir` VARCHAR(100) NOT NULL,
  `tanggal_lahir` DATE NOT NULL,
  `agama` VARCHAR(50) NOT NULL DEFAULT 'Islam',
  `alamat` TEXT NOT NULL,
  `no_telepon` VARCHAR(30) DEFAULT NULL,
  `email` VARCHAR(100) DEFAULT NULL,
  `foto_url` LONGTEXT DEFAULT NULL,
  `tanda_tangan_url` LONGTEXT DEFAULT NULL,
  `tahun_masuk` VARCHAR(10) NOT NULL DEFAULT '2022',
  `kelas_id` VARCHAR(10) NOT NULL,
  `status` ENUM('Aktif', 'Lulus', 'Mutasi Keluar', 'Pindah Kelas') NOT NULL DEFAULT 'Aktif',
  `nama_ayah` VARCHAR(100) DEFAULT NULL,
  `pekerjaan_ayah` VARCHAR(100) DEFAULT NULL,
  `nama_ibu` VARCHAR(100) DEFAULT NULL,
  `pekerjaan_ibu` VARCHAR(100) DEFAULT NULL,
  `nama_wali` VARCHAR(100) DEFAULT NULL,
  `no_telepon_ortu` VARCHAR(30) DEFAULT NULL,
  `alamat_ortu` TEXT DEFAULT NULL,
  `nik_ortu` VARCHAR(30) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`kelas_id`) REFERENCES `kelas`(`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `siswa` (
  `id`, `nis`, `nisn`, `nama_lengkap`, `jenis_kelamin`, `tempat_lahir`, `tanggal_lahir`,
  `agama`, `alamat`, `no_telepon`, `email`, `tahun_masuk`, `kelas_id`, `status`,
  `nama_ayah`, `pekerjaan_ayah`, `nama_ibu`, `pekerjaan_ibu`, `no_telepon_ortu`
) VALUES
('std-1', '222301001', '0098765432', 'Muhammad Farhan Al-Faris', 'L', 'Jakarta', '2014-05-14', 'Islam', 'Jl. Kramat No. 15 RT 03/RW 02, Lubang Buaya, Cipayung, Jakarta Timur', '081298761234', 'farhan.alfaris@siswa.sekolah.id', '2022', '4A', 'Aktif', 'Ahmad Faris', 'Karyawan Swasta', 'Siti Maryam', 'Ibu Rumah Tangga', '081298761234'),
('std-2', '222301002', '0098765433', 'Aisyah Putri Azzahra', 'P', 'Jakarta', '2014-08-22', 'Islam', 'Jl. Al-Baidho No. 8 RT 01/RW 06, Lubang Buaya, Cipayung', '081345678901', 'aisyah.azzahra@siswa.sekolah.id', '2022', '4A', 'Aktif', 'Bambang Irawan', 'Wiraswasta', 'Nur Hasanah', 'Guru Swasta', '081345678901'),
('std-3', '222301003', '0098765434', 'Dimas Satria Pratama', 'L', 'Bekasi', '2014-02-10', 'Islam', 'Jl. Rawa Binong No. 44 RT 04/RW 10, Lubang Buaya', '087812345678', 'dimas.satria@siswa.sekolah.id', '2022', '4A', 'Aktif', 'Hendra Pratama', 'PNS / ASN', 'Rini Astuti', 'Karyawan Swasta', '087812345678'),
('std-4', '222301004', '0098765435', 'Nayla Khairunisa', 'P', 'Jakarta', '2014-11-03', 'Islam', 'Jl. Raya Pondok Gede No. 20, Lubang Buaya', '085678901234', 'nayla.k@siswa.sekolah.id', '2022', '4A', 'Aktif', 'Syamsul Bahri', 'TNI / POLRI', 'Dewi Susanti', 'Wiraswasta', '085678901234'),
('std-5', '222301005', '0098765436', 'Kevin Christian Jonathan', 'L', 'Jakarta', '2014-06-18', 'Kristen', 'Jl. Manunggal XVII No. 12 RT 02/RW 05, Lubang Buaya', '081234567890', 'kevin.jonathan@siswa.sekolah.id', '2022', '4A', 'Aktif', 'Jonathan Simanjuntak', 'Wiraswasta', 'Maria Hutapea', 'Bidan', '081234567890'),
('std-6', '222301006', '0098765437', 'Zahra Amelia Shafira', 'P', 'Jakarta', '2014-09-29', 'Islam', 'Jl. Bambu Apus Raya No. 33, Cipayung, Jakarta Timur', '081398765432', 'zahra.amelia@siswa.sekolah.id', '2022', '4A', 'Aktif', 'Rudi Hartono', 'Karyawan Swasta', 'Eka Fatmawati', 'Ibu Rumah Tangga', '081398765432');

-- -----------------------------------------------------------------------
-- 8. TABEL: nilai_rapor (E-Rapor Kurikulum Merdeka)
-- -----------------------------------------------------------------------
DROP TABLE IF EXISTS `nilai_rapor`;
CREATE TABLE `nilai_rapor` (
  `id` VARCHAR(50) PRIMARY KEY,
  `siswa_id` VARCHAR(50) NOT NULL,
  `mapel_id` VARCHAR(50) NOT NULL,
  `kelas_id` VARCHAR(10) NOT NULL,
  `tahun_ajaran` VARCHAR(20) NOT NULL DEFAULT '2025/2026',
  `semester` ENUM('Ganjil', 'Genap') NOT NULL DEFAULT 'Genap',
  `nilai_formatif` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `nilai_pts_uts` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `nilai_pas_uas` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `nilai_akhir` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `capaian_kompetensi` TEXT DEFAULT NULL,
  `is_locked` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`siswa_id`) REFERENCES `siswa`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`mapel_id`) REFERENCES `mata_pelajaran`(`id`),
  FOREIGN KEY (`kelas_id`) REFERENCES `kelas`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `nilai_rapor` (
  `id`, `siswa_id`, `mapel_id`, `kelas_id`, `tahun_ajaran`, `semester`,
  `nilai_formatif`, `nilai_pts_uts`, `nilai_pas_uas`, `nilai_akhir`, `capaian_kompetensi`, `is_locked`
) VALUES
('grd-1-1', 'std-1', 'sub-1', '4A', '2025/2026', 'Genap', 88, 85, 90, 88, 'Menunjukkan penguasaan sangat baik dalam memahami makna Asmaul Husna dan penerapannya dalam kehidupan sehari-hari.', TRUE),
('grd-1-2', 'std-1', 'sub-2', '4A', '2025/2026', 'Genap', 85, 82, 88, 85, 'Sangat baik dalam memahami simbol-simbol sila Pancasila dan perilaku musyawarah mufakat di lingkungan sekolah.', TRUE),
('grd-1-3', 'std-1', 'sub-3', '4A', '2025/2026', 'Genap', 86, 84, 88, 86, 'Mampu mengidentifikasi ide pokok teks narasi dan menyusun karangan deskripsi secara sistematis dan rapi.', TRUE),
('grd-1-4', 'std-1', 'sub-4', '4A', '2025/2026', 'Genap', 92, 90, 94, 92, 'Sangat unggul dalam menyelesaikan soal pemecahan masalah pecahan senilai dan operasi hitung keliling bangun datar.', TRUE),
('grd-1-5', 'std-1', 'sub-5', '4A', '2025/2026', 'Genap', 87, 85, 89, 87, 'Sangat baik dalam mendeskripsikan siklus air dan upaya pelestarian keanekaragaman hayati lingkungan setempat.', TRUE),
('grd-1-6', 'std-1', 'sub-6', '4A', '2025/2026', 'Genap', 84, 80, 85, 83, 'Terampil mempraktikkan variasi pola gerak dasar lokomotor dan manipulatif dalam permainan kasti.', TRUE),
('grd-1-7', 'std-1', 'sub-7', '4A', '2025/2026', 'Genap', 88, 85, 90, 88, 'Kreatif dalam menciptakan karya seni rupa dua dimensi menggunakan teknik kolase bahan alam khas Betawi.', TRUE),
('grd-1-8', 'std-1', 'sub-8', '4A', '2025/2026', 'Genap', 82, 80, 85, 82, 'Mampu memperkenalkan diri dan anggota keluarga dalam bahasa Inggris secara komunikatif dan percaya diri.', TRUE),
('grd-1-9', 'std-1', 'sub-9', '4A', '2025/2026', 'Genap', 90, 88, 92, 90, 'Sangat memahami sejarah ornamen Betawi Gigi Balang dan ragam permainan tradisional Keripik Jengkol.', TRUE),

('grd-2-1', 'std-2', 'sub-1', '4A', '2025/2026', 'Genap', 92, 90, 95, 92, 'Menunjukkan penguasaan sangat tinggi dalam hafalan surah-surah pendek dan penerapan adab berteman.', TRUE),
('grd-2-4', 'std-2', 'sub-4', '4A', '2025/2026', 'Genap', 88, 86, 90, 88, 'Baik dalam memahami konsep pecahan dan membaca data sederhana dalam bentuk diagram batang.', TRUE),
('grd-2-5', 'std-2', 'sub-5', '4A', '2025/2026', 'Genap', 91, 89, 93, 91, 'Sangat cermat dalam mengamati proses fotosintesis dan rantai makanan pada ekosistem darat.', TRUE);

-- -----------------------------------------------------------------------
-- 9. TABEL: presensi_harian (Attendance Log)
-- -----------------------------------------------------------------------
DROP TABLE IF EXISTS `presensi_harian`;
CREATE TABLE `presensi_harian` (
  `id` VARCHAR(50) PRIMARY KEY,
  `siswa_id` VARCHAR(50) NOT NULL,
  `kelas_id` VARCHAR(10) NOT NULL,
  `tanggal` DATE NOT NULL,
  `status` ENUM('Hadir', 'Sakit', 'Izin', 'Alpa') NOT NULL DEFAULT 'Hadir',
  `keterangan` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`siswa_id`) REFERENCES `siswa`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`kelas_id`) REFERENCES `kelas`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `presensi_harian` (`id`, `siswa_id`, `kelas_id`, `tanggal`, `status`, `keterangan`) VALUES
('att-1', 'std-1', '4A', '2026-03-10', 'Hadir', 'Tepat waktu'),
('att-2', 'std-2', '4A', '2026-03-10', 'Hadir', 'Tepat waktu'),
('att-3', 'std-3', '4A', '2026-03-10', 'Hadir', 'Tepat waktu'),
('att-4', 'std-4', '4A', '2026-03-10', 'Izin', 'Ada keperluan keluarga'),
('att-5', 'std-5', '4A', '2026-03-10', 'Hadir', 'Tepat waktu'),
('att-6', 'std-6', '4A', '2026-03-10', 'Hadir', 'Tepat waktu');

-- -----------------------------------------------------------------------
-- 10. TABEL: jadwal_pelajaran (Schedules)
-- -----------------------------------------------------------------------
DROP TABLE IF EXISTS `jadwal_pelajaran`;
CREATE TABLE `jadwal_pelajaran` (
  `id` VARCHAR(50) PRIMARY KEY,
  `hari` ENUM('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat') NOT NULL,
  `jam_mulai` TIME NOT NULL,
  `jam_selesai` TIME NOT NULL,
  `kelas_id` VARCHAR(10) NOT NULL,
  `mapel_id` VARCHAR(50) NOT NULL,
  `guru_id` VARCHAR(50) NOT NULL,
  `ruangan` VARCHAR(50) DEFAULT NULL,
  FOREIGN KEY (`kelas_id`) REFERENCES `kelas`(`id`),
  FOREIGN KEY (`mapel_id`) REFERENCES `mata_pelajaran`(`id`),
  FOREIGN KEY (`guru_id`) REFERENCES `guru`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `jadwal_pelajaran` (`id`, `hari`, `jam_mulai`, `jam_selesai`, `kelas_id`, `mapel_id`, `guru_id`, `ruangan`) VALUES
('sch-1', 'Senin', '07:00:00', '08:20:00', '4A', 'sub-2', 'tch-2', 'Ruang 01 (Sesi Siang)'),
('sch-2', 'Senin', '08:20:00', '09:40:00', '4A', 'sub-4', 'tch-1', 'Ruang 01 (Sesi Siang)'),
('sch-3', 'Senin', '10:00:00', '11:20:00', '4A', 'sub-3', 'tch-2', 'Ruang 01 (Sesi Siang)'),
('sch-4', 'Selasa', '07:00:00', '08:20:00', '4A', 'sub-5', 'tch-1', 'Lab IPA / Ruang 01'),
('sch-5', 'Selasa', '08:20:00', '09:40:00', '4A', 'sub-1', 'tch-3', 'Ruang 01 (Sesi Siang)'),
('sch-6', 'Rabu', '07:00:00', '08:20:00', '4A', 'sub-6', 'tch-5', 'Lapangan Olahraga'),
('sch-7', 'Kamis', '07:00:00', '08:20:00', '4A', 'sub-9', 'tch-6', 'Ruang 01 (Sesi Siang)'),
('sch-8', 'Jumat', '07:00:00', '08:20:00', '4A', 'sub-7', 'tch-4', 'Ruang 01 (Sesi Siang)');

-- -----------------------------------------------------------------------
-- 11. TABEL: prestasi_siswa (Student Achievements)
-- -----------------------------------------------------------------------
DROP TABLE IF EXISTS `prestasi_siswa`;
CREATE TABLE `prestasi_siswa` (
  `id` VARCHAR(50) PRIMARY KEY,
  `siswa_id` VARCHAR(50) NOT NULL,
  `judul_prestasi` VARCHAR(200) NOT NULL,
  `tingkat` ENUM('Sekolah', 'Kecamatan', 'Kota', 'Provinsi', 'Nasional', 'Internasional') NOT NULL,
  `peringkat` VARCHAR(50) NOT NULL,
  `tahun` VARCHAR(10) NOT NULL,
  `no_sertifikat` VARCHAR(100) DEFAULT NULL,
  FOREIGN KEY (`siswa_id`) REFERENCES `siswa`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `prestasi_siswa` (`id`, `siswa_id`, `judul_prestasi`, `tingkat`, `peringkat`, `tahun`, `no_sertifikat`) VALUES
('ach-1', 'std-1', 'Olimpiade Sains & Matematika Nasional SD', 'Kota', 'Juara 1', '2025', 'SERT/OSN/JT/2025/089'),
('ach-2', 'std-2', 'Festival Lomba Seni Siswa Nasional (FLS2N) Menyanyi Tunggal', 'Kecamatan', 'Juara 2', '2025', 'FLS2N/CPY/2025/042'),
('ach-3', 'std-4', 'Kejuaraan Renang Tingkat Pelajar DKI Jakarta', 'Provinsi', 'Juara 3', '2025', 'PRSI/DKI/2025/112');

-- -----------------------------------------------------------------------
-- 12. TABEL: kalender_akademik (Academic Calendar)
-- -----------------------------------------------------------------------
DROP TABLE IF EXISTS `kalender_akademik`;
CREATE TABLE `kalender_akademik` (
  `id` VARCHAR(50) PRIMARY KEY,
  `tanggal_mulai` DATE NOT NULL,
  `tanggal_selesai` DATE DEFAULT NULL,
  `kegiatan` VARCHAR(255) NOT NULL,
  `kategori` ENUM('Ujian', 'Libur', 'Kegiatan', 'Rapor', 'Upacara') NOT NULL,
  `deskripsi` TEXT DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `kalender_akademik` (`id`, `tanggal_mulai`, `tanggal_selesai`, `kegiatan`, `kategori`, `deskripsi`) VALUES
('cal-1', '2026-03-16', '2026-03-20', 'Penilaian Tengah Semester (PTS) Genap', 'Ujian', 'Pelaksanaan PTS tertulis serentak Kelas 1-6 berbasis Kurikulum Merdeka'),
('cal-2', '2026-03-28', '2026-04-03', 'Libur Awal & Hari Raya Idul Fitri 1447 H', 'Libur', 'Libur resmi kalender pendidikan Dinas Pendidikan DKI'),
('cal-3', '2026-05-18', '2026-05-23', 'Asesmen Sumatif Akhir Jenjang Kelas 6', 'Ujian', 'Ujian kelulusan akhir sekolah tingkat SD'),
('cal-4', '2026-06-08', '2026-06-12', 'Penilaian Akhir Tahun (PAT) / Sumatif Akhir Semester', 'Ujian', 'Pelaksanaan asesmen akhir kelas 1 sampai 5'),
('cal-5', '2026-06-25', '2026-06-26', 'Pembagian Buku Rapor Semester Genap Resmi', 'Rapor', 'Penyerahan E-Rapor cetak kepada orang tua/wali murid');

-- -----------------------------------------------------------------------
-- 13. TABEL: log_aktivitas (Audit Trail)
-- -----------------------------------------------------------------------
DROP TABLE IF EXISTS `log_aktivitas`;
CREATE TABLE `log_aktivitas` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `waktu` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `user_nama` VARCHAR(150) NOT NULL,
  `user_role` VARCHAR(50) NOT NULL,
  `aksi` VARCHAR(100) NOT NULL,
  `rincian` TEXT DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `log_aktivitas` (`user_nama`, `user_role`, `aksi`, `rincian`) VALUES
('Administrator SIAKAD', 'admin', 'Inisialisasi Database', 'Penyusunan basis data awal SDN Lubang Buaya 04 Pagi 18 Rombel'),
('Hj. Sri Rahayu, M.Pd', 'kepsek', 'Validasi Rapor', 'Penguncian nilai rapor semester genap kelas 4A');

-- -----------------------------------------------------------------------
-- 14. VIEWS: Query Siap Pakai untuk Analitik dan Rekapitulasi
-- -----------------------------------------------------------------------

-- View Rekapitulasi Rapor Siswa Lengkap
CREATE OR REPLACE VIEW `v_rekap_nilai_siswa` AS
SELECT 
  s.id AS siswa_id,
  s.nis,
  s.nisn,
  s.nama_lengkap AS nama_siswa,
  s.kelas_id,
  m.kode_mapel,
  m.nama_mapel,
  m.kkm_kktp,
  n.tahun_ajaran,
  n.semester,
  n.nilai_formatif,
  n.nilai_pts_uts,
  n.nilai_pas_uas,
  n.nilai_akhir,
  CASE 
    WHEN n.nilai_akhir >= 90 THEN 'A (Sangat Baik)'
    WHEN n.nilai_akhir >= 80 THEN 'B (Baik)'
    WHEN n.nilai_akhir >= m.kkm_kktp THEN 'C (Cukup / Tuntas)'
    ELSE 'D (Perlu Bimbingan)'
  END AS predikat,
  n.capaian_kompetensi
FROM `siswa` s
JOIN `nilai_rapor` n ON s.id = n.siswa_id
JOIN `mata_pelajaran` m ON n.mapel_id = m.id;

-- View Kartu Pelajar Digital
CREATE OR REPLACE VIEW `v_kartu_pelajar` AS
SELECT 
  s.id AS siswa_id,
  s.nis,
  s.nisn,
  s.nama_lengkap,
  s.jenis_kelamin,
  s.tempat_lahir,
  s.tanggal_lahir,
  s.kelas_id,
  s.tahun_masuk,
  p.nama_sekolah,
  p.npsn,
  p.nama_kepsek,
  p.nip_kepsek
FROM `siswa` s
CROSS JOIN `profil_sekolah` p;

-- -----------------------------------------------------------------------
-- 14. TABEL TAMBAHAN (dipakai aplikasi: pelanggaran, mutasi, surat)
--     Tabel ini juga dibuat otomatis oleh server aplikasi bila belum ada.
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `pelanggaran_siswa` (
  `id` VARCHAR(50) PRIMARY KEY,
  `siswa_id` VARCHAR(50) NOT NULL,
  `nama_siswa` VARCHAR(150) NOT NULL,
  `kelas_id` VARCHAR(10) NOT NULL,
  `tanggal` DATE NOT NULL,
  `jenis_pelanggaran` VARCHAR(200) NOT NULL,
  `poin` INT NOT NULL DEFAULT 0,
  `tindakan` VARCHAR(255) DEFAULT NULL,
  `catatan` TEXT DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `mutasi_siswa` (
  `id` VARCHAR(50) PRIMARY KEY,
  `siswa_id` VARCHAR(50) NOT NULL,
  `nama_siswa` VARCHAR(150) NOT NULL,
  `nisn` VARCHAR(20) DEFAULT NULL,
  `jenis_mutasi` VARCHAR(30) NOT NULL,
  `tanggal` DATE NOT NULL,
  `dari` VARCHAR(200) DEFAULT NULL,
  `ke` VARCHAR(200) DEFAULT NULL,
  `alasan` TEXT DEFAULT NULL,
  `no_dokumen` VARCHAR(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `surat_keterangan` (
  `id` VARCHAR(50) PRIMARY KEY,
  `nomor_surat` VARCHAR(100) NOT NULL,
  `siswa_id` VARCHAR(50) NOT NULL,
  `nama_siswa` VARCHAR(150) NOT NULL,
  `nis` VARCHAR(20) DEFAULT NULL,
  `nisn` VARCHAR(20) DEFAULT NULL,
  `kelas_id` VARCHAR(10) DEFAULT NULL,
  `jenis_surat` VARCHAR(60) NOT NULL,
  `tanggal_terbit` VARCHAR(50) NOT NULL,
  `keperluan` TEXT DEFAULT NULL,
  `nama_kepsek` VARCHAR(150) DEFAULT NULL,
  `nip_kepsek` VARCHAR(30) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Pengaturan aplikasi (mis. tema warna yang dipilih Admin, berlaku untuk semua akun)
CREATE TABLE IF NOT EXISTS `pengaturan_aplikasi` (
  `kunci` VARCHAR(50) NOT NULL,
  `nilai` MEDIUMTEXT NOT NULL,
  `diubah_pada` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`kunci`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMIT;
SET FOREIGN_KEY_CHECKS = 1;
-- =======================================================================
-- AKHIR DOKUMEN SQL DATABASE SIAKAD SDN LUBANG BUAYA 04 PAGI
-- =======================================================================
