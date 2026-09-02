import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
    return <div className="p-8 text-center text-gray-500">Loading farmer details...</div>;
  }

  if (!farmer) return null;

  // Calculate summaries
  const totalBags = pattis.reduce((sum, p) => sum + (p.totalBags || 0), 0);
  const totalWeight = pattis.reduce((sum, p) => sum + (p.totalNetWeight || 0), 0);
  const totalValue = pattis.reduce((sum, p) => sum + (p.netAmount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" icon={<ArrowLeft size={16} />} onClick={() => navigate('/farmers')} />
          <h1 className="text-xl font-bold text-gray-800">Farmer Profile</h1>
        </div>
        <Button 
          variant="secondary" 
          icon={<Edit size={16} />} 
          onClick={() => navigate(`/farmers/${farmer.id}/edit`)}
        >
          Edit Farmer
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="md:col-span-1 bg-white border border-gray-200 rounded p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-4 border-b pb-4">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
              <User size={32} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{farmer.name}</h2>
              <Badge variant="info">ID: {farmer.id?.slice(0, 6)}</Badge>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3 text-gray-600">
              <Phone size={16} className="mt-0.5" />
              <span>{farmer.mobile}</span>
            </div>
            <div className="flex items-start gap-3 text-gray-600">
              <MapPin size={16} className="mt-0.5" />
              <span>{farmer.village} {farmer.address ? `, ${farmer.address}` : ''}</span>
            </div>
            {(farmer.bankName || farmer.accountNumber) && (
              <div className="flex items-start gap-3 text-gray-600">
                <Building2 size={16} className="mt-0.5" />
                <div>
                  <div className="font-medium">{farmer.bankName}</div>
                  <div>A/C: {farmer.accountNumber}</div>
                  <div>IFSC: {farmer.ifscCode}</div>
                </div>
              </div>
            )}
            {farmer.panNumber && (
              <div className="flex items-start gap-3 text-gray-600">
                <CreditCard size={16} className="mt-0.5" />
                <span>PAN: {farmer.panNumber}</span>
              </div>
            )}
          </div>
        </div>

        {/* Summary & History */}
        <div className="md:col-span-2 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded p-4 border-t-4 border-t-blue-500 shadow-sm text-center">
              <div className="text-xs text-gray-500 uppercase mb-1">Transactions</div>
              <div className="text-xl font-bold">{pattis.length}</div>
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

          {/* Transaction History */}
          <div className="bg-white border border-gray-200 rounded shadow-sm">
            <div className="p-4 border-b border-gray-200 flex items-center gap-2">
              <History size={18} className="text-gray-500" />
              <h3 className="font-semibold text-gray-800">Transaction History</h3>
            </div>
            {pattis.length === 0 ? (
              <div className="p-8">
                <EmptyState 
                  icon={<History size={48} className="text-gray-300" />}
                  title="No transactions yet"
                  description="This farmer has no recorded farmer pattis."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="table-compact">
                  <Thead>
                    <Tr>
                      <Th>Patti No</Th>
                      <Th>Date</Th>
                      <Th className="text-right">Bags</Th>
                      <Th className="text-right">Weight</Th>
                      <Th className="text-right">Amount</Th>
                      <Th className="text-center">Status</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {pattis.map(patti => (
                      <Tr key={patti.id} className="cursor-pointer hover:bg-gray-50" onClick={() => navigate(`/farmer-patti/${patti.id}`)}>
                        <Td className="font-medium text-blue-600">{patti.pattiNo}</Td>
                        <Td>{formatDate(patti.date)}</Td>
                        <Td className="text-right">{patti.totalBags}</Td>
                        <Td className="text-right">{formatWeight(patti.totalNetWeight)}</Td>
                        <Td className="text-right font-medium">{formatCurrency(patti.netAmount)}</Td>
                        <Td className="text-center">
                          <Badge variant={patti.status === 'COMPLETED' ? 'success' : 'warning'}>{patti.status}</Badge>
                        </Td>
                      </Tr>
                    ))}
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
