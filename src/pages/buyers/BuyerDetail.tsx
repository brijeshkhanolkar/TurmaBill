import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
    return (
      <div className="space-y-4 p-8">
        <div className="h-8 bg-gray-100 rounded-lg w-48 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-64 bg-gray-50 rounded-2xl animate-pulse" />
          <div className="md:col-span-2 h-64 bg-gray-50 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!buyer) return null;

  // Calculate summaries
  const totalBags = invoices.reduce((sum, inv) => sum + (inv.totalBags || 0), 0);
  const totalWeight = invoices.reduce((sum, inv) => sum + (inv.totalNetWeight || inv.totalWeight || 0), 0);
  const totalValue = invoices.reduce((sum, inv) => sum + (inv.netAmount || (inv as any).invoiceAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            icon={<ArrowLeft size={16} />} 
            onClick={() => navigate('/buyers')}
            className="text-gray-500 hover:text-gray-900"
          >
            Back
          </Button>
          <div className="h-4 w-px bg-gray-200" />
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Buyer Profile</h1>
            <p className="text-xs text-gray-500">Commercial purchases and invoice billing</p>
          </div>
        </div>
        <Button 
          variant="secondary" 
          size="sm"
          icon={<Edit size={15} />} 
          onClick={() => navigate(`/buyers/${buyer.id}/edit`)}
        >
          Edit Profile
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1 bg-white border border-gray-200/80 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex items-center gap-4 border-b border-gray-100 pb-5">
            <div className="w-14 h-14 bg-sky-50 border border-sky-200/80 text-sky-700 rounded-2xl flex items-center justify-center shrink-0 shadow-xs font-bold text-lg">
              {buyer.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 tracking-tight">{buyer.name}</h2>
              <span className="inline-flex items-center font-mono text-xs text-gray-500 mt-0.5">
                ID: #{String(buyer.id || '').padStart(3, '0')}
              </span>
            </div>
          </div>

          <div className="space-y-3.5 text-sm">
            <div className="flex items-start gap-3 text-gray-600">
              <Phone size={16} className="text-gray-400 mt-0.5 shrink-0" />
              <span className="font-mono text-xs text-gray-800">{buyer.mobile || '—'}</span>
            </div>
            <div className="flex items-start gap-3 text-gray-600">
              <MapPin size={16} className="text-gray-400 mt-0.5 shrink-0" />
              <span>{buyer.city} {buyer.address ? `• ${buyer.address}` : ''}</span>
            </div>
            {buyer.gstin && (
              <div className="flex items-start gap-3 text-gray-600 pt-2 border-t border-gray-100">
                <FileText size={16} className="text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs text-gray-500">GSTIN</div>
                  <div className="font-mono text-xs font-semibold text-gray-800">{buyer.gstin}</div>
                </div>
              </div>
            )}
            {buyer.panNumber && (
              <div className="flex items-start gap-3 text-gray-600">
                <FileText size={16} className="text-gray-400 mt-0.5 shrink-0" />
                <span className="font-mono text-xs">PAN: {buyer.panNumber}</span>
              </div>
            )}
          </div>
        </div>

        {/* Summary & History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-xs">
              <div className="text-xs text-gray-500 font-medium">Invoices</div>
              <div className="text-xl font-bold text-gray-900 mt-1">{invoices.length}</div>
            </div>
            <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-xs">
              <div className="text-xs text-gray-500 font-medium">Total Bags</div>
              <div className="text-xl font-bold text-gray-900 mt-1">{totalBags}</div>
            </div>
            <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-xs">
              <div className="text-xs text-gray-500 font-medium">Total Weight</div>
              <div className="text-xl font-bold text-gray-900 mt-1">{formatWeight(totalWeight)}</div>
            </div>
            <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-xs">
              <div className="text-xs text-gray-500 font-medium">Total Billed</div>
              <div className="text-lg font-bold text-sky-700 mt-1">{formatCurrency(totalValue)}</div>
            </div>
          </div>

          {/* Transaction History */}
          <div className="bg-white border border-gray-200/80 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/40">
              <div className="flex items-center gap-2">
                <History size={16} className="text-gray-500" />
                <h3 className="font-bold text-sm text-gray-900">Commercial Invoices</h3>
              </div>
              <span className="text-xs text-gray-500">{invoices.length} invoices</span>
            </div>
            {invoices.length === 0 ? (
              <div className="p-8">
                <EmptyState 
                  icon={History}
                  title="No invoices yet"
                  description="This buyer has no recorded commercial sales invoices."
                />
              </div>
            ) : (
              <Table>
                <Thead>
                  <Tr>
                    <Th>Invoice No</Th>
                    <Th>Date</Th>
                    <Th className="text-right">Bags</Th>
                    <Th className="text-right">Weight</Th>
                    <Th className="text-right">Net Amount</Th>
                    <Th className="text-center">Status</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {invoices.map(inv => (
                    <Tr key={inv.id} onClick={() => navigate(`/buyer-invoice/${inv.id}`)}>
                      <Td className="font-semibold text-sky-700 hover:underline">
                        {inv.invoiceNo || (inv as any).invoiceNumber}
                      </Td>
                      <Td className="text-xs text-gray-600">{formatDate(inv.date)}</Td>
                      <Td className="text-right font-medium">{inv.totalBags}</Td>
                      <Td className="text-right font-mono text-xs">{formatWeight(inv.totalNetWeight || inv.totalWeight)}</Td>
                      <Td className="text-right font-bold text-gray-900">{formatCurrency(inv.netAmount || (inv as any).invoiceAmount)}</Td>
                      <Td className="text-center">
                        <Badge variant={inv.status === 'COMPLETED' ? 'success' : 'warning'}>{inv.status || 'GENERATED'}</Badge>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
