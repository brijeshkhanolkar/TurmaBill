import React, { useState, useEffect } from 'react';
import { Package, TrendingUp, Settings2 } from 'lucide-react';
import { getInventoryStock, getInventoryMovements, addStockAdjustment } from '../../database/services';
import { InventoryStock, InventoryMovement } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const InventoryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'movements' | 'adjustment'>('overview');
  const [stock, setStock] = useState<InventoryStock[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state for adjustment
  const [adjProduct, setAdjProduct] = useState('');
  const [adjType, setAdjType] = useState<'ADD' | 'REMOVE'>('ADD');
  const [adjBags, setAdjBags] = useState(0);
  const [adjWeight, setAdjWeight] = useState(0);
  const [adjNotes, setAdjNotes] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        const data = await getInventoryStock();
        setStock(data);
      } else if (activeTab === 'movements') {
        const data = await getInventoryMovements();
        setMovements(data);
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handleAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjProduct || adjBags <= 0 || adjWeight <= 0) {
      alert("Please fill all required fields correctly.");
      return;
    }
    try {
      await addStockAdjustment({
        productId: adjProduct,
        type: adjType,
        bags: adjBags,
        weight: adjWeight,
        notes: adjNotes,
        date: new Date().toISOString()
      });
      alert("Stock adjustment saved!");
      setAdjProduct('');
      setAdjBags(0);
      setAdjWeight(0);
      setAdjNotes('');
      setActiveTab('overview');
    } catch (error) {
      console.error(error);
      alert("Error saving adjustment");
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Inventory Management</h1>
      </div>

      <div className="bg-white rounded shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button onClick={() => setActiveTab('overview')} className={`py-4 px-6 font-medium text-sm flex items-center ${activeTab === 'overview' ? 'border-b-2 border-yellow-600 text-yellow-600' : 'text-gray-500 hover:text-gray-700'}`}>
              <Package className="w-4 h-4 mr-2" />
              Stock Overview
            </button>
            <button onClick={() => setActiveTab('movements')} className={`py-4 px-6 font-medium text-sm flex items-center ${activeTab === 'movements' ? 'border-b-2 border-yellow-600 text-yellow-600' : 'text-gray-500 hover:text-gray-700'}`}>
              <TrendingUp className="w-4 h-4 mr-2" />
              Stock Movements
            </button>
            <button onClick={() => setActiveTab('adjustment')} className={`py-4 px-6 font-medium text-sm flex items-center ${activeTab === 'adjustment' ? 'border-b-2 border-yellow-600 text-yellow-600' : 'text-gray-500 hover:text-gray-700'}`}>
              <Settings2 className="w-4 h-4 mr-2" />
              Stock Adjustment
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse border border-gray-300 text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border p-2">Product</th>
                    <th className="border p-2">Opening Stock</th>
                    <th className="border p-2">Purchased</th>
                    <th className="border p-2">Sold</th>
                    <th className="border p-2">Adjustments</th>
                    <th className="border p-2">Current Stock</th>
                    <th className="border p-2">Stock Value</th>
                  </tr>
                </thead>
                <tbody>
                  {stock.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="border p-2 font-medium">{item.productName}</td>
                      <td className="border p-2">{item.openingBags} bags / {item.openingWeight.toFixed(2)} kg</td>
                      <td className="border p-2">{item.purchasedBags} bags / {item.purchasedWeight.toFixed(2)} kg</td>
                      <td className="border p-2">{item.soldBags} bags / {item.soldWeight.toFixed(2)} kg</td>
                      <td className="border p-2">{item.adjustedBags} bags / {item.adjustedWeight.toFixed(2)} kg</td>
                      <td className={`border p-2 font-bold ${item.currentWeight < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {item.currentBags} bags / {item.currentWeight.toFixed(2)} kg
                      </td>
                      <td className="border p-2">{formatCurrency((item.currentWeight / 100) * (item.defaultRate || 0))}</td>
                    </tr>
                  ))}
                  {stock.length === 0 && !loading && <tr><td colSpan={7} className="text-center p-4">No stock data available</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'movements' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse border border-gray-300 text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border p-2">Date</th>
                    <th className="border p-2">Product</th>
                    <th className="border p-2">Type</th>
                    <th className="border p-2">Bags</th>
                    <th className="border p-2">Weight (kg)</th>
                    <th className="border p-2">Reference</th>
                    <th className="border p-2">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((mov, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="border p-2">{formatDate(mov.date)}</td>
                      <td className="border p-2">{mov.productName}</td>
                      <td className="border p-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          mov.type === 'PURCHASE' ? 'bg-blue-100 text-blue-800' :
                          mov.type === 'SALE' ? 'bg-green-100 text-green-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {mov.type}
                        </span>
                      </td>
                      <td className="border p-2">{mov.bags}</td>
                      <td className="border p-2">{mov.weight.toFixed(2)}</td>
                      <td className="border p-2">{mov.referenceId || '-'}</td>
                      <td className="border p-2">{mov.notes || '-'}</td>
                    </tr>
                  ))}
                  {movements.length === 0 && !loading && <tr><td colSpan={7} className="text-center p-4">No movements found</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'adjustment' && (
            <div className="max-w-2xl mx-auto">
              <form onSubmit={handleAdjustment} className="space-y-4 border border-gray-300 p-6 rounded bg-gray-50">
                <h3 className="text-lg font-semibold mb-4">Add Stock Adjustment</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Product</label>
                    <input type="text" value={adjProduct} onChange={(e) => setAdjProduct(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500" placeholder="Product ID/Name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Adjustment Type</label>
                    <select value={adjType} onChange={(e) => setAdjType(e.target.value as 'ADD'|'REMOVE')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500">
                      <option value="ADD">Add to Stock (+)</option>
                      <option value="REMOVE">Remove from Stock (-)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Bags</label>
                    <input type="number" value={adjBags || ''} onChange={(e) => setAdjBags(Number(e.target.value))} required min="1" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Weight (KG)</label>
                    <input type="number" step="0.01" value={adjWeight || ''} onChange={(e) => setAdjWeight(Number(e.target.value))} required min="0.01" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Notes / Reason</label>
                    <textarea value={adjNotes} onChange={(e) => setAdjNotes(e.target.value)} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500" placeholder="E.g., Physical verification correction"></textarea>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button type="submit" className="bg-yellow-600 text-white px-4 py-2 rounded shadow hover:bg-yellow-700 focus:outline-none">
                    Save Adjustment
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
