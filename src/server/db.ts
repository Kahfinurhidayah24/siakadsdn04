import mysql from 'mysql2/promise';

// Konfigurasi koneksi MySQL / MariaDB (XAMPP → phpMyAdmin memakai server yang sama)
export const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'siakad_lubang_buaya_04',
};

// Satu pool untuk seluruh aplikasi.
// dateStrings: kolom DATE/TIME/TIMESTAMP dikembalikan sebagai teks
// ('2025-03-10', '07:00:00') sehingga tidak bergeser zona waktu.
export const db = mysql.createPool({
  ...DB_CONFIG,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
  charset: 'utf8mb4',
});

// Helper uji koneksi database
export async function testConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const connection = await db.getConnection();
    connection.release();
    return { success: true, message: `Terhubung ke MySQL (${DB_CONFIG.database} @ ${DB_CONFIG.host}:${DB_CONFIG.port})` };
  } catch (error: any) {
    return { success: false, message: error.message || 'Gagal terhubung ke database MySQL' };
  }
}

export default db;
