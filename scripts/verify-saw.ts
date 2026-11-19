/**
 * Verifikasi mesin SAW dengan contoh yang dihitung manual (untuk lampiran skripsi).
 * Jalankan:  npm run test:saw
 */
import {
  DEFAULT_CRITERIA, computeSaw, normalizeValue, categorize, buildThresholds, thresholdsValid,
  academicPeriodRange, dateInPeriod, achievementInYear, computeSensitivity, explainStudent,
} from '../src/utils/saw';

let pass = 0, fail = 0;
const near = (a: number, b: number, eps = 1e-4) => Math.abs(a - b) < eps;
const check = (name: string, ok: boolean, detail = '') => {
  if (ok) { pass++; console.log(`  ✓ ${name}`); } else { fail++; console.log(`  ✗ ${name} ${detail}`); }
};

console.log('1. Bobot bawaan');
check('total bobot = 100', DEFAULT_CRITERIA.reduce((s, c) => s + c.weight, 0) === 100);

console.log('2. Contoh manual 3 siswa (C1..C4 benefit, C5 cost; bobot 40/20/15/10/15)');
// Matriks X
const alts = [
  { id: 'A', name: 'A', nisn: '1', classId: '4A', values: [80, 90, 100, 2, 0] },
  { id: 'B', name: 'B', nisn: '2', classId: '4A', values: [90, 80, 80, 0, 3] },
  { id: 'C', name: 'C', nisn: '3', classId: '4A', values: [85, 100, 100, 4, 1] },
];
const res = computeSaw(DEFAULT_CRITERIA, alts);
const by = (id: string) => res.rows.find(r => r.id === id)!;
// Hitung tangan: max = [90,100,100,4], min C5 = 0
// A: .8889*.4 + .9*.2 + 1*.15 + .5*.1 + 1*.15 = 0.8856
// B: 1*.4 + .8*.2 + .8*.15 + 0 + 0            = 0.6800
// C: .9444*.4 + 1*.2 + 1*.15 + 1*.1 + 0       = 0.8278
check('Vi(A) = 0,8856', near(by('A').preference, 0.88556), String(by('A').preference));
check('Vi(B) = 0,6800', near(by('B').preference, 0.68), String(by('B').preference));
check('Vi(C) = 0,8278', near(by('C').preference, 0.82778), String(by('C').preference));
check('ranking A=1, C=2, B=3', by('A').rank === 1 && by('C').rank === 2 && by('B').rank === 3);
check('kategori A=Baik, C=Baik, B=Perlu Pembinaan',
  by('A').category === 'Baik' && by('C').category === 'Baik' && by('B').category === 'Perlu Pembinaan');
check('hasil terurut menurut peringkat', res.rows.map(r => r.id).join('') === 'ACB');

console.log('3. Normalisasi cost');
check('cost: x=0 → 1', normalizeValue(0, 'cost', 10, 0) === 1);
check('cost: min/x (min=1, x=4) → 0,25', near(normalizeValue(4, 'cost', 10, 1), 0.25));
check('benefit: x/max (x=80, max=90)', near(normalizeValue(80, 'benefit', 90, 0), 80 / 90));
check('benefit: kolom semua 0 → 0 (tanpa NaN)', normalizeValue(0, 'benefit', 0, 0) === 0);

console.log('4. Peringkat sama untuk nilai sama (1,2,2,4)');
const tie = computeSaw(DEFAULT_CRITERIA.slice(0, 1), [
  { id: 'a', name: 'a', nisn: '', classId: '', values: [90] },
  { id: 'b', name: 'b', nisn: '', classId: '', values: [80] },
  { id: 'c', name: 'c', nisn: '', classId: '', values: [80] },
  { id: 'd', name: 'd', nisn: '', classId: '', values: [70] },
]);
check('peringkat 1,2,2,4', tie.rows.map(r => r.rank).join(',') === '1,2,2,4');

console.log('5. Bobot tidak berjumlah 100 dinormalkan otomatis');
const odd = computeSaw(DEFAULT_CRITERIA.map(c => ({ ...c, weight: c.weight * 2 })), alts);
check('hasil sama dengan bobot yang benar', near(odd.rows[0].preference, res.rows[0].preference));

console.log('6. Ambang kategori');
check('ambang bawaan valid', thresholdsValid(buildThresholds(0.9, 0.8, 0.7)));
check('ambang tidak menurun → tidak valid', !thresholdsValid(buildThresholds(0.7, 0.8, 0.9)));
check('0,95 → Sangat Baik (ambang kustom 0,92)', categorize(0.95, buildThresholds(0.92, 0.8, 0.7)) === 'Sangat Baik');
check('0,91 → Baik (ambang kustom 0,92)', categorize(0.91, buildThresholds(0.92, 0.8, 0.7)) === 'Baik');
check('tepat di batas 0,80 → Baik', categorize(0.8) === 'Baik');

console.log('7. Periode akademik');
const g = academicPeriodRange('2025/2026', 'Ganjil');
const e = academicPeriodRange('2025/2026', 'Genap');
check('Ganjil = 2025-07-01..2025-12-31', g.start === '2025-07-01' && g.end === '2025-12-31');
check('Genap = 2026-01-01..2026-06-30', e.start === '2026-01-01' && e.end === '2026-06-30');
check('2025-09-15 masuk Ganjil, tidak masuk Genap', dateInPeriod('2025-09-15', g) && !dateInPeriod('2025-09-15', e));
check('prestasi tahun 2025 masuk TA 2025/2026', achievementInYear('2025', g));
check('prestasi tahun 2023 tidak masuk', !achievementInYear('2023', g));

console.log('8. Sensitivitas & penjelasan langkah');
const sens = computeSensitivity(DEFAULT_CRITERIA, alts);
check('skenario pertama = bobot saat ini (tidak ada perubahan peringkat)', sens.changedCount[0] === 0);
check('jumlah skenario = 2 + jumlah kriteria', sens.scenarios.length === 2 + DEFAULT_CRITERIA.length);
check('setiap skenario berbobot total 100', sens.scenarios.every(s => near(s.weights.reduce((a, b) => a + b, 0), 100, 1e-6)));
const steps = explainStudent(by('A'), res);
check('jumlah kontribusi langkah = Vi', near(steps.reduce((s, t) => s + t.contribution, 0), by('A').preference));

console.log(`\nHasil: ${pass} lulus, ${fail} gagal`);
process.exit(fail ? 1 : 0);
