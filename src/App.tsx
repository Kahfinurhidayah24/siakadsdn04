import React, { useState, useEffect } from 'react';
import { SchoolProvider, useSchool } from './context/SchoolContext';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { Home, Users, Award, CheckSquare, Menu } from 'lucide-react';

// Dashboards
import { AdminDashboard } from './components/dashboard/AdminDashboard';
import { KepsekDashboard } from './components/dashboard/KepsekDashboard';
import { GuruDashboard } from './components/dashboard/GuruDashboard';
import { SiswaDashboard } from './components/dashboard/SiswaDashboard';

// Functional Views
import { StudentManagement } from './components/students/StudentManagement';
import { TeacherManagement } from './components/teachers/TeacherManagement';
import { GradeManagement } from './components/grades/GradeManagement';
import { StudentGradesView } from './components/grades/StudentGradesView';
import { MassImportGrades } from './components/grades/MassImportGrades';
import { ReportCardViewer } from './components/rapor/ReportCardViewer';
import { StudentIdCards } from './components/cards/StudentIdCards';
import { ScheduleManagement } from './components/schedule/ScheduleManagement';
import { AttendanceManagement } from './components/attendance/AttendanceManagement';
import { StudentAttendanceView } from './components/attendance/StudentAttendanceView';
import { MutationLetters } from './components/letters/MutationLetters';
import { SchoolProfileView } from './components/profile/SchoolProfileView';
import { AuditLogsView } from './components/audit/AuditLogsView';
import { PromotionAlumniView } from './components/academic/PromotionAlumniView';
import { AcademicCalendarAchievements } from './components/academic/AcademicCalendarAchievements';
import { UserManagementBackup } from './components/settings/UserManagementBackup';
import { LoginPage } from './components/auth/LoginPage';
import { LogoutConfirmModal } from './components/common/LogoutConfirmModal';

const AppContent: React.FC = () => {
  const { currentUser, schoolProfile, isAuthenticated } = useSchool();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Auto-switch to dashboard when user switches role
  useEffect(() => {
    setActiveTab('dashboard');
  }, [currentUser?.role]);

  // If not authenticated, render official Login Page
  if (!isAuthenticated || !currentUser) {
    return <LoginPage />;
  }

  // Render the current view according to the active tab
  const renderCurrentView = () => {
    switch (activeTab) {
      case 'dashboard':
        if (currentUser.role === 'admin') return <AdminDashboard onNavigate={setActiveTab} />;
        if (currentUser.role === 'kepsek') return <KepsekDashboard onNavigate={setActiveTab} />;
        if (currentUser.role === 'guru') return <GuruDashboard onNavigate={setActiveTab} />;
        return <SiswaDashboard onNavigate={setActiveTab} />;

      case 'school_profile':
      case 'profile':
        return <SchoolProfileView />;

      case 'students':
      case 'my_class':
        return <StudentManagement onPrintCard={() => setActiveTab('student_cards')} />;

      case 'teachers':
        return <TeacherManagement />;

      case 'grades':
      case 'subjects':
        if (currentUser.role === 'siswa') {
          return <StudentGradesView onNavigateToRapor={() => setActiveTab('rapor')} />;
        }
        return <GradeManagement onNavigateToMassImport={() => setActiveTab('mass_import_grades')} />;

      case 'mass_import_grades':
        if (currentUser.role === 'siswa') {
          return <StudentGradesView onNavigateToRapor={() => setActiveTab('rapor')} />;
        }
        return <MassImportGrades />;

      case 'rapor':
        return <ReportCardViewer />;

      case 'student_cards':
        return <StudentIdCards />;

      case 'schedules':
      case 'schedule':
        return <ScheduleManagement />;

      case 'attendance':
        if (currentUser.role === 'siswa') {
          return <StudentAttendanceView />;
        }
        return <AttendanceManagement />;

      case 'letters':
      case 'mutations':
        return <MutationLetters />;

      case 'promotion':
        return <PromotionAlumniView />;

      case 'achievements':
      case 'calendar':
        return <AcademicCalendarAchievements />;

      case 'users':
        return <UserManagementBackup />;

      case 'logs_backup':
      case 'audit':
        return <AuditLogsView />;

      default:
        return <AdminDashboard onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-800">
      {/* Top Navigation Bar */}
      <Navbar onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)} />

      <div className="flex-1 flex overflow-hidden">
        {/* Role-Adaptive Luxury Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6 pb-24 lg:pb-8">
          <div className="max-w-7xl mx-auto">
            {renderCurrentView()}
          </div>

          {/* Luxury Footer (Hidden on print) */}
          <footer className="pt-8 border-t border-slate-200 text-center text-xs text-slate-500 font-serif-luxury space-y-1 no-print">
            <div className="text-amber-700/80 font-bold tracking-wider">
              {schoolProfile.name} • SISTEM INFORMASI AKADEMIK & E-RAPOR RESMI
            </div>
            <div className="text-[11px] text-slate-400 font-sans">
              18 Rombongan Belajar • Suku Dinas Pendidikan Wilayah II Jakarta Timur • NPSN {schoolProfile.npsn}
            </div>
          </footer>
        </main>
      </div>

      {/* Global Luxury Logout Confirmation Modal */}
      <LogoutConfirmModal />

      {/* Mobile Bottom Bar for Quick 1-Touch Navigation */}
      <nav aria-label="Mobile Navigation" className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-cream/95 backdrop-blur-md border-t border-amber-500/20 px-2 py-1.5 flex items-center justify-around no-print shadow-2xl">
        <button
          id="btn-mobile-nav-home"
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition cursor-pointer active:scale-95 ${activeTab === 'dashboard' ? 'text-amber-700 font-bold' : 'text-slate-500 hover:text-slate-800'}`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px]">Beranda</span>
        </button>

        <button
          id="btn-mobile-nav-students"
          onClick={() => setActiveTab(currentUser.role === 'siswa' ? 'grades' : 'students')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition cursor-pointer active:scale-95 ${(currentUser.role === 'siswa' ? activeTab === 'grades' : activeTab === 'students') ? 'text-amber-700 font-bold' : 'text-slate-500 hover:text-slate-800'}`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px]">{currentUser.role === 'siswa' ? 'Nilai' : 'Siswa'}</span>
        </button>

        <button
          id="btn-mobile-nav-rapor"
          onClick={() => setActiveTab('rapor')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition cursor-pointer active:scale-95 ${activeTab === 'rapor' ? 'text-amber-700 font-bold' : 'text-slate-500 hover:text-slate-800'}`}
        >
          <Award className="w-5 h-5" />
          <span className="text-[10px]">E-Rapor</span>
        </button>

        <button
          id="btn-mobile-nav-attendance"
          onClick={() => setActiveTab('attendance')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition cursor-pointer active:scale-95 ${activeTab === 'attendance' ? 'text-amber-700 font-bold' : 'text-slate-500 hover:text-slate-800'}`}
        >
          <CheckSquare className="w-5 h-5" />
          <span className="text-[10px]">Presensi</span>
        </button>

        <button
          id="btn-mobile-nav-menu"
          onClick={() => setIsMobileSidebarOpen(true)}
          className="flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-amber-700 hover:text-amber-800 cursor-pointer active:scale-95"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Menu</span>
        </button>
      </nav>
    </div>
  );
};

export default function App() {
  return (
    <SchoolProvider>
      <AppContent />
    </SchoolProvider>
  );
}
