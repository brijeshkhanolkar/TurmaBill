import React from 'react';
import { Search, X } from 'lucide-react';

export interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBox({ value, onChange, placeholder = 'Search...', className = '' }: SearchBoxProps) {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <Search className="w-4 h-4 text-gray-400" />
      </div>
      <input
        type="text"
        className="block w-full h-9 pl-9 pr-8 text-sm text-gray-900 border border-gray-300 rounded bg-white focus:ring-1 focus:ring-[#B8860B] focus:border-[#B8860B] focus:outline-none"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button
          type="button"
          className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-gray-400 hover:text-gray-600"
          onClick={() => onChange('')}
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
