import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Edit, Trash2, Printer } from 'lucide-react';
import { getAllBuyerInvoices, deleteBuyerInvoice, getAllBuyers } from '../../database/services';
import { BuyerInvoice } from '../../types';
import { formatDate, formatWeight, formatCurrency } from '../../utils/formatters';
import { Button, Table, Thead, Tbody, Tr, Th, Td, Badge, SearchBox, ConfirmDialog } from '../../components/ui';

export default function BuyerInvoiceList() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<BuyerInvoice[]>([]);
  const [buyers, setBuyers] = useState<Record<string, any>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [invData, bData] = await Promise.all([getAllBuyerInvoices(), getAllBuyers()]);
      const bMap = bData.reduce((acc, b) => ({ ...acc, [b.id]: b }), {});
      setBuyers(bMap);
      setInvoices(invData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteBuyerInvoice(deleteId);
    setDeleteId(null);
    loadData();
  };

  const filtered = invoices.filter(inv => {
    const bn = buyers[inv.buyerId]?.name || '';
    const st = searchTerm.toLowerCase();
    return String(inv.invoiceNo).toLowerCase().includes(st) || bn.toLowerCase().includes(st);
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Buyer Invoices</h1>
        <Button onClick={() => navigate('/buyer-invoice/new')} icon={<Plus size={16} />} className="bg-blue-600 hover:bg-blue-700 text-white">
          Create Invoice
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <div className="w-1/3">
            <SearchBox value={searchTerm} onChange={setSearchTerm} placeholder="Search by Invoice No or Buyer..." />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <Thead>
              <Tr>
                <Th>Invoice No</Th>
                <Th>Date</Th>
                <Th>Buyer</Th>
                <Th className="text-center">Items</Th>
                <Th className="text-right">Bags</Th>
                <Th className="text-right">Weight</Th>
                <Th className="text-right">Amount</Th>
                <Th className="text-right">Net Payable</Th>
                <Th className="text-center">Status</Th>
                <Th className="text-center">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {loading ? <Tr><Td colSpan={10} className="text-center py-8">Loading...</Td></Tr> :
                filtered.length === 0 ? <Tr><Td colSpan={10} className="text-center py-8">No records found</Td></Tr> :
                filtered.map(inv => (
                  <Tr key={inv.id}>
                    <Td className="font-medium text-blue-700">{inv.invoiceNo}</Td>
                    <Td>{formatDate(inv.date)}</Td>
                    <Td className="font-semibold">{buyers[inv.buyerId]?.name || 'Unknown'}</Td>
                    <Td className="text-center">{inv.items.length}</Td>
                    <Td className="text-right">{inv.totalBags}</Td>
                    <Td className="text-right">{formatWeight(inv.totalWeight)}</Td>
                    <Td className="text-right">{formatCurrency(inv.totalAmount)}</Td>
                    <Td className="text-right font-bold text-gray-800">{formatCurrency(inv.payableAmount)}</Td>
                    <Td className="text-center">
                      <Badge variant="success">{inv.status}</Badge>
                    </Td>
                    <Td>
                      <div className="flex justify-center space-x-2">
                        <button onClick={() => navigate(`/buyer-invoice/${inv.id}`)} className="p-1 text-blue-600" title="View/Print"><Printer size={18} /></button>
                        <button onClick={() => navigate(`/buyer-invoice/${inv.id}/edit`)} className="p-1 text-amber-600" title="Edit"><Edit size={18} /></button>
                        <button onClick={() => setDeleteId(inv.id)} className="p-1 text-red-600" title="Delete"><Trash2 size={18} /></button>
                      </div>
                    </Td>
                  </Tr>
                ))}
            </Tbody>
          </Table>
        </div>
      </div>
      
      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Invoice" message="Are you sure you want to delete this invoice? This cannot be undone." confirmText="Delete" variant="danger" />
    </div>
  );
}
