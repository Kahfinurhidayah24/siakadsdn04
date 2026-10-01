import React, { useState, useRef } from 'react';
import { 
  X, FileSpreadsheet, Download, Upload, CheckCircle2, 
  AlertTriangle, ArrowRight, RefreshCw, FileText, Check 
} from 'lucide-react';
import { 
  downloadStudentExcelTemplate, 
  parseStudentExcelFile, 
  ParsedExcelStudent 
} from '../../utils/excelStudentImport';
import { useSchool } from '../../context/SchoolContext';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { addBatchStudents, students: existingStudents } = useSchool();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedExcelStudent[]>([]);
  const [validCount, setValidCount] = useState(0);
  const [invalidCount, setInvalidCount] = useState(0);
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successResult, setSuccessResult] = useState<{ added: number; updated: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setErrorMsg('');
    setSuccessResult(null);
    setFile(selectedFile);
    setIsParsing(true);

    try {
      const result = await parseStudentExcelFile(selectedFile);
      setParsedData(result.students);
      setValidCount(result.validCount);
      setInvalidCount(result.invalidCount);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal membaca isi file Excel. Pastikan format sesuai.');
      setFile(null);
      setParsedData([]);
    } finally {
      setIsParsing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile) return;

    setErrorMsg('');
    setSuccessResult(null);
    setFile(droppedFile);
    setIsParsing(true);

    try {
      const result = await parseStudentExcelFile(droppedFile);
      setParsedData(result.students);
      setValidCount(result.validCount);
      setInvalidCount(result.invalidCount);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal membaca file Excel.');
      setFile(null);
      setParsedData([]);
    } finally {
      setIsParsing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setParsedData([]);
    setErrorMsg('');
    setSuccessResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExecuteImport = () => {
    const validOnly = parsedData.filter(s => s.isValid);
    if (validOnly.length === 0) {
      setErrorMsg('Tidak ada baris data valid yang dapat di-import.');
      return;
    }

    setIsProcessing(true);
    try {
      // Siapkan payload siswa
      const studentsToImport = validOnly.map(item => ({
        nisn: item.nisn,
        nis: item.nis || `${item.admissionYear.slice(-2)}04${Math.floor(100 + Math.random() * 900)}`,
        name: item.name,
        gender: item.gender,
        classId: item.classId,
        birthPlace: item.birthPlace,
        birthDate: item.birthDate,
        religion: item.religion,
        address: item.address,
        phone: item.phone,
        email: `${item.nisn}@siswa.sdnlubangbuaya04.sch.id`,
        admissionYear: item.admissionYear,
        status: item.status,
        parent: item.parent
      }));

      const res = addBatchStudents(studentsToImport, overwriteExisting);
      setSuccessResult(res);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMsg('Gagal memproses import data: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-cream/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-cream border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header Modal */}
        <div className="p-5 bg-gradient-to-r from-amber-500/15 via-cream to-cream border-b border-amber-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-700 shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-serif-luxury flex items-center gap-2">
                Import Data Siswa dari File Excel (.xlsx / .csv)
              </h3>
              <p className="text-xs text-slate-500">
                Unggah data ratusan siswa sekaligus ke sistem SIAKAD SDN Lubang Buaya 04 Pagi tanpa input manual.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-900 rounded-xl bg-slate-100/80 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Step 1: Download Template */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-700 shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-slate-900 text-xs">Format Standar Excel</div>
                <div className="text-[11px] text-slate-500">
                  Gunakan format kolom resmi agar seluruh data profil, NISN, rombel kelas, dan data orang tua terbaca presisi.
                </div>
              </div>
            </div>
            <button
              onClick={downloadStudentExcelTemplate}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-bold text-xs transition flex items-center gap-2 shrink-0 cursor-pointer shadow"
            >
              <Download className="w-4 h-4 text-slate-950" />
              <span>Download Template Excel (.xlsx)</span>
            </button>
          </div>

          {/* Success Result Banner */}
          {successResult && (
            <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-600 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-bold text-sm text-emerald-800">
                    Import Data Berhasil!
                  </div>
                  <div className="text-xs text-emerald-600 mt-0.5">
                    {successResult.added} siswa baru berhasil ditambahkan
                    {successResult.updated > 0 && `, ${successResult.updated} data siswa diperbarui`}.
                    Akun login otomatis di-generate untuk masing-masing NISN.
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition cursor-pointer"
              >
                Selesai
              </button>
            </div>
          )}

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-600 text-xs flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Upload Area */}
          {!parsedData.length && !successResult && (
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-amber-500/50 rounded-2xl p-8 text-center cursor-pointer transition bg-cream/40 hover:bg-cream/70 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 group-hover:bg-amber-500/20 text-slate-500 group-hover:text-amber-700 flex items-center justify-center transition border border-slate-300 group-hover:border-amber-500/30 mb-3">
                <Upload className="w-6 h-6" />
              </div>
              <div className="text-sm font-semibold text-slate-900">
                Klik atau Tarik File Excel ke Sini
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Mendukung file berekstensi <span className="text-amber-700 font-mono">.xlsx</span>, <span className="text-amber-700 font-mono">.xls</span>, atau <span className="text-amber-700 font-mono">.csv</span>
              </div>
            </div>
          )}

          {/* Parsing Loading */}
          {isParsing && (
            <div className="py-8 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-6 h-6 text-amber-700 animate-spin" />
              <span>Membaca data file Excel...</span>
            </div>
          )}

          {/* Data Preview Table */}
          {parsedData.length > 0 && !successResult && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-slate-900">File: {file?.name}</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 font-bold text-[11px] border border-emerald-500/30">
                    {validCount} Valid
                  </span>
                  {invalidCount > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-600 font-bold text-[11px] border border-rose-500/30">
                      {invalidCount} Bermasalah
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-slate-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={overwriteExisting}
                      onChange={(e) => setOverwriteExisting(e.target.checked)}
                      className="rounded border-slate-300 text-amber-500 focus:ring-amber-400"
                    />
                    <span className="text-[11px]">Timpa data jika NISN sudah ada</span>
                  </label>
                  <button
                    onClick={handleReset}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition ml-2"
                    title="Ganti File"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Preview List */}
              <div className="rounded-2xl border border-slate-200 overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-50 text-slate-500 sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Baris</th>
                      <th className="p-2.5">NISN</th>
                      <th className="p-2.5">Nama Siswa</th>
                      <th className="p-2.5">JK</th>
                      <th className="p-2.5">Kelas</th>
                      <th className="p-2.5">Tgl Lahir</th>
                      <th className="p-2.5">Nama Ayah</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60 bg-cream/60 text-slate-700">
                    {parsedData.slice(0, 15).map((item, idx) => (
                      <tr key={idx} className={item.isValid ? 'hover:bg-slate-100/40' : 'bg-rose-50 text-rose-600'}>
                        <td className="p-2.5 font-mono text-slate-500">{item.rowNumber}</td>
                        <td className="p-2.5 font-mono font-bold text-amber-700">{item.nisn}</td>
                        <td className="p-2.5 font-medium text-slate-900">{item.name}</td>
                        <td className="p-2.5">{item.gender}</td>
                        <td className="p-2.5 font-bold text-slate-800">Kelas {item.classId}</td>
                        <td className="p-2.5 text-slate-500">{item.birthDate}</td>
                        <td className="p-2.5 text-slate-500">{item.parent.fatherName || '-'}</td>
                        <td className="p-2.5">
                          {item.isValid ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                              <Check className="w-3 h-3" /> Siap
                            </span>
                          ) : (
                            <span className="text-rose-600" title={item.validationError}>
                              {item.validationError}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedData.length > 15 && (
                <div className="text-[11px] text-slate-500 text-center italic">
                  Menampilkan 15 dari total {parsedData.length} baris data siswa yang terbaca...
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
          >
            Tutup
          </button>

          {parsedData.length > 0 && !successResult && (
            <button
              onClick={handleExecuteImport}
              disabled={validCount === 0 || isProcessing}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 active:scale-95 transition flex items-center gap-2 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                  <span>Import {validCount} Siswa ke Sistem</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
