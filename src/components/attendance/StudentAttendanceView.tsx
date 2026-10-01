import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { 
  CheckSquare, Calendar, Users, CheckCircle2, 
  AlertCircle, Clock, Sparkles, UserCheck, ShieldCheck,
  Award, TrendingUp, Info
} from 'lucide-react';

export const StudentAttendanceView: React.FC = () => {
  const { currentUser, students, attendance } = useSchool();

  // Cari data siswa yang sedang login
  const student = students.find(
    s => s.id === currentUser.referenceId || s.nisn === currentUser.username
  ) || students[0];

  // Rekap data presensi khusus siswa ini
  const myAttendance = attendance
    .filter(a => a.studentId === student.id || a.studentName === student.name)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const hadirCount = myAttendance.filter(a => a.status === 'Hadir').length;
  const sakitCount = myAttendance.filter(a => a.status === 'Sakit').length;
  const izinCount = myAttendance.filter(a => a.status === 'Izin').length;
  const alpaCount = myAttendance.filter(a => a.status === 'Alpa').length;
  const totalCatatan = myAttendance.length;

  const persenKehadiran = totalCatatan > 0 
    ? Math.round((hadirCount / totalCatatan) * 100) 
    : 100;

  const [filterStatus, setFilterStatus] = useState<'ALL' | 'Hadir' | 'Sakit' | 'Izin' | 'Alpa'>('ALL');

  const filteredList = filterStatus === 'ALL' 
    ? myAttendance 
    : myAttendance.filter(a => a.status === filterStatus);

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header Siswa - Read Only */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-amber-500/20">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-600 text-[11px] font-semibold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            Laporan Kehadiran Mandiri Siswa
          </div>
          <h2 className="text-xl font-bold text-slate-900 font-serif-luxury flex items-center gap-2.5">
            <CheckSquare className="w-6 h-6 text-amber-700" />
            Rekap Riwayat Presensi & Kehadiran
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Data absensi dicatat resmi oleh Wali Kelas & Guru Pengajar SDN Lubang Buaya 04 Pagi.
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-cream border border-slate-200 text-xs">
          <div className="text-slate-500 text-[11px]">Nama & Rombel:</div>
          <div className="font-bold text-slate-900">{student.name}</div>
          <div className="text-[11px] text-amber-700 font-mono">NISN: {student.nisn} • Kelas {student.classId}</div>
        </div>
      </div>

      {/* Notice Read-Only */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-700 space-y-1">
          <span className="font-bold text-amber-700">Hak Akses Siswa Terproteksi: </span>
          Siswa hanya memiliki hak akses untuk memantau rekap absensi. Pengisian status kehadiran hanya dapat diinput dan diverifikasi oleh Guru Pengajar, Wali Kelas, dan Administrator Sekolah.
        </div>
      </div>

      {/* Ringkasan Statistik Ketidakhadiran */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-cream/80 border border-emerald-500/30 shadow-lg text-center">
          <div className="text-[11px] text-emerald-600 uppercase font-semibold flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Hadir
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono mt-1">{hadirCount} Hari</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Tepat Waktu</div>
        </div>

        <div className="p-4 rounded-2xl bg-cream/80 border border-sky-500/30 shadow-lg text-center">
          <div className="text-[11px] text-sky-600 uppercase font-semibold flex items-center justify-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Sakit
          </div>
          <div className="text-2xl font-bold text-sky-600 font-mono mt-1">{sakitCount} Hari</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Surat Dokter</div>
        </div>

        <div className="p-4 rounded-2xl bg-cream/80 border border-amber-500/30 shadow-lg text-center">
          <div className="text-[11px] text-amber-700 uppercase font-semibold flex items-center justify-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            Izin
          </div>
          <div className="text-2xl font-bold text-amber-700 font-mono mt-1">{izinCount} Hari</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Surat Orang Tua</div>
        </div>

        <div className="p-4 rounded-2xl bg-cream/80 border border-red-500/30 shadow-lg text-center">
          <div className="text-[11px] text-red-600 uppercase font-semibold flex items-center justify-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            Alpa (Tanpa Ket.)
          </div>
          <div className="text-2xl font-bold text-red-600 font-mono mt-1">{alpaCount} Hari</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Tidak Hadir</div>
        </div>

        <div className="col-span-2 lg:col-span-1 p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-cream border border-indigo-500/30 shadow-lg text-center">
          <div className="text-[11px] text-indigo-600 uppercase font-semibold flex items-center justify-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            Persentase
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono mt-1">{persenKehadiran}%</div>
          <div className="text-[10px] text-indigo-600 mt-0.5">
            {persenKehadiran >= 90 ? 'Disiplin Sangat Baik' : persenKehadiran >= 80 ? 'Cukup Baik' : 'Perlu Perhatian'}
          </div>
        </div>
      </div>

      {/* Filter dan Riwayat Absensi */}
      <div className="rounded-2xl bg-cream/80 border border-amber-500/20 shadow-xl overflow-hidden space-y-4 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-900 font-serif-luxury flex items-center gap-2">
            <span>Riwayat Catatan Harian</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs font-mono font-normal">
              {filteredList.length} Catatan
            </span>
          </h3>

          {/* Filter Tab Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {(['ALL', 'Hadir', 'Sakit', 'Izin', 'Alpa'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setFilterStatus(tab)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
                  filterStatus === tab
                    ? 'bg-amber-500 text-white font-bold'
                    : 'bg-slate-50 text-slate-500 hover:text-slate-800 border border-slate-200'
                }`}
              >
                {tab === 'ALL' ? 'Semua Status' : tab}
              </button>
            ))}
          </div>
        </div>

        {/* Tabel Riwayat Kehadiran */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase font-semibold">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Tanggal Presensi</th>
                <th className="py-3 px-4 text-center">Status Kehadiran</th>
                <th className="py-3 px-4">Keterangan / Catatan Guru</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60">
              {filteredList.length > 0 ? (
                filteredList.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-100/30 transition">
                    <td className="py-3 px-4 text-center font-mono text-slate-500">{idx + 1}</td>
                    <td className="py-3 px-4 font-mono text-slate-800 font-medium">
                      {item.date}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${
                          item.status === 'Hadir'
                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600'
                            : item.status === 'Sakit'
                            ? 'bg-sky-500/15 border-sky-500/30 text-sky-600'
                            : item.status === 'Izin'
                            ? 'bg-amber-500/15 border-amber-500/30 text-amber-700'
                            : 'bg-red-500/15 border-red-500/30 text-red-600'
                        }`}
                      >
                        {item.status === 'Hadir' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        {item.status === 'Sakit' && <Clock className="w-3 h-3 text-sky-600" />}
                        {item.status === 'Izin' && <Calendar className="w-3 h-3 text-amber-700" />}
                        {item.status === 'Alpa' && <AlertCircle className="w-3 h-3 text-red-600" />}
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {item.notes ? (
                        <span className="text-slate-800">{item.notes}</span>
                      ) : (
                        <span className="text-slate-400 italic">- Tidak ada catatan khusus -</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500 text-xs">
                    Belum ada riwayat kehadiran dengan filter ini.
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
