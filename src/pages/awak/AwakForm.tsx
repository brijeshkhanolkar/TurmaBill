import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, FileText, X, Plus } from 'lucide-react';
let _itemCtr = 0;
const nextItemId = () => `item-${++_itemCtr}`;
import { 
  getSettings, updateSettings, getAllFarmers, getAllBuyers, getActiveProducts, 
  addAwak, updateAwak, getAwakById, addInventoryMovement, addFarmerPatti 
} from '../../database/services';
import { calculateItemAmount, calculateFullFarmerPatti } from '../../calculations/billingEngine';
import { getTodayString, formatCurrency, formatWeight } from '../../utils/formatters';
import { Awak, Farmer, Buyer, Product, TransactionItem, RatesSnapshot } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Table, Thead, Tbody, Tr, Th, Td } from '../../components/ui/Table';

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
    const [fData, bData, pData, sData] = await Promise.all([
      getAllFarmers(), getAllBuyers(), getActiveProducts(), getSettings()
    ]);
    setFarmers(fData);
    setBuyers(bData);
    setProducts(pData);
    setSettings(sData);

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
        setItems(awakData.items || []);
      }
    } else {
      setAwakNo(`AWK-${sData.nextAwakNo}`);
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
    }
  };

  // Preview Calculations
  const calcPreview = settings ? calculateFullFarmerPatti(items.filter(i => i.productId && i.weightKg > 0), advance, settings.rates) : null;

  const handleSave = async (generatePatti = false) => {
    if (!farmerId || items.some(i => !i.productId || i.weightKg <= 0)) {
      alert("Please fill all required fields correctly.");
      return;
    }

    setLoading(true);
    try {
      const validItems = items.filter(i => i.productId && i.weightKg > 0);
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
        // Update awak counter
        await updateSettings({ ...settings, nextAwakNo: settings.nextAwakNo + 1 });
      }

      // Record inventory movements for new awak (simplification: only for new)
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
        await updateSettings({ ...settings, nextFarmerPattiNo: settings.nextFarmerPattiNo + 1, nextAwakNo: isEdit ? settings.nextAwakNo : settings.nextAwakNo + 1 });
      }

      alert("Saved successfully!");
      navigate(generatePatti ? '/patti' : '/awak');
    } catch (error) {
      console.error(error);
      alert("Error saving data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{isEdit ? 'Edit Awak' : 'New Awak / Inward'}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          {/* Top Section */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">Awak Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Awak No" value={awakNo} disabled className="bg-gray-50" />
              <Input label="Awak Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              
              <Select label="Farmer" value={farmerId} onChange={handleFarmerChange} required
                options={[{ label: 'Select Farmer...', value: '' }, ...farmers.map(f => ({ label: f.name, value: f.id }))]}
              />
              <Input label="Village" value={village} onChange={(e) => setVillage(e.target.value)} />
              
              <Select label="Buyer (Optional)" value={buyerId} onChange={(e) => setBuyerId(e.target.value)}
                options={[{ label: 'Select Buyer...', value: '' }, ...buyers.map(b => ({ label: b.name, value: b.id }))]}
              />
              <Input label="Sauda Date" type="date" value={saudaDate} onChange={(e) => setSaudaDate(e.target.value)} />
            </div>
          </div>

          {/* Items Section */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h2 className="text-lg font-semibold text-gray-700">Product Items</h2>
              <Button onClick={addItem} size="sm" variant="outline" icon={<Plus size={16} />}>Add Item</Button>
            </div>
            
            <div className="overflow-x-auto">
              <Table>
                <Thead>
                  <Tr>
                    <Th>Item</Th>
                    <Th className="w-24 text-right">Bags</Th>
                    <Th className="w-28 text-right">Weight (Kg)</Th>
                    <Th className="w-28 text-right">Rate/Qtl</Th>
                    <Th className="w-32 text-right">Amount</Th>
                    <Th className="w-12"></Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {items.map((item, idx) => (
                    <Tr key={item.id}>
                      <Td>
                        <Select 
                          value={item.productId} 
                          onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                          options={[{ label: 'Select...', value: '' }, ...products.map(p => ({ label: p.name, value: p.id }))]}
                          className="mb-0"
                        />
                      </Td>
                      <Td>
                        <Input type="number" value={item.bags || ''} onChange={(e) => handleItemChange(idx, 'bags', Number(e.target.value))} className="mb-0 text-right" />
                      </Td>
                      <Td>
                        <Input type="number" step="0.001" value={item.weightKg || ''} onChange={(e) => handleItemChange(idx, 'weightKg', Number(e.target.value))} className="mb-0 text-right" />
                      </Td>
                      <Td>
                        <Input type="number" value={item.ratePerQuintal || ''} onChange={(e) => handleItemChange(idx, 'ratePerQuintal', Number(e.target.value))} className="mb-0 text-right" />
                      </Td>
                      <Td className="text-right font-medium text-gray-800 pt-3">{formatCurrency(item.amount)}</Td>
                      <Td>
                        <button onClick={() => removeItem(idx)} className="text-red-500 hover:text-red-700 p-1 mt-1"><X size={18} /></button>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">Additional Info</h2>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Advance Given (₹)" type="number" value={advance || ''} onChange={(e) => setAdvance(Number(e.target.value))} />
              <Input label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Remarks..." />
            </div>
          </div>
        </div>

        {/* Live Calculation Preview */}
        <div className="col-span-1">
          <div className="bg-amber-50 p-6 rounded-lg shadow-sm border border-amber-200 sticky top-6">
            <h2 className="text-lg font-bold text-amber-900 mb-4 border-b border-amber-200 pb-2">Farmer Patti Preview</h2>
            
            {calcPreview ? (
              <div className="space-y-3 text-sm text-amber-900">
                <div className="flex justify-between">
                  <span>Total Bags:</span>
                  <span className="font-medium">{calcPreview.totalBags}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Weight:</span>
                  <span className="font-medium">{formatWeight(calcPreview.totalWeight)} Kg</span>
                </div>
                <div className="flex justify-between font-semibold pt-2 border-t border-amber-200">
                  <span>Total Amount:</span>
                  <span>{formatCurrency(calcPreview.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-amber-700">
                  <span>Less: Container (-):</span>
                  <span>{formatCurrency(calcPreview.container)}</span>
                </div>
                <div className="flex justify-between font-semibold pt-2 border-t border-amber-200">
                  <span>Gross Amount:</span>
                  <span>{formatCurrency(calcPreview.gross)}</span>
                </div>
                <div className="flex justify-between text-amber-700">
                  <span>Less: Hamali (-):</span>
                  <span>{formatCurrency(calcPreview.hamali)}</span>
                </div>
                <div className="flex justify-between text-amber-700">
                  <span>Less: Tolai (-):</span>
                  <span>{formatCurrency(calcPreview.tolai)}</span>
                </div>
                <div className="flex justify-between text-red-600 font-medium">
                  <span>Less: Advance (-):</span>
                  <span>{formatCurrency(advance)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-3 border-t-2 border-amber-300 text-green-700">
                  <span>Net Payable:</span>
                  <span>{formatCurrency(calcPreview.pattiAmount)}</span>
                </div>
              </div>
            ) : (
              <div className="text-amber-700 text-center py-8">Add items to see preview</div>
            )}

            <div className="mt-8 flex flex-col space-y-3">
              <Button 
                onClick={() => handleSave(true)} 
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white shadow-sm py-2.5"
                icon={<FileText size={18} />}
              >
                Save & Generate Patti
              </Button>
              <Button 
                onClick={() => handleSave(false)} 
                disabled={loading}
                variant="outline"
                className="w-full border-amber-600 text-amber-700 hover:bg-amber-100 py-2.5"
                icon={<Save size={18} />}
              >
                Save Awak Only
              </Button>
              <Button 
                onClick={() => navigate('/awak')} 
                disabled={loading}
                variant="ghost"
                className="w-full text-gray-600 hover:bg-gray-200"
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
