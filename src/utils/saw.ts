/**
 * Mesin Simple Additive Weighting (SAW) untuk evaluasi rapor siswa.
 *
 * Langkah metode SAW:
 *  1. Tentukan kriteria (Cj), jenis (benefit/cost) dan bobot (Wj, total = 1).
 *  2. Susun matriks keputusan X (alternatif = siswa, kolom = kriteria).
 *  3. Normalisasi matriks X menjadi R:
 *       benefit : r_ij = x_ij / max(x_j)
 *       cost    : r_ij = min(x_j) / x_ij
 *  4. Hitung nilai preferensi:  V_i = Σ ( w_j × r_ij )
 *  5. Urutkan V_i dari terbesar → peringkat (ranking).
 */

export type SawCriterionType = 'benefit' | 'cost';

export interface SawCriterion {
  code: string;            // C1..C5
  name: string;
  type: SawCriterionType;
  weight: number;          // dalam persen (0–100)
  unit: string;
  source: string;          // asal data di SIAKAD
}

export interface SawAlternativeInput {
  id: string;
  name: string;
  nisn: string;
  classId: string;
  /** Nilai mentah per kriteria, urutan sama dengan daftar kriteria */
  values: number[];
}

export interface SawResultRow extends SawAlternativeInput {
  normalized: number[];    // r_ij
  weighted: number[];      // w_j × r_ij
  preference: number;      // V_i
  rank: number;
  category: SawCategory;
}

export type SawCategory = 'Sangat Baik' | 'Baik' | 'Cukup' | 'Perlu Pembinaan';

export const DEFAULT_CRITERIA: SawCriterion[] = [
  { code: 'C1', name: 'Rata-rata Nilai Akhir Rapor', type: 'benefit', weight: 40, unit: 'poin', source: 'Nilai rapor semua mata pelajaran pada semester terpilih' },
  { code: 'C2', name: 'Persentase Kehadiran', type: 'benefit', weight: 20, unit: '%', source: 'Presensi harian (Hadir ÷ total pertemuan)' },
  { code: 'C3', name: 'Ketuntasan Mata Pelajaran (≥ KKM)', type: 'benefit', weight: 15, unit: '%', source: 'Jumlah mapel dengan nilai ≥ KKM ÷ jumlah mapel' },
  { code: 'C4', name: 'Poin Prestasi', type: 'benefit', weight: 10, unit: 'poin', source: 'Prestasi siswa, berbobot sesuai tingkat (Sekolah=1 … Internasional=6)' },
  { code: 'C5', name: 'Poin Pelanggaran', type: 'cost', weight: 15, unit: 'poin', source: 'Akumulasi poin pelanggaran tata tertib' },
];

export const CATEGORY_THRESHOLDS: { min: number; label: SawCategory }[] = [
  { min: 0.9, label: 'Sangat Baik' },
  { min: 0.8, label: 'Baik' },
  { min: 0.7, label: 'Cukup' },
  { min: 0, label: 'Perlu Pembinaan' },
];

export const ACHIEVEMENT_LEVEL_POINTS: Record<string, number> = {
  Sekolah: 1,
  Kecamatan: 2,
  Kota: 3,
  Provinsi: 4,
  Nasional: 5,
  Internasional: 6,
};

export const totalWeight = (criteria: SawCriterion[]): number =>
  Math.round(criteria.reduce((sum, c) => sum + (Number(c.weight) || 0), 0) * 100) / 100;

export type SawThresholds = { min: number; label: SawCategory }[];

/** Susun ambang kategori dari tiga batas (Sangat Baik, Baik, Cukup). */
export const buildThresholds = (sangatBaik: number, baik: number, cukup: number): SawThresholds => [
  { min: sangatBaik, label: 'Sangat Baik' },
  { min: baik, label: 'Baik' },
  { min: cukup, label: 'Cukup' },
  { min: 0, label: 'Perlu Pembinaan' },
];

/** Batas harus menurun ketat dan berada di antara 0 dan 1. */
export const thresholdsValid = (t: SawThresholds): boolean =>
  t.length === 4 && t[0].min <= 1 && t[0].min > t[1].min && t[1].min > t[2].min && t[2].min > 0;

export const categorize = (preference: number, thresholds: SawThresholds = CATEGORY_THRESHOLDS): SawCategory => {
  for (const t of thresholds) {
    if (preference >= t.min - 1e-12) return t.label;
  }
  return 'Perlu Pembinaan';
};

/** Normalisasi satu nilai terhadap kolomnya. */
export const normalizeValue = (
  x: number,
  type: SawCriterionType,
  columnMax: number,
  columnMin: number
): number => {
  if (type === 'benefit') {
    return columnMax > 0 ? x / columnMax : 0;
  }
  // cost: nilai terkecil = terbaik. Jika x = 0 (tanpa pelanggaran) → skor sempurna.
  if (x <= 0) return 1;
  return columnMin / x;
};

/** Ranking kompetisi (1,2,2,4) — nilai V sama mendapat peringkat sama. */
const assignRanks = (rows: { preference: number }[]): number[] => {
  const sorted = [...rows].map(r => r.preference).sort((a, b) => b - a);
  return rows.map(r => sorted.findIndex(v => Math.abs(v - r.preference) < 1e-12) + 1);
};

export interface SawComputation {
  criteria: SawCriterion[];
  normalizedWeights: number[]; // w_j (jumlah = 1)
  columnMax: number[];
  columnMin: number[];
  rows: SawResultRow[];        // sudah terurut berdasarkan ranking
}

export const computeSaw = (
  criteria: SawCriterion[],
  alternatives: SawAlternativeInput[],
  thresholds: SawThresholds = CATEGORY_THRESHOLDS
): SawComputation => {
  const sumW = criteria.reduce((s, c) => s + (Number(c.weight) || 0), 0);
  const normalizedWeights = criteria.map(c => (sumW > 0 ? (Number(c.weight) || 0) / sumW : 0));

  const columnMax = criteria.map((_, j) =>
    alternatives.length ? Math.max(...alternatives.map(a => a.values[j] ?? 0)) : 0
  );
  const columnMin = criteria.map((_, j) =>
    alternatives.length ? Math.min(...alternatives.map(a => a.values[j] ?? 0)) : 0
  );

  const partial = alternatives.map(alt => {
    const normalized = criteria.map((c, j) =>
      normalizeValue(alt.values[j] ?? 0, c.type, columnMax[j], columnMin[j])
    );
    const weighted = normalized.map((r, j) => r * normalizedWeights[j]);
    const preference = weighted.reduce((s, v) => s + v, 0);
    return { ...alt, normalized, weighted, preference };
  });

  const ranks = assignRanks(partial);
  const rows: SawResultRow[] = partial
    .map((p, i) => ({ ...p, rank: ranks[i], category: categorize(p.preference, thresholds) }))
    .sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name));

  return { criteria, normalizedWeights, columnMax, columnMin, rows };
};

/** Saran evaluasi otomatis berdasarkan kriteria dengan skor ternormalisasi terendah. */
export const buildRecommendation = (row: SawResultRow, criteria: SawCriterion[]): string => {
  const advice: Record<string, string> = {
    C1: 'Perkuat penguasaan materi melalui pendampingan belajar dan remedial pada mata pelajaran yang nilainya rendah.',
    C2: 'Tingkatkan kehadiran; wali kelas perlu berkomunikasi dengan orang tua terkait sakit/izin/alpa.',
    C3: 'Beri pengayaan/remedial agar seluruh mata pelajaran mencapai KKM.',
    C4: 'Dorong keikutsertaan siswa dalam lomba dan kegiatan ekstrakurikuler.',
    C5: 'Lakukan pembinaan karakter dan kedisiplinan oleh guru BK/wali kelas.',
  };
  const ranked = row.normalized
    .map((r, j) => ({ r, j }))
    .filter(x => criteria[x.j])
    .sort((a, b) => a.r - b.r);

  const weak = ranked.filter(x => x.r < 0.85).slice(0, 2);
  if (weak.length === 0) {
    return 'Capaian seimbang pada seluruh kriteria. Pertahankan prestasi dan berikan program pengayaan.';
  }
  return weak
    .map(x => `${criteria[x.j].name}: ${advice[criteria[x.j].code] ?? 'Perlu perhatian khusus.'}`)
    .join(' ');
};


// ---------------------------------------------------------------------------
// Periode akademik — agar presensi, pelanggaran & prestasi hanya dihitung
// pada semester yang sedang dievaluasi.
// ---------------------------------------------------------------------------

export interface PeriodRange { start: string; end: string; startYear: number; endYear: number }

/** "2025/2026" + Ganjil → 2025-07-01..2025-12-31 ; Genap → 2026-01-01..2026-06-30 */
export const academicPeriodRange = (academicYear: string, semester: 'Ganjil' | 'Genap'): PeriodRange => {
  const [a, b] = academicYear.split('/').map(n => parseInt(n, 10));
  const startYear = Number.isFinite(a) ? a : new Date().getFullYear();
  const endYear = Number.isFinite(b) ? b : startYear + 1;
  return semester === 'Ganjil'
    ? { start: `${startYear}-07-01`, end: `${startYear}-12-31`, startYear, endYear }
    : { start: `${endYear}-01-01`, end: `${endYear}-06-30`, startYear, endYear };
};

export const dateInPeriod = (date: string, range: PeriodRange): boolean =>
  typeof date === 'string' && date.slice(0, 10) >= range.start && date.slice(0, 10) <= range.end;

/** Prestasi hanya punya "tahun": dianggap masuk bila tahunnya ada dalam tahun ajaran. */
export const achievementInYear = (year: string, range: PeriodRange): boolean => {
  const y = parseInt(year, 10);
  return Number.isFinite(y) && (y === range.startYear || y === range.endYear);
};

// ---------------------------------------------------------------------------
// Penjelasan langkah perhitungan per siswa (untuk validasi manual / lampiran skripsi)
// ---------------------------------------------------------------------------

export interface SawStep {
  code: string;
  name: string;
  type: SawCriterionType;
  x: number;
  reference: number;       // max (benefit) atau min (cost) kolom
  formula: string;         // rumus dengan angka disubstitusi
  r: number;
  weight: number;          // w_j (0–1)
  contribution: number;    // w_j × r_ij
}

const f = (v: number, d = 2) => v.toFixed(d).replace('.', ',');

export const explainStudent = (row: SawResultRow, comp: SawComputation): SawStep[] =>
  comp.criteria.map((c, j) => {
    const x = row.values[j] ?? 0;
    const ref = c.type === 'benefit' ? comp.columnMax[j] : comp.columnMin[j];
    const formula = c.type === 'benefit'
      ? `r = ${f(x)} ÷ ${f(ref)}`
      : x <= 0
        ? `r = 1 (x = 0, tanpa pelanggaran)`
        : `r = ${f(ref)} ÷ ${f(x)}`;
    return {
      code: c.code, name: c.name, type: c.type, x, reference: ref, formula,
      r: row.normalized[j], weight: comp.normalizedWeights[j], contribution: row.weighted[j],
    };
  });

// ---------------------------------------------------------------------------
// Analisis sensitivitas bobot (what-if)
// ---------------------------------------------------------------------------

export interface SensitivityScenario { id: string; label: string; weights: number[] }

export interface SensitivityResult {
  scenarios: SensitivityScenario[];
  /** rank[scenarioIdx] per siswa (urutan sama dengan baseRows) */
  rows: { id: string; name: string; baseRank: number; ranks: number[] }[];
  changedCount: number[];   // jumlah siswa yang peringkatnya berubah per skenario
  topStable: number;        // berapa skenario yang menjaga peringkat 1 tetap sama
}

/** Naikkan bobot satu kriteria sebesar `delta` poin, sisanya diturunkan proporsional. */
const shiftWeight = (weights: number[], idx: number, delta: number): number[] => {
  const total = weights.reduce((a, b) => a + b, 0);
  const target = Math.min(total, weights[idx] + delta);
  const others = total - weights[idx];
  const rest = total - target;
  return weights.map((w, i) => (i === idx ? target : others > 0 ? (w / others) * rest : 0));
};

export const buildScenarios = (criteria: SawCriterion[]): SensitivityScenario[] => {
  const base = criteria.map(c => Number(c.weight) || 0);
  const equal = criteria.map(() => 100 / criteria.length);
  const list: SensitivityScenario[] = [
    { id: 'base', label: 'Bobot saat ini', weights: base },
    { id: 'equal', label: 'Bobot sama rata', weights: equal },
  ];
  criteria.forEach((c, i) => {
    list.push({ id: `up-${c.code}`, label: `${c.code} +10 poin`, weights: shiftWeight(base, i, 10) });
  });
  return list;
};

export const computeSensitivity = (
  criteria: SawCriterion[],
  alternatives: SawAlternativeInput[]
): SensitivityResult => {
  const scenarios = buildScenarios(criteria);
  const comps = scenarios.map(sc =>
    computeSaw(criteria.map((c, i) => ({ ...c, weight: sc.weights[i] })), alternatives)
  );
  const base = comps[0];
  const rows = base.rows.map(r => ({
    id: r.id,
    name: r.name,
    baseRank: r.rank,
    ranks: comps.map(cp => cp.rows.find(x => x.id === r.id)?.rank ?? 0),
  }));
  const changedCount = comps.map((_, k) => rows.filter(r => r.ranks[k] !== r.baseRank).length);
  const topId = base.rows[0]?.id;
  const topStable = comps.filter(cp => cp.rows[0]?.id === topId && cp.rows[0]?.rank === 1).length;
  return { scenarios, rows, changedCount, topStable };
};

/** Ringkasan teks hasil untuk arsip/ekspor. */
export const summarizeCategories = (rows: SawResultRow[]): Record<SawCategory, number> => {
  const out: Record<SawCategory, number> = { 'Sangat Baik': 0, 'Baik': 0, 'Cukup': 0, 'Perlu Pembinaan': 0 };
  rows.forEach(r => { out[r.category] += 1; });
  return out;
};
