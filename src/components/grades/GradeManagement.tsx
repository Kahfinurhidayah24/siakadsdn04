import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { ALL_36_CLASSES } from '../../data/initialData';
import { GradeItem } from '../../types';
import { 
  Award, Filter, Lock, Unlock, Save, 
  FileSpreadsheet, CheckCircle2, AlertCircle, Sparkles 
} from 'lucide-react';
import { StudentGradesView } from './StudentGradesView';

interface GradeManagementProps {
  onNavigateToMassImport?: () => void;
}

export const GradeManagement: React.FC<GradeManagementProps> = ({ onNavigateToMassImport }) => {
  const { students, subjects, grades, saveGrade, lockGradesForClass, academicYear, semester, currentUser } = useSchool();

  // Jika akun yang login adalah Siswa, alihkan langsung ke tampilan nilai khusus siswa (read-only)
  if (currentUser.role === 'siswa') {
    return <StudentGradesView />;
  }

  const [selectedClass, setSelectedClass] = useState('4A');
  const [selectedSubject, setSelectedSubject] = useState(subjects[2]?.id || subjects[0]?.id); // default Bahasa Indonesia
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Class students
  const classStudents = students.filter(s => s.classId === selectedClass && s.status === 'Aktif');
  const currentSubject = subjects.find(s => s.id === selectedSubject) || subjects[0];

  // Local state for editing grades in current view
  const [tableData, setTableData] = useState<{ [studentId: string]: { formatif: number; uts: number; uas: number; description: string } }>({});

  // Initialize or get grade values
  const getGradeForStudent = (studentId: string) => {
    const existing = grades.find(g => 
      g.studentId === studentId && 
      g.subjectId === selectedSubject && 
      g.classId === selectedClass &&
      g.academicYear === academicYear &&
      g.semester === semester
    );
    return existing;
  };

  const handleScoreChange = (studentId: string, field: 'formatif' | 'uts' | 'uas', val: number) => {
    const num = Math.min(100, Math.max(0, isNaN(val) ? 0 : val));
    const current = tableData[studentId] || {
      formatif: getGradeForStudent(studentId)?.formatif ?? 85,
      uts: getGradeForStudent(studentId)?.uts ?? 85,
      uas: getGradeForStudent(studentId)?.uas ?? 85,
      description: getGradeForStudent(studentId)?.achievementDescription ?? `Menunjukkan pemahaman yang sangat baik dalam mencapai tujuan pembelajaran ${currentSubject.name}.`
    };

    setTableData({
      ...tableData,
      [studentId]: {
        ...current,
        [field]: num
      }
    });
  };

  const handleDescChange = (studentId: string, text: string) => {
    const current = tableData[studentId] || {
      formatif: getGradeForStudent(studentId)?.formatif ?? 85,
      uts: getGradeForStudent(studentId)?.uts ?? 85,
      uas: getGradeForStudent(studentId)?.uas ?? 85,
      description: ''
    };

    setTableData({
      ...tableData,
      [studentId]: {
        ...current,
        description: text
      }
    });
  };

  const handleSaveStudent = (std: typeof classStudents[0]) => {
    const data = tableData[std.id] || {
      formatif: getGradeForStudent(std.id)?.formatif ?? 85,
      uts: getGradeForStudent(std.id)?.uts ?? 85,
      uas: getGradeForStudent(std.id)?.uas ?? 85,
      description: getGradeForStudent(std.id)?.achievementDescription ?? `Menunjukkan penguasaan kompetensi yang baik pada mata pelajaran ${currentSubject.name}.`
    };

    const finalScore = Math.round((data.formatif * 0.4) + (data.uts * 0.3) + (data.uas * 0.3));
    const existing = getGradeForStudent(std.id);

    saveGrade({
      id: existing?.id,
      studentId: std.id,
      studentNisn: std.nisn,
      studentName: std.name,
      classId: selectedClass,
      subjectId: selectedSubject,
      subjectName: currentSubject.name,
      academicYear,
      semester,
      formatif: data.formatif,
      uts: data.uts,
      uas: data.uas,
      finalScore,
      achievementDescription: data.description,
      isLocked: existing?.isLocked || false
    });

    setSaveSuccessMsg(`Nilai ${std.name} berhasil disimpan!`);
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  const handleSaveAll = () => {
    classStudents.forEach(std => {
      handleSaveStudent(std);
    });
    setSaveSuccessMsg(`Seluruh nilai Kelas ${selectedClass} mapel ${currentSubject.name} berhasil disimpan!`);
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  const handleLockGrades = () => {
    if (confirm(`Kunci seluruh nilai ${currentSubject.name} Kelas ${selectedClass}? Setelah dikunci, data nilai diproteksi untuk pencetakan E-Rapor.`)) {
      lockGradesForClass(selectedClass, selectedSubject);
      setSaveSuccessMsg(`Nilai berhasil dikunci untuk E-Rapor.`);
      setTimeout(() => setSaveSuccessMsg(''), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-amber-500/20">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-serif-luxury flex items-center gap-2.5">
            <Award className="w-6 h-6 text-amber-700" />
            Penilaian Akademik & Capaian Pembelajaran (TP)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Input asesmen formatif, sumatif PTS, PAS, dan deskripsi capaian kompetensi E-Rapor Kurikulum Merdeka.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {onNavigateToMassImport && (
            <button
              onClick={onNavigateToMassImport}
              className="px-4 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-700 hover:bg-amber-500/25 text-xs font-semibold transition flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4 text-amber-700" />
              Import Nilai Massal (Excel)
            </button>
          )}

          <button
            onClick={handleSaveAll}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-xs uppercase tracking-wider shadow-md hover:scale-[1.02] transition flex items-center gap-2"
          >
            <Save className="w-4 h-4 text-slate-950" />
            Simpan Semua
          </button>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Selectors */}
      <div className="p-4 rounded-2xl bg-cream/80 border border-amber-500/20 grid grid-cols-1 sm:grid-cols-3 gap-4 shadow-lg">
        <div>
          <label className="block text-xs text-slate-500 mb-1 font-semibold">Pilih 36 Rombel Kelas:</label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-amber-700 font-mono font-bold focus:border-amber-400 outline-none"
          >
            {ALL_36_CLASSES.map(cls => (
              <option key={cls} value={cls}>Kelas {cls}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-slate-500 mb-1 font-semibold">Mata Pelajaran:</label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:border-amber-400 outline-none"
          >
            {subjects.map(sub => (
              <option key={sub.id} value={sub.id}>{sub.name} (KKM: {sub.kkm})</option>
            ))}
          </select>
        </div>

        <div className="flex items-end justify-between sm:justify-end gap-3">
          <button
            onClick={handleLockGrades}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-amber-700 text-xs font-semibold flex items-center gap-1.5 transition border border-slate-300"
            title="Kunci nilai agar tidak dapat diubah lagi oleh pengajar non-admin"
          >
            <Lock className="w-4 h-4 text-amber-700" />
            Kunci Nilai Rapor
          </button>
        </div>
      </div>

      {/* Grades Input Table */}
      <div className="rounded-2xl bg-cream/80 border border-amber-500/20 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-amber-500/20 bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">No</th>
                <th className="py-3 px-4">NISN & Nama Siswa</th>
                <th className="py-3 px-3 text-center w-24">Formatif (40%)</th>
                <th className="py-3 px-3 text-center w-24">PTS/UTS (30%)</th>
                <th className="py-3 px-3 text-center w-24">PAS/UAS (30%)</th>
                <th className="py-3 px-3 text-center w-24">Nilai Akhir</th>
                <th className="py-3 px-4">Deskripsi Capaian Kompetensi (TP)</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80">
              {classStudents.length > 0 ? (
                classStudents.map((std, idx) => {
                  const saved = getGradeForStudent(std.id);
                  const currentEdit = tableData[std.id];
                  const formatifVal = currentEdit ? currentEdit.formatif : (saved?.formatif ?? 85);
                  const utsVal = currentEdit ? currentEdit.uts : (saved?.uts ?? 85);
                  const uasVal = currentEdit ? currentEdit.uas : (saved?.uas ?? 85);
                  const finalCalculated = Math.round((formatifVal * 0.4) + (utsVal * 0.3) + (uasVal * 0.3));
                  const descVal = currentEdit ? currentEdit.description : (saved?.achievementDescription ?? `Menunjukkan penguasaan sangat baik dalam capaian pembelajaran ${currentSubject.name}.`);
                  const isLocked = saved?.isLocked;

                  return (
                    <tr key={std.id} className="hover:bg-slate-100/50 transition">
                      <td className="py-3.5 px-4 font-mono text-slate-500">{idx + 1}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-xs">{std.name}</div>
                        <div className="font-mono text-[10px] text-amber-700/80">NISN: {std.nisn}</div>
                      </td>

                      {/* Formatif */}
                      <td className="py-3.5 px-3 text-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          disabled={isLocked && currentUser.role !== 'admin'}
                          value={formatifVal}
                          onChange={(e) => handleScoreChange(std.id, 'formatif', parseInt(e.target.value))}
                          className="w-16 p-1.5 text-center rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 font-mono font-bold focus:border-amber-400 outline-none"
                        />
                      </td>

                      {/* PTS */}
                      <td className="py-3.5 px-3 text-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          disabled={isLocked && currentUser.role !== 'admin'}
                          value={utsVal}
                          onChange={(e) => handleScoreChange(std.id, 'uts', parseInt(e.target.value))}
                          className="w-16 p-1.5 text-center rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 font-mono font-bold focus:border-amber-400 outline-none"
                        />
                      </td>

                      {/* PAS */}
                      <td className="py-3.5 px-3 text-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          disabled={isLocked && currentUser.role !== 'admin'}
                          value={uasVal}
                          onChange={(e) => handleScoreChange(std.id, 'uas', parseInt(e.target.value))}
                          className="w-16 p-1.5 text-center rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 font-mono font-bold focus:border-amber-400 outline-none"
                        />
                      </td>

                      {/* Final Score */}
                      <td className="py-3.5 px-3 text-center font-mono font-extrabold text-amber-700 text-sm">
                        {finalCalculated}
                        {finalCalculated >= currentSubject.kkm ? (
                          <div className="text-[9px] text-emerald-600 font-sans font-semibold">Tuntas</div>
                        ) : (
                          <div className="text-[9px] text-red-600 font-sans font-semibold">Remedial</div>
                        )}
                      </td>

                      {/* Description */}
                      <td className="py-3.5 px-4">
                        <textarea
                          rows={2}
                          disabled={isLocked && currentUser.role !== 'admin'}
                          value={descVal}
                          onChange={(e) => handleDescChange(std.id, e.target.value)}
                          className="w-full p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:border-amber-400 outline-none leading-relaxed"
                          placeholder="Deskripsi pencapaian kompetensi..."
                        />
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleSaveStudent(std)}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-amber-700 text-xs font-semibold transition"
                        >
                          Simpan
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 text-xs">
                    Belum ada siswa aktif di Kelas {selectedClass}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
