import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, FileText, ArrowLeft, Plus, Trash2, ArrowDownLeft, Calculator } from 'lucide-react';
import toast from 'react-hot-toast';
let _itemCtr = 0;
const nextItemId = () => `item-${++_itemCtr}`;
import { 
  getSettings, updateSettings, getAllFarmers, getAllBuyers, getActiveProducts, 
  addAwak, updateAwak, getAwakById, addInventoryMovement, addFarmerPatti 
} from '../../database/services';
import { calculateItemAmount, calculateFullFarmerPatti } from '../../calculations/billingEngine';
import { getTodayString, formatCurrency, formatWeight } from '../../utils/formatters';
import { Awak, Farmer, Buyer, Product, TransactionItem } from '../../types';
import { Button, Input, Select, Table, Thead, Tbody, Tr, Th, Td } from '../../components/ui';

export default function AwakForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<any>(null);

  // Form State
  const [awakNo, setAwakNo] = useState('');
  const [date, setDate] = useState(getTodayString());
  const [saudaDate, setSaudaDate] = useState(getTodayString());
  const [farmerId, setFarmerId] = useState('');
  const [village, setVillage] = useState('');
  const [buyerId, setBuyerId] = useState('');
  const [advance, setAdvance] = useState(0);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<TransactionItem[]>([{
    id: nextItemId(), productId: '', bags: 0, weightKg: 0, ratePerQuintal: 0, amount: 0
  }]);

  useEffect(() => {
    loadInitialData();
  }, [id]);

  const loadInitialData = async () => {
    try {
      const [fData, bData, pData, sData] = await Promise.all([
        getAllFarmers(), getAllBuyers(), getActiveProducts(), getSettings()
      ]);
      setFarmers(fData || []);
      setBuyers(bData || []);
      setProducts(pData || []);
      setSettings(sData || null);

      if (isEdit && id) {
        const awakData = await getAwakById(id);
        if (awakData) {
          setAwakNo(awakData.awakNo);
          setDate(awakData.date);
          setSaudaDate(awakData.saudaDate || awakData.date);
          setFarmerId(awakData.farmerId);
          setVillage(awakData.village || '');
          setBuyerId(awakData.buyerId || '');
          setAdvance(awakData.advance || 0);
          setNotes(awakData.notes || '');
          setItems(awakData.items && awakData.items.length ? awakData.items : [{
            id: nextItemId(), productId: '', bags: 0, weightKg: 0, ratePerQuintal: 0, amount: 0
          }]);
        }
      } else {
        setAwakNo(`AWK-${sData?.nextAwakNo || 1001}`);
      }
    } catch (err) {
      toast.error('Failed to load initial data');
      console.error(err);
    }
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
      if (product) {
        item.ratePerQuintal = product.defaultRate || 0;
      }
    }

    // Auto-calculate amount
    item.amount = calculateItemAmount(Number(item.weightKg) || 0, Number(item.ratePerQuintal) || 0);
    newItems[index] = item;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { id: nextItemId(), productId: '', bags: 0, weightKg: 0, ratePerQuintal: 0, amount: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    } else {
      toast('At least one item line is required', { icon: 'ℹ️' });
    }
  };

  // Preview Calculations
  const calcPreview = settings ? calculateFullFarmerPatti(items.filter(i => i.productId && i.weightKg > 0), advance, settings.rates) : null;

  const handleSave = async (generatePatti = false) => {
    if (!farmerId) {
      toast.error('Please select a farmer');
      return;
    }
    const validItems = items.filter(i => i.productId && (Number(i.weightKg) > 0 || Number(i.bags) > 0));
    if (validItems.length === 0) {
      toast.error('Please add at least one product with valid weight or bags');
      return;
    }

    setLoading(true);
    try {
      const totalBags = validItems.reduce((sum, item) => sum + (Number(item.bags) || 0), 0);
      const totalWeight = validItems.reduce((sum, item) => sum + (Number(item.weightKg) || 0), 0);
      const totalAmount = validItems.reduce((sum, item) => sum + item.amount, 0);

      const awakData: Omit<Awak, 'id'> = {
        awakNo,
        date,
        saudaDate,
        farmerId,
        village,
        buyerId,
        items: validItems,
        totalBags,
        totalWeight,
        totalAmount,
        advance,
        notes,
        status: generatePatti ? 'COMPLETED' : 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      let savedAwakId = id;
      if (isEdit && id) {
        await updateAwak(id, awakData);
      } else {
        savedAwakId = await addAwak(awakData);
        await updateSettings({ ...settings, nextAwakNo: settings.nextAwakNo + 1 });
      }

      // Record inventory movements for new awak
      if (!isEdit && savedAwakId) {
        for (const item of validItems) {
          await addInventoryMovement({
            productId: item.productId,
            type: 'IN',
            quantityBags: item.bags,
            weightKg: item.weightKg,
            referenceType: 'AWAK',
            referenceId: savedAwakId,
            date
          });
        }
      }

      if (generatePatti && savedAwakId && calcPreview) {
        const pattiNo = `FP-${settings.nextFarmerPattiNo}`;
        await addFarmerPatti({
          pattiNo,
          awakId: savedAwakId,
          date,
          farmerId,
          buyerId,
          items: validItems,
          totalBags,
          totalWeight,
          ...calcPreview,
          ratesSnapshot: settings.rates,
          status: 'GENERATED',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        await updateSettings({ 
          ...settings, 
          nextFarmerPattiNo: settings.nextFarmerPattiNo + 1, 
          nextAwakNo: isEdit ? settings.nextAwakNo : settings.nextAwakNo + 1 
        });
        toast.success(`Awak saved & Farmer Patti ${pattiNo} generated!`);
        navigate('/farmer-patti');
        return;
      }

      toast.success(isEdit ? 'Awak entry updated successfully!' : 'Awak entry saved successfully!');
      navigate('/awak');
    } catch (error) {
      console.error(error);
      toast.error('Failed to save Awak entry');
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
            onClick={() => navigate('/awak')}
            className="text-gray-500 hover:text-gray-900"
          >
            Back
          </Button>
          <div className="h-4 w-px bg-gray-200" />
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              {isEdit ? 'Edit Awak Arrival' : 'New Awak / Inward Arrival'}
            </h1>
            <p className="text-xs text-gray-500">Record incoming turmeric produce from farmer</p>
          </div>
        </div>
        <span className="font-mono text-xs px-2.5 py-1 bg-amber-50 text-amber-900 rounded-lg border border-amber-200 font-bold">
          {awakNo}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Arrival Particulars */}
          <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100 text-sm font-bold text-gray-800">
              <ArrowDownLeft size={16} className="text-[#C8920A]" />
              Arrival Particulars
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input 
                label="Awak Date" 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
                required 
              />
              <Input 
                label="Sauda / Deal Date" 
                type="date" 
                value={saudaDate} 
                onChange={(e) => setSaudaDate(e.target.value)} 
              />

              <Select 
                label="Farmer (Producer)" 
                value={farmerId} 
                onChange={handleFarmerChange} 
                required
                options={[{ label: 'Select Farmer...', value: '' }, ...farmers.map(f => ({ label: `${f.name} (${f.village})`, value: f.id }))]}
              />
              <Input 
                label="Village / Origin" 
                value={village} 
                onChange={(e) => setVillage(e.target.value)} 
                placeholder="Village name"
              />

              <div className="sm:col-span-2">
                <Select 
                  label="Intended Buyer (Optional / If Pre-sold)" 
                  value={buyerId} 
                  onChange={(e) => setBuyerId(e.target.value)}
                  options={[{ label: 'Select Buyer (Optional)...', value: '' }, ...buyers.map(b => ({ label: `${b.name} - ${b.city}`, value: b.id }))]}
                />
              </div>
            </div>
          </div>

          {/* Card 2: Produce Items Table */}
          <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <div className="text-sm font-bold text-gray-800">Commodity Items</div>
              <Button 
                onClick={addItem} 
                size="sm" 
                variant="outline" 
                icon={<Plus size={14} />}
              >
                Add Row
              </Button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="pb-2.5">Turmeric Grade</th>
                    <th className="pb-2.5 w-24 text-right">Bags</th>
                    <th className="pb-2.5 w-28 text-right">Weight (Kg)</th>
                    <th className="pb-2.5 w-28 text-right">Rate / Qtl</th>
                    <th className="pb-2.5 w-32 text-right">Amount (₹)</th>
                    <th className="pb-2.5 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-gray-50/50">
                      <td className="py-2.5 pr-2">
                        <select 
                          value={item.productId} 
                          onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                          className="w-full h-9 px-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#C8920A]/20"
                        >
                          <option value="">Select Grade...</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2.5 px-2">
                        <input 
                          type="number" 
                          min="0"
                          value={item.bags || ''} 
                          onChange={(e) => handleItemChange(idx, 'bags', Number(e.target.value))} 
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
                          onChange={(e) => handleItemChange(idx, 'weightKg', Number(e.target.value))} 
                          className="w-full h-9 px-2 text-sm text-right border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#C8920A]/20" 
                          placeholder="0.0"
                        />
                      </td>
                      <td className="py-2.5 px-2">
                        <input 
                          type="number" 
                          min="0"
                          value={item.ratePerQuintal || ''} 
                          onChange={(e) => handleItemChange(idx, 'ratePerQuintal', Number(e.target.value))} 
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
                          className="p-1 text-gray-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Remove Row"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Card 3: Advance & Notes */}
          <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="text-sm font-bold text-gray-800 pb-2 border-b border-gray-100">
              Payment & Notes
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input 
                label="Advance Cash Paid to Farmer (₹)" 
                type="number" 
                min="0"
                value={advance || ''} 
                onChange={(e) => setAdvance(Number(e.target.value))} 
                placeholder="0"
              />
              <Input 
                label="Notes / Remarks" 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
                placeholder="Vehicle no, moisture condition, etc." 
              />
            </div>
          </div>
        </div>

        {/* Right Sticky Calculation Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-amber-200/90 rounded-2xl p-6 shadow-sm sticky top-6 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <Calculator size={18} className="text-[#C8920A]" />
              <h2 className="text-base font-bold text-gray-900 tracking-tight">Settlement Summary</h2>
            </div>
            
            {calcPreview ? (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Total Bags:</span>
                  <span className="font-semibold text-gray-900">{calcPreview.totalBags}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Gross Weight:</span>
                  <span className="font-semibold text-gray-900">{formatWeight(calcPreview.totalWeight)}</span>
                </div>
                <div className="flex justify-between font-semibold pt-2 border-t border-gray-100 text-gray-900">
                  <span>Total Value:</span>
                  <span className="font-mono">{formatCurrency(calcPreview.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Less: Container:</span>
                  <span className="font-mono">-{formatCurrency(calcPreview.container)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Less: Hamali:</span>
                  <span className="font-mono">-{formatCurrency(calcPreview.hamali)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Less: Tolai:</span>
                  <span className="font-mono">-{formatCurrency(calcPreview.tolai)}</span>
                </div>
                {advance > 0 && (
                  <div className="flex justify-between text-xs font-semibold text-rose-600">
                    <span>Less: Advance Paid:</span>
                    <span className="font-mono">-{formatCurrency(advance)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center font-bold text-base pt-3 border-t-2 border-amber-200 text-emerald-700">
                  <span>Net Farmer Due:</span>
                  <span className="font-mono text-lg">{formatCurrency(calcPreview.pattiAmount)}</span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-gray-400 text-center py-6">
                Select a product and enter weight to see live calculation
              </div>
            )}

            <div className="pt-2 flex flex-col gap-2.5">
              <Button 
                onClick={() => handleSave(true)} 
                loading={loading}
                variant="success"
                className="w-full justify-center"
                icon={<FileText size={16} />}
              >
                Save & Generate Patti
              </Button>
              <Button 
                onClick={() => handleSave(false)} 
                loading={loading}
                variant="primary"
                className="w-full justify-center"
                icon={<Save size={16} />}
              >
                Save Awak Inward Only
              </Button>
              <Button 
                onClick={() => navigate('/awak')} 
                disabled={loading}
                variant="ghost"
                className="w-full justify-center text-gray-500 hover:text-gray-800"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
