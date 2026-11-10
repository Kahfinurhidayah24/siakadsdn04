import React, { useState, useRef, useEffect } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { resizeImageToSquare } from '../../utils/imageResize';
import {
  THEME_PRESETS, DEFAULT_THEME_ID, ThemeSetting,
  applyTheme, loadTheme, saveTheme, saveThemeToServer
} from '../../utils/theme';
import { Camera, Trash2, Palette, RotateCcw, Check } from 'lucide-react';
import { ChangePasswordForm } from './ChangePasswordForm';

const ROLE_LABEL: Record<string, string> = {
  admin: 'Super Admin',
  kepsek: 'Kepala Sekolah',
  guru: 'Guru',
  siswa: 'Peserta Didik',
};

export const ProfileMenu: React.FC = () => {
  const { currentUser, updateProfilePhoto } = useSchool();
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeSetting>(() => loadTheme());
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const flash = (type: 'ok' | 'err', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3500);
  };

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      flash('err', 'File harus berupa gambar (JPG, PNG, atau WEBP).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      flash('err', 'Ukuran foto terlalu besar (maksimal 10 MB).');
      return;
    }
    try {
      const dataUrl = await resizeImageToSquare(file, 320);
      updateProfilePhoto(dataUrl);
      flash('ok', 'Foto profil berhasil diperbarui.');
    } catch {
      flash('err', 'Foto tidak bisa dibaca. Coba pakai format JPG atau PNG.');
    }
  };

  const [dbStatus, setDbStatus] = useState<'idle' | 'saving' | 'saved' | 'local'>('idle');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current); }, []);

  const chooseTheme = (t: ThemeSetting) => {
    setTheme(t);
    applyTheme(t);
    saveTheme(t);
    // Simpan ke MySQL (ditunda sebentar agar tidak mengirim terus saat memilih warna)
    setDbStatus('saving');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const ok = await saveThemeToServer(t);
      setDbStatus(ok ? 'saved' : 'local');
    }, 500);
  };

  const preset = THEME_PRESETS.find(p => p.id === theme.id);

  return (
    <div className="relative">
      <button
        id="btn-profile-menu"
        type="button"
        onClick={() => setOpen(!open)}
        className="block w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-200 p-[1.5px] shadow-md overflow-hidden shrink-0 cursor-pointer hover:scale-105 transition"
        title="Foto profil & tema warna"
      >
        {currentUser.avatar ? (
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-full h-full object-cover rounded-[10px]"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full rounded-[10px] bg-cream flex items-center justify-center font-bold text-amber-700 text-xs">
            {currentUser.name.charAt(0)}
          </div>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            id="menu-profile-dropdown"
            className="absolute right-0 mt-3 w-[19rem] max-w-[calc(100vw-2rem)] bg-cream border border-amber-500/30 rounded-2xl shadow-2xl p-4 z-50 space-y-4 max-h-[80vh] overflow-y-auto"
          >
            {/* Foto profil */}
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-200 p-[2px] shrink-0 overflow-hidden">
                {currentUser.avatar ? (
                  <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover rounded-[14px]" />
                ) : (
                  <div className="w-full h-full rounded-[14px] bg-slate-50 flex items-center justify-center font-bold text-amber-700 text-xl">
                    {currentUser.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-slate-900 truncate">{currentUser.name}</div>
                <div className="text-[11px] text-slate-500">{ROLE_LABEL[currentUser.role] || currentUser.role}</div>
                <div className="flex items-center gap-2 mt-2">
                  <label className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-800 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition">
                    <Camera className="w-3.5 h-3.5" />
                    <span>{currentUser.avatar ? 'Ganti Foto' : 'Unggah Foto'}</span>
                    <input id="input-profile-photo" type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
                  </label>
                  {currentUser.avatar && (
                    <button
                      type="button"
                      onClick={() => { updateProfilePhoto(null); flash('ok', 'Foto profil dihapus.'); }}
                      className="p-1.5 rounded-lg border border-red-500/30 text-red-600 hover:bg-red-500/10 transition cursor-pointer"
                      title="Hapus foto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {msg && (
              <div className={`text-[11px] px-3 py-2 rounded-xl border ${msg.type === 'ok' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700' : 'bg-red-500/10 border-red-500/30 text-red-700'}`}>
                {msg.text}
              </div>
            )}

            {currentUser.role === 'admin' && <ChangePasswordForm />}

            {/* Tema warna */}
            <div className="pt-3 border-t border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-amber-700" />
                  Tema Warna
                </div>
                <button
                  type="button"
                  onClick={() => chooseTheme({ id: DEFAULT_THEME_ID, bg: THEME_PRESETS[0].bg, accent: THEME_PRESETS[0].accent })}
                  className="text-[10px] text-slate-500 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
                  title="Kembalikan ke tema awal"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {THEME_PRESETS.map(p => {
                  const active = theme.id === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => chooseTheme({ id: p.id, bg: p.bg, accent: p.accent })}
                      className={`p-2 rounded-xl border text-center transition cursor-pointer ${active ? 'border-amber-500 bg-amber-500/10' : 'border-slate-200 hover:border-amber-500/40'}`}
                    >
                      <div className="relative mx-auto w-9 h-9 rounded-full border border-slate-300 overflow-hidden" style={{ background: p.bg }}>
                        <div className="absolute bottom-0 right-0 w-1/2 h-1/2 rounded-tl-full" style={{ background: p.accent }} />
                        {active && (
                          <Check className="absolute inset-0 m-auto w-4 h-4 text-slate-900" />
                        )}
                      </div>
                      <div className="text-[10px] font-medium text-slate-700 mt-1 leading-tight">{p.name}</div>
                    </button>
                  );
                })}
              </div>

              <div className="space-y-2">
                <div className="text-[11px] font-semibold text-slate-700">
                  Warna sendiri {theme.id === 'custom' && <span className="text-amber-700">(aktif)</span>}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                    <input
                      type="color"
                      value={theme.bg}
                      onChange={(e) => chooseTheme({ id: 'custom', bg: e.target.value, accent: theme.accent })}
                      className="w-8 h-8 rounded-lg border-0 bg-transparent p-0 cursor-pointer"
                    />
                    <span className="text-[11px] text-slate-700 leading-tight">Warna<br />latar</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                    <input
                      type="color"
                      value={theme.accent}
                      onChange={(e) => chooseTheme({ id: 'custom', bg: theme.bg, accent: e.target.value })}
                      className="w-8 h-8 rounded-lg border-0 bg-transparent p-0 cursor-pointer"
                    />
                    <span className="text-[11px] text-slate-700 leading-tight">Warna<br />aksen</span>
                  </label>
                </div>
                <p className="text-[10px] text-slate-500 leading-snug">
                  Warna latar otomatis dibuat cukup terang agar tulisan tetap terbaca
                  {preset ? ` (tema: ${preset.name})` : ''}.
                </p>
                {dbStatus !== 'idle' && (
                  <p className={`text-[10px] leading-snug font-medium ${dbStatus === 'saved' ? 'text-emerald-700' : dbStatus === 'local' ? 'text-amber-800' : 'text-slate-500'}`}>
                    {dbStatus === 'saving' && 'Menyimpan…'}
                    {dbStatus === 'saved' && 'Tersimpan di database — berlaku untuk semua akun.'}
                    {dbStatus === 'local' && 'Database belum tersambung — tema hanya tersimpan di browser ini.'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
