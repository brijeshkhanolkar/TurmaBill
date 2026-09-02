import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Edit, Trash2, Printer } from 'lucide-react';
import { getAllFarmerPattis, deleteFarmerPatti, getAllFarmers, getAllBuyers } from '../../database/services';
import { FarmerPatti } from '../../types';
import { formatDate, formatWeight, formatCurrency } from '../../utils/formatters';
import { Button, Table, Thead, Tbody, Tr, Th, Td, Badge, SearchBox, ConfirmDialog } from '../../components/ui';

export default function FarmerPattiList() {
  const navigate = useNavigate();
  const [pattis, setPattis] = useState<FarmerPatti[]>([]);
  const [farmers, setFarmers] = useState<Record<string, any>>({});
  const [buyers, setBuyers] = useState<Record<string, any>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pData, fData, bData] = await Promise.all([
        getAllFarmerPattis(), getAllFarmers(), getAllBuyers()
      ]);
      const fMap = fData.reduce((acc, f) => ({ ...acc, [f.id]: f }), {});
      const bMap = bData.reduce((acc, b) => ({ ...acc, [b.id]: b }), {});
      setFarmers(fMap);
      setBuyers(bMap);
      setPattis(pData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteFarmerPatti(deleteId);
    setDeleteId(null);
    loadData();
  };

  const filtered = pattis.filter(p => {
    const fn = farmers[p.farmerId]?.name || '';
    const st = searchTerm.toLowerCase();
    return String(p.pattiNo).toLowerCase().includes(st) || fn.toLowerCase().includes(st);
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Farmer Pattis</h1>
        <Button onClick={() => navigate('/farmer-patti/new')} icon={<Plus size={16} />} className="bg-amber-600 hover:bg-amber-700 text-white">
          Create Patti
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <div className="w-1/3">
            <SearchBox value={searchTerm} onChange={setSearchTerm} placeholder="Search by Patti No or Farmer..." />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <Thead>
              <Tr>
                <Th>Patti No</Th>
                <Th>Date</Th>
                <Th>Farmer</Th>
                <Th>Village</Th>
                <Th>Buyer</Th>
                <Th className="text-right">Bags</Th>
                <Th className="text-right">Weight</Th>
                <Th className="text-right">Amount</Th>
                <Th className="text-center">Status</Th>
                <Th className="text-center">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {loading ? <Tr><Td colSpan={10} className="text-center py-8">Loading...</Td></Tr> :
                filtered.length === 0 ? <Tr><Td colSpan={10} className="text-center py-8">No records found</Td></Tr> :
                filtered.map(p => (
                  <Tr key={p.id}>
                    <Td className="font-medium">{p.pattiNo}</Td>
                    <Td>{formatDate(p.date)}</Td>
                    <Td>{farmers[p.farmerId]?.name || 'Unknown'}</Td>
                    <Td>{farmers[p.farmerId]?.village || '-'}</Td>
                    <Td>{buyers[p.buyerId]?.name || '-'}</Td>
                    <Td className="text-right">{p.totalBags}</Td>
                    <Td className="text-right">{formatWeight(p.totalWeight)}</Td>
                    <Td className="text-right font-semibold text-green-700">{formatCurrency(p.pattiAmount)}</Td>
                    <Td className="text-center">
                      <Badge variant={p.status === 'GENERATED' || p.status === 'COMPLETED' ? 'success' : 'info'}>{p.status}</Badge>
                    </Td>
                    <Td>
                      <div className="flex justify-center space-x-2">
                        <button onClick={() => navigate(`/farmer-patti/${p.id}`)} className="p-1 text-blue-600" title="View/Print"><Printer size={18} /></button>
                        <button onClick={() => navigate(`/farmer-patti/${p.id}/edit`)} className="p-1 text-amber-600" title="Edit"><Edit size={18} /></button>
                        <button onClick={() => setDeleteId(p.id)} className="p-1 text-red-600" title="Delete"><Trash2 size={18} /></button>
                      </div>
                    </Td>
                  </Tr>
                ))}
            </Tbody>
          </Table>
        </div>
      </div>
      
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Farmer Patti"
        message="Are you sure you want to delete this patti? This cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
