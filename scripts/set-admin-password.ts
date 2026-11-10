// Mengganti kata sandi admin dari terminal:  npm run admin:password
import '../src/server/env';
import readline from 'readline';
import { db } from '../src/server/db';
import { initDatabase } from '../src/server/schema';
import { checkPasswordPolicy, saveAdminPassword } from '../src/server/auth';

/** Membaca input tanpa menampilkan karakter yang diketik. */
function askHidden(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    (rl as any)._writeToOutput = (s: string) => {
      if (s.includes(prompt)) process.stdout.write(s);
    };
    rl.question(prompt, (answer) => { rl.close(); process.stdout.write('\n'); resolve(answer); });
  });
}

async function main() {
  const pw = process.env.ADMIN_NEW_PASSWORD || await askHidden('Kata sandi admin baru: ');
  const problem = checkPasswordPolicy(pw);
  if (problem) { console.error('❌ ' + problem); process.exit(1); }
  if (!process.env.ADMIN_NEW_PASSWORD) {
    const again = await askHidden('Ulangi kata sandi      : ');
    if (again !== pw) { console.error('❌ Kedua isian tidak sama.'); process.exit(1); }
  }
  await initDatabase();
  await saveAdminPassword(pw);
  console.log('✅ Kata sandi admin berhasil diganti. Sesi admin yang sedang aktif akan berakhir saat server di-restart.');
  await db.end();
}

main().catch((e) => { console.error('❌ Gagal:', e?.message || e); process.exit(1); });
