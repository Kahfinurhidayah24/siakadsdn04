export type Role = 'admin' | 'kepsek' | 'guru' | 'siswa';

export interface User {
  id: string;
  username: string;
  name: string;
  role: Role;
  email?: string;
  avatar?: string;
  referenceId?: string; // studentId or teacherId
  isWaliKelas?: boolean;
  assignedClass?: string; // e.g. "1A", "4C"
  isActive: boolean;
}

export interface ParentInfo {
  fatherName: string;
  motherName: string;
  guardianName?: string;
  fatherOccupation?: string;
  motherOccupation?: string;
  phone: string;
  address: string;
  nik?: string;
}

export interface Student {
  id: string;
  nis: string;
  nisn: string;
  name: string;
  gender: 'L' | 'P';
  birthPlace: string;
  birthDate: string;
  religion: string;
  address: string;
  phone: string;
  email?: string;
  photo?: string;
  signature?: string;
  admissionYear: string;
  classId: string; // e.g., "1A", "4C"
  status: 'Aktif' | 'Lulus' | 'Mutasi Keluar' | 'Pindah Kelas';
  parent: ParentInfo;
}

export interface Teacher {
  id: string;
  nip: string;
  nuptk?: string;
  name: string;
  gender: 'L' | 'P';
  birthPlace: string;
  birthDate: string;
  phone: string;
  email: string;
  photo?: string;
  subjects: string[]; // e.g. ["Matematika", "IPAS"]
  isWaliKelas: boolean;
  assignedClass?: string; // e.g. "4A"
  status: 'PNS' | 'PPPK' | 'Honorer';
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  category: 'Wajib' | 'Muatan Lokal' | 'Pilihan';
  kkm: number; // Kriteria Ketercapaian Tujuan Pembelajaran (e.g. 75)
  gradeLevels: number[]; // e.g. [1, 2, 3, 4, 5, 6]
}

export interface ScheduleItem {
  id: string;
  day: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat';
  startTime: string; // "07:00"
  endTime: string;   // "08:20"
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  classId: string;
  room: string;
}

export interface GradeItem {
  id: string;
  studentId: string;
  studentNisn: string;
  studentName: string;
  classId: string;
  subjectId: string;
  subjectName: string;
  academicYear: string; // "2025/2026"
  semester: 'Ganjil' | 'Genap';
  formatif: number; // average tasks/formative
  uts: number;      // PTS/UTS
  uas: number;      // PAS/UAS
  finalScore: number;
  achievementDescription: string;
  isLocked?: boolean;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  date: string; // YYYY-MM-DD
  status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpa';
  notes?: string;
}

export interface StudentMutation {
  id: string;
  studentId: string;
  studentName: string;
  nisn: string;
  type: 'Masuk' | 'Pindah Sekolah' | 'Keluar' | 'Pindah Kelas';
  date: string;
  fromSchoolOrClass?: string;
  toSchoolOrClass?: string;
  reason: string;
  documentNo?: string;
}

export interface Achievement {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  title: string;
  level: 'Sekolah' | 'Kecamatan' | 'Kota' | 'Provinsi' | 'Nasional' | 'Internasional';
  rank: string;
  year: string;
  certificateNo?: string;
}

export interface Violation {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  date: string;
  type: string;
  points: number;
  actionTaken: string;
  notes?: string;
}

export interface SchoolLetter {
  id: string;
  letterNumber: string;
  studentId: string;
  studentName: string;
  studentNis: string;
  studentNisn: string;
  classId: string;
  type: 'Surat Keterangan Aktif' | 'Surat Keterangan Lulus' | 'Surat Rekomendasi' | 'Surat Kelakuan Baik';
  dateIssued: string;
  purpose: string;
  principalName: string;
  principalNip: string;
}

export interface AcademicCalendarItem {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  category: 'KBM' | 'Ujian' | 'Rapor' | 'Libur' | 'Kegiatan';
  description?: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  user: string;
  role: Role;
  action: string;
  details: string;
}

export interface MassImportPreviewItem {
  nisn: string;
  name: string;
  classId: string;
  subject: string;
  semester: string;
  academicYear: string;
  finalScore: number;
  description: string;
  status: 'valid' | 'nisn_not_found' | 'subject_not_found' | 'class_mismatch' | 'invalid_score';
  statusMessage: string;
  isExisting?: boolean;
}
