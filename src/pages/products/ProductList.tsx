import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAllProducts, deleteProduct, updateProduct } from '../../database/services';
import { Product } from '../../types';
import { 
  Button, Table, Thead, Tbody, Tr, Th, Td, 
  ConfirmDialog, EmptyState, Badge 
} from '../../components/ui';
import { formatCurrency } from '../../utils/formatters';

export default function ProductList() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [deleteDialog, setDeleteDialog] = useState<{isOpen: boolean, id: string | null}>({
    isOpen: false,
    id: null
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await getAllProducts();
      setProducts(data || []);
    } catch (error) {
      toast.error('Failed to load products');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (product: Product) => {
    try {
      await updateProduct(product.id!, { ...product, isActive: !product.isActive });
      toast.success(`Product marked as ${!product.isActive ? 'Active' : 'Inactive'}`);
      loadProducts();
    } catch (error) {
      toast.error('Failed to update product status');
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteDialog({ isOpen: true, id });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.id) return;
    try {
      await deleteProduct(deleteDialog.id);
      toast.success('Product deleted successfully');
      loadProducts();
    } catch (error) {
      toast.error('Failed to delete product');
      console.error(error);
    } finally {
      setDeleteDialog({ isOpen: false, id: null });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-gray-800">Products</h1>
          <Badge variant="info">{products.length}</Badge>
        </div>
        <Button 
          variant="primary" 
          icon={<Plus size={16} />} 
          onClick={() => navigate('/products/new')}
        >
          Add Product
        </Button>
      </div>

      <div className="bg-white border border-gray-200 rounded shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="p-8">
            <EmptyState 
              icon={<Package size={48} className="text-gray-400" />}
              title="No products found"
              description="Get started by adding your first product to inventory."
              action={
                <Button variant="primary" onClick={() => navigate('/products/new')}>
                  Add Product
                </Button>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>HSN Code</Th>
                  <Th>Unit</Th>
                  <Th className="text-right">Default Rate</Th>
                  <Th className="text-right">Opening Stock</Th>
                  <Th className="text-center">Status</Th>
                  <Th className="text-right">Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {products.map((product) => (
                  <Tr key={product.id} className="hover:bg-gray-50">
                    <Td className="font-medium text-gray-900">{product.name}</Td>
                    <Td>{product.hsnCode || '-'}</Td>
                    <Td>{product.unit}</Td>
                    <Td className="text-right">{formatCurrency(product.defaultRate)}</Td>
                    <Td className="text-right">{product.openingStock || 0}</Td>
                    <Td className="text-center">
                      <button 
                        onClick={() => toggleStatus(product)}
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          product.isActive 
                            ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {product.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </Td>
                    <Td className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          icon={<Edit size={14} className="text-blue-600" />} 
                          onClick={() => navigate(`/products/${product.id}/edit`)} 
                        />
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          icon={<Trash2 size={14} className="text-red-600" />} 
                          onClick={() => handleDeleteClick(product.id!)} 
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
        title="Delete Product"
        message="Are you sure you want to delete this product? This could affect existing transactions if the product is in use."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
