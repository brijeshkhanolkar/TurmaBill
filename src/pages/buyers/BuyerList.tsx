import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Edit, Trash2, Building2 } from 'lucide-react';
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
  
  const [deleteDialog, setDeleteDialog] = useState<{isOpen: boolean, id: string | null}>({
    isOpen: false,
    id: null
  });

  useEffect(() => {
    loadBuyers();
  }, []);

  useEffect(() => {
    if (!search) {
      setFilteredBuyers(buyers);
    } else {
      const lowerSearch = search.toLowerCase();
      setFilteredBuyers(
        buyers.filter(b => 
          b.name.toLowerCase().includes(lowerSearch) || 
          b.city.toLowerCase().includes(lowerSearch) ||
          b.mobile.includes(lowerSearch) ||
          (b.gstin && b.gstin.toLowerCase().includes(lowerSearch))
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

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteDialog({ isOpen: true, id });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.id) return;
    try {
      await deleteBuyer(deleteDialog.id);
      toast.success('Buyer deleted successfully');
      loadBuyers();
    } catch (error) {
      toast.error('Failed to delete buyer');
      console.error(error);
    } finally {
      setDeleteDialog({ isOpen: false, id: null });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-gray-800">Buyers</h1>
          <Badge variant="info">{filteredBuyers.length}</Badge>
        </div>
        <Button 
          variant="primary" 
          icon={<Plus size={16} />} 
          onClick={() => navigate('/buyers/new')}
        >
          Add Buyer
        </Button>
      </div>

      <div className="bg-white border border-gray-200 rounded shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <div className="w-full md:w-1/3">
            <SearchBox 
              value={search} 
              onChange={setSearch} 
              placeholder="Search by name, city, GSTIN or mobile..." 
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading buyers...</div>
        ) : filteredBuyers.length === 0 ? (
          <div className="p-8">
            <EmptyState 
              icon={<Building2 size={48} className="text-gray-400" />}
              title="No buyers found"
              description={search ? "No buyers match your search criteria." : "Get started by adding your first buyer."}
              action={
                !search && (
                  <Button variant="primary" onClick={() => navigate('/buyers/new')}>
                    Add Buyer
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
                  <Th>City</Th>
                  <Th>Mobile</Th>
                  <Th>GSTIN</Th>
                  <Th className="text-right">Total Purchases</Th>
                  <Th className="text-right">Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredBuyers.map((buyer) => (
                  <Tr 
                    key={buyer.id} 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => navigate(`/buyers/${buyer.id}`)}
                  >
                    <Td className="text-xs text-gray-500">{buyer.id?.slice(0, 6)}</Td>
                    <Td className="font-medium text-gray-900">{buyer.name}</Td>
                    <Td>{buyer.city}</Td>
                    <Td>{buyer.mobile}</Td>
                    <Td><span className="text-xs font-mono">{buyer.gstin || '-'}</span></Td>
                    <Td className="text-right">{buyer.totalPurchases || 0}</Td>
                    <Td className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          icon={<Eye size={14} />} 
                          onClick={(e) => { e.stopPropagation(); navigate(`/buyers/${buyer.id}`); }} 
                        />
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          icon={<Edit size={14} className="text-blue-600" />} 
                          onClick={(e) => { e.stopPropagation(); navigate(`/buyers/${buyer.id}/edit`); }} 
                        />
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          icon={<Trash2 size={14} className="text-red-600" />} 
                          onClick={(e) => handleDeleteClick(e, buyer.id!)} 
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
        title="Delete Buyer"
        message="Are you sure you want to delete this buyer? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
