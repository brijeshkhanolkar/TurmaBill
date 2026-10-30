import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Edit, Trash2, Receipt } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAllBuyerInvoices, deleteBuyerInvoice, getAllBuyers } from '../../database/services';
import { BuyerInvoice } from '../../types';
import { formatDate, formatWeight, formatCurrency } from '../../utils/formatters';
import { Button, Table, Thead, Tbody, Tr, Th, Td, Badge, SearchBox, ConfirmDialog, EmptyState } from '../../components/ui';

export default function BuyerInvoiceList() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<BuyerInvoice[]>([]);
  const [buyers, setBuyers] = useState<Record<string, any>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{isOpen: boolean, id: string | null, no?: string}>({
    isOpen: false,
    id: null,
    no: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [invData, bData] = await Promise.all([getAllBuyerInvoices(), getAllBuyers()]);
      const bMap = (bData || []).reduce((acc, b) => ({ ...acc, [b.id]: b }), {});
      setBuyers(bMap);
      setInvoices((invData || []).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (e) {
      toast.error('Failed to load commercial invoices');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.id) return;
    try {
      await deleteBuyerInvoice(deleteDialog.id);
      toast.success(`Invoice ${deleteDialog.no} deleted`);
      loadData();
    } catch (err) {
      toast.error('Failed to delete invoice');
    } finally {
      setDeleteDialog({ isOpen: false, id: null });
    }
  };

  const filtered = invoices.filter(inv => {
    const bn = buyers[inv.buyerId]?.name || '';
    const st = searchTerm.toLowerCase();
    const invNo = inv.invoiceNo || (inv as any).invoiceNumber || '';
    return String(invNo).toLowerCase().includes(st) || bn.toLowerCase().includes(st);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Buyer Invoices</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-200">
              {filtered.length} invoices
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Tax sales invoices issued to commodity buyers & merchants</p>
        </div>
        <Button 
          variant="primary" 
          icon={<Plus size={16} />} 
          onClick={() => navigate('/buyer-invoice/new')}
        >
          Create New Invoice
        </Button>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-gray-200/80 rounded-2xl shadow-xs overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 justify-between items-center bg-gray-50/40">
          <div className="w-full sm:w-80">
            <SearchBox 
              value={searchTerm} 
              onChange={setSearchTerm} 
              placeholder="Search by Invoice No or Buyer..." 
            />
          </div>
          <div className="text-xs text-gray-500 self-end sm:self-center font-medium">
            Showing {filtered.length} of {invoices.length}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="p-8">
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-12 bg-gray-50 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8">
            <EmptyState 
              icon={<Receipt size={32} className="text-sky-600" />}
              title="No buyer invoices found"
              description={searchTerm ? "No invoices match your search keyword." : "Generate your first buyer commercial invoice."}
              action={
                !searchTerm && (
                  <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => navigate('/buyer-invoice/new')}>
                    Create First Invoice
                  </Button>
                )
              }
            />
          </div>
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Invoice No</Th>
                <Th>Date</Th>
                <Th>Buyer Name</Th>
                <Th>City</Th>
                <Th className="text-right">Bags</Th>
                <Th className="text-right">Weight</Th>
                <Th className="text-right">Billed Amount</Th>
                <Th className="text-center">Status</Th>
                <Th className="text-right w-28">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filtered.map(inv => {
                const buyer = buyers[inv.buyerId];
                const invNo = inv.invoiceNo || (inv as any).invoiceNumber || '';
                const net = inv.netAmount || (inv as any).invoiceAmount || 0;
                const weight = inv.totalNetWeight || inv.totalWeight || 0;

                return (
                  <Tr key={inv.id} onClick={() => navigate(`/buyer-invoice/${inv.id}`)}>
                    <Td className="font-semibold text-gray-900 font-mono text-xs">
                      {invNo}
                    </Td>
                    <Td className="text-xs text-gray-600">{formatDate(inv.date)}</Td>
                    <Td className="font-medium text-gray-900">{buyer?.name || '—'}</Td>
                    <Td className="text-xs text-gray-500">{buyer?.city || '—'}</Td>
                    <Td className="text-right font-semibold">{inv.totalBags}</Td>
                    <Td className="text-right font-mono text-xs">{formatWeight(weight)}</Td>
                    <Td className="text-right font-bold text-gray-900">{formatCurrency(net)}</Td>
                    <Td className="text-center">
                      <Badge variant={inv.status === 'COMPLETED' ? 'success' : 'warning'}>
                        {inv.status || 'GENERATED'}
                      </Badge>
                    </Td>
                    <Td className="text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                        <button 
                          className="p-1.5 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors cursor-pointer" 
                          title="View & Print Invoice"
                          onClick={() => navigate(`/buyer-invoice/${inv.id}`)}
                        >
                          <Eye size={15} />
                        </button>
                        <button 
                          className="p-1.5 text-gray-400 hover:text-sky-600 rounded-md hover:bg-sky-50 transition-colors cursor-pointer" 
                          title="Edit Invoice"
                          onClick={() => navigate(`/buyer-invoice/${inv.id}/edit`)}
                        >
                          <Edit size={15} />
                        </button>
                        <button 
                          className="p-1.5 text-gray-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors cursor-pointer" 
                          title="Delete Invoice"
                          onClick={() => setDeleteDialog({ isOpen: true, id: inv.id, no: invNo })}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        )}
      </div>

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, id: null })}
        onConfirm={handleDelete}
        title="Delete Buyer Invoice"
        message={`Are you sure you want to delete Invoice ${deleteDialog.no}? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
