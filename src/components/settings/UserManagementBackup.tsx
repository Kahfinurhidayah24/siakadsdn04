import React, { useState, useMemo, useEffect } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { 
  UserPlus, Database, Download, Upload, 
  KeyRound, ShieldCheck, CheckCircle2, Copy, Terminal, 
  FileCode2, Table, Eye, Search, Sparkles, Server, Check,
  Play, HelpCircle, AlertCircle
} from 'lucide-react';
import { generateSqlDump, downloadSqlBlob } from '../../utils/sqlExporter';
import { executeSqlInMemory, SqlQueryResult } from '../../utils/sqlRunner';
import type { Role } from '../../types';
import { ResetRequestsPanel } from './ResetRequestsPanel';

interface AccountRow { id: string; name: string; username: string; role: Role; referenceId?: string }

export const UserManagementBackup: React.FC = () => {
  const { 
    userAccounts, 
    resetUserPassword, 
    backupDatabase, 
    restoreDatabase, 
    schoolProfile,
    teachers,
    students,
    subjects,
    grades,
    attendance,
    calendar,
    addStudent,
    updateStudent,
    dbStatus,
    dbMessage,
    dbLastSync,
    dbPending,
    reloadFromDb,
    pushAllToDb
  } = useSchool();

  const [activeSubTab, setActiveSubTab] = useState<'sql' | 'users' | 'backup'>('sql');
  const [resetModalUser, setResetModalUser] = useState<AccountRow | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetBusy, setResetBusy] = useState(false);
  const [accountSearch, setAccountSearch] = useState('');
  const [customPwKeys, setCustomPwKeys] = useState<Record<string, string>>({});
  const [successNotice, setSuccessNotice] = useState('');
  const [copiedSql, setCopiedSql] = useState(false);
  const [sqlSearch, setSqlSearch] = useState('');

  // Daftar akun lengkap: akun yang sudah ada + SEMUA guru & siswa (agar semuanya bisa direset)
  const accountRows = useMemo<AccountRow[]>(() => {
    const rows: AccountRow[] = userAccounts.map(u => ({
      id: u.id, name: u.name, username: u.username, role: u.role, referenceId: u.referenceId,
    }));
    const have = new Set(rows.filter(r => r.referenceId).map(r => `${r.role}:${r.referenceId}`));
    for (const t of teachers) {
      if (!have.has(`guru:${t.id}`)) rows.push({ id: `usr-${t.id}`, name: t.name, username: t.nip, role: 'guru', referenceId: t.id });
    }
    for (const st of students) {
      if (!have.has(`siswa:${st.id}`)) rows.push({ id: `usr-${st.id}`, name: st.name, username: st.nisn, role: 'siswa', referenceId: st.id });
    }
    return rows;
  }, [userAccounts, teachers, students]);

  const visibleRows = useMemo(() => {
    const q = accountSearch.trim().toLowerCase();
    const list = q
      ? accountRows.filter(r => r.name.toLowerCase().includes(q) || r.username.toLowerCase().includes(q) || r.role.includes(q))
      : accountRows;
    return list;
  }, [accountRows, accountSearch]);

  const ROW_LIMIT = 100;

  const hasCustomPassword = (r: AccountRow) => {
    if (r.role === 'kepsek') return !!customPwKeys['kepsek:kepsek'];
    if (r.role === 'admin') return true;
    return (!!r.referenceId && !!customPwKeys[`${r.role}:${r.referenceId}`]) ||
      (r.username.toLowerCase() === r.role && !!customPwKeys[`${r.role}:demo`]);
  };

  const loadCustomPwKeys = () => {
    fetch('/api/admin/user-password/list').then(r => r.json()).then(d => setCustomPwKeys(d?.keys || {})).catch(() => {});
  };
  useEffect(() => { if (activeSubTab === 'users') loadCustomPwKeys(); }, [activeSubTab]);

  const generatePassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const buf = new Uint32Array(10);
    crypto.getRandomValues(buf);
    let out = '';
    for (const n of buf) out += chars[n % chars.length];
    return out.slice(0, 8) + '7' + 'a'; // dijamin ada huruf & angka
  };

  // Interactive SQL Runner State
  const [userSqlQuery, setUserSqlQuery] = useState("SELECT * FROM siswa WHERE kelas_id = '4A';");
  const [sqlQueryResult, setSqlQueryResult] = useState<SqlQueryResult | null>(null);

  // Live MySQL XAMPP Status & Sync
  const [mysqlStatus, setMysqlStatus] = useState<{ connected: boolean; message: string; database?: string; tables?: string[]; counts?: Record<string, number> } | null>(null);
  const [checkingMysql, setCheckingMysql] = useState(false);
  const [syncingMysql, setSyncingMysql] = useState(false);

  useEffect(() => {
    // Tampilkan jumlah data tiap tabel begitu halaman dibuka
    fetch('/api/db/status').then((r) => r.json()).then(setMysqlStatus).catch(() => {});
  }, []);

  const handleCheckMysql = async () => {
    setCheckingMysql(true);
    try {
      const res = await fetch('/api/db/status');
      const data = await res.json();
      setMysqlStatus(data);
      if (data.connected) {
        setSuccessNotice(`Terhubung ke MySQL: ${data.tables?.length || 0} tabel terdeteksi di database "${data.database}".`);
      } else {
        setSuccessNotice('MySQL belum tersambung. Pastikan MySQL di XAMPP sudah di-START.');
      }
      setTimeout(() => setSuccessNotice(''), 4500);
    } catch (err: any) {
      setMysqlStatus({
        connected: false,
        message: 'Server belum merespon. Pastikan aplikasi dijalankan dengan "npm run dev" dan MySQL di XAMPP aktif.'
      });
    } finally {
      setCheckingMysql(false);
    }
  };

  // Kirim seluruh data yang ada di aplikasi (browser) ke MySQL
  const handleSyncToMysql = async () => {
    setSyncingMysql(true);
    try {
      const r = await pushAllToDb();
      if (r.ok) {
        const s = r.result?.synced || {};
        setSuccessNotice(`Selesai! ${s.students ?? 0} siswa, ${s.teachers ?? 0} guru, ${s.grades ?? 0} nilai, ${s.attendance ?? 0} presensi dikirim ke MySQL.`);
        handleCheckMysql();
      } else {
        alert(r.message || 'Gagal sinkronisasi');
      }
      setTimeout(() => setSuccessNotice(''), 5500);
    } finally {
      setSyncingMysql(false);
    }
  };

  // Ambil ulang data dari MySQL (mis. setelah mengubah data di phpMyAdmin)
  const handleReloadFromMysql = async () => {
    if (dbStatus === 'conflict' || dbPending) {
      const ok = window.confirm('Ada perubahan di aplikasi yang belum tersimpan ke MySQL. Memuat ulang dari MySQL akan MENGGANTI data di aplikasi dengan isi database. Lanjutkan?');
      if (!ok) return;
    }
    setSyncingMysql(true);
    try {
      const ok = await reloadFromDb();
      setSuccessNotice(ok ? 'Data berhasil dimuat ulang dari MySQL (sesuai isi phpMyAdmin).' : 'Gagal memuat dari MySQL. Cek koneksi MySQL Anda.');
      handleCheckMysql();
      setTimeout(() => setSuccessNotice(''), 4500);
    } finally {
      setSyncingMysql(false);
    }
  };

  // Generate dynamic live SQL script from current context
  const liveSqlScript = useMemo(() => {
    return generateSqlDump({
      schoolProfile,
      userAccounts,
      teachers,
      students,
      subjects,
      grades,
      attendance,
      calendar
    });
  }, [schoolProfile, userAccounts, teachers, students, subjects, grades, attendance, calendar]);

  const handleDownloadSql = () => {
    const filename = `siakad_sdn_lubang_buaya_04_${new Date().toISOString().slice(0, 10)}.sql`;
    downloadSqlBlob(liveSqlScript, filename);
    setSuccessNotice(`File database SQL "${filename}" berhasil diunduh! Siap diimpor ke MySQL/phpMyAdmin/PostgreSQL.`);
    setTimeout(() => setSuccessNotice(''), 4500);
  };

  const handleCopySql = async () => {
    try {
      await navigator.clipboard.writeText(liveSqlScript);
      setCopiedSql(true);
      setSuccessNotice('Seluruh skrip SQL DDL & DML berhasil disalin ke clipboard!');
      setTimeout(() => setCopiedSql(false), 3000);
      setTimeout(() => setSuccessNotice(''), 3000);
    } catch (e) {
      setSuccessNotice('Gagal menyalin otomatis, silakan unduh berkas .sql');
    }
  };

  const handleExecuteSql = () => {
    const result = executeSqlInMemory(userSqlQuery, {
      students,
      teachers,
      grades,
      subjects,
      userAccounts,
      attendance,
      calendar,
      schoolProfile,
      addStudent,
      updateStudent
    });
    setSqlQueryResult(result);
    if (result.message) {
      setSuccessNotice(result.message);
      setTimeout(() => setSuccessNotice(''), 4000);
    }
  };

  const handleBackup = () => {
    const jsonStr = backupDatabase();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BACKUP_SIAKAD_SDN_LB04_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setSuccessNotice('Database snapshot JSON berhasil diunduh.');
    setTimeout(() => setSuccessNotice(''), 3000);
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const ok = restoreDatabase(content);
      if (ok) {
        setSuccessNotice('Database SIAKAD berhasil dipulihkan secara menyeluruh!');
      } else {
        alert('Format backup berkas tidak valid!');
      }
    };
    reader.readAsText(file);
  };

  const handleResetPassword = async () => {
    if (!resetModalUser || !newPassword.trim() || resetBusy) return;
    setResetBusy(true);
    setResetError('');
    const res = await resetUserPassword(resetModalUser, newPassword.trim());
    setResetBusy(false);
    if (!res.success) {
      setResetError(res.message || 'Gagal menyimpan kata sandi.');
      return;
    }
    setSuccessNotice(`Kata sandi untuk ${resetModalUser.name} berhasil diperbarui. Sandi lama tidak berlaku lagi.`);
    setResetModalUser(null);
    setNewPassword('');
    loadCustomPwKeys();
    setTimeout(() => setSuccessNotice(''), 4000);
  };

  // Table summary
  const tableSummaries = [
    { name: 'profil_sekolah', rows: 1, desc: 'Identitas resmi SDN Lubang Buaya 04, NPSN 20104241, alamat, kepsek & fasilitas' },
    { name: 'users', rows: accountRows.length, desc: 'Kredensial login & hak akses 4 level peran (Admin, Kepsek, Guru, Siswa)' },
    { name: 'kelas', rows: 18, desc: '18 Rombongan Belajar (Kelas 1A-1C hingga 6A-6C), wali kelas & kapasitas' },
    { name: 'guru', rows: teachers.length, desc: 'Tenaga pendidik, NIP resmi, mata pelajaran ampu & penugasan wali kelas' },
    { name: 'mata_pelajaran', rows: subjects.length, desc: 'Mata pelajaran Kurikulum Merdeka (Wajib, Pilihan, Mulok PLBJ) & KKTP/KKM' },
    { name: 'siswa', rows: students.length, desc: 'Biodata peserta didik, NISN 10-digit, NIS, data orang tua & foto/ttd' },
    { name: 'nilai_rapor', rows: grades.length, desc: 'Penilaian E-Rapor (Formatif, PTS, PAS, Nilai Akhir & Capaian Pembelajaran)' },
    { name: 'presensi_harian', rows: attendance.length, desc: 'Catatan presensi kehadiran (Hadir, Sakit, Izin, Alpa)' },
    { name: 'kalender_akademik', rows: calendar.length, desc: 'Jadwal agenda kegiatan, PTS, PAT, libur hari besar & pembagian rapor' }
  ];

  return (
    <div className="space-y-6">
      <ResetRequestsPanel />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-amber-500/20">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-serif-luxury flex items-center gap-2.5">
            <Database className="w-6 h-6 text-amber-700" />
            Basis Data Relasional & Manajemen Akun
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Database SQL resmi SDN Lubang Buaya 04 Pagi: struktur tabel relasional, ekspor dump SQL, konsol kueri, dan manajemen kredensial.
          </p>
        </div>

        <div className="flex items-center p-1 rounded-2xl bg-cream border border-slate-200">
          <button
            id="tab-sql-database"
            onClick={() => setActiveSubTab('sql')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${activeSubTab === 'sql' ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md' : 'text-slate-500 hover:text-white'}`}
          >
            <Server className="w-3.5 h-3.5" />
            Database SQL (.sql)
          </button>
          <button
            id="tab-user-accounts"
            onClick={() => setActiveSubTab('users')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${activeSubTab === 'users' ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md' : 'text-slate-500 hover:text-white'}`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Daftar Akun ({accountRows.length})
          </button>
          <button
            id="tab-json-backup"
            onClick={() => setActiveSubTab('backup')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${activeSubTab === 'backup' ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md' : 'text-slate-500 hover:text-white'}`}
          >
            <Database className="w-3.5 h-3.5" />
            Snapshot JSON
          </button>
        </div>
      </div>

      {successNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-600 text-xs font-semibold flex items-center gap-2 animate-in fade-in shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* SUBTAB 1: DATABASE SQL (.sql) */}
      {activeSubTab === 'sql' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Penjelasan Transparan: Apakah Salin SQL Langsung Masuk ke Web? */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-50 via-cream to-cream border border-sky-500/30 flex flex-col md:flex-row md:items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-600 shrink-0 mt-0.5">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="font-bold text-slate-900 flex items-center gap-2">
                <span>Cara Kerja Ekspor SQL vs Koneksi Langsung ke Website</span>
              </div>
              <p className="text-slate-700 leading-relaxed">
                • <strong>Tombol "Salin SQL" & "Unduh .SQL"</strong> berfungsi untuk <em>mengekstrak/mengunduh</em> seluruh data yang ada di website ini ke dalam bentuk berkas database (.sql) agar Anda bisa mengimpornya ke database server Anda (seperti MySQL, phpMyAdmin, XAMPP, atau cPanel).
              </p>
              <p className="text-slate-700 leading-relaxed">
                • <strong>Menyalin kode SQL saja tidak otomatis menghubungkan website ini ke server luar</strong>, karena website ini bekerja sebagai aplikasi mandiri.
              </p>
              <p className="text-amber-700 leading-relaxed">
                • <strong>Namun, Anda bisa langsung menjalankan perintah SQL di bawah ini:</strong> gunakan <em>Konsol Kueri SQL Langsung</em> untuk mengambil data (<code className="bg-slate-50 px-1 py-0.5 rounded font-mono">SELECT</code>) atau memasukkan data baru (<code className="bg-slate-50 px-1 py-0.5 rounded font-mono">INSERT INTO siswa</code>) yang langsung masuk ke tampilan website ini secara seketika!
              </p>
            </div>
          </div>

          {/* Action Hero Box */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-cream via-cream/90 to-slate-50 border border-amber-500/30 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 text-[11px] font-bold uppercase tracking-wider">
                  <Server className="w-3.5 h-3.5 text-amber-700" />
                  RDBMS Siap Impor: MySQL • MariaDB • PostgreSQL • Cloud SQL
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 font-serif-luxury">
                  Database SQL SIAKAD SDN Lubang Buaya 04 Pagi
                </h3>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Database relasional lengkap yang memuat seluruh definisi skema (<code className="text-amber-700 font-mono">CREATE TABLE</code>, Primary & Foreign Keys, Constraints) beserta seluruh isi data riil sekolah (<code className="text-amber-700 font-mono">INSERT INTO</code>) yang saat ini berjalan di situs web.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
                <button
                  id="btn-download-sql"
                  onClick={handleDownloadSql}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-bold text-xs uppercase tracking-wider shadow-xl shadow-amber-500/20 active:scale-[0.98] transition flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-slate-950" />
                  <span>Unduh File .SQL</span>
                </button>

                <button
                  id="btn-copy-sql"
                  onClick={handleCopySql}
                  className="px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-amber-700 border border-amber-500/40 font-bold text-xs transition flex items-center gap-2 cursor-pointer shadow-md"
                  title="Salin seluruh skrip SQL ke papan klip"
                >
                  {copiedSql ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-600">Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-amber-700" />
                      <span>Salin SQL</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* KONEKSI LANGSUNG MYSQL / phpMyAdmin */}
          <div className="p-5 rounded-3xl bg-cream/90 border border-amber-500/30 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-700">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                    <span>Koneksi MySQL / phpMyAdmin</span>
                    {dbStatus === 'connected' ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-600 text-[10px] font-bold">
                        {dbPending ? 'Menyimpan...' : 'Tersambung'}
                      </span>
                    ) : dbStatus === 'conflict' ? (
                      <span className="px-2 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-300 text-[10px] font-bold">
                        Perlu Keputusan
                      </span>
                    ) : dbStatus === 'error' ? (
                      <span className="px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-600 text-[10px] font-bold">
                        Gagal Menyimpan
                      </span>
                    ) : dbStatus === 'checking' ? (
                      <span className="px-2 py-0.5 rounded-full bg-slate-500/20 border border-slate-500/40 text-slate-700 text-[10px] font-bold">
                        Memeriksa...
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 text-[10px] font-bold">
                        Offline (data di browser)
                      </span>
                    )}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Database: <code className="text-amber-700 font-mono">{mysqlStatus?.database || 'siakad_lubang_buaya_04'}</code>
                    {dbLastSync && <> • Terakhir sinkron: <span className="text-emerald-600">{dbLastSync}</span></>}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleCheckMysql}
                  disabled={checkingMysql}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-amber-700 border border-slate-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                >
                  <Server className="w-3.5 h-3.5" />
                  <span>{checkingMysql ? 'Memeriksa...' : 'Cek Status'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleReloadFromMysql}
                  disabled={syncingMysql}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-sky-600 border border-slate-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                  title="Ambil ulang data dari MySQL (setelah mengubah data di phpMyAdmin)"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Muat Ulang dari MySQL</span>
                </button>

                <button
                  type="button"
                  onClick={handleSyncToMysql}
                  disabled={syncingMysql}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                  title="Kirim seluruh data yang ada di aplikasi ke MySQL (menimpa baris dengan ID yang sama)"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-950" />
                  <span>{syncingMysql ? 'Memproses...' : 'Kirim Data ke MySQL'}</span>
                </button>
              </div>
            </div>

            {/* Pesan status */}
            <div
              className={`p-3 rounded-2xl text-[11px] border ${
                dbStatus === 'connected'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800'
                  : dbStatus === 'conflict'
                  ? 'bg-orange-500/10 border-orange-500/30 text-orange-200'
                  : dbStatus === 'error'
                  ? 'bg-red-500/10 border-red-500/30 text-red-800'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              {dbMessage}
              {mysqlStatus?.counts && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {Object.entries(mysqlStatus.counts).map(([table, n]) => (
                    <span key={table} className="px-2 py-0.5 rounded-md bg-cream border border-slate-300 font-mono text-[10px] text-slate-700">
                      {table}: <strong className="text-amber-700">{String(n)}</strong>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Petunjuk */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-[11px] text-slate-700">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="font-bold text-amber-700 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-700 flex items-center justify-center text-[10px]">1</span>
                  Start MySQL di XAMPP
                </div>
                <p className="text-slate-500">Buka XAMPP Control Panel, klik <strong>Start</strong> pada <strong>MySQL</strong> (dan Apache bila ingin membuka phpMyAdmin).</p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="font-bold text-amber-700 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-700 flex items-center justify-center text-[10px]">2</span>
                  Jalankan aplikasi
                </div>
                <p className="text-slate-500">Jalankan <code className="text-sky-600">npm run dev</code>. Database &amp; semua tabel dibuat <strong>otomatis</strong>, tidak perlu import manual.</p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="font-bold text-amber-700 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-700 flex items-center justify-center text-[10px]">3</span>
                  Edit di phpMyAdmin
                </div>
                <p className="text-slate-500">Buka <code className="text-sky-600">localhost/phpmyadmin</code>, ubah data, lalu klik <strong>"Muat Ulang dari MySQL"</strong> (atau refresh halaman) untuk melihat hasilnya.</p>
              </div>
            </div>
          </div>

          {/* FITUR BARU: KONSOL KUERI SQL INTERAKTIF LANGSUNG KE WEBSITE */}
          <div className="p-5 rounded-3xl bg-cream border border-amber-500/30 shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-700">
                  <Terminal className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 font-serif-luxury">
                    Konsol Eksekusi SQL Langsung ke Website
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Jalankan kueri SQL di bawah ini. Hasil kueri atau penambahan data baru langsung berefek pada website.
                  </p>
                </div>
              </div>

              {/* Template Cepat */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] text-slate-500 font-semibold mr-1">Contoh Cepat:</span>
                <button
                  type="button"
                  onClick={() => setUserSqlQuery("SELECT * FROM siswa WHERE kelas_id = '4A';")}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-amber-700 text-[10px] font-mono transition cursor-pointer border border-slate-300"
                >
                  Siswa 4A
                </button>
                <button
                  type="button"
                  onClick={() => setUserSqlQuery("SELECT * FROM guru;")}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-amber-700 text-[10px] font-mono transition cursor-pointer border border-slate-300"
                >
                  Daftar Guru
                </button>
                <button
                  type="button"
                  onClick={() => setUserSqlQuery("SELECT * FROM nilai_rapor;")}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-amber-700 text-[10px] font-mono transition cursor-pointer border border-slate-300"
                >
                  Nilai E-Rapor
                </button>
                <button
                  type="button"
                  onClick={() => setUserSqlQuery("INSERT INTO siswa (id, nis, nisn, nama_lengkap, gender, tempat_lahir, tanggal_lahir, agama, alamat, no_telepon, email, tahun_masuk, kelas_id, status, nama_ayah, pekerjaan_ayah, nama_ibu, pekerjaan_ibu, no_telepon_ortu) VALUES ('std-baru', '222301999', '0098765999', 'Ananda Pratama SQL', 'L', 'Jakarta', '2014-04-12', 'Islam', 'Jl. Lubang Buaya No. 99', '081299998888', 'ananda@sekolah.id', '2022', '4A', 'Aktif', 'Pak Budi', 'Wiraswasta', 'Ibu Siti', 'Ibu Rumah Tangga', '081299998888');")}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 text-[10px] font-mono transition cursor-pointer border border-amber-500/40"
                  title="Tambah siswa baru ke website menggunakan perintah SQL"
                >
                  + Tambah Siswa via SQL
                </button>
              </div>
            </div>

            {/* Input Editor Area */}
            <div className="space-y-2">
              <textarea
                value={userSqlQuery}
                onChange={(e) => setUserSqlQuery(e.target.value)}
                rows={3}
                className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 focus:border-amber-400 font-mono text-xs text-amber-700 outline-none resize-y"
                placeholder="Ketik perintah SQL (SELECT / INSERT INTO) di sini..."
              />

              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-mono">
                  Gunakan SELECT atau INSERT INTO untuk manipulasi data website.
                </span>

                <button
                  type="button"
                  onClick={handleExecuteSql}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20 active:scale-95 transition"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Jalankan SQL (Execute)</span>
                </button>
              </div>
            </div>

            {/* Output Table View */}
            {sqlQueryResult && (
              <div className="pt-3 border-t border-slate-200 space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Table className="w-3.5 h-3.5 text-amber-700" />
                    Hasil Eksekusi Kueri ({sqlQueryResult.rows.length} Baris):
                  </span>
                  {sqlQueryResult.affectedRows !== undefined && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 text-[10px] font-bold">
                      {sqlQueryResult.affectedRows} Data Berhasil Dimasukkan ke Website!
                    </span>
                  )}
                </div>

                {sqlQueryResult.error ? (
                  <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-600 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{sqlQueryResult.error}</span>
                  </div>
                ) : sqlQueryResult.rows.length > 0 ? (
                  <div className="max-h-60 overflow-x-auto overflow-y-auto rounded-xl border border-slate-200 bg-slate-50">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-cream border-b border-slate-200 text-[10px] text-amber-700 uppercase font-mono">
                          {sqlQueryResult.columns.map((col) => (
                            <th key={col} className="py-2 px-3">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 font-mono text-[11px] text-slate-700">
                        {sqlQueryResult.rows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-cream/50">
                            {sqlQueryResult.columns.map((col) => (
                              <td key={col} className="py-2 px-3 whitespace-nowrap">
                                {String(row[col] !== undefined ? row[col] : '-')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-xl">
                    Kueri tidak mengembalikan baris data.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Database Tables Overview Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <Table className="w-4 h-4 text-amber-700" />
                Daftar Tabel Relasional ({tableSummaries.length} Tabel Aktif)
              </h4>
              <span className="text-[11px] text-amber-700/90 font-mono">
                Database: siakad_lubang_buaya_04
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {tableSummaries.map((tbl) => (
                <div 
                  key={tbl.name}
                  className="p-3.5 rounded-2xl bg-cream/80 border border-slate-200 hover:border-amber-500/40 transition space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-amber-700 flex items-center gap-1.5">
                      <FileCode2 className="w-3.5 h-3.5 text-amber-700" />
                      {tbl.name}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-mono font-semibold">
                      {tbl.rows} baris
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    {tbl.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* SQL Preview & Quick Viewer */}
          <div className="rounded-3xl bg-slate-50 border border-amber-500/30 shadow-2xl overflow-hidden">
            {/* Terminal Header */}
            <div className="p-4 bg-cream border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-xs font-mono text-slate-700 ml-2 font-bold">
                  siakad_lubang_buaya_04.sql — Pratinjau Skrip SQL
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari teks dalam SQL..."
                    value={sqlSearch}
                    onChange={(e) => setSqlSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-amber-400 w-48 font-mono"
                  />
                </div>

                <button
                  onClick={handleCopySql}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-amber-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border border-slate-300"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Semua</span>
                </button>
              </div>
            </div>

            {/* SQL Code Block */}
            <div className="p-4 max-h-96 overflow-y-auto font-mono text-xs text-slate-700 leading-relaxed bg-slate-50 selection:bg-amber-500 selection:text-white space-y-1">
              <pre className="whitespace-pre-wrap">
                {sqlSearch 
                  ? liveSqlScript.split('\n').filter(line => line.toLowerCase().includes(sqlSearch.toLowerCase())).join('\n') || '-- Tidak ada baris yang cocok dengan kata kunci pencarian.'
                  : liveSqlScript.slice(0, 4500) + '\n\n-- [Skrip SQL Lengkap berlanjut... Klik "Unduh File .SQL" atau "Salin Semua" untuk memperoleh seluruh baris tanpa batas]'
                }
              </pre>
            </div>

            {/* Bottom info banner */}
            <div className="p-3 bg-cream/60 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                <span>Format kompatibel: phpMyAdmin, MySQL Workbench, Navicat, DBeaver, PostgreSQL (dengan tipe data standar), dan Google Cloud SQL.</span>
              </div>
              <span className="font-mono text-amber-700 font-semibold">UTF-8 Unicode (utf8mb4)</span>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: DAFTAR AKUN PENGGUNA */}
      {activeSubTab === 'users' && (
        <div className="rounded-2xl bg-cream/80 border border-amber-500/20 shadow-xl overflow-hidden animate-in fade-in">
          <div className="p-3 border-b border-amber-500/20 flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
            <input
              type="text"
              value={accountSearch}
              onChange={(e) => setAccountSearch(e.target.value)}
              placeholder="Cari nama, NISN/NIP, atau peran (guru / siswa / kepsek)..."
              className="w-full sm:max-w-sm px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs outline-none focus:border-amber-400"
            />
            <span className="text-[11px] text-slate-500">
              Akun berstatus <strong className="text-amber-700">Sandi bawaan</strong> masih memakai sandi lama yang mudah ditebak — sebaiknya diganti.
            </span>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-amber-500/20 bg-slate-50 text-slate-500 font-semibold uppercase">
                <th className="py-3 px-4">Nama Lengkap</th>
                <th className="py-3 px-4">Username Login</th>
                <th className="py-3 px-4">Peran (Role)</th>
                <th className="py-3 px-4">Status Akun</th>
                <th className="py-3 px-4 text-center">Aksi Kredensial</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80">
              {visibleRows.slice(0, ROW_LIMIT).map(usr => (
                <tr key={usr.id} className="hover:bg-slate-100/50 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{usr.name}</td>
                  <td className="py-3.5 px-4 font-mono text-amber-700 font-semibold">{usr.username}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 border border-amber-500/30 text-[10px] font-bold uppercase">
                      {usr.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    {hasCustomPassword(usr) ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 text-[10px] font-semibold">
                        {usr.role === 'admin' ? 'Dilindungi server' : 'Sandi diatur Admin'}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 border border-amber-500/30 text-[10px] font-semibold">
                        Sandi bawaan
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {usr.role === 'admin' ? (
                      <span className="text-[10px] text-slate-500">Ganti lewat foto profil</span>
                    ) : (
                      <button
                        onClick={() => {
                          setResetModalUser(usr);
                          setNewPassword('');
                          setResetError('');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-amber-700 font-semibold text-xs transition flex items-center gap-1.5 mx-auto cursor-pointer"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        Ganti Sandi
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          {visibleRows.length > ROW_LIMIT && (
            <div className="p-3 text-[11px] text-slate-500 border-t border-amber-500/20">
              Menampilkan {ROW_LIMIT} dari {visibleRows.length} akun. Gunakan kotak pencarian untuk mempersempit.
            </div>
          )}
          {visibleRows.length === 0 && (
            <div className="p-6 text-center text-xs text-slate-500">Tidak ada akun yang cocok.</div>
          )}
        </div>
      )}

      {/* SUBTAB 3: SNAPSHOT JSON */}
      {activeSubTab === 'backup' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
          {/* Backup Box */}
          <div className="p-6 rounded-3xl bg-cream/80 border border-amber-500/20 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 font-serif-luxury flex items-center gap-2 pb-2 border-b border-slate-200">
              <Download className="w-5 h-5 text-amber-700" />
              Unduh Snapshot JSON (Cadangan Cepat)
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed">
              Buat salinan instan seluruh data 18 rombel, nilai e-rapor, presensi, dan riwayat siswa dalam format JSON terenkripsi untuk pemulihan cepat pada aplikasi web.
            </p>
            <button
              onClick={handleBackup}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-xs uppercase tracking-wider shadow-md hover:scale-[1.02] transition flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-950" />
              Unduh Snapshot JSON
            </button>
          </div>

          {/* Restore Box */}
          <div className="p-6 rounded-3xl bg-cream/80 border border-amber-500/20 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 font-serif-luxury flex items-center gap-2 pb-2 border-b border-slate-200">
              <Upload className="w-5 h-5 text-amber-700" />
              Pulihkan Snapshot JSON (Restore)
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed">
              Unggah file snapshot JSON untuk mengembalikan seluruh kondisi sistem ke titik pencadangan sebelumnya.
            </p>
            <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-amber-700 font-bold text-xs uppercase tracking-wider cursor-pointer border border-amber-500/30 transition">
              <Upload className="w-4 h-4" />
              Pilih Berkas Cadangan (.JSON)
              <input type="file" accept=".json" onChange={handleRestore} className="hidden" />
            </label>
          </div>
        </div>
      )}

      {/* Modal Reset Password */}
      {resetModalUser && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-cream border border-amber-500/30 rounded-3xl p-6 shadow-2xl space-y-4 text-xs">
            <h3 className="text-base font-bold text-slate-900 font-serif-luxury flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-amber-700" />
              Reset Kata Sandi
            </h3>
            <p className="text-slate-700">
              Perbarui kredensial login untuk <strong className="text-amber-700">{resetModalUser.name}</strong> ({resetModalUser.username}):
            </p>
            <div>
              <label className="block text-slate-500 mb-1">Kata Sandi Baru:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 8 karakter, huruf + angka"
                  autoComplete="off"
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-amber-700 font-mono outline-none"
                />
                <button
                  type="button"
                  onClick={() => setNewPassword(generatePassword())}
                  className="px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-amber-700 font-semibold whitespace-nowrap cursor-pointer"
                  title="Buat kata sandi acak"
                >
                  Acak
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-1.5">
                Catat/beri tahu pemilik akun. Setelah disimpan, sandi lama (termasuk sandi bawaan) langsung tidak berlaku.
              </p>
            </div>
            {resetError && (
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700">{resetError}</div>
            )}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => setResetModalUser(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleResetPassword}
                disabled={resetBusy}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold uppercase tracking-wider cursor-pointer disabled:opacity-60"
              >
                {resetBusy ? 'Menyimpan...' : 'Perbarui Sandi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
