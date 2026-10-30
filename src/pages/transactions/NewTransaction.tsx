import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Plus, Trash2, Zap, ArrowLeft, CheckCircle2, FileText, Receipt } from 'lucide-react';
import toast from 'react-hot-toast';
let itemCounter = 0;
const nextItemId = () => `item-${++itemCounter}`;
import { 
  getSettings, updateSettings, getAllFarmers, getAllBuyers, getActiveProducts, 
  addAwak, addInventoryMovement, addFarmerPatti, addBuyerInvoice 
} from '../../database/services';
import { calculateItemAmount, calculateFullFarmerPatti, calculateFullBuyerInvoice } from '../../calculations/billingEngine';
import { getTodayString, formatCurrency, formatWeight } from '../../utils/formatters';
import { TransactionItem, BuyerInvoiceItem } from '../../types';
import { Button, Input, Select } from '../../components/ui';

export default function NewTransaction() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [farmers, setFarmers] = useState<any[]>([]);
  const [buyers, setBuyers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  // Form State
  const [awakNo, setAwakNo] = useState('');
  const [date, setDate] = useState(getTodayString());
  const [saudaDate, setSaudaDate] = useState(getTodayString());
  const [farmerId, setFarmerId] = useState('');
  const [village, setVillage] = useState('');
  const [buyerId, setBuyerId] = useState('');
  const [advance, setAdvance] = useState(0);
  const [items, setItems] = useState<TransactionItem[]>([{
    id: nextItemId(), productId: '', bags: 0, weightKg: 0, ratePerQuintal: 0, amount: 0
  }]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [fData, bData, pData, sData] = await Promise.all([
        getAllFarmers(), getAllBuyers(), getActiveProducts(), getSettings()
      ]);
      setFarmers(fData || []);
      setBuyers(bData || []);
      setProducts(pData || []);
      setSettings(sData || null);
      if (sData) setAwakNo(`AWK-${sData.nextAwakNo}`);
    } catch (err) {
      toast.error('Failed to load transaction master data');
      console.error(err);
    }
  };

  const handleFarmerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const fId = e.target.value;
    setFarmerId(fId);
    const farmer = farmers.find(f => f.id === fId);
    if (farmer) setVillage(farmer.village || '');
  };

  const handleItemChange = (index: number, field: keyof TransactionItem, value: any) => {
    const newItems = [...items];
    const item = { ...newItems[index], [field]: value };
    if (field === 'productId') {
      const product = products.find(p => p.id === value);
      if (product) item.ratePerQuintal = product.defaultRate || 0;
    }
    item.amount = calculateItemAmount(Number(item.weightKg) || 0, Number(item.ratePerQuintal) || 0);
    newItems[index] = item;
    setItems(newItems);
  };

  const addItem = () => setItems([...items, { id: nextItemId(), productId: '', bags: 0, weightKg: 0, ratePerQuintal: 0, amount: 0 }]);
  
  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    } else {
      toast('At least one commodity row is required', { icon: 'ℹ️' });
    }
  };

  const validItems = items.filter(i => i.productId && Number(i.weightKg) > 0);
  const pattiPreview = settings ? calculateFullFarmerPatti(validItems, advance, settings.rates) : null;
  
  const buyerInvoiceItems: BuyerInvoiceItem[] = validItems.map(i => ({
    id: i.id, farmerId, productId: i.productId, bags: i.bags, weightKg: i.weightKg, ratePerQuintal: i.ratePerQuintal, amount: i.amount
  }));
  const invoicePreview = settings ? calculateFullBuyerInvoice(buyerInvoiceItems, settings.rates) : null;

  const handleSave = async (action: 'AWAK' | 'PATTI' | 'INVOICE' | 'ALL') => {
    if (!farmerId) {
      toast.error('Please select a farmer');
      return;
    }
    if (!buyerId) {
      toast.error('Please select a buyer');
      return;
    }
    if (validItems.length === 0) {
      toast.error('Please add at least 1 valid item with weight');
      return;
    }

    setLoading(true);
    try {
      const totalBags = validItems.reduce((sum, i) => sum + (Number(i.bags) || 0), 0);
      const totalWeight = validItems.reduce((sum, i) => sum + (Number(i.weightKg) || 0), 0);
      const totalAmount = validItems.reduce((sum, i) => sum + i.amount, 0);

      // 1. Save Awak
      const awakId = await addAwak({
        awakNo, date, saudaDate, farmerId, village, buyerId, items: validItems,
        totalBags, totalWeight, totalAmount, advance, notes: 'Fast Quick Transaction',
        status: 'COMPLETED', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
      });

      let nextSettings = { ...settings, nextAwakNo: settings.nextAwakNo + 1 };

      // Inventory movements IN
      for (const item of validItems) {
        await addInventoryMovement({
          productId: item.productId, type: 'IN', quantityBags: item.bags, weightKg: item.weightKg,
          referenceType: 'AWAK', referenceId: awakId, date
        });
      }

      // 2. Save Patti if needed
      let pattiId = null;
      if (['PATTI', 'ALL'].includes(action) && pattiPreview) {
        const pattiNo = `FP-${nextSettings.nextFarmerPattiNo}`;
        pattiId = await addFarmerPatti({
          pattiNo, awakId, date, farmerId, buyerId, items: validItems,
          totalBags, totalWeight, ...pattiPreview, ratesSnapshot: settings.rates,
          status: 'GENERATED', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
        });
        nextSettings.nextFarmerPattiNo += 1;
      }

      // 3. Save Invoice if needed
      let invoiceId = null;
      if (['INVOICE', 'ALL'].includes(action) && invoicePreview) {
        const invoiceNo = `INV-${nextSettings.nextBuyerInvoiceNo}`;
        invoiceId = await addBuyerInvoice({
          invoiceNo, date, saudaDate, buyerId, items: buyerInvoiceItems,
          totalBags, totalWeight, ...invoicePreview, hsnCode: '0910', ratesSnapshot: settings.rates,
          status: 'GENERATED', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
        });
        nextSettings.nextBuyerInvoiceNo += 1;

        // Inventory movements OUT
        for (const item of validItems) {
          await addInventoryMovement({
            productId: item.productId, type: 'OUT', quantityBags: item.bags, weightKg: item.weightKg,
            referenceType: 'INVOICE', referenceId: invoiceId, date
          });
        }
      }

      await updateSettings(nextSettings);
      toast.success('Transaction saved & processed successfully!');
      
      // Navigate based on action
      if (action === 'PATTI' && pattiId) navigate(`/farmer-patti/${pattiId}`);
      else if (action === 'INVOICE' && invoiceId) navigate(`/buyer-invoice/${invoiceId}`);
      else navigate('/bills');

    } catch (error) {
      console.error(error);
      toast.error('Failed to save transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            icon={<ArrowLeft size={16} />} 
            onClick={() => navigate('/bills')}
            className="text-gray-500 hover:text-gray-900"
          >
            Back
          </Button>
          <div className="h-4 w-px bg-gray-200" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Quick Trading Terminal</h1>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                <Zap size={11} className="text-[#C8920A]" /> POS Fast Entry
              </span>
            </div>
            <p className="text-xs text-gray-500">Simultaneously record Awak Inward, Farmer Patti, and Buyer Invoice in one click</p>
          </div>
        </div>
        <span className="font-mono text-xs px-2.5 py-1 bg-amber-50 text-amber-900 rounded-lg border border-amber-200 font-bold">
          Ref: {awakNo}
        </span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column: Trade Parties & Dates */}
        <div className="xl:col-span-3 bg-white border border-gray-200/80 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="text-sm font-bold text-gray-800 pb-2 border-b border-gray-100 flex items-center justify-between">
            <span>Trading Parties</span>
          </div>

          <div className="space-y-3.5">
            <Input 
              label="Transaction Date" 
              type="date" 
              value={date} 
              onChange={e => setDate(e.target.value)} 
              required 
            />
            <Input 
              label="Sauda / Rate Date" 
              type="date" 
              value={saudaDate} 
              onChange={e => setSaudaDate(e.target.value)} 
            />

            <Select 
              label="Farmer (Seller)" 
              value={farmerId} 
              onChange={handleFarmerChange}
              required
              options={[{ label: 'Select Farmer...', value: '' }, ...farmers.map(f => ({ label: `${f.name} (${f.village || ''})`, value: f.id }))]}
            />
            <Input 
              label="Village" 
              value={village} 
              onChange={e => setVillage(e.target.value)} 
              placeholder="Origin village" 
            />

            <Select 
              label="Buyer (Purchaser)" 
              value={buyerId} 
              onChange={e => setBuyerId(e.target.value)}
              required
              options={[{ label: 'Select Buyer...', value: '' }, ...buyers.map(b => ({ label: `${b.name} - ${b.city || ''}`, value: b.id }))]}
            />

            <div className="pt-2 border-t border-gray-100">
              <Input 
                label="Advance Paid to Farmer (₹)" 
                type="number" 
                min="0"
                value={advance || ''} 
                onChange={e => setAdvance(Number(e.target.value))} 
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Center Column: Commodity Lines */}
        <div className="xl:col-span-6 bg-white border border-gray-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <span className="text-sm font-bold text-gray-800">Commodity Trade Lines</span>
              <Button 
                onClick={addItem} 
                size="sm" 
                variant="outline" 
                icon={<Plus size={14} />}
              >
                Add Line
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="pb-2">Grade</th>
                    <th className="pb-2 w-20 text-right">Bags</th>
                    <th className="pb-2 w-24 text-right">Weight (Kg)</th>
                    <th className="pb-2 w-24 text-right">Rate / Qtl</th>
                    <th className="pb-2 w-28 text-right">Amount (₹)</th>
                    <th className="pb-2 w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-gray-50/50">
                      <td className="py-2 pr-1.5">
                        <select 
                          value={item.productId} 
                          onChange={e => handleItemChange(idx, 'productId', e.target.value)}
                          className="w-full h-8 px-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#C8920A]"
                        >
                          <option value="">Select Variety...</option>
                          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </td>
                      <td className="py-2 px-1">
                        <input 
                          type="number" 
                          min="0"
                          value={item.bags || ''} 
                          onChange={e => handleItemChange(idx, 'bags', Number(e.target.value))} 
                          className="w-full h-8 px-1.5 text-xs text-right border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#C8920A]" 
                          placeholder="0"
                        />
                      </td>
                      <td className="py-2 px-1">
                        <input 
                          type="number" 
                          step="0.1" 
                          min="0"
                          value={item.weightKg || ''} 
                          onChange={e => handleItemChange(idx, 'weightKg', Number(e.target.value))} 
                          className="w-full h-8 px-1.5 text-xs text-right border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#C8920A]" 
                          placeholder="0.0"
                        />
                      </td>
                      <td className="py-2 px-1">
                        <input 
                          type="number" 
                          min="0"
                          value={item.ratePerQuintal || ''} 
                          onChange={e => handleItemChange(idx, 'ratePerQuintal', Number(e.target.value))} 
                          className="w-full h-8 px-1.5 text-xs text-right border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#C8920A]" 
                          placeholder="0"
                        />
                      </td>
                      <td className="py-2 px-1 text-right font-mono font-bold text-xs text-gray-900">
                        {formatCurrency(item.amount)}
                      </td>
                      <td className="py-2 pl-1 text-center">
                        <button 
                          onClick={() => removeItem(idx)} 
                          className="p-1 text-gray-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
            <span>{validItems.length} active trade line(s)</span>
            <div className="font-bold text-sm text-gray-900">
              Gross Value: {formatCurrency(validItems.reduce((acc, i) => acc + i.amount, 0))}
            </div>
          </div>
        </div>

        {/* Right Column: Side-by-Side Settlement & Invoicing */}
        <div className="xl:col-span-3 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Farmer Patti Box */}
            <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-amber-200/80">
                <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <FileText size={13} className="text-[#C8920A]" /> Farmer Settlement
                </span>
                <span className="text-[10px] text-amber-700 font-semibold uppercase">Patti</span>
              </div>
              {pattiPreview ? (
                <div className="space-y-1.5 text-xs text-amber-900 mt-2.5">
                  <div className="flex justify-between"><span>Produce Amount:</span><span className="font-mono">{formatCurrency(pattiPreview.totalAmount)}</span></div>
                  <div className="flex justify-between text-amber-700"><span>Less Container (-):</span><span className="font-mono">-{formatCurrency(pattiPreview.container)}</span></div>
                  <div className="flex justify-between font-semibold border-t border-amber-200/60 pt-1"><span>Gross Base:</span><span className="font-mono">{formatCurrency(pattiPreview.gross)}</span></div>
                  <div className="flex justify-between text-amber-700"><span>Less Hamali (-):</span><span className="font-mono">-{formatCurrency(pattiPreview.hamali)}</span></div>
                  <div className="flex justify-between text-amber-700"><span>Less Tolai (-):</span><span className="font-mono">-{formatCurrency(pattiPreview.tolai)}</span></div>
                  {advance > 0 && (
                    <div className="flex justify-between text-rose-600 font-semibold"><span>Less Advance (-):</span><span className="font-mono">-{formatCurrency(advance)}</span></div>
                  )}
                  <div className="flex justify-between font-bold text-sm pt-2 border-t-2 border-amber-300 text-emerald-800">
                    <span>Farmer Payable:</span><span className="font-mono">{formatCurrency(pattiPreview.pattiAmount)}</span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-amber-700/60 py-4 text-center">Add produce items to calculate</div>
              )}
            </div>

            {/* Buyer Invoice Box */}
            <div className="bg-sky-50/60 border border-sky-200 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-sky-200/80">
                <span className="text-xs font-bold text-sky-900 flex items-center gap-1.5">
                  <Receipt size={13} className="text-sky-600" /> Buyer Invoice
                </span>
                <span className="text-[10px] text-sky-700 font-semibold uppercase">Tax Invoice</span>
              </div>
              {invoicePreview ? (
                <div className="space-y-1.5 text-xs text-sky-900 mt-2.5">
                  <div className="flex justify-between"><span>Produce Amount:</span><span className="font-mono">{formatCurrency(invoicePreview.totalAmount)}</span></div>
                  <div className="flex justify-between text-sky-700"><span>Adat Comm (+):</span><span className="font-mono">+{formatCurrency(invoicePreview.adat)}</span></div>
                  <div className="flex justify-between text-sky-700"><span>Levy/Cess (+):</span><span className="font-mono">+{formatCurrency(invoicePreview.levy)}</span></div>
                  <div className="flex justify-between text-sky-700"><span>GST (5%) (+):</span><span className="font-mono">+{formatCurrency(invoicePreview.cgst + invoicePreview.sgst)}</span></div>
                  <div className="flex justify-between font-bold text-sm pt-2 border-t-2 border-sky-300 text-sky-900">
                    <span>Buyer Due:</span><span className="font-mono">{formatCurrency(invoicePreview.payable)}</span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-sky-700/60 py-4 text-center">Add produce items to calculate</div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <Button 
              onClick={() => handleSave('ALL')} 
              loading={loading}
              variant="success" 
              className="w-full justify-center" 
              icon={<CheckCircle2 size={16} />}
            >
              Complete & Generate All (Awak + Patti + Inv)
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                onClick={() => handleSave('PATTI')} 
                loading={loading}
                variant="outline" 
                size="sm"
                className="justify-center"
              >
                + Farmer Patti
              </Button>
              <Button 
                onClick={() => handleSave('INVOICE')} 
                loading={loading}
                variant="secondary" 
                size="sm"
                className="justify-center text-sky-700 border-sky-300 hover:bg-sky-50"
              >
                + Buyer Invoice
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
