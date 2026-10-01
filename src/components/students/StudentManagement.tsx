import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { ALL_36_CLASSES } from '../../data/initialData';
import { Student } from '../../types';
import { 
  Users, Search, Filter, Plus, Edit2, Trash2, 
  Download, Eye, Sparkles, X, CheckCircle2, Phone, 
  MapPin, ShieldAlert, CreditCard, FileSpreadsheet 
} from 'lucide-react';
import { ExcelImportModal } from './ExcelImportModal';

interface StudentManagementProps {
  onPrintCard?: (studentId: string) => void;
}

export const StudentManagement: React.FC<StudentManagementProps> = ({ onPrintCard }) => {
  const { students, addStudent, updateStudent, deleteStudent, generateNis, currentUser } = useSchool();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [selectedGradeLevel, setSelectedGradeLevel] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    nisn: '',
    nis: '',
    gender: 'L' as 'L' | 'P',
    birthPlace: 'Jakarta',
    birthDate: '2016-01-01',
    religion: 'Islam',
    address: '',
    phone: '',
    email: '',
    admissionYear: '2025',
    classId: '1A',
    status: 'Aktif' as Student['status'],
    parent: {
      fatherName: '',
      motherName: '',
      fatherOccupation: '',
      motherOccupation: '',
      phone: '',
      address: ''
    }
  });

  const [formError, setFormError] = useState('');

  // Handle open add modal
  const handleOpenAdd = () => {
    const autoNis = generateNis('2025');
    setFormData({
      name: '',
      nisn: '',
      nis: autoNis,
      gender: 'L',
      birthPlace: 'Jakarta',
      birthDate: '2016-01-01',
      religion: 'Islam',
      address: '',
      phone: '',
      email: '',
      admissionYear: '2025',
      classId: selectedClass !== 'ALL' ? selectedClass : '1A',
      status: 'Aktif',
      parent: {
        fatherName: '',
        motherName: '',
        fatherOccupation: '',
        motherOccupation: '',
        phone: '',
        address: ''
      }
    });
    setFormError('');
    setIsAddModalOpen(true);
  };

  // Handle open edit modal
  const handleOpenEdit = (std: Student) => {
    setEditingStudent(std);
    setFormData({
      name: std.name,
      nisn: std.nisn,
      nis: std.nis,
      gender: std.gender,
      birthPlace: std.birthPlace,
      birthDate: std.birthDate,
      religion: std.religion,
      address: std.address,
      phone: std.phone,
      email: std.email || '',
      admissionYear: std.admissionYear,
      classId: std.classId,
      status: std.status,
      parent: {
        fatherName: std.parent?.fatherName || '',
        motherName: std.parent?.motherName || '',
        fatherOccupation: std.parent?.fatherOccupation || '',
        motherOccupation: std.parent?.motherOccupation || '',
        phone: std.parent?.phone || '',
        address: std.parent?.address || ''
      }
    });
    setFormError('');
  };

  // Handle Submit Form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.nisn.trim()) {
      setFormError('Nama lengkap dan NISN wajib diisi!');
      return;
    }

    // NISN uniqueness check
    if (!editingStudent) {
      const exists = students.find(s => s.nisn === formData.nisn.trim());
      if (exists) {
        setFormError(`NISN ${formData.nisn} sudah terdaftar atas nama ${exists.name}!`);
        return;
      }
      addStudent(formData);
      setIsAddModalOpen(false);
    } else {
      const exists = students.find(s => s.nisn === formData.nisn.trim() && s.id !== editingStudent.id);
      if (exists) {
        setFormError(`NISN ${formData.nisn} sudah digunakan siswa lain!`);
        return;
      }
      updateStudent(editingStudent.id, formData);
      setEditingStudent(null);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['ID,NIS,NISN,Nama Lengkap,JK,Kelas,Tahun Masuk,Alamat,No HP,Nama Ayah,Nama Ibu'];
    const rows = filteredStudents.map(s => 
      `"${s.id}","${s.nis}","${s.nisn}","${s.name}","${s.gender}","${s.classId}","${s.admissionYear}","${s.address.replace(/"/g, '""')}","${s.phone}","${s.parent.fatherName}","${s.parent.motherName}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DATA_SISWA_SDN_LB04_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter students
  const filteredStudents = students.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.nisn.includes(searchTerm) ||
      s.nis.includes(searchTerm);
    
    const matchClass = selectedClass === 'ALL' || s.classId === selectedClass;
    const matchGrade = selectedGradeLevel === 'ALL' || s.classId.startsWith(selectedGradeLevel);

    return matchSearch && matchClass && matchGrade;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-amber-500/20">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-serif-luxury flex items-center gap-2.5">
            <Users className="w-6 h-6 text-amber-700" />
            Manajemen Peserta Didik (36 Rombel Kelas)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Data pokok siswa terintegrasi untuk E-Rapor, Presensi, Kartu Pelajar, dan Mutasi. Total {students.length} siswa terdaftar.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          <button
            id="btn-export-students"
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-cream border border-slate-300 hover:border-amber-400 text-slate-800 text-xs font-semibold transition flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4 text-amber-700" />
            Export CSV
          </button>
          {currentUser.role === 'admin' && (
            <>
              <button
                id="btn-import-excel-students"
                onClick={() => setIsExcelModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-600 hover:text-emerald-800 text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                Import Excel (.xlsx)
              </button>
              <button
                id="btn-add-student"
                onClick={handleOpenAdd}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-95 transition flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-slate-950" />
                Tambah Siswa
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="p-4 rounded-2xl bg-cream/80 border border-amber-500/20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 shadow-lg">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="input-search-student"
            type="text"
            placeholder="Cari nama, NISN, atau NIS..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
          />
        </div>

        {/* Filter Tingkat Kelas */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 whitespace-nowrap">Tingkat:</span>
          <select
            id="select-grade-level"
            value={selectedGradeLevel}
            onChange={(e) => {
              setSelectedGradeLevel(e.target.value);
              setSelectedClass('ALL');
            }}
            className="w-full py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-amber-400"
          >
            <option value="ALL">Semua Tingkat (1 - 6)</option>
            <option value="1">Kelas 1</option>
            <option value="2">Kelas 2</option>
            <option value="3">Kelas 3</option>
            <option value="4">Kelas 4</option>
            <option value="5">Kelas 5</option>
            <option value="6">Kelas 6</option>
          </select>
        </div>

        {/* Filter 36 Kelas Rombel */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 whitespace-nowrap">Rombel:</span>
          <select
            id="select-class-rombel"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-amber-400 font-mono"
          >
            <option value="ALL">Semua 36 Kelas</option>
            {ALL_36_CLASSES
              .filter(c => selectedGradeLevel === 'ALL' || c.startsWith(selectedGradeLevel))
              .map(cls => (
                <option key={cls} value={cls}>Kelas {cls}</option>
              ))
            }
          </select>
        </div>

        <div className="text-right flex items-center justify-end text-xs text-amber-700 font-medium font-mono">
          Ditemukan: {filteredStudents.length} Siswa
        </div>
      </div>

      {/* Students Data Table */}
      <div className="rounded-2xl bg-cream/80 border border-amber-500/20 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-amber-500/20 bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">No</th>
                <th className="py-3 px-4">NIS / NISN</th>
                <th className="py-3 px-4">Nama Lengkap</th>
                <th className="py-3 px-4">JK</th>
                <th className="py-3 px-4">Kelas</th>
                <th className="py-3 px-4">Orang Tua</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((std, idx) => (
                  <tr key={std.id} className="hover:bg-slate-100/50 transition-colors group">
                    <td className="py-3.5 px-4 font-mono text-slate-500">{idx + 1}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-amber-700 font-bold">{std.nisn}</div>
                      <div className="font-mono text-[10px] text-slate-500">NIS: {std.nis}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-xs group-hover:text-amber-700 transition">
                        {std.name}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {std.birthPlace}, {std.birthDate}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${std.gender === 'L' ? 'bg-blue-500/15 text-blue-600' : 'bg-pink-500/15 text-pink-300'}`}>
                        {std.gender === 'L' ? 'L' : 'P'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-700 font-bold font-mono">
                        {std.classId}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-800">{std.parent.fatherName || std.parent.motherName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{std.parent.phone}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 text-[10px] font-semibold border border-emerald-500/30">
                        {std.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setViewingStudent(std)}
                          className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:text-amber-700 hover:bg-slate-200 transition"
                          title="Lihat Profil Siswa"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {onPrintCard && (
                          <button
                            onClick={() => onPrintCard(std.id)}
                            className="p-1.5 rounded-lg bg-slate-100 text-amber-700 hover:text-amber-800 hover:bg-slate-200 transition"
                            title="Cetak Kartu Pelajar"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {currentUser.role === 'admin' && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(std)}
                              className="p-1.5 rounded-lg bg-slate-100 text-sky-600 hover:text-sky-800 hover:bg-slate-200 transition"
                              title="Edit Data Siswa"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Yakin ingin menghapus data siswa ${std.name} (${std.nisn})?`)) {
                                  deleteStudent(std.id);
                                }
                              }}
                              className="p-1.5 rounded-lg bg-slate-100 text-red-600 hover:text-red-800 hover:bg-slate-200 transition"
                              title="Hapus Siswa"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 text-xs">
                    Tidak ada data siswa yang cocok dengan kriteria pencarian / rombel ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add or Edit Student */}
      {(isAddModalOpen || editingStudent) && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-cream border border-amber-500/30 rounded-3xl p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 font-serif-luxury flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-700" />
                {editingStudent ? 'Edit Data Peserta Didik' : 'Pendaftaran Siswa Baru (Otomatis Buat Akun)'}
              </h3>
              <button
                onClick={() => { setIsAddModalOpen(false); setEditingStudent(null); }}
                className="text-slate-500 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-600 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Nama Lengkap Siswa *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:border-amber-400 outline-none"
                    placeholder="Contoh: Muhammad Farhan Al-Fatih"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">NISN (Identitas Unik 10 Digit) *</label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={formData.nisn}
                    onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-amber-700 font-mono focus:border-amber-400 outline-none"
                    placeholder="0098765432"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">NIS (Nomor Induk Sekolah Otomatis)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.nis}
                      onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-mono outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, nis: generateNis(formData.admissionYear) })}
                      className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-amber-700 text-[10px] font-semibold"
                    >
                      Auto
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Alokasi 36 Rombel Kelas *</label>
                  <select
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:border-amber-400 outline-none font-mono"
                  >
                    {ALL_36_CLASSES.map(cls => (
                      <option key={cls} value={cls}>Kelas {cls}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Jenis Kelamin</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'L' | 'P' })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 outline-none"
                  >
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Agama</label>
                  <select
                    value={formData.religion}
                    onChange={(e) => setFormData({ ...formData, religion: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 outline-none"
                  >
                    <option value="Islam">Islam</option>
                    <option value="Kristen">Kristen Protestan</option>
                    <option value="Katolik">Katolik</option>
                    <option value="Hindu">Hindu</option>
                    <option value="Buddha">Buddha</option>
                    <option value="Konghucu">Konghucu</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Tempat Lahir</label>
                  <input
                    type="text"
                    value={formData.birthPlace}
                    onChange={(e) => setFormData({ ...formData, birthPlace: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Tanggal Lahir</label>
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 outline-none"
                  />
                </div>
              </div>

              {/* Data Orang Tua */}
              <div className="pt-3 border-t border-slate-200 space-y-2">
                <div className="font-bold text-amber-700 text-xs">Data Orang Tua / Wali</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 mb-0.5">Nama Ayah</label>
                    <input
                      type="text"
                      value={formData.parent.fatherName}
                      onChange={(e) => setFormData({
                        ...formData,
                        parent: { ...formData.parent, fatherName: e.target.value }
                      })}
                      className="w-full p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-0.5">Nama Ibu</label>
                    <input
                      type="text"
                      value={formData.parent.motherName}
                      onChange={(e) => setFormData({
                        ...formData,
                        parent: { ...formData.parent, motherName: e.target.value }
                      })}
                      className="w-full p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-0.5">No. HP Orang Tua / WhatsApp</label>
                    <input
                      type="text"
                      value={formData.parent.phone}
                      onChange={(e) => setFormData({
                        ...formData,
                        parent: { ...formData.parent, phone: e.target.value }
                      })}
                      className="w-full p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 outline-none"
                      placeholder="0812xxxxxxxx"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-0.5">Pekerjaan Orang Tua</label>
                    <input
                      type="text"
                      value={formData.parent.fatherOccupation}
                      onChange={(e) => setFormData({
                        ...formData,
                        parent: { ...formData.parent, fatherOccupation: e.target.value }
                      })}
                      className="w-full p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-0.5">Alamat Lengkap</label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 outline-none"
                  placeholder="Jl. Lubang Buaya RT/RW..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => { setIsAddModalOpen(false); setEditingStudent(null); }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold uppercase tracking-wider"
                >
                  {editingStudent ? 'Simpan Perubahan' : 'Daftarkan & Generate Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Student Detail */}
      {viewingStudent && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-cream border border-amber-500/30 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 font-serif-luxury">
                Biodata Peserta Didik
              </h3>
              <button onClick={() => setViewingStudent(null)} className="text-slate-500 hover:text-slate-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xl font-bold text-amber-700">
                  {viewingStudent.name.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">{viewingStudent.name}</div>
                  <div className="text-amber-700 font-mono text-xs">NISN: {viewingStudent.nisn} • NIS: {viewingStudent.nis}</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">Rombel: Kelas {viewingStudent.classId}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <span className="text-slate-500">Tempat, Tgl Lahir:</span>
                  <div className="text-slate-800 font-medium">{viewingStudent.birthPlace}, {viewingStudent.birthDate}</div>
                </div>
                <div>
                  <span className="text-slate-500">Jenis Kelamin:</span>
                  <div className="text-slate-800 font-medium">{viewingStudent.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</div>
                </div>
                <div>
                  <span className="text-slate-500">Agama:</span>
                  <div className="text-slate-800 font-medium">{viewingStudent.religion}</div>
                </div>
                <div>
                  <span className="text-slate-500">Tahun Masuk:</span>
                  <div className="text-slate-800 font-medium">{viewingStudent.admissionYear}</div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <span className="text-slate-500">Data Orang Tua / Wali:</span>
                <div className="text-slate-800 font-medium mt-0.5">
                  {viewingStudent.parent.fatherName} & {viewingStudent.parent.motherName}
                </div>
                <div className="text-amber-700/80 font-mono mt-0.5">HP: {viewingStudent.parent.phone}</div>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <span className="text-slate-500">Alamat:</span>
                <div className="text-slate-800 mt-0.5">{viewingStudent.address}</div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setViewingStudent(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:text-slate-900 text-xs font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Import Data Siswa Excel */}
      <ExcelImportModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
      />
    </div>
  );
};
