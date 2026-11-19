import React from 'react';
import { useSchool } from '../../context/SchoolContext';
import { 
  GraduationCap, Award, CalendarDays, CheckSquare, 
  CreditCard, FileText, UserCheck, Phone, MapPin, AlertCircle 
} from 'lucide-react';

interface SiswaDashboardProps {
  onNavigate: (tab: string) => void;
}

export const SiswaDashboard: React.FC<SiswaDashboardProps> = ({ onNavigate }) => {
  const { currentUser, students, grades, attendance, schedules } = useSchool();

  // Find student profile by referenceId or NISN
  const student = students.find(s => s.id === currentUser.referenceId || s.nisn === currentUser.username) || students[0];
  const myGrades = grades.filter(g => g.studentNisn === student.nisn || g.studentId === student.id);
  const myAttendance = attendance.filter(a => a.studentId === student.id || a.studentName === student.name);
  const mySchedules = schedules.filter(s => s.classId === student.classId);

  const hadirCount = myAttendance.filter(a => a.status === 'Hadir').length;
  const sakitCount = myAttendance.filter(a => a.status === 'Sakit').length;
  const izinCount = myAttendance.filter(a => a.status === 'Izin').length;
  const alpaCount = myAttendance.filter(a => a.status === 'Alpa').length;

  const averageGrade = myGrades.length 
    ? Math.round(myGrades.reduce((acc, curr) => acc + curr.finalScore, 0) / myGrades.length) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Student Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-cream via-cream/95 to-indigo-50 p-6 md:p-8 border border-indigo-500/30 shadow-2xl overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-200 to-amber-600 p-[2px] shadow-xl shrink-0">
              <div className="w-full h-full rounded-[14px] bg-slate-50 flex items-center justify-center font-bold text-amber-700 text-xl font-serif-luxury">
                {student.name.charAt(0)}
              </div>
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-600 text-[11px] font-semibold uppercase tracking-wider">
                <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                PORTAL PESERTA DIDIK
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 font-serif-luxury">
                {student.name}
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-700">
                <span className="text-amber-700 font-mono font-semibold">NISN: {student.nisn}</span>
                <span>•</span>
                <span className="font-mono">NIS: {student.nis}</span>
                <span>•</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 border border-amber-500/30 font-bold">
                  Kelas {student.classId}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('rapor')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-xs uppercase tracking-wider shadow-md hover:scale-[1.02] transition flex items-center gap-2"
            >
              <FileText className="w-4 h-4 text-slate-950" />
              Lihat E-Rapor Saya
            </button>
            <button
              onClick={() => onNavigate('student_cards')}
              className="px-4 py-2.5 rounded-xl bg-cream border border-amber-500/30 text-amber-700 hover:border-amber-400 text-xs font-semibold transition flex items-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              Kartu Pelajar
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-cream/80 border border-amber-500/20 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Rata-Rata Nilai</span>
            <Award className="w-4 h-4 text-amber-700" />
          </div>
          <div className="text-3xl font-bold text-slate-900 font-serif-luxury mt-2">
            {averageGrade || 91}
          </div>
          <div className="text-[11px] text-amber-700 font-medium mt-1">
            Predikat: Sangat Baik (A)
          </div>
        </div>

        {/* Card Kehadiran Hadir */}
        <div 
          onClick={() => onNavigate('attendance')}
          className="p-5 rounded-2xl bg-cream/80 border border-emerald-500/20 hover:border-emerald-500/40 transition shadow-xl cursor-pointer"
          title="Klik untuk melihat riwayat kehadiran lengkap"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Kehadiran (Hadir)</span>
            <CheckSquare className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-bold text-slate-900 font-serif-luxury mt-2">
            {hadirCount} Hari
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            Tingkat Kehadiran Aktif
          </div>
        </div>

        {/* Card Total Tidak Masuk */}
        <div 
          onClick={() => onNavigate('attendance')}
          className="p-5 rounded-2xl bg-cream/80 border border-amber-500/25 hover:border-amber-500/40 transition shadow-xl cursor-pointer"
          title="Klik untuk melihat rincian alasan tidak masuk"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Total Tidak Masuk</span>
            <AlertCircle className="w-4 h-4 text-amber-700" />
          </div>
          <div className="text-3xl font-bold text-amber-700 font-serif-luxury mt-2">
            {sakitCount + izinCount + alpaCount} Hari
          </div>
          <div className="text-[11px] text-slate-700 mt-1 flex items-center gap-1.5 font-medium">
            <span className="text-sky-600">S:{sakitCount}</span> • 
            <span className="text-amber-700">I:{izinCount}</span> • 
            <span className="text-red-600 font-bold">A:{alpaCount}</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-cream/80 border border-purple-500/20 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Tahun Ajaran</span>
            <CalendarDays className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 font-serif-luxury mt-3">
            2025/2026
          </div>
          <div className="text-[11px] text-purple-600 mt-1">
            Semester Ganjil
          </div>
        </div>
      </div>

      {/* Student Biodata & Grades Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Biodata Box */}
        <div className="p-6 rounded-2xl bg-cream/80 border border-amber-500/20 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-900 font-serif-luxury pb-2 border-b border-slate-200">
            Data Pribadi & Orang Tua
          </h3>
          <div className="space-y-3 text-xs">
            <div>
              <div className="text-slate-500 text-[11px]">Tempat, Tanggal Lahir</div>
              <div className="text-slate-800 font-medium">{student.birthPlace}, {student.birthDate}</div>
            </div>
            <div>
              <div className="text-slate-500 text-[11px]">Nama Orang Tua (Ayah / Ibu)</div>
              <div className="text-slate-800 font-medium">{student.parent.fatherName} & {student.parent.motherName}</div>
            </div>
            <div>
              <div className="text-slate-500 text-[11px]">Nomor Telepon Orang Tua</div>
              <div className="text-slate-800 font-mono flex items-center gap-1">
                <Phone className="w-3 h-3 text-amber-700" />
                {student.parent.phone}
              </div>
            </div>
            <div>
              <div className="text-slate-500 text-[11px]">Alamat Domisili</div>
              <div className="text-slate-800 flex items-start gap-1">
                <MapPin className="w-3 h-3 text-amber-700 shrink-0 mt-0.5" />
                <span>{student.address}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Latest Subject Grades */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-cream/80 border border-amber-500/20 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 font-serif-luxury">
              Capaian Nilai Akademik Terbaru
            </h3>
            <button onClick={() => onNavigate('grades')} className="text-xs text-amber-700 hover:text-amber-700 font-semibold">
              Rincian Lengkap
            </button>
          </div>

          <div className="space-y-2.5">
            {myGrades.length > 0 ? (
              myGrades.map(grd => (
                <div key={grd.id} className="p-3 rounded-xl bg-cream/70 border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-900">{grd.subjectName}</div>
                    <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                      {grd.achievementDescription}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-extrabold text-amber-700 font-serif-luxury">
                      {grd.finalScore}
                    </span>
                    <div className="text-[10px] text-emerald-600 font-semibold">Tuntas</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-500 text-center py-6">
                Belum ada nilai yang diinput untuk periode ini.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
