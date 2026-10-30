import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Edit, Trash2, Building2, MapPin, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAllBuyers, deleteBuyer } from '../../database/services';
import { Buyer } from '../../types';
import { 
  Button, Table, Thead, Tbody, Tr, Th, Td, 
  SearchBox, ConfirmDialog, EmptyState, Badge 
} from '../../components/ui';

export default function BuyerList() {
  const navigate = useNavigate();
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [filteredBuyers, setFilteredBuyers] = useState<Buyer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [deleteDialog, setDeleteDialog] = useState<{isOpen: boolean, id: string | null, name?: string}>({
    isOpen: false,
    id: null,
    name: ''
  });

  useEffect(() => {
    loadBuyers();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFilteredBuyers(buyers);
    } else {
      const lower = search.toLowerCase();
      setFilteredBuyers(
        buyers.filter(b => 
          (b.name || '').toLowerCase().includes(lower) || 
          (b.city || '').toLowerCase().includes(lower) ||
          (b.mobile || '').includes(lower) ||
          (b.gstin && b.gstin.toLowerCase().includes(lower))
        )
      );
    }
  }, [search, buyers]);

  const loadBuyers = async () => {
    try {
      setLoading(true);
      const data = await getAllBuyers();
      setBuyers(data || []);
      setFilteredBuyers(data || []);
    } catch (error) {
      toast.error('Failed to load buyers');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, buyer: Buyer) => {
    e.stopPropagation();
    setDeleteDialog({ isOpen: true, id: buyer.id!, name: buyer.name });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.id) return;
    try {
      await deleteBuyer(deleteDialog.id);
      toast.success(`Buyer "${deleteDialog.name}" deleted successfully`);
      loadBuyers();
    } catch (error) {
      toast.error('Failed to delete buyer');
      console.error(error);
    } finally {
      setDeleteDialog({ isOpen: false, id: null });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(w => w[0].toUpperCase())
      .join('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Buyers / Traders</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-200">
              {filteredBuyers.length} total
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Manage wholesale buyers, GSTIN details, and commercial invoices</p>
        </div>
        <Button 
          variant="primary" 
          icon={<Plus size={16} />} 
          onClick={() => navigate('/buyers/new')}
        >
          Add Buyer
        </Button>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-gray-200/80 rounded-2xl shadow-xs overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 justify-between items-center bg-gray-50/40">
          <div className="w-full sm:w-80">
            <SearchBox 
              value={search} 
              onChange={setSearch} 
              placeholder="Search by name, city, GSTIN or mobile..." 
            />
          </div>
          <div className="text-xs text-gray-500 self-end sm:self-center font-medium">
            Showing {filteredBuyers.length} of {buyers.length}
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
        ) : filteredBuyers.length === 0 ? (
          <div className="p-8">
            <EmptyState 
              icon={<Building2 size={32} className="text-sky-600" />}
              title="No buyers found"
              description={search ? "No buyers match your search terms." : "Get started by adding your first buyer or trading company."}
              action={
                !search && (
                  <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => navigate('/buyers/new')}>
                    Add First Buyer
                  </Button>
                )
              }
            />
          </div>
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th className="w-16">ID</Th>
                <Th>Buyer Name</Th>
                <Th>City</Th>
                <Th>Mobile</Th>
                <Th>GSTIN</Th>
                <Th className="text-right">Total Purchases</Th>
                <Th className="text-right w-28">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredBuyers.map((buyer) => (
                <Tr 
                  key={buyer.id} 
                  onClick={() => navigate(`/buyers/${buyer.id}`)}
                >
                  <Td className="text-xs font-mono font-medium text-gray-400">
                    #{String(buyer.id || '').padStart(3, '0')}
                  </Td>
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-sky-50 border border-sky-200/60 text-sky-700 font-semibold text-xs flex items-center justify-center shrink-0">
                        {getInitials(buyer.name || 'B')}
                      </div>
                      <div className="font-semibold text-gray-900 hover:text-sky-700 transition-colors">
                        {buyer.name}
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <span className="inline-flex items-center gap-1 text-gray-600">
                      <MapPin size={13} className="text-gray-400 shrink-0" />
                      {buyer.city || '—'}
                    </span>
                  </Td>
                  <Td>
                    <span className="inline-flex items-center gap-1 text-gray-600 font-mono text-xs">
                      <Phone size={13} className="text-gray-400 shrink-0" />
                      {buyer.mobile || '—'}
                    </span>
                  </Td>
                  <Td>
                    {buyer.gstin ? (
                      <span className="inline-block px-2 py-0.5 rounded-md font-mono text-xs bg-gray-50 border border-gray-200/70 text-gray-700 font-medium">
                        {buyer.gstin}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </Td>
                  <Td className="text-right">
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                      {buyer.totalPurchases || 0}
                    </span>
                  </Td>
                  <Td className="text-right">
                    <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                      <button 
                        className="p-1.5 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors cursor-pointer"
                        title="View Details"
                        onClick={() => navigate(`/buyers/${buyer.id}`)}
                      >
                        <Eye size={15} />
                      </button>
                      <button 
                        className="p-1.5 text-gray-400 hover:text-sky-600 rounded-md hover:bg-sky-50 transition-colors cursor-pointer"
                        title="Edit Buyer"
                        onClick={() => navigate(`/buyers/${buyer.id}/edit`)}
                      >
                        <Edit size={15} />
                      </button>
                      <button 
                        className="p-1.5 text-gray-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete Buyer"
                        onClick={(e) => handleDeleteClick(e, buyer)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </div>

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, id: null })}
        onConfirm={confirmDelete}
        title="Delete Buyer"
        message={`Are you sure you want to delete ${deleteDialog.name || 'this buyer'}? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
