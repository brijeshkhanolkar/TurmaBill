import React, { useState, useEffect } from 'react';
import { Package, TrendingUp, Settings2, RefreshCw, Plus } from 'lucide-react';
import { getInventoryStock, getInventoryMovements, addStockAdjustment, getAllProducts } from '../../database/services';
import type { InventoryStock, InventoryMovement, Product } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

function SkeletonRow({ cols = 7 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} style={{ padding: '10px 12px' }}>
          <div className="skeleton" style={{ height: 13, width: i === 0 ? 90 : '65%' }} />
        </td>
      ))}
    </tr>
  );
}

export const InventoryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'movements' | 'adjustment'>('overview');
  const [stock, setStock] = useState<InventoryStock[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [adjProduct, setAdjProduct] = useState('');
  const [adjType, setAdjType] = useState<'ADD' | 'REMOVE'>('ADD');
  const [adjBags, setAdjBags] = useState('');
  const [adjWeight, setAdjWeight] = useState('');
  const [adjNotes, setAdjNotes] = useState('');
  const [adjSaving, setAdjSaving] = useState(false);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      if (activeTab === 'overview') {
        const [s, p] = await Promise.all([getInventoryStock(), getAllProducts()]);
        setStock(s);
        setProducts(p);
      } else if (activeTab === 'movements') {
        const m = await getInventoryMovements();
        setMovements(m);
      } else {
        const p = await getAllProducts();
        setProducts(p);
      }
    } catch {
      toast.error('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [activeTab]);

  const handleAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjProduct || !adjBags || !adjWeight) {
      toast.error('Please fill all required fields');
      return;
    }
    const bags = parseFloat(adjBags);
    const weight = parseFloat(adjWeight);
    if (bags <= 0 || weight <= 0) {
      toast.error('Bags and weight must be positive numbers');
      return;
    }
    try {
      setAdjSaving(true);
      await addStockAdjustment({
        productId: adjProduct,
        type: adjType,
        bags,
        weight,
        notes: adjNotes,
        date: new Date().toISOString()
      });
      toast.success(`Stock ${adjType === 'ADD' ? 'added' : 'removed'} successfully!`);
      setAdjProduct('');
      setAdjBags('');
      setAdjWeight('');
      setAdjNotes('');
      setActiveTab('overview');
    } catch {
      toast.error('Failed to save stock adjustment');
    } finally {
      setAdjSaving(false);
    }
  };

  // Summary totals for overview
  const totalBagsInStock = stock.reduce((s, item) => s + (item.currentBags || 0), 0);
  const totalWeightInStock = stock.reduce((s, item) => s + (item.currentWeight || 0), 0);
  const totalStockValue = stock.reduce((s, item) => s + (item.stockValue || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 19, fontWeight: 700, letterSpacing: '-0.4px' }}>Inventory</h1>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            {stock.length} products tracked
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => loadData()} disabled={loading} id="refresh-inventory-btn">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setActiveTab('adjustment')} id="add-adjustment-btn">
            <Plus size={13} />
            Adjust Stock
          </button>
        </div>
      </div>

      {/* Summary Cards (only for overview tab) */}
      {activeTab === 'overview' && !loading && stock.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <div className="stat-card" style={{ '--accent-color': 'var(--turmeric)' } as React.CSSProperties}>
            <div className="stat-label"><Package size={13} style={{ color: 'var(--turmeric)' }} />Total Bags</div>
            <div className="stat-value">{totalBagsInStock.toLocaleString('en-IN')}</div>
            <div className="stat-sub">in stock across all products</div>
          </div>
          <div className="stat-card" style={{ '--accent-color': '#7C3AED' } as React.CSSProperties}>
            <div className="stat-label"><TrendingUp size={13} style={{ color: '#7C3AED' }} />Total Weight</div>
            <div className="stat-value">{totalWeightInStock.toFixed(1)} kg</div>
            <div className="stat-sub">{(totalWeightInStock / 100).toFixed(2)} quintals</div>
          </div>
          <div className="stat-card" style={{ '--accent-color': '#16A34A' } as React.CSSProperties}>
            <div className="stat-label"><Package size={13} style={{ color: '#16A34A' }} />Estimated Value</div>
            <div className="stat-value">{formatCurrency(totalStockValue)}</div>
            <div className="stat-sub">at default rates</div>
          </div>
        </div>
      )}

      {/* Main Card */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {/* Tabs */}
        <div className="tabs" style={{ padding: '0 16px', borderBottom: '1px solid var(--border)' }}>
          {[
            { key: 'overview',   icon: Package,    label: 'Stock Overview' },
            { key: 'movements',  icon: TrendingUp, label: 'Movements' },
            { key: 'adjustment', icon: Settings2,  label: 'Adjustment' },
          ].map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                className={`tab-btn${activeTab === t.key ? ' active' : ''}`}
                onClick={() => setActiveTab(t.key as any)}
                id={`tab-inventory-${t.key}`}
              >
                <Icon size={13} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Stock Overview */}
        {activeTab === 'overview' && (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th className="text-right">Opening</th>
                  <th className="text-right">Purchased</th>
                  <th className="text-right">Sold</th>
                  <th className="text-right">Adjustments</th>
                  <th className="text-right">Current Stock</th>
                  <th className="text-right">Est. Value</th>
                </tr>
              </thead>
              <tbody>
                {loading ? Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} cols={7} />) :
                 stock.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    No stock data available. Complete some awak entries to track stock.
                  </td></tr>
                ) : stock.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{item.productName}</td>
                    <td className="text-right" style={{ color: 'var(--text-muted)', fontSize: 12 }}>{item.openingBags}b / {item.openingWeight?.toFixed(1)}kg</td>
                    <td className="text-right" style={{ color: '#16A34A', fontSize: 12 }}>+{item.purchasedBags}b / {item.purchasedWeight?.toFixed(1)}kg</td>
                    <td className="text-right" style={{ color: 'var(--red)', fontSize: 12 }}>-{item.soldBags}b / {item.soldWeight?.toFixed(1)}kg</td>
                    <td className="text-right" style={{ color: 'var(--text-muted)', fontSize: 12 }}>{item.adjustmentBags >= 0 ? '+' : ''}{item.adjustmentBags}b</td>
                    <td className="text-right">
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                        <span style={{
                          fontWeight: 700, fontSize: 13,
                          color: (item.currentBags || 0) < 0 ? 'var(--red)' : 'var(--text)'
                        }}>
                          {item.currentBags} bags
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.currentWeight?.toFixed(2)} kg</span>
                      </div>
                    </td>
                    <td className="text-right font-semibold">{formatCurrency(item.stockValue || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Movements */}
        {activeTab === 'movements' && (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Product</th>
                  <th>Type</th>
                  <th className="text-right">Bags</th>
                  <th className="text-right">Weight (kg)</th>
                  <th>Reference</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {loading ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} cols={7} />) :
                 movements.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No movements recorded yet</td></tr>
                ) : movements.map((mov, idx) => (
                  <tr key={idx}>
                    <td style={{ color: 'var(--text-muted)' }}>{formatDate(mov.date)}</td>
                    <td style={{ fontWeight: 500 }}>{mov.productName}</td>
                    <td>
                      <span className={`badge ${
                        mov.type === 'PURCHASE'   ? 'badge-info' :
                        mov.type === 'SALE'       ? 'badge-success' :
                        'badge-warning'
                      }`}>
                        {mov.type}
                      </span>
                    </td>
                    <td className="text-right">{mov.bags}</td>
                    <td className="text-right">{(mov.weight ?? (mov as any).weightKg ?? 0).toFixed(2)}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{mov.referenceId || '—'}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mov.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Stock Adjustment Form */}
        {activeTab === 'adjustment' && (
          <div style={{ padding: 24 }}>
            <form onSubmit={handleAdjustment} style={{ maxWidth: 520 }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>Add Stock Adjustment</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  Manually correct stock levels due to physical verification or errors.
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Product *</label>
                  <select
                    value={adjProduct}
                    onChange={e => setAdjProduct(e.target.value)}
                    required
                    className="form-select"
                    id="adj-product-select"
                  >
                    <option value="">Select product…</option>
                    {products.map(p => (
                      <option key={p.id} value={String(p.id)}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Adjustment Type *</label>
                  <select
                    value={adjType}
                    onChange={e => setAdjType(e.target.value as 'ADD' | 'REMOVE')}
                    className="form-select"
                    id="adj-type-select"
                  >
                    <option value="ADD">➕ Add to Stock</option>
                    <option value="REMOVE">➖ Remove from Stock</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Bags *</label>
                  <input
                    type="number"
                    value={adjBags}
                    onChange={e => setAdjBags(e.target.value)}
                    required
                    min="1"
                    className="form-input"
                    placeholder="e.g. 10"
                    id="adj-bags-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Weight (KG) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={adjWeight}
                    onChange={e => setAdjWeight(e.target.value)}
                    required
                    min="0.01"
                    className="form-input"
                    placeholder="e.g. 750.50"
                    id="adj-weight-input"
                  />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Reason / Notes</label>
                  <textarea
                    value={adjNotes}
                    onChange={e => setAdjNotes(e.target.value)}
                    className="form-textarea"
                    placeholder="e.g. Physical verification correction on 31-Oct-2026"
                    rows={3}
                    id="adj-notes-input"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button type="submit" className="btn btn-primary" disabled={adjSaving} id="adj-save-btn">
                  {adjSaving ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
                  {adjSaving ? 'Saving…' : 'Save Adjustment'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setActiveTab('overview')}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
