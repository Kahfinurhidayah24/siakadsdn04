import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { LuxuryCrest } from '../common/LuxuryCrest';
import { 
  ShieldCheck, Lock, User, Eye, EyeOff, 
  LogIn, AlertCircle, Building2, Sparkles, HelpCircle, ChevronDown, ChevronUp, ArrowLeft, Send, CheckCircle2
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { loginWithCredentials, schoolProfile } = useSchool();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [mode, setMode] = useState<'login' | 'forgot'>('login');
  const [fgUser, setFgUser] = useState('');
  const [fgName, setFgName] = useState('');
  const [fgContact, setFgContact] = useState('');
  const [fgDone, setFgDone] = useState('');

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/user/forgot', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: fgUser, name: fgName, contact: fgContact }),
      });
      const d = await res.json().catch(() => null);
      if (d?.success) setFgDone(d.message);
      else setErrorMessage(d?.message || 'Gagal mengirim permintaan. Coba lagi.');
    } catch {
      setErrorMessage('Server tidak dapat dihubungi. Coba lagi nanti.');
    }
    setIsLoading(false);
  };
  const backToLogin = () => { setMode('login'); setFgDone(''); setErrorMessage(''); };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!username.trim() || !password.trim()) {
      setErrorMessage('Harap masukkan nama pengguna dan kata sandi Anda.');
      return;
    }

    setIsLoading(true);

    const res = await loginWithCredentials(username, password);
    setIsLoading(false);
    if (!res.success) {
      setErrorMessage(res.message || 'Nama pengguna atau kata sandi tidak cocok. Silakan periksa kembali!');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-amber-50 to-white text-slate-800 flex flex-col justify-between relative overflow-hidden selection:bg-amber-500 selection:text-white">
      {/* Background Decorative Lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-amber-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <header className="h-16 px-6 border-b border-amber-500/20 bg-cream/80 backdrop-blur-md flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <LuxuryCrest size="sm" showSubtitle={false} />
          <div>
            <h1 className="text-xs font-bold text-slate-800 tracking-wider">
              {schoolProfile.name}
            </h1>
            <p className="text-[10px] text-amber-700/90 font-mono">
              NPSN: {schoolProfile.npsn} • Status: {schoolProfile.status} • {schoolProfile.jenjangPendidikan || 'DIKDAS'}
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-amber-700/80 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
          <Sparkles className="w-3.5 h-3.5 text-amber-700" />
          <span>Sistem Informasi Akademik (SIAKAD)</span>
        </div>
      </header>

      {/* Main Login Center Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 z-10">
        <div className="w-full max-w-md">
          <div className="bg-cream/90 backdrop-blur-xl border border-amber-500/30 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6">
            
            {/* Crest & Title */}
            <div className="text-center space-y-2">
              <div className="flex justify-center mb-1">
                <LuxuryCrest size="md" showSubtitle={false} />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-serif-luxury tracking-wide">
                SDN LUBANG BUAYA 04 PAGI
              </h2>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {mode === 'forgot' ? 'Pemulihan Kata Sandi' : 'Silakan masukkan nama pengguna dan kata sandi Anda untuk mengakses akun masing-masing (Admin, Kepsek, Guru, atau Siswa).'}
              </p>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-red-500/15 border border-red-500/40 text-red-600 text-xs flex items-center gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {mode === 'forgot' && (
              fgDone ? (
                <div className="space-y-4 text-center">
                  <CheckCircle2 className="w-10 h-10 text-amber-600 mx-auto" />
                  <p className="text-xs text-slate-600">{fgDone}</p>
                  <button type="button" onClick={backToLogin} className="text-xs font-bold text-amber-700 hover:underline cursor-pointer">Kembali ke halaman masuk</button>
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit} className="space-y-4" autoComplete="off">
                  <p className="text-xs text-slate-500">Isi data berikut. Administrator akan memeriksa lalu memberi Anda kata sandi baru.</p>
                  {[
                    { l: 'Username / NISN / NIP', v: fgUser, set: setFgUser, req: true, ph: 'Contoh: NISN siswa' },
                    { l: 'Nama Lengkap', v: fgName, set: setFgName, req: true, ph: 'Sesuai data sekolah' },
                    { l: 'No. WhatsApp (opsional)', v: fgContact, set: setFgContact, req: false, ph: 'Agar mudah dihubungi' },
                  ].map(f => (
                    <div key={f.l} className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">{f.l}</label>
                      <input required={f.req} value={f.v} onChange={e => f.set(e.target.value)} placeholder={f.ph} autoComplete="off"
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-amber-500 text-slate-800 placeholder-slate-400 text-xs outline-none transition font-medium" />
                    </div>
                  ))}
                  <button type="submit" disabled={isLoading}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-2">
                    {isLoading ? <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Send className="w-4 h-4" /><span>Kirim Permintaan</span></>}
                  </button>
                  <button type="button" onClick={backToLogin} className="w-full flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-amber-700 cursor-pointer">
                    <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke halaman masuk
                  </button>
                </form>
              )
            )}

            {/* Input Form */}
            {mode === 'login' && <>
            <form onSubmit={handleLoginSubmit} className="space-y-4" autoComplete="off">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span>Nama Pengguna / Username / NISN</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    id="input-username"
                    name="siakad-login-id"
                    required
                    autoFocus
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    data-lpignore="true"
                    data-1p-ignore="true"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Masukkan username atau NISN..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-amber-400 text-slate-800 placeholder-slate-400 text-xs outline-none transition font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span>Kata Sandi / Password</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="input-password"
                    name="siakad-login-secret"
                    required
                    autoComplete="new-password"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    data-lpignore="true"
                    data-1p-ignore="true"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi..."
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-amber-400 text-slate-800 placeholder-slate-400 text-xs outline-none transition font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-700 cursor-pointer"
                    title={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="text-right -mt-1">
                <button type="button" onClick={() => { setMode('forgot'); setErrorMessage(''); }}
                  className="text-[11px] font-semibold text-amber-700 hover:text-amber-800 hover:underline cursor-pointer">
                  Lupa password?
                </button>
              </div>

              <button
                type="submit"
                id="btn-submit-login"
                disabled={isLoading}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-[0.99] transition cursor-pointer flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span className="inline-block w-4 h-4 border-2 border-cream border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4 text-white" />
                    <span>Masuk ke Akun</span>
                  </>
                )}
              </button>
            </form>

            {/* Security Notice & Discreet Credential Help */}
            <div className="pt-2 border-t border-slate-200/80">
              <button
                type="button"
                onClick={() => setShowHelp(!showHelp)}
                className="w-full flex items-center justify-between text-[11px] text-slate-500 hover:text-amber-700 transition py-1 cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-700/80" />
                  Bantuan Kredensial Akun Sekolah
                </span>
                {showHelp ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showHelp && (
                <div className="mt-2.5 p-3 rounded-xl bg-slate-50 border border-amber-500/20 text-[11px] space-y-2 animate-in fade-in">
                  <div className="text-slate-700 font-semibold flex items-center gap-1.5 text-amber-700">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Format Akses Akun:
                  </div>
                  <ul className="space-y-1 text-slate-500 pl-2">
                    <li>• <strong className="text-slate-800">Siswa:</strong> username <code className="text-indigo-600">siswa</code> atau nomor NISN</li>
                  </ul>
                  <p className="text-[10px] text-slate-500 italic">
                    *Lupa kata sandi? Gunakan tautan "Lupa password?" di atas atau hubungi Administrator Sekolah.
                  </p>
                </div>
              )}
            </div>
            </>}

          </div>
        </div>
      </main>

      {/* Footer Legalities & Identity */}
      <footer className="py-4 px-6 border-t border-slate-200 bg-cream/90 text-center text-xs text-slate-500 space-y-1 z-10">
        <p className="font-semibold text-slate-500">
          SDN LUBANG BUAYA 04 PAGI • NPSN: 20104241 • Akreditasi A (Unggul)
        </p>
        <p className="text-[11px] text-slate-500">
          Jl. Monumen Pancasila Sakti Rt.001/02 No. 12, Kec. Cipayung, Kota Adm. Jakarta Timur, Prov. D.K.I. Jakarta
        </p>
      </footer>
    </div>
  );
};
