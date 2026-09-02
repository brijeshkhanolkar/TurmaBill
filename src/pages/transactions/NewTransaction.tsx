import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Printer, FileText, Plus, X } from 'lucide-react';
let itemCounter = 0;
const nextItemId = () => `item-${++itemCounter}`;
import { 
  getSettings, updateSettings, getAllFarmers, getAllBuyers, getActiveProducts, 
  addAwak, addInventoryMovement, addFarmerPatti, addBuyerInvoice 
} from '../../database/services';
import { calculateItemAmount, calculateFullFarmerPatti, calculateFullBuyerInvoice } from '../../calculations/billingEngine';
import { getTodayString, formatCurrency, formatWeight } from '../../utils/formatters';
import { TransactionItem, BuyerInvoiceItem } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Table, Thead, Tbody, Tr, Th, Td } from '../../components/ui/Table';

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
    const [fData, bData, pData, sData] = await Promise.all([
      getAllFarmers(), getAllBuyers(), getActiveProducts(), getSettings()
    ]);
    setFarmers(fData);
    setBuyers(bData);
    setProducts(pData);
    setSettings(sData);
    if (sData) setAwakNo(`AWK-${sData.nextAwakNo}`);
  };

  const handleFarmerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const fId = e.target.value;
    setFarmerId(fId);
    const farmer = farmers.find(f => f.id === fId);
    if (farmer) setVillage(farmer.village);
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
  const removeItem = (index: number) => items.length > 1 && setItems(items.filter((_, i) => i !== index));

  const validItems = items.filter(i => i.productId && i.weightKg > 0);
  const pattiPreview = settings ? calculateFullFarmerPatti(validItems, advance, settings.rates) : null;
  
  // Prepare buyer invoice items mapped from transaction items
  const buyerInvoiceItems: BuyerInvoiceItem[] = validItems.map(i => ({
    id: i.id, farmerId, productId: i.productId, bags: i.bags, weightKg: i.weightKg, ratePerQuintal: i.ratePerQuintal, amount: i.amount
  }));
  const invoicePreview = settings ? calculateFullBuyerInvoice(buyerInvoiceItems, settings.rates) : null;

  const handleSave = async (action: 'AWAK' | 'PATTI' | 'INVOICE' | 'ALL') => {
    if (!farmerId || !buyerId || validItems.length === 0) {
      alert("Please fill all required fields: Farmer, Buyer, and at least 1 valid item.");
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
        totalBags, totalWeight, totalAmount, advance, notes: 'Fast Transaction',
        status: 'COMPLETED', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
      });

      let nextSettings = { ...settings, nextAwakNo: settings.nextAwakNo + 1 };

      // Inventory IN
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

        // Inventory OUT
        for (const item of validItems) {
          await addInventoryMovement({
            productId: item.productId, type: 'OUT', quantityBags: item.bags, weightKg: item.weightKg,
            referenceType: 'INVOICE', referenceId: invoiceId, date
          });
        }
      }

      await updateSettings(nextSettings);
      alert("Transaction Saved Successfully!");
      
      // Navigate based on action
      if (action === 'PATTI' && pattiId) navigate(`/patti/view/${pattiId}`);
      else if (action === 'INVOICE' && invoiceId) navigate(`/invoice/view/${invoiceId}`);
      else navigate('/awak');

    } catch (error) {
      console.error(error);
      alert("Failed to save transaction.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 h-full bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold text-gray-800">Quick Transaction</h1>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Left Column: Info */}
        <div className="col-span-12 lg:col-span-3 bg-white p-4 rounded shadow-sm border border-gray-200">
          <h2 className="text-sm font-bold text-gray-600 mb-3 border-b pb-1">Info</h2>
          <div className="space-y-3">
            <Input label="Awak No" value={awakNo} disabled className="bg-gray-50 text-sm py-1" />
            <Input label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} className="text-sm py-1" />
            <Select label="Farmer" value={farmerId} onChange={handleFarmerChange}
              options={[{ label: 'Select...', value: '' }, ...farmers.map(f => ({ label: f.name, value: f.id }))]}
              className="text-sm py-1" />
            <Input label="Village" value={village} onChange={e => setVillage(e.target.value)} className="text-sm py-1" />
            <Select label="Buyer" value={buyerId} onChange={e => setBuyerId(e.target.value)}
              options={[{ label: 'Select...', value: '' }, ...buyers.map(b => ({ label: b.name, value: b.id }))]}
              className="text-sm py-1" />
            <Input label="Sauda Date" type="date" value={saudaDate} onChange={e => setSaudaDate(e.target.value)} className="text-sm py-1" />
          </div>
        </div>

        {/* Middle Column: Items */}
        <div className="col-span-12 lg:col-span-6 bg-white p-4 rounded shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-3 border-b pb-1">
            <h2 className="text-sm font-bold text-gray-600">Items</h2>
            <Button onClick={addItem} size="sm" variant="outline" icon={<Plus size={14} />} className="text-xs h-7 py-0">Add</Button>
          </div>
          
          <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-600 text-xs border-b">
                <tr>
                  <th className="p-2 font-medium">Item</th>
                  <th className="p-2 font-medium text-right w-16">Bags</th>
                  <th className="p-2 font-medium text-right w-20">Weight</th>
                  <th className="p-2 font-medium text-right w-20">Rate</th>
                  <th className="p-2 font-medium text-right w-24">Amount</th>
                  <th className="p-2 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.id} className="border-b border-gray-50">
                    <td className="p-1">
                      <select value={item.productId} onChange={e => handleItemChange(idx, 'productId', e.target.value)} 
                        className="w-full border-gray-300 rounded shadow-sm text-sm focus:ring-amber-500 focus:border-amber-500 p-1.5">
                        <option value="">Select...</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </td>
                    <td className="p-1"><input type="number" value={item.bags || ''} onChange={e => handleItemChange(idx, 'bags', Number(e.target.value))} className="w-full border-gray-300 rounded shadow-sm text-sm text-right p-1.5" /></td>
                    <td className="p-1"><input type="number" step="0.001" value={item.weightKg || ''} onChange={e => handleItemChange(idx, 'weightKg', Number(e.target.value))} className="w-full border-gray-300 rounded shadow-sm text-sm text-right p-1.5" /></td>
                    <td className="p-1"><input type="number" value={item.ratePerQuintal || ''} onChange={e => handleItemChange(idx, 'ratePerQuintal', Number(e.target.value))} className="w-full border-gray-300 rounded shadow-sm text-sm text-right p-1.5" /></td>
                    <td className="p-2 text-right font-medium text-gray-800">{formatCurrency(item.amount)}</td>
                    <td className="p-1 text-center">
                      <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600"><X size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 pt-4 border-t flex justify-end items-center">
            <span className="text-sm font-medium mr-3">Advance (₹):</span>
            <input type="number" value={advance || ''} onChange={e => setAdvance(Number(e.target.value))} className="w-32 border-gray-300 rounded shadow-sm text-sm text-right p-1.5" />
          </div>
        </div>

        {/* Right Column: Previews */}
        <div className="col-span-12 lg:col-span-3 space-y-4 flex flex-col h-full">
          
          {/* Farmer Patti Preview */}
          <div className="bg-amber-50 p-3 rounded border border-amber-200 flex-1">
            <h3 className="text-xs font-bold text-amber-800 mb-2 border-b border-amber-200 pb-1">Farmer Patti Preview</h3>
            {pattiPreview ? (
              <div className="space-y-1.5 text-xs text-amber-900">
                <div className="flex justify-between"><span>Amount:</span><span>{formatCurrency(pattiPreview.totalAmount)}</span></div>
                <div className="flex justify-between"><span>Container (-):</span><span>{formatCurrency(pattiPreview.container)}</span></div>
                <div className="flex justify-between font-bold border-t border-amber-200 pt-1"><span>Gross:</span><span>{formatCurrency(pattiPreview.gross)}</span></div>
                <div className="flex justify-between"><span>Hamali (-):</span><span>{formatCurrency(pattiPreview.hamali)}</span></div>
                <div className="flex justify-between"><span>Tolai (-):</span><span>{formatCurrency(pattiPreview.tolai)}</span></div>
                <div className="flex justify-between text-red-600"><span>Advance (-):</span><span>{formatCurrency(advance)}</span></div>
                <div className="flex justify-between font-bold text-sm pt-1 border-t-2 border-amber-300 text-green-700">
                  <span>Patti Amt:</span><span>{formatCurrency(pattiPreview.pattiAmount)}</span>
                </div>
              </div>
            ) : <div className="text-xs text-amber-600/50">Awaiting items...</div>}
          </div>

          {/* Buyer Invoice Preview */}
          <div className="bg-blue-50 p-3 rounded border border-blue-200 flex-1">
            <h3 className="text-xs font-bold text-blue-800 mb-2 border-b border-blue-200 pb-1">Buyer Invoice Preview</h3>
            {invoicePreview ? (
              <div className="space-y-1.5 text-xs text-blue-900">
                <div className="flex justify-between"><span>Amount:</span><span>{formatCurrency(invoicePreview.totalAmount)}</span></div>
                <div className="flex justify-between"><span>Adat (+):</span><span>{formatCurrency(invoicePreview.adat)}</span></div>
                <div className="flex justify-between"><span>Container (+):</span><span>{formatCurrency(invoicePreview.container)}</span></div>
                <div className="flex justify-between"><span>Levy (+):</span><span>{formatCurrency(invoicePreview.levy)}</span></div>
                <div className="flex justify-between font-bold border-t border-blue-200 pt-1"><span>Comp. Supply:</span><span>{formatCurrency(invoicePreview.compositeSupply)}</span></div>
                <div className="flex justify-between"><span>CGST (+):</span><span>{formatCurrency(invoicePreview.cgst)}</span></div>
                <div className="flex justify-between"><span>SGST (+):</span><span>{formatCurrency(invoicePreview.sgst)}</span></div>
                <div className="flex justify-between font-bold border-t border-blue-200 pt-1"><span>Net Amount:</span><span>{formatCurrency(invoicePreview.netAmount)}</span></div>
                <div className="flex justify-between text-red-600"><span>TDS (-):</span><span>{formatCurrency(invoicePreview.tds)}</span></div>
                <div className="flex justify-between font-bold text-sm pt-1 border-t-2 border-blue-300 text-blue-800">
                  <span>Payable:</span><span>{formatCurrency(invoicePreview.payable)}</span>
                </div>
              </div>
            ) : <div className="text-xs text-blue-600/50">Awaiting items...</div>}
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-2">
            <Button onClick={() => handleSave('ALL')} disabled={loading} className="w-full bg-green-600 hover:bg-green-700 py-2 h-auto text-sm" icon={<Save size={16} />}>
              Save All Complete
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={() => handleSave('PATTI')} disabled={loading} variant="outline" className="w-full border-amber-500 text-amber-700 hover:bg-amber-50 py-1.5 text-xs h-auto">
                Save + Patti
              </Button>
              <Button onClick={() => handleSave('INVOICE')} disabled={loading} variant="outline" className="w-full border-blue-500 text-blue-700 hover:bg-blue-50 py-1.5 text-xs h-auto">
                Save + Invoice
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
