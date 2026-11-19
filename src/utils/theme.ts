// Pengaturan tema warna yang bisa diganti pengguna.
// Cara kerja: palet "slate" (abu netral), "cream" (warna kartu) dan "amber" (aksen)
// di Tailwind dijadikan CSS variable, lalu ditimpa lewat document.documentElement.style.

export interface ThemeSetting {
  id: string;      // id preset, atau 'custom'
  bg: string;      // warna latar (hex)
  accent: string;  // warna aksen (hex)
}

export const DEFAULT_THEME_ID = 'putih';

export const THEME_PRESETS: (ThemeSetting & { name: string })[] = [
  { id: 'putih',    name: 'Hijau Putih (Bawaan)', bg: '#f8fafc', accent: '#16a34a' },
  { id: 'krem',     name: 'Krem Emas',   bg: '#f6eedc', accent: '#f59e0b' },
  { id: 'biru',     name: 'Biru Langit', bg: '#e3eefa', accent: '#0ea5e9' },
  { id: 'mint',     name: 'Hijau Mint',  bg: '#e2f3e9', accent: '#10b981' },
  { id: 'lavender', name: 'Lavender',    bg: '#ebe6f8', accent: '#8b5cf6' },
  { id: 'rose',     name: 'Rose',        bg: '#fbe8ed', accent: '#f43f5e' },
];

const STORAGE_KEY = 'siakad_lb04_theme';
const isHex = (v: string) => /^#[0-9a-f]{6}$/i.test(v);

// ---------- konversi warna ----------
function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0, s = 0;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return [h, s * 100, l * 100];
}

function hslToHex(h: number, s: number, l: number): string {
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const to = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

// ---------- pembuat palet ----------
function buildVars(bg: string, accent: string): Record<string, string> {
  const vars: Record<string, string> = {};

  // Netral: latar yang dipilih menjadi warna halaman (slate-50).
  // Kecerahan dijaga 85–98% supaya tulisan gelap tetap terbaca.
  const [bh, bsRaw, blRaw] = hexToHsl(bg);
  const bs = Math.min(bsRaw, 70);
  const l0 = Math.max(85, Math.min(98, blRaw));
  const neutral: Record<string, [number, number]> = {
    '50':  [l0, 1],
    '100': [l0 - 4, 1],
    '200': [l0 - 11, 0.95],
    '300': [l0 - 22, 0.85],
    '400': [58, 0.5],
    '500': [42, 0.4],
    '600': [34, 0.4],
    '700': [26, 0.4],
    '800': [18, 0.4],
    '900': [11, 0.4],
    '950': [7, 0.4],
  };
  for (const [k, [l, f]] of Object.entries(neutral)) {
    vars[`--color-slate-${k}`] = hslToHex(bh, bs * f, l);
  }
  vars['--color-cream'] = hslToHex(bh, bs, l0 + (99 - l0) * 0.7);

  // Aksen: menggantikan palet amber.
  const [ah, asRaw] = hexToHsl(accent);
  const as = Math.max(45, Math.min(92, asRaw));
  const stops: Record<string, number> = {
    '50': 96, '100': 92, '200': 84, '300': 74, '400': 62,
    '500': 52, '600': 44, '700': 36, '800': 28, '900': 22, '950': 13,
  };
  for (const [k, l] of Object.entries(stops)) {
    vars[`--color-amber-${k}`] = hslToHex(ah, as, l);
  }
  return vars;
}

const ALL_KEYS = (() => {
  const keys = ['--color-cream'];
  for (const n of ['50','100','200','300','400','500','600','700','800','900','950']) {
    keys.push(`--color-slate-${n}`, `--color-amber-${n}`);
  }
  return keys;
})();

// ---------- terapkan / simpan ----------
export function applyTheme(theme: ThemeSetting | null) {
  const root = document.documentElement;
  ALL_KEYS.forEach(k => root.style.removeProperty(k));
  if (!theme || theme.id === DEFAULT_THEME_ID) return; // pakai warna bawaan di index.css
  if (!isHex(theme.bg) || !isHex(theme.accent)) return;
  const vars = buildVars(theme.bg, theme.accent);
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
}

export function loadTheme(): ThemeSetting {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const t = JSON.parse(raw);
      if (t && typeof t.id === 'string' && isHex(t.bg) && isHex(t.accent)) return t;
    }
  } catch { /* abaikan */ }
  const d = THEME_PRESETS[0];
  return { id: d.id, bg: d.bg, accent: d.accent };
}

export function saveTheme(theme: ThemeSetting) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(theme)); } catch { /* abaikan */ }
}

export function applyStoredTheme() {
  applyTheme(loadTheme());
}

// ---------- sinkron dengan MySQL (berlaku untuk semua akun) ----------

/** Ambil tema sekolah dari server. Bila ada, terapkan & simpan sebagai cadangan di browser. */
export async function syncThemeFromServer(): Promise<void> {
  try {
    const res = await fetch('/api/settings/theme');
    if (!res.ok) return;
    const json = await res.json();
    const t = json?.theme;
    if (t && typeof t.id === 'string' && isHex(t.bg) && isHex(t.accent)) {
      applyTheme(t);
      saveTheme(t);
    }
  } catch { /* server/MySQL belum aktif: tetap pakai tema di browser */ }
}

/** Simpan tema ke MySQL. Mengembalikan true jika berhasil. */
export async function saveThemeToServer(theme: ThemeSetting): Promise<boolean> {
  try {
    const res = await fetch('/api/settings/theme', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme }),
    });
    const json = await res.json().catch(() => null);
    return res.ok && !!json?.success;
  } catch {
    return false;
  }
}
