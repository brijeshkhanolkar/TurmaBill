import React, { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  /** Backwards-compatible alias used by the form screens. */
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
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors rounded focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-[#B8860B] text-white hover:bg-amber-600 focus:ring-amber-600 border border-transparent',
    secondary: 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 focus:ring-gray-400',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-600 border border-transparent',
    success: 'bg-[#2E7D32] text-white hover:bg-green-800 focus:ring-green-700 border border-transparent',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-400 border border-transparent',
    outline: 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 focus:ring-gray-400',
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-1.5 h-7',
    md: 'text-sm px-4 py-2 h-9',
    lg: 'text-base px-6 py-2.5 h-11',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading || loading}
      {...props}
    >
      {(isLoading || loading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {!isLoading && !loading && icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
}
