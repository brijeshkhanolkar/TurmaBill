import React, { useState, useEffect } from 'react';
import { getFarmerPattis, getBuyerInvoices, deleteFarmerPatti, deleteBuyerInvoice } from '../../database/services';
import type { FarmerPatti, BuyerInvoice } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { FileText, Printer, Trash2, Eye, Files, RefreshCw, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

function SkeletonRow({ cols = 7 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} style={{ padding: '10px 12px' }}>
          <div className="skeleton" style={{ height: 13, width: i === 0 ? 50 : i % 2 === 0 ? '70%' : '55%' }} />
        </td>
      ))}
    </tr>
  );
}

export const BillsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'pattis' | 'invoices'>('all');
  const [pattis, setPattis] = useState<FarmerPatti[]>([]);
  const [invoices, setInvoices] = useState<BuyerInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [pData, iData] = await Promise.all([getFarmerPattis(), getBuyerInvoices()]);
      setPattis(pData);
      setInvoices(iData);
    } catch {
      toast.error('Failed to load bills');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleDeletePatti = async (id: string) => {
    toast((t) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontWeight: 600, fontSize: 13 }}>Delete Farmer Patti?</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>This action cannot be undone.</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-danger btn-sm" onClick={async () => {
            toast.dismiss(t.id);
            await deleteFarmerPatti(id);
            toast.success('Patti deleted');
            loadData(true);
          }}>Delete</button>
          <button className="btn btn-secondary btn-sm" onClick={() => toast.dismiss(t.id)}>Cancel</button>
        </div>
      </div>
    ), { duration: 8000 });
  };

  const handleDeleteInvoice = async (id: string) => {
    toast((t) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontWeight: 600, fontSize: 13 }}>Delete Buyer Invoice?</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>This action cannot be undone.</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-danger btn-sm" onClick={async () => {
            toast.dismiss(t.id);
            await deleteBuyerInvoice(id);
            toast.success('Invoice deleted');
            loadData(true);
          }}>Delete</button>
          <button className="btn btn-secondary btn-sm" onClick={() => toast.dismiss(t.id)}>Cancel</button>
        </div>
      </div>
    ), { duration: 8000 });
  };

  const q = searchTerm.toLowerCase();

  const filteredPattis = pattis.filter(p =>
    !q || p.farmerName?.toLowerCase().includes(q) ||
    p.buyerName?.toLowerCase().includes(q) ||
    p.pattiNumber?.toString().includes(q) ||
    p.pattiNo?.toString().includes(q)
  );

  const filteredInvoices = invoices.filter(i =>
    !q || i.buyerName?.toLowerCase().includes(q) ||
    (i as any).invoiceNumber?.toString().includes(q) ||
    i.invoiceNo?.toString().includes(q)
  );

  const allBills = [
    ...filteredPattis.map(p => ({ ...p, type: 'PATTI' as const, dateObj: new Date(p.date) })),
    ...filteredInvoices.map(i => ({ ...i, type: 'INVOICE' as const, dateObj: new Date(i.date) }))
  ].sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 19, fontWeight: 700, letterSpacing: '-0.4px' }}>Bills History</h1>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            {pattis.length} pattis · {invoices.length} invoices
          </div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => loadData()} disabled={loading} id="refresh-bills-btn">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Main card */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {/* Tabs + Search */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', borderBottom: '1px solid var(--border)' }}>
          <div className="tabs" style={{ borderBottom: 'none', gap: 0 }}>
            {[
              { key: 'all', label: 'All Bills', count: allBills.length },
              { key: 'pattis', label: 'Farmer Pattis', count: filteredPattis.length },
              { key: 'invoices', label: 'Buyer Invoices', count: filteredInvoices.length },
            ].map(t => (
              <button
                key={t.key}
                className={`tab-btn${activeTab === t.key ? ' active' : ''}`}
                onClick={() => setActiveTab(t.key as any)}
                id={`tab-bills-${t.key}`}
              >
                {t.label}
                <span style={{
                  marginLeft: 6, fontSize: 10, padding: '1px 6px', borderRadius: 9999,
                  background: activeTab === t.key ? 'var(--turmeric-muted)' : '#F3F4F6',
                  color: activeTab === t.key ? 'var(--turmeric-dark)' : 'var(--text-muted)',
                  fontWeight: 600,
                }}>
                  {t.count}
                </span>
              </button>
            ))}
          </div>
          <div className="search-box" style={{ width: 220, margin: '8px 0' }}>
            <Search size={14} className="search-box-icon" />
            <input
              placeholder="Search bills…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              id="bills-search-input"
            />
          </div>
        </div>

        {/* All Bills */}
        {activeTab === 'all' && (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>No.</th>
                  <th>Date</th>
                  <th>Name</th>
                  <th className="text-right">Weight (kg)</th>
                  <th className="text-right">Amount</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} cols={7} />) :
                 allBills.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: 13 }}>No bills found</td></tr>
                ) : allBills.map((bill, idx) => (
                  <tr key={idx} className="clickable" onClick={() => navigate(bill.type === 'PATTI' ? `/farmer-patti/${bill.id}` : `/buyer-invoice/${bill.id}`)}>
                    <td>
                      <span className={`badge ${bill.type === 'PATTI' ? 'badge-purple' : 'badge-success'}`}>
                        {bill.type === 'PATTI' ? 'Patti' : 'Invoice'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>#{(bill as any).pattiNumber || (bill as any).pattiNo || (bill as any).invoiceNumber || (bill as any).invoiceNo}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{formatDate(bill.date)}</td>
                    <td style={{ fontWeight: 500 }}>{(bill as any).farmerName || (bill as any).buyerName}</td>
                    <td className="text-right">{bill.totalWeight?.toFixed(2) ?? '—'}</td>
                    <td className="text-right font-semibold">{formatCurrency((bill as any).netAmount || (bill as any).amount || 0)}</td>
                    <td className="text-right">
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                        <button className="btn btn-ghost btn-sm btn-icon" title="View" onClick={e => { e.stopPropagation(); navigate(bill.type === 'PATTI' ? `/farmer-patti/${bill.id}` : `/buyer-invoice/${bill.id}`); }}>
                          <Eye size={13} />
                        </button>
                        <button className="btn btn-ghost btn-sm btn-icon" title="Delete"
                          style={{ color: 'var(--red)' }}
                          onClick={e => { e.stopPropagation(); bill.type === 'PATTI' ? handleDeletePatti(bill.id as string) : handleDeleteInvoice(bill.id as string); }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pattis tab */}
        {activeTab === 'pattis' && (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Patti #</th>
                  <th>Date</th>
                  <th>Farmer</th>
                  <th>Village</th>
                  <th>Buyer</th>
                  <th className="text-right">Bags</th>
                  <th className="text-right">Weight</th>
                  <th className="text-right">Net Amount</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={9} />) :
                 filteredPattis.length === 0 ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No Farmer Pattis found</td></tr>
                ) : filteredPattis.map(patti => (
                  <tr key={patti.id} className="clickable" onClick={() => navigate(`/farmer-patti/${patti.id}`)}>
                    <td style={{ fontWeight: 600, color: 'var(--turmeric-dark)' }}>#{patti.pattiNumber || patti.pattiNo}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{formatDate(patti.date)}</td>
                    <td style={{ fontWeight: 500 }}>{patti.farmerName}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{patti.village}</td>
                    <td>{patti.buyerName || '—'}</td>
                    <td className="text-right">{patti.totalBags}</td>
                    <td className="text-right">{patti.totalWeight?.toFixed(2)}</td>
                    <td className="text-right font-semibold">{formatCurrency(patti.netAmount || patti.pattiAmount || 0)}</td>
                    <td className="text-right">
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                        <button className="btn btn-ghost btn-sm btn-icon" onClick={e => { e.stopPropagation(); navigate(`/farmer-patti/${patti.id}`); }}><Eye size={13} /></button>
                        <button className="btn btn-ghost btn-sm btn-icon" onClick={e => { e.stopPropagation(); navigate(`/farmer-patti/${patti.id}?print=true`); }}><Printer size={13} /></button>
                        <button className="btn btn-ghost btn-sm btn-icon" style={{ color: 'var(--red)' }} onClick={e => { e.stopPropagation(); handleDeletePatti(patti.id as string); }}><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Invoices tab */}
        {activeTab === 'invoices' && (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Date</th>
                  <th>Buyer</th>
                  <th className="text-right">Items</th>
                  <th className="text-right">Bags</th>
                  <th className="text-right">Weight</th>
                  <th className="text-right">Net Amount</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={8} />) :
                 filteredInvoices.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No Buyer Invoices found</td></tr>
                ) : filteredInvoices.map(invoice => (
                  <tr key={invoice.id} className="clickable" onClick={() => navigate(`/buyer-invoice/${invoice.id}`)}>
                    <td style={{ fontWeight: 600, color: 'var(--blue)' }}>#{(invoice as any).invoiceNumber || invoice.invoiceNo}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{formatDate(invoice.date)}</td>
                    <td style={{ fontWeight: 500 }}>{invoice.buyerName}</td>
                    <td className="text-right">{invoice.items?.length ?? 0}</td>
                    <td className="text-right">{invoice.totalBags}</td>
                    <td className="text-right">{invoice.totalWeight?.toFixed(2)}</td>
                    <td className="text-right font-semibold">{formatCurrency(invoice.netAmount || 0)}</td>
                    <td className="text-right">
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                        <button className="btn btn-ghost btn-sm btn-icon" onClick={e => { e.stopPropagation(); navigate(`/buyer-invoice/${invoice.id}`); }}><Eye size={13} /></button>
                        <button className="btn btn-ghost btn-sm btn-icon" onClick={e => { e.stopPropagation(); navigate(`/buyer-invoice/${invoice.id}?print=true`); }}><Printer size={13} /></button>
                        <button className="btn btn-ghost btn-sm btn-icon" style={{ color: 'var(--red)' }} onClick={e => { e.stopPropagation(); handleDeleteInvoice(invoice.id as string); }}><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
