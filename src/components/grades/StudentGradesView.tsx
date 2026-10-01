import React from 'react';
import { useSchool } from '../../context/SchoolContext';
import { 
  Award, BookOpen, CheckCircle2, AlertCircle, 
  Sparkles, ShieldCheck, Info, FileText
} from 'lucide-react';

interface StudentGradesViewProps {
  onNavigateToRapor?: () => void;
}

export const StudentGradesView: React.FC<StudentGradesViewProps> = ({ onNavigateToRapor }) => {
  const { currentUser, students, subjects, grades, academicYear, semester } = useSchool();

  // Cari data profil siswa yang login
  const student = students.find(
    s => s.id === currentUser.referenceId || s.nisn === currentUser.username
  ) || students[0];

  // Ambil nilai-nilai siswa ini
  const myGrades = grades.filter(
    g => (g.studentNisn === student.nisn || g.studentId === student.id) &&
         g.academicYear === academicYear &&
         g.semester === semester
  );

  // Gabungkan dengan daftar mata pelajaran agar terlihat mapel mana saja yang sudah dinilai
  const subjectGrades = subjects.map(sub => {
    const gradeItem = myGrades.find(g => g.subjectId === sub.id);
    return {
      subject: sub,
      grade: gradeItem
    };
  });

  const gradedCount = subjectGrades.filter(sg => sg.grade !== undefined).length;
  const averageFinalScore = gradedCount > 0
    ? Math.round(
        subjectGrades
          .filter(sg => sg.grade)
          .reduce((acc, curr) => acc + (curr.grade?.finalScore || 0), 0) / gradedCount
      )
    : 0;

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header Siswa - Read Only */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-amber-500/20">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-600 text-[11px] font-semibold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            Laporan Capaian Belajar Mandiri
          </div>
          <h2 className="text-xl font-bold text-slate-900 font-serif-luxury flex items-center gap-2.5">
            <Award className="w-6 h-6 text-amber-700" />
            Nilai Akademik & Capaian Pembelajaran (TP)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Penilaian resmi semester {semester} tahun ajaran {academicYear} yang diterbitkan Dewan Guru.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onNavigateToRapor && (
            <button
              onClick={onNavigateToRapor}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-bold text-xs uppercase tracking-wider shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              <FileText className="w-4 h-4 text-slate-950" />
              Lihat Format E-Rapor
            </button>
          )}
        </div>
      </div>

      {/* Info Box Read-Only Proteksi */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-700 space-y-1">
          <span className="font-bold text-amber-700">Hak Akses Siswa Terproteksi: </span>
          Nilai akademik hanya dapat diinput, diedit, dan dikunci oleh Guru Mata Pelajaran, Wali Kelas, dan Kepala Sekolah. Siswa hanya dapat melihat hasil asesmen formatif, UTS, UAS, nilai akhir, serta deskripsi capaian pembelajaran.
        </div>
      </div>

      {/* Rangkuman Rata-Rata */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-cream/80 border border-amber-500/30 shadow-xl">
          <div className="text-xs text-slate-500 flex items-center justify-between">
            <span>Rata-Rata Nilai Akhir</span>
            <Sparkles className="w-4 h-4 text-amber-700" />
          </div>
          <div className="text-3xl font-extrabold text-amber-700 font-serif-luxury mt-2">
            {averageFinalScore > 0 ? averageFinalScore : '-'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {averageFinalScore >= 85 ? 'Predikat A (Sangat Baik)' : averageFinalScore >= 75 ? 'Predikat B (Baik)' : 'Perlu Bimbingan'}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-cream/80 border border-slate-200 shadow-xl">
          <div className="text-xs text-slate-500 flex items-center justify-between">
            <span>Mata Pelajaran Tuntas</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-serif-luxury mt-2">
            {subjectGrades.filter(sg => (sg.grade?.finalScore || 0) >= sg.subject.kkm).length} / {subjects.length}
          </div>
          <div className="text-[11px] text-emerald-600 mt-1">
            Standar Kriteria Ketuntasan Minimal (KKM) terpenuhi
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-cream/80 border border-slate-200 shadow-xl">
          <div className="text-xs text-slate-500 flex items-center justify-between">
            <span>Status Penguncian Nilai</span>
            <BookOpen className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-base font-bold text-slate-900 font-mono mt-3 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            Terverifikasi Guru
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Kelas {student.classId} • SDN Lubang Buaya 04
          </div>
        </div>
      </div>

      {/* Tabel Nilai Siswa (Read-Only) */}
      <div className="rounded-2xl bg-cream/80 border border-amber-500/20 shadow-xl overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 font-serif-luxury flex items-center gap-2">
            <span>Daftar Nilai Asesmen Per Mata Pelajaran</span>
            <span className="text-xs font-mono font-normal text-amber-700">
              ({student.name} - NISN: {student.nisn})
            </span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-cream/80 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4">Mata Pelajaran</th>
                <th className="py-3.5 px-3 text-center w-20">KKM</th>
                <th className="py-3.5 px-3 text-center w-24">Formatif (40%)</th>
                <th className="py-3.5 px-3 text-center w-24">PTS/UTS (30%)</th>
                <th className="py-3.5 px-3 text-center w-24">PAS/UAS (30%)</th>
                <th className="py-3.5 px-3 text-center w-24">Nilai Akhir</th>
                <th className="py-3.5 px-4">Deskripsi Capaian Kompetensi (TP)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60">
              {subjectGrades.map((item, idx) => {
                const gr = item.grade;
                const isTuntas = (gr?.finalScore ?? 0) >= item.subject.kkm;

                return (
                  <tr key={item.subject.id} className="hover:bg-slate-100/30 transition">
                    <td className="py-3.5 px-4 text-center font-mono text-slate-500">{idx + 1}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-xs">{item.subject.name}</div>
                      <div className="text-[10px] text-slate-500">Kode: {item.subject.code}</div>
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono text-slate-700 font-semibold">
                      {item.subject.kkm}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono text-slate-800">
                      {gr ? gr.formatif : <span className="text-slate-400">-</span>}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono text-slate-800">
                      {gr ? gr.uts : <span className="text-slate-400">-</span>}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono text-slate-800">
                      {gr ? gr.uas : <span className="text-slate-400">-</span>}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      {gr ? (
                        <div>
                          <div className="font-mono font-extrabold text-amber-700 text-sm">
                            {gr.finalScore}
                          </div>
                          <div className={`text-[9px] font-semibold ${isTuntas ? 'text-emerald-600' : 'text-red-600'}`}>
                            {isTuntas ? 'Tuntas' : 'Remedial'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-mono">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 leading-relaxed">
                      {gr?.achievementDescription ? (
                        <span>{gr.achievementDescription}</span>
                      ) : (
                        <span className="text-slate-400 italic">Nilai capaian belum diinput oleh guru pengajar.</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
