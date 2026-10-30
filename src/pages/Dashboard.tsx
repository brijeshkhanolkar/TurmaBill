import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Activity, ShoppingCart, Package, FileText, Plus,
  Eye, TrendingUp, TrendingDown, RefreshCw, ArrowRight,
  Wheat, Receipt, Users, Building2
} from 'lucide-react';
import {
  getAllAwaks, getAllBuyerInvoices, getInventoryStock, getAllFarmerPattis, getAllFarmers, getAllBuyers
} from '../database/services';
import type { Awak, BuyerInvoice, InventoryStock } from '../types';
import { formatCurrency, formatDate, formatWeight, getTodayString } from '../utils/formatters';

/* ──────────────────────────────────────────────
   Tiny bar-chart rendered with pure div/CSS
   ────────────────────────────────────────────── */
function MiniBar({ data, color = 'var(--turmeric)' }: { data: number[]; color?: string }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 32 }}>
      {data.map((v, i) => (
        <div
          key={i}
          title={`₹${v.toLocaleString('en-IN')}`}
          style={{
            flex: 1,
            height: `${Math.max((v / max) * 100, 4)}%`,
            background: color,
            borderRadius: 3,
            opacity: i === data.length - 1 ? 1 : 0.4 + (i / data.length) * 0.5,
            transition: 'height 600ms cubic-bezier(.4,0,.2,1)',
          }}
        />
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────────
   Stat Card
   ────────────────────────────────────────────── */
interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  accentColor: string;
  trend?: number; // % change (positive = up, negative = down)
  sparkData?: number[];
}
function StatCard({ label, value, sub, icon: Icon, accentColor, trend, sparkData }: StatCardProps) {
  return (
    <div className="stat-card" style={{ '--accent-color': accentColor } as React.CSSProperties}>
      <div className="stat-label">
        <Icon size={13} style={{ color: accentColor }} />
        {label}
      </div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
        {trend !== undefined && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 600, color: trend >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {trend >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {Math.abs(trend).toFixed(0)}% vs yesterday
          </div>
        )}
        {sparkData && sparkData.length > 0 && (
          <div style={{ flex: 1, marginLeft: trend !== undefined ? 8 : 0 }}>
            <MiniBar data={sparkData} color={accentColor} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Skeleton Row
   ────────────────────────────────────────────── */
function SkeletonRow({ cols = 8 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} style={{ padding: '10px 12px' }}>
          <div className="skeleton" style={{ height: 13, width: i === 0 ? 60 : i % 2 === 0 ? '80%' : '60%' }} />
        </td>
      ))}
    </tr>
  );
}

/* ──────────────────────────────────────────────
   Quick Action
   ────────────────────────────────────────────── */
function QuickAction({ icon, label, color, onClick }: { icon: React.ReactNode; label: string; color: string; onClick: () => void }) {
  return (
    <button
      className="quick-action-card"
      onClick={onClick}
      style={{ minWidth: 100 }}
    >
      <div className="quick-action-icon" style={{ background: color + '18' }}>
        {icon}
      </div>
      <div className="quick-action-label">{label}</div>
    </button>
  );
}

/* ──────────────────────────────────────────────
   Main Component
   ────────────────────────────────────────────── */
export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recentAwaks, setRecentAwaks] = useState<Awak[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<BuyerInvoice[]>([]);

  const [stats, setStats] = useState({
    todayTransactions: 0,
    todayPurchase: 0,
    todaySales: 0,
    currentStockBags: 0,
    totalFarmers: 0,
    totalBuyers: 0,
    pendingPattis: 0,
  });

  // 7-day sparkline data
  const [sparkPurchase, setSparkPurchase] = useState<number[]>([]);
  const [sparkSales, setSparkSales]     = useState<number[]>([]);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const today = getTodayString();
      const [awaks, invoices, stock, farmers, buyers] = await Promise.all([
        getAllAwaks(),
        getAllBuyerInvoices(),
        getInventoryStock(),
        getAllFarmers(),
        getAllBuyers(),
      ]);

      const todayAwaks    = awaks.filter(a => a.awakDate === today);
      const todayInvoices = invoices.filter(i => i.date === today);

      const todayPurchase = todayAwaks.reduce((s, a) =>
        s + (a.items?.reduce((ss, item) => ss + (item.amount || 0), 0) || 0), 0);
      const todaySales = todayInvoices.reduce((s, i) => s + (i.totalAmount || i.netAmount || 0), 0);
      const stockBags  = stock.reduce((s, st) => s + (st.currentBags || 0), 0);

      setStats({
        todayTransactions: todayAwaks.length + todayInvoices.length,
        todayPurchase,
        todaySales,
        currentStockBags: stockBags,
        totalFarmers: farmers.length,
        totalBuyers: buyers.length,
        pendingPattis: 0,
      });

      // 7-day sparklines
      const dayPurchase: number[] = [];
      const daySales: number[] = [];
      for (let d = 6; d >= 0; d--) {
        const dt = new Date(); dt.setDate(dt.getDate() - d);
        const ds = dt.toISOString().split('T')[0];
        dayPurchase.push(awaks.filter(a => a.awakDate === ds).reduce((s, a) =>
          s + (a.items?.reduce((ss, i) => ss + (i.amount || 0), 0) || 0), 0));
        daySales.push(invoices.filter(i => i.date === ds).reduce((s, i) => s + (i.totalAmount || i.netAmount || 0), 0));
      }
      setSparkPurchase(dayPurchase);
      setSparkSales(daySales);

      // Recent records
      const sorted = [...awaks].sort((a, b) => (b.awakDate || '').localeCompare(a.awakDate || ''));
      setRecentAwaks(sorted.slice(0, 8));
      const sortedInv = [...invoices].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      setRecentInvoices(sortedInv.slice(0, 5));
    } catch (err) {
      console.error('Dashboard load error', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 19, fontWeight: 700, letterSpacing: '-0.4px', color: 'var(--text)' }}>
            Dashboard
          </h1>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            {formatDate(getTodayString())} · Welcome back 👋
          </div>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => load(true)}
          disabled={refreshing}
          id="refresh-dashboard-btn"
        >
          <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* ── Stats Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        <StatCard
          label="Today's Transactions"
          value={loading ? '—' : stats.todayTransactions}
          sub="awaks + invoices"
          icon={Activity}
          accentColor="#2563EB"
          sparkData={loading ? [] : [2, 4, 3, 5, 2, 4, stats.todayTransactions]}
        />
        <StatCard
          label="Today's Purchase"
          value={loading ? '—' : formatCurrency(stats.todayPurchase)}
          sub="from awaks"
          icon={TrendingUp}
          accentColor="#16A34A"
          sparkData={sparkPurchase}
        />
        <StatCard
          label="Today's Sales"
          value={loading ? '—' : formatCurrency(stats.todaySales)}
          sub="from invoices"
          icon={ShoppingCart}
          accentColor="#C8920A"
          sparkData={sparkSales}
        />
        <StatCard
          label="Current Stock"
          value={loading ? '—' : `${stats.currentStockBags} bags`}
          sub="across all products"
          icon={Package}
          accentColor="#7C3AED"
        />
        <StatCard
          label="Farmers"
          value={loading ? '—' : stats.totalFarmers}
          sub="registered"
          icon={Users}
          accentColor="#0891B2"
        />
        <StatCard
          label="Buyers"
          value={loading ? '—' : stats.totalBuyers}
          sub="registered"
          icon={Building2}
          accentColor="#DC2626"
        />
      </div>

      {/* ── Quick Actions ── */}
      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Quick Actions</div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <QuickAction icon={<Plus size={18} style={{ color: '#C8920A' }} />} label="New Transaction" color="#C8920A" onClick={() => navigate('/transactions/new')} />
          <QuickAction icon={<Wheat size={18} style={{ color: '#16A34A' }} />} label="New Awak" color="#16A34A" onClick={() => navigate('/awak/new')} />
          <QuickAction icon={<FileText size={18} style={{ color: '#7C3AED' }} />} label="Farmer Patti" color="#7C3AED" onClick={() => navigate('/farmer-patti')} />
          <QuickAction icon={<Receipt size={18} style={{ color: '#2563EB' }} />} label="Buyer Invoice" color="#2563EB" onClick={() => navigate('/buyer-invoice')} />
          <QuickAction icon={<Users size={18} style={{ color: '#0891B2' }} />} label="Add Farmer" color="#0891B2" onClick={() => navigate('/farmers/new')} />
          <QuickAction icon={<Building2 size={18} style={{ color: '#DC2626' }} />} label="Add Buyer" color="#DC2626" onClick={() => navigate('/buyers/new')} />
          <QuickAction icon={<Package size={18} style={{ color: '#D97706' }} />} label="Add Product" color="#D97706" onClick={() => navigate('/products/new')} />
        </div>
      </div>

      {/* ── Bottom Grid: Recent Awaks + Recent Invoices ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'start' }}>
        {/* Recent Awaks */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px', borderBottom: '1px solid var(--border)'
          }}>
            <div style={{ fontWeight: 600, fontSize: 13 }}>Recent Awaks</div>
            <Link to="/awak" style={{ fontSize: 12, color: 'var(--turmeric)', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', fontWeight: 500 }}>
              View All <ArrowRight size={12} />
            </Link>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Awak #</th>
                  <th>Date</th>
                  <th>Farmer</th>
                  <th>Buyer</th>
                  <th className="text-right">Bags</th>
                  <th className="text-right">Weight</th>
                  <th className="text-right">Amount</th>
                  <th className="text-center">Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={9} />)
                ) : recentAwaks.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: 13 }}>
                      No awaks yet. <button className="btn btn-primary btn-sm" style={{ marginLeft: 8 }} onClick={() => navigate('/awak/new')}>Add First Awak</button>
                    </td>
                  </tr>
                ) : (
                  recentAwaks.map(awak => {
                    const totalBags   = awak.items?.reduce((s, i) => s + (i.bags || 0), 0) || 0;
                    const totalWeight = awak.items?.reduce((s, i) => s + (i.weightKg || 0), 0) || 0;
                    const totalAmount = awak.items?.reduce((s, i) => s + (i.amount || 0), 0) || 0;
                    return (
                      <tr key={awak.id} className="clickable" onClick={() => navigate(`/awak/${awak.id}/edit`)}>
                        <td style={{ fontWeight: 600, color: 'var(--turmeric-dark)' }}>#{awak.awakNo}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{formatDate(awak.awakDate)}</td>
                        <td style={{ fontWeight: 500 }}>{awak.farmerName}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{awak.buyerName}</td>
                        <td className="text-right">{totalBags}</td>
                        <td className="text-right text-money">{formatWeight(totalWeight)}</td>
                        <td className="text-right text-money font-semibold">{formatCurrency(totalAmount)}</td>
                        <td className="text-center">
                          <span className={`badge badge-${awak.status === 'active' ? 'success' : 'default'}`}>
                            {awak.status}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-ghost btn-sm btn-icon"
                            onClick={e => { e.stopPropagation(); navigate(`/awak/${awak.id}/edit`); }}
                          >
                            <Eye size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Invoices sidebar */}
        <div className="card" style={{ width: 280, overflow: 'hidden', flexShrink: 0 }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px', borderBottom: '1px solid var(--border)'
          }}>
            <div style={{ fontWeight: 600, fontSize: 13 }}>Recent Invoices</div>
            <Link to="/buyer-invoice" style={{ fontSize: 12, color: 'var(--turmeric)', textDecoration: 'none', fontWeight: 500 }}>
              All
            </Link>
          </div>
          <div>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ padding: '10px 14px', borderBottom: '1px solid #F3F4F6' }}>
                  <div className="skeleton" style={{ height: 12, width: '70%', marginBottom: 6 }} />
                  <div className="skeleton" style={{ height: 11, width: '40%' }} />
                </div>
              ))
            ) : recentInvoices.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
                No invoices yet
              </div>
            ) : (
              recentInvoices.map(inv => (
                <div
                  key={inv.id}
                  onClick={() => navigate(`/buyer-invoice/${inv.id}`)}
                  style={{
                    padding: '10px 14px', borderBottom: '1px solid #F3F4F6',
                    cursor: 'pointer', transition: 'background 100ms'
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#FAFAFA')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: 12, color: 'var(--turmeric-dark)' }}>
                      #{(inv as any).invoiceNo || (inv as any).invoiceNumber}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>{formatDate(inv.date)}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {inv.buyerName}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginTop: 4 }}>
                    {formatCurrency(inv.netAmount || inv.totalAmount || 0)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
