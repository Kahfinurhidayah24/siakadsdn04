import * as XLSX from 'xlsx';
import { Student } from '../types';

export interface ParsedExcelStudent {
  rowNumber: number;
  nisn: string;
  nis: string;
  name: string;
  gender: 'L' | 'P';
  classId: string;
  birthPlace: string;
  birthDate: string;
  religion: string;
  address: string;
  phone: string;
  email?: string;
  admissionYear: string;
  status: Student['status'];
  parent: {
    fatherName: string;
    motherName: string;
    fatherOccupation: string;
    motherOccupation: string;
    phone: string;
    address: string;
  };
  isValid: boolean;
  validationError?: string;
}

/**
 * Mengunduh template resmi Excel (.xlsx) dengan kolom yang siap diisi
 */
export function downloadStudentExcelTemplate() {
  // Contoh data panduan
  const templateData = [
    {
      'NISN *': '0098765431',
      'NIS': '2504001',
      'Nama Lengkap *': 'Ahmad Fauzi Rahman',
      'Jenis Kelamin (L/P) *': 'L',
      'Kelas (Contoh: 1A s/d 6F) *': '1A',
      'Tempat Lahir': 'Jakarta',
      'Tanggal Lahir (YYYY-MM-DD)': '2018-05-12',
      'Agama': 'Islam',
      'Alamat Siswa': 'Jl. Rawa Binong No. 12, RT 02/RW 04, Lubang Buaya',
      'No Telepon Siswa': '081234567890',
      'Tahun Masuk': '2025',
      'Nama Ayah': 'Rahmat Hidayat',
      'Nama Ibu': 'Siti Nurhaliza',
      'Pekerjaan Ayah': 'Wiraswasta',
      'Pekerjaan Ibu': 'Ibu Rumah Tangga',
      'No Telepon Ortu': '081298765432'
    },
    {
      'NISN *': '0098765432',
      'NIS': '2504002',
      'Nama Lengkap *': 'Annisa Putri Maharani',
      'Jenis Kelamin (L/P) *': 'P',
      'Kelas (Contoh: 1A s/d 6F) *': '1B',
      'Tempat Lahir': 'Jakarta',
      'Tanggal Lahir (YYYY-MM-DD)': '2018-08-20',
      'Agama': 'Islam',
      'Alamat Siswa': 'Jl. Monumen Pancasila Sakti No. 45',
      'No Telepon Siswa': '081387654321',
      'Tahun Masuk': '2025',
      'Nama Ayah': 'Bambang Sudibyo',
      'Nama Ibu': 'Ratna Sari Dewi',
      'Pekerjaan Ayah': 'Karyawan Swasta',
      'Pekerjaan Ibu': 'Guru',
      'No Telepon Ortu': '081345678901'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);

  // Lebar kolom rapi
  worksheet['!cols'] = [
    { wch: 15 }, // NISN
    { wch: 12 }, // NIS
    { wch: 28 }, // Nama
    { wch: 20 }, // Gender
    { wch: 24 }, // Kelas
    { wch: 16 }, // Tempat Lahir
    { wch: 24 }, // Tanggal Lahir
    { wch: 12 }, // Agama
    { wch: 40 }, // Alamat
    { wch: 18 }, // No HP
    { wch: 14 }, // Tahun Masuk
    { wch: 20 }, // Ayah
    { wch: 20 }, // Ibu
    { wch: 18 }, // Kerja Ayah
    { wch: 18 }, // Kerja Ibu
    { wch: 18 }, // HP Ortu
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'DATA_SISWA');

  XLSX.writeFile(workbook, 'Template_Import_Siswa_SDN_LB04.xlsx');
}

/**
 * Membaca dan memvalidasi file Excel / CSV yang diupload pengguna
 */
export async function parseStudentExcelFile(file: File): Promise<{
  students: ParsedExcelStudent[];
  totalRows: number;
  validCount: number;
  invalidCount: number;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          throw new Error('Lembar kerja (worksheet) pada file Excel kosong.');
        }

        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawJson.length) {
          throw new Error('Tidak ada baris data ditemukan di dalam file Excel.');
        }

        const parsedList: ParsedExcelStudent[] = [];
        const seenNisns = new Set<string>();

        rawJson.forEach((row, index) => {
          const rowNumber = index + 2; // Mengabaikan baris 1 (Header)

          // Ambil nilai dari kemungkinan nama kolom yang cocok
          const nisn = String(
            row['NISN *'] || row['NISN'] || row['nisn'] || row['Nisn'] || ''
          ).trim();

          const name = String(
            row['Nama Lengkap *'] || row['Nama Lengkap'] || row['Nama'] || row['nama'] || ''
          ).trim();

          const genderRaw = String(
            row['Jenis Kelamin (L/P) *'] || row['Jenis Kelamin'] || row['Gender'] || row['JK'] || 'L'
          ).trim().toUpperCase();
          const gender: 'L' | 'P' = genderRaw.startsWith('P') ? 'P' : 'L';

          const classIdRaw = String(
            row['Kelas (Contoh: 1A s/d 6F) *'] || row['Kelas'] || row['Rombel'] || row['kelas'] || '1A'
          ).trim().toUpperCase().replace(/\s+/g, '');
          const classId = classIdRaw || '1A';

          const nis = String(row['NIS'] || row['nis'] || '').trim();
          const birthPlace = String(row['Tempat Lahir'] || row['tempat_lahir'] || 'Jakarta').trim();
          
          let birthDate = String(row['Tanggal Lahir (YYYY-MM-DD)'] || row['Tanggal Lahir'] || '2018-01-01').trim();
          // Normalisasi format tanggal Excel jika berupa number serial
          if (typeof row['Tanggal Lahir'] === 'number') {
            const excelDate = new Date((row['Tanggal Lahir'] - (25567 + 2)) * 86400 * 1000);
            birthDate = excelDate.toISOString().slice(0, 10);
          }

          const religion = String(row['Agama'] || 'Islam').trim();
          const address = String(row['Alamat Siswa'] || row['Alamat'] || '').trim();
          const phone = String(row['No Telepon Siswa'] || row['No Telepon'] || row['No HP'] || '').trim();
          const admissionYear = String(row['Tahun Masuk'] || '2025').trim();

          const fatherName = String(row['Nama Ayah'] || '').trim();
          const motherName = String(row['Nama Ibu'] || '').trim();
          const fatherOccupation = String(row['Pekerjaan Ayah'] || '').trim();
          const motherOccupation = String(row['Pekerjaan Ibu'] || '').trim();
          const parentPhone = String(row['No Telepon Ortu'] || row['No HP Ortu'] || '').trim();

          // Validasi
          let isValid = true;
          let validationError = '';

          if (!name) {
            isValid = false;
            validationError = 'Nama Siswa tidak boleh kosong';
          } else if (!nisn) {
            isValid = false;
            validationError = 'NISN tidak boleh kosong';
          } else if (seenNisns.has(nisn)) {
            isValid = false;
            validationError = `NISN ${nisn} terduplikasi di file Excel ini`;
          }

          if (nisn) seenNisns.add(nisn);

          parsedList.push({
            rowNumber,
            nisn,
            nis,
            name,
            gender,
            classId,
            birthPlace,
            birthDate,
            religion,
            address,
            phone,
            admissionYear,
            status: 'Aktif',
            parent: {
              fatherName,
              motherName,
              fatherOccupation,
              motherOccupation,
              phone: parentPhone,
              address
            },
            isValid,
            validationError
          });
        });

        const validCount = parsedList.filter(s => s.isValid).length;
        const invalidCount = parsedList.length - validCount;

        resolve({
          students: parsedList,
          totalRows: parsedList.length,
          validCount,
          invalidCount
        });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}
