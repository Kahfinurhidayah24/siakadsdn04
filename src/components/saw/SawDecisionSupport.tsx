import React, { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { useSchool } from '../../context/SchoolContext';
import { ALL_36_CLASSES } from '../../data/initialData';
import {
  DEFAULT_CRITERIA, ACHIEVEMENT_LEVEL_POINTS, CATEGORY_THRESHOLDS,
  SawCriterion, SawAlternativeInput, SawCategory, SawThresholds,
  computeSaw, totalWeight, buildRecommendation, buildThresholds, thresholdsValid,
  academicPeriodRange, dateInPeriod, achievementInYear, explainStudent, computeSensitivity,
  summarizeCategories,
} from '../../utils/saw';
import {
  SawStoredConfig, SawArchiveSummary, SawArchiveDetail,
  fetchSawConfig, saveSawConfig, listSawArchive, getSawArchive, saveSawArchive, deleteSawArchive,
} from '../../utils/sawApi';
import {
  Calculator, Trophy, SlidersHorizontal, Table2, Download, Printer, RotateCcw, Info,
  AlertCircle, CheckCircle2, ClipboardList, ListOrdered, Activity, Archive, Save, Trash2, Eye, Scale,
} from 'lucide-react';

const STORAGE_KEY = 'siakad_lb04_saw_config_v2';
const LEGACY_KEY = 'siakad_lb04_saw_criteria';

const DEFAULT_TH = { sb: 0.9, b: 0.8, c: 0.7 };

interface UiConfig {
  criteria: SawCriterion[];
  th: { sb: number; b: number; c: number };
  periodOnly: boolean;
}

/** Gabungkan bobot/jenis tersimpan ke metadata bawaan (nama, satuan, sumber data tetap dari kode). */
const mergeCriteria = (stored: { code: string; type: string; weight: number }[] | undefined): SawCriterion[] =>
  DEFAULT_CRITERIA.map(d => {
    const s = stored?.find(x => x.code === d.code);
    return {
      ...d,
      weight: s && Number(s.weight) >= 0 ? Number(s.weight) : d.weight,
      type: s?.type === 'cost' || s?.type === 'benefit' ? s.type : d.type,
    };
  });

const fromStored = (c: Partial<SawStoredConfig> | null | undefined): UiConfig | null => {
  if (!c || !Array.isArray(c.criteria)) return null;
  const t = c.thresholds;
  const th = t ? { sb: Number(t.sangatBaik), b: Number(t.baik), c: Number(t.cukup) } : DEFAULT_TH;
  return {
    criteria: mergeCriteria(c.criteria),
    th: thresholdsValid(buildThresholds(th.sb, th.b, th.c)) ? th : DEFAULT_TH,
    periodOnly: typeof c.periodOnly === 'boolean' ? c.periodOnly : true,
  };
};

const loadLocalConfig = (): UiConfig => {
  const fallback: UiConfig = { criteria: DEFAULT_CRITERIA, th: DEFAULT_TH, periodOnly: true };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return fromStored(JSON.parse(raw)) ?? fallback;
    // migrasi format lama (hanya daftar kriteria)
    const old = localStorage.getItem(LEGACY_KEY);
    if (old) {
      const arr = JSON.parse(old);
      if (Array.isArray(arr)) return { ...fallback, criteria: DEFAULT_CRITERIA.map((d, i) => ({
        ...d,
        weight: Number(arr[i]?.weight) >= 0 ? Number(arr[i].weight) : d.weight,
        type: arr[i]?.type === 'cost' || arr[i]?.type === 'benefit' ? arr[i].type : d.type,
      })) };
    }
  } catch { /* abaikan */ }
  return fallback;
};

const categoryStyle: Record<SawCategory, string> = {
  'Sangat Baik': 'bg-emerald-50 text-emerald-700 border-emerald-300',
  'Baik': 'bg-sky-50 text-sky-700 border-sky-300',
  'Cukup': 'bg-amber-50 text-amber-700 border-amber-300',
  'Perlu Pembinaan': 'bg-red-50 text-red-700 border-red-300',
};
const categoryBar: Record<SawCategory, string> = {
  'Sangat Baik': 'bg-emerald-500', 'Baik': 'bg-sky-500', 'Cukup': 'bg-amber-400', 'Perlu Pembinaan': 'bg-red-400',
};

type TabId = 'hasil' | 'kriteria' | 'perhitungan' | 'matriks' | 'normalisasi' | 'langkah' | 'sensitivitas' | 'evaluasi' | 'arsip';

const fmt = (v: number, d = 2) => (Number.isFinite(v) ? v.toFixed(d).replace('.', ',') : '-');

/** Skala bobot agar total tepat 100 (selisih pembulatan dibebankan ke kriteria berbobot terbesar). */
const normalizeTo100 = (criteria: SawCriterion[]): SawCriterion[] => {
  const sum = criteria.reduce((s, c) => s + (Number(c.weight) || 0), 0);
  if (sum <= 0) return DEFAULT_CRITERIA;
  const scaled = criteria.map(c => Math.round(((Number(c.weight) || 0) / sum) * 100));
  const diff = 100 - scaled.reduce((a, b) => a + b, 0);
  const maxIdx = scaled.indexOf(Math.max(...scaled));
  scaled[maxIdx] += diff;
  return criteria.map((c, i) => ({ ...c, weight: scaled[i] }));
};

export const SawDecisionSupport: React.FC = () => {
  const {
    students, subjects, grades, attendance, achievements, violations,
    academicYear, semester, currentUser, schoolProfile, addActivityLog,
  } = useSchool();

  const isSiswa = currentUser.role === 'siswa';
  const isAdmin = currentUser.role === 'admin';
  const canEditCriteria = isAdmin || currentUser.role === 'kepsek';

  const ownStudent = isSiswa
    ? students.find(s => s.id === currentUser.referenceId || s.nisn === currentUser.username)
    : undefined;

  const [cfg, setCfg] = useState<UiConfig>(loadLocalConfig);
  const { criteria, th, periodOnly } = cfg;
  const [dbConfigActive, setDbConfigActive] = useState(false);

  const [scope, setScope] = useState<string>(
    isSiswa ? (ownStudent?.classId ?? '4A')
      : currentUser.role === 'guru' && currentUser.assignedClass ? currentUser.assignedClass
      : '4A'
  );
  const [tab, setTab] = useState<TabId>('hasil');
  const [selectedId, setSelectedId] = useState<string>('');
  const [savedMsg, setSavedMsg] = useState('');
  const [saving, setSaving] = useState(false);

  // Arsip
  const [archive, setArchive] = useState<SawArchiveSummary[] | null>(null);
  const [archiveError, setArchiveError] = useState('');
  const [archiveDetail, setArchiveDetail] = useState<SawArchiveDetail | null>(null);
  const [archiveMsg, setArchiveMsg] = useState('');

  // Bobot resmi dari database (berlaku untuk semua pengguna) menggantikan data di browser.
  useEffect(() => {
    let alive = true;
    fetchSawConfig().then(c => {
      const ui = fromStored(c);
      if (alive && ui) { setCfg(ui); setDbConfigActive(true); }
    });
    return () => { alive = false; };
  }, []);

  const thresholds: SawThresholds = useMemo(() => buildThresholds(th.sb, th.b, th.c), [th]);
  const thOk = thresholdsValid(thresholds);
  const activeThresholds = thOk ? thresholds : CATEGORY_THRESHOLDS;

  const weightSum = totalWeight(criteria);
  const weightValid = Math.abs(weightSum - 100) < 0.01;

  const range = useMemo(() => academicPeriodRange(academicYear, semester), [academicYear, semester]);

  // ---- 1. Bangun matriks keputusan X dari data SIAKAD ----
  const { alternatives, excluded, noAttendance } = useMemo(() => {
    const pool = students.filter(s => s.status === 'Aktif' && (scope === 'ALL' || s.classId === scope));
    const alts: SawAlternativeInput[] = [];
    const skipped: string[] = [];
    const noAtt: string[] = [];

    pool.forEach(s => {
      const g = grades.filter(x =>
        (x.studentId === s.id || x.studentNisn === s.nisn) &&
        x.academicYear === academicYear && x.semester === semester
      );
      if (g.length === 0) { skipped.push(s.name); return; }

      const avg = g.reduce((t, x) => t + x.finalScore, 0) / g.length;
      const tuntas = g.filter(x => {
        const kkm = subjects.find(sub => sub.id === x.subjectId)?.kkm ?? 75;
        return x.finalScore >= kkm;
      }).length;
      const tuntasPct = (tuntas / g.length) * 100;

      const att = attendance.filter(a => a.studentId === s.id && (!periodOnly || dateInPeriod(a.date, range)));
      if (att.length === 0) noAtt.push(s.name);
      const attPct = att.length ? (att.filter(a => a.status === 'Hadir').length / att.length) * 100 : 100;

      const achPts = achievements
        .filter(a => a.studentId === s.id && (!periodOnly || achievementInYear(a.year, range)))
        .reduce((t, a) => t + (ACHIEVEMENT_LEVEL_POINTS[a.level] ?? 1), 0);

      const vioPts = violations
        .filter(v => v.studentId === s.id && (!periodOnly || dateInPeriod(v.date, range)))
        .reduce((t, v) => t + (Number(v.points) || 0), 0);

      const byCode: Record<string, number> = { C1: avg, C2: attPct, C3: tuntasPct, C4: achPts, C5: vioPts };
      alts.push({
        id: s.id, name: s.name, nisn: s.nisn, classId: s.classId,
        values: criteria.map(c => byCode[c.code] ?? 0),
      });
    });
    return { alternatives: alts, excluded: skipped, noAttendance: noAtt };
  }, [students, grades, subjects, attendance, achievements, violations, academicYear, semester, scope, criteria, periodOnly, range]);

  // ---- 2-5. Normalisasi, nilai preferensi, ranking ----
  const result = useMemo(() => computeSaw(criteria, alternatives, activeThresholds), [criteria, alternatives, activeThresholds]);
  const categoryCounts = useMemo(() => summarizeCategories(result.rows), [result.rows]);

  const sensitivity = useMemo(
    () => (tab === 'sensitivitas' ? computeSensitivity(criteria, alternatives) : null),
    [tab, criteria, alternatives]
  );

  const focusId = selectedId || (isSiswa ? ownStudent?.id ?? '' : result.rows[0]?.id ?? '');
  const focusRow = result.rows.find(r => r.id === focusId);
  const steps = useMemo(() => (focusRow && tab === 'langkah' ? explainStudent(focusRow, result) : []), [focusRow, result, tab]);

  const avgPref = result.rows.length
    ? result.rows.reduce((t, r) => t + r.preference, 0) / result.rows.length
    : 0;

  const updateCriterion = (idx: number, patch: Partial<SawCriterion>) => {
    setCfg(prev => ({ ...prev, criteria: prev.criteria.map((c, i) => (i === idx ? { ...c, ...patch } : c)) }));
    setSavedMsg('');
  };
  const updateTh = (patch: Partial<UiConfig['th']>) => { setCfg(prev => ({ ...prev, th: { ...prev.th, ...patch } })); setSavedMsg(''); };

  const toStored = (): SawStoredConfig => ({
    criteria: criteria.map(c => ({ code: c.code, type: c.type, weight: c.weight })),
    thresholds: { sangatBaik: th.sb, baik: th.b, cukup: th.c },
    periodOnly,
  });

  // Admin menyimpan ke database; Kepala Sekolah hanya bila belum ada bobot resmi dari Admin.
  const canSaveConfig = isAdmin || (canEditCriteria && !dbConfigActive);

  const saveConfig = async () => {
    if (!weightValid || !thOk || !canSaveConfig) return;
    setSaving(true);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(toStored())); } catch { /* abaikan */ }
    addActivityLog('Ubah Bobot SAW',
      `Bobot SAW: ${criteria.map(c => `${c.code}=${c.weight}%`).join(', ')}; ambang ${th.sb}/${th.b}/${th.c}; ${periodOnly ? 'per semester' : 'seluruh catatan'}`);
    if (isAdmin) {
      const r = await saveSawConfig(toStored());
      if (r.ok) { setDbConfigActive(true); setSavedMsg('Tersimpan ke database — berlaku untuk semua pengguna.'); }
      else setSavedMsg(`Tersimpan di browser ini, tetapi gagal ke database: ${r.message}`);
    } else {
      setSavedMsg('Tersimpan di browser ini. Hanya Admin yang dapat menyimpan ke database agar berlaku untuk semua pengguna.');
    }
    setSaving(false);
  };

  const resetCriteria = () => {
    setCfg({ criteria: DEFAULT_CRITERIA, th: DEFAULT_TH, periodOnly: true });
    try { localStorage.removeItem(STORAGE_KEY); localStorage.removeItem(LEGACY_KEY); } catch { /* abaikan */ }
    setSavedMsg(isAdmin ? 'Dikembalikan ke nilai awal. Klik "Simpan Pengaturan" untuk menerapkannya ke database.' : 'Dikembalikan ke nilai awal.');
  };

  // ---------- Ekspor Excel ----------
  const exportExcel = () => {
    const head = ['No', 'NISN', 'Nama', 'Kelas'];
    const crit = criteria.map(c => `${c.code} ${c.name}`);
    const kelas = scope === 'ALL' ? 'Semua_Kelas' : `Kelas_${scope}`;

    const info = [
      ['SPK Evaluasi Rapor Siswa — Metode SAW'],
      ['Sekolah', schoolProfile.name],
      ['Cakupan', scope === 'ALL' ? 'Seluruh Sekolah' : `Kelas ${scope}`],
      ['Tahun Ajaran', academicYear],
      ['Semester', semester],
      ['Data presensi/pelanggaran/prestasi', periodOnly ? `Hanya periode ${range.start} s.d. ${range.end}` : 'Seluruh catatan'],
      ['Jumlah siswa dinilai', result.rows.length],
      ['Rata-rata Vi', Number(avgPref.toFixed(4))],
      [],
      ['Ambang kategori', 'Batas bawah Vi'],
      ...activeThresholds.map(t => [t.label, t.min]),
    ];
    const matriks = [
      [...head, ...crit],
      ...result.rows.map((r, i) => [i + 1, r.nisn, r.name, r.classId, ...r.values.map(v => Number(v.toFixed(2)))]),
      ['', '', 'Maksimum', '', ...result.columnMax.map(v => Number(v.toFixed(2)))],
      ['', '', 'Minimum', '', ...result.columnMin.map(v => Number(v.toFixed(2)))],
    ];
    const norm = [
      [...head, ...criteria.map(c => `${c.code} (${c.type})`), 'Vi', 'Peringkat'],
      ...result.rows.map((r, i) => [i + 1, r.nisn, r.name, r.classId, ...r.normalized.map(v => Number(v.toFixed(4))), Number(r.preference.toFixed(4)), r.rank]),
    ];
    const terbobot = [
      [...head, ...criteria.map(c => `${c.code} (w=${result.normalizedWeights[criteria.indexOf(c)].toFixed(2)})`), 'Vi', 'Peringkat', 'Kategori'],
      ...result.rows.map((r, i) => [i + 1, r.nisn, r.name, r.classId, ...r.weighted.map(v => Number(v.toFixed(4))), Number(r.preference.toFixed(4)), r.rank, r.category]),
    ];
    const hasil = [
      ['Peringkat', 'NISN', 'Nama', 'Kelas', 'Nilai Preferensi (Vi)', 'Kategori', 'Rekomendasi'],
      ...result.rows.map(r => [r.rank, r.nisn, r.name, r.classId, Number(r.preference.toFixed(4)), r.category, buildRecommendation(r, criteria)]),
    ];
    const kriteria = [
      ['Kode', 'Kriteria', 'Jenis', 'Bobot (%)', 'Bobot ternormalisasi (w)', 'Sumber Data'],
      ...criteria.map((c, j) => [c.code, c.name, c.type === 'benefit' ? 'Benefit' : 'Cost', c.weight, Number(result.normalizedWeights[j].toFixed(4)), c.source]),
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(info), 'Informasi');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(hasil), 'Hasil Ranking');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(matriks), 'Matriks Keputusan');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(norm), 'Normalisasi');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(terbobot), 'Pembobotan (w x r)');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(kriteria), 'Kriteria & Bobot');
    XLSX.writeFile(wb, `SPK_SAW_Rapor_${kelas}_${academicYear.replace('/', '-')}_${semester}.xlsx`);
    addActivityLog('Ekspor SAW', `Ekspor hasil SPK SAW ${kelas} ${academicYear} ${semester}`);
  };

  // ---------- Arsip ----------
  const loadArchive = async () => {
    setArchiveError('');
    const list = await listSawArchive();
    if (list === null) { setArchive([]); setArchiveError('Tidak dapat membaca arsip dari database. Pastikan MySQL (XAMPP) aktif.'); }
    else setArchive(list);
  };
  useEffect(() => { if (tab === 'arsip' && archive === null) void loadArchive(); }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  const archiveNow = async () => {
    if (!isAdmin || !result.rows.length) return;
    setArchiveMsg('');
    const r = await saveSawArchive({
      tahunAjaran: academicYear, semester, cakupan: scope, dibuatOleh: currentUser.name,
      kriteria: criteria.map((c, j) => ({ code: c.code, name: c.name, type: c.type, weight: c.weight, w: result.normalizedWeights[j] })),
      hasil: result.rows.map(x => ({
        rank: x.rank, studentId: x.id, nisn: x.nisn, name: x.name, classId: x.classId,
        values: x.values.map(v => Number(v.toFixed(4))), preference: Number(x.preference.toFixed(6)), category: x.category,
      })),
    });
    if (r.ok) {
      addActivityLog('Arsip SAW', `Arsip hasil SAW ${scope === 'ALL' ? 'Seluruh Sekolah' : `Kelas ${scope}`} ${academicYear} ${semester}`);
      setArchiveMsg('Hasil perankingan berhasil diarsipkan.');
      await loadArchive();
    } else setArchiveMsg(`Gagal mengarsipkan: ${r.message}`);
  };

  const openArchive = async (id: string) => {
    setArchiveMsg('');
    const d = await getSawArchive(id);
    if (d) setArchiveDetail(d); else setArchiveMsg('Gagal membuka arsip.');
  };

  const removeArchive = async (a: SawArchiveSummary) => {
    if (!isAdmin) return;
    if (!window.confirm(`Hapus arsip ${a.cakupan === 'ALL' ? 'Seluruh Sekolah' : `Kelas ${a.cakupan}`} ${a.tahun_ajaran} ${a.semester}?`)) return;
    const r = await deleteSawArchive(a.id);
    if (r.ok) {
      addActivityLog('Hapus Arsip SAW', `Arsip SAW ${a.cakupan} ${a.tahun_ajaran} ${a.semester} dihapus`);
      if (archiveDetail?.id === a.id) setArchiveDetail(null);
      await loadArchive();
    } else setArchiveMsg(`Gagal menghapus: ${r.message}`);
  };

  const tabs: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }>; hide?: boolean }[] = [
    { id: 'hasil', label: 'Hasil Perankingan', icon: Trophy },
    { id: 'kriteria', label: 'Kriteria & Bobot', icon: SlidersHorizontal, hide: isSiswa },
    { id: 'perhitungan', label: 'Perhitungan Lengkap', icon: Scale, hide: isSiswa },
    { id: 'matriks', label: 'Matriks Keputusan', icon: Table2, hide: isSiswa },
    { id: 'normalisasi', label: 'Normalisasi & Vi', icon: Calculator, hide: isSiswa },
    { id: 'langkah', label: 'Langkah Perhitungan', icon: ListOrdered, hide: isSiswa },
    { id: 'sensitivitas', label: 'Analisis Sensitivitas', icon: Activity, hide: isSiswa },
    { id: 'evaluasi', label: 'Evaluasi Rapor Siswa', icon: ClipboardList },
    { id: 'arsip', label: 'Arsip Hasil', icon: Archive, hide: isSiswa },
  ];

  /** Rumus normalisasi satu sel dengan angka disubstitusi (untuk tab Perhitungan Lengkap). */
  const cellFormula = (x: number, c: SawCriterion, j: number) =>
    c.type === 'benefit'
      ? `${fmt(x)} ÷ ${fmt(result.columnMax[j])}`
      : x <= 0 ? '1 (x = 0)' : `${fmt(result.columnMin[j])} ÷ ${fmt(x)}`;
  const costMinZero = criteria.some((c, j) => c.type === 'cost' && result.columnMin[j] === 0 && result.columnMax[j] > 0);

  const studentPicker = (
    <div className="no-print">
      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Pilih Siswa</label>
      <select value={focusId} onChange={e => setSelectedId(e.target.value)}
        className="py-1.5 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:border-amber-400 outline-none">
        {result.rows.map(r => <option key={r.id} value={r.id}>#{r.rank} — {r.name} ({r.classId})</option>)}
      </select>
    </div>
  );

  const signatureBlock = (
    <div className="hidden print:grid grid-cols-2 gap-8 pt-10 text-xs text-center">
      <div>
        <div>Mengetahui,</div>
        <div>{schoolProfile.principal.signatureTitle}</div>
        <div className="h-16" />
        <div className="font-bold underline">{schoolProfile.principal.name}</div>
        <div>NIP. {schoolProfile.principal.nip}</div>
      </div>
      <div>
        <div>Jakarta, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
        <div>{scope === 'ALL' ? 'Pembuat Laporan' : `Wali Kelas ${scope}`}</div>
        <div className="h-16" />
        <div className="font-bold">(................................)</div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl bg-gradient-to-r from-cream via-cream/90 to-amber-50 p-6 border border-amber-500/30 shadow-xl no-print">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 text-[11px] font-semibold uppercase tracking-wider">
          <Calculator className="w-4 h-4" /> Sistem Pendukung Keputusan
        </div>
        <h2 className="mt-2 text-xl md:text-2xl font-extrabold text-slate-900 font-serif-luxury tracking-wide">
          Evaluasi Rapor Siswa — Metode Simple Additive Weighting (SAW)
        </h2>
        <p className="text-sm text-slate-700 mt-1 max-w-3xl leading-relaxed">
          Menilai dan meranking siswa secara objektif dari beberapa kriteria sekaligus (nilai rapor, kehadiran,
          ketuntasan KKM, prestasi, dan pelanggaran) berdasarkan bobot yang ditetapkan sekolah.
        </p>
      </div>

      {/* Filter bar */}
      <div className="p-4 rounded-2xl bg-cream/80 border border-amber-500/20 flex flex-wrap items-end justify-between gap-4 no-print shadow">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Cakupan Perankingan</label>
            <select
              value={scope}
              disabled={isSiswa}
              onChange={e => { setScope(e.target.value); setSelectedId(''); }}
              className="py-1.5 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-amber-700 font-mono font-bold focus:border-amber-400 outline-none disabled:opacity-60"
            >
              {!isSiswa && <option value="ALL">Seluruh Sekolah</option>}
              {ALL_36_CLASSES.map(cls => <option key={cls} value={cls}>Kelas {cls}</option>)}
            </select>
          </div>
          <div className="text-xs text-slate-600">
            Periode: <span className="font-bold text-slate-800">{academicYear} — {semester}</span>
          </div>
          <div className="text-xs text-slate-600">
            Alternatif dinilai: <span className="font-bold text-slate-800">{alternatives.length} siswa</span>
          </div>
        </div>
        {!isSiswa && (
          <div className="flex items-center gap-2">
            <button onClick={exportExcel} disabled={!alternatives.length}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-2 hover:bg-emerald-700 active:scale-95 transition disabled:opacity-50">
              <Download className="w-4 h-4" /> Ekspor Excel
            </button>
            <button onClick={() => window.print()} disabled={!alternatives.length}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-bold flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition disabled:opacity-50">
              <Printer className="w-4 h-4" /> Cetak Laporan
            </button>
          </div>
        )}
      </div>

      {!weightValid && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-300 text-red-700 text-xs flex items-center gap-2 no-print">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Total bobot saat ini {fmt(weightSum)}% — harus tepat 100%. Perhitungan tetap memakai bobot yang dinormalkan otomatis.
        </div>
      )}
      {!thOk && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-300 text-red-700 text-xs flex items-center gap-2 no-print">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Ambang kategori tidak valid (harus menurun: Sangat Baik &gt; Baik &gt; Cukup &gt; 0 dan ≤ 1). Sementara dipakai ambang bawaan.
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 no-print">
        {tabs.filter(t => !t.hide).map(t => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition cursor-pointer ${
                active ? 'bg-amber-500/20 border-amber-400 text-amber-800' : 'bg-white border-slate-200 text-slate-600 hover:border-amber-300'
              }`}>
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Arsip tidak bergantung pada data periode berjalan */}
      {tab === 'arsip' && !isSiswa && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-wrap items-center justify-between gap-3 no-print">
            <div className="text-xs text-slate-600 max-w-2xl leading-relaxed">
              Arsip menyimpan <b>salinan permanen</b> hasil perankingan (nilai Vi, kategori, bobot saat itu) ke database MySQL,
              sehingga hasil semester lalu tetap bisa dilihat meskipun bobot atau data berubah. Satu arsip per kombinasi
              tahun ajaran, semester, dan cakupan (arsip baru menggantikan yang lama).
            </div>
            {isAdmin ? (
              <button onClick={archiveNow} disabled={!result.rows.length}
                className="px-4 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold flex items-center gap-2 hover:bg-amber-600 disabled:opacity-50">
                <Save className="w-4 h-4" /> Arsipkan Hasil {scope === 'ALL' ? 'Seluruh Sekolah' : `Kelas ${scope}`} ({academicYear} {semester})
              </button>
            ) : (
              <span className="text-xs text-slate-500">Hanya Admin yang dapat mengarsipkan atau menghapus.</span>
            )}
          </div>
          {archiveMsg && <div className="text-xs font-semibold text-emerald-700 no-print">{archiveMsg}</div>}
          {archiveError && <div className="p-3 rounded-xl bg-red-50 border border-red-300 text-red-700 text-xs">{archiveError}</div>}

          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white no-print">
            <table className="w-full text-xs">
              <thead className="bg-slate-100 text-slate-600 uppercase text-[10px]">
                <tr>
                  <th className="p-2.5 text-left">Tahun Ajaran</th><th className="p-2.5 text-center">Semester</th>
                  <th className="p-2.5 text-center">Cakupan</th><th className="p-2.5 text-center">Siswa</th>
                  <th className="p-2.5 text-center">Rata-rata Vi</th><th className="p-2.5 text-left">Dibuat Oleh</th>
                  <th className="p-2.5 text-left">Waktu</th><th className="p-2.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {archive === null && <tr><td colSpan={8} className="p-4 text-center text-slate-500">Memuat arsip…</td></tr>}
                {archive !== null && archive.length === 0 && !archiveError && (
                  <tr><td colSpan={8} className="p-4 text-center text-slate-500">Belum ada arsip.</td></tr>
                )}
                {(archive ?? []).map(a => (
                  <tr key={a.id} className="border-t border-slate-100 hover:bg-amber-50/40">
                    <td className="p-2.5 font-semibold">{a.tahun_ajaran}</td>
                    <td className="p-2.5 text-center">{a.semester}</td>
                    <td className="p-2.5 text-center font-mono">{a.cakupan === 'ALL' ? 'Seluruh Sekolah' : `Kelas ${a.cakupan}`}</td>
                    <td className="p-2.5 text-center">{a.jumlah_siswa}</td>
                    <td className="p-2.5 text-center font-mono">{fmt(Number(a.rata_vi), 4)}</td>
                    <td className="p-2.5">{a.dibuat_oleh ?? '-'}</td>
                    <td className="p-2.5 text-slate-500">{String(a.dibuat_pada).replace('T', ' ').slice(0, 16)}</td>
                    <td className="p-2.5 text-center whitespace-nowrap">
                      <button onClick={() => openArchive(a.id)} title="Lihat" className="p-1.5 rounded-lg hover:bg-sky-50 text-sky-700"><Eye className="w-4 h-4" /></button>
                      {isAdmin && <button onClick={() => removeArchive(a)} title="Hapus" className="p-1.5 rounded-lg hover:bg-red-50 text-red-600"><Trash2 className="w-4 h-4" /></button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {archiveDetail && (
            <div className="printable-rapor space-y-3">
              <div className="hidden print:block text-center border-b-2 border-double border-slate-400 pb-3">
                <div className="text-sm font-bold uppercase">{schoolProfile.name}</div>
                <div className="text-xs">Arsip Hasil Evaluasi Rapor Siswa — Metode SAW</div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-slate-800">
                  Arsip: {archiveDetail.cakupan === 'ALL' ? 'Seluruh Sekolah' : `Kelas ${archiveDetail.cakupan}`} • {archiveDetail.tahun_ajaran} • {archiveDetail.semester}
                </h3>
                <div className="flex gap-2 no-print">
                  <button onClick={() => window.print()} className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5"><Printer className="w-3.5 h-3.5" /> Cetak</button>
                  <button onClick={() => setArchiveDetail(null)} className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-bold">Tutup</button>
                </div>
              </div>
              <div className="text-[11px] text-slate-600">
                Bobot saat diarsipkan: {archiveDetail.kriteria.map(k => `${k.code} ${k.weight}% (${k.type})`).join(' • ')}
              </div>
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                <table className="w-full text-xs">
                  <thead className="bg-slate-100 text-slate-600 uppercase text-[10px]">
                    <tr><th className="p-2.5">Rank</th><th className="p-2.5 text-left">NISN</th><th className="p-2.5 text-left">Nama</th><th className="p-2.5">Kelas</th><th className="p-2.5">Vi</th><th className="p-2.5">Kategori</th></tr>
                  </thead>
                  <tbody>
                    {archiveDetail.hasil.map(r => (
                      <tr key={r.studentId + r.rank} className="border-t border-slate-100">
                        <td className="p-2.5 text-center font-extrabold">{r.rank}</td>
                        <td className="p-2.5 font-mono text-slate-600">{r.nisn}</td>
                        <td className="p-2.5 font-semibold">{r.name}</td>
                        <td className="p-2.5 text-center font-mono">{r.classId}</td>
                        <td className="p-2.5 text-center font-mono font-bold">{fmt(r.preference, 4)}</td>
                        <td className="p-2.5 text-center"><span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${categoryStyle[r.category]}`}>{r.category}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {signatureBlock}
            </div>
          )}
        </div>
      )}

      {tab === 'kriteria' && !isSiswa && (
        <div className="space-y-4">
          {dbConfigActive && (
            <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-[11px] text-sky-800 flex gap-2 no-print">
              <Info className="w-4 h-4 shrink-0" />
              Bobot, ambang, dan mode periode di bawah mengikuti pengaturan resmi dari database. {isAdmin ? 'Sebagai Admin, perubahan Anda dapat disimpan untuk semua pengguna.' : 'Perubahan Anda hanya simulasi pada sesi ini; bobot resmi ditetapkan Admin.'}
            </div>
          )}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-xs">
              <thead className="bg-slate-100 text-slate-600 uppercase text-[10px]">
                <tr>
                  <th className="p-2.5 text-left">Kode</th><th className="p-2.5 text-left">Kriteria</th>
                  <th className="p-2.5 text-center">Jenis</th><th className="p-2.5 text-center">Bobot (%)</th>
                  <th className="p-2.5 text-left">Sumber Data</th>
                </tr>
              </thead>
              <tbody>
                {criteria.map((c, i) => (
                  <tr key={c.code} className="border-t border-slate-100">
                    <td className="p-2.5 font-mono font-bold text-amber-700">{c.code}</td>
                    <td className="p-2.5 font-semibold text-slate-800">{c.name}</td>
                    <td className="p-2.5 text-center">
                      <select value={c.type} disabled={!canEditCriteria}
                        onChange={e => updateCriterion(i, { type: e.target.value as 'benefit' | 'cost' })}
                        className="py-1 px-2 rounded-lg border border-slate-200 text-xs bg-slate-50 disabled:opacity-60">
                        <option value="benefit">Benefit</option><option value="cost">Cost</option>
                      </select>
                    </td>
                    <td className="p-2.5 text-center">
                      <input type="number" min={0} max={100} step={1} value={c.weight} disabled={!canEditCriteria}
                        onChange={e => updateCriterion(i, { weight: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })}
                        className="w-20 py-1 px-2 rounded-lg border border-slate-200 text-center font-mono bg-slate-50 disabled:opacity-60" />
                    </td>
                    <td className="p-2.5 text-slate-600">{c.source}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50">
                  <td colSpan={3} className="p-2.5 text-right font-bold text-slate-700">Total Bobot</td>
                  <td className={`p-2.5 text-center font-mono font-extrabold ${weightValid ? 'text-emerald-600' : 'text-red-600'}`}>{fmt(weightSum, 0)}%</td>
                  <td className="p-2.5">
                    {canEditCriteria && !weightValid && (
                      <button onClick={() => { setCfg(p => ({ ...p, criteria: normalizeTo100(p.criteria) })); setSavedMsg(''); }}
                        className="px-2.5 py-1 rounded-lg bg-white border border-amber-400 text-amber-800 text-[11px] font-bold flex items-center gap-1.5 no-print">
                        <Scale className="w-3.5 h-3.5" /> Normalkan ke 100%
                      </button>
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Ambang kategori + mode periode */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
              <div className="text-xs font-bold text-slate-800">Ambang Kategori (batas bawah Vi)</div>
              <div className="grid grid-cols-3 gap-3">
                {([['sb', 'Sangat Baik'], ['b', 'Baik'], ['c', 'Cukup']] as const).map(([k, label]) => (
                  <div key={k}>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">{label} ≥</label>
                    <input type="number" step={0.01} min={0} max={1} value={th[k]} disabled={!canEditCriteria}
                      onChange={e => updateTh({ [k]: Number(e.target.value) } as Partial<UiConfig['th']>)}
                      className="w-full py-1 px-2 rounded-lg border border-slate-200 text-center font-mono bg-slate-50 disabled:opacity-60" />
                  </div>
                ))}
              </div>
              <div className="text-[11px] text-slate-500">Di bawah batas Cukup = Perlu Pembinaan. Bawaan: 0,90 / 0,80 / 0,70.</div>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
              <div className="text-xs font-bold text-slate-800">Cakupan Data Presensi, Pelanggaran & Prestasi</div>
              <label className="flex items-start gap-2 text-xs text-slate-700 cursor-pointer">
                <input type="radio" name="period" checked={periodOnly} disabled={!canEditCriteria}
                  onChange={() => { setCfg(p => ({ ...p, periodOnly: true })); setSavedMsg(''); }} className="mt-0.5" />
                <span><b>Hanya semester terpilih</b> ({range.start} s.d. {range.end}). Prestasi dihitung bila tahunnya ada dalam tahun ajaran. Disarankan.</span>
              </label>
              <label className="flex items-start gap-2 text-xs text-slate-700 cursor-pointer">
                <input type="radio" name="period" checked={!periodOnly} disabled={!canEditCriteria}
                  onChange={() => { setCfg(p => ({ ...p, periodOnly: false })); setSavedMsg(''); }} className="mt-0.5" />
                <span><b>Seluruh catatan tersimpan</b> (akumulatif sejak awal, seperti versi sebelumnya).</span>
              </label>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 no-print">
            {canEditCriteria ? (
              <>
                <button onClick={saveConfig} disabled={!weightValid || !thOk || !canSaveConfig || saving}
                  className="px-4 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 disabled:opacity-50 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> {saving ? 'Menyimpan…' : 'Simpan Pengaturan'}
                </button>
                <button onClick={resetCriteria}
                  className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-bold hover:border-amber-400 flex items-center gap-2">
                  <RotateCcw className="w-4 h-4" /> Reset Bawaan
                </button>
                {savedMsg && <span className="text-xs text-emerald-600 font-semibold">{savedMsg}</span>}
                {!canSaveConfig && <span className="text-xs text-slate-500">Bobot resmi sudah ditetapkan Admin; perubahan di sini hanya simulasi.</span>}
              </>
            ) : (
              <span className="text-xs text-slate-500">Bobot kriteria hanya dapat diubah oleh Admin atau Kepala Sekolah.</span>
            )}
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
            <div><b>Benefit</b>: semakin besar semakin baik → r<sub>ij</sub> = x<sub>ij</sub> / max(x<sub>j</sub>)</div>
            <div><b>Cost</b>: semakin kecil semakin baik → r<sub>ij</sub> = min(x<sub>j</sub>) / x<sub>ij</sub> (nilai 0 = skor sempurna)</div>
            <div>Nilai preferensi: V<sub>i</sub> = Σ (w<sub>j</sub> × r<sub>ij</sub>)</div>
          </div>
        </div>
      )}

      {tab !== 'arsip' && tab !== 'kriteria' && (
        alternatives.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-sm text-slate-600">
            Belum ada nilai rapor untuk cakupan ini pada {academicYear} semester {semester}. Input nilai terlebih dahulu
            pada menu <b>Input Nilai Siswa</b>, lalu kembali ke halaman ini.
          </div>
        ) : (
          <div className="printable-rapor space-y-6">
            {/* Kop cetak */}
            <div className="hidden print:block text-center border-b-2 border-double border-slate-400 pb-3">
              <div className="text-sm font-bold uppercase">{schoolProfile.name}</div>
              <div className="text-xs">Laporan Evaluasi Rapor Siswa — Metode SAW</div>
              <div className="text-xs">{scope === 'ALL' ? 'Seluruh Sekolah' : `Kelas ${scope}`} • {academicYear} • Semester {semester}</div>
            </div>

            {/* ================= HASIL ================= */}
            {tab === 'hasil' && (
              <>
                {!isSiswa && (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div className="p-3 rounded-2xl bg-white border border-slate-200">
                      <div className="text-[10px] uppercase font-bold text-slate-500">Rata-rata Vi</div>
                      <div className="text-xl font-extrabold text-slate-900">{fmt(avgPref, 3)}</div>
                    </div>
                    {activeThresholds.map(t => (
                      <div key={t.label} className={`p-3 rounded-2xl border ${categoryStyle[t.label]}`}>
                        <div className="text-[10px] uppercase font-bold">{t.label}</div>
                        <div className="text-xl font-extrabold">{categoryCounts[t.label]} siswa</div>
                      </div>
                    ))}
                  </div>
                )}

                {isSiswa && focusRow && (
                  <div className="p-5 rounded-2xl bg-white border border-amber-300 shadow">
                    <div className="text-xs uppercase font-bold text-amber-700">Posisi Akademik Saya di Kelas {focusRow.classId}</div>
                    <div className="mt-1 text-3xl font-extrabold text-slate-900">
                      Peringkat {focusRow.rank} <span className="text-base font-semibold text-slate-500">dari {result.rows.length} siswa</span>
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-sm">
                      <span>Nilai preferensi (Vi): <b>{fmt(focusRow.preference, 4)}</b></span>
                      <span className={`px-2.5 py-0.5 rounded-full border text-xs font-bold ${categoryStyle[focusRow.category]}`}>{focusRow.category}</span>
                    </div>
                  </div>
                )}

                {!isSiswa && result.rows.length > 1 && (
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
                    <div className="text-xs font-bold text-slate-800">Grafik Nilai Preferensi — {Math.min(10, result.rows.length)} Teratas</div>
                    {result.rows.slice(0, 10).map(r => (
                      <div key={r.id} className="flex items-center gap-2 text-[11px]">
                        <span className="w-6 text-right font-bold text-slate-700">{r.rank}</span>
                        <span className="w-40 truncate text-slate-700">{r.name}</span>
                        <div className="flex-1 h-3 rounded-full bg-slate-100 overflow-hidden">
                          <div className={`h-full rounded-full ${categoryBar[r.category]}`} style={{ width: `${Math.round(Math.min(1, r.preference) * 100)}%` }} />
                        </div>
                        <span className="w-14 text-right font-mono text-slate-700">{fmt(r.preference, 4)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {!isSiswa && (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-100 text-slate-600 uppercase text-[10px]">
                        <tr>
                          <th className="p-2.5 text-center">Rank</th>
                          <th className="p-2.5 text-left">NISN</th>
                          <th className="p-2.5 text-left">Nama Siswa</th>
                          <th className="p-2.5 text-center">Kelas</th>
                          <th className="p-2.5 text-center">Nilai Preferensi (Vi)</th>
                          <th className="p-2.5 text-center">Kategori</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.rows.map(r => (
                          <tr key={r.id} className="border-t border-slate-100 hover:bg-amber-50/40">
                            <td className="p-2.5 text-center font-extrabold text-slate-900">
                              {r.rank <= 3 ? <Trophy className={`inline w-4 h-4 mr-1 ${r.rank === 1 ? 'text-amber-500' : r.rank === 2 ? 'text-slate-400' : 'text-orange-600'}`} /> : null}
                              {r.rank}
                            </td>
                            <td className="p-2.5 font-mono text-slate-600">{r.nisn}</td>
                            <td className="p-2.5 font-semibold text-slate-800">{r.name}</td>
                            <td className="p-2.5 text-center font-mono">{r.classId}</td>
                            <td className="p-2.5 text-center font-mono font-bold">{fmt(r.preference, 4)}</td>
                            <td className="p-2.5 text-center">
                              <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${categoryStyle[r.category]}`}>{r.category}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex gap-2">
                  <Info className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>
                    Kategori: {activeThresholds.slice(0, 3).map(t => `Vi ≥ ${fmt(t.min)} ${t.label}`).join(' • ')} • di bawahnya Perlu Pembinaan.
                    Ranking dihitung relatif terhadap siswa lain dalam cakupan yang dipilih.
                    Presensi, pelanggaran, dan prestasi {periodOnly ? `dihitung pada semester terpilih (${range.start} s.d. ${range.end}).` : 'dihitung dari seluruh catatan tersimpan.'}
                  </span>
                </div>

                {!isSiswa && (excluded.length > 0 || noAttendance.length > 0) && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-[11px] text-amber-800 space-y-1 no-print">
                    {excluded.length > 0 && (
                      <div><b>{excluded.length} siswa belum diikutkan</b> karena belum memiliki nilai rapor pada periode ini:{' '}
                        {excluded.slice(0, 8).join(', ')}{excluded.length > 8 ? ', dst.' : ''}</div>
                    )}
                    {noAttendance.length > 0 && (
                      <div><b>{noAttendance.length} siswa belum punya catatan presensi</b> pada {periodOnly ? 'periode ini' : 'data tersimpan'} sehingga kehadirannya dianggap 100%:{' '}
                        {noAttendance.slice(0, 8).join(', ')}{noAttendance.length > 8 ? ', dst.' : ''}. Lengkapi presensi agar peringkat lebih akurat.</div>
                    )}
                  </div>
                )}
                {!isSiswa && signatureBlock}
              </>
            )}

            {/* ================= MATRIKS ================= */}
            {/* ================= PERHITUNGAN LENGKAP ================= */}
            {tab === 'perhitungan' && !isSiswa && (
              <div className="space-y-5">
                <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
                  <h3 className="text-sm font-bold text-slate-800">Rumus Metode SAW</h3>
                  <div className="text-[12px] text-slate-700 space-y-1 font-mono">
                    <div>Benefit : r<sub>ij</sub> = x<sub>ij</sub> ÷ max(x<sub>j</sub>)</div>
                    <div>Cost &nbsp;&nbsp;&nbsp;: r<sub>ij</sub> = min(x<sub>j</sub>) ÷ x<sub>ij</sub> &nbsp;(bila x<sub>ij</sub> = 0 maka r<sub>ij</sub> = 1)</div>
                    <div>Preferensi : V<sub>i</sub> = Σ (w<sub>j</sub> × r<sub>ij</sub>), &nbsp;w<sub>j</sub> = bobot<sub>j</sub> ÷ 100</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-slate-800">Tahap 1 — Kriteria dan Bobot</h3>
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-100 text-slate-600 uppercase text-[10px]">
                        <tr><th className="p-2.5 text-left">Kode</th><th className="p-2.5 text-left">Kriteria</th><th className="p-2.5 text-center">Jenis</th><th className="p-2.5 text-center">Bobot (%)</th><th className="p-2.5 text-center">w</th></tr>
                      </thead>
                      <tbody>
                        {criteria.map((c, j) => (
                          <tr key={c.code} className="border-t border-slate-100">
                            <td className="p-2.5 font-mono font-bold">{c.code}</td><td className="p-2.5">{c.name}</td>
                            <td className="p-2.5 text-center">{c.type === 'benefit' ? 'Benefit' : 'Cost'}</td>
                            <td className="p-2.5 text-center font-mono">{fmt(c.weight, 0)}</td>
                            <td className="p-2.5 text-center font-mono">{fmt(result.normalizedWeights[j], 4)}</td>
                          </tr>
                        ))}
                        <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold">
                          <td className="p-2.5" colSpan={3}>Total</td>
                          <td className="p-2.5 text-center font-mono">{fmt(weightSum, 0)}</td>
                          <td className="p-2.5 text-center font-mono">{fmt(result.normalizedWeights.reduce((a, b) => a + b, 0), 4)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-slate-800">Tahap 2 — Matriks Keputusan (X)</h3>
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-100 text-slate-600 uppercase text-[10px]">
                        <tr><th className="p-2.5 text-left">Siswa</th>{criteria.map(c => <th key={c.code} className="p-2.5 text-center">{c.code}</th>)}</tr>
                      </thead>
                      <tbody>
                        {result.rows.map(r => (
                          <tr key={r.id} className="border-t border-slate-100">
                            <td className="p-2.5 font-semibold text-slate-800">{r.name}</td>
                            {r.values.map((v, j) => <td key={j} className="p-2.5 text-center font-mono">{fmt(v)}</td>)}
                          </tr>
                        ))}
                        <tr className="border-t-2 border-slate-200 bg-emerald-50/60 font-bold">
                          <td className="p-2.5">Maksimum</td>{result.columnMax.map((v, j) => <td key={j} className="p-2.5 text-center font-mono">{fmt(v)}</td>)}
                        </tr>
                        <tr className="bg-red-50/60 font-bold">
                          <td className="p-2.5">Minimum</td>{result.columnMin.map((v, j) => <td key={j} className="p-2.5 text-center font-mono">{fmt(v)}</td>)}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-slate-800">Tahap 3 — Normalisasi (R)</h3>
                  <p className="text-[11px] text-slate-600">Setiap sel menampilkan rumus dengan angka, lalu hasilnya.</p>
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-100 text-slate-600 uppercase text-[10px]">
                        <tr><th className="p-2.5 text-left">Siswa</th>{criteria.map(c => <th key={c.code} className="p-2.5 text-center">{c.code}<div className="normal-case font-normal">{c.type}</div></th>)}</tr>
                      </thead>
                      <tbody>
                        {result.rows.map(r => (
                          <tr key={r.id} className="border-t border-slate-100">
                            <td className="p-2.5 font-semibold text-slate-800">{r.name}</td>
                            {r.normalized.map((v, j) => (
                              <td key={j} className="p-2.5 text-center">
                                <div className="font-mono text-[10px] text-slate-500">{cellFormula(r.values[j] ?? 0, criteria[j], j)}</div>
                                <div className="font-mono font-bold">{fmt(v, 4)}</div>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-slate-800">Tahap 4 — Pembobotan (w × r)</h3>
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-100 text-slate-600 uppercase text-[10px]">
                        <tr>
                          <th className="p-2.5 text-left">Siswa</th>
                          {criteria.map((c, j) => <th key={c.code} className="p-2.5 text-center">{c.code}<div className="normal-case font-normal">w = {fmt(result.normalizedWeights[j], 2)}</div></th>)}
                          <th className="p-2.5 text-center">Σ = Vi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.rows.map(r => (
                          <tr key={r.id} className="border-t border-slate-100">
                            <td className="p-2.5 font-semibold text-slate-800">{r.name}</td>
                            {r.weighted.map((v, j) => <td key={j} className="p-2.5 text-center font-mono">{fmt(v, 4)}</td>)}
                            <td className="p-2.5 text-center font-mono font-extrabold text-amber-700">{fmt(r.preference, 4)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-slate-800">Tahap 5 — Nilai Preferensi (Vi), Peringkat, dan Kategori</h3>
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-100 text-slate-600 uppercase text-[10px]">
                        <tr><th className="p-2.5 text-center">Rank</th><th className="p-2.5 text-left">Siswa</th><th className="p-2.5 text-left">Perhitungan Vi</th><th className="p-2.5 text-center">Vi</th><th className="p-2.5 text-center">Kategori</th></tr>
                      </thead>
                      <tbody>
                        {result.rows.map(r => (
                          <tr key={r.id} className="border-t border-slate-100">
                            <td className="p-2.5 text-center font-extrabold">{r.rank}</td>
                            <td className="p-2.5 font-semibold text-slate-800">{r.name}</td>
                            <td className="p-2.5 font-mono text-[10px] text-slate-600">{r.weighted.map(v => fmt(v, 4)).join(' + ')}</td>
                            <td className="p-2.5 text-center font-mono font-extrabold text-amber-700">{fmt(r.preference, 4)}</td>
                            <td className="p-2.5 text-center"><span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${categoryStyle[r.category]}`}>{r.category}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Kategori: {activeThresholds.slice(0, 3).map(t => `Vi ≥ ${fmt(t.min)} ${t.label}`).join(' • ')} • di bawahnya Perlu Pembinaan.
                  </div>
                  {costMinZero && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-[11px] text-amber-800 flex gap-2">
                      <Info className="w-4 h-4 shrink-0 mt-0.5" />
                      Pada kriteria cost, nilai minimum kolom = 0 (ada siswa tanpa pelanggaran), sehingga siswa yang memiliki pelanggaran
                      mendapat r = 0 pada kriteria tersebut. Ini konsekuensi rumus SAW standar.
                    </div>
                  )}
                </div>
                {signatureBlock}
              </div>
            )}

            {tab === 'matriks' && !isSiswa && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-800">Matriks Keputusan (X)</h3>
                <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-100 text-slate-600 uppercase text-[10px]">
                      <tr>
                        <th className="p-2.5 text-left">Alternatif (Siswa)</th>
                        {criteria.map(c => <th key={c.code} className="p-2.5 text-center">{c.code}<div className="normal-case font-normal">{c.unit}</div></th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {result.rows.map(r => (
                        <tr key={r.id} className="border-t border-slate-100">
                          <td className="p-2.5 font-semibold text-slate-800">{r.name}</td>
                          {r.values.map((v, j) => <td key={j} className="p-2.5 text-center font-mono">{fmt(v)}</td>)}
                        </tr>
                      ))}
                      <tr className="border-t-2 border-slate-200 bg-emerald-50/50">
                        <td className="p-2.5 font-bold text-slate-700">Nilai Maksimum</td>
                        {result.columnMax.map((v, j) => <td key={j} className="p-2.5 text-center font-mono font-bold">{fmt(v)}</td>)}
                      </tr>
                      <tr className="bg-red-50/50">
                        <td className="p-2.5 font-bold text-slate-700">Nilai Minimum</td>
                        {result.columnMin.map((v, j) => <td key={j} className="p-2.5 text-center font-mono font-bold">{fmt(v)}</td>)}
                      </tr>
                    </tbody>
                  </table>
                </div>
                {signatureBlock}
              </div>
            )}

            {/* ================= NORMALISASI ================= */}
            {tab === 'normalisasi' && !isSiswa && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-800">Matriks Ternormalisasi (R) dan Nilai Preferensi (V)</h3>
                <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-100 text-slate-600 uppercase text-[10px]">
                      <tr>
                        <th className="p-2.5 text-left">Alternatif</th>
                        {criteria.map((c, j) => (
                          <th key={c.code} className="p-2.5 text-center">
                            {c.code}<div className="normal-case font-normal">{c.type} • w={fmt(result.normalizedWeights[j], 2)}</div>
                          </th>
                        ))}
                        <th className="p-2.5 text-center">Vi</th>
                        <th className="p-2.5 text-center">Rank</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.rows.map(r => (
                        <tr key={r.id} className="border-t border-slate-100">
                          <td className="p-2.5 font-semibold text-slate-800">{r.name}</td>
                          {r.normalized.map((v, j) => <td key={j} className="p-2.5 text-center font-mono">{fmt(v, 3)}</td>)}
                          <td className="p-2.5 text-center font-mono font-extrabold text-amber-700">{fmt(r.preference, 4)}</td>
                          <td className="p-2.5 text-center font-extrabold">{r.rank}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {signatureBlock}
              </div>
            )}

            {/* ================= LANGKAH PERHITUNGAN ================= */}
            {tab === 'langkah' && !isSiswa && (
              <div className="space-y-4">
                {studentPicker}
                {focusRow ? (
                  <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4">
                    <div>
                      <div className="text-lg font-extrabold text-slate-900">{focusRow.name}</div>
                      <div className="text-xs text-slate-500 font-mono">NISN {focusRow.nisn} • Kelas {focusRow.classId} • Peringkat {focusRow.rank} dari {result.rows.length}</div>
                    </div>
                    <div className="text-[11px] text-slate-600 leading-relaxed">
                      <b>Langkah 1</b> — nilai mentah (x<sub>ij</sub>) diambil dari SIAKAD. <b>Langkah 2</b> — normalisasi:
                      benefit r = x ÷ max kolom; cost r = min kolom ÷ x. <b>Langkah 3</b> — kalikan dengan bobot ternormalisasi
                      (w). <b>Langkah 4</b> — jumlahkan seluruh kontribusi menjadi V<sub>i</sub>.
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-100 text-slate-600 uppercase text-[10px]">
                          <tr>
                            <th className="p-2.5 text-left">Kriteria</th><th className="p-2.5 text-center">Jenis</th>
                            <th className="p-2.5 text-center">x</th><th className="p-2.5 text-center">Max / Min kolom</th>
                            <th className="p-2.5 text-left">Normalisasi</th><th className="p-2.5 text-center">r</th>
                            <th className="p-2.5 text-center">w</th><th className="p-2.5 text-center">w × r</th>
                          </tr>
                        </thead>
                        <tbody>
                          {steps.map(s => (
                            <tr key={s.code} className="border-t border-slate-100">
                              <td className="p-2.5 font-semibold text-slate-800">{s.code} — {s.name}</td>
                              <td className="p-2.5 text-center">{s.type}</td>
                              <td className="p-2.5 text-center font-mono">{fmt(s.x)}</td>
                              <td className="p-2.5 text-center font-mono">{fmt(s.reference)}</td>
                              <td className="p-2.5 font-mono text-slate-600">{s.formula} = {fmt(s.r, 4)}</td>
                              <td className="p-2.5 text-center font-mono">{fmt(s.r, 4)}</td>
                              <td className="p-2.5 text-center font-mono">{fmt(s.weight, 4)}</td>
                              <td className="p-2.5 text-center font-mono font-bold">{fmt(s.contribution, 4)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 border-slate-200 bg-amber-50">
                            <td colSpan={7} className="p-2.5 text-right font-bold text-slate-700">
                              V<sub>i</sub> = {steps.map(s => fmt(s.contribution, 4)).join(' + ')}
                            </td>
                            <td className="p-2.5 text-center font-mono font-extrabold text-amber-700">{fmt(focusRow.preference, 4)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                    <div className="text-xs text-slate-700">
                      Hasil: V<sub>i</sub> = <b className="font-mono">{fmt(focusRow.preference, 4)}</b> → kategori{' '}
                      <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${categoryStyle[focusRow.category]}`}>{focusRow.category}</span>,
                      peringkat <b>{focusRow.rank}</b>.
                    </div>
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-white border border-slate-200 text-sm text-slate-600">Pilih siswa untuk melihat langkah perhitungannya.</div>
                )}
                {signatureBlock}
              </div>
            )}

            {/* ================= SENSITIVITAS ================= */}
            {tab === 'sensitivitas' && !isSiswa && sensitivity && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-800">Analisis Sensitivitas Bobot</h3>
                <p className="text-[11px] text-slate-600 leading-relaxed max-w-3xl">
                  Menguji seberapa stabil peringkat bila bobot diubah: (1) bobot sama rata, dan (2) tiap kriteria dinaikkan 10 poin
                  dengan bobot lain diturunkan proporsional. Peringkat yang banyak berubah menandakan hasil sensitif terhadap penetapan bobot.
                </p>
                <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-900">
                  Peringkat 1 ({result.rows[0]?.name}) bertahan pada <b>{sensitivity.topStable} dari {sensitivity.scenarios.length}</b> skenario.
                </div>
                <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-100 text-slate-600 uppercase text-[10px]">
                      <tr>
                        <th className="p-2.5 text-left">Siswa</th>
                        <th className="p-2.5 text-center">Peringkat<div className="normal-case font-normal">saat ini</div></th>
                        {sensitivity.scenarios.slice(1).map((sc, k) => (
                          <th key={sc.id} className="p-2.5 text-center">{sc.label}
                            <div className="normal-case font-normal">{sensitivity.changedCount[k + 1]} berubah</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sensitivity.rows.map(r => (
                        <tr key={r.id} className="border-t border-slate-100">
                          <td className="p-2.5 font-semibold text-slate-800">{r.name}</td>
                          <td className="p-2.5 text-center font-extrabold">{r.baseRank}</td>
                          {r.ranks.slice(1).map((rk, k) => {
                            const d = r.baseRank - rk; // positif = naik
                            return (
                              <td key={k} className="p-2.5 text-center font-mono">
                                {rk}{' '}
                                {d > 0 && <span className="text-emerald-600 font-bold">▲{d}</span>}
                                {d < 0 && <span className="text-red-600 font-bold">▼{-d}</span>}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {signatureBlock}
              </div>
            )}

            {/* ================= EVALUASI ================= */}
            {tab === 'evaluasi' && (
              <div className="space-y-4">
                {!isSiswa && studentPicker}

                {focusRow ? (
                  <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-lg font-extrabold text-slate-900">{focusRow.name}</div>
                        <div className="text-xs text-slate-500 font-mono">NISN {focusRow.nisn} • Kelas {focusRow.classId}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-slate-500">Peringkat {focusRow.rank} dari {result.rows.length}</div>
                        <div className="text-2xl font-extrabold text-amber-700 font-mono">{fmt(focusRow.preference, 4)}</div>
                        <span className={`px-2.5 py-0.5 rounded-full border text-xs font-bold ${categoryStyle[focusRow.category]}`}>{focusRow.category}</span>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      {criteria.map((c, j) => (
                        <div key={c.code}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-semibold text-slate-700">{c.code} — {c.name}</span>
                            <span className="font-mono text-slate-600">
                              {fmt(focusRow.values[j])} {c.unit} • r = {fmt(focusRow.normalized[j], 3)}
                            </span>
                          </div>
                          <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${focusRow.normalized[j] >= 0.85 ? 'bg-emerald-500' : focusRow.normalized[j] >= 0.7 ? 'bg-amber-400' : 'bg-red-400'}`}
                              style={{ width: `${Math.round(focusRow.normalized[j] * 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-xs text-slate-700 leading-relaxed">
                      <div className="font-bold text-amber-800 mb-1">Rekomendasi Evaluasi</div>
                      {buildRecommendation(focusRow, criteria)}
                    </div>
                    {!isSiswa && (
                      <div className="flex justify-end no-print">
                        <button onClick={() => window.print()}
                          className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5">
                          <Printer className="w-3.5 h-3.5" /> Cetak Evaluasi Siswa Ini
                        </button>
                      </div>
                    )}
                    {!isSiswa && signatureBlock}
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-white border border-slate-200 text-sm text-slate-600">
                    Data siswa ini belum masuk perhitungan (belum ada nilai rapor pada periode terpilih).
                  </div>
                )}
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
};
