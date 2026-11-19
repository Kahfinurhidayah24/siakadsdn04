import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { LuxuryCrest } from './LuxuryCrest';
import { ProfileMenu } from './ProfileMenu';
import { 
  Bell, Calendar, ShieldCheck, UserCheck, 
  GraduationCap, LogOut, CheckCircle2, ChevronDown, Menu 
} from 'lucide-react';

interface NavbarProps {
  onToggleSidebar?: () => void;
  onOpenMobileSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, onOpenMobileSidebar }) => {
  const handleToggle = () => {
    if (onOpenMobileSidebar) onOpenMobileSidebar();
    else if (onToggleSidebar) onToggleSidebar();
  };
  const { 
    currentUser, 
    openLogoutModal, 
    academicYear, 
    semester, 
    setSemester, 
    activityLogs,
    students,
    teachers 
  } = useSchool();
  
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Super Admin';
      case 'kepsek': return 'Kepala Sekolah';
      case 'guru': return currentUser.isWaliKelas ? `Wali Kelas ${currentUser.assignedClass || ''}` : 'Guru Mata Pelajaran';
      case 'siswa': return 'Peserta Didik';
      default: return role;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-amber-500/20 text-amber-700 border-amber-500/40';
      case 'kepsek': return 'bg-emerald-500/20 text-emerald-600 border-emerald-500/40';
      case 'guru': return 'bg-sky-500/20 text-sky-600 border-sky-500/40';
      case 'siswa': return 'bg-indigo-500/20 text-indigo-600 border-indigo-500/40';
      default: return 'bg-slate-200 text-slate-800 border-slate-600';
    }
  };

  return (
    <header className="sticky top-0 z-40 h-16 bg-cream/90 backdrop-blur-md border-b border-amber-500/20 px-4 lg:px-6 flex items-center justify-between no-print">
      <div className="flex items-center gap-3">
        <button
          id="btn-toggle-sidebar"
          onClick={handleToggle}
          className="lg:hidden p-2 rounded-lg bg-cream border border-slate-200 text-slate-700 hover:text-amber-700 hover:border-amber-500/40 transition-colors"
          title="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <LuxuryCrest size="sm" showSubtitle={false} />
          <div className="hidden sm:block border-l border-slate-200 pl-3">
            <h1 className="text-xs font-semibold text-slate-800 tracking-wide">
              SDN LUBANG BUAYA 04 PAGI
            </h1>
            <p className="text-[10px] text-amber-700/80 font-mono font-medium">
              NPSN 20104241 • Akreditasi A
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Academic Year & Semester Pill */}
        <div className="hidden md:flex items-center gap-2 bg-cream/90 border border-amber-500/30 px-3 py-1.5 rounded-full text-xs shadow-inner">
          <Calendar className="w-3.5 h-3.5 text-amber-700" />
          <span className="text-slate-700 font-medium">T.A. {academicYear}</span>
          <span className="text-slate-400">•</span>
          <span className="text-amber-700 font-semibold uppercase tracking-wider">
            Semester {semester}
          </span>
          {currentUser.role === 'admin' && (
            <button
              id="btn-toggle-semester"
              onClick={() => setSemester(semester === 'Ganjil' ? 'Genap' : 'Ganjil')}
              className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-800 transition"
              title="Ganti Semester Aktif"
            >
              Ubah
            </button>
          )}
        </div>

        {/* Authenticated Role Status Badge (Secure - No demo dropdown) */}
        <div className="flex items-center gap-2 bg-cream/90 border border-slate-200 px-3 py-1.5 rounded-xl shadow-inner">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
          <div className="text-left hidden sm:block">
            <div className="text-[9px] text-slate-500 font-medium uppercase tracking-wider leading-none">Sesi Aktif</div>
            <div className="text-xs font-bold text-amber-700 capitalize flex items-center gap-1 mt-0.5">
              {getRoleLabel(currentUser.role)}
            </div>
          </div>
        </div>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            id="btn-notifications"
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="relative p-2 rounded-xl bg-cream border border-slate-200 text-slate-700 hover:text-amber-700 hover:border-amber-500/40 transition cursor-pointer"
            title="Pemberitahuan Sistem"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(22,163,74,0.8)]" />
          </button>

          {showNotifMenu && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowNotifMenu(false)} 
              />
              <div 
                id="menu-notifications-dropdown"
                className="absolute right-0 mt-2 w-80 bg-cream/95 border border-amber-500/30 rounded-2xl shadow-2xl p-3 z-50 backdrop-blur-xl animate-in fade-in duration-200"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs font-semibold text-slate-700">
                  <span>Aktivitas & Notifikasi Terbaru</span>
                  <span className="text-[10px] text-amber-700 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                    Realtime
                  </span>
                </div>
                <div className="mt-2 space-y-2 max-h-60 overflow-y-auto pr-1">
                  {activityLogs.slice(0, 4).map(log => (
                    <div key={log.id} className="p-2 rounded-xl bg-slate-100/60 border border-slate-300/50 text-xs">
                      <div className="flex items-center justify-between text-[10px] text-amber-700 font-semibold mb-0.5">
                        <span>{log.action}</span>
                        <span className="text-slate-500">{log.timestamp.split(' ')[1]}</span>
                      </div>
                      <p className="text-slate-700 text-[11px] line-clamp-2">{log.details}</p>
                      <div className="text-[9px] text-slate-500 mt-1">Oleh: {log.user}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Card */}
        <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
          <div className="hidden xl:block text-right">
            <div className="text-xs font-bold text-slate-800 truncate max-w-[150px]">
              {currentUser.name}
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium inline-block ${getRoleBadgeColor(currentUser.role)}`}>
              {getRoleLabel(currentUser.role)}
            </span>
          </div>

          {currentUser.role === 'admin' ? (
            <ProfileMenu />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-200 p-[1.5px] shadow-md overflow-hidden shrink-0">
              {currentUser.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-full h-full object-cover rounded-[10px]"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full rounded-[10px] bg-cream flex items-center justify-center font-bold text-amber-700 text-xs">
                  {currentUser.name.charAt(0)}
                </div>
              )}
            </div>
          )}

          <button
            id="btn-logout"
            onClick={openLogoutModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cream border border-red-500/30 text-red-600 hover:bg-red-500/15 hover:border-red-400 hover:text-red-800 transition cursor-pointer shadow-sm text-xs font-semibold"
            title="Keluar dari Akun (Logout)"
          >
            <LogOut className="w-3.5 h-3.5 text-red-600" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </div>
    </header>
  );
};
