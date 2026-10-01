import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { ALL_36_CLASSES } from '../../data/initialData';
import { LuxuryCrest } from '../common/LuxuryCrest';
import { 
  CreditCard, Printer, QrCode, Sparkles, Filter, 
  PenTool, Upload, CheckCircle2, User, Camera, ShieldCheck,
  Download, Loader2
} from 'lucide-react';
import { Student } from '../../types';
import { DigitalSignatureModal } from './DigitalSignatureModal';
import { downloadSingleCardPdf, downloadAllCardsPdf } from '../../utils/cardPdfExport';

export const StudentIdCards: React.FC = () => {
  const { students, schoolProfile, currentUser, updateStudent } = useSchool();

  const isSiswa = currentUser.role === 'siswa';
  const initialClass = isSiswa ? (students.find(s => s.id === currentUser.referenceId)?.classId || '4A') : '4A';

  const [selectedClass, setSelectedClass] = useState(initialClass);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('ALL');
  
  // Signature modal state
  const [signingStudent, setSigningStudent] = useState<Student | null>(null);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string>('');

  // PDF Export States
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [isBatchDownloading, setIsBatchDownloading] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);

  const classStudents = students.filter(s => s.classId === selectedClass);
  const displayedStudents = isSiswa
    ? students.filter(s => s.id === currentUser.referenceId || s.nisn === currentUser.username)
    : selectedStudentId === 'ALL'
      ? classStudents
      : classStudents.filter(s => s.id === selectedStudentId);

  const handlePrint = () => {
    window.print();
  };

  // Handle Single Card PDF Download
  const handleDownloadSinglePdf = async (student: Student) => {
    try {
      setDownloadingId(student.id);
      await downloadSingleCardPdf(`card-student-${student.id}`, student.name, student.nisn);
      setUploadSuccessMsg(`Kartu Pelajar PDF untuk ${student.name} berhasil diunduh!`);
      setTimeout(() => setUploadSuccessMsg(''), 4000);
    } catch (err: any) {
      alert('Gagal mendownload PDF kartu: ' + (err.message || err));
    } finally {
      setDownloadingId(null);
    }
  };

  // Handle Download All Displayed Cards as PDF
  const handleDownloadAllPdf = async () => {
    if (displayedStudents.length === 0) return;
    try {
      setIsBatchDownloading(true);
      setBatchProgress({ current: 1, total: displayedStudents.length });
      await downloadAllCardsPdf(displayedStudents, (current, total) => {
        setBatchProgress({ current, total });
      });
      setUploadSuccessMsg(`Berhasil mengunduh dokumen PDF ${displayedStudents.length} kartu pelajar!`);
      setTimeout(() => setUploadSuccessMsg(''), 4000);
    } catch (err: any) {
      alert('Gagal mendownload batch PDF kartu: ' + (err.message || err));
    } finally {
      setIsBatchDownloading(false);
      setBatchProgress(null);
    }
  };

  // Handle Photo Upload directly for a student
  const handlePhotoUpload = (studentId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      updateStudent(studentId, { photo: dataUrl });
      setUploadSuccessMsg('Foto pelajar berhasil diperbarui!');
      setTimeout(() => setUploadSuccessMsg(''), 3500);
    };
    reader.readAsDataURL(file);
  };

  // Handle Save Digital Signature
  const handleSaveSignature = (signatureDataUrl: string) => {
    if (!signingStudent) return;
    updateStudent(signingStudent.id, { signature: signatureDataUrl });
    setUploadSuccessMsg(`Tanda tangan digital untuk ${signingStudent.name} berhasil disimpan ke kartu!`);
    setTimeout(() => setUploadSuccessMsg(''), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {uploadSuccessMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-600 text-xs flex items-center gap-2.5 animate-in fade-in no-print shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{uploadSuccessMsg}</span>
        </div>
      )}

      {/* Controls & Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-cream/90 border border-amber-500/30 flex flex-col lg:flex-row lg:items-center justify-between gap-4 no-print shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-700 shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 font-serif-luxury flex items-center gap-2">
              Kartu Tanda Pelajar Digital & Cetak (ID Card)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Identitas resmi peserta didik dilengkapi foto otomatis, barcode NISN, dan tanda tangan digital.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {!isSiswa && (
            <>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 font-medium">Kelas:</span>
                <select
                  value={selectedClass}
                  onChange={(e) => {
                    setSelectedClass(e.target.value);
                    setSelectedStudentId('ALL');
                  }}
                  className="py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-amber-700 font-mono font-bold focus:border-amber-400 outline-none cursor-pointer"
                >
                  {ALL_36_CLASSES.map(cls => (
                    <option key={cls} value={cls}>Kelas {cls}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 font-medium">Siswa:</span>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:border-amber-400 outline-none max-w-[200px] cursor-pointer"
                >
                  <option value="ALL">Semua di Kelas {selectedClass} ({classStudents.length})</option>
                  {classStudents.map(std => (
                    <option key={std.id} value={std.id}>{std.name}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          <button
            id="btn-download-all-pdf"
            onClick={handleDownloadAllPdf}
            disabled={isBatchDownloading || displayedStudents.length === 0}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-amber-500/40 text-amber-700 hover:text-amber-800 font-bold text-xs uppercase tracking-wider shadow transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            title="Download semua kartu yang ditampilkan dalam 1 berkas PDF"
          >
            {isBatchDownloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-amber-700" />
                <span>PDF ({batchProgress?.current}/{batchProgress?.total})</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-amber-700" />
                <span>Download PDF ({displayedStudents.length})</span>
              </>
            )}
          </button>

          <button
            id="btn-print-cards"
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-[0.98] transition flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-950" />
            <span>Cetak Kartu</span>
          </button>
        </div>
      </div>

      {/* Helper Banner for Student Account */}
      {isSiswa && displayedStudents.length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-700 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Akun Pelajar Anda Terverifikasi</div>
              <div className="text-[11px] text-slate-500">
                Foto profil akun otomatis tampil pada kartu pelajar resmi Anda di bawah ini. Anda dapat memperbarui foto atau membubuhkan tanda tangan digital Anda kapan saja.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setSigningStudent(displayedStudents[0])}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 border border-amber-500/40 font-semibold text-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>{displayedStudents[0].signature ? 'Ubah TTD Digital' : 'Buat TTD Digital'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Cards Display Grid (Print friendly) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto printable-card">
        {displayedStudents.map((std) => (
          <div key={std.id} className="space-y-2">
            {/* Front of ID Card */}
            <div
              id={`card-student-${std.id}`}
              className="relative w-full aspect-[1.586/1] max-w-[500px] mx-auto rounded-2xl bg-gradient-to-br from-slate-50 via-cream to-slate-50 p-[2px] shadow-2xl border border-amber-500/40 overflow-hidden flex flex-col justify-between"
            >
              {/* Top Gold Ribbon Banner */}
              <div className="bg-gradient-to-r from-amber-600 via-amber-400 to-yellow-200 p-2.5 px-4 flex items-center justify-between text-white shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center p-1 shadow">
                    <span className="font-serif-luxury font-black text-amber-700 text-[10px]">04</span>
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-wider font-serif-luxury leading-tight">
                      {schoolProfile.name}
                    </div>
                    <div className="text-[8px] font-semibold text-slate-900 tracking-tight">
                      JAKARTA TIMUR • NPSN {schoolProfile.npsn}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[8px] font-black uppercase tracking-widest bg-slate-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-400/40">
                    KARTU PELAJAR
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-3.5 sm:p-4 flex-1 flex items-center gap-3.5 sm:gap-4 text-slate-900">
                {/* 3x4 Photo Container */}
                <div className="w-24 sm:w-26 h-32 rounded-xl bg-gradient-to-b from-amber-500/40 via-amber-500/20 to-amber-100 p-[1.5px] shrink-0 shadow-lg relative group">
                  <div className="w-full h-full rounded-[10px] bg-slate-50 flex flex-col items-center justify-center relative overflow-hidden">
                    {std.photo ? (
                      <img 
                        src={std.photo} 
                        alt={std.name} 
                        className="w-full h-full object-cover rounded-[10px]"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center p-2">
                        <div className="w-14 h-14 rounded-full bg-slate-100 border border-amber-500/30 flex items-center justify-center text-xl font-bold text-amber-700 font-serif-luxury">
                          {std.name.charAt(0)}
                        </div>
                        <span className="text-[9px] text-amber-700 font-mono mt-1 font-semibold">FOTO 3X4</span>
                      </div>
                    )}

                    {/* Quick photo upload hover trigger */}
                    <label 
                      className="absolute inset-0 bg-cream/75 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-1 cursor-pointer no-print text-[10px] text-amber-700 font-semibold"
                      title="Ganti Foto Pelajar"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Ubah Foto</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => handlePhotoUpload(std.id, e)} 
                      />
                    </label>
                  </div>
                </div>

                {/* Data Fields & Signatures */}
                <div className="flex-1 min-w-0 space-y-1 text-xs">
                  <div>
                    <div className="text-[8px] uppercase tracking-wider text-amber-700/90 font-bold">Nama Lengkap</div>
                    <div className="font-bold text-slate-900 text-xs sm:text-sm truncate font-serif-luxury leading-tight">
                      {std.name}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    <div>
                      <div className="text-[8px] text-slate-500">NISN</div>
                      <div className="font-mono font-bold text-amber-700 text-[11px]">{std.nisn}</div>
                    </div>
                    <div>
                      <div className="text-[8px] text-slate-500">NIS</div>
                      <div className="font-mono text-slate-800 text-[11px]">{std.nis}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-[8px] text-slate-500">Rombongan Belajar</div>
                      <div className="font-bold text-slate-900 font-mono text-[11px]">Kelas {std.classId}</div>
                    </div>
                    <div>
                      <div className="text-[8px] text-slate-500">Tahun Masuk</div>
                      <div className="text-slate-800 text-[11px]">{std.admissionYear}</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-[8px] text-slate-500">Tempat, Tanggal Lahir</div>
                    <div className="text-[10px] text-slate-700 truncate">
                      {std.birthPlace}, {std.birthDate}
                    </div>
                  </div>

                  {/* Student Signature & Verification Section inside the card */}
                  <div className="pt-1 flex items-end justify-between border-t border-slate-200/80 mt-1">
                    <div>
                      <div className="text-[7.5px] uppercase tracking-wider text-slate-500 font-semibold mb-0.5">
                        Tanda Tangan Pelajar:
                      </div>
                      <div 
                        onClick={() => setSigningStudent(std)}
                        className="h-8 w-24 bg-white/95 rounded-lg border border-amber-500/30 flex items-center justify-center cursor-pointer overflow-hidden p-0.5 shadow-inner"
                        title="Klik untuk ubah tanda tangan digital"
                      >
                        {std.signature ? (
                          <img 
                            src={std.signature} 
                            alt={`TTD ${std.name}`} 
                            className="h-full w-full object-contain" 
                          />
                        ) : (
                          <span className="text-[8px] text-slate-500 italic">Klik untuk TTD</span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[7.5px] text-slate-500 leading-tight">Kepala Sekolah,</div>
                      <div className="font-serif italic text-amber-700 font-bold text-[9px] leading-tight mt-0.5">
                        {schoolProfile.principal.name}
                      </div>
                      <div className="text-[7.5px] text-slate-500 font-mono">
                        NIP. {schoolProfile.principal.nip}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Gold-accented Barcode Bar */}
              <div className="bg-slate-50 border-t border-amber-500/20 px-4 py-1.5 flex items-center justify-between text-[8px] text-slate-500">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-24 bg-gradient-to-r from-white via-slate-300 to-white rounded flex items-center justify-center font-mono text-[7.5px] text-black font-black tracking-widest shadow-sm">
                    |||||||||||||||||||
                  </div>
                  <span className="font-mono text-[9px] text-amber-700 font-bold">{std.nisn}</span>
                </div>

                <div className="flex items-center gap-1.5 text-slate-500 text-[8px]">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>RESMI DINAS DIKDAS DKI</span>
                </div>
              </div>
            </div>

            {/* Action buttons under each card (No print) */}
            <div className="flex flex-wrap items-center justify-center gap-2 no-print pt-1">
              <button
                type="button"
                id={`btn-download-pdf-${std.id}`}
                onClick={() => handleDownloadSinglePdf(std)}
                disabled={downloadingId === std.id}
                className="px-3 py-1.5 rounded-xl bg-cream border border-slate-200 hover:border-amber-500/40 text-slate-700 hover:text-amber-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm disabled:opacity-50"
                title="Unduh kartu ini dalam format PDF (Ukuran Standar ID Card)"
              >
                {downloadingId === std.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-700" />
                ) : (
                  <Download className="w-3.5 h-3.5 text-amber-700" />
                )}
                <span>{downloadingId === std.id ? 'Membuat PDF...' : 'Download PDF'}</span>
              </button>

              <label className="px-3 py-1.5 rounded-xl bg-cream border border-slate-200 hover:border-amber-500/40 text-slate-700 hover:text-amber-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm">
                <Upload className="w-3.5 h-3.5 text-amber-700" />
                <span>{std.photo ? 'Ganti Foto' : 'Unggah Foto'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handlePhotoUpload(std.id, e)}
                />
              </label>

              <button
                type="button"
                onClick={() => setSigningStudent(std)}
                className="px-3 py-1.5 rounded-xl bg-cream border border-slate-200 hover:border-amber-500/40 text-slate-700 hover:text-amber-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
              >
                <PenTool className="w-3.5 h-3.5 text-amber-700" />
                <span>{std.signature ? 'Ubah Tanda Tangan' : 'Tanda Tangan Digital'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Digital Signature Drawing Modal */}
      {signingStudent && (
        <DigitalSignatureModal
          isOpen={Boolean(signingStudent)}
          studentName={signingStudent.name}
          initialSignature={signingStudent.signature}
          onClose={() => setSigningStudent(null)}
          onSave={handleSaveSignature}
        />
      )}
    </div>
  );
};
