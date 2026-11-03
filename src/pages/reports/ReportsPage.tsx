import React, { useState, useEffect, useMemo } from 'react';
import {
  Download, Printer, BarChart2, Calendar, Users, Building2, Package, RefreshCw,
  TrendingUp, TrendingDown, FileSpreadsheet, CheckCircle2, Search, Eye, Filter,
  ShieldCheck, X, FileText, Check, Database
} from 'lucide-react';
import { getFarmerPattis, getBuyerInvoices, getInventoryStock, getAllFarmers, getAllBuyers } from '../../database/services';
import { formatCurrency, formatDate } from '../../utils/formatters';
import type { FarmerPatti, BuyerInvoice, Farmer, Buyer, InventoryStock } from '../../types';
import { MOCK_REPORTS, type MockReport } from '../../data/mockReports';
import { ensure10MockRecords } from '../../database/seeds';
import toast from 'react-hot-toast';

/* ──────────────────────────────────────────────
   CSV Export
   ────────────────────────────────────────────── */
function exportToCSV(data: Record<string, any>[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(row => headers.map(h => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function exportMockReportToCSV(report: MockReport) {
  const headers = report.tableHeaders;
  const rows = report.tableRows;
  const csv = [
    `"TURMABILL - APMC YARD SANGLI"`,
    `"Report: ${report.title} (${report.code})"`,
    `"Category: ${report.category} | Period: ${report.period} | Generated: ${report.generatedDate}"`,
    `"Certified By: ${report.author} | APMC License: MH-SANGLI-TUR-2026"`,
    `"Status: ${report.status}"`,
    '',
    headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    '',
    `"Compliance & Audit Notes:"`,
    ...report.auditNotes.map(note => `"- ${note.replace(/"/g, '""')}"`)
  ].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${report.code.toLowerCase()}-${report.period.replace(/\s+/g, '-').toLowerCase()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ──────────────────────────────────────────────
   Simple horizontal bar (CSS only)
   ────────────────────────────────────────────── */
function HBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{ width: '100%', height: 6, background: '#F3F4F6', borderRadius: 3, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 600ms cubic-bezier(.4,0,.2,1)' }} />
    </div>
  );
}

/* ──────────────────────────────────────────────
   Vertical bar chart (CSS only)
   ────────────────────────────────────────────── */
function VBarChart({ data, color = 'var(--turmeric)', label }: { data: { label: string; value: number }[]; color?: string; label?: string }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div>
      {label && <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>{label}</div>}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 100 }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
            <div
              title={`${d.label}: ${formatCurrency(d.value)}`}
              style={{
                width: '100%', background: color, borderRadius: '4px 4px 0 0',
                height: `${Math.max((d.value / max) * 80, d.value > 0 ? 4 : 0)}px`,
                transition: 'height 600ms cubic-bezier(.4,0,.2,1)',
                minHeight: d.value > 0 ? 4 : 0,
              }}
            />
            <div style={{ fontSize: 9, color: 'var(--text-subtle)', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
              {d.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Summary Tile
   ────────────────────────────────────────────── */
function SummaryTile({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10,
      padding: '14px 16px', borderLeft: `4px solid ${color}`, boxShadow: 'var(--shadow-sm)'
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-muted)', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

/* ──────────────────────────────────────────────
   Main Component
   ────────────────────────────────────────────── */
export const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('mockups');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  const [pattis, setPattis] = useState<FarmerPatti[]>([]);
  const [invoices, setInvoices] = useState<BuyerInvoice[]>([]);
  const [stock, setStock] = useState<InventoryStock[]>([]);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingData, setSyncingData] = useState(false);

  // Mock reports filters & modal
  const [mockSearch, setMockSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeModalReport, setActiveModalReport] = useState<MockReport | null>(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      // Ensure 10 mock records exist in DB
      await ensure10MockRecords();
      const [p, i, s, f, b] = await Promise.all([
        getFarmerPattis(), getBuyerInvoices(), getInventoryStock(), getAllFarmers(), getAllBuyers()
      ]);
      setPattis(p); setInvoices(i); setStock(s); setFarmers(f); setBuyers(b);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const handleSyncMockData = async () => {
    setSyncingData(true);
    try {
      await ensure10MockRecords(true);
      await loadAll();
      toast.success('Successfully synchronized 10 mock reports and database records!');
    } catch (e) {
      toast.error('Failed to sync mock data');
    } finally {
      setSyncingData(false);
    }
  };

  /* ── Daily Report ── */
  const dPattis = useMemo(() => pattis.filter(p => p.date?.startsWith(date)), [pattis, date]);
  const dInvoices = useMemo(() => invoices.filter(i => i.date?.startsWith(date)), [invoices, date]);
  const dPurchase = useMemo(() => dPattis.reduce((s, p) => s + (p.netAmount || p.pattiAmount || 0), 0), [dPattis]);
  const dSales = useMemo(() => dInvoices.reduce((s, i) => s + (i.netAmount || 0), 0), [dInvoices]);

  /* ── Monthly chart data (last 12 months) ── */
  const monthlyData = useMemo(() => {
    const months: { label: string; purchase: number; sales: number }[] = [];
    for (let m = 11; m >= 0; m--) {
      const d = new Date();
      d.setMonth(d.getMonth() - m);
      const prefix = d.toISOString().slice(0, 7);
      const label = d.toLocaleString('en-IN', { month: 'short' });
      const purchase = pattis.filter(p => p.date?.startsWith(prefix)).reduce((s, p) => s + (p.netAmount || p.pattiAmount || 0), 0);
      const sales = invoices.filter(i => i.date?.startsWith(prefix)).reduce((s, i) => s + (i.netAmount || 0), 0);
      months.push({ label, purchase, sales });
    }
    return months;
  }, [pattis, invoices]);

  /* ── Farmer Report ── */
  const farmerReport = useMemo(() => {
    const map: Record<string, { name: string; village: string; totalBags: number; totalWeight: number; totalPurchase: number; pattiCount: number }> = {};
    pattis
      .filter(p => !month || p.date?.startsWith(month))
      .forEach(p => {
        const key = String(p.farmerId);
        if (!map[key]) map[key] = { name: p.farmerName, village: p.village, totalBags: 0, totalWeight: 0, totalPurchase: 0, pattiCount: 0 };
        map[key].totalBags += p.totalBags || 0;
        map[key].totalWeight += p.totalWeight || 0;
        map[key].totalPurchase += p.netAmount || p.pattiAmount || 0;
        map[key].pattiCount++;
      });
    return Object.values(map).sort((a, b) => b.totalPurchase - a.totalPurchase);
  }, [pattis, month]);

  /* ── Buyer Report ── */
  const buyerReport = useMemo(() => {
    const map: Record<string, { name: string; totalBags: number; totalWeight: number; totalSales: number; invoiceCount: number }> = {};
    invoices
      .filter(i => !month || i.date?.startsWith(month))
      .forEach(i => {
        const key = String(i.buyerId);
        if (!map[key]) map[key] = { name: i.buyerName, totalBags: 0, totalWeight: 0, totalSales: 0, invoiceCount: 0 };
        map[key].totalBags += i.totalBags || 0;
        map[key].totalWeight += i.totalWeight || 0;
        map[key].totalSales += i.netAmount || 0;
        map[key].invoiceCount++;
      });
    return Object.values(map).sort((a, b) => b.totalSales - a.totalSales);
  }, [invoices, month]);

  const maxFarmer = farmerReport[0]?.totalPurchase || 1;
  const maxBuyer = buyerReport[0]?.totalSales || 1;

  // Filtered 10 Mock Reports
  const filteredMockReports = useMemo(() => {
    return MOCK_REPORTS.filter(r => {
      const matchCat = selectedCategory === 'All' || r.category === selectedCategory;
      const q = mockSearch.trim().toLowerCase();
      const matchSearch = !q ||
        r.title.toLowerCase().includes(q) ||
        r.code.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.summary.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [mockSearch, selectedCategory]);

  const categories = useMemo(() => {
    return ['All', ...Array.from(new Set(MOCK_REPORTS.map(r => r.category)))];
  }, []);

  const TABS = [
    { key: 'mockups', icon: FileSpreadsheet, label: 'Mockup Reports (10)' },
    { key: 'daily', icon: Calendar, label: 'Daily' },
    { key: 'monthly', icon: BarChart2, label: 'Monthly' },
    { key: 'farmer', icon: Users, label: 'Farmer' },
    { key: 'buyer', icon: Building2, label: 'Buyer' },
    { key: 'inventory', icon: Package, label: 'Inventory' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: '-0.4px', color: '#111827' }}>Reports & Audit Portal</h1>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 9999, background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' }}>
                  Admin: Yashraj Alurkur
                </span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                10 Official Mockup Reports · {pattis.length} pattis · {invoices.length} invoices · {farmers.length} farmers · {buyers.length} buyers
              </div>
            </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleSyncMockData}
                  disabled={syncingData}
                  title="Ensure all 10 mock transactions and records are populated in database"
                >
                  <Database size={13} className={syncingData ? 'animate-spin' : ''} />
                  {syncingData ? 'Syncing...' : 'Sync Mock Data'}
                </button>
                <button className="btn btn-secondary btn-sm" onClick={loadAll} disabled={loading} id="refresh-reports-btn">
                  <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                  Refresh
                </button>
                <button className="btn btn-secondary btn-sm no-print" onClick={() => window.print()} id="print-report-btn">
                  <Printer size={13} />
                  Print
                </button>
              </div>
            </div>

            <div className="card" style={{ overflow: 'hidden' }}>
              {/* Tabs */}
                <div className="tabs" style={{ padding: '0 16px', borderBottom: '1px solid var(--border)', display: 'flex', overflowX: 'auto' }}>
                  {TABS.map(t => {
                    const Icon = t.icon;
                    return (
              <button
                key={t.key}
                className={`tab-btn${activeTab === t.key ? ' active' : ''}`}
                onClick={() => setActiveTab(t.key)}
                id={`tab-report-${t.key}`}
                style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
              >
                <Icon size={14} />
                {t.label}
              </button>
            );
          })}
        </div>

        <div style={{ padding: 20 }}>
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 40, borderRadius: 8 }} />
              ))}
            </div>
          )}

          {!loading && (
            <>
              {/* ──────────────────────────────────────────────
                  MOCKUP REPORTS (10) TAB
                  ────────────────────────────────────────────── */}
              {activeTab === 'mockups' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {/* Top Banner */}
                  <div style={{
                    background: 'linear-gradient(135deg, #1C1810 0%, #2B2313 100%)',
                    borderRadius: 14, padding: '18px 22px', color: '#FFF',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    flexWrap: 'wrap', gap: 16, border: '1px solid #3D321D',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.12)'
                  }}>
                    <div style={{ maxWidth: 540 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ background: '#C8920A', color: '#FFF', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, letterSpacing: 0.5 }}>
                          APMC SANGLI COMPLIANT
                        </span>
                        <span style={{ fontSize: 12, color: '#E5C07B', fontWeight: 600 }}>
                          Proprietor / Admin: Yashraj Alurkur
                        </span>
                      </div>
                      <h2 style={{ fontSize: 18, fontWeight: 700, margin: '4px 0 6px 0', letterSpacing: '-0.3px' }}>
                        10 Pre-Generated Mockup Reports & Audit Dossiers
                      </h2>
                      <p style={{ fontSize: 12, color: '#D1D5DB', margin: 0, lineHeight: 1.5 }}>
                        Complete operational, statutory GST, APMC Cess, Farmer Settlement, Quality Dispersion, and Treasury Reconciliation reports calibrated for TurmaBill trading operations.
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 14px', minWidth: 100, textAlign: 'center' }}>
                        <div style={{ fontSize: 11, color: '#9CA3AF' }}>Total Reports</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: '#F0C44B' }}>{MOCK_REPORTS.length}</div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 14px', minWidth: 100, textAlign: 'center' }}>
                        <div style={{ fontSize: 11, color: '#9CA3AF' }}>Audit Status</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: '#34D399' }}>10/10</div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 14px', minWidth: 120, textAlign: 'center' }}>
                        <div style={{ fontSize: 11, color: '#9CA3AF' }}>Mandi License</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#FFF', marginTop: 4 }}>MH-SANGLI-2026</div>
                      </div>
                    </div>
                  </div>

                  {/* Filter and Search Bar */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                      <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
                        <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                        <input
                          type="text"
                          value={mockSearch}
                          onChange={e => setMockSearch(e.target.value)}
                          placeholder="Search 10 reports by code, title, category, or keyword..."
                          className="form-input"
                          style={{ paddingLeft: 34, height: 38, width: '100%', borderRadius: 8 }}
                        />
                        {mockSearch && (
                          <button
                            onClick={() => setMockSearch('')}
                            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>

                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          // Bulk export all 10 reports
                          MOCK_REPORTS.forEach(r => exportMockReportToCSV(r));
                          toast.success('Downloaded CSV files for all 10 mockup reports');
                        }}
                        style={{ height: 38, display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        <Download size={14} />
                        Export All 10 Reports (CSV)
                      </button>
                    </div>

                    {/* Category Pill Filters */}
                    <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
                      {categories.map(cat => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          style={{
                            padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                            border: '1px solid', cursor: 'pointer', transition: 'all 0.15s ease',
                            background: selectedCategory === cat ? 'var(--turmeric)' : '#F9FAFB',
                            borderColor: selectedCategory === cat ? 'var(--turmeric-dark)' : '#E5E7EB',
                            color: selectedCategory === cat ? '#FFF' : '#4B5563',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {cat} {cat === 'All' ? `(${MOCK_REPORTS.length})` : ''}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Reports Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
                    {filteredMockReports.map(report => (
                      <div
                        key={report.id}
                        style={{
                          background: '#FFF', border: '1px solid #E5E7EB', borderRadius: 12,
                          padding: '16px 18px', display: 'flex', flexDirection: 'column',
                          justifyContent: 'space-between', gap: 14,
                          boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                        }}
                        className="hover:shadow-md hover:-translate-y-0.5"
                      >
                        <div>
                          {/* Card Top badges */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, gap: 8 }}>
                            <span style={{
                              fontFamily: 'monospace', fontSize: 11, fontWeight: 700,
                              background: '#F3F4F6', color: '#1F2937', padding: '2px 8px',
                              borderRadius: 4, border: '1px solid #E5E7EB'
                            }}>
                              {report.code}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{
                                fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 9999,
                                background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #DBEAFE'
                              }}>
                                {report.category}
                              </span>
                              <span style={{
                                fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 9999,
                                background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0',
                                display: 'inline-flex', alignItems: 'center', gap: 3
                              }}>
                                <Check size={10} />
                                {report.status}
                              </span>
                            </div>
                          </div>

                          {/* Title & Period */}
                          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: '0 0 4px 0', lineHeight: 1.35 }}>
                            {report.title}
                          </h3>
                          <div style={{ fontSize: 11, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                            <span>Period: <strong>{report.period}</strong></span>
                            <span>•</span>
                            <span>Author: <strong style={{ color: '#92400E' }}>{report.author}</strong></span>
                          </div>

                          <p style={{ fontSize: 12, color: '#4B5563', margin: '0 0 12px 0', lineHeight: 1.45 }}>
                            {report.summary}
                          </p>

                          {/* Metrics preview */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, background: '#F9FAFB', padding: '10px 12px', borderRadius: 8, border: '1px solid #F3F4F6' }}>
                            {report.metrics.slice(0, 2).map((m, idx) => (
                              <div key={idx}>
                                <div style={{ fontSize: 10, color: '#6B7280', fontWeight: 600, textTransform: 'uppercase' }}>{m.label}</div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: m.color }}>{m.value}</div>
                                {m.sub && <div style={{ fontSize: 10, color: '#9CA3AF' }}>{m.sub}</div>}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: 8, paddingTop: 12, borderTop: '1px solid #F3F4F6' }}>
                          <button
                            onClick={() => setActiveModalReport(report)}
                            className="btn btn-primary btn-sm"
                            style={{ flex: 1, justifyContent: 'center', gap: 6 }}
                          >
                            <Eye size={13} />
                            View Full Report
                          </button>
                          <button
                            onClick={() => {
                              exportMockReportToCSV(report);
                              toast.success(`Exported ${report.code} to CSV`);
                            }}
                            className="btn btn-secondary btn-sm"
                            title="Download CSV dataset"
                            style={{ padding: '0 10px' }}
                          >
                            <Download size={13} />
                          </button>
                          <button
                            onClick={() => {
                              setActiveModalReport(report);
                              setTimeout(() => window.print(), 200);
                            }}
                            className="btn btn-secondary btn-sm"
                            title="Print this report"
                            style={{ padding: '0 10px' }}
                          >
                            <Printer size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {filteredMockReports.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '48px 20px', color: '#6B7280', background: '#F9FAFB', borderRadius: 12 }}>
                      <FileText size={32} style={{ margin: '0 auto 12px auto', opacity: 0.4 }} />
                      <div style={{ fontSize: 14, fontWeight: 600 }}>No reports matched your search or category</div>
                      <button
                        onClick={() => { setMockSearch(''); setSelectedCategory('All'); }}
                        className="btn btn-secondary btn-sm"
                        style={{ marginTop: 12 }}
                      >
                        Reset Filters
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ──────────────────────────────────────────────
                  DAILY REPORT TAB
                  ────────────────────────────────────────────── */}
              {activeTab === 'daily' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="form-input" style={{ width: 160 }} id="daily-date-picker" />
                    <button className="btn btn-secondary btn-sm" onClick={() => exportToCSV(dPattis.map(p => ({ 'Patti No': p.pattiNo, 'Date': p.date, 'Farmer': p.farmerName, 'Amount': p.netAmount || p.pattiAmount })), `daily-pattis-${date}.csv`)} id="export-pattis-btn">
                      <Download size={13} /> Pattis CSV
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => exportToCSV(dInvoices.map(i => ({ 'Invoice No': i.invoiceNo, 'Date': i.date, 'Buyer': i.buyerName, 'Amount': i.netAmount })), `daily-invoices-${date}.csv`)} id="export-invoices-btn">
                      <Download size={13} /> Invoices CSV
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
                    <SummaryTile label="Pattis Today" value={dPattis.length} color="#7C3AED" />
                    <SummaryTile label="Invoices Today" value={dInvoices.length} color="#2563EB" />
                    <SummaryTile label="Purchase Value" value={formatCurrency(dPurchase)} sub="from pattis" color="#16A34A" />
                    <SummaryTile label="Sales Value" value={formatCurrency(dSales)} sub="from invoices" color="var(--turmeric)" />
                    <SummaryTile label="Net P&L" value={formatCurrency(dSales - dPurchase)} sub={dSales >= dPurchase ? '↑ Profitable' : '↓ Loss'} color={dSales >= dPurchase ? '#16A34A' : 'var(--red)'} />
                  </div>
                  {dPattis.length === 0 && dInvoices.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: 13 }}>
                      No transactions recorded on {formatDate(date)}. Use date picker or click "Sync Mock Data" to populate mock dates.
                    </div>
                  )}
                  {dPattis.length > 0 && (
                    <>
                      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: -8 }}>Pattis for {formatDate(date)}</div>
                      <table className="data-table">
                        <thead><tr><th>Patti #</th><th>Farmer</th><th>Bags</th><th>Weight</th><th className="text-right">Net Amount</th></tr></thead>
                        <tbody>
                          {dPattis.map(p => <tr key={p.id}><td>#{p.pattiNo}</td><td>{p.farmerName}</td><td>{p.totalBags}</td><td>{p.totalWeight?.toFixed(2)} kg</td><td className="text-right font-semibold">{formatCurrency(p.netAmount || p.pattiAmount || 0)}</td></tr>)}
                        </tbody>
                      </table>
                    </>
                  )}
                  {dInvoices.length > 0 && (
                    <>
                      <div style={{ fontWeight: 600, fontSize: 13, marginTop: 12, marginBottom: -8 }}>Invoices for {formatDate(date)}</div>
                      <table className="data-table">
                        <thead><tr><th>Invoice #</th><th>Buyer</th><th>Bags</th><th>Weight</th><th className="text-right">Net Amount</th></tr></thead>
                        <tbody>
                          {dInvoices.map(i => <tr key={i.id}><td>#{i.invoiceNo}</td><td>{i.buyerName}</td><td>{i.totalBags}</td><td>{i.totalWeight?.toFixed(2)} kg</td><td className="text-right font-semibold">{formatCurrency(i.netAmount || 0)}</td></tr>)}
                        </tbody>
                      </table>
                    </>
                  )}
                </div>
              )}

              {/* ──────────────────────────────────────────────
                  MONTHLY REPORT TAB
                  ────────────────────────────────────────────── */}
              {activeTab === 'monthly' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div className="card" style={{ padding: 16 }}>
                      <VBarChart data={monthlyData.map(m => ({ label: m.label, value: m.purchase }))} color="#16A34A" label="Monthly Purchase (₹)" />
                    </div>
                    <div className="card" style={{ padding: 16 }}>
                      <VBarChart data={monthlyData.map(m => ({ label: m.label, value: m.sales }))} color="var(--turmeric)" label="Monthly Sales (₹)" />
                    </div>
                  </div>
                  <table className="data-table" style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                    <thead>
                      <tr><th>Month</th><th className="text-right">Purchase</th><th className="text-right">Sales</th><th className="text-right">Profit/Loss</th></tr>
                    </thead>
                    <tbody>
                      {monthlyData.map((m, i) => {
                        const pl = m.sales - m.purchase;
                        return (
                          <tr key={i}>
                            <td style={{ fontWeight: 500 }}>{m.label}</td>
                            <td className="text-right" style={{ color: '#16A34A' }}>{formatCurrency(m.purchase)}</td>
                            <td className="text-right" style={{ color: 'var(--turmeric-dark)' }}>{formatCurrency(m.sales)}</td>
                            <td className="text-right" style={{ fontWeight: 600, color: pl >= 0 ? '#16A34A' : 'var(--red)' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                {pl >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                                {formatCurrency(Math.abs(pl))}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ──────────────────────────────────────────────
                  FARMER REPORT TAB
                  ────────────────────────────────────────────── */}
              {activeTab === 'farmer' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Month:</div>
                    <input type="month" value={month} onChange={e => setMonth(e.target.value)} className="form-input" style={{ width: 160 }} id="farmer-month-picker" />
                    <button className="btn btn-secondary btn-sm" onClick={() => exportToCSV(farmerReport, `farmer-report-${month}.csv`)} id="export-farmer-btn">
                      <Download size={13} /> Export CSV
                    </button>
                  </div>
                  {farmerReport.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No farmer transactions for month {month}</div>
                  ) : (
                    <table className="data-table">
                      <thead><tr><th>#</th><th>Farmer</th><th>Village</th><th className="text-right">Pattis</th><th className="text-right">Bags</th><th className="text-right">Weight (kg)</th><th className="text-right">Total Purchase</th><th>Share</th></tr></thead>
                      <tbody>
                        {farmerReport.map((f, i) => (
                          <tr key={i}>
                            <td style={{ color: 'var(--text-subtle)', fontWeight: 600 }}>{i + 1}</td>
                            <td style={{ fontWeight: 600 }}>{f.name}</td>
                            <td style={{ color: 'var(--text-muted)' }}>{f.village}</td>
                            <td className="text-right">{f.pattiCount}</td>
                            <td className="text-right">{f.totalBags}</td>
                            <td className="text-right">{f.totalWeight.toFixed(2)}</td>
                            <td className="text-right font-semibold">{formatCurrency(f.totalPurchase)}</td>
                            <td style={{ width: 120 }}><HBar value={f.totalPurchase} max={maxFarmer} color="#16A34A" /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* ──────────────────────────────────────────────
                  BUYER REPORT TAB
                  ────────────────────────────────────────────── */}
              {activeTab === 'buyer' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Month:</div>
                    <input type="month" value={month} onChange={e => setMonth(e.target.value)} className="form-input" style={{ width: 160 }} id="buyer-month-picker" />
                    <button className="btn btn-secondary btn-sm" onClick={() => exportToCSV(buyerReport, `buyer-report-${month}.csv`)} id="export-buyer-btn">
                      <Download size={13} /> Export CSV
                    </button>
                  </div>
                  {buyerReport.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No buyer transactions for month {month}</div>
                  ) : (
                    <table className="data-table">
                      <thead><tr><th>#</th><th>Buyer</th><th className="text-right">Invoices</th><th className="text-right">Bags</th><th className="text-right">Weight (kg)</th><th className="text-right">Total Sales</th><th>Share</th></tr></thead>
                      <tbody>
                        {buyerReport.map((b, i) => (
                          <tr key={i}>
                            <td style={{ color: 'var(--text-subtle)', fontWeight: 600 }}>{i + 1}</td>
                            <td style={{ fontWeight: 600 }}>{b.name}</td>
                            <td className="text-right">{b.invoiceCount}</td>
                            <td className="text-right">{b.totalBags}</td>
                            <td className="text-right">{b.totalWeight.toFixed(2)}</td>
                            <td className="text-right font-semibold">{formatCurrency(b.totalSales)}</td>
                            <td style={{ width: 120 }}><HBar value={b.totalSales} max={maxBuyer} color="var(--turmeric)" /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* ──────────────────────────────────────────────
                  INVENTORY REPORT TAB
                  ────────────────────────────────────────────── */}
              {activeTab === 'inventory' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => exportToCSV(stock.map(s => ({
                      Product: s.productName,
                      'Opening Bags': s.openingBags, 'Opening Weight (kg)': s.openingWeight,
                      'Purchased Bags': s.purchasedBags, 'Purchased Weight (kg)': s.purchasedWeight,
                      'Sold Bags': s.soldBags, 'Sold Weight (kg)': s.soldWeight,
                      'Current Bags': s.currentBags, 'Current Weight (kg)': s.currentWeight,
                      'Est. Value (₹)': s.stockValue,
                    })), 'inventory-report.csv')} id="export-inventory-btn">
                      <Download size={13} /> Export CSV
                    </button>
                  </div>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th className="text-right">Opening</th>
                        <th className="text-right">Purchased</th>
                        <th className="text-right">Sold</th>
                        <th className="text-right">Current Bags</th>
                        <th className="text-right">Current Weight</th>
                        <th className="text-right">Est. Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stock.length === 0 ? (
                        <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No inventory data</td></tr>
                      ) : stock.map((s, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 600 }}>{s.productName}</td>
                          <td className="text-right" style={{ color: 'var(--text-muted)', fontSize: 12 }}>{s.openingBags}b</td>
                          <td className="text-right" style={{ color: '#16A34A' }}>+{s.purchasedBags}b</td>
                          <td className="text-right" style={{ color: 'var(--red)' }}>-{s.soldBags}b</td>
                          <td className="text-right font-bold" style={{ color: (s.currentBags || 0) < 0 ? 'var(--red)' : 'var(--text)' }}>{s.currentBags}</td>
                          <td className="text-right">{s.currentWeight?.toFixed(2)} kg</td>
                          <td className="text-right font-semibold">{formatCurrency(s.stockValue || 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>

                {/* ──────────────────────────────────────────────
          INTERACTIVE REPORT DETAIL MODAL
          ────────────────────────────────────────────── */}
                {activeModalReport && (
                  <div
                    style={{
                      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
                      backdropFilter: 'blur(3px)'
                    }}
                    onClick={() => setActiveModalReport(null)}
                  >
                    <div
                      style={{
                        background: '#FFF', borderRadius: 16, maxWidth: 840, width: '100%',
                        maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.25)', border: '1px solid #E5E7EB'
                      }}
                      onClick={e => e.stopPropagation()}
                    >
                      {/* Modal Header */}
                      <div style={{
                        padding: '16px 20px', borderBottom: '1px solid #E5E7EB', display: 'flex',
                        alignItems: 'center', justifyContent: 'space-between', background: '#F9FAFB'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: 8, background: '#FEF3C7',
                            color: '#92400E', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 800, fontSize: 14, border: '1px solid #FDE68A'
                          }}>
                            TB
                          </div>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#C8920A', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                              Sangli Krushi Utpanna Bazar Samiti · Yard 135
                            </div>
                            <h2 style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: 0 }}>
                              {activeModalReport.title}
                            </h2>
                          </div>
                        </div>
                        <button
                          onClick={() => setActiveModalReport(null)}
                          style={{
                            width: 32, height: 32, borderRadius: 8, border: '1px solid #E5E7EB',
                            background: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', color: '#6B7280'
                          }}
                        >
                          <X size={16} />
                        </button>
                      </div>

                      {/* Modal Body */}
                      <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 18 }}>
                        {/* Meta row */}
                        <div style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          flexWrap: 'wrap', gap: 10, padding: '10px 14px', background: '#F8FAFC',
                          borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12
                        }}>
                          <div><strong>Report Code:</strong> <span style={{ fontFamily: 'monospace' }}>{activeModalReport.code}</span></div>
                          <div><strong>Period:</strong> {activeModalReport.period}</div>
                          <div><strong>Certified By:</strong> <span style={{ color: '#C8920A', fontWeight: 700 }}>{activeModalReport.author}</span></div>
                          <div>
                            <span style={{
                              fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 9999,
                              background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0'
                            }}>
                              {activeModalReport.status}
                            </span>
                          </div>
                        </div>

                        {/* Summary Statement */}
                        <p style={{ fontSize: 13, color: '#374151', margin: 0, lineHeight: 1.5 }}>
                          {activeModalReport.summary}
                        </p>

                        {/* KPI Cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
                          {activeModalReport.metrics.map((m, idx) => (
                            <div key={idx} style={{
                              padding: '12px 14px', borderRadius: 10, background: '#FFF',
                              border: '1px solid #E5E7EB', borderLeft: `4px solid ${m.color}`,
                              boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                            }}>
                              <div style={{ fontSize: 10, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>{m.label}</div>
                              <div style={{ fontSize: 16, fontWeight: 800, color: '#111827', marginTop: 2 }}>{m.value}</div>
                              {m.sub && <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 1 }}>{m.sub}</div>}
                            </div>
                          ))}
                        </div>

                        {/* Data Table */}
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#111827', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                            Itemized Report Breakdown
                          </div>
                          <div style={{ overflowX: 'auto', border: '1px solid #E5E7EB', borderRadius: 8 }}>
                            <table className="data-table" style={{ margin: 0 }}>
                              <thead style={{ background: '#F9FAFB' }}>
                                <tr>
                                  {activeModalReport.tableHeaders.map((h, idx) => (
                                    <th key={idx} style={{ fontSize: 11, padding: '8px 12px', whiteSpace: 'nowrap' }}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {activeModalReport.tableRows.map((row, rIdx) => (
                                  <tr key={rIdx} style={{ background: rIdx % 2 === 0 ? '#FFF' : '#FAFAFA' }}>
                                    {row.map((cell, cIdx) => (
                                      <td key={cIdx} style={{ fontSize: 12, padding: '8px 12px', whiteSpace: 'nowrap' }}>
                                        {cell}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Audit & Compliance remarks */}
                        <div style={{ background: '#FEF9C3', borderRadius: 10, padding: '14px 16px', border: '1px solid #FDE047' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#854D0E', marginBottom: 6 }}>
                            <ShieldCheck size={16} />
                            Statutory & Compliance Certification Remarks
                          </div>
                          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 11, color: '#713F12', lineHeight: 1.6 }}>
                            {activeModalReport.auditNotes.map((note, idx) => (
                              <li key={idx}>{note}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Modal Footer */}
                      <div style={{
                        padding: '14px 20px', borderTop: '1px solid #E5E7EB', display: 'flex',
                        alignItems: 'center', justifyContent: 'space-between', background: '#F9FAFB',
                        borderRadius: '0 0 16px 16px'
                      }}>
                        <div style={{ fontSize: 11, color: '#6B7280' }}>
                          Digitally stamped by <strong>Yashraj Alurkur</strong> on {activeModalReport.generatedDate}
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => exportMockReportToCSV(activeModalReport)}
                          >
                            <Download size={13} />
                            Download CSV
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => window.print()}
                          >
                            <Printer size={13} />
                            Print Report
                          </button>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => setActiveModalReport(null)}
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <style>{`@media print { .no-print { display: none !important; } }`}</style>
              </div>
              );
};
