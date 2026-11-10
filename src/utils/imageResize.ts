// Memotong foto jadi persegi (tengah) dan mengecilkannya agar ringan disimpan ke database.
export function resizeImageToSquare(file: File, size = 320, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const side = Math.min(img.naturalWidth, img.naturalHeight);
        const sx = (img.naturalWidth - side) / 2;
        const sy = (img.naturalHeight - side) / 2;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas tidak tersedia');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } catch (e) {
        reject(e);
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Gambar tidak bisa dibaca'));
    };
    img.src = url;
  });
}

/**
 * Mengecilkan gambar agar muat di dalam kotak maxW x maxH.
 *  - mode 'contain': seluruh gambar terlihat (cocok untuk logo). Format PNG, transparansi tetap.
 *  - mode 'cover'  : dipotong tengah mengikuti rasio kotak (cocok untuk foto sampul). Format JPEG.
 */
export function resizeImageToBox(
  file: File,
  maxW: number,
  maxH: number,
  mode: 'contain' | 'cover' = 'contain',
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const iw = img.naturalWidth;
        const ih = img.naturalHeight;
        if (!iw || !ih) throw new Error('Gambar kosong');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas tidak tersedia');

        if (mode === 'cover') {
          canvas.width = maxW;
          canvas.height = maxH;
          const scale = Math.max(maxW / iw, maxH / ih);
          const sw = maxW / scale;
          const sh = maxH / scale;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, maxW, maxH);
          ctx.drawImage(img, (iw - sw) / 2, (ih - sh) / 2, sw, sh, 0, 0, maxW, maxH);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
          const scale = Math.min(1, maxW / iw, maxH / ih);
          canvas.width = Math.max(1, Math.round(iw * scale));
          canvas.height = Math.max(1, Math.round(ih * scale));
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/png'));
        }
      } catch (e) {
        reject(e);
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Gambar tidak bisa dibaca'));
    };
    img.src = url;
  });
}
