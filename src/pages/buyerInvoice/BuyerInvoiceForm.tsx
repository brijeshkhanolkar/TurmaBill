import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, Plus, X } from 'lucide-react';
let _itemCtr = 0;
const nextItemId = () => `item-${++_itemCtr}`;
import { 
  getSettings, updateSettings, getAllBuyers, getActiveProducts, getAllFarmers,
  addBuyerInvoice, updateBuyerInvoice, getBuyerInvoiceById, addInventoryMovement 
} from '../../database/services';
import { calculateItemAmount, calculateFullBuyerInvoice } from '../../calculations/billingEngine';
import { getTodayString, formatCurrency } from '../../utils/formatters';
import { BuyerInvoice, BuyerInvoiceItem } from '../../types';
import { Button, Input, Select, Table, Thead, Tbody, Tr, Th, Td } from '../../components/ui';

export default function BuyerInvoiceForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [buyers, setBuyers] = useState<any[]>([]);
  const [farmers, setFarmers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  const [invoiceNo, setInvoiceNo] = useState('');
  const [date, setDate] = useState(getTodayString());
  const [saudaDate, setSaudaDate] = useState(getTodayString());
  const [buyerId, setBuyerId] = useState('');
  const [hsnCode, setHsnCode] = useState('0910');
  
  const [items, setItems] = useState<BuyerInvoiceItem[]>([{ id: nextItemId(), farmerId: '', productId: '', bags: 0, weightKg: 0, ratePerQuintal: 0, amount: 0 }]);

  useEffect(() => { loadData(); }, [id]);

  const loadData = async () => {
    const [b, f, p, s] = await Promise.all([getAllBuyers(), getAllFarmers(), getActiveProducts(), getSettings()]);
    setBuyers(b); setFarmers(f); setProducts(p); setSettings(s);

    if (isEdit && id) {
      const data = await getBuyerInvoiceById(id);
      if (data) {
        setInvoiceNo(data.invoiceNo);
        setDate(data.date);
        setSaudaDate(data.saudaDate);
        setBuyerId(data.buyerId);
        setHsnCode(data.hsnCode || '0910');
        setItems(data.items);
      }
    } else {
      setInvoiceNo(`INV-${s.nextBuyerInvoiceNo}`);
    }
  };

  const handleItemChange = (index: number, field: keyof BuyerInvoiceItem, value: any) => {
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

  const addItem = () => setItems([...items, { id: nextItemId(), farmerId: '', productId: '', bags: 0, weightKg: 0, ratePerQuintal: 0, amount: 0 }]);
  const removeItem = (index: number) => items.length > 1 && setItems(items.filter((_, i) => i !== index));

  const validItems = items.filter(i => i.productId && i.weightKg > 0);
  const calc = settings ? calculateFullBuyerInvoice(validItems, settings.rates) : null;

  const handleSave = async (andPrint = false) => {
    if (!buyerId || validItems.length === 0) return alert("Fill buyer and at least one item.");
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
      }
      navigate(andPrint ? `/invoice/view/${savedId}` : '/invoice');
    } catch (e) {
      console.error(e);
      alert("Error saving Invoice");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{isEdit ? 'Edit Buyer Invoice' : 'New Buyer Invoice'}</h1>
        <Button variant="ghost" onClick={() => navigate(-1)} icon={<ArrowLeft size={16} />}>Back</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="col-span-3 space-y-6">
          <div className="bg-white p-6 rounded shadow-sm border border-gray-200 grid grid-cols-2 gap-4">
            <Select label="Buyer" value={buyerId} onChange={e => setBuyerId(e.target.value)} required
              options={[{ label: 'Select...', value: '' }, ...buyers.map(b => ({ label: b.name, value: b.id }))]} />
            <Input label="Invoice No" value={invoiceNo} disabled />
            <Input label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} required />
            <Input label="Sauda Date" type="date" value={saudaDate} onChange={e => setSaudaDate(e.target.value)} />
            <Input label="HSN Code" value={hsnCode} onChange={e => setHsnCode(e.target.value)} />
          </div>

          <div className="bg-white p-6 rounded shadow-sm border border-gray-200">
            <div className="flex justify-between mb-4 border-b pb-2"><h2 className="font-semibold">Items</h2><Button onClick={addItem} size="sm" variant="outline"><Plus size={16}/></Button></div>
            <div className="overflow-x-auto">
              <Table>
                <Thead><Tr><Th>Farmer (Opt)</Th><Th>Item</Th><Th>Bags</Th><Th>Weight</Th><Th>Rate</Th><Th>Amount</Th><Th></Th></Tr></Thead>
                <Tbody>
                  {items.map((item, idx) => (
                    <Tr key={item.id}>
                      <Td><Select value={item.farmerId || ''} onChange={e => handleItemChange(idx, 'farmerId', e.target.value)} options={[{ label: 'Select...', value: '' }, ...farmers.map(f => ({ label: f.name, value: f.id }))]} className="mb-0 w-32"/></Td>
                      <Td><Select value={item.productId} onChange={e => handleItemChange(idx, 'productId', e.target.value)} options={[{ label: 'Select...', value: '' }, ...products.map(p => ({ label: p.name, value: p.id }))]} className="mb-0 w-32"/></Td>
                      <Td><Input type="number" value={item.bags || ''} onChange={e => handleItemChange(idx, 'bags', Number(e.target.value))} className="mb-0 text-right w-20"/></Td>
                      <Td><Input type="number" step="0.001" value={item.weightKg || ''} onChange={e => handleItemChange(idx, 'weightKg', Number(e.target.value))} className="mb-0 text-right w-24"/></Td>
                      <Td><Input type="number" value={item.ratePerQuintal || ''} onChange={e => handleItemChange(idx, 'ratePerQuintal', Number(e.target.value))} className="mb-0 text-right w-24"/></Td>
                      <Td className="text-right font-medium pt-3">{formatCurrency(item.amount)}</Td>
                      <Td><button onClick={() => removeItem(idx)} className="text-red-500 mt-2"><X size={18}/></button></Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </div>
          </div>
        </div>

        <div className="col-span-1">
          <div className="bg-blue-50 p-6 rounded border border-blue-200 sticky top-6">
            <h2 className="text-lg font-bold text-blue-900 mb-4 border-b border-blue-200 pb-2">Calculation</h2>
            {calc ? (
              <div className="space-y-3 text-sm text-blue-900">
                <div className="flex justify-between"><span>Amount:</span><span>{formatCurrency(calc.totalAmount)}</span></div>
                <div className="flex justify-between"><span>Adat (+):</span><span>{formatCurrency(calc.adat)}</span></div>
                <div className="flex justify-between"><span>Container (+):</span><span>{formatCurrency(calc.container)}</span></div>
                <div className="flex justify-between"><span>Levy (+):</span><span>{formatCurrency(calc.levy)}</span></div>
                <div className="flex justify-between font-bold border-t border-blue-200 pt-2"><span>Comp. Supply:</span><span>{formatCurrency(calc.compositeSupply)}</span></div>
                <div className="flex justify-between"><span>CGST (+):</span><span>{formatCurrency(calc.cgst)}</span></div>
                <div className="flex justify-between"><span>SGST (+):</span><span>{formatCurrency(calc.sgst)}</span></div>
                <div className="flex justify-between font-bold border-t border-blue-200 pt-2"><span>Net Amount:</span><span>{formatCurrency(calc.netAmount)}</span></div>
                <div className="flex justify-between text-red-600"><span>TDS (-):</span><span>{formatCurrency(calc.tds)}</span></div>
                <div className="flex justify-between font-bold text-lg pt-3 border-t-2 border-blue-300 text-blue-800">
                  <span>Payable:</span><span>{formatCurrency(calc.payable)}</span>
                </div>
              </div>
            ) : <div className="text-center text-blue-700">Add items</div>}
            
            <div className="mt-6 space-y-3">
              <Button onClick={() => handleSave(true)} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700" icon={<Save size={18}/>}>
                Save & Print
              </Button>
              <Button onClick={() => handleSave(false)} disabled={loading} variant="outline" className="w-full border-blue-600 text-blue-700 hover:bg-blue-100">
                Save Invoice Only
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
