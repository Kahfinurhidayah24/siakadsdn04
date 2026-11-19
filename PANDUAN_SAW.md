# Panduan Modul SPK Evaluasi Rapor — Metode SAW

**PENGEMBANGAN SISTEM PENDUKUNG KEPUTUSAN EVALUASI RAPOR SISWA BERBASIS WEB METODE SIMPLE ADDITIVE WEIGHTING (SAW)**

Menu: **SPK Evaluasi Rapor (SAW)** — tersedia untuk Admin, Kepala Sekolah, Guru, dan Siswa (siswa hanya melihat peringkat & evaluasi dirinya sendiri).

## Kriteria bawaan

| Kode | Kriteria | Jenis | Bobot | Sumber data SIAKAD |
|------|----------|-------|-------|--------------------|
| C1 | Rata-rata nilai akhir rapor | Benefit | 40% | Input Nilai / E-Rapor (periode terpilih) |
| C2 | Persentase kehadiran | Benefit | 20% | Presensi & Absensi |
| C3 | Ketuntasan mapel (≥ KKM) | Benefit | 15% | Nilai vs KKM tiap mata pelajaran |
| C4 | Poin prestasi | Benefit | 10% | Prestasi (Sekolah=1, Kecamatan=2, Kota=3, Provinsi=4, Nasional=5, Internasional=6) |
| C5 | Poin pelanggaran | Cost | 15% | Pelanggaran tata tertib |

## Langkah perhitungan

1. **Matriks keputusan X** — baris = siswa aktif yang sudah punya nilai pada semester terpilih, kolom = C1…C5.
2. **Normalisasi R**
   - Benefit: `r_ij = x_ij / max(x_j)`
   - Cost: `r_ij = min(x_j) / x_ij` (jika x_ij = 0 maka r_ij = 1)
3. **Nilai preferensi**: `V_i = Σ (w_j × r_ij)`, dengan `w_j = bobot_j / 100`.
4. **Ranking**: urut V_i terbesar → peringkat 1 (nilai sama = peringkat sama, mis. 1,2,2,4).
5. **Kategori** (ambang dapat diatur): V ≥ 0,90 Sangat Baik • ≥ 0,80 Baik • ≥ 0,70 Cukup • < 0,70 Perlu Pembinaan.

## Tab pada modul

| Tab | Isi | Siapa |
|-----|-----|-------|
| Hasil Perankingan | Tabel peringkat, ringkasan kategori, grafik 10 teratas, peringatan kualitas data | Semua |
| Kriteria & Bobot | Ubah jenis & bobot, ambang kategori, mode periode data; tombol *Normalkan ke 100%* | Admin/Kepsek (Guru hanya melihat) |
| **Perhitungan Lengkap** | Seluruh tahap dalam satu halaman: rumus, kriteria & bobot, matriks X (max/min), normalisasi R dengan rumus berangka tiap sel, pembobotan w × r, Vi, peringkat, kategori | Admin/Kepsek/Guru |
| Matriks Keputusan | Matriks X beserta nilai maksimum/minimum kolom | Admin/Kepsek/Guru |
| Normalisasi & Vi | Matriks R, nilai preferensi, peringkat | Admin/Kepsek/Guru |
| **Langkah Perhitungan** | Rincian satu siswa: x → rumus normalisasi dengan angka → r → w × r → Vi (untuk validasi manual / lampiran skripsi) | Admin/Kepsek/Guru |
| **Analisis Sensitivitas** | Peringkat di bawah skenario bobot sama rata dan tiap kriteria +10 poin; menunjukkan stabilitas peringkat 1 | Admin/Kepsek/Guru |
| Evaluasi Rapor Siswa | Rincian per kriteria, saran evaluasi otomatis, cetak per siswa | Semua (Siswa: dirinya sendiri) |
| **Arsip Hasil** | Salinan permanen hasil per tahun ajaran/semester/cakupan di MySQL | Lihat: Admin/Kepsek/Guru; simpan & hapus: Admin |

## Yang baru pada versi ini

- **Data per semester.** Presensi dan pelanggaran kini hanya dihitung pada rentang semester terpilih (Ganjil: 1 Jul–31 Des tahun awal; Genap: 1 Jan–30 Jun tahun akhir). Prestasi dihitung bila tahunnya termasuk tahun ajaran tersebut. Bisa dikembalikan ke "seluruh catatan" di tab Kriteria & Bobot.
- **Pengaturan tersimpan di MySQL** (`pengaturan_aplikasi`, kunci `saw_config`): bobot, jenis, ambang kategori, dan mode periode berlaku untuk semua pengguna. Admin menyimpan; bila Admin sudah menetapkan, perubahan Kepala Sekolah hanya simulasi sesi itu. Jika database belum aktif, pengaturan tetap tersimpan di browser seperti sebelumnya.
- **Ambang kategori dapat diatur** dan divalidasi (harus menurun: Sangat Baik > Baik > Cukup > 0).
- **Arsip hasil** ke tabel baru `hasil_saw` (dibuat otomatis saat server start; juga ada di file `.sql`).
- **Peringatan kualitas data**: siswa tanpa nilai rapor (tidak diikutkan) dan siswa tanpa presensi (dianggap 100% hadir).
- **Cetak laporan** kini memiliki blok tanda tangan Kepala Sekolah dan Wali Kelas; Ekspor Excel menambah sheet *Informasi* (periode, cakupan, ambang), rekomendasi, serta nilai max/min.
- **Skrip verifikasi** `npm run test:saw` — 27 pemeriksaan dengan contoh 3 siswa yang dihitung manual (Vi = 0,8856 / 0,6800 / 0,8278), normalisasi cost, peringkat kembar, ambang, periode, dan sensitivitas.

## Catatan data & batasan

- Cakupan ranking: per kelas (rombel) atau seluruh sekolah. Nilai max/min dihitung dari siswa dalam cakupan tersebut, jadi peringkat bersifat **relatif** terhadap cakupan yang dipilih.
- Siswa tanpa catatan presensi dianggap 100% hadir; siswa tanpa nilai rapor di periode itu tidak diikutkan.
- Pada kriteria cost, bila ada siswa dengan x = 0 (tanpa pelanggaran) maka nilai minimum kolom = 0 dan semua siswa yang punya pelanggaran mendapat r = 0 pada C5. Ini konsekuensi rumus SAW standar; pertimbangkan membahasnya di bab pembahasan skripsi.
- Penyimpanan ke database membutuhkan MySQL (XAMPP) aktif dan login Admin (lihat `PANDUAN_PHPMYADMIN.md`).

## Berkas modul SAW

- `src/utils/saw.ts` — mesin perhitungan (normalisasi, Vi, ranking, ambang, periode, sensitivitas, penjelasan langkah)
- `src/utils/sawApi.ts` — pemanggil API konfigurasi & arsip
- `src/components/saw/SawDecisionSupport.tsx` — antarmuka modul
- `src/server/saw.ts` — rute `/api/saw/config` dan `/api/saw/archive`
- `src/server/schema.ts`, `siakad_lubang_buaya04.sql` — tabel `hasil_saw`
- `scripts/verify-saw.ts` — verifikasi perhitungan
- `src/App.tsx`, `src/components/common/Sidebar.tsx` — rute & menu `spk_saw`
