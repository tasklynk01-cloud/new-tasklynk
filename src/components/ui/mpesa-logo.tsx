import React from 'react';

interface MpesaLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function MpesaLogo({ className = '', size = 'md' }: MpesaLogoProps) {
  const height = size === 'sm' ? 24 : size === 'lg' ? 42 : 32;

  return (
    <div
      className={`inline-flex items-center justify-center bg-white px-2 py-1 rounded-lg shadow-sm border border-emerald-600/20 select-none ${className}`}
      style={{ height }}
    >
      <img
        src="/images/mpesa-logo.svg"
        alt="Safaricom M-PESA"
        className="h-full w-auto object-contain"
        loading="eager"
      />
    </div>
  );
}

export function MpesaBadge({ className = '' }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[#00A34F] text-xs font-bold ${className}`}>
      <span className="w-2 h-2 rounded-full bg-[#00A34F] animate-pulse" />
      <span>M-PESA Express</span>
    </div>
  );
}
