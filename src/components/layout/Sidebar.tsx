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

        {/* Footer */}
        <div style={{ padding: '12px', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-subtle)', textAlign: 'center' }}>
            v1.0.0 · TurmaBill
          </div>
        </div>
      </aside>
    </>
  );
}
