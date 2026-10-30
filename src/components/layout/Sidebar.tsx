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
  X,
} from 'lucide-react';
import { useAppAuth } from '../../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const NAV_SECTIONS = [
  {
    label: 'Main',
    links: [
      { path: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
      { path: '/transactions/new', label: 'New Transaction', icon: PlusCircle },
    ],
  },
  {
    label: 'Operations',
    links: [
      { path: '/awak', label: 'Awak / Inward', icon: PackagePlus },
      { path: '/farmer-patti', label: 'Farmer Patti', icon: FileText },
      { path: '/buyer-invoice', label: 'Buyer Invoice', icon: Receipt },
    ],
  },
  {
    label: 'Stock & Finance',
    links: [
      { path: '/inventory', label: 'Inventory', icon: Warehouse },
      { path: '/bills', label: 'Bills', icon: Files },
      { path: '/reports', label: 'Reports', icon: BarChart3 },
    ],
  },
  {
    label: 'Master Data',
    links: [
      { path: '/farmers', label: 'Farmers', icon: Users },
      { path: '/buyers', label: 'Buyers', icon: Building2 },
      { path: '/products', label: 'Products', icon: Package },
    ],
  },
  {
    label: 'System',
    links: [
      { path: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { currentUser } = useAppAuth();
  const handleLinkClick = () => {
    if (window.innerWidth < 768) onClose();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={onClose}
          style={{ backdropFilter: 'blur(2px)' }}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={[
          'fixed inset-y-0 left-0 z-50 flex flex-col',
          'md:translate-x-0 md:static',
          'transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
        style={{ width: 'var(--sidebar-width)', background: 'var(--surface)', borderRight: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}
      >
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">🌾</div>
          <div>
            <div className="sidebar-brand-name">TurmaBill</div>
            <div className="sidebar-brand-sub">Turmeric Trade Manager</div>
          </div>
          <button
            onClick={onClose}
            className="md:hidden ml-auto topbar-icon-btn"
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <div className="sidebar-section-label">{section.label}</div>
              {section.links.map((link) => {
                const Icon = link.icon;
                return (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    end={link.exact}
                    onClick={handleLinkClick}
                    className={({ isActive }) =>
                      `sidebar-item${isActive ? ' active' : ''}`
                    }
                  >
                    <Icon className="sidebar-item-icon" />
                    {link.label}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User Card */}
        <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)' }}>
          <NavLink
            to="/user-profile"
            onClick={handleLinkClick}
            className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 text-[#C8920A] flex items-center justify-center font-bold text-xs shrink-0">
              {currentUser.name ? currentUser.name.slice(0, 1).toUpperCase() : 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-gray-800 truncate">{currentUser.name}</div>
              <div className="text-[10px] text-gray-500 truncate">{currentUser.marketLocation}</div>
            </div>
          </NavLink>
        </div>

        {/* Footer */}
        <div style={{ padding: '10px 12px', borderTop: '1px solid #F3F4F6' }}>
          <div style={{ fontSize: 10, color: 'var(--text-subtle)', textAlign: 'center' }}>
            v1.0.0 · TurmaBill
          </div>
        </div>
      </aside>
    </>
  );
}
