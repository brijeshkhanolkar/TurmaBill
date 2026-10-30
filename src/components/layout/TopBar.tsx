import React, { useState, useEffect, useRef } from 'react';
import { Menu, Search, PlusCircle, Bell, User, X, FileText, Users, Building2, Package, Wheat, Receipt } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { globalSearch } from '../../database/services';
import type { SearchResult } from '../../types';

interface TopBarProps {
  onMenuClick: () => void;
}

const TYPE_CONFIG: Record<SearchResult['type'], { icon: React.ElementType; label: string; color: string; path: string }> = {
  farmer:  { icon: Users,    label: 'Farmer',  color: '#16A34A', path: '/farmers' },
  buyer:   { icon: Building2, label: 'Buyer',   color: '#2563EB', path: '/buyers' },
  awak:    { icon: Wheat,    label: 'Awak',    color: '#C8920A', path: '/awak' },
  patti:   { icon: FileText, label: 'Patti',   color: '#7C3AED', path: '/farmer-patti' },
  invoice: { icon: Receipt,  label: 'Invoice', color: '#DC2626', path: '/buyer-invoice' },
  product: { icon: Package,  label: 'Product', color: '#0891B2', path: '/products' },
};

export default function TopBar({ onMenuClick }: TopBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const currentDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
  });

  /* Close on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* Debounced search */
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    if (query.trim().length < 2) return;

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await globalSearch(query.trim());
        setResults(res.slice(0, 8));
        setOpen(true);
        setSelectedIdx(-1);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 280);
    return () => clearTimeout(timer);
  }, [query]);

  const navigateTo = (result: SearchResult) => {
    setOpen(false);
    setQuery('');
    const cfg = TYPE_CONFIG[result.type];
    navigate(`${cfg.path}/${result.id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, results.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, -1)); }
    if (e.key === 'Enter' && selectedIdx >= 0) { navigateTo(results[selectedIdx]); }
    if (e.key === 'Escape') { setOpen(false); inputRef.current?.blur(); }
  };

  return (
    <header className="topbar">
      {/* Mobile menu toggle */}
      <button className="md:hidden topbar-icon-btn" onClick={onMenuClick} id="menu-toggle-btn">
        <Menu size={18} />
      </button>

      {/* Search */}
      <div className="topbar-search" ref={containerRef}>
        <span className="topbar-search-icon">
          <Search size={14} />
        </span>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search farmers, buyers, invoices… (⌘K)"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          onKeyDown={handleKeyDown}
          id="global-search-input"
          autoComplete="off"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setResults([]); setOpen(false); }}
            style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-subtle)', display: 'flex' }}
          >
            <X size={12} />
          </button>
        )}

        {/* Results dropdown */}
        {open && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 10, boxShadow: 'var(--shadow-lg)',
            zIndex: 200, overflow: 'hidden', maxHeight: 360, overflowY: 'auto'
          }}>
            {loading && (
              <div style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-muted)' }}>
                Searching…
              </div>
            )}
            {!loading && results.length === 0 && query.length >= 2 && (
              <div style={{ padding: '16px', fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
                No results for &quot;{query}&quot;
              </div>
            )}
            {!loading && results.map((result, idx) => {
              const cfg = TYPE_CONFIG[result.type];
              const Icon = cfg.icon;
              return (
                <div
                  key={`${result.type}-${result.id}`}
                  onClick={() => navigateTo(result)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 14px', cursor: 'pointer',
                    borderBottom: '1px solid #F3F4F6',
                    background: idx === selectedIdx ? '#F9FAFB' : 'transparent',
                    transition: 'background 100ms',
                  }}
                  onMouseEnter={() => setSelectedIdx(idx)}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: 7,
                    background: cfg.color + '18',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Icon size={13} style={{ color: cfg.color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {result.label}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                      {result.sublabel}
                    </div>
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: '1px 6px',
                    background: cfg.color + '15', color: cfg.color,
                    borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.4px',
                    flexShrink: 0,
                  }}>
                    {cfg.label}
                  </span>
                  {result.amount != null && (
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', flexShrink: 0 }}>
                      ₹{result.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right side actions */}
      <div className="topbar-actions">
        <span className="topbar-date hidden sm:block">{currentDate}</span>

        <button
          className="btn btn-primary btn-sm hidden sm:inline-flex"
          onClick={() => navigate('/transactions/new')}
          id="new-transaction-btn"
        >
          <PlusCircle size={13} />
          New Transaction
        </button>

        <button className="topbar-icon-btn" id="notifications-btn" title="Notifications">
          <Bell size={16} />
          <span className="notif-badge" />
        </button>

        <div
          className="topbar-avatar"
          title="Admin"
          id="user-avatar"
          style={{ fontSize: 12 }}
        >
          A
        </div>
      </div>
    </header>
  );
}
