import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Edit, Trash2, Printer, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAllFarmerPattis, deleteFarmerPatti, getAllFarmers, getAllBuyers } from '../../database/services';
import { FarmerPatti } from '../../types';
import { formatDate, formatWeight, formatCurrency } from '../../utils/formatters';
import { Button, Table, Thead, Tbody, Tr, Th, Td, Badge, SearchBox, ConfirmDialog, EmptyState } from '../../components/ui';

export default function FarmerPattiList() {
  const navigate = useNavigate();
  const [pattis, setPattis] = useState<FarmerPatti[]>([]);
  const [farmers, setFarmers] = useState<Record<string, any>>({});
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
      const [pData, fData, bData] = await Promise.all([
        getAllFarmerPattis(), getAllFarmers(), getAllBuyers()
      ]);
      const fMap = (fData || []).reduce((acc, f) => ({ ...acc, [f.id]: f }), {});
      const bMap = (bData || []).reduce((acc, b) => ({ ...acc, [b.id]: b }), {});
      setFarmers(fMap);
      setBuyers(bMap);
      setPattis((pData || []).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (e) {
      toast.error('Failed to load farmer pattis');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.id) return;
    try {
      await deleteFarmerPatti(deleteDialog.id);
      toast.success(`Patti ${deleteDialog.no} deleted`);
      loadData();
    } catch (err) {
      toast.error('Failed to delete patti');
    } finally {
      setDeleteDialog({ isOpen: false, id: null });
    }
  };

  const filtered = pattis.filter(p => {
    const fn = farmers[p.farmerId]?.name || '';
    const st = searchTerm.toLowerCase();
    const pNo = p.pattiNo || (p as any).pattiNumber || '';
    return String(pNo).toLowerCase().includes(st) || fn.toLowerCase().includes(st);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Farmer Pattis</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
              {filtered.length} bills
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Settlement bills and net payable slips issued to farmers</p>
        </div>
        <Button 
          variant="primary" 
          icon={<Plus size={16} />} 
          onClick={() => navigate('/farmer-patti/new')}
        >
          Create New Patti
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
              placeholder="Search by Patti No or Farmer..." 
            />
          </div>
          <div className="text-xs text-gray-500 self-end sm:self-center font-medium">
            Showing {filtered.length} of {pattis.length}
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
              icon={<FileText size={32} className="text-[#C8920A]" />}
              title="No farmer pattis found"
              description={searchTerm ? "No pattis match your search filter." : "Create your first farmer patti settlement."}
              action={
                !searchTerm && (
                  <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => navigate('/farmer-patti/new')}>
                    Create First Patti
                  </Button>
                )
              }
            />
          </div>
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Patti No</Th>
                <Th>Date</Th>
                <Th>Farmer</Th>
                <Th>Village</Th>
                <Th className="text-right">Bags</Th>
                <Th className="text-right">Weight</Th>
                <Th className="text-right">Net Payable</Th>
                <Th className="text-center">Status</Th>
                <Th className="text-right w-28">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filtered.map(patti => {
                const farmer = farmers[patti.farmerId];
                const pNo = patti.pattiNo || (patti as any).pattiNumber || '';
                const net = patti.netAmount || (patti as any).pattiAmount || 0;
                const weight = patti.totalNetWeight || patti.totalWeight || 0;

                return (
                  <Tr key={patti.id} onClick={() => navigate(`/farmer-patti/${patti.id}`)}>
                    <Td className="font-semibold text-gray-900 font-mono text-xs">
                      {pNo}
                    </Td>
                    <Td className="text-xs text-gray-600">{formatDate(patti.date)}</Td>
                    <Td className="font-medium text-gray-900">{farmer?.name || '—'}</Td>
                    <Td className="text-xs text-gray-500">{farmer?.village || '—'}</Td>
                    <Td className="text-right font-semibold">{patti.totalBags}</Td>
                    <Td className="text-right font-mono text-xs">{formatWeight(weight)}</Td>
                    <Td className="text-right font-bold text-gray-900">{formatCurrency(net)}</Td>
                    <Td className="text-center">
                      <Badge variant={patti.status === 'COMPLETED' ? 'success' : 'warning'}>
                        {patti.status || 'GENERATED'}
                      </Badge>
                    </Td>
                    <Td className="text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                        <button 
                          className="p-1.5 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors cursor-pointer" 
                          title="View & Print Patti"
                          onClick={() => navigate(`/farmer-patti/${patti.id}`)}
                        >
                          <Eye size={15} />
                        </button>
                        <button 
                          className="p-1.5 text-gray-400 hover:text-[#C8920A] rounded-md hover:bg-amber-50 transition-colors cursor-pointer" 
                          title="Edit Patti"
                          onClick={() => navigate(`/farmer-patti/${patti.id}/edit`)}
                        >
                          <Edit size={15} />
                        </button>
                        <button 
                          className="p-1.5 text-gray-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors cursor-pointer" 
                          title="Delete Patti"
                          onClick={() => setDeleteDialog({ isOpen: true, id: patti.id, no: pNo })}
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
        title="Delete Farmer Patti"
        message={`Are you sure you want to delete Patti ${deleteDialog.no}? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
