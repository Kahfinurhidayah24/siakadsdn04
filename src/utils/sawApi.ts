import type { SawCategory } from './saw';

export interface SawStoredConfig {
  criteria: { code: string; type: 'benefit' | 'cost'; weight: number }[];
  thresholds: { sangatBaik: number; baik: number; cukup: number };
  periodOnly: boolean;
}

export interface SawArchiveSummary {
  id: string; tahun_ajaran: string; semester: 'Ganjil' | 'Genap'; cakupan: string;
  jumlah_siswa: number; rata_vi: number | string; dibuat_oleh: string | null; dibuat_pada: string;
}

export interface SawArchiveRow {
  rank: number; studentId: string; nisn: string; name: string; classId: string;
  values: number[]; preference: number; category: SawCategory;
}

export interface SawArchiveDetail extends Omit<SawArchiveSummary, 'rata_vi'> {
  rata_vi: number;
  kriteria: { code: string; name: string; type: string; weight: number }[];
  hasil: SawArchiveRow[];
}

async function call(method: string, url: string, body?: unknown): Promise<{ ok: boolean; data?: any; message?: string }> {
  try {
    const res = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    let json: any;
    try { json = JSON.parse(text); } catch { return { ok: false, message: `Server tidak merespon dengan benar (HTTP ${res.status}).` }; }
    if (!res.ok || !json.success) {
      const msg = res.status === 401 ? 'Sesi admin sudah berakhir. Silakan login ulang lalu coba lagi.' : (json.error || json.message || `HTTP ${res.status}`);
      return { ok: false, message: msg };
    }
    return { ok: true, data: json };
  } catch (err: any) {
    return { ok: false, message: err?.message || 'Tidak dapat menghubungi server.' };
  }
}

export const fetchSawConfig = async (): Promise<SawStoredConfig | null> => {
  const r = await call('GET', '/api/saw/config');
  return r.ok ? (r.data.config as SawStoredConfig | null) : null;
};
export const saveSawConfig = (config: SawStoredConfig) => call('PUT', '/api/saw/config', { config });
export const listSawArchive = async (): Promise<SawArchiveSummary[] | null> => {
  const r = await call('GET', '/api/saw/archive');
  return r.ok ? (r.data.items as SawArchiveSummary[]) : null;
};
export const getSawArchive = async (id: string) => {
  const r = await call('GET', `/api/saw/archive/${encodeURIComponent(id)}`);
  return r.ok ? (r.data.item as SawArchiveDetail) : null;
};
export const saveSawArchive = (payload: {
  tahunAjaran: string; semester: string; cakupan: string; dibuatOleh: string;
  kriteria: unknown[]; hasil: SawArchiveRow[];
}) => call('POST', '/api/saw/archive', payload);
export const deleteSawArchive = (id: string) => call('DELETE', `/api/saw/archive/${encodeURIComponent(id)}`);
