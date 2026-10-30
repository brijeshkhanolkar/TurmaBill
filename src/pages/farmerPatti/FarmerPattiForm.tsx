import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, Plus, Trash2, Calculator, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
let _fpCounter = 0;
const nextItemId = () => `patti-item-${++_fpCounter}`;
import { 
  getSettings, updateSettings, getAllFarmers, getAllBuyers, getActiveProducts, 
  addFarmerPatti, updateFarmerPatti, getFarmerPattiById, getAwakById 
} from '../../database/services';
import { calculateItemAmount, calculateFullFarmerPatti } from '../../calculations/billingEngine';
import { getTodayString, formatCurrency, formatWeight } from '../../utils/formatters';
import { FarmerPatti, Farmer, Buyer, Product, TransactionItem } from '../../types';
import { Button, Input, Select, Table, Thead, Tbody, Tr, Th, Td } from '../../components/ui';

export default function FarmerPattiForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<any>(null);

  const [pattiNo, setPattiNo] = useState('');
  const [date, setDate] = useState(getTodayString());
  const [farmerId, setFarmerId] = useState('');
  const [buyerId, setBuyerId] = useState('');
  const [awakId, setAwakId] = useState('');
  const [advance, setAdvance] = useState(0);
  const [items, setItems] = useState<TransactionItem[]>([{
    id: nextItemId(), productId: '', bags: 0, weightKg: 0, ratePerQuintal: 0, amount: 0
  }]);

  useEffect(() => {
    loadInitial();
  }, [id]);

  const loadInitial = async () => {
    try {
      const [fData, bData, pData, sData] = await Promise.all([
        getAllFarmers(), getAllBuyers(), getActiveProducts(), getSettings()
      ]);
      setFarmers(fData || []);
      setBuyers(bData || []);
      setProducts(pData || []);
      setSettings(sData || null);

      if (isEdit && id) {
        const patti = await getFarmerPattiById(id);
        if (patti) {
          setPattiNo(patti.pattiNo || (patti as any).pattiNumber || '');
          setDate(patti.date);
          setFarmerId(patti.farmerId);
          setBuyerId(patti.buyerId || '');
          setAwakId(patti.awakId || '');
          setAdvance(patti.advance || 0);
          setItems(patti.items && patti.items.length ? patti.items : [{
            id: nextItemId(), productId: '', bags: 0, weightKg: 0, ratePerQuintal: 0, amount: 0
          }]);
        }
      } else {
        setPattiNo(`FP-${sData?.nextFarmerPattiNo || 1001}`);
        const params = new URLSearchParams(window.location.search);
        const linkedAwak = params.get('awakId');
        if (linkedAwak) {
          const awak = await getAwakById(linkedAwak);
          if (awak) {
            setAwakId(linkedAwak);
            setFarmerId(awak.farmerId);
            setBuyerId(awak.buyerId || '');
            setAdvance(awak.advance || 0);
            if (awak.items && awak.items.length) setItems(awak.items);
          }
        }
      }
    } catch (e) {
      toast.error('Failed to load patti master data');
      console.error(e);
    }
  };

  const handleItemChange = (index: number, field: keyof TransactionItem, value: any) => {
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

  const addItem = () => setItems([...items, { id: nextItemId(), productId: '', bags: 0, weightKg: 0, ratePerQuintal: 0, amount: 0 }]);
  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    } else {
      toast('At least one item line is required', { icon: 'ℹ️' });
    }
  };

  const validItems = items.filter(i => i.productId && Number(i.weightKg) > 0);
  const calc = settings ? calculateFullFarmerPatti(validItems, advance, settings.rates) : null;

  const handleSave = async () => {
    if (!farmerId) {
      toast.error('Please select a farmer');
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

      const pattiData: Omit<FarmerPatti, 'id'> = {
        pattiNo, awakId, date, farmerId, buyerId, items: validItems, totalBags, totalWeight,
        advance, ...calc!, ratesSnapshot: settings.rates, status: 'GENERATED',
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
      };

      if (isEdit && id) {
        await updateFarmerPatti(id, pattiData);
        toast.success(`Farmer Patti ${pattiNo} updated!`);
        navigate(`/farmer-patti/${id}`);
      } else {
        const newId = await addFarmerPatti(pattiData);
        await updateSettings({ ...settings, nextFarmerPattiNo: settings.nextFarmerPattiNo + 1 });
        toast.success(`Farmer Patti ${pattiNo} created!`);
        navigate(`/farmer-patti/${newId}`);
      }
    } catch (e) {
      console.error(e);
      toast.error('Error saving Farmer Patti');
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
              {isEdit ? 'Edit Farmer Patti' : 'New Farmer Patti'}
            </h1>
            <p className="text-xs text-gray-500">Calculate net produce payment after deductions</p>
          </div>
        </div>
        <span className="font-mono text-xs px-2.5 py-1 bg-amber-50 text-amber-900 rounded-lg border border-amber-200 font-bold">
          {pattiNo}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="text-sm font-bold text-gray-800 pb-2 border-b border-gray-100 flex items-center gap-2">
              <FileText size={16} className="text-[#C8920A]" />
              Settlement Particulars
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Patti Date" type="date" value={date} onChange={e => setDate(e.target.value)} required />
              <Select 
                label="Farmer (Producer)" 
                value={farmerId} 
                onChange={e => setFarmerId(e.target.value)} 
                required
                options={[{ label: 'Select Farmer...', value: '' }, ...farmers.map(f => ({ label: `${f.name} (${f.village || ''})`, value: f.id }))]} 
              />
              <Select 
                label="Buyer (Optional)" 
                value={buyerId} 
                onChange={e => setBuyerId(e.target.value)}
                options={[{ label: 'Select Buyer (Optional)...', value: '' }, ...buyers.map(b => ({ label: `${b.name} - ${b.city || ''}`, value: b.id }))]} 
              />
              <Input label="Advance Paid (₹)" type="number" min="0" value={advance || ''} onChange={e => setAdvance(Number(e.target.value))} placeholder="0" />
              {awakId && (
                <div className="sm:col-span-2">
                  <span className="text-xs text-gray-500 font-mono">Linked Awak: #{awakId}</span>
                </div>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <span className="text-sm font-bold text-gray-800">Commodity Lines</span>
              <Button onClick={addItem} size="sm" variant="outline" icon={<Plus size={14} />}>Add Item</Button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="pb-2">Grade</th>
                    <th className="pb-2 w-24 text-right">Bags</th>
                    <th className="pb-2 w-28 text-right">Weight (Kg)</th>
                    <th className="pb-2 w-28 text-right">Rate / Qtl</th>
                    <th className="pb-2 w-32 text-right">Amount (₹)</th>
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
                          className="w-full h-9 px-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#C8920A]/20"
                        >
                          <option value="">Select Grade...</option>
                          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </td>
                      <td className="py-2.5 px-2">
                        <input 
                          type="number" 
                          min="0"
                          value={item.bags || ''} 
                          onChange={e => handleItemChange(idx, 'bags', Number(e.target.value))} 
                          className="w-full h-9 px-2 text-sm text-right border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#C8920A]/20" 
                          placeholder="0"
                        />
                      </td>
                      <td className="py-2.5 px-2">
                        <input 
                          type="number" 
                          step="0.1" 
                          min="0"
                          value={item.weightKg || ''} 
                          onChange={e => handleItemChange(idx, 'weightKg', Number(e.target.value))} 
                          className="w-full h-9 px-2 text-sm text-right border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#C8920A]/20" 
                          placeholder="0.0"
                        />
                      </td>
                      <td className="py-2.5 px-2">
                        <input 
                          type="number" 
                          min="0"
                          value={item.ratePerQuintal || ''} 
                          onChange={e => handleItemChange(idx, 'ratePerQuintal', Number(e.target.value))} 
                          className="w-full h-9 px-2 text-sm text-right border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#C8920A]/20" 
                          placeholder="0"
                        />
                      </td>
                      <td className="py-2.5 px-2 text-right font-bold text-gray-900 font-mono text-sm">
                        {formatCurrency(item.amount)}
                      </td>
                      <td className="py-2.5 pl-2 text-center">
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

        {/* Calculations Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-amber-200/90 rounded-2xl p-6 shadow-sm sticky top-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <Calculator size={18} className="text-[#C8920A]" />
              <h2 className="text-base font-bold text-gray-900 tracking-tight">Settlement Summary</h2>
            </div>

            {calc ? (
              <div className="space-y-2.5 text-sm text-gray-700">
                <div className="flex justify-between">
                  <span>Total Amount:</span>
                  <span className="font-mono font-medium">{formatCurrency(calc.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Less Container:</span>
                  <span className="font-mono">-{formatCurrency(calc.container)}</span>
                </div>
                <div className="flex justify-between font-semibold border-t border-gray-100 pt-2 text-gray-900">
                  <span>Gross Produce Base:</span>
                  <span className="font-mono">{formatCurrency(calc.gross)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Less Hamali:</span>
                  <span className="font-mono">-{formatCurrency(calc.hamali)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Less Tolai:</span>
                  <span className="font-mono">-{formatCurrency(calc.tolai)}</span>
                </div>
                {advance > 0 && (
                  <div className="flex justify-between text-xs font-semibold text-rose-600">
                    <span>Less Advance Paid:</span>
                    <span className="font-mono">-{formatCurrency(advance)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center font-bold text-base pt-3 border-t-2 border-amber-200 text-emerald-700">
                  <span>Net Payable:</span>
                  <span className="font-mono text-lg">{formatCurrency(calc.pattiAmount)}</span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-gray-400 py-6 text-center">Enter produce lines to calculate deductions</div>
            )}
            
            <div className="pt-2">
              <Button 
                onClick={handleSave} 
                loading={loading}
                variant="primary" 
                className="w-full justify-center" 
                icon={<Save size={16} />}
              >
                {isEdit ? 'Update Farmer Patti' : 'Save & Issue Patti'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
