// Logo & foto sampul sekolah (diatur Admin, tampil untuk semua akun).
// Disimpan di browser sebagai cadangan, dan di MySQL bila server aktif.

export interface SchoolMedia {
  logo?: string;        // data URL gambar logo sekolah
  coverPhoto?: string;  // data URL foto sampul / gedung sekolah
}

const STORAGE_KEY = 'siakad_lb04_school_media';
const isImg = (v: unknown): v is string => typeof v === 'string' && v.startsWith('data:image/');

export function loadSchoolMedia(): SchoolMedia {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const p = JSON.parse(raw);
    return { logo: isImg(p?.logo) ? p.logo : undefined, coverPhoto: isImg(p?.coverPhoto) ? p.coverPhoto : undefined };
  } catch {
    return {};
  }
}

export function saveSchoolMediaLocal(media: SchoolMedia): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(media));
    return true;
  } catch {
    return false; // penyimpanan browser penuh
  }
}

export async function syncSchoolMediaFromServer(): Promise<SchoolMedia | null> {
  try {
    const res = await fetch('/api/settings/school-media');
    if (!res.ok) return null;
    const json = await res.json();
    const m = json?.media;
    if (!m) return null;
    return { logo: isImg(m.logo) ? m.logo : undefined, coverPhoto: isImg(m.coverPhoto) ? m.coverPhoto : undefined };
  } catch {
    return null;
  }
}

export async function saveSchoolMediaToServer(media: SchoolMedia): Promise<boolean> {
  try {
    const res = await fetch('/api/settings/school-media', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ media }),
    });
    const json = await res.json().catch(() => null);
    return res.ok && !!json?.success;
  } catch {
    return false;
  }
}
