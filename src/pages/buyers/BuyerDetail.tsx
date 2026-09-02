import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Edit, ArrowLeft, Building2, Phone, MapPin, FileText, History } from 'lucide-react';
import toast from 'react-hot-toast';
import { getBuyerById, getBuyerInvoicesByBuyer } from '../../database/services';
import { Buyer, BuyerInvoice } from '../../types';
import { formatCurrency, formatDate, formatWeight } from '../../utils/formatters';
import { Button, Table, Thead, Tbody, Tr, Th, Td, Badge, EmptyState } from '../../components/ui';

export default function BuyerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [buyer, setBuyer] = useState<Buyer | null>(null);
  const [invoices, setInvoices] = useState<BuyerInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadData(id);
    }
  }, [id]);

  const loadData = async (buyerId: string) => {
    try {
      setLoading(true);
      const [buyerData, invoicesData] = await Promise.all([
        getBuyerById(buyerId),
        getBuyerInvoicesByBuyer(buyerId)
      ]);
      
      if (buyerData) setBuyer(buyerData);
      else {
        toast.error('Buyer not found');
        navigate('/buyers');
      }
      
      if (invoicesData) setInvoices(invoicesData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (error) {
      toast.error('Failed to load buyer details');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading buyer details...</div>;
  }

  if (!buyer) return null;

  // Calculate summaries
  const totalBags = invoices.reduce((sum, inv) => sum + inv.items.reduce((s, item) => s + (item.bags || 0), 0), 0);
  const totalWeight = invoices.reduce((sum, inv) => sum + inv.items.reduce((s, item) => s + (item.weight || 0), 0), 0);
  const totalValue = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" icon={<ArrowLeft size={16} />} onClick={() => navigate('/buyers')} />
          <h1 className="text-xl font-bold text-gray-800">Buyer Profile</h1>
        </div>
        <Button 
          variant="secondary" 
          icon={<Edit size={16} />} 
          onClick={() => navigate(`/buyers/${buyer.id}/edit`)}
        >
          Edit Buyer
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="md:col-span-1 bg-white border border-gray-200 rounded p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-4 border-b pb-4">
            <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center">
              <Building2 size={32} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{buyer.name}</h2>
              <Badge variant="info">ID: {buyer.id?.slice(0, 6)}</Badge>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3 text-gray-600">
              <Phone size={16} className="mt-0.5" />
              <span>{buyer.mobile}</span>
            </div>
            <div className="flex items-start gap-3 text-gray-600">
              <MapPin size={16} className="mt-0.5" />
              <span>{buyer.address}, {buyer.city}</span>
            </div>
            {buyer.gstin && (
              <div className="flex items-start gap-3 text-gray-600">
                <FileText size={16} className="mt-0.5" />
                <span>GSTIN: <span className="font-mono">{buyer.gstin}</span></span>
              </div>
            )}
            {buyer.panNumber && (
              <div className="flex items-start gap-3 text-gray-600">
                <FileText size={16} className="mt-0.5" />
                <span>PAN: <span className="font-mono">{buyer.panNumber}</span></span>
              </div>
            )}
          </div>
        </div>

        {/* Summary & History */}
        <div className="md:col-span-2 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded p-4 border-t-4 border-t-blue-500 shadow-sm text-center">
              <div className="text-xs text-gray-500 uppercase mb-1">Purchases</div>
              <div className="text-xl font-bold">{invoices.length}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded p-4 border-t-4 border-t-green-500 shadow-sm text-center">
              <div className="text-xs text-gray-500 uppercase mb-1">Total Bags</div>
              <div className="text-xl font-bold">{totalBags}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded p-4 border-t-4 border-t-purple-500 shadow-sm text-center">
              <div className="text-xs text-gray-500 uppercase mb-1">Total Weight</div>
              <div className="text-xl font-bold">{formatWeight(totalWeight)}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded p-4 border-t-4 border-t-yellow-500 shadow-sm text-center">
              <div className="text-xs text-gray-500 uppercase mb-1">Total Value</div>
              <div className="text-xl font-bold">{formatCurrency(totalValue)}</div>
            </div>
          </div>

          {/* Invoice History */}
          <div className="bg-white border border-gray-200 rounded shadow-sm">
            <div className="p-4 border-b border-gray-200 flex items-center gap-2">
              <History size={18} className="text-gray-500" />
              <h3 className="font-semibold text-gray-800">Invoice History</h3>
            </div>
            {invoices.length === 0 ? (
              <div className="p-8">
                <EmptyState 
                  icon={<History size={48} className="text-gray-300" />}
                  title="No invoices yet"
                  description="This buyer has no recorded invoices."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="table-compact">
                  <Thead>
                    <Tr>
                      <Th>Invoice No</Th>
                      <Th>Date</Th>
                      <Th className="text-right">Items</Th>
                      <Th className="text-right">Bags</Th>
                      <Th className="text-right">Amount</Th>
                      <Th className="text-center">Status</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {invoices.map(invoice => {
                      const invBags = invoice.items.reduce((s, item) => s + (item.bags || 0), 0);
                      return (
                        <Tr key={invoice.id} className="cursor-pointer hover:bg-gray-50" onClick={() => navigate(`/buyer-invoice/${invoice.id}`)}>
                          <Td className="font-medium text-blue-600">{invoice.invoiceNo}</Td>
                          <Td>{formatDate(invoice.date)}</Td>
                          <Td className="text-right">{invoice.items.length}</Td>
                          <Td className="text-right">{invBags}</Td>
                          <Td className="text-right font-medium">{formatCurrency(invoice.totalAmount)}</Td>
                          <Td className="text-center">
                            <Badge variant={invoice.status === 'COMPLETED' ? 'success' : 'warning'}>{invoice.status}</Badge>
                          </Td>
                        </Tr>
                      );
                    })}
                  </Tbody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
