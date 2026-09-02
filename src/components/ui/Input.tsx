import React, { InputHTMLAttributes, forwardRef } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, helperText, required, containerClassName = '', ...props }, ref) => {
    return (
      <div className={`flex flex-col space-y-1 ${containerClassName}`}>
        {label && (
          <label className="text-xs font-semibold text-gray-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          className={`
            h-8 px-3 text-sm border rounded bg-white transition-colors focus:outline-none focus:ring-1
            disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed
            ${error 
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
              : 'border-gray-300 focus:border-[#B8860B] focus:ring-[#B8860B]'
            }
            ${className}
          `}
          required={required}
          {...props}
        />
        {error && (
          <p className="text-[11px] text-red-500 mt-0.5">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-[11px] text-gray-500 mt-0.5">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
