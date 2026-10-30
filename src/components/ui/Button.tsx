import React, { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  /** Backwards-compatible alias used by form screens. */
  loading?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  className = '',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loading = false,
  icon,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const isBusy = isLoading || loading;

  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';

  const variants = {
    primary: 'bg-[#C8920A] hover:bg-[#B38008] text-white shadow-sm hover:shadow focus:ring-[#C8920A]/40 border border-transparent font-semibold',
    secondary: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 shadow-xs focus:ring-gray-300',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm focus:ring-red-400 border border-transparent font-medium',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm focus:ring-emerald-400 border border-transparent font-medium',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-600 hover:text-gray-900 focus:ring-gray-300 border border-transparent',
    outline: 'bg-transparent hover:bg-amber-50 text-[#C8920A] border border-[#C8920A] focus:ring-[#C8920A]/30 font-medium',
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-1.5 h-8 gap-1.5',
    md: 'text-sm px-3.5 py-2 h-9 gap-2',
    lg: 'text-base px-5 py-2.5 h-11 gap-2.5',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isBusy}
      {...props}
    >
      {isBusy && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
      {!isBusy && icon && <span className="shrink-0 flex items-center">{icon}</span>}
      {children}
    </button>
  );
}

