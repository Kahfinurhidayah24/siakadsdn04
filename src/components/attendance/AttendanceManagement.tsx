import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { ALL_36_CLASSES } from '../../data/initialData';
import { 
  CheckSquare, Calendar, Users, CheckCircle2, 
  AlertCircle, Clock, Sparkles, UserCheck 
} from 'lucide-react';
import { StudentAttendanceView } from './StudentAttendanceView';

export const AttendanceManagement: React.FC = () => {
  const { students, attendance, recordAttendance, currentUser } = useSchool();

  // Jika akun yang login adalah Siswa, alihkan langsung ke tampilan rekap mandiri (read-only)
  if (currentUser.role === 'siswa') {
    return <StudentAttendanceView />;
  }

  const [selectedClass, setSelectedClass] = useState('4A');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [statusMap, setStatusMap] = useState<{ [studentId: string]: { status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpa'; note: string } }>({});
  const [savedSuccess, setSavedSuccess] = useState(false);

  const classStudents = students.filter(s => s.classId === selectedClass && s.status === 'Aktif');

  // Load existing records or default to 'Hadir'
  const getStatusFor = (studentId: string): 'Hadir' | 'Sakit' | 'Izin' | 'Alpa' => {
    if (statusMap[studentId]) return statusMap[studentId].status;
    const existing = attendance.find(a => a.studentId === studentId && a.date === selectedDate);
    return existing ? existing.status : 'Hadir';
  };

  const getNoteFor = (studentId: string): string => {
    if (statusMap[studentId]) return statusMap[studentId].note;
    const existing = attendance.find(a => a.studentId === studentId && a.date === selectedDate);
    return existing?.notes || '';
  };

  const handleSetStatus = (studentId: string, status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpa') => {
    setStatusMap(prev => ({
      ...prev,
      [studentId]: {
        status,
        note: prev[studentId]?.note || ''
      }
    }));
  };

  const handleSetNote = (studentId: string, note: string) => {
    setStatusMap(prev => ({
      ...prev,
      [studentId]: {
        status: prev[studentId]?.status || getStatusFor(studentId),
        note
      }
    }));
  };

  const handleMarkAllHadir = () => {
    const updated: typeof statusMap = {};
    classStudents.forEach(s => {
      updated[s.id] = { status: 'Hadir', note: '' };
    });
    setStatusMap(updated);
  };

  const handleSaveAttendance = () => {
    const itemsToSave = classStudents.map(std => {
      const st = statusMap[std.id] || {
        status: getStatusFor(std.id),
        note: getNoteFor(std.id)
      };
      return {
        studentId: std.id,
        status: st.status,
        notes: st.note
      };
    });

    recordAttendance(selectedClass, selectedDate, itemsToSave);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Stats calculation
  const totalStudents = classStudents.length;
  const hadirCount = classStudents.filter(s => getStatusFor(s.id) === 'Hadir').length;
  const sakitCount = classStudents.filter(s => getStatusFor(s.id) === 'Sakit').length;
  const izinCount = classStudents.filter(s => getStatusFor(s.id) === 'Izin').length;
  const alpaCount = classStudents.filter(s => getStatusFor(s.id) === 'Alpa').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-amber-500/20">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-serif-luxury flex items-center gap-2.5">
            <CheckSquare className="w-6 h-6 text-amber-700" />
            Presensi & Jurnal Kehadiran Harian (36 Rombel)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pencatatan absensi peserta didik harian yang terintegrasi langsung ke E-Rapor Digital.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleMarkAllHadir}
            className="px-3.5 py-2 rounded-xl bg-cream border border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 text-xs font-semibold transition flex items-center gap-2"
          >
            <UserCheck className="w-4 h-4 text-emerald-600" />
            Tandai Semua Hadir
          </button>
          <button
            onClick={handleSaveAttendance}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-xs uppercase tracking-wider shadow-md hover:scale-[1.02] transition"
          >
            Simpan Presensi
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Presensi Kelas {selectedClass} tanggal {selectedDate} berhasil disimpan!</span>
        </div>
      )}

      {/* Selectors and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Selectors */}
        <div className="p-4 rounded-2xl bg-cream/80 border border-amber-500/20 shadow-xl space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-slate-500 mb-1 font-semibold">Pilih Tanggal:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 mb-1 font-semibold">Rombel Kelas:</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-amber-700 font-mono font-bold outline-none"
              >
                {ALL_36_CLASSES.map(cls => (
                  <option key={cls} value={cls}>Kelas {cls}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Attendance Counter Grid */}
        <div className="lg:col-span-2 p-4 rounded-2xl bg-cream/80 border border-amber-500/20 shadow-xl grid grid-cols-4 gap-3 text-center">
          <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-500/30">
            <div className="text-[10px] text-emerald-600 uppercase font-semibold">Hadir</div>
            <div className="text-xl font-bold text-slate-900 font-mono mt-0.5">{hadirCount}</div>
          </div>
          <div className="p-2 rounded-xl bg-sky-50 border border-sky-500/30">
            <div className="text-[10px] text-sky-600 uppercase font-semibold">Sakit</div>
            <div className="text-xl font-bold text-slate-900 font-mono mt-0.5">{sakitCount}</div>
          </div>
          <div className="p-2 rounded-xl bg-amber-50 border border-amber-500/30">
            <div className="text-[10px] text-amber-700 uppercase font-semibold">Izin</div>
            <div className="text-xl font-bold text-slate-900 font-mono mt-0.5">{izinCount}</div>
          </div>
          <div className="p-2 rounded-xl bg-red-50 border border-red-500/30">
            <div className="text-[10px] text-red-600 uppercase font-semibold">Alpa</div>
            <div className="text-xl font-bold text-slate-900 font-mono mt-0.5">{alpaCount}</div>
          </div>
        </div>
      </div>

      {/* Student List Table */}
      <div className="rounded-2xl bg-cream/80 border border-amber-500/20 shadow-xl overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-amber-500/20 bg-slate-50 text-slate-500 font-semibold uppercase">
              <th className="py-3 px-4 w-12 text-center">No</th>
              <th className="py-3 px-4">Nama Siswa</th>
              <th className="py-3 px-4 text-center">Status Kehadiran</th>
              <th className="py-3 px-4">Keterangan Tambahan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/80">
            {classStudents.map((std, idx) => {
              const currentStatus = getStatusFor(std.id);
              const currentNote = getNoteFor(std.id);

              return (
                <tr key={std.id} className="hover:bg-slate-100/50 transition">
                  <td className="py-3.5 px-4 text-center font-mono text-slate-500">{idx + 1}</td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900 text-xs">{std.name}</div>
                    <div className="text-[10px] text-amber-700/80 font-mono">NISN: {std.nisn}</div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="inline-flex items-center gap-1.5 p-1 rounded-xl bg-slate-50 border border-slate-200">
                      {(['Hadir', 'Sakit', 'Izin', 'Alpa'] as const).map(st => (
                        <button
                          key={st}
                          onClick={() => handleSetStatus(std.id, st)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                            currentStatus === st
                              ? st === 'Hadir' ? 'bg-emerald-500 text-slate-950'
                              : st === 'Sakit' ? 'bg-sky-500 text-slate-950'
                              : st === 'Izin' ? 'bg-amber-500 text-white'
                              : 'bg-red-500 text-white'
                              : 'text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <input
                      type="text"
                      placeholder="Catatan surat dokter / izin orang tua..."
                      value={currentNote}
                      onChange={(e) => handleSetNote(std.id, e.target.value)}
                      className="w-full max-w-sm p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 outline-none focus:border-amber-400"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
