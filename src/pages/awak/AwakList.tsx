import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Edit, Trash2, FileText, ArrowDownLeft, PackageCheck, Scale } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAllAwaks, deleteAwak, getAllFarmers, getAllBuyers } from '../../database/services';
import { Awak, Farmer, Buyer } from '../../types';
import { formatDate, formatWeight, formatCurrency } from '../../utils/formatters';
import { Button, Table, Thead, Tbody, Tr, Th, Td, Badge, SearchBox, ConfirmDialog, EmptyState } from '../../components/ui';

export default function AwakList() {
  const navigate = useNavigate();
  const [awaks, setAwaks] = useState<Awak[]>([]);
  const [farmers, setFarmers] = useState<Record<string, Farmer>>({});
  const [buyers, setBuyers] = useState<Record<string, Buyer>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteAwakNo, setDeleteAwakNo] = useState<string>('');
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

      const farmersMap = (farmersData || []).reduce((acc, f) => ({ ...acc, [f.id]: f }), {});
      const buyersMap = (buyersData || []).reduce((acc, b) => ({ ...acc, [b.id]: b }), {});
      
      setFarmers(farmersMap);
      setBuyers(buyersMap);
      setAwaks((awaksData || []).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (error) {
      toast.error('Failed to load awak inward entries');
      console.error('Failed to load awaks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteAwak(deleteId);
      toast.success(`Awak entry #${deleteAwakNo} deleted`);
      await loadData();
    } catch (error) {
      toast.error('Failed to delete awak entry');
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

  // Calculate totals
  const totalBags = awaks.reduce((sum, a) => sum + (Number(a.totalBags) || 0), 0);
  const totalWeight = awaks.reduce((sum, a) => sum + (Number(a.totalWeight) || 0), 0);
  const totalAmount = awaks.reduce((sum, a) => sum + (Number(a.totalAmount) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Awak / Inward Arrivals</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
              {filteredAwaks.length} entries
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Record and monitor daily arrivals of turmeric crop from farmers</p>
        </div>
        <Button 
          variant="primary" 
          icon={<Plus size={16} />} 
          onClick={() => navigate('/awak/new')}
        >
          New Awak Entry
        </Button>
      </div>

      {/* Summary KPI Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 text-xs font-medium">
            <span>Total Awaks</span>
            <ArrowDownLeft size={16} className="text-[#C8920A]" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{awaks.length}</div>
          <div className="text-[11px] text-gray-400 mt-0.5">Recorded inwards</div>
        </div>

        <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 text-xs font-medium">
            <span>Total Bags</span>
            <PackageCheck size={16} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{totalBags}</div>
          <div className="text-[11px] text-gray-400 mt-0.5">Bags received</div>
        </div>

        <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 text-xs font-medium">
            <span>Total Weight</span>
            <Scale size={16} className="text-sky-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{formatWeight(totalWeight)}</div>
          <div className="text-[11px] text-gray-400 mt-0.5">Net inwards</div>
        </div>

        <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 text-xs font-medium">
            <span>Gross Inward Value</span>
            <span className="text-xs font-bold text-[#C8920A]">₹</span>
          </div>
          <div className="text-xl font-bold text-[#C8920A] mt-1">{formatCurrency(totalAmount)}</div>
          <div className="text-[11px] text-gray-400 mt-0.5">Commodity valuation</div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-gray-200/80 rounded-2xl shadow-xs overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 justify-between items-center bg-gray-50/40">
          <div className="w-full sm:w-80">
            <SearchBox 
              value={searchTerm} 
              onChange={setSearchTerm} 
              placeholder="Search by Awak No, Farmer or Buyer..." 
            />
          </div>
          <div className="text-xs text-gray-500 self-end sm:self-center font-medium">
            Showing {filteredAwaks.length} of {awaks.length}
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
        ) : filteredAwaks.length === 0 ? (
          <div className="p-8">
            <EmptyState 
              icon={<ArrowDownLeft size={32} className="text-[#C8920A]" />}
              title="No awak arrivals found"
              description={searchTerm ? "No arrivals match your search query." : "Record your first turmeric arrival entry."}
              action={
                !searchTerm && (
                  <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => navigate('/awak/new')}>
                    Add First Awak Entry
                  </Button>
                )
              }
            />
          </div>
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Awak No</Th>
                <Th>Date</Th>
                <Th>Farmer</Th>
                <Th>Village</Th>
                <Th>Buyer</Th>
                <Th className="text-right">Bags</Th>
                <Th className="text-right">Weight</Th>
                <Th className="text-right">Amount</Th>
                <Th className="text-center">Status</Th>
                <Th className="text-right w-32">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredAwaks.map((awak) => {
                const farmer = farmers[awak.farmerId];
                const buyer = buyers[awak.buyerId];
                
                return (
                  <Tr key={awak.id} onClick={() => navigate(`/awak/${awak.id}/edit`)}>
                    <Td className="font-semibold text-gray-900 font-mono text-xs">
                      #{awak.awakNo}
                    </Td>
                    <Td className="text-xs text-gray-600">{formatDate(awak.date)}</Td>
                    <Td className="font-medium text-gray-900">{farmer?.name || '—'}</Td>
                    <Td className="text-gray-500 text-xs">{farmer?.village || awak.village || '—'}</Td>
                    <Td className="text-gray-600 text-xs">{buyer?.name || '—'}</Td>
                    <Td className="text-right font-semibold">{awak.totalBags}</Td>
                    <Td className="text-right font-mono text-xs">{formatWeight(awak.totalWeight)}</Td>
                    <Td className="text-right font-bold text-gray-900">{formatCurrency(awak.totalAmount)}</Td>
                    <Td className="text-center">
                      <Badge variant={awak.status === 'COMPLETED' ? 'success' : 'warning'}>
                        {awak.status || 'PENDING'}
                      </Badge>
                    </Td>
                    <Td className="text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                        <button 
                          onClick={() => navigate(`/awak/${awak.id}/edit`)} 
                          className="p-1.5 text-gray-400 hover:text-[#C8920A] rounded-md hover:bg-amber-50 transition-colors cursor-pointer" 
                          title="View or Edit Entry"
                        >
                          <Edit size={15} />
                        </button>
                        <button 
                          onClick={() => navigate(`/farmer-patti/new/${awak.id}`)} 
                          className="p-1.5 text-gray-400 hover:text-emerald-600 rounded-md hover:bg-emerald-50 transition-colors cursor-pointer" 
                          title="Generate Farmer Patti"
                        >
                          <FileText size={15} />
                        </button>
                        <button 
                          onClick={() => {
                            setDeleteId(awak.id);
                            setDeleteAwakNo(String(awak.awakNo));
                          }} 
                          className="p-1.5 text-gray-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors cursor-pointer" 
                          title="Delete Entry"
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
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Awak Entry"
        message={`Are you sure you want to delete Awak #${deleteAwakNo}? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
