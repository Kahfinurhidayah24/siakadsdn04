# Menyambungkan SIAKAD ke MySQL & phpMyAdmin

Aplikasi sekarang **membaca dan menyimpan data langsung ke MySQL**. Apa pun yang
Anda ubah di aplikasi akan terlihat di phpMyAdmin, dan sebaliknya.

## Cara pakai (XAMPP / Laragon)

1. Buka **XAMPP Control Panel** → klik **Start** pada **MySQL** (dan **Apache** bila ingin membuka phpMyAdmin).
2. Di folder proyek, jalankan:
   ```bash
   npm install
   npm run dev
   ```
3. Buka **http://localhost:3000**.

Database `siakad_lubang_buaya_04` beserta semua tabel dibuat **otomatis** saat server
menyala. Anda tidak wajib mengimpor file `.sql` (boleh juga, hasilnya sama).

4. Buka **http://localhost/phpmyadmin** → database `siakad_lubang_buaya_04`.

## Alur data

| Aksi | Hasil |
|---|---|
| Buka aplikasi | Data **dimuat dari MySQL** |
| Tambah / ubah / hapus di aplikasi | **Otomatis tersimpan** ke MySQL (±1 detik) |
| Ubah data di phpMyAdmin | Refresh halaman aplikasi, atau menu **Database & Backup → Muat Ulang dari MySQL** |

Data yang tersinkron dua arah: siswa, guru, jadwal, nilai rapor, presensi, prestasi,
pelanggaran, mutasi, surat, dan log aktivitas.
Data yang **hanya dibaca** dari MySQL (ubah lewat phpMyAdmin): mata pelajaran (`mata_pelajaran`) dan kalender akademik (`kalender_akademik`).

## Pengaturan koneksi

Default sudah cocok untuk XAMPP (user `root`, tanpa password, port 3306).
Bila berbeda, buat file `.env` di folder proyek:

```env
DB_HOST="localhost"
DB_PORT="3306"
DB_USER="root"
DB_PASSWORD=""
DB_NAME="siakad_lubang_buaya_04"
```

## Jika MySQL mati / belum menyala

Aplikasi tetap berjalan memakai data di browser dan mencoba tersambung lagi tiap 15 detik.
Status koneksi terlihat di menu **Database & Backup**.

Bila Anda mengubah data saat MySQL mati, lalu MySQL menyala kembali, aplikasi **tidak menimpa
diam-diam**. Anda diminta memilih:
- **Muat Ulang dari MySQL** → data aplikasi diganti isi database, atau
- **Kirim Data ke MySQL** → data di aplikasi dikirim ke database.

## Tema warna sekolah

Warna tema yang dipilih **Admin** (klik foto profil di pojok kanan atas) disimpan di tabel
`pengaturan_aplikasi` (kunci `tema`) dan otomatis dipakai oleh **semua akun** saat aplikasi dibuka.
Tabel ini dibuat otomatis saat server menyala. Untuk mengembalikan ke warna awal, klik **Reset**
di menu tema, atau hapus barisnya di phpMyAdmin.

Bila MySQL mati, tema tetap tersimpan di browser dan akan muncul peringatan di menu tema.

## Catatan penting

- **Login** (admin / kepsek / guru / siswa) masih memakai aturan di aplikasi, bukan tabel `users`.
  Tabel `users` belum dipakai untuk login.
- Nilai/presensi/prestasi milik siswa yang tidak ada di tabel `siswa` akan dilewati (tidak disimpan).
- Log aktivitas tidak pernah dihapus dari database (hanya ditambah).
- Index UNIQUE pada `siswa.nis`, `siswa.nisn`, `guru.nip` diganti index biasa agar data
  hasil import Excel yang NIS-nya kosong tetap bisa tersimpan.
- Kolom baru di `siswa`: `alamat_ortu`, `nik_ortu`. Tabel baru: `pelanggaran_siswa`,
  `mutasi_siswa`, `surat_keterangan`.
- Jangan membuka aplikasi di beberapa komputer sekaligus untuk mengedit data yang sama:
  perubahan terakhir yang menang.
