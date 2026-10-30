import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit, ArrowLeft, Building2, Phone, MapPin, CreditCard, User, History } from 'lucide-react';
import toast from 'react-hot-toast';
import { getFarmerById, getFarmerPattisByFarmer } from '../../database/services';
import { Farmer, FarmerPatti } from '../../types';
import { formatCurrency, formatDate, formatWeight } from '../../utils/formatters';
import { Button, Table, Thead, Tbody, Tr, Th, Td, Badge, EmptyState } from '../../components/ui';

export default function FarmerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [farmer, setFarmer] = useState<Farmer | null>(null);
  const [pattis, setPattis] = useState<FarmerPatti[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadData(id);
    }
  }, [id]);

  const loadData = async (farmerId: string) => {
    try {
      setLoading(true);
      const [farmerData, pattisData] = await Promise.all([
        getFarmerById(farmerId),
        getFarmerPattisByFarmer(farmerId)
      ]);
      
      if (farmerData) setFarmer(farmerData);
      else {
        toast.error('Farmer not found');
        navigate('/farmers');
      }
      
      if (pattisData) setPattis(pattisData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (error) {
      toast.error('Failed to load farmer details');
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

  if (!farmer) return null;

  // Calculate summaries
  const totalBags = pattis.reduce((sum, p) => sum + (p.totalBags || 0), 0);
  const totalWeight = pattis.reduce((sum, p) => sum + (p.totalNetWeight || p.totalWeight || 0), 0);
  const totalValue = pattis.reduce((sum, p) => sum + (p.netAmount || (p as any).pattiAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            icon={<ArrowLeft size={16} />} 
            onClick={() => navigate('/farmers')}
            className="text-gray-500 hover:text-gray-900"
          >
            Back
          </Button>
          <div className="h-4 w-px bg-gray-200" />
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Farmer Profile</h1>
            <p className="text-xs text-gray-500">View transactions and settlement status</p>
          </div>
        </div>
        <Button 
          variant="secondary" 
          size="sm"
          icon={<Edit size={15} />} 
          onClick={() => navigate(`/farmers/${farmer.id}/edit`)}
        >
          Edit Profile
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1 bg-white border border-gray-200/80 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex items-center gap-4 border-b border-gray-100 pb-5">
            <div className="w-14 h-14 bg-amber-50 border border-amber-200/80 text-[#C8920A] rounded-2xl flex items-center justify-center shrink-0 shadow-xs font-bold text-lg">
              {farmer.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 tracking-tight">{farmer.name}</h2>
              <span className="inline-flex items-center font-mono text-xs text-gray-500 mt-0.5">
                ID: #{String(farmer.id || '').padStart(3, '0')}
              </span>
            </div>
          </div>

          <div className="space-y-3.5 text-sm">
            <div className="flex items-start gap-3 text-gray-600">
              <Phone size={16} className="text-gray-400 mt-0.5 shrink-0" />
              <span className="font-mono text-xs text-gray-800">{farmer.mobile || '—'}</span>
            </div>
            <div className="flex items-start gap-3 text-gray-600">
              <MapPin size={16} className="text-gray-400 mt-0.5 shrink-0" />
              <span>{farmer.village} {farmer.address ? `• ${farmer.address}` : ''}</span>
            </div>
            {(farmer.bankName || farmer.accountNumber) && (
              <div className="flex items-start gap-3 text-gray-600 pt-2 border-t border-gray-100">
                <Building2 size={16} className="text-gray-400 mt-0.5 shrink-0" />
                <div className="text-xs space-y-0.5">
                  <div className="font-semibold text-gray-800">{farmer.bankName || 'Bank'}</div>
                  <div className="font-mono text-gray-600">A/C: {farmer.accountNumber || '—'}</div>
                  <div className="font-mono text-gray-500">IFSC: {farmer.ifscCode || '—'}</div>
                </div>
              </div>
            )}
            {farmer.panNumber && (
              <div className="flex items-start gap-3 text-gray-600">
                <CreditCard size={16} className="text-gray-400 mt-0.5 shrink-0" />
                <span className="font-mono text-xs">PAN: {farmer.panNumber}</span>
              </div>
            )}
          </div>
        </div>

        {/* Summary & History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-xs">
              <div className="text-xs text-gray-500 font-medium">Pattis</div>
              <div className="text-xl font-bold text-gray-900 mt-1">{pattis.length}</div>
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
              <div className="text-xs text-gray-500 font-medium">Total Value</div>
              <div className="text-lg font-bold text-[#C8920A] mt-1">{formatCurrency(totalValue)}</div>
            </div>
          </div>

          {/* Transaction History */}
          <div className="bg-white border border-gray-200/80 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/40">
              <div className="flex items-center gap-2">
                <History size={16} className="text-gray-500" />
                <h3 className="font-bold text-sm text-gray-900">Farmer Patti History</h3>
              </div>
              <span className="text-xs text-gray-500">{pattis.length} records</span>
            </div>
            {pattis.length === 0 ? (
              <div className="p-8">
                <EmptyState 
                  icon={History}
                  title="No transactions yet"
                  description="This farmer has no recorded farmer pattis."
                />
              </div>
            ) : (
              <Table>
                <Thead>
                  <Tr>
                    <Th>Patti No</Th>
                    <Th>Date</Th>
                    <Th className="text-right">Bags</Th>
                    <Th className="text-right">Weight</Th>
                    <Th className="text-right">Net Amount</Th>
                    <Th className="text-center">Status</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {pattis.map(patti => (
                    <Tr key={patti.id} onClick={() => navigate(`/farmer-patti/${patti.id}`)}>
                      <Td className="font-semibold text-blue-600 hover:underline">
                        {patti.pattiNo || (patti as any).pattiNumber}
                      </Td>
                      <Td className="text-xs text-gray-600">{formatDate(patti.date)}</Td>
                      <Td className="text-right font-medium">{patti.totalBags}</Td>
                      <Td className="text-right font-mono text-xs">{formatWeight(patti.totalNetWeight || patti.totalWeight)}</Td>
                      <Td className="text-right font-bold text-gray-900">{formatCurrency(patti.netAmount || (patti as any).pattiAmount)}</Td>
                      <Td className="text-center">
                        <Badge variant={patti.status === 'COMPLETED' ? 'success' : 'warning'}>{patti.status || 'GENERATED'}</Badge>
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
