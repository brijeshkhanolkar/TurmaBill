import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center bg-white rounded border border-gray-200 border-dashed ${className}`}>
      <div className="w-12 h-12 mb-4 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
        <Icon size={24} />
      </div>
      <h3 className="mb-1 text-sm font-semibold text-gray-900">{title}</h3>
      <p className="mb-4 text-xs text-gray-500 max-w-sm">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
