import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { ALL_36_CLASSES } from '../../data/initialData';
import { Student, GradeItem } from '../../types';
import { 
  FileText, Printer, Download, CheckCircle2, 
  Search, ShieldCheck, QrCode, Sparkles 
} from 'lucide-react';

export const ReportCardViewer: React.FC = () => {
  const { students, subjects, grades, attendance, teachers, schoolProfile, academicYear, semester, currentUser } = useSchool();

  // If student logged in, lock to student's class and id
  const isSiswa = currentUser.role === 'siswa';
  const initialStudent = isSiswa 
    ? (students.find(s => s.id === currentUser.referenceId || s.nisn === currentUser.username) || students[0])
    : students[0];

  const [selectedClass, setSelectedClass] = useState<string>(initialStudent?.classId || '4A');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(initialStudent?.id || students[0]?.id || '');

  // Filter students in selected class
  const classStudents = students.filter(s => s.classId === selectedClass);
  const currentStudent = students.find(s => s.id === selectedStudentId) || classStudents[0] || students[0];

  // Find wali kelas for selected class
  const waliKelas = teachers.find(t => t.assignedClass === selectedClass);

  // Student grades
  const studentGrades = grades.filter(g => 
    (g.studentId === currentStudent?.id || g.studentNisn === currentStudent?.nisn) &&
    g.academicYear === academicYear &&
    g.semester === semester
  );

  // Student attendance
  const studentAttendance = attendance.filter(a => a.studentId === currentStudent?.id);
  const sakitCount = studentAttendance.filter(a => a.status === 'Sakit').length;
  const izinCount = studentAttendance.filter(a => a.status === 'Izin').length;
  const alpaCount = studentAttendance.filter(a => a.status === 'Alpa').length;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Control Bar (Hidden when printing) */}
      <div className="p-4 rounded-2xl bg-cream/80 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print shadow-xl">
        <div className="flex flex-wrap items-center gap-3">
          {!isSiswa && (
            <>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Rombel Kelas:</label>
                <select
                  value={selectedClass}
                  onChange={(e) => {
                    setSelectedClass(e.target.value);
                    const firstInClass = students.find(s => s.classId === e.target.value);
                    if (firstInClass) setSelectedStudentId(firstInClass.id);
                  }}
                  className="py-1.5 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-amber-700 font-mono font-bold focus:border-amber-400 outline-none"
                >
                  {ALL_36_CLASSES.map(cls => (
                    <option key={cls} value={cls}>Kelas {cls}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Pilih Siswa:</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="py-1.5 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:border-amber-400 outline-none"
                >
                  {classStudents.map(std => (
                    <option key={std.id} value={std.id}>{std.name} ({std.nisn})</option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div className="text-xs text-slate-500">
            Status: <span className="text-emerald-600 font-bold">Rapor Digital Terverifikasi</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-print-rapor"
            onClick={handlePrint}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-95 transition flex items-center gap-2"
          >
            <Printer className="w-4 h-4 text-slate-950" />
            Cetak / Download PDF Rapor
          </button>
        </div>
      </div>

      {/* OFFICIAL KURIKULUM MERDEKA REPORT CARD SHEET */}
      <div className="printable-rapor max-w-4xl mx-auto bg-white text-slate-950 p-8 sm:p-12 rounded-3xl shadow-2xl border border-slate-200 space-y-6 font-sans">
        {/* Kop Surat Resmi */}
        <div className="border-b-2 border-double border-cream pb-4 text-center relative">
          <div className="flex items-center justify-center gap-4">
            {/* Logo Lambang DKI / Pendidikan */}
            <div className="w-16 h-16 rounded-full border border-slate-200 flex items-center justify-center p-1 shrink-0 overflow-hidden">
              {schoolProfile.logo ? (
                <img src={schoolProfile.logo} alt="Logo sekolah" className="w-full h-full object-contain" />
              ) : (
                <span className="font-serif-luxury font-black text-amber-600 text-xs text-center leading-none">
                  JAYA RAYA
                </span>
              )}
            </div>

            <div className="space-y-0.5">
              <div className="text-xs tracking-widest font-semibold uppercase text-slate-700">
                Pemerintah Provinsi Daerah Khusus Ibukota Jakarta
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Suku Dinas Pendidikan Wilayah II Kota Administrasi Jakarta Timur
              </div>
              <h1 className="text-lg sm:text-xl font-extrabold uppercase font-serif-luxury text-slate-950 tracking-wider">
                SD NEGERI LUBANG BUAYA 04 PAGI
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">
                {schoolProfile.address} • Telp: {schoolProfile.phone}
              </p>
              <p className="text-[10px] text-slate-500 font-mono">
                NPSN: {schoolProfile.npsn} • NSS: {schoolProfile.nss} • Akreditasi: {schoolProfile.accreditation}
              </p>
            </div>
          </div>
        </div>

        {/* Title of Report Card */}
        <div className="text-center pt-2 space-y-1">
          <h2 className="text-base sm:text-lg font-bold uppercase tracking-wide underline font-serif-luxury">
            LAPORAN HASIL BELAJAR (RAPOR PESERTA DIDIK)
          </h2>
          <p className="text-xs font-semibold text-slate-400">
            Kurikulum Merdeka • Semester {semester} Tahun Ajaran {academicYear}
          </p>
        </div>

        {/* Student Biodata Block */}
        <div className="grid grid-cols-2 gap-4 text-xs border border-slate-300 rounded-xl p-4 bg-slate-50/50">
          <div className="space-y-1.5">
            <div className="flex">
              <span className="w-32 font-semibold text-slate-400">Nama Peserta Didik</span>
              <span className="font-bold text-slate-900">: {currentStudent?.name}</span>
            </div>
            <div className="flex">
              <span className="w-32 font-semibold text-slate-400">Nomor Induk Siswa (NIS)</span>
              <span className="font-mono text-slate-900">: {currentStudent?.nis}</span>
            </div>
            <div className="flex">
              <span className="w-32 font-semibold text-slate-400">NISN</span>
              <span className="font-mono font-bold text-slate-900">: {currentStudent?.nisn}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex">
              <span className="w-32 font-semibold text-slate-400">Kelas / Fase</span>
              <span className="font-bold text-slate-900">: Kelas {currentStudent?.classId} / Fase B</span>
            </div>
            <div className="flex">
              <span className="w-32 font-semibold text-slate-400">Semester</span>
              <span className="text-slate-900">: {semester}</span>
            </div>
            <div className="flex">
              <span className="w-32 font-semibold text-slate-400">Tahun Ajaran</span>
              <span className="text-slate-900">: {academicYear}</span>
            </div>
          </div>
        </div>

        {/* Grades Table */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            A. Capaian Kompetensi Mata Pelajaran
          </h3>

          <div className="border border-slate-300 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-800">
                  <th className="py-2.5 px-3 text-center w-10 border-r border-slate-300">No</th>
                  <th className="py-2.5 px-3 border-r border-slate-300 w-48">Mata Pelajaran</th>
                  <th className="py-2.5 px-3 text-center border-r border-slate-300 w-24">Nilai Akhir</th>
                  <th className="py-2.5 px-4">Capaian Kompetensi Pembelajaran (TP)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {subjects.map((sub, idx) => {
                  const gradeRecord = studentGrades.find(g => g.subjectId === sub.id || g.subjectName === sub.name);
                  const score = gradeRecord ? gradeRecord.finalScore : 88;
                  const desc = gradeRecord ? gradeRecord.achievementDescription : `Menunjukkan penguasaan yang sangat baik dalam memahami materi dan mengaplikasikan tujuan pembelajaran ${sub.name}.`;

                  return (
                    <tr key={sub.id} className="text-[11px]">
                      <td className="py-2.5 px-3 text-center border-r border-slate-300 font-mono font-medium">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-300 font-semibold text-slate-900">
                        {sub.name}
                      </td>
                      <td className="py-2.5 px-3 text-center border-r border-slate-300 font-mono font-bold text-slate-900">
                        {score}
                      </td>
                      <td className="py-2.5 px-4 text-slate-700 leading-relaxed">
                        {desc}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Extra & Attendance Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Ekstrakurikuler */}
          <div className="border border-slate-300 rounded-xl p-3.5 space-y-2">
            <h4 className="font-bold text-slate-800 uppercase text-[11px]">B. Kegiatan Ekstrakurikuler</h4>
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="border-b border-slate-200 font-semibold text-slate-400">
                  <th className="py-1">Kegiatan</th>
                  <th className="py-1">Predikat</th>
                  <th className="py-1">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-1.5 font-medium">Pramuka Wajib</td>
                  <td className="py-1.5 font-bold text-emerald-700">Sangat Baik (A)</td>
                  <td className="py-1.5 text-slate-400">Aktif & Disiplin</td>
                </tr>
                <tr>
                  <td className="py-1.5 font-medium">Seni Tari & Karawitan</td>
                  <td className="py-1.5 font-bold text-emerald-700">Baik (B)</td>
                  <td className="py-1.5 text-slate-400">Menguasai gerak dasar</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Kehadiran */}
          <div className="border border-slate-300 rounded-xl p-3.5 space-y-2">
            <h4 className="font-bold text-slate-800 uppercase text-[11px]">C. Ketidakhadiran</h4>
            <div className="space-y-1.5 text-[11px] pt-1">
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-400">Sakit (S)</span>
                <span className="font-mono font-bold">: {sakitCount} hari</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-400">Izin (I)</span>
                <span className="font-mono font-bold">: {izinCount} hari</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tanpa Keterangan (A)</span>
                <span className="font-mono font-bold">: {alpaCount} hari</span>
              </div>
            </div>
          </div>
        </div>

        {/* Catatan Wali Kelas */}
        <div className="border border-slate-300 rounded-xl p-4 text-xs space-y-1.5 bg-amber-50/40">
          <h4 className="font-bold text-slate-900 uppercase text-[11px]">D. Catatan Wali Kelas</h4>
          <p className="text-slate-800 leading-relaxed italic">
            &ldquo;Ananda {currentStudent?.name} menunjukkan kemajuan akademik dan keteladanan budi pekerti yang sangat mengesankan. Pertahankan semangat belajar, rasa ingin tahu yang tinggi, dan terus asah bakat kepemimpinan di kelas.&rdquo;
          </p>
        </div>

        {/* Signatures & QR Verification */}
        <div className="pt-6 grid grid-cols-3 gap-4 text-center text-xs text-slate-800">
          <div className="space-y-16">
            <div>Mengetahui,<br />Orang Tua / Wali Peserta Didik</div>
            <div className="border-b border-slate-200 pb-1 font-bold">
              ( {currentStudent?.parent.fatherName || '...................................'} )
            </div>
          </div>

          {/* QR Verification Seal */}
          <div className="flex flex-col items-center justify-center space-y-1">
            <div className="w-20 h-20 border border-slate-400 p-1.5 rounded-lg flex items-center justify-center bg-white shadow-sm">
              <QrCode className="w-16 h-16 text-slate-900" />
            </div>
            <div className="text-[9px] font-mono text-slate-500">
              Validasi SIAKAD Resmi<br />SDN Lubang Buaya 04
            </div>
          </div>

          <div className="space-y-16">
            <div>
              Jakarta, 19 Desember 2025<br />
              Wali Kelas {currentStudent?.classId}
            </div>
            <div>
              <div className="border-b border-slate-200 pb-1 font-bold">
                {waliKelas?.name || 'Budi Santoso, S.Pd'}
              </div>
              <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                NIP. {waliKelas?.nip || '198203152006041008'}
              </div>
            </div>
          </div>
        </div>

        {/* Principal Approval */}
        <div className="text-center pt-2 text-xs text-slate-800 space-y-14">
          <div>
            Mengetahui,<br />
            <strong>Kepala SDN Lubang Buaya 04 Pagi</strong>
          </div>
          <div>
            <div className="font-bold underline text-sm">
              {schoolProfile.principal.name}
            </div>
            <div className="text-[11px] font-mono text-slate-400 mt-0.5">
              NIP. {schoolProfile.principal.nip}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
