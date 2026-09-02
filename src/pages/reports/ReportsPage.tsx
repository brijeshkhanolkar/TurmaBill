import React, { useState, useEffect } from 'react';
import { Download, Printer } from 'lucide-react';
import { getFarmerPattis, getBuyerInvoices, getInventoryStock } from '../../database/services';

function exportToCSV(data: any[], filename: string) {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row => Object.values(row).map(val => `"${val}"`).join(','));
  const csv = [headers, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
}

export const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('daily');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  // States for data
  const [pattis, setPattis] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [stock, setStock] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const p = await getFarmerPattis();
      const i = await getBuyerInvoices();
      const s = await getInventoryStock();
      setPattis(p);
      setInvoices(i);
      setStock(s);
    };
    load();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const renderDailyReport = () => {
    const dPattis = pattis.filter(p => p.date.startsWith(date));
    const dInvoices = invoices.filter(i => i.date.startsWith(date));
    
    return (
      <div className="print-area">
        <div className="flex gap-4 mb-4 no-print">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border p-2 rounded" />
          <button onClick={() => exportToCSV(dPattis, `daily-pattis-${date}.csv`)} className="btn bg-gray-100 p-2 flex items-center gap-2 border"><Download size={16}/> CSV Pattis</button>
          <button onClick={() => exportToCSV(dInvoices, `daily-invoices-${date}.csv`)} className="btn bg-gray-100 p-2 flex items-center gap-2 border"><Download size={16}/> CSV Invoices</button>
          <button onClick={handlePrint} className="btn bg-gray-100 p-2 flex items-center gap-2 border"><Printer size={16}/> Print</button>
        </div>
        <div className="mb-6 grid grid-cols-4 gap-4">
          <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
            <p className="text-sm text-gray-600">Pattis Today</p>
            <p className="text-xl font-bold">{dPattis.length}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded border border-blue-200">
            <p className="text-sm text-gray-600">Invoices Today</p>
            <p className="text-xl font-bold">{dInvoices.length}</p>
          </div>
          <div className="bg-green-50 p-4 rounded border border-green-200">
            <p className="text-sm text-gray-600">Purchase Value</p>
            <p className="text-xl font-bold">₹ {dPattis.reduce((sum, p) => sum + p.netAmount, 0).toFixed(2)}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded border border-purple-200">
            <p className="text-sm text-gray-600">Sales Value</p>
            <p className="text-xl font-bold">₹ {dInvoices.reduce((sum, i) => sum + i.netAmount, 0).toFixed(2)}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderInventoryReport = () => {
    const reportData = stock.map(s => ({
      Product: s.productName,
      OpeningStock: `${s.openingBags} bags (${s.openingWeight}kg)`,
      Purchased: `${s.purchasedBags} bags (${s.purchasedWeight}kg)`,
      Sold: `${s.soldBags} bags (${s.soldWeight}kg)`,
      CurrentStock: `${s.currentBags} bags (${s.currentWeight}kg)`,
      StockValue: ((s.currentWeight/100) * (s.defaultRate || 0)).toFixed(2)
    }));

    return (
      <div className="print-area">
        <div className="flex gap-4 mb-4 no-print">
          <button onClick={() => exportToCSV(reportData, `inventory-report.csv`)} className="btn bg-gray-100 p-2 flex items-center gap-2 border"><Download size={16}/> Export CSV</button>
          <button onClick={handlePrint} className="btn bg-gray-100 p-2 flex items-center gap-2 border"><Printer size={16}/> Print</button>
        </div>
        <table className="w-full text-left border-collapse border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">Product</th>
              <th className="border p-2">Opening Stock</th>
              <th className="border p-2">Purchased</th>
              <th className="border p-2">Sold</th>
              <th className="border p-2">Current Stock</th>
              <th className="border p-2">Est. Value (₹)</th>
            </tr>
          </thead>
          <tbody>
            {reportData.map((row, idx) => (
              <tr key={idx}>
                <td className="border p-2">{row.Product}</td>
                <td className="border p-2">{row.OpeningStock}</td>
                <td className="border p-2">{row.Purchased}</td>
                <td className="border p-2">{row.Sold}</td>
                <td className="border p-2 font-bold">{row.CurrentStock}</td>
                <td className="border p-2">{row.StockValue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 no-print">Reports</h1>
      <div className="bg-white rounded shadow p-6">
        <div className="flex gap-4 border-b pb-4 mb-6 no-print">
          <button onClick={() => setActiveTab('daily')} className={`font-semibold ${activeTab === 'daily' ? 'text-yellow-600' : 'text-gray-600'}`}>Daily Report</button>
          <button onClick={() => setActiveTab('farmer')} className={`font-semibold ${activeTab === 'farmer' ? 'text-yellow-600' : 'text-gray-600'}`}>Farmer Report</button>
          <button onClick={() => setActiveTab('buyer')} className={`font-semibold ${activeTab === 'buyer' ? 'text-yellow-600' : 'text-gray-600'}`}>Buyer Report</button>
          <button onClick={() => setActiveTab('inventory')} className={`font-semibold ${activeTab === 'inventory' ? 'text-yellow-600' : 'text-gray-600'}`}>Inventory Report</button>
        </div>

        <div>
          {activeTab === 'daily' && renderDailyReport()}
          {activeTab === 'inventory' && renderInventoryReport()}
          {(activeTab === 'farmer' || activeTab === 'buyer') && <p className="text-gray-500">Select Date Range and export functionality is under implementation.</p>}
        </div>
      </div>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          .print-area { width: 100%; }
        }
      `}</style>
    </div>
  );
};
