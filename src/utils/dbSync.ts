/**
 * Sinkronisasi antara state aplikasi (React) dan database MySQL (phpMyAdmin).
 *
 * - Saat aplikasi dibuka: data DIBACA dari MySQL (fetchDbState).
 * - Saat data berubah: hanya baris yang berubah DIKIRIM ke MySQL (diffCollection + pushChanges).
 */

export type SyncKey =
  | 'students' | 'teachers' | 'schedules' | 'grades' | 'attendance'
  | 'achievements' | 'violations' | 'mutations' | 'letters' | 'activityLogs';

export const SYNC_KEYS: SyncKey[] = [
  'students', 'teachers', 'schedules', 'grades', 'attendance',
  'achievements', 'violations', 'mutations', 'letters', 'activityLogs',
];

export interface DbStateResult {
  ok: boolean;
  empty?: boolean;
  data?: Record<string, any[]>;
  error?: string;
}

export interface ChangeSet {
  upsert: any[];
  delete: string[];
}

async function readJson(res: Response): Promise<any> {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      res.ok
        ? 'Respons server tidak valid'
        : `Server tidak merespon dengan benar (HTTP ${res.status}). Pastikan dijalankan dengan "npm run dev".`
    );
  }
}

export async function fetchDbState(): Promise<DbStateResult> {
  try {
    const res = await fetch('/api/db/state');
    const json = await readJson(res);
    if (!res.ok || !json.success) return { ok: false, error: json.error || `HTTP ${res.status}` };
    return { ok: true, empty: !!json.empty, data: json.data };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Tidak dapat menghubungi server' };
  }
}

export async function pushChanges(changes: Partial<Record<SyncKey, ChangeSet>>): Promise<{ ok: boolean; error?: string; skipped?: Record<string, number> }> {
  try {
    const res = await fetch('/api/db/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ changes }),
    });
    const json = await readJson(res);
    if (!res.ok || !json.success) return { ok: false, error: json.error || `HTTP ${res.status}` };
    return { ok: true, skipped: json.skipped };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Tidak dapat menghubungi server' };
  }
}

export async function pushAll(collections: Partial<Record<SyncKey, any[]>>): Promise<{ ok: boolean; error?: string; result?: any }> {
  try {
    const res = await fetch('/api/db/sync-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(collections),
    });
    const json = await readJson(res);
    if (!res.ok || !json.success) return { ok: false, error: json.message || json.error || `HTTP ${res.status}` };
    return { ok: true, result: json };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Tidak dapat menghubungi server' };
  }
}

// ---------------------------------------------------------------------------
// Snapshot: catatan kondisi terakhir yang sudah tersimpan di MySQL
// ---------------------------------------------------------------------------

export type Snapshot = Map<string, { ref: any; json: string }>;

export function makeSnapshot(items: any[]): Snapshot {
  const snap: Snapshot = new Map();
  for (const it of items) snap.set(it.id, { ref: it, json: JSON.stringify(it) });
  return snap;
}

/** Bandingkan state sekarang dengan snapshot → baris baru/berubah dan id yang dihapus. */
export function diffCollection(items: any[], snap: Snapshot): ChangeSet {
  const upsert: any[] = [];
  const seen = new Set<string>();
  for (const it of items) {
    seen.add(it.id);
    const prev = snap.get(it.id);
    if (prev && prev.ref === it) continue; // objek yang sama persis → pasti tidak berubah
    if (prev && prev.json === JSON.stringify(it)) continue;
    upsert.push(it);
  }
  const del: string[] = [];
  for (const id of snap.keys()) if (!seen.has(id)) del.push(id);
  return { upsert, delete: del };
}

/** Perbarui snapshot setelah perubahan berhasil disimpan. */
export function commitToSnapshot(snap: Snapshot, changes: ChangeSet) {
  for (const it of changes.upsert) snap.set(it.id, { ref: it, json: JSON.stringify(it) });
  for (const id of changes.delete) snap.delete(id);
}
