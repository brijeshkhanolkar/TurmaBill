import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PlusCircle, 
  PackagePlus, 
  FileText, 
  Receipt, 
  Warehouse, 
  Users, 
  Building2, 
  Package, 
  Files, 
  BarChart3, 
  Settings,
  X
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const NAV_LINKS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/transactions/new', label: 'New Transaction', icon: PlusCircle },
  { path: '/awak', label: 'Awak / Inward', icon: PackagePlus },
  { path: '/farmer-patti', label: 'Farmer Patti', icon: FileText },
  { path: '/buyer-invoice', label: 'Buyer Invoice', icon: Receipt },
  { path: '/inventory', label: 'Inventory', icon: Warehouse },
  { path: '/farmers', label: 'Farmers', icon: Users },
  { path: '/buyers', label: 'Buyers', icon: Building2 },
  { path: '/products', label: 'Products', icon: Package },
  { path: '/bills', label: 'Bills', icon: Files },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-[220px] bg-white border-r border-gray-200
        transition-transform duration-300 ease-in-out flex flex-col
        md:translate-x-0 md:static md:flex-shrink-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header */}
        <div className="h-12 flex items-center justify-between px-4 border-b border-gray-200">
          <div className="flex flex-col">
            <div className="flex items-center text-amber-700 font-bold text-lg">
              <span className="mr-2">🌾</span>
              TurmaBill
            </div>
            <span className="text-[10px] text-gray-500 leading-none">Smart Billing for Turmeric Trading</span>
          </div>
          <button 
            onClick={onClose}
            className="md:hidden p-1 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
          {NAV_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={() => {
                  if (window.innerWidth < 768) {
                    onClose();
                  }
                }}
                className={({ isActive }) => `
                  flex items-center px-3 py-2 text-[13px] rounded transition-colors
                  ${isActive 
                    ? 'bg-[#FFF8E7] text-[#B8860B] font-medium border-r-[3px] border-[#B8860B]' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'}
                `}
              >
                <Icon size={18} className="mr-3 flex-shrink-0" />
                {link.label}
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
