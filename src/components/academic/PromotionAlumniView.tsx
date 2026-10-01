import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { ALL_36_CLASSES } from '../../data/initialData';
import { 
  ArrowUpRight, Award, Users, CheckCircle2, 
  GraduationCap, AlertTriangle, ShieldCheck 
} from 'lucide-react';

export const PromotionAlumniView: React.FC = () => {
  const { students, promoteClass, graduateStudents, currentUser } = useSchool();

  const [fromClass, setFromClass] = useState('1A');
  const [toClass, setToClass] = useState('2A');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [successMsg, setSuccessMsg] = useState('');

  // Class 6 Graduation state
  const [gradClass, setGradClass] = useState('6A');
  const [gradDate, setGradDate] = useState('2026-06-20');

  const sourceStudents = students.filter(s => s.classId === fromClass && s.status === 'Aktif');
  const class6Students = students.filter(s => s.classId === gradClass && s.status === 'Aktif');
  const alumniStudents = students.filter(s => s.status === 'Lulus');

  // Toggle selection for promotion
  const toggleSelectStudent = (id: string) => {
    setSelectedStudentIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const selectAllSource = () => {
    if (selectedStudentIds.length === sourceStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(sourceStudents.map(s => s.id));
    }
  };

  const handlePromote = () => {
    if (selectedStudentIds.length === 0) {
      alert('Pilih siswa yang akan dinaikkan kelas terlebih dahulu!');
      return;
    }
    promoteClass(fromClass, toClass, selectedStudentIds);
    setSuccessMsg(`Berhasil menaikkan ${selectedStudentIds.length} siswa dari Kelas ${fromClass} ke Kelas ${toClass}!`);
    setSelectedStudentIds([]);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleGraduate = () => {
    if (class6Students.length === 0) {
      alert('Tidak ada siswa aktif di kelas ini!');
      return;
    }
    if (confirm(`Yakin ingin meluluskan seluruh ${class6Students.length} siswa Kelas ${gradClass}?`)) {
      graduateStudents(class6Students.map(s => s.id), gradDate);
      setSuccessMsg(`Selamat! ${class6Students.length} siswa Kelas ${gradClass} resmi dinyatakan LULUS sebagai Alumni SDN Lubang Buaya 04 Pagi.`);
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-amber-500/20">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-serif-luxury flex items-center gap-2.5">
            <ArrowUpRight className="w-6 h-6 text-amber-700" />
            Kenaikan Kelas & Manajemen Kelulusan Alumni (36 Rombel)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Proses transisi akademik akhir tahun ajaran untuk seluruh rombongan belajar 1A - 6G dan arsip buku induk alumni.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Grid: Promotion vs Graduation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Promotion Module */}
        <div className="p-6 rounded-3xl bg-cream/80 border border-amber-500/20 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 font-serif-luxury flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-700" />
              Proses Kenaikan Kelas Rombel
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 border border-amber-500/30 font-mono">
              Akhir Semester
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-500 mb-1">Dari Kelas Asal:</label>
              <select
                value={fromClass}
                onChange={(e) => {
                  setFromClass(e.target.value);
                  setSelectedStudentIds([]);
                }}
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-amber-700 font-mono font-bold outline-none"
              >
                {ALL_36_CLASSES.filter(c => !c.startsWith('6')).map(c => (
                  <option key={c} value={c}>Kelas {c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-500 mb-1">Ke Kelas Tujuan:</label>
              <select
                value={toClass}
                onChange={(e) => setToClass(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-amber-700 font-mono font-bold outline-none"
              >
                {ALL_36_CLASSES.filter(c => !c.startsWith('1')).map(c => (
                  <option key={c} value={c}>Kelas {c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Student selection table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
            <div className="bg-slate-50 p-2.5 flex items-center justify-between border-b border-slate-200 text-[11px]">
              <button
                type="button"
                onClick={selectAllSource}
                className="text-amber-700 hover:underline font-semibold"
              >
                {selectedStudentIds.length === sourceStudents.length ? 'Batalkan Semua' : 'Pilih Semua Siswa'}
              </button>
              <span className="text-slate-500 font-mono">{selectedStudentIds.length} dari {sourceStudents.length} dipilih</span>
            </div>

            <div className="max-h-48 overflow-y-auto divide-y divide-slate-200 p-1">
              {sourceStudents.map(std => (
                <label key={std.id} className="flex items-center gap-3 p-2 hover:bg-slate-100 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedStudentIds.includes(std.id)}
                    onChange={() => toggleSelectStudent(std.id)}
                    className="rounded accent-amber-500 w-4 h-4"
                  />
                  <div className="flex-1">
                    <div className="font-bold text-slate-900 text-xs">{std.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">NISN: {std.nisn}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {currentUser.role === 'admin' && (
            <button
              onClick={handlePromote}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-xs uppercase tracking-wider shadow-md hover:scale-[1.01] transition"
            >
              Proses Naik Kelas Sekarang
            </button>
          )}
        </div>

        {/* Graduation Module (Kelas 6) */}
        <div className="p-6 rounded-3xl bg-cream/80 border border-amber-500/20 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 font-serif-luxury flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-amber-700" />
              Kelulusan Tingkat Akhir (Kelas 6)
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 font-mono">
              Fase C Lulus
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-500 mb-1">Rombel Kelas 6:</label>
              <select
                value={gradClass}
                onChange={(e) => setGradClass(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-amber-700 font-mono font-bold outline-none"
              >
                {ALL_36_CLASSES.filter(c => c.startsWith('6')).map(c => (
                  <option key={c} value={c}>Kelas {c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-500 mb-1">Tanggal Kelulusan Resmi:</label>
              <input
                type="date"
                value={gradDate}
                onChange={(e) => setGradDate(e.target.value)}
                className="w-full p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 outline-none text-xs"
              />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-cream/80 border border-slate-200 text-xs space-y-2">
            <div className="text-slate-700 font-semibold">
              Jumlah Calon Lulusan di Kelas {gradClass}:
            </div>
            <div className="text-2xl font-bold text-slate-900 font-serif-luxury">
              {class6Students.length} Peserta Didik
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Setelah diproses, status peserta didik akan dialihkan ke buku induk Alumni dan nomor ijazah dapat diisikan.
            </p>
          </div>

          {currentUser.role === 'admin' && (
            <button
              onClick={handleGraduate}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-md hover:scale-[1.01] transition"
            >
              Terbitkan Kelulusan Kelas {gradClass}
            </button>
          )}

          {/* Alumni quick count */}
          <div className="pt-2 text-xs text-slate-500 flex items-center justify-between border-t border-slate-200">
            <span>Total Alumni Terdata:</span>
            <span className="text-amber-700 font-mono font-bold">{alumniStudents.length} Siswa</span>
          </div>
        </div>
      </div>
    </div>
  );
};
