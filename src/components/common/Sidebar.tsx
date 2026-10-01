import React from 'react';
import { useSchool } from '../../context/SchoolContext';
import { LuxuryCrest } from './LuxuryCrest';
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, 
  CalendarDays, FileSpreadsheet, Award, UserPlus, 
  CreditCard, FileText, ArrowUpRight, ArrowLeftRight, 
  AlertTriangle, Database, School, ShieldAlert,
  X, CheckSquare, Sparkles, Building2, LogOut
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  highlight?: boolean;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpenMobile,
  onCloseMobile
}) => {
  const { currentUser, openLogoutModal } = useSchool();

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    onCloseMobile();
  };

  // Define navigational tabs based on active role
  const getNavItems = (): NavGroup[] => {
    if (currentUser.role === 'admin') {
      return [
        { group: 'Utama', items: [
          { id: 'dashboard', label: 'Dashboard Admin', icon: LayoutDashboard },
          { id: 'school_profile', label: 'Profil SDN Lubang Buaya 04', icon: Building2 },
        ]},
        { group: 'Master Data Akademik', items: [
          { id: 'students', label: 'Data Siswa (18 Rombel)', icon: Users, badge: '18 Rbl' },
          { id: 'teachers', label: 'Data Guru & Wali Kelas', icon: GraduationCap },
          { id: 'subjects', label: 'Mata Pelajaran', icon: BookOpen },
          { id: 'schedules', label: 'Jadwal Pelajaran', icon: CalendarDays },
          { id: 'attendance', label: 'Presensi & Absensi', icon: CheckSquare },
        ]},
        { group: 'Penilaian & E-Rapor', items: [
          { id: 'grades', label: 'Input Nilai Siswa', icon: Award },
          { id: 'mass_import_grades', label: 'Import Nilai Massal', icon: FileSpreadsheet, highlight: true },
          { id: 'rapor', label: 'E-Rapor Digital & Cetak', icon: FileText },
        ]},
        { group: 'Administrasi Siswa', items: [
          { id: 'student_cards', label: 'Cetak Kartu Pelajar', icon: CreditCard },
          { id: 'letters', label: 'Surat Keterangan Sekolah', icon: FileText },
          { id: 'promotion', label: 'Kenaikan Kelas & Alumni', icon: ArrowUpRight },
          { id: 'mutations', label: 'Mutasi Siswa', icon: ArrowLeftRight },
          { id: 'achievements', label: 'Prestasi & Pelanggaran', icon: AlertTriangle },
          { id: 'calendar', label: 'Kalender Akademik', icon: CalendarDays },
        ]},
        { group: 'Sistem & Keamanan', items: [
          { id: 'users', label: 'Manajemen Akun & Reset', icon: UserPlus },
          { id: 'logs_backup', label: 'Log Aktivitas & Backup', icon: Database },
        ]}
      ];
    }

    if (currentUser.role === 'kepsek') {
      return [
        { group: 'Monitoring Eksekutif', items: [
          { id: 'dashboard', label: 'Dashboard Kepala Sekolah', icon: LayoutDashboard },
          { id: 'school_profile', label: 'Profil Sekolah', icon: Building2 },
          { id: 'students', label: 'Monitoring Siswa (18 Rombel)', icon: Users },
          { id: 'teachers', label: 'Direktori Dewan Guru', icon: GraduationCap },
        ]},
        { group: 'Akademik & Rapor', items: [
          { id: 'grades', label: 'Rekap Nilai Siswa', icon: Award },
          { id: 'attendance', label: 'Rekap Kehadiran Sekolah', icon: CheckSquare },
          { id: 'rapor', label: 'Arsip & Rekap Rapor', icon: FileText },
        ]},
        { group: 'Laporan Manajerial', items: [
          { id: 'promotion', label: 'Kelulusan & Data Alumni', icon: ArrowUpRight },
          { id: 'mutations', label: 'Rekap Mutasi Siswa', icon: ArrowLeftRight },
          { id: 'achievements', label: 'Laporan Prestasi Siswa', icon: Award },
          { id: 'calendar', label: 'Agenda & Kalender', icon: CalendarDays },
        ]}
      ];
    }

    if (currentUser.role === 'guru') {
      const isWali = currentUser.isWaliKelas;
      const assigned = currentUser.assignedClass || '';
      return [
        { group: 'Dashboard Guru', items: [
          { id: 'dashboard', label: 'Dashboard Pengajar', icon: LayoutDashboard },
          ...(isWali ? [{ id: 'my_class', label: `Kelas Saya (${assigned})`, icon: Sparkles, highlight: true }] : []),
        ]},
        { group: 'Pembelajaran & Nilai', items: [
          { id: 'grades', label: 'Input Nilai Mapel', icon: Award },
          { id: 'mass_import_grades', label: 'Import Nilai Excel', icon: FileSpreadsheet },
          { id: 'attendance', label: 'Input Presensi Siswa', icon: CheckSquare },
          { id: 'schedules', label: 'Jadwal Mengajar', icon: CalendarDays },
          { id: 'rapor', label: isWali ? `E-Rapor Kelas ${assigned}` : 'Lihat E-Rapor', icon: FileText },
        ]},
        { group: 'Informasi', items: [
          { id: 'achievements', label: 'Catat Prestasi / Pelanggaran', icon: AlertTriangle },
          { id: 'calendar', label: 'Kalender Akademik', icon: CalendarDays },
        ]}
      ];
    }

    // Role: Siswa
    return [
      { group: 'Portal Siswa', items: [
        { id: 'dashboard', label: 'Ringkasan Akademik', icon: LayoutDashboard },
        { id: 'grades', label: 'Nilai Capaian Saya', icon: Award },
        { id: 'rapor', label: 'E-Rapor & Unduh PDF', icon: FileText, highlight: true },
        { id: 'attendance', label: 'Presensi Kehadiran Saya', icon: CheckSquare },
        { id: 'schedules', label: 'Jadwal Pelajaran Kelas', icon: CalendarDays },
        { id: 'student_cards', label: 'Kartu Pelajar Digital', icon: CreditCard },
        { id: 'achievements', label: 'Prestasi Saya', icon: Award },
      ]}
    ];
  };

  const navGroups = getNavItems();

  const renderSidebarBody = (isMobile: boolean = false) => (
    <>
      {/* User Quick Info Box */}
      <div className="p-3.5 mx-3 my-3 rounded-2xl bg-gradient-to-b from-cream/90 to-slate-50 border border-amber-500/25 shadow-lg relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
        <div className="text-[10px] uppercase font-bold tracking-widest text-amber-700/90 mb-1 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block animate-ping" />
          Sistem Akademik Resmi
        </div>
        <div className="text-xs font-semibold text-slate-800 truncate">
          {currentUser.name}
        </div>
        <div className="text-[11px] text-amber-700/80 font-mono mt-0.5">
          {currentUser.role === 'admin' && 'Akses: Super Administrator'}
          {currentUser.role === 'kepsek' && 'Akses: Pengawas & Kepala Sekolah'}
          {currentUser.role === 'guru' && (currentUser.isWaliKelas ? `Wali Kelas ${currentUser.assignedClass}` : 'Guru Mata Pelajaran')}
          {currentUser.role === 'siswa' && `NISN: ${currentUser.username}`}
        </div>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-3 space-y-4 pb-6 scrollbar-thin scrollbar-thumb-slate-800">
        {navGroups.map((grp, idx) => (
          <div key={idx} className="space-y-1">
            <div className="px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              {grp.group}
            </div>
            {grp.items.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  onClick={() => handleSelectTab(item.id)}
                  className={`
                    w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group cursor-pointer active:scale-[0.98]
                    ${isActive 
                      ? 'bg-gradient-to-r from-amber-500/25 via-amber-500/15 to-transparent text-amber-800 border-l-2 border-amber-400 font-semibold shadow-sm' 
                      : 'text-slate-500 hover:text-slate-800 hover:bg-cream/80'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-amber-700' : 'text-slate-500 group-hover:text-amber-700'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-100 text-amber-700 font-mono font-bold border border-amber-500/30">
                      {item.badge}
                    </span>
                  )}

                  {item.highlight && !isActive && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-700 font-bold border border-amber-500/40">
                      Unggulan
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer info & Logout */}
      <div className="p-3 border-t border-slate-200 bg-cream/90 shrink-0 space-y-2">
        <button
          id="btn-sidebar-logout"
          onClick={() => {
            if (isOpenMobile && onCloseMobile) onCloseMobile();
            openLogoutModal();
          }}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-red-50 border border-red-500/30 hover:bg-red-900/40 hover:border-red-500/50 text-red-600 hover:text-red-100 text-xs font-semibold transition cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5 text-red-600" />
          <span>Keluar dari Akun</span>
        </button>

        <div className="text-center">
          <p className="text-[10px] text-slate-500 font-serif-luxury tracking-wider">
            LUXURY INSTITUTIONAL EDITION
          </p>
          <p className="text-[9px] text-slate-500 mt-0.5">
            SDN Lubang Buaya 04 Pagi • NPSN 20104241
          </p>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Drawer (Visible only when mobile drawer is open) */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div 
            onClick={onCloseMobile}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity cursor-pointer"
          />

          {/* Drawer Sidebar */}
          <aside className="relative w-72 max-w-[85vw] bg-slate-50 border-r border-amber-500/20 h-full flex flex-col z-10 shadow-2xl animate-in slide-in-from-left duration-200 no-print">
            {/* Header Branding with Close Button */}
            <div className="h-16 px-5 border-b border-amber-500/20 flex items-center justify-between bg-gradient-to-r from-slate-50 via-cream to-slate-50 shrink-0">
              <LuxuryCrest size="sm" showSubtitle={true} />
              <button
                onClick={onCloseMobile}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer transition"
                title="Tutup Menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {renderSidebarBody(true)}
          </aside>
        </div>
      )}

      {/* Desktop Persistent Sidebar (In-flow flex child, never overlaps main) */}
      <aside className="hidden lg:flex flex-col w-72 shrink-0 bg-slate-50 border-r border-amber-500/20 h-full overflow-hidden no-print">
        {renderSidebarBody(false)}
      </aside>
    </>
  );
};
