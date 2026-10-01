import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { 
  User, Student, Teacher, Subject, ScheduleItem, GradeItem, 
  AttendanceRecord, StudentMutation, Achievement, Violation, 
  SchoolLetter, AcademicCalendarItem, ActivityLog, MassImportPreviewItem 
} from '../types';
import { 
  SCHOOL_PROFILE, INITIAL_SUBJECTS, INITIAL_TEACHERS, 
  INITIAL_STUDENTS, INITIAL_GRADES, INITIAL_SCHEDULES, 
  INITIAL_ATTENDANCE, INITIAL_ACHIEVEMENTS, INITIAL_VIOLATIONS, 
  INITIAL_CALENDAR, INITIAL_ACTIVITY_LOGS, ALL_36_CLASSES 
} from '../data/initialData';
import {
  SYNC_KEYS, SyncKey, Snapshot, fetchDbState, pushChanges, pushAll,
  makeSnapshot, diffCollection, commitToSnapshot, ChangeSet
} from '../utils/dbSync';
import {
  SchoolMedia, loadSchoolMedia, saveSchoolMediaLocal,
  syncSchoolMediaFromServer, saveSchoolMediaToServer
} from '../utils/schoolMedia';

const readSavedAvatar = (userId: string): string | undefined => {
  try { return localStorage.getItem(`siakad_lb04_avatar_${userId}`) || undefined; } catch { return undefined; }
};

export type DbStatus = 'checking' | 'connected' | 'offline' | 'error' | 'conflict';

interface SchoolContextType {
  isAuthenticated: boolean;
  currentUser: User;
  switchUser: (role: 'admin' | 'kepsek' | 'guru' | 'siswa', customId?: string) => void;
  loginWithCredentials: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateProfilePhoto: (photo: string | null) => void;
  isLogoutModalOpen: boolean;
  openLogoutModal: () => void;
  closeLogoutModal: () => void;
  confirmLogout: () => void;
  
  // Academic Period
  academicYear: string;
  semester: 'Ganjil' | 'Genap';
  setAcademicYear: (year: string) => void;
  setSemester: (sem: 'Ganjil' | 'Genap') => void;
  
  // Profile
  schoolProfile: typeof SCHOOL_PROFILE;
  updateSchoolProfile: (profile: Partial<typeof SCHOOL_PROFILE>) => void;
  /** Ganti/hapus logo & foto sampul sekolah. Mengembalikan 'db' (tersimpan di MySQL), 'local' (hanya browser) atau 'gagal'. */
  updateSchoolMedia: (media: SchoolMedia) => Promise<'db' | 'local' | 'gagal'>;

  // Students
  students: Student[];
  addStudent: (student: Omit<Student, 'id'>) => Student;
  addBatchStudents: (students: Omit<Student, 'id'>[], overwriteExisting?: boolean) => { added: number; updated: number };
  updateStudent: (id: string, data: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  generateNis: (admissionYear: string) => string;
  generateStudentAccount: (student: Student) => void;

  // Teachers
  teachers: Teacher[];
  addTeacher: (teacher: Omit<Teacher, 'id'>) => Teacher;
  updateTeacher: (id: string, data: Partial<Teacher>) => void;
  deleteTeacher: (id: string) => void;
  assignWaliKelas: (teacherId: string, classId: string) => void;

  // Subjects & Schedules
  subjects: Subject[];
  schedules: ScheduleItem[];
  addSchedule: (sch: Omit<ScheduleItem, 'id'>) => { success: boolean; conflictError?: string };
  deleteSchedule: (id: string) => void;

  // Grades & E-Rapor
  grades: GradeItem[];
  saveGrade: (grade: Omit<GradeItem, 'id'> | GradeItem) => void;
  lockGradesForClass: (classId: string, subjectId: string) => void;
  importMassGrades: (items: MassImportPreviewItem[], overwriteExisting: boolean) => { imported: number; updated: number; skipped: number };

  // Attendance
  attendance: AttendanceRecord[];
  recordAttendance: (classId: string, date: string, records: { studentId: string; status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpa'; notes?: string }[]) => void;

  // Academic Actions
  mutations: StudentMutation[];
  addMutation: (mutation: Omit<StudentMutation, 'id'>) => void;
  promoteClass: (currentClass: string, targetClass: string, studentIds: string[]) => void;
  graduateStudents: (studentIds: string[], graduationDate: string) => void;

  // Letters, Achievements, Violations
  letters: SchoolLetter[];
  generateLetter: (data: Omit<SchoolLetter, 'id' | 'letterNumber' | 'dateIssued'>) => SchoolLetter;
  achievements: Achievement[];
  addAchievement: (ach: Omit<Achievement, 'id'>) => void;
  violations: Violation[];
  addViolation: (vio: Omit<Violation, 'id'>) => void;

  // Calendar, Logs & Backup
  calendar: AcademicCalendarItem[];
  activityLogs: ActivityLog[];
  addActivityLog: (action: string, details: string) => void;
  backupDatabase: () => string;
  restoreDatabase: (jsonString: string) => boolean;

  // User Accounts List
  userAccounts: User[];
  resetUserPassword: (account: Pick<User, 'id' | 'name' | 'role' | 'username' | 'referenceId'>, newPassword: string) => Promise<{ success: boolean; message?: string }>;
  toggleUserStatus: (userId: string) => void;

  // Database MySQL (phpMyAdmin)
  dbStatus: DbStatus;
  dbMessage: string;
  dbLastSync: string | null;
  dbPending: boolean;
  reloadFromDb: () => Promise<boolean>;
  pushAllToDb: () => Promise<{ ok: boolean; message: string; result?: any }>;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

export const SchoolProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const saved = localStorage.getItem('siakad_lb04_is_authenticated');
    return saved === 'true';
  });

  // Current active user. Only trusted when the saved session was actually
  // authenticated — otherwise this placeholder is never rendered because
  // App.tsx blocks access on `isAuthenticated` before reaching any dashboard.
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const authSaved = localStorage.getItem('siakad_lb04_is_authenticated');
    if (authSaved === 'true') {
      const savedUser = localStorage.getItem('siakad_lb04_current_user');
      if (savedUser) {
        try {
          return JSON.parse(savedUser);
        } catch (e) {
          // ignore JSON parse error
        }
      }
    }
    return {
      id: '',
      username: '',
      name: '',
      role: 'siswa',
      email: '',
      isActive: false
    };
  });

  // Academic Period
  const [academicYear, setAcademicYear] = useState('2025/2026');
  const [semester, setSemester] = useState<'Ganjil' | 'Genap'>('Ganjil');

  // School Profile
  const [schoolProfile, setSchoolProfile] = useState(() => ({ ...SCHOOL_PROFILE, ...loadSchoolMedia() }));

  // Ambil logo & foto sampul sekolah dari MySQL (bila server aktif)
  useEffect(() => {
    syncSchoolMediaFromServer().then(m => {
      if (!m) return;
      setSchoolProfile(prev => ({ ...prev, logo: m.logo || '', coverPhoto: m.coverPhoto || '' }));
      saveSchoolMediaLocal({ logo: m.logo, coverPhoto: m.coverPhoto });
    });
  }, []);

  // entities with LocalStorage Persistence
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState<boolean>(false);

  const openLogoutModal = () => setIsLogoutModalOpen(true);
  const closeLogoutModal = () => setIsLogoutModalOpen(false);
  const confirmLogout = () => {
    setIsLogoutModalOpen(false);
    logout();
  };
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('siakad_lb04_students');
    return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
  });

  const [teachers, setTeachers] = useState<Teacher[]>(() => {
    const saved = localStorage.getItem('siakad_lb04_teachers');
    return saved ? JSON.parse(saved) : INITIAL_TEACHERS;
  });

  const [subjects, setSubjects] = useState<Subject[]>(INITIAL_SUBJECTS);

  const [schedules, setSchedules] = useState<ScheduleItem[]>(() => {
    const saved = localStorage.getItem('siakad_lb04_schedules');
    return saved ? JSON.parse(saved) : INITIAL_SCHEDULES;
  });

  const [grades, setGrades] = useState<GradeItem[]>(() => {
    const saved = localStorage.getItem('siakad_lb04_grades');
    return saved ? JSON.parse(saved) : INITIAL_GRADES;
  });

  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem('siakad_lb04_attendance');
    return saved ? JSON.parse(saved) : INITIAL_ATTENDANCE;
  });

  const [mutations, setMutations] = useState<StudentMutation[]>(() => {
    const saved = localStorage.getItem('siakad_lb04_mutations');
    return saved ? JSON.parse(saved) : [];
  });

  const [achievements, setAchievements] = useState<Achievement[]>(() => {
    const saved = localStorage.getItem('siakad_lb04_achievements');
    return saved ? JSON.parse(saved) : INITIAL_ACHIEVEMENTS;
  });

  const [violations, setViolations] = useState<Violation[]>(() => {
    const saved = localStorage.getItem('siakad_lb04_violations');
    return saved ? JSON.parse(saved) : INITIAL_VIOLATIONS;
  });

  const [letters, setLetters] = useState<SchoolLetter[]>(() => {
    const saved = localStorage.getItem('siakad_lb04_letters');
    return saved ? JSON.parse(saved) : [];
  });

  const [calendar, setCalendar] = useState<AcademicCalendarItem[]>(INITIAL_CALENDAR);

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem('siakad_lb04_activityLogs');
    return saved ? JSON.parse(saved) : INITIAL_ACTIVITY_LOGS;
  });

  const [userAccounts, setUserAccounts] = useState<User[]>([
    { id: 'usr-admin', username: 'admin', name: 'Admin Utama SIAKAD', role: 'admin', isActive: true },
    { id: 'usr-kepsek', username: 'kepsek', name: 'Hj. Sri Rahayu, M.Pd (Kepala Sekolah)', role: 'kepsek', isActive: true },
    { id: 'usr-guru-1', username: 'guru', name: 'Budi Santoso, S.Pd', role: 'guru', isWaliKelas: true, assignedClass: '4A', referenceId: 'tch-1', isActive: true },
    { id: 'usr-guru-2', username: 'siti.aminah', name: 'Dra. Siti Aminah', role: 'guru', isWaliKelas: true, assignedClass: '1A', referenceId: 'tch-2', isActive: true },
    { id: 'usr-siswa-1', username: '0098765432', name: 'Muhammad Farhan Al-Fatih', role: 'siswa', referenceId: 'std-1', isActive: true }
  ]);

  // Sync to local storage on changes
  useEffect(() => {
    localStorage.setItem('siakad_lb04_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('siakad_lb04_teachers', JSON.stringify(teachers));
  }, [teachers]);

  useEffect(() => {
    localStorage.setItem('siakad_lb04_schedules', JSON.stringify(schedules));
  }, [schedules]);

  useEffect(() => {
    localStorage.setItem('siakad_lb04_grades', JSON.stringify(grades));
  }, [grades]);

  useEffect(() => {
    localStorage.setItem('siakad_lb04_attendance', JSON.stringify(attendance));
  }, [attendance]);

  useEffect(() => {
    localStorage.setItem('siakad_lb04_mutations', JSON.stringify(mutations));
  }, [mutations]);

  useEffect(() => {
    localStorage.setItem('siakad_lb04_achievements', JSON.stringify(achievements));
  }, [achievements]);

  useEffect(() => {
    localStorage.setItem('siakad_lb04_violations', JSON.stringify(violations));
  }, [violations]);

  useEffect(() => {
    localStorage.setItem('siakad_lb04_letters', JSON.stringify(letters));
  }, [letters]);

  useEffect(() => {
    localStorage.setItem('siakad_lb04_activityLogs', JSON.stringify(activityLogs));
  }, [activityLogs]);

  // ---------------------------------------------------------------------
  // SINKRONISASI MYSQL (phpMyAdmin)
  //  - Dibuka  : data dibaca dari MySQL
  //  - Berubah : hanya baris yang berubah dikirim ke MySQL (otomatis)
  //  - MySQL mati: aplikasi tetap jalan memakai data di browser, lalu
  //    mencoba tersambung lagi tiap 15 detik.
  // ---------------------------------------------------------------------
  const [dbStatus, setDbStatus] = useState<DbStatus>('checking');
  const [dbMessage, setDbMessage] = useState('Memeriksa koneksi MySQL...');
  const [dbLastSync, setDbLastSync] = useState<string | null>(null);
  const [dbPending, setDbPending] = useState(false);

  const dbStatusRef = useRef<DbStatus>('checking');
  const dbReadyRef = useRef(false);           // true = sudah sinkron dengan MySQL, aman menyimpan
  const offlineEditedRef = useRef(false);     // ada perubahan data saat MySQL tidak tersambung
  const snapshotsRef = useRef<Record<string, Snapshot>>({});
  const syncingRef = useRef(false);
  const queuedRef = useRef(false);
  const timerRef = useRef<number | undefined>(undefined);
  const prevCollectionsRef = useRef<Record<SyncKey, any[]> | null>(null);

  // Selalu berisi data terbaru (dibaca dari dalam callback async)
  const latestRef = useRef<Record<SyncKey, any[]>>({} as any);
  latestRef.current = { students, teachers, schedules, grades, attendance, achievements, violations, mutations, letters, activityLogs };

  const updateDbStatus = (status: DbStatus, message: string) => {
    dbStatusRef.current = status;
    setDbStatus(status);
    setDbMessage(message);
  };
  const nowLabel = () => new Date().toLocaleTimeString('id-ID');

  const applyRemote = (data: Record<string, any[]>) => {
    const snaps: Record<string, Snapshot> = {};
    for (const key of SYNC_KEYS) snaps[key] = makeSnapshot(data[key] || []);
    snapshotsRef.current = snaps;
    dbReadyRef.current = true;
    offlineEditedRef.current = false;

    setStudents(data.students || []);
    setTeachers(data.teachers || []);
    setSchedules(data.schedules || []);
    setGrades(data.grades || []);
    setAttendance(data.attendance || []);
    setAchievements(data.achievements || []);
    setViolations(data.violations || []);
    setMutations(data.mutations || []);
    setLetters(data.letters || []);
    setActivityLogs(data.activityLogs || []);
    if (data.subjects && data.subjects.length > 0) setSubjects(data.subjects);
    if (data.calendar) setCalendar(data.calendar);
  };

  const markAllSynced = (collections: Record<SyncKey, any[]>) => {
    const snaps: Record<string, Snapshot> = {};
    for (const key of SYNC_KEYS) snaps[key] = makeSnapshot(collections[key] || []);
    snapshotsRef.current = snaps;
    dbReadyRef.current = true;
    offlineEditedRef.current = false;
    setDbPending(false);
    setDbLastSync(nowLabel());
  };

  const loadFromDb = useCallback(async (force = false): Promise<boolean> => {
    const r = await fetchDbState();
    if (!r.ok) {
      dbReadyRef.current = false;
      updateDbStatus('offline', `MySQL belum tersambung: ${r.error}. Data sementara disimpan di browser.`);
      return false;
    }

    // Database masih kosong (baru dibuat) → isi dengan data aplikasi saat ini
    if (r.empty) {
      const local = latestRef.current;
      const p = await pushAll(local);
      if (!p.ok) {
        dbReadyRef.current = false;
        updateDbStatus('error', `Gagal mengisi data awal ke MySQL: ${p.error}`);
        return false;
      }
      markAllSynced(local);
      updateDbStatus('connected', 'Terhubung ke MySQL. Data awal aplikasi sudah dimasukkan ke database.');
      return true;
    }

    // Ada perubahan yang dibuat saat MySQL mati → jangan ditimpa diam-diam
    if (!force && offlineEditedRef.current) {
      dbReadyRef.current = false;
      updateDbStatus(
        'conflict',
        'MySQL sudah tersambung, tetapi ada perubahan data di browser yang belum tersimpan ke MySQL. Buka menu Database & Backup untuk memilih: muat dari MySQL, atau kirim data browser ke MySQL.'
      );
      return false;
    }

    applyRemote(r.data!);
    setDbPending(false);
    setDbLastSync(nowLabel());
    updateDbStatus('connected', 'Data dimuat dari MySQL. Perubahan otomatis tersimpan ke database.');
    return true;
  }, []);

  const flushToDb = useCallback(async () => {
    if (!dbReadyRef.current) return;
    if (syncingRef.current) { queuedRef.current = true; return; }
    syncingRef.current = true;
    try {
      const payload: Partial<Record<SyncKey, ChangeSet>> = {};
      const toCommit: { key: SyncKey; sent: ChangeSet; forgetDeleted: string[] }[] = [];

      for (const key of SYNC_KEYS) {
        const cs = diffCollection(latestRef.current[key] || [], snapshotsRef.current[key] || new Map());
        if (cs.upsert.length === 0 && cs.delete.length === 0) continue;
        // Log aktivitas bersifat append-only di database: tidak pernah dihapus
        const forgetDeleted = key === 'activityLogs' ? cs.delete : [];
        const sent: ChangeSet = key === 'activityLogs' ? { upsert: cs.upsert, delete: [] } : cs;
        if (sent.upsert.length > 0 || sent.delete.length > 0) payload[key] = sent;
        toCommit.push({ key, sent, forgetDeleted });
      }

      if (toCommit.length === 0) { setDbPending(false); return; }

      setDbPending(true);
      const r = await pushChanges(payload);
      if (r.ok) {
        for (const { key, sent, forgetDeleted } of toCommit) {
          commitToSnapshot(snapshotsRef.current[key], sent);
          for (const id of forgetDeleted) snapshotsRef.current[key].delete(id);
        }
        const skippedTotal = Object.values(r.skipped || {}).reduce((a, b) => a + b, 0);
        setDbLastSync(nowLabel());
        setDbPending(false);
        updateDbStatus(
          'connected',
          skippedTotal > 0
            ? `Tersimpan ke MySQL. ${skippedTotal} data dilewati karena siswa/guru/mapel yang dirujuk tidak ada.`
            : 'Semua perubahan tersimpan ke MySQL.'
        );
      } else {
        updateDbStatus('error', `Gagal menyimpan ke MySQL: ${r.error}. Akan dicoba lagi otomatis.`);
      }
    } finally {
      syncingRef.current = false;
      if (queuedRef.current) {
        queuedRef.current = false;
        window.clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(flushToDb, 300);
      }
    }
  }, []);

  // Muat dari MySQL saat aplikasi dibuka + coba sambung ulang / kirim ulang berkala
  useEffect(() => {
    loadFromDb();
    const interval = window.setInterval(() => {
      if (dbStatusRef.current === 'conflict') return;
      if (!dbReadyRef.current) loadFromDb();
      else if (dbStatusRef.current === 'error') flushToDb();
    }, 15000);
    return () => window.clearInterval(interval);
  }, [loadFromDb, flushToDb]);

  // Setiap ada perubahan data → jadwalkan penyimpanan ke MySQL
  useEffect(() => {
    const cur = latestRef.current;
    const prev = prevCollectionsRef.current;
    prevCollectionsRef.current = cur;
    if (!prev) return;
    const changedKeys = SYNC_KEYS.filter((k) => prev[k] !== cur[k]);
    if (changedKeys.length === 0) return;

    if (!dbReadyRef.current) {
      // Log aktivitas (mis. catatan login) tidak dihitung sebagai "perubahan data"
      if (changedKeys.some((k) => k !== 'activityLogs')) offlineEditedRef.current = true;
      return;
    }
    setDbPending(true);
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(flushToDb, 600);
  }, [students, teachers, schedules, grades, attendance, achievements, violations, mutations, letters, activityLogs, flushToDb]);

  const reloadFromDb = useCallback(() => loadFromDb(true), [loadFromDb]);

  const pushAllToDb = useCallback(async () => {
    const local = latestRef.current;
    const r = await pushAll(local);
    if (!r.ok) {
      updateDbStatus('error', `Gagal mengirim data ke MySQL: ${r.error}`);
      return { ok: false, message: r.error || 'Gagal' };
    }
    markAllSynced(local);
    updateDbStatus('connected', 'Seluruh data aplikasi berhasil dikirim ke MySQL.');
    return { ok: true, message: 'Berhasil', result: r.result };
  }, []);

  // Activity Logger Helper
  const addActivityLog = (action: string, details: string) => {
    const now = new Date();
    const formattedDate = now.toISOString().replace('T', ' ').substring(0, 19);
    const newLog: ActivityLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: formattedDate,
      user: currentUser.name,
      role: currentUser.role,
      action,
      details
    };
    setActivityLogs(prev => [newLog, ...prev.slice(0, 99)]);
  };

  // Quick switch role
  const switchUser = (role: 'admin' | 'kepsek' | 'guru' | 'siswa', customId?: string) => {
    let newUser: User;

    if (role === 'admin') {
      newUser = {
        id: 'usr-admin',
        username: 'admin',
        name: 'Administrator SIAKAD (Super Admin)',
        role: 'admin',
        email: 'admin.siakad@sdnlubangbuaya04pagi.sch.id',
        avatar: readSavedAvatar('usr-admin'),
        isActive: true
      };
      addActivityLog('Beralih Role', 'Masuk sebagai Super Admin');
    } else if (role === 'kepsek') {
      newUser = {
        id: 'usr-kepsek',
        username: 'kepsek',
        name: 'Hj. Sri Rahayu, M.Pd (Kepala Sekolah)',
        role: 'kepsek',
        email: 'kepsek@sdnlubangbuaya04pagi.sch.id',
        isActive: true
      };
      addActivityLog('Beralih Role', 'Masuk sebagai Kepala Sekolah');
    } else if (role === 'guru') {
      const teacher = teachers.find(t => t.id === customId) || teachers[0];
      newUser = {
        id: `usr-${teacher.id}`,
        username: 'guru',
        name: teacher.name,
        role: 'guru',
        referenceId: teacher.id,
        isWaliKelas: teacher.isWaliKelas,
        assignedClass: teacher.assignedClass,
        email: teacher.email,
        avatar: teacher.photo,
        isActive: true
      };
      addActivityLog('Beralih Role', `Masuk sebagai Guru/Wali Kelas (${teacher.name} - ${teacher.assignedClass || 'Guru Mapel'})`);
    } else {
      const student = students.find(s => s.id === customId) || students[0];
      newUser = {
        id: `usr-${student.id}`,
        username: student.nisn,
        name: student.name,
        role: 'siswa',
        referenceId: student.id,
        email: student.email,
        avatar: student.photo,
        isActive: true
      };
      addActivityLog('Beralih Role', `Masuk sebagai Siswa (${student.name} - Kelas ${student.classId})`);
    }

    setCurrentUser(newUser);
    setIsAuthenticated(true);
    localStorage.setItem('siakad_lb04_is_authenticated', 'true');
    localStorage.setItem('siakad_lb04_current_user', JSON.stringify(newUser));
  };

  const loginWithCredentials = async (username: string, pass: string): Promise<{ success: boolean; message?: string }> => {
    const trimmedUser = username.trim().toLowerCase();
    const cleanPass = pass.trim();

    // 1. Super Admin — diperiksa oleh SERVER (hash + batas percobaan + sesi cookie HttpOnly)
    if (trimmedUser === 'admin') {
      try {
        const res = await fetch('/api/auth/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: trimmedUser, password: pass }),
        });
        const data = await res.json().catch(() => null);
        if (res.ok && data?.success) {
          switchUser('admin');
          return { success: true };
        }
        return { success: false, message: data?.message || 'Username atau kata sandi tidak cocok.' };
      } catch {
        return { success: false, message: 'Server tidak dapat dihubungi. Pastikan aplikasi dijalankan dengan "npm run dev".' };
      }
    }

    // 2. Kepala Sekolah, Guru, Siswa — diperiksa oleh SERVER
    try {
      const res = await fetch('/api/auth/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password: cleanPass }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        return { success: false, message: data?.message || 'Username atau kata sandi tidak cocok.' };
      }
      // Pastikan data orangnya ada di aplikasi, agar tidak masuk sebagai orang lain.
      if (data.role === 'guru' && data.referenceId && !teachers.some(t => t.id === data.referenceId)) {
        return { success: false, message: 'Data guru belum termuat. Muat ulang halaman lalu coba lagi.' };
      }
      if (data.role === 'siswa' && data.referenceId && !students.some(s => s.id === data.referenceId)) {
        return { success: false, message: 'Data siswa belum termuat. Muat ulang halaman lalu coba lagi.' };
      }
      switchUser(data.role, data.referenceId);
      return { success: true };
    } catch {
      return { success: false, message: 'Server tidak dapat dihubungi. Pastikan aplikasi dijalankan dengan "npm run dev" dan MySQL aktif.' };
    }
  };

  const logout = () => {
    addActivityLog('Logout', `Pengguna ${currentUser.name} keluar dari sistem`);
    if (currentUser.role === 'admin') {
      fetch('/api/auth/logout', { method: 'POST' }).catch(() => { /* abaikan */ });
    }
    setIsAuthenticated(false);
    localStorage.setItem('siakad_lb04_is_authenticated', 'false');
  };

  // Admin hanya dianggap login bila SERVER mengakui sesinya. Mengubah localStorage
  // lewat DevTools tidak cukup untuk menjadi admin.
  useEffect(() => {
    if (!isAuthenticated || currentUser.role !== 'admin') return;
    let cancelled = false;
    const verify = async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (!cancelled && res.ok && data?.authenticated === false) {
          setIsAuthenticated(false);
          localStorage.setItem('siakad_lb04_is_authenticated', 'false');
        }
      } catch { /* server mati: biarkan, aksi admin tetap ditolak server */ }
    };
    verify();
    window.addEventListener('focus', verify);
    return () => { cancelled = true; window.removeEventListener('focus', verify); };
  }, [isAuthenticated, currentUser.role]);

  // Student Methods
  const generateNis = (admissionYear: string): string => {
    const yearPrefix = (admissionYear || '2025').slice(-2);
    const schoolCode = '04';
    const sequence = (students.length + 1).toString().padStart(3, '0');
    return `${yearPrefix}${schoolCode}${sequence}`;
  };

  const generateStudentAccount = (student: Student) => {
    const existing = userAccounts.find(u => u.username === student.nisn);
    if (!existing) {
      const newAccount: User = {
        id: `usr-${student.id}`,
        username: student.nisn,
        name: student.name,
        role: 'siswa',
        referenceId: student.id,
        email: student.email,
        isActive: true
      };
      setUserAccounts(prev => [...prev, newAccount]);
      addActivityLog('Generate Akun Siswa', `Akun otomatis dibuat untuk NISN ${student.nisn} (${student.name})`);
    }
  };

  const addStudent = (studentData: Omit<Student, 'id'>): Student => {
    const newStudent: Student = {
      ...studentData,
      id: `std-${Date.now()}`
    };
    setStudents(prev => [newStudent, ...prev]);
    generateStudentAccount(newStudent);
    addActivityLog('Tambah Siswa', `Menambahkan siswa baru: ${newStudent.name} (${newStudent.nisn}) ke Kelas ${newStudent.classId}`);
    return newStudent;
  };

  const addBatchStudents = (newStudentsData: Omit<Student, 'id'>[], overwriteExisting = false): { added: number; updated: number } => {
    let addedCount = 0;
    let updatedCount = 0;

    setStudents(prev => {
      const studentMap = new Map<string, Student>();
      prev.forEach(s => studentMap.set(s.nisn, s));

      const newAccounts: User[] = [];

      newStudentsData.forEach((item, idx) => {
        const existing = studentMap.get(item.nisn);
        if (existing) {
          if (overwriteExisting) {
            studentMap.set(item.nisn, { ...existing, ...item });
            updatedCount++;
          }
        } else {
          const newId = `std-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`;
          const created: Student = { ...item, id: newId };
          studentMap.set(item.nisn, created);
          addedCount++;

          newAccounts.push({
            id: `usr-${created.id}`,
            username: created.nisn,
            name: created.name,
            role: 'siswa',
            referenceId: created.id,
            email: created.email,
            isActive: true
          });
        }
      });

      if (newAccounts.length > 0) {
        setUserAccounts(old => [...old, ...newAccounts]);
      }

      return Array.from(studentMap.values());
    });

    addActivityLog('Import Excel Siswa', `Berhasil import massal Excel: ${addedCount} siswa baru ditambahkan, ${updatedCount} siswa diperbarui.`);
    return { added: addedCount, updated: updatedCount };
  };

  const updateStudent = (id: string, data: Partial<Student>) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
    if (currentUser.referenceId === id && data.photo) {
      setCurrentUser(prev => ({ ...prev, avatar: data.photo }));
      try {
        const savedUser = localStorage.getItem('siakad_lb04_current_user');
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          parsed.avatar = data.photo;
          localStorage.setItem('siakad_lb04_current_user', JSON.stringify(parsed));
        }
      } catch (e) {
        // ignore
      }
    }
    addActivityLog('Update Siswa', `Memperbarui data siswa ID: ${id}`);
  };

  const deleteStudent = (id: string) => {
    const target = students.find(s => s.id === id);
    setStudents(prev => prev.filter(s => s.id !== id));
    addActivityLog('Hapus Siswa', `Menghapus data siswa: ${target?.name || id}`);
  };

  // Teacher Methods
  const addTeacher = (data: Omit<Teacher, 'id'>): Teacher => {
    const newTeacher: Teacher = {
      ...data,
      id: `tch-${Date.now()}`
    };
    setTeachers(prev => [...prev, newTeacher]);
    addActivityLog('Tambah Guru', `Menambahkan guru: ${newTeacher.name} (NIP: ${newTeacher.nip})`);
    return newTeacher;
  };

  const updateTeacher = (id: string, data: Partial<Teacher>) => {
    setTeachers(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
    addActivityLog('Update Guru', `Memperbarui profil guru ID: ${id}`);
  };

  // Ganti / hapus foto profil — hanya untuk akun Admin (disimpan di browser)
  const updateProfilePhoto = (photo: string | null) => {
    if (currentUser.role !== 'admin') return;
    const avatar = photo || undefined;
    try {
      const key = `siakad_lb04_avatar_${currentUser.id}`;
      if (avatar) localStorage.setItem(key, avatar); else localStorage.removeItem(key);
    } catch { /* abaikan */ }
    const updated = { ...currentUser, avatar };
    setCurrentUser(updated);
    try { localStorage.setItem('siakad_lb04_current_user', JSON.stringify(updated)); } catch { /* abaikan */ }
    addActivityLog('Foto Profil', `${currentUser.name} ${avatar ? 'memperbarui' : 'menghapus'} foto profil.`);
  };

  const deleteTeacher = (id: string) => {
    const target = teachers.find(t => t.id === id);
    setTeachers(prev => prev.filter(t => t.id !== id));
    addActivityLog('Hapus Guru', `Menghapus data guru: ${target?.name || id}`);
  };

  const assignWaliKelas = (teacherId: string, classId: string) => {
    setTeachers(prev => prev.map(t => {
      if (t.id === teacherId) {
        return { ...t, isWaliKelas: true, assignedClass: classId };
      }
      // If another teacher had this class, clear it
      if (t.assignedClass === classId && t.id !== teacherId) {
        return { ...t, isWaliKelas: false, assignedClass: undefined };
      }
      return t;
    }));
    const teacher = teachers.find(t => t.id === teacherId);
    addActivityLog('Penetapan Wali Kelas', `Menetapkan ${teacher?.name} sebagai Wali Kelas ${classId}`);
  };

  // Schedule with Conflict Validation
  const addSchedule = (sch: Omit<ScheduleItem, 'id'>): { success: boolean; conflictError?: string } => {
    // Conflict Check 1: Guru mengajar dua kelas pada waktu & hari yang sama
    const teacherConflict = schedules.find(s => 
      s.day === sch.day && 
      s.teacherId === sch.teacherId &&
      ((sch.startTime >= s.startTime && sch.startTime < s.endTime) ||
       (sch.endTime > s.startTime && sch.endTime <= s.endTime))
    );
    if (teacherConflict) {
      return { 
        success: false, 
        conflictError: `Konflik Guru: ${sch.teacherName} sudah terjadwal mengajar di Kelas ${teacherConflict.classId} pada ${sch.day} (${teacherConflict.startTime} - ${teacherConflict.endTime})!`
      };
    }

    // Conflict Check 2: Kelas memiliki dua mata pelajaran pada waktu yang sama
    const classConflict = schedules.find(s => 
      s.day === sch.day && 
      s.classId === sch.classId &&
      ((sch.startTime >= s.startTime && sch.startTime < s.endTime) ||
       (sch.endTime > s.startTime && sch.endTime <= s.endTime))
    );
    if (classConflict) {
      return {
        success: false,
        conflictError: `Konflik Kelas: Kelas ${sch.classId} sudah ada jadwal ${classConflict.subjectName} pada ${sch.day} (${classConflict.startTime} - ${classConflict.endTime})!`
      };
    }

    // Conflict Check 3: Ruangan digunakan dua kelas bersamaan
    const roomConflict = schedules.find(s => 
      s.day === sch.day && 
      s.room === sch.room &&
      ((sch.startTime >= s.startTime && sch.startTime < s.endTime) ||
       (sch.endTime > s.startTime && sch.endTime <= s.endTime))
    );
    if (roomConflict) {
      return {
        success: false,
        conflictError: `Konflik Ruangan: Ruangan ${sch.room} sedang dipakai oleh Kelas ${roomConflict.classId} (${roomConflict.subjectName})!`
      };
    }

    const newSchedule: ScheduleItem = {
      ...sch,
      id: `sch-${Date.now()}`
    };
    setSchedules(prev => [...prev, newSchedule]);
    addActivityLog('Tambah Jadwal', `Menambahkan jadwal ${sch.subjectName} untuk Kelas ${sch.classId} pada hari ${sch.day}`);
    return { success: true };
  };

  const deleteSchedule = (id: string) => {
    setSchedules(prev => prev.filter(s => s.id !== id));
    addActivityLog('Hapus Jadwal', `Menghapus jadwal ID: ${id}`);
  };

  // Grade Methods
  const saveGrade = (gradeData: Omit<GradeItem, 'id'> | GradeItem) => {
    if ('id' in gradeData && gradeData.id) {
      setGrades(prev => prev.map(g => g.id === gradeData.id ? (gradeData as GradeItem) : g));
      addActivityLog('Update Nilai', `Memperbarui nilai ${gradeData.subjectName} untuk siswa ${gradeData.studentName}`);
    } else {
      const newGrade: GradeItem = {
        ...gradeData,
        id: `grd-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`
      };
      setGrades(prev => [...prev, newGrade]);
      addActivityLog('Input Nilai', `Menyimpan nilai baru ${newGrade.subjectName} untuk siswa ${newGrade.studentName}`);
    }
  };

  const lockGradesForClass = (classId: string, subjectId: string) => {
    setGrades(prev => prev.map(g => {
      if (g.classId === classId && (subjectId === 'ALL' || g.subjectId === subjectId)) {
        return { ...g, isLocked: true };
      }
      return g;
    }));
    addActivityLog('Kunci Nilai Rapor', `Mengunci nilai akhir untuk Kelas ${classId}`);
  };

  // MASS IMPORT GRADES PIPELINE
  const importMassGrades = (items: MassImportPreviewItem[], overwriteExisting: boolean): { imported: number; updated: number; skipped: number } => {
    let imported = 0;
    let updated = 0;
    let skipped = 0;

    setGrades(prevGrades => {
      const nextGrades = [...prevGrades];

      for (const item of items) {
        if (item.status !== 'valid') continue;

        const student = students.find(s => s.nisn === item.nisn);
        const subject = subjects.find(sub => sub.name.toLowerCase() === item.subject.toLowerCase() || sub.code.toLowerCase() === item.subject.toLowerCase()) || subjects[0];

        if (!student) continue;

        const existingIndex = nextGrades.findIndex(g => 
          g.studentNisn === item.nisn && 
          g.subjectName.toLowerCase() === subject.name.toLowerCase() &&
          g.semester === item.semester &&
          g.academicYear === item.academicYear
        );

        if (existingIndex >= 0) {
          if (overwriteExisting) {
            nextGrades[existingIndex] = {
              ...nextGrades[existingIndex],
              finalScore: item.finalScore,
              achievementDescription: item.description || nextGrades[existingIndex].achievementDescription,
              formatif: item.finalScore,
              uts: item.finalScore,
              uas: item.finalScore
            };
            updated++;
          } else {
            skipped++;
          }
        } else {
          nextGrades.push({
            id: `grd-imp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            studentId: student.id,
            studentNisn: student.nisn,
            studentName: student.name,
            classId: student.classId,
            subjectId: subject.id,
            subjectName: subject.name,
            academicYear: item.academicYear || academicYear,
            semester: (item.semester as 'Ganjil' | 'Genap') || semester,
            formatif: item.finalScore,
            uts: item.finalScore,
            uas: item.finalScore,
            finalScore: item.finalScore,
            achievementDescription: item.description || `Menunjukkan pemahaman baik pada tujuan pembelajaran ${subject.name}.`,
            isLocked: true
          });
          imported++;
        }
      }

      return nextGrades;
    });

    addActivityLog('Import Nilai Massal', `Berhasil import nilai rapor: ${imported} baru, ${updated} diperbarui, ${skipped} dilewati.`);
    return { imported, updated, skipped };
  };

  // Attendance
  const recordAttendance = (classId: string, date: string, records: { studentId: string; status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpa'; notes?: string }[]) => {
    setAttendance(prev => {
      // remove any records for same class and date
      const filtered = prev.filter(a => !(a.classId === classId && a.date === date));
      const newItems: AttendanceRecord[] = records.map(r => {
        const std = students.find(s => s.id === r.studentId);
        return {
          id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          studentId: r.studentId,
          studentName: std?.name || 'Siswa',
          classId,
          date,
          status: r.status,
          notes: r.notes
        };
      });
      return [...filtered, ...newItems];
    });
    addActivityLog('Input Absensi', `Mencatat presensi ${records.length} siswa Kelas ${classId} tanggal ${date}`);
  };

  // Class Promotion & Graduation
  const promoteClass = (currentClass: string, targetClass: string, studentIds: string[]) => {
    setStudents(prev => prev.map(s => {
      if (studentIds.includes(s.id)) {
        return { ...s, classId: targetClass };
      }
      return s;
    }));
    addActivityLog('Kenaikan Kelas', `Memindahkan/Menaikkan ${studentIds.length} siswa dari Kelas ${currentClass} ke Kelas ${targetClass}`);
  };

  const graduateStudents = (studentIds: string[], graduationDate: string) => {
    setStudents(prev => prev.map(s => {
      if (studentIds.includes(s.id)) {
        return { ...s, status: 'Lulus' };
      }
      return s;
    }));
    addActivityLog('Kelulusan Siswa', `Menetapkan ${studentIds.length} siswa Kelas 6 sebagai Alumni per ${graduationDate}`);
  };

  // Mutations
  const addMutation = (mutationData: Omit<StudentMutation, 'id'>) => {
    const newMut: StudentMutation = {
      ...mutationData,
      id: `mut-${Date.now()}`
    };
    setMutations(prev => [newMut, ...prev]);
    // update student status
    if (mutationData.type === 'Keluar' || mutationData.type === 'Pindah Sekolah') {
      setStudents(prev => prev.map(s => s.id === mutationData.studentId ? { ...s, status: 'Mutasi Keluar' } : s));
    } else if (mutationData.type === 'Pindah Kelas' && mutationData.toSchoolOrClass) {
      setStudents(prev => prev.map(s => s.id === mutationData.studentId ? { ...s, classId: mutationData.toSchoolOrClass! } : s));
    }
    addActivityLog('Mutasi Siswa', `Mutasi ${mutationData.type} untuk ${mutationData.studentName} (${mutationData.nisn})`);
  };

  // Letters
  const generateLetter = (data: Omit<SchoolLetter, 'id' | 'letterNumber' | 'dateIssued'>): SchoolLetter => {
    const romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
    const currentMonth = romanMonths[new Date().getMonth()];
    const currentYear = new Date().getFullYear();
    const seq = (letters.length + 101).toString();
    const letterNumber = `421.2/${seq}/SDN-LB04/${currentMonth}/${currentYear}`;

    const newLetter: SchoolLetter = {
      ...data,
      id: `ltr-${Date.now()}`,
      letterNumber,
      dateIssued: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    };

    setLetters(prev => [newLetter, ...prev]);
    addActivityLog('Penerbitan Surat', `Menerbitkan ${newLetter.type} No. ${letterNumber} untuk ${newLetter.studentName}`);
    return newLetter;
  };

  // Achievements & Violations
  const addAchievement = (ach: Omit<Achievement, 'id'>) => {
    const newAch: Achievement = { ...ach, id: `ach-${Date.now()}` };
    setAchievements(prev => [newAch, ...prev]);
    addActivityLog('Prestasi Siswa', `Pencatatan prestasi: ${ach.title} oleh ${ach.studentName}`);
  };

  const addViolation = (vio: Omit<Violation, 'id'>) => {
    const newVio: Violation = { ...vio, id: `vio-${Date.now()}` };
    setViolations(prev => [newVio, ...prev]);
    addActivityLog('Pelanggaran Siswa', `Pencatatan poin pelanggaran untuk ${vio.studentName}: ${vio.type} (+${vio.points} poin)`);
  };

  // User Accounts
  const resetUserPassword = async (
    account: Pick<User, 'id' | 'name' | 'role' | 'username' | 'referenceId'>,
    newPassword: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch('/api/admin/user-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: account.role,
          username: account.username,
          referenceId: account.referenceId,
          newPassword,
        }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        addActivityLog('Reset Password', `Admin mengatur kata sandi baru untuk akun ${account.name} (${account.role}).`);
        return { success: true };
      }
      if (res.status === 401) return { success: false, message: 'Sesi admin berakhir. Silakan login ulang.' };
      return { success: false, message: data?.message || 'Gagal menyimpan kata sandi.' };
    } catch {
      return { success: false, message: 'Server tidak dapat dihubungi.' };
    }
  };

  const toggleUserStatus = (userId: string) => {
    setUserAccounts(prev => prev.map(u => u.id === userId ? { ...u, isActive: !u.isActive } : u));
    addActivityLog('Ubah Status Akun', `Mengubah status aktif user ID: ${userId}`);
  };

  const updateSchoolProfile = (profile: Partial<typeof SCHOOL_PROFILE>) => {
    setSchoolProfile(prev => ({ ...prev, ...profile }));
    addActivityLog('Update Profil Sekolah', 'Memperbarui informasi profil dan kontak sekolah');
  };

  const updateSchoolMedia = async (media: SchoolMedia): Promise<'db' | 'local' | 'gagal'> => {
    const next = {
      logo: media.logo !== undefined ? media.logo : schoolProfile.logo,
      coverPhoto: media.coverPhoto !== undefined ? media.coverPhoto : schoolProfile.coverPhoto,
    };
    const savedLocal = saveSchoolMediaLocal(next);
    setSchoolProfile(prev => ({ ...prev, logo: next.logo || '', coverPhoto: next.coverPhoto || '' }));
    const what = media.logo !== undefined ? 'logo' : 'foto sampul';
    const removed = media.logo === '' || media.coverPhoto === '';
    addActivityLog('Update Profil Sekolah', `${removed ? 'Menghapus' : 'Memperbarui'} ${what} sekolah`);
    const savedDb = await saveSchoolMediaToServer(next);
    if (savedDb) return 'db';
    return savedLocal ? 'local' : 'gagal';
  };

  // Database Backup and Restore
  const backupDatabase = (): string => {
    const backupData = {
      version: '2.0-SIAKAD-MEWAH',
      school: schoolProfile.name,
      timestamp: new Date().toISOString(),
      academicYear,
      semester,
      students,
      teachers,
      schedules,
      grades,
      attendance,
      mutations,
      achievements,
      violations,
      letters,
      activityLogs
    };
    addActivityLog('Backup Database', 'Admin mengunduh snapshot backup database lengkap');
    return JSON.stringify(backupData, null, 2);
  };

  const restoreDatabase = (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (data.students) setStudents(data.students);
      if (data.teachers) setTeachers(data.teachers);
      if (data.schedules) setSchedules(data.schedules);
      if (data.grades) setGrades(data.grades);
      if (data.attendance) setAttendance(data.attendance);
      if (data.mutations) setMutations(data.mutations);
      if (data.achievements) setAchievements(data.achievements);
      if (data.violations) setViolations(data.violations);
      if (data.letters) setLetters(data.letters);
      addActivityLog('Restore Database', 'Database berhasil dipulihkan dari file backup eksternal');
      return true;
    } catch {
      return false;
    }
  };

  return (
    <SchoolContext.Provider value={{
      isAuthenticated,
      currentUser,
      switchUser,
      loginWithCredentials,
      logout,
      updateProfilePhoto,
      isLogoutModalOpen,
      openLogoutModal,
      closeLogoutModal,
      confirmLogout,
      academicYear,
      semester,
      setAcademicYear,
      setSemester,
      schoolProfile,
      updateSchoolProfile,
      updateSchoolMedia,
      students,
      addStudent,
      addBatchStudents,
      updateStudent,
      deleteStudent,
      generateNis,
      generateStudentAccount,
      teachers,
      addTeacher,
      updateTeacher,
      deleteTeacher,
      assignWaliKelas,
      subjects,
      schedules,
      addSchedule,
      deleteSchedule,
      grades,
      saveGrade,
      lockGradesForClass,
      importMassGrades,
      attendance,
      recordAttendance,
      mutations,
      addMutation,
      promoteClass,
      graduateStudents,
      letters,
      generateLetter,
      achievements,
      addAchievement,
      violations,
      addViolation,
      calendar,
      activityLogs,
      addActivityLog,
      backupDatabase,
      restoreDatabase,
      userAccounts,
      resetUserPassword,
      toggleUserStatus,
      dbStatus,
      dbMessage,
      dbLastSync,
      dbPending,
      reloadFromDb,
      pushAllToDb
    }}>
      {children}
    </SchoolContext.Provider>
  );
};

export const useSchool = () => {
  const context = useContext(SchoolContext);
  if (!context) {
    throw new Error('useSchool must be used within a SchoolProvider');
  }
  return context;
};
