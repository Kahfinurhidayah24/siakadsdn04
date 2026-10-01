import { Student, Teacher, Subject, ScheduleItem, GradeItem, AttendanceRecord, Achievement, Violation, AcademicCalendarItem, ActivityLog } from '../types';

export const ALL_18_CLASSES = [
  '1A', '1B', '1C',
  '2A', '2B', '2C',
  '3A', '3B', '3C',
  '4A', '4B', '4C',
  '5A', '5B', '5C',
  '6A', '6B', '6C',
];

export const ALL_CLASSES = ALL_18_CLASSES;
export const ALL_36_CLASSES = ALL_18_CLASSES;

export const SCHOOL_PROFILE = {
  logo: '' as string,        // logo sekolah (data URL), diatur Admin
  coverPhoto: '' as string,  // foto sampul / gedung sekolah (data URL), diatur Admin
  name: 'SDN LUBANG BUAYA 04 PAGI',
  npsn: '20104241',
  nss: '101016408004',
  accreditation: 'A (Unggul)',
  curriculum: 'Kurikulum Merdeka',
  address: 'Jl. Monumen Pancasila Sakti Rt.001/02 No. 12 Kec. Cipayung. Jakarta Timur, Jakarta Timur, Provinsi DKI Jakarta',
  desaKelurahan: 'LUBANG BUAYA',
  kecamatan: 'KEC. CIPAYUNG',
  kabKota: 'KOTA ADM. JAKARTA TIMUR',
  provinsi: 'PROV. D.K.I. JAKARTA',
  status: 'NEGERI',
  bentukPendidikan: 'SD',
  jenjangPendidikan: 'DIKDAS',
  phone: '(021) 8408194',
  email: 'sdnlubangbuaya04@jakarta.go.id',
  website: 'https://sdnlubangbuaya04pagi.sch.id',
  principal: {
    name: 'Hj. Sri Rahayu, M.Pd',
    nip: '196805121991032004',
    signatureTitle: 'Kepala SDN Lubang Buaya 04 Pagi'
  },
  stats: {
    teachers: 22,
    maleStudents: 274,
    femaleStudents: 299,
    totalStudents: 573,
    rombel: 18,
    classrooms: 9,
    laboratories: 1,
    library: 1,
    musholla: 1,
  },
  facilities: [
    { name: 'Ruang Kelas Pembelajaran', count: 9, condition: 'Baik & Ber-AC (9 Ruang untuk 18 Rombel Sesi Pagi/Siang)' },
    { name: 'Laboratorium Komputer & IPA', count: 1, condition: 'Sangat Baik (30 PC & Internet Stabil)' },
    { name: 'Perpustakaan Ramah Anak', count: 1, condition: 'Koleksi Lengkap Kurikulum Merdeka' },
    { name: 'Mushollah Baitul Ilmi', count: 1, condition: 'Bersih, Sejuk & Nyaman untuk Sholat Berjamaah' },
    { name: 'Lapangan Upacara & Olahraga', count: 1, condition: 'Standar Serbaguna' },
    { name: 'Ruang UKS / Pertolongan Medis', count: 1, condition: 'Lengkap Tempat Tidur & Obat P3K' },
    { name: 'Ruang Guru & Tata Usaha', count: 1, condition: 'Kondusif & Full Digital' },
    { name: 'Kantin Sehat Sekolah', count: 1, condition: 'Higienis & Terverifikasi' }
  ],
  vision: 'Terwujudnya Peserta Didik yang Beriman, Berkarakter Luhur, Unggul dalam Prestasi, Berwawasan Global, dan Berbudaya Lingkungan.',
  mission: [
    'Menanamkan nilai-nilai keagamaan dan pembentukan karakter Profil Pelajar Pancasila.',
    'Menyelenggarakan pembelajaran berkualitas tinggi, kreatif, adaptif, dan menyenangkan.',
    'Meningkatkan pencapaian prestasi akademik dan non-akademik di tingkat provinsi dan nasional.',
    'Mewujudkan tata kelola administrasi akademik digital modern berbasis transparansi dan akuntabilitas.',
    'Membina kemitraan harmonis antara pihak sekolah, komite, dan orang tua peserta didik.'
  ]
};

export const INITIAL_SUBJECTS: Subject[] = [
  { id: 'sub-1', code: 'PAIBP', name: 'Pendidikan Agama & Budi Pekerti', category: 'Wajib', kkm: 75, gradeLevels: [1, 2, 3, 4, 5, 6] },
  { id: 'sub-2', code: 'PPKN', name: 'Pendidikan Pancasila', category: 'Wajib', kkm: 75, gradeLevels: [1, 2, 3, 4, 5, 6] },
  { id: 'sub-3', code: 'BIND', name: 'Bahasa Indonesia', category: 'Wajib', kkm: 75, gradeLevels: [1, 2, 3, 4, 5, 6] },
  { id: 'sub-4', code: 'MTK', name: 'Matematika', category: 'Wajib', kkm: 70, gradeLevels: [1, 2, 3, 4, 5, 6] },
  { id: 'sub-5', code: 'IPAS', name: 'Ilmu Pengetahuan Alam & Sosial (IPAS)', category: 'Wajib', kkm: 75, gradeLevels: [3, 4, 5, 6] },
  { id: 'sub-6', code: 'PJOK', name: 'Pendidikan Jasmani, Olahraga & Kesehatan', category: 'Wajib', kkm: 75, gradeLevels: [1, 2, 3, 4, 5, 6] },
  { id: 'sub-7', code: 'SNRB', name: 'Seni Rupa & Budaya', category: 'Wajib', kkm: 75, gradeLevels: [1, 2, 3, 4, 5, 6] },
  { id: 'sub-8', code: 'BING', name: 'Bahasa Inggris', category: 'Pilihan', kkm: 72, gradeLevels: [1, 2, 3, 4, 5, 6] },
  { id: 'sub-9', code: 'PLBJ', name: 'Pendidikan Lingkungan & Budaya Jakarta', category: 'Muatan Lokal', kkm: 75, gradeLevels: [1, 2, 3, 4, 5, 6] }
];

export const INITIAL_TEACHERS: Teacher[] = [
  {
    id: 'tch-1',
    nip: '198203152006041008',
    nuptk: '4534760662200022',
    name: 'Budi Santoso, S.Pd',
    gender: 'L',
    birthPlace: 'Jakarta',
    birthDate: '1982-03-15',
    phone: '081287654321',
    email: 'budi.santoso@sekolah.id',
    subjects: ['Matematika', 'IPAS'],
    isWaliKelas: true,
    assignedClass: '4A',
    status: 'PNS'
  },
  {
    id: 'tch-2',
    nip: '198507202009022005',
    nuptk: '7845763665210013',
    name: 'Dra. Siti Aminah',
    gender: 'P',
    birthPlace: 'Bogor',
    birthDate: '1985-07-20',
    phone: '081398765412',
    email: 'siti.aminah@sekolah.id',
    subjects: ['Bahasa Indonesia', 'Pendidikan Pancasila'],
    isWaliKelas: true,
    assignedClass: '1A',
    status: 'PNS'
  },
  {
    id: 'tch-3',
    nip: '199001102015031002',
    nuptk: '1234768670200041',
    name: 'Ahmad Fauzi, S.Pd.I',
    gender: 'L',
    birthPlace: 'Bekasi',
    birthDate: '1990-01-10',
    phone: '085712345678',
    email: 'ahmad.fauzi@sekolah.id',
    subjects: ['Pendidikan Agama & Budi Pekerti'],
    isWaliKelas: true,
    assignedClass: '5B',
    status: 'PPPK'
  },
  {
    id: 'tch-4',
    nip: '199208142019022009',
    nuptk: '9874765668200054',
    name: 'Nurul Hidayati, S.Pd',
    gender: 'P',
    birthPlace: 'Jakarta',
    birthDate: '1992-08-14',
    phone: '081909876543',
    email: 'nurul.h@sekolah.id',
    subjects: ['Bahasa Inggris', 'Seni Rupa & Budaya'],
    isWaliKelas: false,
    status: 'Honorer'
  },
  {
    id: 'tch-5',
    nip: '198811252014021007',
    nuptk: '3456789012345678',
    name: 'Rahmat Hidayat, S.Pd.Jas',
    gender: 'L',
    birthPlace: 'Jakarta',
    birthDate: '1988-11-25',
    phone: '081298712345',
    email: 'rahmat.pjok@sekolah.id',
    subjects: ['Pendidikan Jasmani, Olahraga & Kesehatan'],
    isWaliKelas: true,
    assignedClass: '6A',
    status: 'PNS'
  },
  {
    id: 'tch-6',
    nip: '198404162008012011',
    nuptk: '2345678901234567',
    name: 'Endang Purwanti, M.Pd',
    gender: 'P',
    birthPlace: 'Solo',
    birthDate: '1984-04-16',
    phone: '081387654320',
    email: 'endang.p@sekolah.id',
    subjects: ['Pendidikan Lingkungan & Budaya Jakarta', 'Bahasa Indonesia'],
    isWaliKelas: true,
    assignedClass: '2A',
    status: 'PNS'
  }
];

export const INITIAL_STUDENTS: Student[] = [
  {
    id: 'std-1',
    nis: '2404001',
    nisn: '0098765432',
    name: 'Muhammad Farhan Al-Fatih',
    gender: 'L',
    birthPlace: 'Jakarta',
    birthDate: '2015-05-14',
    religion: 'Islam',
    address: 'Jl. Lubang Buaya No. 12, RT 02/RW 03, Cipayung',
    phone: '081211223344',
    email: 'farhan.al@gmail.com',
    photo: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=400&q=80',
    admissionYear: '2022',
    classId: '4A',
    status: 'Aktif',
    parent: {
      fatherName: 'Bambang Irawan',
      motherName: 'Dewi Sartika',
      fatherOccupation: 'Wiraswasta',
      motherOccupation: 'Guru',
      phone: '081211223344',
      address: 'Jl. Lubang Buaya No. 12, RT 02/RW 03, Cipayung'
    }
  },
  {
    id: 'std-2',
    nis: '2404002',
    nisn: '0098765433',
    name: 'Aisyah Putri Azzahra',
    gender: 'P',
    birthPlace: 'Jakarta',
    birthDate: '2015-08-22',
    religion: 'Islam',
    address: 'Jl. Monumen No. 45, RT 01/RW 02, Lubang Buaya',
    phone: '081399887766',
    email: 'aisyah.putri@gmail.com',
    photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    admissionYear: '2022',
    classId: '4A',
    status: 'Aktif',
    parent: {
      fatherName: 'Heru Prasetyo',
      motherName: 'Rina Kusuma',
      fatherOccupation: 'Pegawai Negeri Sipil',
      motherOccupation: 'Ibu Rumah Tangga',
      phone: '081399887766',
      address: 'Jl. Monumen No. 45, RT 01/RW 02, Lubang Buaya'
    }
  },
  {
    id: 'std-3',
    nis: '2404003',
    nisn: '0098765434',
    name: 'Kenzo Alvaro Pratama',
    gender: 'L',
    birthPlace: 'Jakarta',
    birthDate: '2015-02-11',
    religion: 'Kristen',
    address: 'Jl. Kramat Aris No. 8, Cipayung',
    phone: '081255443322',
    photo: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=400&q=80',
    admissionYear: '2022',
    classId: '4A',
    status: 'Aktif',
    parent: {
      fatherName: 'Robert Pratama',
      motherName: 'Maria Magdalena',
      fatherOccupation: 'Karyawan Swasta',
      motherOccupation: 'Wiraswasta',
      phone: '081255443322',
      address: 'Jl. Kramat Aris No. 8, Cipayung'
    }
  },
  {
    id: 'std-4',
    nis: '2504001',
    nisn: '0101234561',
    name: 'Zahra Amalia Nafisah',
    gender: 'P',
    birthPlace: 'Jakarta',
    birthDate: '2018-09-03',
    religion: 'Islam',
    address: 'Jl. Raya Pondok Gede No. 88, Pinang Ranti',
    phone: '085799001122',
    admissionYear: '2025',
    classId: '1A',
    status: 'Aktif',
    parent: {
      fatherName: 'Arif Hidayatullah',
      motherName: 'Laila Munawaroh',
      fatherOccupation: 'Dokter',
      motherOccupation: 'Apoteker',
      phone: '085799001122',
      address: 'Jl. Raya Pondok Gede No. 88, Pinang Ranti'
    }
  },
  {
    id: 'std-5',
    nis: '2504002',
    nisn: '0101234562',
    name: 'Rafi Raditya Nugroho',
    gender: 'L',
    birthPlace: 'Bekasi',
    birthDate: '2018-11-19',
    religion: 'Islam',
    address: 'Jl. Bina Marga No. 19, Ceger',
    phone: '081277665544',
    admissionYear: '2025',
    classId: '1A',
    status: 'Aktif',
    parent: {
      fatherName: 'Agus Nugroho',
      motherName: 'Susanti',
      fatherOccupation: 'TNI AU',
      motherOccupation: 'Karyawan Swasta',
      phone: '081277665544',
      address: 'Jl. Bina Marga No. 19, Ceger'
    }
  },
  {
    id: 'std-6',
    nis: '2204001',
    nisn: '0071239871',
    name: 'Raden Bagus Arya Kusuma',
    gender: 'L',
    birthPlace: 'Jakarta',
    birthDate: '2013-04-10',
    religion: 'Islam',
    address: 'Jl. Pahlawan Sakti No. 3, Lubang Buaya',
    phone: '081311002233',
    admissionYear: '2020',
    classId: '6A',
    status: 'Aktif',
    parent: {
      fatherName: 'Raden Mas Haryo',
      motherName: 'R.A. Kusumaningrum',
      fatherOccupation: 'Konsultan Arsitek',
      motherOccupation: 'Dosen',
      phone: '081311002233',
      address: 'Jl. Pahlawan Sakti No. 3, Lubang Buaya'
    }
  },
  {
    id: 'std-7',
    nis: '2204002',
    nisn: '0071239872',
    name: 'Clara Anindya Putri',
    gender: 'P',
    birthPlace: 'Bandung',
    birthDate: '2013-06-25',
    religion: 'Katolik',
    address: 'Jl. Raya Hankam No. 7, Cipayung',
    phone: '081822334455',
    admissionYear: '2020',
    classId: '6A',
    status: 'Aktif',
    parent: {
      fatherName: 'Antonius Wijaya',
      motherName: 'Theresia Linda',
      fatherOccupation: 'Manajer Keuangan',
      motherOccupation: 'Notaris',
      phone: '081822334455',
      address: 'Jl. Raya Hankam No. 7, Cipayung'
    }
  }
];

export const INITIAL_GRADES: GradeItem[] = [
  {
    id: 'grd-1',
    studentId: 'std-1',
    studentNisn: '0098765432',
    studentName: 'Muhammad Farhan Al-Fatih',
    classId: '4A',
    subjectId: 'sub-3',
    subjectName: 'Bahasa Indonesia',
    academicYear: '2025/2026',
    semester: 'Ganjil',
    formatif: 88,
    uts: 90,
    uas: 92,
    finalScore: 90,
    achievementDescription: 'Menunjukkan penguasaan yang sangat baik dalam memahami ide pokok teks eksplanasi dan menyajikan teks narasi.',
    isLocked: true
  },
  {
    id: 'grd-2',
    studentId: 'std-1',
    studentNisn: '0098765432',
    studentName: 'Muhammad Farhan Al-Fatih',
    classId: '4A',
    subjectId: 'sub-4',
    subjectName: 'Matematika',
    academicYear: '2025/2026',
    semester: 'Ganjil',
    formatif: 85,
    uts: 88,
    uas: 86,
    finalScore: 86,
    achievementDescription: 'Sangat mahir dalam mengoperasikan bilangan pecahan dan menyelesaikan permasalahan volume bangun ruang sederhana.',
    isLocked: true
  },
  {
    id: 'grd-3',
    studentId: 'std-1',
    studentNisn: '0098765432',
    studentName: 'Muhammad Farhan Al-Fatih',
    classId: '4A',
    subjectId: 'sub-5',
    subjectName: 'Ilmu Pengetahuan Alam & Sosial (IPAS)',
    academicYear: '2025/2026',
    semester: 'Ganjil',
    formatif: 92,
    uts: 90,
    uas: 94,
    finalScore: 92,
    achievementDescription: 'Menunjukkan pemahaman sangat tinggi mengenai proses fotosintesis dan rantai makanan dalam ekosistem darat.',
    isLocked: true
  },
  {
    id: 'grd-4',
    studentId: 'std-2',
    studentNisn: '0098765433',
    studentName: 'Aisyah Putri Azzahra',
    classId: '4A',
    subjectId: 'sub-3',
    subjectName: 'Bahasa Indonesia',
    academicYear: '2025/2026',
    semester: 'Ganjil',
    formatif: 94,
    uts: 95,
    uas: 96,
    finalScore: 95,
    achievementDescription: 'Sangat unggul dalam membaca puisi dengan intonasi tepat dan menulis karangan eksposisi secara runtut.',
    isLocked: true
  },
  {
    id: 'grd-5',
    studentId: 'std-2',
    studentNisn: '0098765433',
    studentName: 'Aisyah Putri Azzahra',
    classId: '4A',
    subjectId: 'sub-4',
    subjectName: 'Matematika',
    academicYear: '2025/2026',
    semester: 'Ganjil',
    formatif: 90,
    uts: 92,
    uas: 91,
    finalScore: 91,
    achievementDescription: 'Sangat baik dalam menganalisis data diagram batang dan memecahkan soal cerita pecahan campuran.',
    isLocked: true
  }
];

export const INITIAL_SCHEDULES: ScheduleItem[] = [
  {
    id: 'sch-1',
    day: 'Senin',
    startTime: '07:00',
    endTime: '08:20',
    subjectId: 'sub-2',
    subjectName: 'Pendidikan Pancasila',
    teacherId: 'tch-2',
    teacherName: 'Dra. Siti Aminah',
    classId: '4A',
    room: 'Ruang 4A'
  },
  {
    id: 'sch-2',
    day: 'Senin',
    startTime: '08:35',
    endTime: '10:00',
    subjectId: 'sub-4',
    subjectName: 'Matematika',
    teacherId: 'tch-1',
    teacherName: 'Budi Santoso, S.Pd',
    classId: '4A',
    room: 'Ruang 4A'
  },
  {
    id: 'sch-3',
    day: 'Selasa',
    startTime: '07:00',
    endTime: '08:40',
    subjectId: 'sub-3',
    subjectName: 'Bahasa Indonesia',
    teacherId: 'tch-2',
    teacherName: 'Dra. Siti Aminah',
    classId: '4A',
    room: 'Ruang 4A'
  },
  {
    id: 'sch-4',
    day: 'Rabu',
    startTime: '07:00',
    endTime: '08:40',
    subjectId: 'sub-5',
    subjectName: 'Ilmu Pengetahuan Alam & Sosial (IPAS)',
    teacherId: 'tch-1',
    teacherName: 'Budi Santoso, S.Pd',
    classId: '4A',
    room: 'Lab Sains 1'
  },
  {
    id: 'sch-5',
    day: 'Kamis',
    startTime: '07:00',
    endTime: '08:40',
    subjectId: 'sub-6',
    subjectName: 'Pendidikan Jasmani, Olahraga & Kesehatan',
    teacherId: 'tch-5',
    teacherName: 'Rahmat Hidayat, S.Pd.Jas',
    classId: '4A',
    room: 'Lapangan Utama'
  }
];

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  { id: 'att-1', studentId: 'std-1', studentName: 'Muhammad Farhan Al-Fatih', classId: '4A', date: '2026-09-15', status: 'Hadir' },
  { id: 'att-2', studentId: 'std-2', studentName: 'Aisyah Putri Azzahra', classId: '4A', date: '2026-09-15', status: 'Hadir' },
  { id: 'att-3', studentId: 'std-3', studentName: 'Kenzo Alvaro Pratama', classId: '4A', date: '2026-09-15', status: 'Sakit', notes: 'Demam ringan' },
  { id: 'att-4', studentId: 'std-1', studentName: 'Muhammad Farhan Al-Fatih', classId: '4A', date: '2026-09-16', status: 'Hadir' },
  { id: 'att-5', studentId: 'std-2', studentName: 'Aisyah Putri Azzahra', classId: '4A', date: '2026-09-16', status: 'Hadir' },
  { id: 'att-6', studentId: 'std-3', studentName: 'Kenzo Alvaro Pratama', classId: '4A', date: '2026-09-16', status: 'Hadir' }
];

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'ach-1',
    studentId: 'std-1',
    studentName: 'Muhammad Farhan Al-Fatih',
    classId: '4A',
    title: 'Juara 1 Olimpiade Sains Nasional (OSN) IPA',
    level: 'Kota',
    rank: 'Juara 1',
    year: '2025',
    certificateNo: 'OSN-JKT-TIMUR/2025/089'
  },
  {
    id: 'ach-2',
    studentId: 'std-2',
    studentName: 'Aisyah Putri Azzahra',
    classId: '4A',
    title: 'Juara 2 Lomba Bertutur Cerita Rakyat Betawi',
    level: 'Provinsi',
    rank: 'Juara 2',
    year: '2025',
    certificateNo: 'DKI-DISDIK/SENI/2025/112'
  },
  {
    id: 'ach-3',
    studentId: 'std-6',
    studentName: 'Raden Bagus Arya Kusuma',
    classId: '6A',
    title: 'Medali Perak Kejuaraan Bulu Tangkis O2SN SD',
    level: 'Provinsi',
    rank: 'Juara 2',
    year: '2025',
    certificateNo: 'O2SN-DKI/2025/304'
  }
];

export const INITIAL_VIOLATIONS: Violation[] = [
  {
    id: 'vio-1',
    studentId: 'std-3',
    studentName: 'Kenzo Alvaro Pratama',
    classId: '4A',
    date: '2026-09-02',
    type: 'Terlambat Masuk Sekolah (>15 Menit)',
    points: 5,
    actionTaken: 'Teguran lisan dan pembinaan oleh Guru Piket',
    notes: 'Terjebak macet di Jl. Monumen'
  }
];

export const INITIAL_CALENDAR: AcademicCalendarItem[] = [
  { id: 'cal-1', title: 'Hari Pertama KBM Semester Ganjil 2025/2026', startDate: '2025-07-14', endDate: '2025-07-14', category: 'KBM', description: 'Upacara pembukaan dan perkenalan kelas' },
  { id: 'cal-2', title: 'Penilaian Tengah Semester (PTS) Ganjil', startDate: '2025-09-22', endDate: '2025-09-26', category: 'Ujian', description: 'Pelaksanaan asesmen sumatif tengah semester' },
  { id: 'cal-3', title: 'Penilaian Akhir Semester (PAS) Ganjil', startDate: '2025-12-01', endDate: '2025-12-08', category: 'Ujian', description: 'Asesmen akhir semester seluruh mata pelajaran' },
  { id: 'cal-4', title: 'Penyerahan Buku Rapor Semester Ganjil', startDate: '2025-12-19', endDate: '2025-12-19', category: 'Rapor', description: 'Pertemuan wali murid dan penyerahan e-rapor' },
  { id: 'cal-5', title: 'Libur Semester Ganjil', startDate: '2025-12-22', endDate: '2026-01-02', category: 'Libur', description: 'Libur akhir semester' },
  { id: 'cal-6', title: 'Awal KBM Semester Genap', startDate: '2026-01-05', endDate: '2026-01-05', category: 'KBM', description: 'Memulai KBM semester genap' }
];

export const INITIAL_ACTIVITY_LOGS: ActivityLog[] = [
  { id: 'log-1', timestamp: '2026-09-17 08:30:12', user: 'Admin Utama', role: 'admin', action: 'Login Sistem', details: 'Berhasil login dari IP 192.168.1.100' },
  { id: 'log-2', timestamp: '2026-09-17 09:15:45', user: 'Budi Santoso, S.Pd', role: 'guru', action: 'Input Nilai', details: 'Menyimpan nilai Matematika untuk Kelas 4A' },
  { id: 'log-3', timestamp: '2026-09-17 10:00:22', user: 'Admin Utama', role: 'admin', action: 'Generate Akun Siswa', details: 'Membuat akun otomatis untuk 12 siswa baru' }
];
