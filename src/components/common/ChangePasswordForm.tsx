import React, { useState } from 'react';
import { KeyRound, Eye, EyeOff, Check } from 'lucide-react';

/** Form ganti kata sandi untuk Admin. Pemeriksaan sebenarnya dilakukan di server. */
export const ChangePasswordForm: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [again, setAgain] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const reset = () => { setCurrent(''); setNext(''); setAgain(''); setShow(false); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (next !== again) { setMsg({ type: 'err', text: 'Kata sandi baru dan pengulangannya tidak sama.' }); return; }
    setBusy(true);
    try {
      const res = await fetch('/api/auth/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        setMsg({ type: 'ok', text: data.message });
        reset();
      } else if (res.status === 401 && !data?.message?.includes('lama')) {
        setMsg({ type: 'err', text: 'Sesi admin berakhir. Silakan login ulang.' });
      } else {
        setMsg({ type: 'err', text: data?.message || 'Gagal mengganti kata sandi.' });
      }
    } catch {
      setMsg({ type: 'err', text: 'Server tidak dapat dihubungi.' });
    } finally {
      setBusy(false);
    }
  };

  const input = 'w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:border-amber-400 text-[11px] outline-none';

  return (
    <div className="pt-3 border-t border-slate-200 space-y-2">
      <button
        type="button"
        onClick={() => { setOpen(!open); setMsg(null); }}
        className="w-full text-xs font-bold text-slate-800 flex items-center gap-1.5 cursor-pointer"
      >
        <KeyRound className="w-3.5 h-3.5 text-amber-700" />
        Ganti Kata Sandi Admin
      </button>

      {open && (
        <form onSubmit={submit} className="space-y-2" autoComplete="off">
          <input type={show ? 'text' : 'password'} className={input} placeholder="Kata sandi lama" value={current}
            onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" required />
          <input type={show ? 'text' : 'password'} className={input} placeholder="Kata sandi baru (min. 12 karakter)" value={next}
            onChange={(e) => setNext(e.target.value)} autoComplete="new-password" required />
          <input type={show ? 'text' : 'password'} className={input} placeholder="Ulangi kata sandi baru" value={again}
            onChange={(e) => setAgain(e.target.value)} autoComplete="new-password" required />
          <button type="button" onClick={() => setShow(!show)}
            className="text-[10px] text-slate-500 hover:text-amber-700 flex items-center gap-1 cursor-pointer">
            {show ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            {show ? 'Sembunyikan' : 'Tampilkan'} kata sandi
          </button>
          <p className="text-[10px] text-slate-500">Harus ada huruf besar, huruf kecil, dan angka.</p>
          {msg && (
            <div className={`text-[11px] px-3 py-2 rounded-lg border ${msg.type === 'ok' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700' : 'bg-red-500/10 border-red-500/30 text-red-700'}`}>
              {msg.text}
            </div>
          )}
          <button type="submit" disabled={busy}
            className="w-full py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60">
            <Check className="w-3.5 h-3.5" />
            {busy ? 'Menyimpan...' : 'Simpan Kata Sandi Baru'}
          </button>
        </form>
      )}
    </div>
  );
};
