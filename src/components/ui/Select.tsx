import React, { SelectHTMLAttributes, forwardRef } from 'react';

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  containerClassName?: string;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', label, error, helperText, required, options, containerClassName = '', ...props }, ref) => {
    return (
      <div className={`flex flex-col space-y-1.5 ${containerClassName}`}>
        {label && (
          <label className="text-xs font-semibold text-gray-700 select-none">
            {label}
            {required && <span className="text-rose-500 ml-1 font-bold">*</span>}
          </label>
        )}
        <select
          ref={ref}
          className={`
            h-9 px-3 text-sm border rounded-lg bg-white transition-all duration-150 cursor-pointer
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
        >
          {props.placeholder && (
            <option value="" disabled hidden>
              {props.placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
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

Select.displayName = 'Select';

