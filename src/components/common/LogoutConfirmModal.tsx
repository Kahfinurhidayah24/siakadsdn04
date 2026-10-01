import React, { useEffect } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { LogOut, AlertTriangle, X } from 'lucide-react';
import { LuxuryCrest } from './LuxuryCrest';

export const LogoutConfirmModal: React.FC = () => {
  const { isLogoutModalOpen, closeLogoutModal, confirmLogout, currentUser } = useSchool();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isLogoutModalOpen) {
        closeLogoutModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLogoutModalOpen, closeLogoutModal]);

  if (!isLogoutModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-cream/80 backdrop-blur-md animate-in fade-in duration-200">
      {/* Click outside to close */}
      <div 
        className="fixed inset-0" 
        onClick={closeLogoutModal} 
      />

      <div 
        id="modal-logout-confirm"
        className="relative w-full max-w-md bg-gradient-to-b from-cream to-slate-50 border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200"
      >
        {/* Top Gold Accent Border */}
        <div className="h-1.5 bg-gradient-to-r from-red-500 via-amber-500 to-red-500" />

        {/* Close Button */}
        <button
          onClick={closeLogoutModal}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
          title="Tutup (Batal)"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 text-center space-y-4">
          {/* Visual Icon Badge */}
          <div className="mx-auto w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center shadow-lg shadow-red-500/10">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-inner">
              <LogOut className="w-6 h-6 text-white" />
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900 font-serif-luxury">
              Konfirmasi Keluar Akun
            </h3>
            <p className="text-xs font-medium text-amber-700">
              SIAKAD SDN Lubang Buaya 04 Pagi
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-cream/90 border border-slate-200/80 text-left space-y-2">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-700 leading-relaxed">
                Apakah Anda yakin ingin keluar dari sesi akun <span className="font-semibold text-slate-900">"{currentUser.name}"</span>?
              </p>
            </div>
            <p className="text-[11px] text-slate-500 pl-6.5">
              Untuk mengakses kembali fitur SIAKAD, Anda harus memasukkan nama pengguna dan kata sandi Anda sendiri.
            </p>
          </div>

          {/* Action Buttons: Ya / Tidak */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              id="btn-logout-cancel"
              type="button"
              onClick={closeLogoutModal}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 hover:text-slate-900 font-semibold text-xs transition border border-slate-300 cursor-pointer"
            >
              Tidak, Tetap Masuk
            </button>

            <button
              id="btn-logout-confirm"
              type="button"
              onClick={confirmLogout}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-xs shadow-lg shadow-red-500/20 transition border border-red-500/40 cursor-pointer flex items-center justify-center gap-2"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Ya, Keluar Akun</span>
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="bg-cream/60 px-6 py-2.5 border-t border-slate-200 text-center">
          <p className="text-[10px] text-slate-500">
            Tekan <kbd className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[9px]">Esc</kbd> untuk membatalkan
          </p>
        </div>
      </div>
    </div>
  );
};
