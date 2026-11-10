import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Mengonversi elemen DOM kartu tanda pelajar menjadi PDF resolusi tinggi (Ukuran ID Card CR80: 85.6mm x 54mm)
 */
export async function downloadSingleCardPdf(
  elementId: string,
  studentName: string,
  nisn: string
): Promise<boolean> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Elemen kartu dengan ID ${elementId} tidak ditemukan.`);
  }

  try {
    // Render elemen kartu dengan html2canvas skala tinggi untuk ketajaman tulisan dan barcode
    const canvas = await html2canvas(element, {
      scale: 3, // 3x resolusi untuk hasil cetak ultra-tajam
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#020617', // Slate-950 latar belakang kartu
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');

    // Standar dimensi Kartu Pelajar Internasional (CR-80): 85.6mm x 54mm
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [85.6, 54],
    });

    pdf.addImage(imgData, 'PNG', 0, 0, 85.6, 54, undefined, 'FAST');

    const cleanName = studentName.trim().replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `Kartu_Pelajar_${cleanName}_${nisn}.pdf`;
    pdf.save(filename);

    return true;
  } catch (error) {
    console.error('Gagal generate PDF kartu pelajar:', error);
    throw error;
  }
}

/**
 * Mengunduh semua kartu pelajar terpilih ke dalam satu dokumen PDF (1 kartu per halaman)
 */
export async function downloadAllCardsPdf(
  students: { id: string; name: string; nisn: string }[],
  onProgress?: (current: number, total: number) => void
): Promise<boolean> {
  if (!students.length) return false;

  try {
    // Dokumen PDF multi-halaman berukuran kartu CR-80
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [85.6, 54],
    });

    for (let i = 0; i < students.length; i++) {
      const std = students[i];
      if (onProgress) {
        onProgress(i + 1, students.length);
      }

      const elementId = `card-student-${std.id}`;
      const element = document.getElementById(elementId);
      if (!element) continue;

      const canvas = await html2canvas(element, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#020617',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');

      if (i > 0) {
        pdf.addPage([85.6, 54], 'landscape');
      }

      pdf.addImage(imgData, 'PNG', 0, 0, 85.6, 54, undefined, 'FAST');
    }

    const timestamp = new Date().toISOString().slice(0, 10);
    pdf.save(`Kumpulan_Kartu_Pelajar_SDN04_${timestamp}.pdf`);
    return true;
  } catch (error) {
    console.error('Gagal download multi-kartu PDF:', error);
    throw error;
  }
}
