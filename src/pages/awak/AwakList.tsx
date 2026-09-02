import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Edit, Trash2, FileText, Search } from 'lucide-react';
import { getAllAwaks, deleteAwak, getAllFarmers, getAllBuyers } from '../../database/services';
import { Awak, Farmer, Buyer } from '../../types';
import { formatDate, formatWeight, formatCurrency } from '../../utils/formatters';
import { Button } from '../../components/ui/Button';
import { Table, Thead, Tbody, Tr, Th, Td } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { SearchBox } from '../../components/ui/SearchBox';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

export default function AwakList() {
  const navigate = useNavigate();
  const [awaks, setAwaks] = useState<Awak[]>([]);
  const [farmers, setFarmers] = useState<Record<string, Farmer>>({});
  const [buyers, setBuyers] = useState<Record<string, Buyer>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [awaksData, farmersData, buyersData] = await Promise.all([
        getAllAwaks(),
        getAllFarmers(),
        getAllBuyers()
      ]);

      const farmersMap = farmersData.reduce((acc, f) => ({ ...acc, [f.id]: f }), {});
      const buyersMap = buyersData.reduce((acc, b) => ({ ...acc, [b.id]: b }), {});
      
      setFarmers(farmersMap);
      setBuyers(buyersMap);
      setAwaks(awaksData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (error) {
      console.error('Failed to load awaks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteAwak(deleteId);
      await loadData();
    } catch (error) {
      console.error('Failed to delete awak:', error);
    } finally {
      setDeleteId(null);
    }
  };

  const filteredAwaks = awaks.filter(awak => {
    const farmerName = farmers[awak.farmerId]?.name || '';
    const buyerName = buyers[awak.buyerId]?.name || '';
    const searchLower = searchTerm.toLowerCase();
    return (
      String(awak.awakNo).toLowerCase().includes(searchLower) ||
      farmerName.toLowerCase().includes(searchLower) ||
      buyerName.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Awak / Inward Entries</h1>
        <Button 
          onClick={() => navigate('/awak/new')} 
          icon={<Plus size={16} />}
          className="bg-[#D4A017] hover:bg-[#B8860B] text-white"
        >
          New Awak
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <div className="w-1/3">
            <SearchBox 
              value={searchTerm} 
              onChange={setSearchTerm} 
              placeholder="Search by Awak No, Farmer or Buyer..." 
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <Thead>
              <Tr>
                <Th>Awak No</Th>
                <Th>Date</Th>
                <Th>Farmer</Th>
                <Th>Village</Th>
                <Th>Buyer</Th>
                <Th className="text-right">Bags</Th>
                <Th className="text-right">Weight (Kg)</Th>
                <Th className="text-right">Amount</Th>
                <Th className="text-center">Status</Th>
                <Th className="text-center">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {loading ? (
                <Tr><Td colSpan={10} className="text-center py-8 text-gray-500">Loading...</Td></Tr>
              ) : filteredAwaks.length === 0 ? (
                <Tr><Td colSpan={10} className="text-center py-8 text-gray-500">No entries found.</Td></Tr>
              ) : (
                filteredAwaks.map((awak) => {
                  const farmer = farmers[awak.farmerId];
                  const buyer = buyers[awak.buyerId];
                  
                  return (
                    <Tr key={awak.id}>
                      <Td className="font-medium text-gray-900">{awak.awakNo}</Td>
                      <Td>{formatDate(awak.date)}</Td>
                      <Td>{farmer?.name || 'Unknown'}</Td>
                      <Td>{farmer?.village || '-'}</Td>
                      <Td>{buyer?.name || '-'}</Td>
                      <Td className="text-right">{awak.totalBags}</Td>
                      <Td className="text-right">{formatWeight(awak.totalWeight)}</Td>
                      <Td className="text-right">{formatCurrency(awak.totalAmount)}</Td>
                      <Td className="text-center">
                        <Badge variant={awak.status === 'COMPLETED' ? 'success' : 'warning'}>
                          {awak.status || 'PENDING'}
                        </Badge>
                      </Td>
                      <Td>
                        <div className="flex justify-center space-x-2">
                          <button onClick={() => navigate(`/awak/${awak.id}/edit`)} className="p-1 text-blue-600 hover:text-blue-800" title="View or edit">
                            <Eye size={18} />
                          </button>
                          <button onClick={() => navigate(`/awak/${awak.id}/edit`)} className="p-1 text-amber-600 hover:text-amber-800" title="Edit">
                            <Edit size={18} />
                          </button>
                          <button onClick={() => navigate(`/farmer-patti/new?awakId=${awak.id}`)} className="p-1 text-green-600 hover:text-green-800" title="Generate Patti">
                            <FileText size={18} />
                          </button>
                          <button onClick={() => setDeleteId(awak.id)} className="p-1 text-red-600 hover:text-red-800" title="Delete">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </Td>
                    </Tr>
                  );
                })
              )}
            </Tbody>
          </Table>
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Awak"
        message="Are you sure you want to delete this Awak entry? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
