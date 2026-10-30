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
      <div className={`flex flex-col space-y-1.5 ${containerClassName}`}>
        {label && (
          <label className="text-xs font-semibold text-gray-700 select-none">
            {label}
            {required && <span className="text-rose-500 ml-1 font-bold">*</span>}
          </label>
        )}
        <input
          ref={ref}
          className={`
            h-9 px-3 text-sm border rounded-lg bg-white transition-all duration-150 placeholder:text-gray-400
            focus:outline-none focus:ring-2 focus:ring-offset-0
            disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed
            ${error 
              ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200' 
              : 'border-gray-200 hover:border-gray-300 focus:border-[#C8920A] focus:ring-[#C8920A]/20'
            }
            ${className}
          `}
          required={required}
          {...props}
        />
        {error && (
          <p className="text-[11px] text-rose-600 font-medium mt-0.5">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-[11px] text-gray-500 mt-0.5">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

