import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, Plus, Trash2, Printer, Calculator, Receipt } from 'lucide-react';
import toast from 'react-hot-toast';
let _biCounter = 0;
const nextItemId = () => `inv-item-${++_biCounter}`;
import { 
  getSettings, updateSettings, getAllFarmers, getAllBuyers, getActiveProducts, 
  addBuyerInvoice, updateBuyerInvoice, getBuyerInvoiceById, addInventoryMovement 
} from '../../database/services';
import { calculateItemAmount, calculateFullBuyerInvoice } from '../../calculations/billingEngine';
import { getTodayString, formatCurrency, formatWeight } from '../../utils/formatters';
import { BuyerInvoice, Buyer, Farmer, Product, BuyerInvoiceItem } from '../../types';
import { Button, Input, Select, Table, Thead, Tbody, Tr, Th, Td } from '../../components/ui';

export default function BuyerInvoiceForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<any>(null);

  const [invoiceNo, setInvoiceNo] = useState('');
  const [date, setDate] = useState(getTodayString());
  const [saudaDate, setSaudaDate] = useState(getTodayString());
  const [buyerId, setBuyerId] = useState('');
  const [hsnCode, setHsnCode] = useState('0910');
  const [items, setItems] = useState<BuyerInvoiceItem[]>([{
    id: nextItemId(), farmerId: '', productId: '', bags: 0, weightKg: 0, ratePerQuintal: 0, amount: 0
  }]);

  useEffect(() => {
    loadInitial();
  }, [id]);

  const loadInitial = async () => {
    try {
      const [bData, fData, pData, sData] = await Promise.all([
        getAllBuyers(), getAllFarmers(), getActiveProducts(), getSettings()
      ]);
      setBuyers(bData || []);
      setFarmers(fData || []);
      setProducts(pData || []);
      setSettings(sData || null);

      if (isEdit && id) {
        const inv = await getBuyerInvoiceById(id);
        if (inv) {
          setInvoiceNo(inv.invoiceNo || (inv as any).invoiceNumber || '');
          setDate(inv.date);
          setSaudaDate(inv.saudaDate || inv.date);
          setBuyerId(inv.buyerId);
          setHsnCode(inv.hsnCode || '0910');
          setItems(inv.items && inv.items.length ? inv.items : [{
            id: nextItemId(), farmerId: '', productId: '', bags: 0, weightKg: 0, ratePerQuintal: 0, amount: 0
          }]);
        }
      } else {
        setInvoiceNo(`INV-${sData?.nextBuyerInvoiceNo || 1001}`);
      }
    } catch (e) {
      toast.error('Failed to load master data');
      console.error(e);
    }
  };

  const handleItemChange = (index: number, field: keyof BuyerInvoiceItem, value: any) => {
    const newItems = [...items];
    const item = { ...newItems[index], [field]: value };
    if (field === 'productId') {
      const p = products.find(prod => prod.id === value);
      if (p) item.ratePerQuintal = p.defaultRate || 0;
    }
    item.amount = calculateItemAmount(Number(item.weightKg) || 0, Number(item.ratePerQuintal) || 0);
    newItems[index] = item;
    setItems(newItems);
  };

  const addItem = () => setItems([...items, { id: nextItemId(), farmerId: '', productId: '', bags: 0, weightKg: 0, ratePerQuintal: 0, amount: 0 }]);
  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    } else {
      toast('At least one item line is required', { icon: 'ℹ️' });
    }
  };

  const validItems = items.filter(i => i.productId && Number(i.weightKg) > 0);
  const calc = settings ? calculateFullBuyerInvoice(validItems, settings.rates) : null;

  const handleSave = async (andPrint = false) => {
    if (!buyerId) {
      toast.error('Please select a buyer');
      return;
    }
    if (validItems.length === 0) {
      toast.error('Please add at least one item with valid weight');
      return;
    }

    setLoading(true);
    try {
      const totalBags = validItems.reduce((sum, i) => sum + (Number(i.bags) || 0), 0);
      const totalWeight = validItems.reduce((sum, i) => sum + (Number(i.weightKg) || 0), 0);

      const invData: Omit<BuyerInvoice, 'id'> = {
        invoiceNo, date, saudaDate, buyerId, items: validItems, totalBags, totalWeight, hsnCode,
        ...calc!, ratesSnapshot: settings.rates, status: 'GENERATED',
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
      };

      let savedId = id;
      if (isEdit && id) {
        await updateBuyerInvoice(id, invData);
        toast.success(`Invoice ${invoiceNo} updated successfully!`);
      } else {
        savedId = await addBuyerInvoice(invData);
        await updateSettings({ ...settings, nextBuyerInvoiceNo: settings.nextBuyerInvoiceNo + 1 });
        
        // Add inventory movements OUT
        for (const item of validItems) {
          await addInventoryMovement({
            productId: item.productId, type: 'OUT', quantityBags: item.bags, weightKg: item.weightKg,
            referenceType: 'INVOICE', referenceId: savedId!, date
          });
        }
        toast.success(`Invoice ${invoiceNo} generated successfully!`);
      }
      navigate(andPrint ? `/buyer-invoice/${savedId}` : '/bills');
    } catch (e) {
      console.error(e);
      toast.error('Error saving Buyer Invoice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
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
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              {isEdit ? 'Edit Commercial Invoice' : 'New Commercial Buyer Invoice'}
            </h1>
            <p className="text-xs text-gray-500">Generate GST compliant sales invoice with Adat & Levy</p>
          </div>
        </div>
        <span className="font-mono text-xs px-2.5 py-1 bg-sky-50 text-sky-900 rounded-lg border border-sky-200 font-bold">
          {invoiceNo}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          {/* Particulars Card */}
          <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="text-sm font-bold text-gray-800 pb-2 border-b border-gray-100 flex items-center gap-2">
              <Receipt size={16} className="text-sky-600" />
              Invoice Particulars
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select 
                label="Buyer (Purchaser)" 
                value={buyerId} 
                onChange={e => setBuyerId(e.target.value)} 
                required
                options={[{ label: 'Select Buyer...', value: '' }, ...buyers.map(b => ({ label: `${b.name} (${b.city})`, value: b.id }))]} 
              />
              <Input label="Invoice Date" type="date" value={date} onChange={e => setDate(e.target.value)} required />
              <Input label="Sauda / Deal Date" type="date" value={saudaDate} onChange={e => setSaudaDate(e.target.value)} />
              <Input label="HSN Code" value={hsnCode} onChange={e => setHsnCode(e.target.value)} placeholder="0910" />
            </div>
          </div>

          {/* Items Card */}
          <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <span className="text-sm font-bold text-gray-800">Billed Commodities</span>
              <Button onClick={addItem} size="sm" variant="outline" icon={<Plus size={14} />}>Add Item</Button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="pb-2">Turmeric Variety</th>
                    <th className="pb-2">Farmer Origin (Opt)</th>
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
                      <td className="py-2.5 pr-2">
                        <select 
                          value={item.productId} 
                          onChange={e => handleItemChange(idx, 'productId', e.target.value)} 
                          className="w-full h-9 px-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-200"
                        >
                          <option value="">Select Variety...</option>
                          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </td>
                      <td className="py-2.5 px-1.5">
                        <select 
                          value={item.farmerId || ''} 
                          onChange={e => handleItemChange(idx, 'farmerId', e.target.value)} 
                          className="w-full h-9 px-2 text-xs border border-gray-200 rounded-lg bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-sky-200"
                        >
                          <option value="">Farmer (Optional)...</option>
                          {farmers.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                        </select>
                      </td>
                      <td className="py-2.5 px-1.5">
                        <input 
                          type="number" 
                          min="0"
                          value={item.bags || ''} 
                          onChange={e => handleItemChange(idx, 'bags', Number(e.target.value))} 
                          className="w-full h-9 px-2 text-sm text-right border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-200" 
                          placeholder="0"
                        />
                      </td>
                      <td className="py-2.5 px-1.5">
                        <input 
                          type="number" 
                          step="0.1" 
                          min="0"
                          value={item.weightKg || ''} 
                          onChange={e => handleItemChange(idx, 'weightKg', Number(e.target.value))} 
                          className="w-full h-9 px-2 text-sm text-right border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-200" 
                          placeholder="0.0"
                        />
                      </td>
                      <td className="py-2.5 px-1.5">
                        <input 
                          type="number" 
                          min="0"
                          value={item.ratePerQuintal || ''} 
                          onChange={e => handleItemChange(idx, 'ratePerQuintal', Number(e.target.value))} 
                          className="w-full h-9 px-2 text-sm text-right border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-200" 
                          placeholder="0"
                        />
                      </td>
                      <td className="py-2.5 px-1.5 text-right font-bold text-gray-900 font-mono text-sm">
                        {formatCurrency(item.amount)}
                      </td>
                      <td className="py-2.5 pl-1.5 text-center">
                        <button 
                          onClick={() => removeItem(idx)} 
                          className="p-1 text-gray-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Invoice Tax Calculations Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-sky-200/90 rounded-2xl p-6 shadow-sm sticky top-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <Calculator size={18} className="text-sky-600" />
              <h2 className="text-base font-bold text-gray-900 tracking-tight">Invoice Breakdown</h2>
            </div>

            {calc ? (
              <div className="space-y-2 text-xs text-gray-700">
                <div className="flex justify-between">
                  <span>Produce Value:</span>
                  <span className="font-mono font-medium">{formatCurrency(calc.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Adat Commission (+):</span>
                  <span className="font-mono">+{formatCurrency(calc.adat)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Container Charges (+):</span>
                  <span className="font-mono">+{formatCurrency(calc.container)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>APMC Levy/Cess (+):</span>
                  <span className="font-mono">+{formatCurrency(calc.levy)}</span>
                </div>
                <div className="flex justify-between font-semibold border-t border-gray-100 pt-1.5 text-gray-900">
                  <span>Composite Supply:</span>
                  <span className="font-mono">{formatCurrency(calc.compositeSupply)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>CGST (2.5%):</span>
                  <span className="font-mono">+{formatCurrency(calc.cgst)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>SGST (2.5%):</span>
                  <span className="font-mono">+{formatCurrency(calc.sgst)}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 pt-1 border-t border-gray-100">
                  <span>Net Invoice Amount:</span>
                  <span className="font-mono">{formatCurrency(calc.netAmount)}</span>
                </div>
                <div className="flex justify-between text-rose-600 font-medium">
                  <span>Less TDS:</span>
                  <span className="font-mono">-{formatCurrency(calc.tds)}</span>
                </div>
                <div className="flex justify-between items-center font-bold text-base pt-3 border-t-2 border-sky-200 text-sky-900">
                  <span>Total Payable:</span>
                  <span className="font-mono text-lg">{formatCurrency(calc.payable)}</span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-gray-400 py-6 text-center">Enter produce lines to compute GST & Adat</div>
            )}
            
            <div className="pt-2 space-y-2">
              <Button 
                onClick={() => handleSave(true)} 
                loading={loading}
                variant="primary" 
                className="w-full justify-center" 
                icon={<Save size={16} />}
              >
                Save & View Bill
              </Button>
              <Button 
                onClick={() => handleSave(false)} 
                loading={loading}
                variant="secondary" 
                className="w-full justify-center"
              >
                Save Invoice Only
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
