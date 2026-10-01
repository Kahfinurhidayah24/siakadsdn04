import React, { useState } from 'react';
import { resizeImageToBox } from '../../utils/imageResize';
import { useSchool } from '../../context/SchoolContext';
import { LuxuryCrest } from '../common/LuxuryCrest';
import { 
  Building2, MapPin, Phone, Mail, Globe, 
  Award, Edit2, CheckCircle2, ShieldCheck, 
  Layers, Users, GraduationCap, Camera, Trash2, ImagePlus 
} from 'lucide-react';

export const SchoolProfileView: React.FC = () => {
  const { schoolProfile, updateSchoolProfile, updateSchoolMedia, currentUser, students, teachers } = useSchool();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ ...schoolProfile });
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSchoolProfile(formData);
    setIsEditing(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const [mediaMsg, setMediaMsg] = useState<{ type: 'ok' | 'warn' | 'err'; text: string } | null>(null);
  const [mediaBusy, setMediaBusy] = useState(false);
  const flashMedia = (type: 'ok' | 'warn' | 'err', text: string) => {
    setMediaMsg({ type, text });
    setTimeout(() => setMediaMsg(null), 5000);
  };

  const reportSave = (r: 'db' | 'local' | 'gagal', okText: string) => {
    if (r === 'db') flashMedia('ok', `${okText} Tersimpan di database untuk semua akun.`);
    else if (r === 'local') flashMedia('warn', `${okText} Database belum tersambung, jadi baru tersimpan di browser ini.`);
    else flashMedia('err', 'Gagal menyimpan gambar (penyimpanan penuh). Coba gambar yang lebih kecil.');
  };

  const handleMediaFile = async (kind: 'logo' | 'cover', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      flashMedia('err', 'File harus berupa gambar (JPG, PNG, atau WEBP).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      flashMedia('err', 'Ukuran gambar terlalu besar (maksimal 10 MB).');
      return;
    }
    setMediaBusy(true);
    try {
      if (kind === 'logo') {
        const dataUrl = await resizeImageToBox(file, 400, 400, 'contain');
        reportSave(await updateSchoolMedia({ logo: dataUrl }), 'Logo sekolah diperbarui.');
      } else {
        const dataUrl = await resizeImageToBox(file, 1280, 480, 'cover', 0.82);
        reportSave(await updateSchoolMedia({ coverPhoto: dataUrl }), 'Foto sampul sekolah diperbarui.');
      }
    } catch {
      flashMedia('err', 'Gambar tidak bisa dibaca. Coba pakai format JPG atau PNG.');
    } finally {
      setMediaBusy(false);
    }
  };

  const removeMedia = async (kind: 'logo' | 'cover') => {
    setMediaBusy(true);
    const r = await updateSchoolMedia(kind === 'logo' ? { logo: '' } : { coverPhoto: '' });
    setMediaBusy(false);
    reportSave(r, kind === 'logo' ? 'Logo sekolah dihapus.' : 'Foto sampul dihapus.');
  };

  const isAdmin = currentUser.role === 'admin';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-amber-500/20">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-serif-luxury flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-amber-700" />
            Profil Resmi Satuan Pendidikan
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Data pokok institusi, akreditasi, visi misi, dan legalitas SDN Lubang Buaya 04 Pagi.
          </p>
        </div>

        {currentUser.role === 'admin' && (
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 rounded-xl bg-cream border border-amber-500/30 hover:border-amber-400 text-amber-700 text-xs font-semibold transition flex items-center gap-2"
          >
            <Edit2 className="w-4 h-4 text-amber-700" />
            {isEditing ? 'Batal Edit' : 'Perbarui Profil'}
          </button>
        )}
      </div>

      {savedSuccess && (
        <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Profil satuan pendidikan berhasil diperbarui!</span>
        </div>
      )}

      {/* Main Luxury Profile Hero */}
      {mediaMsg && (
        <div className={`p-3 rounded-2xl border text-xs font-semibold ${
          mediaMsg.type === 'ok' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700'
          : mediaMsg.type === 'warn' ? 'bg-amber-500/15 border-amber-500/40 text-amber-800'
          : 'bg-red-500/10 border-red-500/30 text-red-700'
        }`}>
          {mediaMsg.text}
        </div>
      )}

      <div className="rounded-3xl bg-gradient-to-br from-cream via-cream/90 to-amber-50 border border-amber-500/30 shadow-2xl overflow-hidden">
        {/* Foto sampul sekolah */}
        {(schoolProfile.coverPhoto || isAdmin) && (
          <div className="relative h-40 sm:h-52 bg-gradient-to-tr from-amber-200/60 via-amber-100/60 to-cream">
            {schoolProfile.coverPhoto ? (
              <img src={schoolProfile.coverPhoto} alt="Foto sekolah" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-amber-800/70 gap-1">
                <ImagePlus className="w-8 h-8" />
                <span className="text-xs font-medium">Belum ada foto sampul sekolah</span>
              </div>
            )}
            {isAdmin && (
              <div className="absolute right-3 bottom-3 flex items-center gap-2">
                <label className={`px-3 py-1.5 rounded-xl bg-cream/95 border border-amber-500/40 text-amber-800 text-[11px] font-semibold flex items-center gap-1.5 shadow cursor-pointer hover:bg-white transition ${mediaBusy ? 'opacity-60 pointer-events-none' : ''}`}>
                  <Camera className="w-3.5 h-3.5" />
                  <span>{schoolProfile.coverPhoto ? 'Ganti Foto Sampul' : 'Unggah Foto Sampul'}</span>
                  <input id="input-school-cover" type="file" accept="image/*" className="hidden" onChange={(e) => handleMediaFile('cover', e)} />
                </label>
                {schoolProfile.coverPhoto && (
                  <button
                    type="button"
                    onClick={() => removeMedia('cover')}
                    disabled={mediaBusy}
                    className="p-1.5 rounded-xl bg-cream/95 border border-red-500/30 text-red-600 shadow hover:bg-white transition cursor-pointer"
                    title="Hapus foto sampul"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        <div className="p-8 space-y-6">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="flex flex-col items-center gap-2">
            <LuxuryCrest size="lg" />
            {isAdmin && (
              <div className="flex items-center gap-1.5">
                <label className={`px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-800 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition ${mediaBusy ? 'opacity-60 pointer-events-none' : ''}`}>
                  <Camera className="w-3.5 h-3.5" />
                  <span>{schoolProfile.logo ? 'Ganti Logo' : 'Unggah Logo'}</span>
                  <input id="input-school-logo" type="file" accept="image/*" className="hidden" onChange={(e) => handleMediaFile('logo', e)} />
                </label>
                {schoolProfile.logo && (
                  <button
                    type="button"
                    onClick={() => removeMedia('logo')}
                    disabled={mediaBusy}
                    className="p-1.5 rounded-lg border border-red-500/30 text-red-600 hover:bg-red-500/10 transition cursor-pointer"
                    title="Hapus logo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2 text-center md:text-left flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 text-xs font-bold uppercase tracking-wider">
              <Award className="w-3.5 h-3.5 text-amber-700" />
              AKREDITASI {schoolProfile.accreditation} (UNGGUL)
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 font-serif-luxury tracking-wide">
              {schoolProfile.name}
            </h1>

            <p className="text-xs md:text-sm text-slate-700 max-w-2xl flex items-center justify-center md:justify-start gap-1.5">
              <MapPin className="w-4 h-4 text-amber-700 shrink-0" />
              {schoolProfile.address}
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2 text-xs font-mono text-slate-500">
              <span className="text-amber-700 font-bold">NPSN: {schoolProfile.npsn}</span>
              <span>•</span>
              <span>NSS: {schoolProfile.nss}</span>
              <span>•</span>
              <span className="text-slate-800">Jenjang: Sekolah Dasar (SD)</span>
            </div>
          </div>
        </div>

        {/* Quick Stats Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-200">
          <div className="p-3.5 rounded-2xl bg-cream/70 border border-slate-200 text-center">
            <div className="text-[11px] text-slate-500 font-medium">Rombongan Belajar</div>
            <div className="text-2xl font-bold text-amber-700 font-serif-luxury mt-1">18 Rombel</div>
            <div className="text-[10px] text-slate-500">Tingkat 1A - 6C (3 Rombel/Tingkat)</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-cream/70 border border-slate-200 text-center">
            <div className="text-[11px] text-slate-500 font-medium">Peserta Didik</div>
            <div className="text-2xl font-bold text-slate-900 font-serif-luxury mt-1">573 Siswa</div>
            <div className="text-[10px] text-emerald-600">274 Laki-laki • 299 Perempuan</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-cream/70 border border-slate-200 text-center">
            <div className="text-[11px] text-slate-500 font-medium">Dewan Guru & Tendik</div>
            <div className="text-2xl font-bold text-slate-900 font-serif-luxury mt-1">22 Guru</div>
            <div className="text-[10px] text-slate-500">Pendidik Bersertifikasi</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-cream/70 border border-slate-200 text-center">
            <div className="text-[11px] text-slate-500 font-medium">Ruang Kelas & Sarana</div>
            <div className="text-2xl font-bold text-amber-700 font-serif-luxury mt-1">9 Ruang</div>
            <div className="text-[10px] text-amber-700/80">Sesi Pagi & Terjadwal</div>
          </div>
        </div>
        </div>
      </div>

      {/* Facilities & Infrastructure Highlight */}
      <div className="p-6 rounded-3xl bg-cream/80 border border-amber-500/20 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-slate-900 font-serif-luxury pb-2 border-b border-slate-200 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-700" />
            Sarana, Prasarana & Fasilitas Utama
          </span>
          <span className="text-[11px] text-amber-700 font-mono font-normal">Kondisi Baik & Lengkap</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-cream/80 border border-slate-200/80">
            <div className="text-slate-500 text-[11px]">Ruang Kelas</div>
            <div className="text-base font-bold text-amber-700 mt-0.5">9 Ruang</div>
            <div className="text-[10px] text-slate-500 mt-1">Untuk 18 Rombel Sesi Pagi</div>
          </div>

          <div className="p-3 rounded-2xl bg-cream/80 border border-slate-200/80">
            <div className="text-slate-500 text-[11px]">Laboratorium</div>
            <div className="text-base font-bold text-emerald-600 mt-0.5">1 Laboratorium</div>
            <div className="text-[10px] text-slate-500 mt-1">Lab Komputer & Praktikum</div>
          </div>

          <div className="p-3 rounded-2xl bg-cream/80 border border-slate-200/80">
            <div className="text-slate-500 text-[11px]">Perpustakaan</div>
            <div className="text-base font-bold text-sky-600 mt-0.5">1 Perpustakaan</div>
            <div className="text-[10px] text-slate-500 mt-1">Koleksi Ramah Anak & Digital</div>
          </div>

          <div className="p-3 rounded-2xl bg-cream/80 border border-amber-500/30 bg-amber-500/5">
            <div className="text-amber-700 text-[11px] font-semibold">Mushollah Sekolah</div>
            <div className="text-base font-bold text-amber-800 mt-0.5">Tersedia (Aktif)</div>
            <div className="text-[10px] text-slate-500 mt-1">Mushollah Baitul Ilmi</div>
          </div>
        </div>
      </div>

      {/* Official Dapodik Administrative Information */}
      <div className="p-6 rounded-3xl bg-cream/80 border border-amber-500/20 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-slate-900 font-serif-luxury pb-2 border-b border-slate-200 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-700" />
          Identitas Wilayah & Administrasi Kedinasan (Dapodik)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] text-slate-500 block">Desa / Kelurahan</span>
            <span className="font-bold text-slate-800">LUBANG BUAYA</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] text-slate-500 block">Kecamatan / Kota (LN)</span>
            <span className="font-bold text-slate-800">KEC. CIPAYUNG</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] text-slate-500 block">Kab.-Kota / Negara (LN)</span>
            <span className="font-bold text-slate-800">KOTA ADM. JAKARTA TIMUR</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] text-slate-500 block">Propinsi / Luar Negeri (LN)</span>
            <span className="font-bold text-slate-800">PROV. D.K.I. JAKARTA</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] text-slate-500 block">Status Sekolah</span>
            <span className="font-bold text-emerald-600">NEGERI</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] text-slate-500 block">Bentuk & Jenjang Pendidikan</span>
            <span className="font-bold text-amber-700">SD • DIKDAS</span>
          </div>
        </div>
      </div>

      {/* Profile Details or Edit Form */}
      {isEditing ? (
        <form onSubmit={handleSave} className="p-6 rounded-3xl bg-cream/90 border border-amber-500/30 shadow-xl space-y-4 text-xs">
          <h3 className="text-base font-bold text-slate-900 font-serif-luxury pb-2 border-b border-slate-200">
            Form Pembaruan Identitas Sekolah
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 mb-1 font-semibold">Nama Satuan Pendidikan</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-700 mb-1 font-semibold">NPSN</label>
              <input
                type="text"
                value={formData.npsn}
                onChange={(e) => setFormData({ ...formData, npsn: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-amber-700 font-mono outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-700 mb-1 font-semibold">Nomor Telepon</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-700 mb-1 font-semibold">Email Resmi</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-slate-700 mb-1 font-semibold">Alamat Lengkap</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-700 mb-1 font-semibold">Nama Kepala Sekolah</label>
              <input
                type="text"
                value={formData.principal.name}
                onChange={(e) => setFormData({
                  ...formData,
                  principal: { ...formData.principal, name: e.target.value }
                })}
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-700 mb-1 font-semibold">NIP Kepala Sekolah</label>
              <input
                type="text"
                value={formData.principal.nip}
                onChange={(e) => setFormData({
                  ...formData,
                  principal: { ...formData.principal, nip: e.target.value }
                })}
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-amber-700 font-mono outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold uppercase tracking-wider"
            >
              Simpan Perubahan
            </button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Visi Misi */}
          <div className="p-6 rounded-3xl bg-cream/80 border border-amber-500/20 shadow-xl space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900 font-serif-luxury pb-2 border-b border-slate-200 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              Visi & Nilai Unggulan Sekolah
            </h3>
            <div className="space-y-2">
              <div className="text-[11px] text-amber-700 uppercase font-semibold">Visi:</div>
              <p className="text-slate-800 italic leading-relaxed pl-3 border-l-2 border-amber-500/50">
                &ldquo;Terwujudnya Peserta Didik yang Beriman dan Bertaqwa kepada Tuhan Yang Maha Esa, Berkarakter Luhur, Unggul dalam Prestasi Akademik dan Non-Akademik, Berwawasan Iptek, serta Peduli Lingkungan Hidup.&rdquo;
              </p>
            </div>
            <div className="space-y-2 pt-2">
              <div className="text-[11px] text-amber-700 uppercase font-semibold">Misi Utama:</div>
              <ul className="space-y-1.5 text-slate-700 list-disc pl-4 leading-relaxed">
                <li>Menanamkan nilai-nilai keagamaan dan budi pekerti melalui pembiasaan positif harian.</li>
                <li>Melaksanakan pembelajaran Kurikulum Merdeka yang inovatif, berdiferensiasi, dan berbasis teknologi digital.</li>
                <li>Membina potensi dan bakat minat peserta didik secara optimal melalui kegiatan ekstrakurikuler terpadu.</li>
              </ul>
            </div>
          </div>

          {/* Legal & Contacts */}
          <div className="p-6 rounded-3xl bg-cream/80 border border-amber-500/20 shadow-xl space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900 font-serif-luxury pb-2 border-b border-slate-200 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-700" />
              Legalitas & Kontak Kedinasan
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Kepala Satuan Pendidikan</span>
                <span className="font-bold text-slate-900">{schoolProfile.principal.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">NIP Kepala Sekolah</span>
                <span className="font-mono text-amber-700">{schoolProfile.principal.nip}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Telepon Resmi</span>
                <span className="font-mono text-slate-800">{schoolProfile.phone}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Pos Elektronik (Email)</span>
                <span className="text-slate-800">{schoolProfile.email}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Website / Portal SIAKAD</span>
                <span className="text-amber-700">{schoolProfile.website}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
