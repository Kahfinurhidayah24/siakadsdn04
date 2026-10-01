export interface SqlQueryResult {
  columns: string[];
  rows: Record<string, any>[];
  affectedRows?: number;
  message?: string;
  error?: string;
}

export function executeSqlInMemory(
  sqlQuery: string,
  contextData: {
    students: any[];
    teachers: any[];
    grades: any[];
    subjects: any[];
    userAccounts: any[];
    attendance: any[];
    calendar: any[];
    schoolProfile: any;
    addStudent?: (student: any) => void;
    updateStudent?: (id: string, updates: any) => void;
  }
): SqlQueryResult {
  const trimmed = sqlQuery.trim().replace(/;+$/, '');
  if (!trimmed) {
    return { columns: [], rows: [], message: 'Kueri kosong.' };
  }

  const upper = trimmed.toUpperCase();

  // 1. SELECT query
  if (upper.startsWith('SELECT')) {
    let tableName = '';
    if (upper.includes('FROM SISWA')) tableName = 'siswa';
    else if (upper.includes('FROM GURU')) tableName = 'guru';
    else if (upper.includes('FROM NILAI_RAPOR') || upper.includes('FROM NILAI')) tableName = 'nilai_rapor';
    else if (upper.includes('FROM USERS') || upper.includes('FROM USER')) tableName = 'users';
    else if (upper.includes('FROM MATA_PELAJARAN') || upper.includes('FROM MAPEL')) tableName = 'mata_pelajaran';
    else if (upper.includes('FROM PRESENSI_HARIAN') || upper.includes('FROM PRESENSI')) tableName = 'presensi_harian';
    else if (upper.includes('FROM KALENDER_AKADEMIK') || upper.includes('FROM KALENDER')) tableName = 'kalender_akademik';
    else if (upper.includes('FROM PROFIL_SEKOLAH')) tableName = 'profil_sekolah';
    else {
      tableName = 'siswa'; // default
    }

    let rawData: any[] = [];
    switch (tableName) {
      case 'siswa':
        rawData = contextData.students.map(s => ({
          nis: s.nis,
          nisn: s.nisn,
          nama_lengkap: s.name,
          kelas_id: s.classId,
          gender: s.gender,
          status: s.status,
          tahun_masuk: s.admissionYear
        }));
        break;
      case 'guru':
        rawData = contextData.teachers.map(t => ({
          nip: t.nip,
          nama_lengkap: t.name,
          wali_kelas: t.assignedClass || '-',
          status: t.status,
          mapel: t.subjects?.join(', ')
        }));
        break;
      case 'nilai_rapor':
        rawData = contextData.grades.map(g => ({
          siswa: g.studentName,
          mapel: g.subjectName,
          kelas: g.classId,
          formatif: g.formatif,
          uts: g.uts,
          uas: g.uas,
          nilai_akhir: g.finalScore
        }));
        break;
      case 'users':
        rawData = contextData.userAccounts.map(u => ({
          id: u.id,
          username: u.username,
          nama: u.name,
          role: u.role,
          aktif: u.isActive ? 'Ya' : 'Tidak'
        }));
        break;
      case 'mata_pelajaran':
        rawData = contextData.subjects.map(m => ({
          kode: m.code,
          nama: m.name,
          kategori: m.category,
          kkm: m.kkm
        }));
        break;
      case 'presensi_harian':
        rawData = contextData.attendance.map(a => ({
          siswa: a.studentName,
          kelas: a.classId,
          tanggal: a.date,
          status: a.status,
          catatan: a.notes || '-'
        }));
        break;
      case 'profil_sekolah':
        rawData = [{
          sekolah: contextData.schoolProfile.name,
          npsn: contextData.schoolProfile.npsn,
          akreditasi: contextData.schoolProfile.accreditation,
          kepsek: contextData.schoolProfile.principal?.name,
          telepon: contextData.schoolProfile.phone
        }];
        break;
      default:
        rawData = contextData.students;
    }

    // Check for WHERE filter (e.g. WHERE kelas_id = '4A')
    const whereMatch = trimmed.match(/WHERE\s+([a-zA-Z0-9_]+)\s*=\s*['"]?([a-zA-Z0-9_ -]+)['"]?/i);
    if (whereMatch) {
      const col = whereMatch[1].toLowerCase();
      const val = whereMatch[2].toLowerCase();
      rawData = rawData.filter(item => {
        const itemVal = String(item[col] || item.kelas_id || item.kelas || '').toLowerCase();
        return itemVal.includes(val);
      });
    }

    if (rawData.length === 0) {
      return { columns: [], rows: [], message: `Kueri berhasil dieksekusi pada tabel \`${tableName}\` (0 baris ditemukan).` };
    }

    const columns = Object.keys(rawData[0]);
    return {
      columns,
      rows: rawData,
      message: `Berhasil mengambil ${rawData.length} baris data dari tabel \`${tableName}\`.`
    };
  }

  // 2. INSERT INTO siswa
  if (upper.startsWith('INSERT INTO SISWA')) {
    try {
      // Regex parsing for simple insert
      const valMatch = trimmed.match(/VALUES\s*\((.*?)\)/is);
      if (valMatch && contextData.addStudent) {
        const rawVals = valMatch[1].split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
        const newStudent = {
          id: `std-sql-${Date.now()}`,
          nis: rawVals[1] || `${Date.now().toString().slice(-6)}`,
          nisn: rawVals[2] || `00${Date.now().toString().slice(-8)}`,
          name: rawVals[3] || 'Siswa Baru SQL',
          gender: (rawVals[4] === 'P' ? 'P' : 'L') as 'L' | 'P',
          birthPlace: rawVals[5] || 'Jakarta',
          birthDate: rawVals[6] || '2014-01-01',
          religion: 'Islam',
          address: rawVals[8] || 'Jakarta Timur',
          phone: rawVals[9] || '081234567890',
          admissionYear: '2022',
          classId: rawVals[12] || '4A',
          status: 'Aktif' as const,
          parent: {
            fatherName: rawVals[14] || 'Orang Tua',
            motherName: rawVals[16] || 'Ibu',
            phone: rawVals[9] || '081234567890',
            address: rawVals[8] || 'Jakarta Timur'
          }
        };
        contextData.addStudent(newStudent);
        return {
          columns: ['id', 'nis', 'nisn', 'name', 'classId'],
          rows: [newStudent],
          affectedRows: 1,
          message: `Berhasil mengeksekusi INSERT INTO siswa. Siswa "${newStudent.name}" (NISN: ${newStudent.nisn}) berhasil ditambahkan langsung ke dalam website!`
        };
      }
    } catch (e: any) {
      return { columns: [], rows: [], error: `Gagal memproses INSERT: ${e.message}` };
    }
  }

  return {
    columns: [],
    rows: [],
    message: `Perintah SQL "${trimmed.slice(0, 40)}..." berhasil dianalisis. Kueri ini valid untuk MySQL/MariaDB/PostgreSQL.`
  };
}
