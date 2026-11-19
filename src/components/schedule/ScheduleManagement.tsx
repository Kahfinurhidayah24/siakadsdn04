import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { ALL_36_CLASSES } from '../../data/initialData';
import { ScheduleItem } from '../../types';
import { 
  CalendarDays, Plus, Trash2, Clock, 
  MapPin, AlertTriangle, ShieldCheck, X 
} from 'lucide-react';

export const ScheduleManagement: React.FC = () => {
  const { schedules, subjects, teachers, addSchedule, deleteSchedule, currentUser } = useSchool();

  const [selectedClass, setSelectedClass] = useState('4A');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [conflictError, setConflictError] = useState<string | null>(null);

  // Form
  const [formData, setFormData] = useState({
    day: 'Senin' as 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat',
    startTime: '07:00',
    endTime: '08:20',
    subjectId: subjects[0]?.id || '',
    teacherId: teachers[0]?.id || '',
    classId: '4A',
    room: 'Ruang 4A'
  });

  const days: ('Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat')[] = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];

  const classSchedules = schedules.filter(s => s.classId === selectedClass);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setConflictError(null);

    const sub = subjects.find(s => s.id === formData.subjectId) || subjects[0];
    const tch = teachers.find(t => t.id === formData.teacherId) || teachers[0];

    const res = addSchedule({
      day: formData.day,
      startTime: formData.startTime,
      endTime: formData.endTime,
      subjectId: sub.id,
      subjectName: sub.name,
      teacherId: tch.id,
      teacherName: tch.name,
      classId: formData.classId,
      room: formData.room
    });

    if (!res.success && res.conflictError) {
      setConflictError(res.conflictError);
    } else {
      setIsAddModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-amber-500/20">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-serif-luxury flex items-center gap-2.5">
            <CalendarDays className="w-6 h-6 text-amber-700" />
            Jadwal Pelajaran Mingguan & Deteksi Konflik Otomatis
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Sistem otomatis memvalidasi jadwal agar tidak terjadi bentrok guru pengampu, waktu kelas, maupun pemakaian ruang kelas/lab.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Pilih Rombel:</span>
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setFormData(prev => ({ ...prev, classId: e.target.value, room: `Ruang ${e.target.value}` }));
              }}
              className="py-1.5 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-amber-700 font-mono font-bold focus:border-amber-400 outline-none"
            >
              {ALL_36_CLASSES.map(cls => (
                <option key={cls} value={cls}>Kelas {cls}</option>
              ))}
            </select>
          </div>

          {currentUser.role === 'admin' && (
            <button
              onClick={() => {
                setConflictError(null);
                setFormData(prev => ({ ...prev, classId: selectedClass, room: `Ruang ${selectedClass}` }));
                setIsAddModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-xs uppercase tracking-wider shadow-md hover:scale-[1.02] transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              Tambah Jadwal
            </button>
          )}
        </div>
      </div>

      {/* Weekly Schedule Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {days.map(day => {
          const dayItems = classSchedules.filter(s => s.day === day).sort((a, b) => a.startTime.localeCompare(b.startTime));
          return (
            <div key={day} className="rounded-2xl bg-cream/80 border border-amber-500/20 p-4 shadow-xl space-y-3">
              <div className="pb-2 border-b border-slate-200 flex items-center justify-between">
                <span className="font-bold text-amber-700 text-xs uppercase tracking-wider font-serif-luxury">
                  {day}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">{dayItems.length} Mapel</span>
              </div>

              <div className="space-y-2.5 min-h-[220px]">
                {dayItems.length > 0 ? (
                  dayItems.map(item => (
                    <div key={item.id} className="p-3 rounded-xl bg-cream/80 border border-slate-200 hover:border-amber-500/30 transition text-xs space-y-1 relative group">
                      <div className="flex items-center justify-between text-[10px] text-amber-700 font-mono font-semibold">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-700" />
                          {item.startTime} - {item.endTime}
                        </span>
                        {currentUser.role === 'admin' && (
                          <button
                            onClick={() => deleteSchedule(item.id)}
                            className="text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"
                            title="Hapus"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <div className="font-bold text-slate-900 leading-tight">{item.subjectName}</div>
                      <div className="text-[10px] text-slate-500 truncate">{item.teacherName}</div>
                      <div className="text-[9px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-2.5 h-2.5 text-amber-500/70" />
                        {item.room}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex items-center justify-center p-4 text-center text-slate-500 text-[11px] border border-dashed border-slate-200/80 rounded-xl">
                    Tidak ada KBM
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add Schedule */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-cream border border-amber-500/30 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 font-serif-luxury">
                Tambah Jadwal Pelajaran (Kelas {formData.classId})
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-500 hover:text-slate-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            {conflictError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-500/40 text-red-800 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong className="text-red-600 block">Validasi Bentrok Jadwal Terdeteksi!</strong>
                  {conflictError}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Hari Pelaksanaan</label>
                  <select
                    value={formData.day}
                    onChange={(e) => setFormData({ ...formData, day: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 outline-none"
                  >
                    {days.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Ruangan</label>
                  <input
                    type="text"
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Jam Mulai</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Jam Selesai</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Mata Pelajaran</label>
                <select
                  value={formData.subjectId}
                  onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 outline-none"
                >
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Guru Pengampu</label>
                <select
                  value={formData.teacherId}
                  onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 outline-none"
                >
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name} (NIP: {t.nip})</option>)}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold uppercase tracking-wider"
                >
                  Validasi & Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
