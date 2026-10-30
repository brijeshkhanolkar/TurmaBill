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
    <div className={`relative flex items-center ${className}`}>
      <div className="absolute left-3 flex items-center pointer-events-none text-gray-400">
        <Search className="w-4 h-4" />
      </div>
      <input
        type="text"
        className="block w-full h-9 pl-9 pr-8 text-sm text-gray-800 border border-gray-200 rounded-lg bg-white placeholder:text-gray-400 transition-all focus:border-[#C8920A] focus:ring-2 focus:ring-[#C8920A]/20 focus:outline-none"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button
          type="button"
          className="absolute right-2.5 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
          onClick={() => onChange('')}
          title="Clear search"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

