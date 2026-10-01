import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { ALL_36_CLASSES } from '../../data/initialData';
import { Teacher } from '../../types';
import { 
  GraduationCap, Search, Plus, Edit2, Trash2, 
  Sparkles, CheckCircle2, Phone, Mail, X, ShieldAlert 
} from 'lucide-react';

export const TeacherManagement: React.FC = () => {
  const { teachers, addTeacher, updateTeacher, deleteTeacher, assignWaliKelas, currentUser } = useSchool();

  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [assignModalTeacher, setAssignModalTeacher] = useState<Teacher | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    nip: '',
    nuptk: '',
    name: '',
    gender: 'L' as 'L' | 'P',
    birthPlace: 'Jakarta',
    birthDate: '1985-01-01',
    phone: '',
    email: '',
    subjects: ['Bahasa Indonesia'],
    isWaliKelas: false,
    assignedClass: '',
    status: 'PNS' as 'PNS' | 'PPPK' | 'Honorer'
  });

  const [subjectInput, setSubjectInput] = useState('Matematika');

  const filteredTeachers = teachers.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.nip.includes(searchTerm) ||
    (t.assignedClass && t.assignedClass.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleOpenAdd = () => {
    setFormData({
      nip: '1985' + Math.floor(10000000000000 + Math.random() * 9000000000000),
      nuptk: Math.floor(1000000000000000 + Math.random() * 9000000000000000).toString(),
      name: '',
      gender: 'L',
      birthPlace: 'Jakarta',
      birthDate: '1985-01-01',
      phone: '0812' + Math.floor(10000000 + Math.random() * 90000000),
      email: '',
      subjects: ['Pendidikan Pancasila'],
      isWaliKelas: false,
      assignedClass: '',
      status: 'PNS'
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (tch: Teacher) => {
    setEditingTeacher(tch);
    setFormData({
      nip: tch.nip,
      nuptk: tch.nuptk || '',
      name: tch.name,
      gender: tch.gender,
      birthPlace: tch.birthPlace,
      birthDate: tch.birthDate,
      phone: tch.phone,
      email: tch.email,
      subjects: [...tch.subjects],
      isWaliKelas: tch.isWaliKelas,
      assignedClass: tch.assignedClass || '',
      status: tch.status
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingTeacher) {
      updateTeacher(editingTeacher.id, formData);
      setEditingTeacher(null);
    } else {
      addTeacher(formData);
      setIsAddModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-amber-500/20">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-serif-luxury flex items-center gap-2.5">
            <GraduationCap className="w-6 h-6 text-amber-700" />
            Manajemen Dewan Guru & Penugasan Wali Kelas
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pengelolaan data pengajar dan penugasan wali kelas untuk 36 rombongan belajar SDN Lubang Buaya 04 Pagi.
          </p>
        </div>

        {currentUser.role === 'admin' && (
          <button
            id="btn-add-teacher"
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-95 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            Tambah Dewan Guru
          </button>
        )}
      </div>

      {/* Filter and Search */}
      <div className="p-4 rounded-2xl bg-cream/80 border border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama guru, NIP, atau kelas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
          />
        </div>

        <div className="text-xs text-amber-700 font-mono font-medium">
          Total Tenaga Pendidik: {teachers.length} Guru
        </div>
      </div>

      {/* Teachers Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTeachers.map(tch => (
          <div key={tch.id} className="rounded-2xl bg-cream/80 border border-amber-500/20 p-5 shadow-xl space-y-3 relative group hover:border-amber-500/40 transition">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-100 border border-amber-500/30 flex items-center justify-center font-bold text-amber-700 text-base">
                  {tch.name.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 group-hover:text-amber-700 transition">
                    {tch.name}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    NIP: {tch.nip}
                  </div>
                </div>
              </div>

              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${tch.status === 'PNS' ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30' : 'bg-sky-500/15 text-sky-600 border border-sky-500/30'}`}>
                {tch.status}
              </span>
            </div>

            {/* Wali Kelas Status Badge */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className={`w-4 h-4 ${tch.isWaliKelas ? 'text-amber-700' : 'text-slate-400'}`} />
                <span className="text-slate-700 font-medium">Tugas Wali Kelas:</span>
              </div>
              {tch.isWaliKelas && tch.assignedClass ? (
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-700 border border-amber-500/30 font-bold font-mono">
                  Kelas {tch.assignedClass}
                </span>
              ) : (
                <span className="text-slate-500 text-[11px]">Guru Mata Pelajaran</span>
              )}
            </div>

            {/* Subject info */}
            <div className="text-xs space-y-1">
              <div className="text-slate-500 text-[11px]">Mata Pelajaran:</div>
              <div className="flex flex-wrap gap-1">
                {tch.subjects.map((sub, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[10px]">
                    {sub}
                  </span>
                ))}
              </div>
            </div>

            {/* Contacts */}
            <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3 text-amber-700" />
                {tch.phone}
              </span>
              <span className="truncate max-w-[130px]">{tch.email}</span>
            </div>

            {/* Action buttons */}
            {currentUser.role === 'admin' && (
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <button
                  onClick={() => setAssignModalTeacher(tch)}
                  className="text-xs text-amber-700 hover:text-amber-700 font-semibold flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Atur Wali Kelas
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(tch)}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-sky-600 transition"
                    title="Edit Profil"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Hapus data pengajar ${tch.name}?`)) {
                        deleteTeacher(tch.id);
                      }
                    }}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-red-600 transition"
                    title="Hapus"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal: Assign Wali Kelas to 36 Classes */}
      {assignModalTeacher && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-cream border border-amber-500/30 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 font-serif-luxury flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-700" />
                Penetapan Wali Kelas
              </h3>
              <button onClick={() => setAssignModalTeacher(null)} className="text-slate-500 hover:text-slate-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-700">
              Tetapkan rombel kelas tanggung jawab untuk guru:
              <div className="font-bold text-amber-700 text-sm mt-1">{assignModalTeacher.name}</div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs text-slate-500">Pilih dari 36 Rombongan Belajar:</label>
              <select
                defaultValue={assignModalTeacher.assignedClass || '1A'}
                id="select-assign-class"
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-amber-700 font-mono font-bold focus:border-amber-400 outline-none"
              >
                {ALL_36_CLASSES.map(cls => (
                  <option key={cls} value={cls}>Kelas {cls}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setAssignModalTeacher(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  const select = document.getElementById('select-assign-class') as HTMLSelectElement;
                  if (select) {
                    assignWaliKelas(assignModalTeacher.id, select.value);
                    setAssignModalTeacher(null);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-bold uppercase tracking-wider"
              >
                Tetapkan Wali Kelas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add or Edit Teacher */}
      {(isAddModalOpen || editingTeacher) && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-cream border border-amber-500/30 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 font-serif-luxury">
                {editingTeacher ? 'Edit Data Pengajar' : 'Tambah Tenaga Pendidik'}
              </h3>
              <button onClick={() => { setIsAddModalOpen(false); setEditingTeacher(null); }} className="text-slate-500 hover:text-slate-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Nama Lengkap & Gelar *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 outline-none"
                  placeholder="Contoh: Dra. Sri Mulyani, M.Pd"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">NIP (18 Digit)</label>
                  <input
                    type="text"
                    value={formData.nip}
                    onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-amber-700 font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Status Kepegawaian</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'PNS' | 'PPPK' | 'Honorer' })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 outline-none"
                  >
                    <option value="PNS">PNS</option>
                    <option value="PPPK">PPPK</option>
                    <option value="Honorer">Guru Tidak Tetap / Honorer</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Nomor WhatsApp / HP</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Email Sekolah / Pribadi</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => { setIsAddModalOpen(false); setEditingTeacher(null); }}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold uppercase tracking-wider"
                >
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
