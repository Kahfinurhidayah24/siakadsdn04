import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { 
  CalendarDays, Award, AlertTriangle, Plus, 
  Trash2, Sparkles, CheckCircle2, ShieldAlert 
} from 'lucide-react';

export const AcademicCalendarAchievements: React.FC = () => {
  const { calendar, achievements, violations, addAchievement, addViolation, currentUser } = useSchool();
  const [activeSubTab, setActiveSubTab] = useState<'calendar' | 'achievements' | 'violations'>('calendar');

  // Form for achievement
  const [isAddAchOpen, setIsAddAchOpen] = useState(false);
  const [achForm, setAchForm] = useState({
    studentId: 'std-1',
    studentName: 'Muhammad Farhan Al-Fatih',
    classId: '4A',
    title: 'Juara 1 Olimpiade Sains Nasional (OSN) IPA',
    level: 'Kota' as const,
    rank: 'Juara 1',
    year: '2025'
  });

  const handleSaveAchievement = (e: React.FormEvent) => {
    e.preventDefault();
    addAchievement(achForm);
    setIsAddAchOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-amber-500/20">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-serif-luxury flex items-center gap-2.5">
            <CalendarDays className="w-6 h-6 text-amber-700" />
            Kalender Akademik, Prestasi & Catatan Siswa
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Agenda penting tahun ajaran 2025/2026, capaian rekor prestasi peserta didik, dan pembinaan kedisiplinan.
          </p>
        </div>

        {/* Subtab Toggle */}
        <div className="flex items-center p-1 rounded-2xl bg-cream border border-slate-200">
          <button
            onClick={() => setActiveSubTab('calendar')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${activeSubTab === 'calendar' ? 'bg-amber-500 text-white shadow-md' : 'text-slate-500 hover:text-white'}`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            Kalender Akademik
          </button>
          <button
            onClick={() => setActiveSubTab('achievements')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${activeSubTab === 'achievements' ? 'bg-amber-500 text-white shadow-md' : 'text-slate-500 hover:text-white'}`}
          >
            <Award className="w-3.5 h-3.5" />
            Prestasi Siswa
          </button>
          <button
            onClick={() => setActiveSubTab('violations')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${activeSubTab === 'violations' ? 'bg-amber-500 text-white shadow-md' : 'text-slate-500 hover:text-white'}`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Disiplin & Bimbingan
          </button>
        </div>
      </div>

      {/* Content based on subtab */}
      {activeSubTab === 'calendar' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {calendar.map(item => (
            <div key={item.id} className="p-5 rounded-2xl bg-cream/80 border border-amber-500/20 shadow-xl space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="px-2.5 py-0.5 rounded-full font-bold uppercase bg-amber-500/15 text-amber-700 border border-amber-500/30">
                  {item.category}
                </span>
                <span className="text-slate-500 font-mono text-[10px]">
                  {item.startDate} s/d {item.endDate}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 font-serif-luxury">{item.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      )}

      {activeSubTab === 'achievements' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setIsAddAchOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-xs uppercase tracking-wider shadow-md hover:scale-[1.02] transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              Catat Prestasi Baru
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map(ach => (
              <div key={ach.id} className="p-5 rounded-2xl bg-cream/80 border border-amber-500/20 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-700">
                    <Award className="w-5 h-5" />
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 text-[10px] font-bold border border-emerald-500/30">
                    Tingkat {ach.level}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-sm font-serif-luxury">{ach.title}</h4>
                  <div className="text-xs text-amber-700 font-semibold mt-0.5">{ach.rank} ({ach.year})</div>
                  <div className="text-xs text-slate-500 mt-1">
                    {ach.studentName} • <span className="font-mono text-slate-700">Kelas {ach.classId}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Modal add achievement */}
          {isAddAchOpen && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="w-full max-w-md bg-cream border border-amber-500/30 rounded-3xl p-6 shadow-2xl space-y-4 text-xs">
                <h3 className="text-base font-bold text-slate-900 font-serif-luxury">Catat Prestasi Siswa</h3>
                <form onSubmit={handleSaveAchievement} className="space-y-3">
                  <div>
                    <label className="block text-slate-500 mb-1">Nama Siswa</label>
                    <input
                      type="text"
                      required
                      value={achForm.studentName}
                      onChange={(e) => setAchForm({ ...achForm, studentName: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">Judul Kejuaraan / Lomba</label>
                    <input
                      type="text"
                      required
                      value={achForm.title}
                      onChange={(e) => setAchForm({ ...achForm, title: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-500 mb-1">Peringkat / Juara</label>
                      <input
                        type="text"
                        value={achForm.rank}
                        onChange={(e) => setAchForm({ ...achForm, rank: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Tingkat</label>
                      <select
                        value={achForm.level}
                        onChange={(e) => setAchForm({ ...achForm, level: e.target.value as any })}
                        className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 outline-none"
                      >
                        <option value="Sekolah">Sekolah</option>
                        <option value="Kecamatan">Kecamatan</option>
                        <option value="Kota">Kota</option>
                        <option value="Provinsi">Provinsi</option>
                        <option value="Nasional">Nasional</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setIsAddAchOpen(false)}
                      className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold uppercase tracking-wider"
                    >
                      Simpan Prestasi
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'violations' && (
        <div className="rounded-2xl bg-cream/80 border border-amber-500/20 shadow-xl overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-amber-500/20 bg-slate-50 text-slate-500 font-semibold uppercase">
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Nama Siswa</th>
                <th className="py-3 px-4">Kelas</th>
                <th className="py-3 px-4">Bentuk Catatan Pembinaan</th>
                <th className="py-3 px-4">Tindak Lanjut Konseling</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80">
              {violations.map(vio => (
                <tr key={vio.id} className="hover:bg-slate-100/50 transition">
                  <td className="py-3.5 px-4 font-mono text-slate-500">{vio.date}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">{vio.studentName}</td>
                  <td className="py-3.5 px-4 font-mono text-amber-700">{vio.classId}</td>
                  <td className="py-3.5 px-4 text-slate-800">{vio.type}</td>
                  <td className="py-3.5 px-4 text-emerald-600 font-semibold">{vio.actionTaken || 'Konseling Wali Kelas'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
