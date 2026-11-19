import React from 'react';
import { useSchool } from '../../context/SchoolContext';
import { 
  GraduationCap, CalendarDays, Award, CheckSquare, 
  Sparkles, Users, Phone, ArrowRight, BookOpen, AlertCircle 
} from 'lucide-react';

interface GuruDashboardProps {
  onNavigate: (tab: string) => void;
}

export const GuruDashboard: React.FC<GuruDashboardProps> = ({ onNavigate }) => {
  const { currentUser, teachers, students, schedules, grades, attendance } = useSchool();

  // Find teacher profile
  const teacherProfile = teachers.find(t => t.id === currentUser.referenceId) || teachers[0];
  const isWaliKelas = teacherProfile.isWaliKelas;
  const assignedClass = teacherProfile.assignedClass || '';

  // Class students if wali kelas
  const myClassStudents = isWaliKelas ? students.filter(s => s.classId === assignedClass) : [];
  const myClassGrades = isWaliKelas ? grades.filter(g => g.classId === assignedClass) : [];
  const mySchedules = schedules.filter(s => s.teacherId === teacherProfile.id);

  return (
    <div className="space-y-6">
      {/* Teacher Profile Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-cream via-cream/90 to-sky-50 p-6 md:p-8 border border-sky-500/30 shadow-2xl overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-600 text-xs font-semibold uppercase tracking-wider">
              <GraduationCap className="w-4 h-4 text-sky-600" />
              PORTAL GURU & WALI KELAS • SDN LUBANG BUAYA 04
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 font-serif-luxury tracking-wide">
              {teacherProfile.name}
            </h2>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-700">
              <span className="font-mono">NIP: {teacherProfile.nip}</span>
              <span>•</span>
              <span className="text-amber-700 font-semibold">
                Mapel Pengampu: {teacherProfile.subjects.join(', ')}
              </span>
              {isWaliKelas && (
                <>
                  <span>•</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 border border-amber-500/40 font-bold">
                    Wali Kelas {assignedClass}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('grades')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-xs uppercase tracking-wider shadow-md hover:scale-[1.02] transition flex items-center gap-2"
            >
              <Award className="w-4 h-4" />
              Input Nilai Siswa
            </button>
            <button
              onClick={() => onNavigate('attendance')}
              className="px-4 py-2.5 rounded-xl bg-cream border border-sky-500/30 text-sky-600 hover:border-sky-400 text-xs font-semibold transition flex items-center gap-2"
            >
              <CheckSquare className="w-4 h-4" />
              Input Presensi
            </button>
          </div>
        </div>
      </div>

      {/* SPECIAL WALI KELAS PANEL (If teacher is assigned as Wali Kelas) */}
      {isWaliKelas && (
        <div className="rounded-2xl bg-gradient-to-b from-amber-500/10 via-cream/90 to-cream border border-amber-500/30 p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-500/20">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-700" />
                <h3 className="text-lg font-bold text-slate-900 font-serif-luxury">
                  Tugas Tambahan: Wali Kelas {assignedClass}
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Anda bertanggung jawab penuh atas pembinaan, rekap presensi, catatan perkembangan, dan proses penerbitan rapor Kelas {assignedClass}.
              </p>
            </div>
            <button
              onClick={() => onNavigate('rapor')}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-700 text-xs font-semibold transition self-start sm:self-auto flex items-center gap-1.5"
            >
              Periksa & Cetak E-Rapor Kelas {assignedClass} <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-cream/70 border border-slate-200">
              <div className="text-xs text-slate-500 font-medium">Jumlah Peserta Didik</div>
              <div className="text-2xl font-bold text-slate-900 mt-1 font-serif-luxury">{myClassStudents.length} Siswa</div>
              <div className="text-[11px] text-amber-700/80 mt-1">Kelas {assignedClass} • Aktif</div>
            </div>

            <div className="p-4 rounded-xl bg-cream/70 border border-slate-200">
              <div className="text-xs text-slate-500 font-medium">Rekap Nilai Terkumpul</div>
              <div className="text-2xl font-bold text-slate-900 mt-1 font-serif-luxury">{myClassGrades.length} Nilai</div>
              <div className="text-[11px] text-sky-600/80 mt-1">Siap verifikasi rapor semester</div>
            </div>

            <div className="p-4 rounded-xl bg-cream/70 border border-slate-200">
              <div className="text-xs text-slate-500 font-medium">Kontak Orang Tua / Wali</div>
              <div className="text-2xl font-bold text-slate-900 mt-1 font-serif-luxury">Lengkap</div>
              <div className="text-[11px] text-emerald-600/80 mt-1">Data ayah/ibu tersinkronisasi</div>
            </div>
          </div>

          {/* List of students in my class */}
          <div className="mt-4 pt-2">
            <div className="text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
              <span>Daftar Siswa Kelas {assignedClass}</span>
              <span className="text-[10px] text-slate-500">Total {myClassStudents.length} Siswa</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {myClassStudents.map(std => (
                <div key={std.id} className="p-3 rounded-xl bg-cream/80 border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-900">{std.name}</div>
                    <div className="text-[10px] text-amber-700/80 font-mono mt-0.5">NISN: {std.nisn}</div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-1">
                      <Phone className="w-3 h-3 text-slate-500" />
                      {std.parent.phone} ({std.parent.fatherName})
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 border border-amber-500/20 font-semibold">
                    {std.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Teaching Schedule */}
      <div className="rounded-2xl bg-cream/80 border border-sky-500/20 p-6 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-slate-900 font-serif-luxury flex items-center justify-between pb-2 border-b border-slate-200">
          <span className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-sky-600" />
            Jadwal Mengajar Saya
          </span>
          <button onClick={() => onNavigate('schedules')} className="text-xs text-sky-600 hover:text-sky-600 font-sans font-semibold flex items-center gap-1">
            Lihat Jadwal Lengkap <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {mySchedules.length > 0 ? (
            mySchedules.map(sch => (
              <div key={sch.id} className="p-4 rounded-xl bg-cream/80 border border-slate-200 hover:border-sky-500/30 transition">
                <div className="flex items-center justify-between text-xs font-semibold text-sky-600 mb-1">
                  <span>{sch.day}</span>
                  <span className="font-mono text-slate-500">{sch.startTime} - {sch.endTime}</span>
                </div>
                <div className="text-sm font-bold text-slate-900">{sch.subjectName}</div>
                <div className="text-xs text-amber-700 mt-1">
                  Kelas {sch.classId} • {sch.room}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 p-6 text-center text-xs text-slate-500 bg-cream/40 rounded-xl border border-dashed border-slate-200">
              Belum ada jadwal mengajar yang terdaftar untuk akun ini.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
