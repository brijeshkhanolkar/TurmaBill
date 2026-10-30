import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAllProducts, deleteProduct, updateProduct } from '../../database/services';
import { Product } from '../../types';
import { 
  Button, Table, Thead, Tbody, Tr, Th, Td, 
  ConfirmDialog, EmptyState, Badge, SearchBox 
} from '../../components/ui';
import { formatCurrency } from '../../utils/formatters';

export default function ProductList() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [deleteDialog, setDeleteDialog] = useState<{isOpen: boolean, id: string | null, name?: string}>({
    isOpen: false,
    id: null,
    name: ''
  });

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFilteredProducts(products);
    } else {
      const lower = search.toLowerCase();
      setFilteredProducts(
        products.filter(p => 
          (p.name || '').toLowerCase().includes(lower) || 
          (p.hsnCode || '').includes(lower) ||
          (p.unit || '').toLowerCase().includes(lower)
        )
      );
    }
  }, [search, products]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await getAllProducts();
      setProducts(data || []);
      setFilteredProducts(data || []);
    } catch (error) {
      toast.error('Failed to load products');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (product: Product) => {
    try {
      const updated = !product.isActive;
      await updateProduct(product.id!, { ...product, isActive: updated });
      toast.success(`Product "${product.name}" marked as ${updated ? 'Active' : 'Inactive'}`);
      loadProducts();
    } catch (error) {
      toast.error('Failed to update product status');
    }
  };

  const handleDeleteClick = (product: Product) => {
    setDeleteDialog({ isOpen: true, id: product.id!, name: product.name });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.id) return;
    try {
      await deleteProduct(deleteDialog.id);
      toast.success(`Product "${deleteDialog.name}" deleted successfully`);
      loadProducts();
    } catch (error) {
      toast.error('Failed to delete product');
      console.error(error);
    } finally {
      setDeleteDialog({ isOpen: false, id: null });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Products & Commodity Grades</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              {filteredProducts.length} items
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Configure turmeric varieties (Salem, Rajapuri, Finger), HSN codes, and base rates</p>
        </div>
        <Button 
          variant="primary" 
          icon={<Plus size={16} />} 
          onClick={() => navigate('/products/new')}
        >
          Add Product
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
              placeholder="Search product name, HSN code..." 
            />
          </div>
          <div className="text-xs text-gray-500 self-end sm:self-center font-medium">
            Showing {filteredProducts.length} of {products.length}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="p-8">
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-12 bg-gray-50 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-8">
            <EmptyState 
              icon={<Package size={32} className="text-[#C8920A]" />}
              title="No products found"
              description={search ? "No products match your search keyword." : "Get started by adding your first product variety."}
              action={
                !search && (
                  <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => navigate('/products/new')}>
                    Add First Product
                  </Button>
                )
              }
            />
          </div>
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Product Variety / Grade</Th>
                <Th>HSN Code</Th>
                <Th>Billing Unit</Th>
                <Th className="text-right">Default Rate (Per Qtl)</Th>
                <Th className="text-right">Opening Stock</Th>
                <Th className="text-center">Status</Th>
                <Th className="text-right w-24">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredProducts.map((product) => (
                <Tr key={product.id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200/70 text-[#C8920A] flex items-center justify-center shrink-0">
                        <Package size={16} />
                      </div>
                      <div className="font-semibold text-gray-900">
                        {product.name}
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <span className="font-mono text-xs text-gray-600 bg-gray-50 px-2 py-0.5 rounded border border-gray-200/70">
                      {product.hsnCode || '0910'}
                    </span>
                  </Td>
                  <Td>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                      {product.unit}
                    </span>
                  </Td>
                  <Td className="text-right font-bold text-gray-900">
                    {formatCurrency(product.defaultRate)}
                  </Td>
                  <Td className="text-right font-mono text-gray-600 text-xs">
                    {product.openingStock || 0}
                  </Td>
                  <Td className="text-center">
                    <button 
                      onClick={() => toggleStatus(product)}
                      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold transition-colors cursor-pointer border ${
                        product.isActive 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                          : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                      }`}
                      title="Click to toggle status"
                    >
                      {product.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </Td>
                  <Td className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button 
                        className="p-1.5 text-gray-400 hover:text-[#C8920A] rounded-md hover:bg-amber-50 transition-colors cursor-pointer"
                        title="Edit Product"
                        onClick={() => navigate(`/products/${product.id}/edit`)}
                      >
                        <Edit size={15} />
                      </button>
                      <button 
                        className="p-1.5 text-gray-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete Product"
                        onClick={() => handleDeleteClick(product)}
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
        title="Delete Product"
        message={`Are you sure you want to delete ${deleteDialog.name || 'this product'}? This could affect existing transactions if the product is in use.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
