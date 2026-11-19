import React from 'react';
import { useSchool } from '../../context/SchoolContext';
import { 
  Users, GraduationCap, School, Award, 
  CheckCircle2, ArrowRight, Printer, FileText, 
  TrendingUp, ShieldCheck 
} from 'lucide-react';

interface KepsekDashboardProps {
  onNavigate: (tab: string) => void;
}

export const KepsekDashboard: React.FC<KepsekDashboardProps> = ({ onNavigate }) => {
  const { students, teachers, grades, attendance, achievements, schoolProfile } = useSchool();

  const totalStudents = students.filter(s => s.status === 'Aktif').length;
  const totalTeachers = teachers.length;
  const totalAchievements = achievements.length;
  const attendanceRate = attendance.length ? Math.round((attendance.filter(a => a.status === 'Hadir').length / attendance.length) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* Executive Welcome Card */}
      <div className="relative rounded-3xl bg-gradient-to-r from-cream via-cream/90 to-emerald-50 p-6 md:p-8 border border-emerald-500/30 shadow-2xl overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 text-xs font-semibold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              PANEL EKSEKUTIF KEPALA SEKOLAH
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 font-serif-luxury tracking-wide">
              {schoolProfile.principal.name}
            </h2>
            <p className="text-slate-700 text-sm max-w-2xl leading-relaxed">
              Selamat datang di ruang pemantauan mutu dan tata kelola akademik SDN Lubang Buaya 04 Pagi. Pantau integritas 18 rombongan belajar, rekapitulasi nilai rapor, kedisiplinan kehadiran, dan raihan prestasi siswa.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('rapor')}
              className="px-4 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 hover:bg-emerald-500/30 text-emerald-800 text-xs font-semibold transition flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Monitoring Rapor
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 rounded-xl bg-cream border border-slate-300 hover:border-emerald-400 text-slate-800 text-xs font-semibold transition flex items-center gap-2"
            >
              <Printer className="w-4 h-4 text-emerald-600" />
              Cetak Rekap
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-cream/80 border border-emerald-500/20 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600">
              <Users className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-emerald-600">
              18 Rombel
            </span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-serif-luxury mt-3">{totalStudents}</div>
          <div className="text-xs text-slate-500 font-medium">Total Peserta Didik Aktif</div>
        </div>

        <div className="p-5 rounded-2xl bg-cream/80 border border-emerald-500/20 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-700">
              <GraduationCap className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-amber-700">
              Pengajar
            </span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-serif-luxury mt-3">{totalTeachers}</div>
          <div className="text-xs text-slate-500 font-medium">Tenaga Pendidik & Wali Kelas</div>
        </div>

        <div className="p-5 rounded-2xl bg-cream/80 border border-emerald-500/20 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-xl bg-sky-500/10 text-sky-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-sky-600">
              Rata-rata
            </span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-serif-luxury mt-3">{attendanceRate}%</div>
          <div className="text-xs text-slate-500 font-medium">Tingkat Kehadiran Sekolah</div>
        </div>

        <div className="p-5 rounded-2xl bg-cream/80 border border-emerald-500/20 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-600">
              <Award className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-purple-600">
              Prestasi
            </span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-serif-luxury mt-3">{totalAchievements}</div>
          <div className="text-xs text-slate-500 font-medium">Penghargaan Tingkat Kota/Nasional</div>
        </div>
      </div>

      {/* Academic Highlights & Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-cream/80 border border-emerald-500/20 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-slate-900 font-serif-luxury flex items-center justify-between pb-2 border-b border-slate-200">
            <span>Rangkuman Raihan Prestasi Sekolah</span>
            <button onClick={() => onNavigate('achievements')} className="text-xs text-emerald-600 hover:text-emerald-600 flex items-center gap-1 font-sans">
              Semua Prestasi <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </h3>

          <div className="space-y-2.5">
            {achievements.map(ach => (
              <div key={ach.id} className="p-3.5 rounded-xl bg-cream/70 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900">{ach.title}</div>
                  <div className="text-[11px] text-amber-700 mt-0.5">
                    {ach.studentName} • Kelas {ach.classId}
                  </div>
                </div>
                <span className="text-[10px] font-semibold px-2 py-1 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 uppercase">
                  Tingkat {ach.level}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-cream/80 border border-emerald-500/20 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-slate-900 font-serif-luxury flex items-center justify-between pb-2 border-b border-slate-200">
            <span>Status Kesiapan Nilai Rapor Digital</span>
            <button onClick={() => onNavigate('rapor')} className="text-xs text-emerald-600 hover:text-emerald-600 flex items-center gap-1 font-sans">
              Buka Rapor <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </h3>

          <div className="p-4 rounded-xl bg-cream/70 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-700 font-medium">Validasi Capaian TP Selesai</span>
              <span className="text-emerald-600 font-bold">96%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
              <div className="w-[96%] h-full bg-gradient-to-r from-emerald-500 to-amber-400 rounded-full" />
            </div>
            <p className="text-[11px] text-slate-500">
              Sebagian besar nilai dari 36 rombel telah diverifikasi oleh masing-masing wali kelas dan siap diterbitkan secara digital.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
