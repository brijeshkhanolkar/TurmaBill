import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Edit, Trash2, Users } from 'lucide-react';
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
  
  const [deleteDialog, setDeleteDialog] = useState<{isOpen: boolean, id: string | null}>({
    isOpen: false,
    id: null
  });

  useEffect(() => {
    loadFarmers();
  }, []);

  useEffect(() => {
    if (!search) {
      setFilteredFarmers(farmers);
    } else {
      const lowerSearch = search.toLowerCase();
      setFilteredFarmers(
        farmers.filter(f => 
          f.name.toLowerCase().includes(lowerSearch) || 
          f.village.toLowerCase().includes(lowerSearch) ||
          f.mobile.includes(lowerSearch)
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

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteDialog({ isOpen: true, id });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.id) return;
    try {
      await deleteFarmer(deleteDialog.id);
      toast.success('Farmer deleted successfully');
      loadFarmers();
    } catch (error) {
      toast.error('Failed to delete farmer');
      console.error(error);
    } finally {
      setDeleteDialog({ isOpen: false, id: null });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-gray-800">Farmers</h1>
          <Badge variant="info">{filteredFarmers.length}</Badge>
        </div>
        <Button 
          variant="primary" 
          icon={<Plus size={16} />} 
          onClick={() => navigate('/farmers/new')}
        >
          Add Farmer
        </Button>
      </div>

      <div className="bg-white border border-gray-200 rounded shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <div className="w-full md:w-1/3">
            <SearchBox 
              value={search} 
              onChange={setSearch} 
              placeholder="Search by name, village, or mobile..." 
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading farmers...</div>
        ) : filteredFarmers.length === 0 ? (
          <div className="p-8">
            <EmptyState 
              icon={<Users size={48} className="text-gray-400" />}
              title="No farmers found"
              description={search ? "No farmers match your search criteria." : "Get started by adding your first farmer."}
              action={
                !search && (
                  <Button variant="primary" onClick={() => navigate('/farmers/new')}>
                    Add Farmer
                  </Button>
                )
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="table-compact">
              <Thead>
                <Tr>
                  <Th>ID</Th>
                  <Th>Name</Th>
                  <Th>Village</Th>
                  <Th>Mobile</Th>
                  <Th className="text-right">Total Trans.</Th>
                  <Th className="text-right">Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredFarmers.map((farmer) => (
                  <Tr 
                    key={farmer.id} 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => navigate(`/farmers/${farmer.id}`)}
                  >
                    <Td className="text-xs text-gray-500">{farmer.id?.slice(0, 6)}</Td>
                    <Td className="font-medium text-gray-900">{farmer.name}</Td>
                    <Td>{farmer.village}</Td>
                    <Td>{farmer.mobile}</Td>
                    <Td className="text-right">{farmer.totalTransactions || 0}</Td>
                    <Td className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          icon={<Eye size={14} />} 
                          onClick={(e) => { e.stopPropagation(); navigate(`/farmers/${farmer.id}`); }} 
                        />
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          icon={<Edit size={14} className="text-blue-600" />} 
                          onClick={(e) => { e.stopPropagation(); navigate(`/farmers/${farmer.id}/edit`); }} 
                        />
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          icon={<Trash2 size={14} className="text-red-600" />} 
                          onClick={(e) => handleDeleteClick(e, farmer.id!)} 
                        />
                      </div>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, id: null })}
        onConfirm={confirmDelete}
        title="Delete Farmer"
        message="Are you sure you want to delete this farmer? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
