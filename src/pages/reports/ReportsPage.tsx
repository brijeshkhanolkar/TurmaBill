import React, { useState, useEffect, useMemo } from 'react';
import { Download, Printer, BarChart2, Calendar, Users, Building2, Package, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { getFarmerPattis, getBuyerInvoices, getInventoryStock, getAllFarmers, getAllBuyers } from '../../database/services';
import { formatCurrency, formatDate } from '../../utils/formatters';
import type { FarmerPatti, BuyerInvoice, Farmer, Buyer, InventoryStock } from '../../types';

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
  const [activeTab, setActiveTab] = useState('daily');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  const [pattis, setPattis]     = useState<FarmerPatti[]>([]);
  const [invoices, setInvoices] = useState<BuyerInvoice[]>([]);
  const [stock, setStock]       = useState<InventoryStock[]>([]);
  const [farmers, setFarmers]   = useState<Farmer[]>([]);
  const [buyers, setBuyers]     = useState<Buyer[]>([]);
  const [loading, setLoading]   = useState(true);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [p, i, s, f, b] = await Promise.all([
        getFarmerPattis(), getBuyerInvoices(), getInventoryStock(), getAllFarmers(), getAllBuyers()
      ]);
      setPattis(p); setInvoices(i); setStock(s); setFarmers(f); setBuyers(b);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  /* ── Daily Report ── */
  const dPattis   = useMemo(() => pattis.filter(p => p.date?.startsWith(date)), [pattis, date]);
  const dInvoices = useMemo(() => invoices.filter(i => i.date?.startsWith(date)), [invoices, date]);
  const dPurchase = useMemo(() => dPattis.reduce((s, p) => s + (p.netAmount || p.pattiAmount || 0), 0), [dPattis]);
  const dSales    = useMemo(() => dInvoices.reduce((s, i) => s + (i.netAmount || 0), 0), [dInvoices]);

  /* ── Monthly chart data (last 12 months) ── */
  const monthlyData = useMemo(() => {
    const months: { label: string; purchase: number; sales: number }[] = [];
    for (let m = 11; m >= 0; m--) {
      const d = new Date();
      d.setMonth(d.getMonth() - m);
      const prefix = d.toISOString().slice(0, 7);
      const label = d.toLocaleString('en-IN', { month: 'short' });
      const purchase = pattis.filter(p => p.date?.startsWith(prefix)).reduce((s, p) => s + (p.netAmount || p.pattiAmount || 0), 0);
      const sales    = invoices.filter(i => i.date?.startsWith(prefix)).reduce((s, i) => s + (i.netAmount || 0), 0);
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
        map[key].totalBags   += p.totalBags || 0;
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
        map[key].totalBags   += i.totalBags || 0;
        map[key].totalWeight += i.totalWeight || 0;
        map[key].totalSales  += i.netAmount || 0;
        map[key].invoiceCount++;
      });
    return Object.values(map).sort((a, b) => b.totalSales - a.totalSales);
  }, [invoices, month]);

  const maxFarmer = farmerReport[0]?.totalPurchase || 1;
  const maxBuyer  = buyerReport[0]?.totalSales || 1;

  const TABS = [
    { key: 'daily',     icon: Calendar,   label: 'Daily' },
    { key: 'monthly',   icon: BarChart2,   label: 'Monthly' },
    { key: 'farmer',    icon: Users,       label: 'Farmer' },
    { key: 'buyer',     icon: Building2,   label: 'Buyer' },
    { key: 'inventory', icon: Package,     label: 'Inventory' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 19, fontWeight: 700, letterSpacing: '-0.4px' }}>Reports</h1>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            {pattis.length} pattis · {invoices.length} invoices · {farmers.length} farmers · {buyers.length} buyers
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
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
        <div className="tabs" style={{ padding: '0 16px', borderBottom: '1px solid var(--border)' }}>
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.key} className={`tab-btn${activeTab === t.key ? ' active' : ''}`}
                onClick={() => setActiveTab(t.key)} id={`tab-report-${t.key}`}>
                <Icon size={13} />{t.label}
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
              {/* ── DAILY ── */}
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
                      No transactions on {formatDate(date)}
                    </div>
                  )}
                  {dPattis.length > 0 && (
                    <>
                      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: -8 }}>Today's Pattis</div>
                      <table className="data-table">
                        <thead><tr><th>Patti #</th><th>Farmer</th><th>Bags</th><th>Weight</th><th className="text-right">Net Amount</th></tr></thead>
                        <tbody>
                          {dPattis.map(p => <tr key={p.id}><td>#{p.pattiNo}</td><td>{p.farmerName}</td><td>{p.totalBags}</td><td>{p.totalWeight?.toFixed(2)} kg</td><td className="text-right font-semibold">{formatCurrency(p.netAmount || p.pattiAmount || 0)}</td></tr>)}
                        </tbody>
                      </table>
                    </>
                  )}
                </div>
              )}

              {/* ── MONTHLY ── */}
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

              {/* ── FARMER REPORT ── */}
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
                    <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No farmer data for this month</div>
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

              {/* ── BUYER REPORT ── */}
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
                    <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No buyer data for this month</div>
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

              {/* ── INVENTORY REPORT ── */}
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

      <style>{`@media print { .no-print { display: none !important; } }`}</style>
    </div>
  );
};
