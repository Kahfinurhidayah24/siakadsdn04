import React from 'react';
import { useSchool } from '../../context/SchoolContext';

interface LuxuryCrestProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export const LuxuryCrest: React.FC<LuxuryCrestProps> = ({ size = 'md', showSubtitle = true }) => {
  const sizeMap = {
    sm: { box: 'w-9 h-9', icon: 'w-5 h-5', text: 'text-sm', sub: 'text-[10px]' },
    md: { box: 'w-11 h-11', icon: 'w-6 h-6', text: 'text-base', sub: 'text-xs' },
    lg: { box: 'w-16 h-16', icon: 'w-9 h-9', text: 'text-xl', sub: 'text-sm' },
  };

  const current = sizeMap[size];
  const { schoolProfile } = useSchool();
  const logo = schoolProfile.logo;

  return (
    <div className="flex items-center gap-3 select-none">
      {/* Golden Royal Crest Emblem */}
      <div className={`relative ${current.box} rounded-xl bg-gradient-to-br from-amber-400 via-amber-600 to-amber-100 p-[1.5px] shadow-lg shadow-amber-950/40 flex items-center justify-center`}>
        <div className="w-full h-full rounded-[10px] bg-slate-50 flex items-center justify-center relative overflow-hidden">
          {/* Subtle golden ambient flare */}
          <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/20 via-transparent to-amber-300/10 pointer-events-none" />
          
          {logo ? (
            <img src={logo} alt="Logo sekolah" className="relative w-full h-full object-contain p-0.5" />
          ) : (
          <svg className={`${current.icon} text-amber-700 fill-current drop-shadow-[0_0_8px_rgba(22,163,74,0.6)]`} viewBox="0 0 24 24">
            {/* Elegant Crown & Book Emblem */}
            <path d="M12 2L15 6L20 4L18 10L21 14L15 15L12 21L9 15L3 14L6 10L4 4L9 6L12 2Z" fill="url(#goldGrad)" opacity="0.9" />
            <path d="M6 16C6 16 9 14.5 12 16.5C15 14.5 18 16 18 16V20C18 20 15 18.5 12 20.5C9 18.5 6 20 6 20V16Z" style={{ fill: 'var(--color-amber-200)' }} />
            <defs>
              <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: 'var(--color-amber-200)' }} />
                <stop offset="50%" style={{ stopColor: 'var(--color-amber-500)' }} />
                <stop offset="100%" style={{ stopColor: 'var(--color-amber-700)' }} />
              </linearGradient>
            </defs>
          </svg>
          )}
        </div>
      </div>

      <div className="flex flex-col justify-center leading-tight">
        <div className="flex items-center gap-1.5">
          <span className={`font-serif-luxury font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-700 via-amber-600 to-amber-800 ${current.text}`}>
            SIAKAD 04
          </span>
        </div>
        {showSubtitle && (
          <span className={`text-slate-500 font-medium tracking-tight ${current.sub}`}>
            SDN Lubang Buaya 04 Pagi
          </span>
        )}
      </div>
    </div>
  );
};
