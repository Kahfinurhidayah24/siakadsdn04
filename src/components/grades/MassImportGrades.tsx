import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { ALL_36_CLASSES } from '../../data/initialData';
import { MassImportPreviewItem } from '../../types';
import { 
  FileSpreadsheet, Upload, Download, CheckCircle2, 
  AlertTriangle, XCircle, ArrowRight, RefreshCw, 
  FileText, ShieldCheck, CheckSquare, Layers 
} from 'lucide-react';

export const MassImportGrades: React.FC = () => {
  const { students, subjects, academicYear, semester, importMassGrades, grades } = useSchool();

  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [previewItems, setPreviewItems] = useState<MassImportPreviewItem[]>([]);
  const [overwriteExisting, setOverwriteExisting] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'valid' | 'error'>('ALL');
  const [importResult, setImportResult] = useState<{ imported: number; updated: number; skipped: number } | null>(null);

  // Generate Sample Pre-filled Mock File when user clicks "Muat Contoh File Nilai 36 Kelas"
  const handleLoadSampleFile = () => {
    setUploadedFileName('E-Rapor_Massal_SemesterGanjil_36Kelas.xlsx');
    setImportResult(null);

    // Build sample rows matching existing students and some simulated mismatched rows
    const generated: MassImportPreviewItem[] = [];

    // Valid items from existing students
    students.forEach((std) => {
      subjects.slice(0, 3).forEach((sub) => {
        const existingGrade = grades.find(g => g.studentNisn === std.nisn && g.subjectId === sub.id);
        const score = Math.floor(82 + Math.random() * 16);
        generated.push({
          nisn: std.nisn,
          name: std.name,
          classId: std.classId,
          subject: sub.name,
          semester: 'Ganjil',
          academicYear: '2025/2026',
          finalScore: score,
          description: `Sangat terampil dan aktif dalam penguasaan materi asesmen ${sub.name}.`,
          status: 'valid',
          statusMessage: '✓ Cocok dengan database',
          isExisting: !!existingGrade
        });
      });
    });

    // Add a few deliberate error test rows to verify validation detection
    generated.push({
      nisn: '0099999999',
      name: 'Bima Satria (Siswa Pindahan Belum Ada Data)',
      classId: '4A',
      subject: 'Matematika',
      semester: 'Ganjil',
      academicYear: '2025/2026',
      finalScore: 88,
      description: 'Sangat baik.',
      status: 'nisn_not_found',
      statusMessage: '⚠ NISN tidak ditemukan di database'
    });

    generated.push({
      nisn: students[0]?.nisn || '0098765432',
      name: students[0]?.name || 'Farhan',
      classId: '4A',
      subject: 'Astronomi Luar Angkasa',
      semester: 'Ganjil',
      academicYear: '2025/2026',
      finalScore: 90,
      description: 'Baik.',
      status: 'subject_not_found',
      statusMessage: '⚠ Mata pelajaran tidak terdaftar'
    });

    generated.push({
      nisn: students[1]?.nisn || '0098765433',
      name: students[1]?.name || 'Aisyah',
      classId: '4A',
      subject: 'Bahasa Indonesia',
      semester: 'Ganjil',
      academicYear: '2025/2026',
      finalScore: 125, // Invalid score > 100
      description: 'Melebihi batas.',
      status: 'invalid_score',
      statusMessage: '⚠ Nilai tidak valid (harus 0-100)'
    });

    setPreviewItems(generated);
  };

  // Handle actual file upload simulation (reads CSV or .xlsx headers)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setImportResult(null);

    // Read file text
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text ? text.split('\n') : [];
      
      // If user uploaded a valid csv with columns: NISN,Nama,Kelas,Mapel,TahunAjaran,Semester,Nilai,Deskripsi
      if (lines.length > 1) {
        const parsed: MassImportPreviewItem[] = [];
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          const cols = line.split(',').map(c => c.replace(/^"|"$/g, '').trim());
          if (cols.length >= 7) {
            const nisn = cols[0];
            const name = cols[1];
            const classId = cols[2];
            const subject = cols[3];
            const year = cols[4];
            const sem = cols[5];
            const score = parseInt(cols[6]) || 0;
            const desc = cols[7] || '';

            // Match against DB
            const studentExists = students.find(s => s.nisn === nisn);
            const subjectExists = subjects.find(s => s.name.toLowerCase() === subject.toLowerCase() || s.code.toLowerCase() === subject.toLowerCase());

            let status: MassImportPreviewItem['status'] = 'valid';
            let statusMessage = '✓ Cocok';

            if (!studentExists) {
              status = 'nisn_not_found';
              statusMessage = '⚠ NISN tidak ditemukan di database';
            } else if (!subjectExists) {
              status = 'subject_not_found';
              statusMessage = '⚠ Mata pelajaran tidak ditemukan';
            } else if (studentExists.classId !== classId) {
              status = 'class_mismatch';
              statusMessage = `⚠ Kelas tidak sesuai (Siswa di Kelas ${studentExists.classId})`;
            } else if (score < 0 || score > 100) {
              status = 'invalid_score';
              statusMessage = '⚠ Nilai tidak valid (0 - 100)';
            }

            parsed.push({
              nisn,
              name,
              classId,
              subject,
              academicYear: year,
              semester: sem,
              finalScore: score,
              description: desc,
              status,
              statusMessage,
              isExisting: studentExists ? grades.some(g => g.studentNisn === nisn && g.subjectId === subjectExists?.id) : false
            });
          }
        }
        if (parsed.length > 0) {
          setPreviewItems(parsed);
          return;
        }
      }

      // Default fallback
      handleLoadSampleFile();
    };

    reader.readAsText(file);
  };

  // Download Template Excel/CSV
  const handleDownloadTemplate = () => {
    const header = 'NISN,Nama Siswa,Kelas,Mata Pelajaran,Tahun Ajaran,Semester,Nilai Akhir,Deskripsi Capaian';
    const sampleRow1 = '0098765432,Muhammad Farhan Al-Fatih,4A,Matematika,2025/2026,Ganjil,88,Sangat baik dalam operasi pecahan';
    const sampleRow2 = '0098765433,Aisyah Putri Azzahra,4A,Bahasa Indonesia,2025/2026,Ganjil,94,Sangat terampil membaca teks fiksi';
    const content = 'data:text/csv;charset=utf-8,' + [header, sampleRow1, sampleRow2].join('\n');
    const encodedUri = encodeURI(content);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'TEMPLATE_IMPORT_NILAI_RAPOR_SDN_LB04.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Execution
  const handleExecuteImport = () => {
    const validCount = previewItems.filter(i => i.status === 'valid').length;
    if (validCount === 0) {
      alert('Tidak ada data valid yang siap diimport!');
      return;
    }

    const result = importMassGrades(previewItems, overwriteExisting);
    setImportResult(result);
  };

  // Calculations for preview stats
  const totalRows = previewItems.length;
  const validRows = previewItems.filter(i => i.status === 'valid').length;
  const errorRows = previewItems.filter(i => i.status !== 'valid').length;
  const duplicateRows = previewItems.filter(i => i.isExisting).length;

  const displayList = previewItems.filter(i => {
    if (filterStatus === 'valid') return i.status === 'valid';
    if (filterStatus === 'error') return i.status !== 'valid';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-cream via-cream/95 to-amber-50 p-6 md:p-8 border border-amber-500/30 shadow-2xl overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 text-xs font-semibold uppercase tracking-wider">
              <FileSpreadsheet className="w-4 h-4 text-amber-700" />
              SISTEM IMPORT NILAI MASSAL E-RAPOR
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 font-serif-luxury tracking-wide">
              Sinkronisasi Massal Nilai Siswa 36 Rombel
            </h2>
            <p className="text-slate-700 text-sm max-w-2xl leading-relaxed">
              Export data dari sistem sumber → Upload Excel/CSV → Auto Matching NISN dengan Database → Validasi Status → Preview Data → Simpan Ribuan Nilai Sekaligus tanpa input manual satu per satu.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              id="btn-download-import-template"
              onClick={handleDownloadTemplate}
              className="px-4 py-2.5 rounded-xl bg-cream border border-amber-500/40 hover:border-amber-400 text-amber-700 text-xs font-semibold transition flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download Template Excel/CSV
            </button>
            <button
              id="btn-load-sample-file"
              onClick={handleLoadSampleFile}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 hover:scale-[1.02] transition flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4 text-slate-950" />
              Muat File Simulasi 36 Kelas
            </button>
          </div>
        </div>
      </div>

      {/* Upload Zone */}
      <div className="rounded-2xl bg-cream/80 border border-amber-500/20 p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-slate-900 font-serif-luxury flex items-center gap-2 pb-2 border-b border-slate-200">
          <Upload className="w-4 h-4 text-amber-700" />
          Langkah 1: Unggah Berkas Nilai (.XLSX atau .CSV)
        </h3>

        <div className="border-2 border-dashed border-slate-200 hover:border-amber-500/50 rounded-2xl p-6 text-center transition bg-cream/40">
          <input
            id="file-upload-excel"
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileUpload}
            className="hidden"
          />
          <label htmlFor="file-upload-excel" className="cursor-pointer flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-700">
              <Upload className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-slate-900">
              {uploadedFileName ? uploadedFileName : 'Klik atau Tarik File Excel / CSV ke Sini'}
            </div>
            <p className="text-xs text-slate-500 max-w-md">
              Sistem akan memindai NISN siswa, mencocokkan kelas rombel, mapel, dan melakukan verifikasi integritas data sebelum disimpan.
            </p>
          </label>
        </div>
      </div>

      {/* Preview Section if File Loaded */}
      {previewItems.length > 0 && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* Summary Box matching specification */}
          <div className="p-6 rounded-2xl bg-cream/90 border border-amber-500/30 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-serif-luxury flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-700" />
                  Langkah 2: Hasil Audit & Pencocokan Sistem
                </h3>
                <p className="text-xs text-slate-500">
                  Ringkasan validasi dari file: <span className="text-amber-700 font-mono">{uploadedFileName}</span>
                </p>
              </div>

              {/* Action Button: Import All Valid */}
              <div className="flex items-center gap-3">
                <button
                  id="btn-import-all-valid"
                  onClick={handleExecuteImport}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-600 text-slate-950 font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                  IMPORT {validRows} DATA VALID
                </button>
              </div>
            </div>

            {/* Metric Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] text-slate-500 uppercase font-semibold">TOTAL DATA</div>
                <div className="text-2xl font-extrabold text-slate-900 font-serif-luxury mt-1">{totalRows}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Baris dipindai</div>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-500/30">
                <div className="text-[11px] text-emerald-600 uppercase font-semibold">DATA COCOK</div>
                <div className="text-2xl font-extrabold text-emerald-600 font-serif-luxury mt-1">{validRows}</div>
                <div className="text-[10px] text-emerald-600/80 mt-0.5">Siap diimport</div>
              </div>

              <div className="p-4 rounded-xl bg-red-50 border border-red-500/30">
                <div className="text-[11px] text-red-600 uppercase font-semibold">DATA BERMASALAH</div>
                <div className="text-2xl font-extrabold text-red-600 font-serif-luxury mt-1">{errorRows}</div>
                <div className="text-[10px] text-red-600/80 mt-0.5">Dicegah masuk</div>
              </div>

              <div className="p-4 rounded-xl bg-amber-50 border border-amber-500/30">
                <div className="text-[11px] text-amber-700 uppercase font-semibold">DATA DUPLIKAT</div>
                <div className="text-2xl font-extrabold text-amber-700 font-serif-luxury mt-1">{duplicateRows}</div>
                <div className="text-[10px] text-amber-700/80 mt-0.5">Sudah ada di DB</div>
              </div>
            </div>

            {/* Overwrite or Skip Toggle */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>
                  Deteksi data lama: Jika nilai siswa untuk mapel dan semester ini sudah ada di sistem:
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setOverwriteExisting(true)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition ${overwriteExisting ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-500 hover:text-white'}`}
                >
                  Update Nilai Lama
                </button>
                <button
                  onClick={() => setOverwriteExisting(false)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition ${!overwriteExisting ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-500 hover:text-white'}`}
                >
                  Lewati
                </button>
              </div>
            </div>

            {/* Post Import Result Alert */}
            {importResult && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-500/40 text-emerald-800 text-xs space-y-2 animate-in fade-in">
                <div className="font-bold text-sm flex items-center gap-2 text-emerald-600">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  IMPORT MASSAL BERHASIL DILAKSANAKAN
                </div>
                <div className="flex items-center gap-6 font-mono text-xs">
                  <span>Data Berhasil: <strong className="text-slate-900">{importResult.imported}</strong></span>
                  <span>Data Diperbarui: <strong className="text-amber-700">{importResult.updated}</strong></span>
                  <span>Data Dilewati: <strong className="text-slate-500">{importResult.skipped}</strong></span>
                </div>
                <p className="text-[11px] text-emerald-600/80">
                  Log aktivitas telah dicatat secara permanen di audit trail sistem. Nilai langsung tersedia pada modul E-Rapor.
                </p>
              </div>
            )}
          </div>

          {/* Table Preview */}
          <div className="rounded-2xl bg-cream/80 border border-amber-500/20 shadow-xl overflow-hidden space-y-3 p-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="text-xs font-bold text-slate-900">Pratinjau Rincian Baris Data:</div>
              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={() => setFilterStatus('ALL')}
                  className={`px-2.5 py-1 rounded-lg ${filterStatus === 'ALL' ? 'bg-amber-500/20 text-amber-700 border border-amber-500/40 font-bold' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  Semua ({totalRows})
                </button>
                <button
                  onClick={() => setFilterStatus('valid')}
                  className={`px-2.5 py-1 rounded-lg ${filterStatus === 'valid' ? 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/40 font-bold' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  Cocok ({validRows})
                </button>
                <button
                  onClick={() => setFilterStatus('error')}
                  className={`px-2.5 py-1 rounded-lg ${filterStatus === 'error' ? 'bg-red-500/20 text-red-600 border border-red-500/40 font-bold' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  Bermasalah ({errorRows})
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold uppercase">
                    <th className="py-2.5 px-3">No</th>
                    <th className="py-2.5 px-3">NISN</th>
                    <th className="py-2.5 px-3">Nama Siswa</th>
                    <th className="py-2.5 px-3">Kelas</th>
                    <th className="py-2.5 px-3">Mata Pelajaran</th>
                    <th className="py-2.5 px-3 text-center">Nilai</th>
                    <th className="py-2.5 px-3">Status Validasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60">
                  {displayList.slice(0, 30).map((row, idx) => (
                    <tr key={idx} className={row.status !== 'valid' ? 'bg-red-50' : 'hover:bg-slate-100/40'}>
                      <td className="py-2.5 px-3 font-mono text-slate-500">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-amber-700">{row.nisn}</td>
                      <td className="py-2.5 px-3 text-slate-900 font-medium">{row.name}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">{row.classId}</td>
                      <td className="py-2.5 px-3 text-slate-800">{row.subject}</td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-amber-700">{row.finalScore}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-block border ${row.status === 'valid' ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30' : 'bg-red-500/15 text-red-600 border-red-500/30'}`}>
                          {row.statusMessage}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {displayList.length > 30 && (
              <div className="text-center py-2 text-[11px] text-slate-500 border-t border-slate-200">
                Menampilkan 30 baris pertama dari total {displayList.length} data.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
