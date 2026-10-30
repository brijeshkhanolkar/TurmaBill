import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Edit, Trash2, Users, MapPin, Phone, ArrowUpDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAllFarmers, deleteFarmer } from '../../database/services';
import { Farmer } from '../../types';
import { 
  Button, Table, Thead, Tbody, Tr, Th, Td, 
  SearchBox, ConfirmDialog, EmptyState, Badge 
} from '../../components/ui';

export default function FarmerList() {
  const navigate = useNavigate();
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [filteredFarmers, setFilteredFarmers] = useState<Farmer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [deleteDialog, setDeleteDialog] = useState<{isOpen: boolean, id: string | null, name?: string}>({
    isOpen: false,
    id: null,
    name: ''
  });

  useEffect(() => {
    loadFarmers();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFilteredFarmers(farmers);
    } else {
      const lower = search.toLowerCase();
      setFilteredFarmers(
        farmers.filter(f => 
          (f.name || '').toLowerCase().includes(lower) || 
          (f.village || '').toLowerCase().includes(lower) ||
          (f.mobile || '').includes(lower)
        )
      );
    }
  }, [search, farmers]);

  const loadFarmers = async () => {
    try {
      setLoading(true);
      const data = await getAllFarmers();
      setFarmers(data || []);
      setFilteredFarmers(data || []);
    } catch (error) {
      toast.error('Failed to load farmers');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, farmer: Farmer) => {
    e.stopPropagation();
    setDeleteDialog({ isOpen: true, id: farmer.id!, name: farmer.name });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.id) return;
    try {
      await deleteFarmer(deleteDialog.id);
      toast.success(`Farmer "${deleteDialog.name}" deleted successfully`);
      loadFarmers();
    } catch (error) {
      toast.error('Failed to delete farmer');
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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Farmers</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
              {filteredFarmers.length} total
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Manage farmer profiles, villages, bank info, and transactions</p>
        </div>
        <Button 
          variant="primary" 
          icon={<Plus size={16} />} 
          onClick={() => navigate('/farmers/new')}
        >
          Add Farmer
        </Button>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-gray-200/80 rounded-2xl shadow-xs overflow-hidden">
        {/* Search & Filter Toolbar */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 justify-between items-center bg-gray-50/40">
          <div className="w-full sm:w-80">
            <SearchBox 
              value={search} 
              onChange={setSearch} 
              placeholder="Search by name, village, mobile..." 
            />
          </div>
          <div className="text-xs text-gray-500 self-end sm:self-center font-medium">
            Showing {filteredFarmers.length} of {farmers.length}
          </div>
        </div>

        {/* Content State */}
        {loading ? (
          <div className="p-8">
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-12 bg-gray-50 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        ) : filteredFarmers.length === 0 ? (
          <div className="p-8">
            <EmptyState 
              icon={<Users size={32} className="text-[#C8920A]" />}
              title="No farmers found"
              description={search ? "No farmers match your search terms. Try searching for a different keyword." : "Get started by adding your first farmer to the system."}
              action={
                !search && (
                  <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => navigate('/farmers/new')}>
                    Add First Farmer
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
                <Th>Farmer Name</Th>
                <Th>Village</Th>
                <Th>Mobile</Th>
                <Th className="text-right">Total Trans.</Th>
                <Th className="text-right w-28">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredFarmers.map((farmer) => (
                <Tr 
                  key={farmer.id} 
                  onClick={() => navigate(`/farmers/${farmer.id}`)}
                >
                  <Td className="text-xs font-mono font-medium text-gray-400">
                    #{String(farmer.id || '').padStart(3, '0')}
                  </Td>
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-200/60 text-[#C8920A] font-semibold text-xs flex items-center justify-center shrink-0">
                        {getInitials(farmer.name || 'F')}
                      </div>
                      <div className="font-semibold text-gray-900 hover:text-[#C8920A] transition-colors">
                        {farmer.name}
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <span className="inline-flex items-center gap-1 text-gray-600">
                      <MapPin size={13} className="text-gray-400 shrink-0" />
                      {farmer.village || '—'}
                    </span>
                  </Td>
                  <Td>
                    <span className="inline-flex items-center gap-1 text-gray-600 font-mono text-xs">
                      <Phone size={13} className="text-gray-400 shrink-0" />
                      {farmer.mobile || '—'}
                    </span>
                  </Td>
                  <Td className="text-right">
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                      {farmer.totalTransactions || 0}
                    </span>
                  </Td>
                  <Td className="text-right">
                    <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                      <button 
                        className="p-1.5 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors cursor-pointer"
                        title="View Details"
                        onClick={() => navigate(`/farmers/${farmer.id}`)}
                      >
                        <Eye size={15} />
                      </button>
                      <button 
                        className="p-1.5 text-gray-400 hover:text-[#C8920A] rounded-md hover:bg-amber-50 transition-colors cursor-pointer"
                        title="Edit Farmer"
                        onClick={() => navigate(`/farmers/${farmer.id}/edit`)}
                      >
                        <Edit size={15} />
                      </button>
                      <button 
                        className="p-1.5 text-gray-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete Farmer"
                        onClick={(e) => handleDeleteClick(e, farmer)}
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
        title="Delete Farmer"
        message={`Are you sure you want to delete ${deleteDialog.name || 'this farmer'}? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
