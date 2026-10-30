import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface EmptyStateProps {
  icon: LucideIcon | React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
  const renderIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) return icon;
    const IconComponent = icon as LucideIcon;
    return <IconComponent size={28} className="text-[#C8920A]" />;
  };

  return (
    <div className={`flex flex-col items-center justify-center p-10 text-center bg-white rounded-xl border border-dashed border-gray-200/90 ${className}`}>
      <div className="w-14 h-14 mb-4 rounded-2xl bg-amber-50/80 border border-amber-100 flex items-center justify-center text-[#C8920A] shadow-xs">
        {renderIcon()}
      </div>
      <h3 className="mb-1.5 text-base font-semibold text-gray-900">{title}</h3>
      <p className="mb-5 text-xs text-gray-500 max-w-sm leading-relaxed">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}

