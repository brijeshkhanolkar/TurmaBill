import React from 'react';

export function Table({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`w-full overflow-x-auto rounded-xl border border-gray-200/80 bg-white ${className}`}>
      <table className="w-full text-sm text-left border-collapse">
        {children}
      </table>
    </div>
  );
}

export function Thead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="text-[11px] font-bold uppercase tracking-wider text-gray-500 bg-gray-50/75 border-b border-gray-100">
      {children}
    </thead>
  );
}

export function Tbody({ children }: { children: React.ReactNode }) {
  return (
    <tbody className="divide-y divide-gray-100 bg-white">
      {children}
    </tbody>
  );
}

export function Tr({ children, className = '', onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <tr 
      className={`hover:bg-amber-50/30 transition-colors ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

export function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <th scope="col" className={`px-4 py-3 font-semibold text-gray-600 ${className}`}>
      {children}
    </th>
  );
}

export function Td({ children, className = '', colSpan }: { children: React.ReactNode; className?: string; colSpan?: number }) {
  return (
    <td colSpan={colSpan} className={`px-4 py-3 text-gray-700 text-sm ${className}`}>
      {children}
    </td>
  );
}

