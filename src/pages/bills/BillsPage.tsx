import React, { useState, useEffect } from 'react';
import { getFarmerPattis, getBuyerInvoices, deleteFarmerPatti, deleteBuyerInvoice } from '../../database/services';
import { FarmerPatti, BuyerInvoice } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { FileText, Printer, Trash2, Eye } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const BillsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'pattis' | 'invoices'>('all');
  const [pattis, setPattis] = useState<FarmerPatti[]>([]);
  const [invoices, setInvoices] = useState<BuyerInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadData = async () => {
    setLoading(true);
    try {
      const pData = await getFarmerPattis();
      const iData = await getBuyerInvoices();
      setPattis(pData);
      setInvoices(iData);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeletePatti = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this Farmer Patti?")) {
      await deleteFarmerPatti(id);
      loadData();
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this Buyer Invoice?")) {
      await deleteBuyerInvoice(id);
      loadData();
    }
  };

  const allBills = [
    ...pattis.map(p => ({ ...p, type: 'PATTI' as const, dateObj: new Date(p.date) })),
    ...invoices.map(i => ({ ...i, type: 'INVOICE' as const, dateObj: new Date(i.date) }))
  ].sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Bills History</h1>
      </div>

      <div className="bg-white rounded shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button onClick={() => setActiveTab('all')} className={`py-4 px-6 font-medium text-sm flex items-center ${activeTab === 'all' ? 'border-b-2 border-yellow-600 text-yellow-600' : 'text-gray-500 hover:text-gray-700'}`}>
              <FileText className="w-4 h-4 mr-2" /> All Bills
            </button>
            <button onClick={() => setActiveTab('pattis')} className={`py-4 px-6 font-medium text-sm flex items-center ${activeTab === 'pattis' ? 'border-b-2 border-yellow-600 text-yellow-600' : 'text-gray-500 hover:text-gray-700'}`}>
              Farmer Pattis
            </button>
            <button onClick={() => setActiveTab('invoices')} className={`py-4 px-6 font-medium text-sm flex items-center ${activeTab === 'invoices' ? 'border-b-2 border-yellow-600 text-yellow-600' : 'text-gray-500 hover:text-gray-700'}`}>
              Buyer Invoices
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'all' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse border border-gray-300 text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border p-2">Type</th>
                    <th className="border p-2">No.</th>
                    <th className="border p-2">Date</th>
                    <th className="border p-2">Name (Farmer/Buyer)</th>
                    <th className="border p-2">Weight</th>
                    <th className="border p-2">Amount</th>
                    <th className="border p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allBills.map((bill, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="border p-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${bill.type === 'PATTI' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                          {bill.type}
                        </span>
                      </td>
                      <td className="border p-2">{(bill as any).pattiNumber || (bill as any).invoiceNumber}</td>
                      <td className="border p-2">{formatDate(bill.date)}</td>
                      <td className="border p-2">{(bill as any).farmerName || (bill as any).buyerName}</td>
                      <td className="border p-2">{bill.totalWeight.toFixed(2)} kg</td>
                      <td className="border p-2 font-medium">{formatCurrency((bill as any).netAmount)}</td>
                      <td className="border p-2 flex gap-2">
                        <button onClick={() => navigate(bill.type === 'PATTI' ? `/farmer-patti/${bill.id}` : `/buyer-invoice/${bill.id}`)} className="text-gray-600 hover:text-yellow-600">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => bill.type === 'PATTI' ? handleDeletePatti(bill.id) : handleDeleteInvoice(bill.id)} className="text-gray-600 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {allBills.length === 0 && !loading && <tr><td colSpan={7} className="text-center p-4">No bills found</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'pattis' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse border border-gray-300 text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border p-2">Patti No</th>
                    <th className="border p-2">Date</th>
                    <th className="border p-2">Farmer</th>
                    <th className="border p-2">Village</th>
                    <th className="border p-2">Buyer</th>
                    <th className="border p-2">Bags</th>
                    <th className="border p-2">Weight</th>
                    <th className="border p-2">Amount</th>
                    <th className="border p-2">Patti Amount</th>
                    <th className="border p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pattis.map(patti => (
                    <tr key={patti.id} className="hover:bg-gray-50">
                      <td className="border p-2">{patti.pattiNumber}</td>
                      <td className="border p-2">{formatDate(patti.date)}</td>
                      <td className="border p-2">{patti.farmerName}</td>
                      <td className="border p-2">{patti.village}</td>
                      <td className="border p-2">{patti.buyerName || '-'}</td>
                      <td className="border p-2">{patti.totalBags}</td>
                      <td className="border p-2">{patti.totalWeight.toFixed(2)}</td>
                      <td className="border p-2">{formatCurrency(patti.amount)}</td>
                      <td className="border p-2 font-bold">{formatCurrency(patti.netAmount)}</td>
                      <td className="border p-2 flex gap-2">
                        <button onClick={() => navigate(`/farmer-patti/${patti.id}`)} className="text-gray-600 hover:text-yellow-600" title="View"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => navigate(`/farmer-patti/${patti.id}?print=true`)} className="text-gray-600 hover:text-blue-600" title="Print"><Printer className="w-4 h-4" /></button>
                        <button onClick={() => handleDeletePatti(patti.id)} className="text-gray-600 hover:text-red-600" title="Delete"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                  {pattis.length === 0 && !loading && <tr><td colSpan={10} className="text-center p-4">No Farmer Pattis found</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'invoices' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse border border-gray-300 text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border p-2">Invoice No</th>
                    <th className="border p-2">Date</th>
                    <th className="border p-2">Buyer</th>
                    <th className="border p-2">Items</th>
                    <th className="border p-2">Bags</th>
                    <th className="border p-2">Weight</th>
                    <th className="border p-2">Amount</th>
                    <th className="border p-2">Net Amount</th>
                    <th className="border p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map(invoice => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="border p-2">{invoice.invoiceNumber}</td>
                      <td className="border p-2">{formatDate(invoice.date)}</td>
                      <td className="border p-2">{invoice.buyerName}</td>
                      <td className="border p-2">{invoice.items.length}</td>
                      <td className="border p-2">{invoice.totalBags}</td>
                      <td className="border p-2">{invoice.totalWeight.toFixed(2)}</td>
                      <td className="border p-2">{formatCurrency(invoice.amount)}</td>
                      <td className="border p-2 font-bold">{formatCurrency(invoice.netAmount)}</td>
                      <td className="border p-2 flex gap-2">
                        <button onClick={() => navigate(`/buyer-invoice/${invoice.id}`)} className="text-gray-600 hover:text-yellow-600" title="View"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => navigate(`/buyer-invoice/${invoice.id}?print=true`)} className="text-gray-600 hover:text-blue-600" title="Print"><Printer className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteInvoice(invoice.id)} className="text-gray-600 hover:text-red-600" title="Delete"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                  {invoices.length === 0 && !loading && <tr><td colSpan={9} className="text-center p-4">No Buyer Invoices found</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
