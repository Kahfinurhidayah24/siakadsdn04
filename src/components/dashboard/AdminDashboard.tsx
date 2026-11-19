import React from 'react';
import { useSchool } from '../../context/SchoolContext';
import { ALL_36_CLASSES } from '../../data/initialData';
import { 
  Users, GraduationCap, School, CheckCircle2, 
  FileSpreadsheet, UserPlus, Database, ArrowRight, 
  TrendingUp, Award, Clock, ArrowUpRight 
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigate: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const { students, teachers, grades, attendance, activityLogs, academicYear, semester } = useSchool();

  // Statistics calculation
  const totalStudents = students.filter(s => s.status === 'Aktif').length;
  const totalTeachers = teachers.length;
  const assignedWaliKelasCount = teachers.filter(t => t.isWaliKelas).length;
  const todayAttendanceHadir = attendance.filter(a => a.status === 'Hadir').length;
  const todayAttendanceTotal = attendance.length || 1;
  const attendanceRate = Math.round((todayAttendanceHadir / todayAttendanceTotal) * 100);

  // Group 36 classes by grade level 1 to 6
  const gradeLevels = [1, 2, 3, 4, 5, 6];

  return (
    <div className="space-y-6">
      {/* Top Welcome Luxury Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-cream via-cream/95 to-slate-50 p-6 md:p-8 border border-amber-500/30 shadow-2xl overflow-hidden">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-1/3 w-72 h-40 bg-amber-600/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 text-xs font-semibold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              SIAKAD SUPER ADMINISTRATOR • SDN LUBANG BUAYA 04 PAGI
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 font-serif-luxury tracking-wide">
              Administrasi Akademik
            </h2>
            <p className="text-slate-700 text-sm max-w-2xl leading-relaxed">
              Selamat datang di portal sentral. Kelola 18 rombongan belajar (Kelas 1A-1C s/d 6A-6C), 573 peserta didik, 22 tenaga pendidik, input & import massal nilai E-Rapor, presensi kehadiran, dan cetak dokumen resmi sekolah.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              id="btn-quick-import"
              onClick={() => onNavigate('mass_import_grades')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4 text-slate-950" />
              Import Nilai Massal
            </button>
            <button
              id="btn-quick-add-student"
              onClick={() => onNavigate('students')}
              className="px-4 py-2.5 rounded-xl bg-cream border border-amber-500/30 hover:border-amber-400 text-amber-700 text-xs font-semibold transition flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Kelola Siswa
            </button>
          </div>
        </div>
      </div>

      {/* 4 Stat Cards with Luxury Obsidian & Gold Accents */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <div className="rounded-2xl bg-cream/80 border border-amber-500/20 p-5 shadow-xl relative overflow-hidden group hover:border-amber-500/40 transition">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-700">
              <Users className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-amber-700 border border-amber-500/20">
              36 Kelas Aktif
            </span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-900 font-serif-luxury">{totalStudents}</div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">Total Peserta Didik Terdaftar</div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-amber-700/80">
            <span>NISN Terverifikasi</span>
            <span className="font-semibold">100%</span>
          </div>
        </div>

        {/* Teachers */}
        <div className="rounded-2xl bg-cream/80 border border-amber-500/20 p-5 shadow-xl relative overflow-hidden group hover:border-amber-500/40 transition">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/25 text-sky-600">
              <GraduationCap className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-sky-600 border border-sky-500/20">
              PNS & PPPK
            </span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-900 font-serif-luxury">{totalTeachers}</div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">Dewan Guru Pengampu</div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-sky-600/80">
            <span>Wali Kelas Ditugaskan</span>
            <span className="font-semibold">{assignedWaliKelasCount} Guru</span>
          </div>
        </div>

        {/* Attendance Rate */}
        <div className="rounded-2xl bg-cream/80 border border-amber-500/20 p-5 shadow-xl relative overflow-hidden group hover:border-amber-500/40 transition">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-emerald-600 border border-emerald-500/20">
              Hari Ini
            </span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-900 font-serif-luxury">{attendanceRate}%</div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">Tingkat Kehadiran Sekolah</div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-emerald-600/80">
            <span>Presensi Terdata</span>
            <span className="font-semibold">{todayAttendanceHadir} Siswa Hadir</span>
          </div>
        </div>

        {/* Grades Recorded */}
        <div className="rounded-2xl bg-cream/80 border border-amber-500/20 p-5 shadow-xl relative overflow-hidden group hover:border-amber-500/40 transition">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/25 text-purple-600">
              <Award className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-purple-600 border border-purple-500/20">
              E-Rapor
            </span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-900 font-serif-luxury">{grades.length}</div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">Data Nilai Terinput</div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-purple-600/80">
            <span>Nilai Terkunci</span>
            <span className="font-semibold">{grades.filter(g => g.isLocked).length} Mata Pelajaran</span>
          </div>
        </div>
      </div>

      {/* 36 Classes Distribution Grid */}
      <div className="rounded-2xl bg-cream/80 border border-amber-500/20 p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-serif-luxury flex items-center gap-2">
              <School className="w-5 h-5 text-amber-700" />
              Matriks 18 Rombongan Belajar (Rombel)
            </h3>
            <p className="text-xs text-slate-500">
              Alokasi 18 rombel resmi Dapodik: Kelas 1A-1C, 2A-2C, 3A-3C, 4A-4C, 5A-5C, 6A-6C (9 Ruang Kelas Sesi Pagi)
            </p>
          </div>
          <button
            onClick={() => onNavigate('students')}
            className="text-xs text-amber-700 hover:text-amber-700 font-semibold flex items-center gap-1 self-start sm:self-auto"
          >
            Lihat Detail Siswa <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
          {gradeLevels.map(lvl => {
            const levelClasses = ALL_36_CLASSES.filter(c => c.startsWith(`${lvl}`));
            return (
              <div key={lvl} className="p-4 rounded-xl bg-cream/70 border border-slate-200 hover:border-amber-500/30 transition">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                  <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">
                    Tingkat Kelas {lvl} (3 Rombel)
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Total: {students.filter(s => s.classId.startsWith(`${lvl}`)).length} Siswa
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3">
                  {levelClasses.map(cls => {
                    const count = students.filter(s => s.classId === cls).length;
                    const wali = teachers.find(t => t.assignedClass === cls);
                    return (
                      <div 
                        key={cls}
                        onClick={() => onNavigate('students')}
                        className="cursor-pointer p-2 rounded-lg bg-cream border border-slate-200 hover:border-amber-400/50 hover:bg-slate-100 transition text-center"
                      >
                        <div className="text-xs font-bold text-slate-900">{cls}</div>
                        <div className="text-[10px] text-amber-700/90 font-mono mt-0.5">{count} Siswa</div>
                        <div className="text-[9px] text-slate-500 truncate mt-1">
                          {wali ? wali.name.split(',')[0] : 'Belum Ada Wali'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Actions & Recent Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Functional Modules */}
        <div className="rounded-2xl bg-cream/80 border border-amber-500/20 p-6 shadow-xl space-y-3">
          <h3 className="text-sm font-bold text-slate-900 font-serif-luxury flex items-center gap-2 pb-2 border-b border-slate-200">
            <TrendingUp className="w-4 h-4 text-amber-700" />
            Fitur Unggulan SIAKAD
          </h3>

          <div className="space-y-2 pt-1">
            <button
              onClick={() => onNavigate('mass_import_grades')}
              className="w-full p-3 rounded-xl bg-cream/80 border border-slate-200 hover:border-amber-500/50 text-left transition flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/15 text-amber-700">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 group-hover:text-amber-700 transition">
                    Import Nilai Rapor Massal
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Upload file Excel/CSV & auto matching NISN
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-700 transition" />
            </button>

            <button
              onClick={() => onNavigate('rapor')}
              className="w-full p-3 rounded-xl bg-cream/80 border border-slate-200 hover:border-amber-500/50 text-left transition flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-sky-500/15 text-sky-600">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 group-hover:text-sky-600 transition">
                    Penerbitan E-Rapor Digital
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Cetak rapor resmi Kurikulum Merdeka
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-sky-600 transition" />
            </button>

            <button
              onClick={() => onNavigate('student_cards')}
              className="w-full p-3 rounded-xl bg-cream/80 border border-slate-200 hover:border-amber-500/50 text-left transition flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/15 text-purple-600">
                  <School className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 group-hover:text-purple-600 transition">
                    Cetak Kartu Pelajar Emas
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Desain kartu mewah dengan barcode & QR
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-purple-600 transition" />
            </button>

            <button
              onClick={() => onNavigate('promotion')}
              className="w-full p-3 rounded-xl bg-cream/80 border border-slate-200 hover:border-amber-500/50 text-left transition flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-600">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-600 transition">
                    Kenaikan Kelas & Alumni
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Promosi massal rombel & arsip kelulusan
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-600 transition" />
            </button>
          </div>
        </div>

        {/* Real-time Activity Logs */}
        <div className="lg:col-span-2 rounded-2xl bg-cream/80 border border-amber-500/20 p-6 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 font-serif-luxury flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-700" />
              Audit Log Aktivitas Sistem
            </h3>
            <button
              onClick={() => onNavigate('logs_backup')}
              className="text-xs text-amber-700 hover:text-amber-700 font-semibold flex items-center gap-1"
            >
              Lihat Semua Log <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {activityLogs.slice(0, 6).map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-xl bg-cream/60 border border-slate-200 flex items-start justify-between gap-3 text-xs hover:border-slate-300 transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-amber-700">{log.action}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 font-mono">
                      {log.user}
                    </span>
                  </div>
                  <p className="text-slate-700 text-[11px] leading-relaxed">{log.details}</p>
                </div>
                <div className="text-[10px] text-slate-500 whitespace-nowrap font-mono">
                  {log.timestamp}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
