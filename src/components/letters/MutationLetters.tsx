import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { ALL_36_CLASSES } from '../../data/initialData';
import { 
  FileText, Printer, Plus, CheckCircle2, 
  Send, Sparkles, X, QrCode 
} from 'lucide-react';

export const MutationLetters: React.FC = () => {
  const { students, schoolProfile, academicYear } = useSchool();

  const [selectedType, setSelectedType] = useState<'pindah_keluar' | 'aktif_belajar'>('pindah_keluar');
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || '');
  const [targetSchool, setTargetSchool] = useState('SD Negeri 01 Menteng Jakarta');
  const [mutationReason, setMutationReason] = useState('Mengikuti perpindahan tugas kedinasan orang tua.');
  const [letterNumber, setLetterNumber] = useState(`421.2/084/SDN-LB04/${new Date().getFullYear()}`);

  const currentStudent = students.find(s => s.id === selectedStudentId) || students[0];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="p-4 rounded-2xl bg-cream/80 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print shadow-xl">
        <div>
          <h2 className="text-base font-bold text-slate-900 font-serif-luxury flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-700" />
            Layanan Administrasi & Surat Keterangan Resmi
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Penerbitan Surat Mutasi Keluar/Masuk dan Surat Keterangan Siswa Aktif berstandar Dinas Pendidikan DKI.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as any)}
            className="py-1.5 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-amber-700 font-bold outline-none"
          >
            <option value="pindah_keluar">Surat Keterangan Pindah Sekolah (Mutasi)</option>
            <option value="aktif_belajar">Surat Keterangan Aktif Belajar</option>
          </select>

          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="py-1.5 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 outline-none max-w-[200px]"
          >
            {students.map(s => (
              <option key={s.id} value={s.id}>{s.name} (Kelas {s.classId})</option>
            ))}
          </select>

          <button
            id="btn-print-letter"
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-xs uppercase tracking-wider shadow-md hover:scale-[1.02] transition flex items-center gap-2"
          >
            <Printer className="w-4 h-4 text-slate-950" />
            Cetak Surat Resmi
          </button>
        </div>
      </div>

      {/* Editable metadata if Pindah */}
      {selectedType === 'pindah_keluar' && (
        <div className="p-4 rounded-2xl bg-cream/80 border border-amber-500/20 no-print grid grid-cols-1 sm:grid-cols-3 gap-3 shadow-lg text-xs">
          <div>
            <label className="block text-slate-500 mb-1">Nomor Surat:</label>
            <input
              type="text"
              value={letterNumber}
              onChange={(e) => setLetterNumber(e.target.value)}
              className="w-full p-2 rounded-xl bg-slate-50 border border-slate-200 text-amber-700 font-mono outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-500 mb-1">Nama Sekolah Tujuan:</label>
            <input
              type="text"
              value={targetSchool}
              onChange={(e) => setTargetSchool(e.target.value)}
              className="w-full p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-500 mb-1">Alasan Pindah:</label>
            <input
              type="text"
              value={mutationReason}
              onChange={(e) => setMutationReason(e.target.value)}
              className="w-full p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 outline-none"
            />
          </div>
        </div>
      )}

      {/* PRINTABLE OFFICIAL LETTER PAPER */}
      <div className="printable-rapor max-w-3xl mx-auto bg-white text-slate-950 p-10 sm:p-14 rounded-3xl shadow-2xl border border-slate-200 space-y-6 font-serif">
        {/* Official Kop Surat */}
        <div className="border-b-2 border-double border-cream pb-4 text-center">
          <div className="flex items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-full border border-slate-200 flex items-center justify-center p-1 shrink-0 overflow-hidden">
              {schoolProfile.logo ? (
                <img src={schoolProfile.logo} alt="Logo sekolah" className="w-full h-full object-contain" />
              ) : (
                <span className="font-serif-luxury font-black text-amber-600 text-xs text-center leading-none">
                  JAYA RAYA
                </span>
              )}
            </div>

            <div className="space-y-0.5 font-sans">
              <div className="text-[11px] tracking-widest font-semibold uppercase text-slate-700">
                Pemerintah Provinsi Daerah Khusus Ibukota Jakarta
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Suku Dinas Pendidikan Wilayah II Kota Administrasi Jakarta Timur
              </div>
              <h1 className="text-lg font-extrabold uppercase font-serif-luxury text-slate-950 tracking-wider">
                SD NEGERI LUBANG BUAYA 04 PAGI
              </h1>
              <p className="text-[10px] text-slate-400">
                {schoolProfile.address} • Telp: {schoolProfile.phone}
              </p>
              <p className="text-[9px] text-slate-500 font-mono">
                NPSN: {schoolProfile.npsn} • NSS: {schoolProfile.nss} • Akreditasi: {schoolProfile.accreditation}
              </p>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center pt-2 space-y-1">
          <h2 className="text-base font-bold uppercase underline tracking-wider">
            {selectedType === 'pindah_keluar' ? 'SURAT KETERANGAN PINDAH SEKOLAH' : 'SURAT KETERANGAN AKTIF BELAJAR'}
          </h2>
          <p className="text-xs font-mono text-slate-700">
            Nomor: {letterNumber}
          </p>
        </div>

        {/* Letter Body */}
        <div className="space-y-4 text-xs leading-relaxed font-sans text-slate-900">
          <p>
            Yang bertanda tangan di bawah ini, Kepala Sekolah Dasar Negeri Lubang Buaya 04 Pagi, Kecamatan Cipayung, Kota Administrasi Jakarta Timur, menerangkan dengan sesungguhnya bahwa:
          </p>

          {/* Student Identitas Table */}
          <div className="pl-6 space-y-1.5 py-2">
            <div className="flex">
              <span className="w-48 text-slate-700 font-medium">1. Nama Peserta Didik</span>
              <span className="font-bold">: {currentStudent?.name}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-slate-700 font-medium">2. Nomor Induk Siswa (NIS)</span>
              <span className="font-mono">: {currentStudent?.nis}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-slate-700 font-medium">3. NISN</span>
              <span className="font-mono font-bold">: {currentStudent?.nisn}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-slate-700 font-medium">4. Tempat, Tanggal Lahir</span>
              <span>: {currentStudent?.birthPlace}, {currentStudent?.birthDate}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-slate-700 font-medium">5. Jenis Kelamin</span>
              <span>: {currentStudent?.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-slate-700 font-medium">6. Tingkat / Kelas Terakhir</span>
              <span className="font-bold">: Kelas {currentStudent?.classId}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-slate-700 font-medium">7. Nama Orang Tua / Wali</span>
              <span>: {currentStudent?.parent.fatherName || currentStudent?.parent.motherName}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-slate-700 font-medium">8. Alamat Tempat Tinggal</span>
              <span>: {currentStudent?.address}</span>
            </div>
          </div>

          {selectedType === 'pindah_keluar' ? (
            <>
              <p>
                Sesuai dengan surat permohonan pindah sekolah dari orang tua/wali siswa tertanggal {new Date().toLocaleDateString('id-ID')}, yang bersangkutan telah resmi mengajukan pindah belajar ke:
              </p>
              <div className="pl-6 space-y-1 py-1 font-semibold text-slate-900">
                <div className="flex">
                  <span className="w-48 text-slate-700">Nama Sekolah Tujuan</span>
                  <span>: {targetSchool}</span>
                </div>
                <div className="flex">
                  <span className="w-48 text-slate-700">Alasan Pindah</span>
                  <span>: {mutationReason}</span>
                </div>
              </div>
              <p>
                Bersama surat keterangan ini kami lampirkan Buku Laporan Pendidikan (E-Rapor) asli siswa yang bersangkutan. Surat keterangan ini diterbitkan untuk dipergunakan sebagaimana mestinya.
              </p>
            </>
          ) : (
            <p>
              Menerangkan bahwa peserta didik tersebut di atas benar-benar tercatat aktif mengikuti kegiatan belajar mengajar pada Tahun Ajaran {academicYear} di SDN Lubang Buaya 04 Pagi dan berkelakuan baik. Surat keterangan ini dibuat untuk keperluan pengurusan administrasi beasiswa/keluarga.
            </p>
          )}
        </div>

        {/* Signature */}
        <div className="pt-8 flex justify-between items-end font-sans text-xs text-slate-900">
          <div className="flex flex-col items-center space-y-1">
            <div className="w-16 h-16 border border-slate-300 rounded p-1 flex items-center justify-center">
              <QrCode className="w-14 h-14 text-slate-800" />
            </div>
            <span className="text-[9px] font-mono text-slate-500">Otentikasi Digital TTE</span>
          </div>

          <div className="text-center space-y-14">
            <div>
              Jakarta, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br />
              <strong>Kepala SDN Lubang Buaya 04 Pagi</strong>
            </div>

            <div>
              <div className="font-bold underline text-sm">
                {schoolProfile.principal.name}
              </div>
              <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                NIP. {schoolProfile.principal.nip}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
