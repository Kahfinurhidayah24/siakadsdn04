import React, { useEffect, useState } from 'react';
import { KeyRound, X, Check } from 'lucide-react';

interface Req { id: string; role: 'kepsek' | 'guru' | 'siswa'; refId: string; username: string; name: string; contact: string; at: string }

/** Daftar permintaan "Lupa Password" dari halaman login. Admin mengisi sandi baru lalu menyampaikannya langsung ke pengguna. */
export const ResetRequestsPanel: React.FC = () => {
  const [items, setItems] = useState<Req[]>([]);
  const [pw, setPw] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<Record<string, string>>({});

  const load = () => fetch('/api/admin/reset-requests').then(r => r.json()).then(d => setItems(d?.requests || [])).catch(() => {});
  useEffect(() => { load(); }, []);

  const apply = async (r: Req) => {
    const res = await fetch('/api/admin/user-password', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: r.role, username: r.username, referenceId: r.refId === 'demo' || r.role === 'kepsek' ? '' : r.refId, newPassword: pw[r.id] || '' }),
    });
    const d = await res.json().catch(() => null);
    if (d?.success) { load(); } else setMsg(m => ({ ...m, [r.id]: d?.message || 'Gagal mengatur sandi.' }));
  };
  const dismiss = async (id: string) => { await fetch(`/api/admin/reset-requests/${id}`, { method: 'DELETE' }); load(); };

  if (items.length === 0) return null;
  return (
    <div className="rounded-2xl border border-amber-500/40 bg-amber-50 p-4 space-y-3">
      <h3 className="text-sm font-bold text-amber-800 flex items-center gap-2">
        <KeyRound className="w-4 h-4" /> Permintaan Lupa Password ({items.length})
      </h3>
      {items.map(r => (
        <div key={r.id} className="bg-white border border-slate-200 rounded-xl p-3 space-y-2 text-xs">
          <div className="flex justify-between gap-2">
            <div>
              <div className="font-semibold text-slate-800">{r.name} <span className="font-normal text-slate-500">({r.role})</span></div>
              <div className="text-slate-500">ID: {r.username}{r.contact && ` • Kontak: ${r.contact}`} • {new Date(r.at).toLocaleString('id-ID')}</div>
            </div>
            <button onClick={() => dismiss(r.id)} title="Tolak / hapus" className="text-slate-400 hover:text-red-600 cursor-pointer"><X className="w-4 h-4" /></button>
          </div>
          <div className="flex gap-2">
            <input value={pw[r.id] || ''} onChange={e => setPw(p => ({ ...p, [r.id]: e.target.value }))}
              placeholder="Sandi baru (min. 8, huruf+angka)" className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 outline-none focus:border-amber-500" />
            <button onClick={() => apply(r)} className="px-3 py-1.5 rounded-lg bg-amber-500 text-white font-bold flex items-center gap-1 cursor-pointer hover:bg-amber-600">
              <Check className="w-3.5 h-3.5" /> Atur
            </button>
          </div>
          {msg[r.id] && <p className="text-red-600">{msg[r.id]}</p>}
        </div>
      ))}
      <p className="text-[11px] text-slate-500">Cocokkan nama dengan data sekolah sebelum mengatur sandi, lalu sampaikan sandi baru langsung kepada yang bersangkutan.</p>
    </div>
  );
};
