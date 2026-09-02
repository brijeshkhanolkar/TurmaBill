import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Save, FileText, ArrowLeft, Plus, X } from 'lucide-react';
let _itemCtr = 0;
const nextItemId = () => `item-${++_itemCtr}`;
import { 
  getSettings, updateSettings, getAllFarmers, getAllBuyers, getActiveProducts, 
  addFarmerPatti, updateFarmerPatti, getFarmerPattiById, getAwakById 
} from '../../database/services';
import { calculateItemAmount, calculateFullFarmerPatti } from '../../calculations/billingEngine';
import { getTodayString, formatCurrency, formatWeight } from '../../utils/formatters';
import { FarmerPatti, TransactionItem } from '../../types';
import { Button, Input, Select, Table, Thead, Tbody, Tr, Th, Td } from '../../components/ui';

export default function FarmerPattiForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const awakIdParam = searchParams.get('awakId');
  
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [farmers, setFarmers] = useState<any[]>([]);
  const [buyers, setBuyers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  // State
  const [pattiNo, setPattiNo] = useState('');
  const [awakId, setAwakId] = useState<string | undefined>(undefined);
  const [date, setDate] = useState(getTodayString());
  const [farmerId, setFarmerId] = useState('');
  const [buyerId, setBuyerId] = useState('');
  const [advance, setAdvance] = useState(0);
  const [items, setItems] = useState<TransactionItem[]>([{ id: nextItemId(), productId: '', bags: 0, weightKg: 0, ratePerQuintal: 0, amount: 0 }]);

  useEffect(() => { loadData(); }, [id, awakIdParam]);

  const loadData = async () => {
    const [f, b, p, s] = await Promise.all([getAllFarmers(), getAllBuyers(), getActiveProducts(), getSettings()]);
    setFarmers(f); setBuyers(b); setProducts(p); setSettings(s);

    if (isEdit && id) {
      const data = await getFarmerPattiById(id);
      if (data) {
        setPattiNo(data.pattiNo);
        setAwakId(data.awakId);
        setDate(data.date);
        setFarmerId(data.farmerId);
        setBuyerId(data.buyerId || '');
        setAdvance(data.advance || 0); // Need to calculate if advance wasn't stored, but it should be derived or stored in Awak
        setItems(data.items);
      }
    } else if (awakIdParam) {
      const awak = await getAwakById(awakIdParam);
      if (awak) {
        setPattiNo(`FP-${s.nextFarmerPattiNo}`);
        setAwakId(awak.id);
        setDate(awak.date);
        setFarmerId(awak.farmerId);
        setBuyerId(awak.buyerId || '');
        setAdvance(awak.advance || 0);
        setItems(awak.items);
      }
    } else {
      setPattiNo(`FP-${s.nextFarmerPattiNo}`);
    }
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
  const calc = settings ? calculateFullFarmerPatti(validItems, advance, settings.rates) : null;

  const handleSave = async () => {
    if (!farmerId || validItems.length === 0) return alert("Fill required fields.");
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
        navigate(`/patti/view/${id}`);
      } else {
        const newId = await addFarmerPatti(pattiData);
        await updateSettings({ ...settings, nextFarmerPattiNo: settings.nextFarmerPattiNo + 1 });
        navigate(`/patti/view/${newId}`);
      }
    } catch (e) {
      console.error(e);
      alert("Error saving Patti");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{isEdit ? 'Edit Farmer Patti' : 'New Farmer Patti'}</h1>
        <Button variant="ghost" onClick={() => navigate(-1)} icon={<ArrowLeft size={16} />}>Back</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-white p-6 rounded shadow-sm border border-gray-200 grid grid-cols-2 gap-4">
            <Input label="Patti No" value={pattiNo} disabled />
            <Input label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} required />
            <Select label="Farmer" value={farmerId} onChange={e => setFarmerId(e.target.value)} required
              options={[{ label: 'Select...', value: '' }, ...farmers.map(f => ({ label: f.name, value: f.id }))]} />
            <Select label="Buyer (Optional)" value={buyerId} onChange={e => setBuyerId(e.target.value)}
              options={[{ label: 'Select...', value: '' }, ...buyers.map(b => ({ label: b.name, value: b.id }))]} />
            {awakId && <Input label="Linked Awak ID" value={awakId} disabled />}
            <Input label="Advance (₹)" type="number" value={advance || ''} onChange={e => setAdvance(Number(e.target.value))} />
          </div>

          <div className="bg-white p-6 rounded shadow-sm border border-gray-200">
            <div className="flex justify-between mb-4 border-b pb-2"><h2 className="font-semibold">Items</h2><Button onClick={addItem} size="sm" variant="outline"><Plus size={16}/></Button></div>
            <Table>
              <Thead><Tr><Th>Item</Th><Th>Bags</Th><Th>Weight</Th><Th>Rate</Th><Th>Amount</Th><Th></Th></Tr></Thead>
              <Tbody>
                {items.map((item, idx) => (
                  <Tr key={item.id}>
                    <Td><Select value={item.productId} onChange={e => handleItemChange(idx, 'productId', e.target.value)} options={[{ label: 'Select...', value: '' }, ...products.map(p => ({ label: p.name, value: p.id }))]} className="mb-0"/></Td>
                    <Td><Input type="number" value={item.bags || ''} onChange={e => handleItemChange(idx, 'bags', Number(e.target.value))} className="mb-0 text-right"/></Td>
                    <Td><Input type="number" step="0.001" value={item.weightKg || ''} onChange={e => handleItemChange(idx, 'weightKg', Number(e.target.value))} className="mb-0 text-right"/></Td>
                    <Td><Input type="number" value={item.ratePerQuintal || ''} onChange={e => handleItemChange(idx, 'ratePerQuintal', Number(e.target.value))} className="mb-0 text-right"/></Td>
                    <Td className="text-right font-medium pt-3">{formatCurrency(item.amount)}</Td>
                    <Td><button onClick={() => removeItem(idx)} className="text-red-500 mt-2"><X size={18}/></button></Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </div>
        </div>

        <div className="col-span-1">
          <div className="bg-amber-50 p-6 rounded border border-amber-200 sticky top-6">
            <h2 className="text-lg font-bold text-amber-900 mb-4 border-b border-amber-200 pb-2">Calculation</h2>
            {calc ? (
              <div className="space-y-3 text-sm text-amber-900">
                <div className="flex justify-between"><span>Amount:</span><span>{formatCurrency(calc.totalAmount)}</span></div>
                <div className="flex justify-between"><span>Container (-):</span><span>{formatCurrency(calc.container)}</span></div>
                <div className="flex justify-between font-bold border-t border-amber-200 pt-2"><span>Gross:</span><span>{formatCurrency(calc.gross)}</span></div>
                <div className="flex justify-between"><span>Hamali (-):</span><span>{formatCurrency(calc.hamali)}</span></div>
                <div className="flex justify-between"><span>Tolai (-):</span><span>{formatCurrency(calc.tolai)}</span></div>
                <div className="flex justify-between text-red-600"><span>Advance (-):</span><span>{formatCurrency(advance)}</span></div>
                <div className="flex justify-between font-bold text-lg pt-3 border-t-2 border-amber-300 text-green-700">
                  <span>Net Payable:</span><span>{formatCurrency(calc.pattiAmount)}</span>
                </div>
              </div>
            ) : <div className="text-center text-amber-700">Add items</div>}
            
            <Button onClick={handleSave} disabled={loading} className="w-full mt-6 bg-amber-600 hover:bg-amber-700" icon={<Save size={18}/>}>
              Save Patti
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
