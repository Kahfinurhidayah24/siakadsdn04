// Dimuat paling awal agar DB_HOST, DB_USER, dst. dari file .env / .env.local terbaca
// sebelum koneksi database dibuat.
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();
