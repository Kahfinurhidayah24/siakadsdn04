# Panduan Menghubungkan Database SIAKAD ke Visual Studio Code (VS Code)

Panduan praktis untuk menghubungkan, mengimpor, dan mengelola database SQL SIAKAD SDN Lubang Buaya 04 Pagi langsung dari dalam VS Code.

---

## 🛠️ CARA 1: Menggunakan Ekstensi VS Code (Paling Mudah & Rekomendasi)

Dengan cara ini, Anda bisa melihat tabel, mengedit baris data, dan menjalankan kueri SQL langsung di dalam VS Code seperti phpMyAdmin / Navicat.

### Langkah-langkah:
1. **Buka VS Code**, lalu klik menu **Extensions** di bilah sisi kiri (atau tekan `Ctrl + Shift + X`).
2. Cari dan install ekstensi:
   * **Database Client** (pembuat: *cweijan*) — **Sangat Direkomendasikan**, mendukung MySQL, PostgreSQL, SQLite, Redis.
   * Atau **SQLTools** (pembuat: *Matheus Teixeira*).
3. Pastikan server database Anda sudah berjalan di komputer (misalnya nyalakan **MySQL di XAMPP** atau **Laragon**).
4. Di bilah samping VS Code, klik ikon **Database** yang baru muncul.
5. Klik **Create Connection** / **Add Connection** (+):
   * **Type**: Pilih `MySQL`
   * **Host**: `localhost` atau `127.0.0.1`
   * **Port**: `3306`
   * **User**: `root`
   * **Password**: *(kosongkan jika pakai XAMPP default, atau isi password Anda)*
   * Klik **Connect** / **Save**.
6. **Impor Database SIAKAD**:
   * Buka file `siakad_lubang_buaya_04.sql` di VS Code.
   * Klik kanan di dalam editor file SQL, lalu pilih **Execute SQL** / **Run All Queries**.
   * Seluruh 9 tabel beserta data siswa, guru, kelas, dan nilai rapor akan langsung terbuat!

---

## 💻 CARA 2: Mengimpor via Terminal VS Code (CLI Cepat)

Jika Anda sudah mengaktifkan MySQL di komputer Anda (misal via XAMPP):

1. Di VS Code, buka terminal terpadu (`Ctrl + ~` atau menu **Terminal** ➔ **New Terminal**).
2. Buat database baru di MySQL:
   ```bash
   mysql -u root -e "CREATE DATABASE IF NOT EXISTS siakad_lubang_buaya_04;"
   ```
3. Impor file SQL langsung:
   ```bash
   mysql -u root siakad_lubang_buaya_04 < siakad_lubang_buaya_04.sql
   ```
4. Masuk ke prompt MySQL untuk memeriksa:
   ```bash
   mysql -u root -D siakad_lubang_buaya_04
   ```
   Lalu coba jalankan:
   ```sql
   SHOW TABLES;
   SELECT * FROM siswa;
   ```

---

## 🚀 CARA 3: Menghubungkan Kode Backend (Express / Node.js) ke MySQL

Jika Anda ingin membuat server backend yang menghubungkan website ke MySQL di VS Code:

1. Install driver MySQL di terminal:
   ```bash
   npm install mysql2 dotenv
   ```
2. Buat file koneksi `src/db.ts` atau `db.js`:
   ```javascript
   import mysql from 'mysql2/promise';

   export const pool = mysql.createPool({
     host: 'localhost',
     user: 'root',
     password: '', // password mysql Anda
     database: 'siakad_lubang_buaya_04',
     waitForConnections: true,
     connectionLimit: 10,
     queueLimit: 0
   });
   ```
3. Contoh mengambil data siswa di endpoint API Express:
   ```javascript
   app.get('/api/siswa', async (req, res) => {
     try {
       const [rows] = await pool.query('SELECT * FROM siswa');
       res.json(rows);
     } catch (err) {
       res.status(500).json({ error: err.message });
     }
   });
   ```
