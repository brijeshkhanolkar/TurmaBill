import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Package, Tag, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import { getProductById, addProduct, updateProduct } from '../../database/services';
import { Product } from '../../types';
import { Button, Input, Select } from '../../components/ui';

export default function ProductForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    hsnCode: '0910',
    unit: 'KG',
    defaultRate: 0,
    openingStock: 0,
    isActive: true
  });

  const unitOptions = [
    { value: 'KG', label: 'Kilograms (KG)' },
    { value: 'Bags', label: 'Bags' },
    { value: 'Quintals', label: 'Quintals (100 KG)' }
  ];

  useEffect(() => {
    if (isEdit && id) {
      loadProduct(id);
    }
  }, [id, isEdit]);

  const loadProduct = async (productId: string) => {
    try {
      setLoading(true);
      const product = await getProductById(productId);
      if (product) {
        setFormData(product);
      } else {
        toast.error('Product not found');
        navigate('/products');
      }
    } catch (error) {
      toast.error('Failed to load product details');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: Number(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.unit) {
      toast.error('Please enter product name and unit');
      return;
    }

    try {
      setLoading(true);
      if (isEdit && id) {
        await updateProduct(id, formData as Product);
        toast.success('Product updated successfully');
      } else {
        await addProduct(formData as Omit<Product, 'id'>);
        toast.success('Product added successfully');
      }
      navigate('/products');
    } catch (error) {
      toast.error(isEdit ? 'Failed to update product' : 'Failed to add product');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            icon={<ArrowLeft size={16} />} 
            onClick={() => navigate('/products')}
            className="text-gray-500 hover:text-gray-900"
          >
            Back
          </Button>
          <div className="h-4 w-px bg-gray-200" />
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              {isEdit ? 'Edit Product Variety' : 'Add New Product Variety'}
            </h1>
            <p className="text-xs text-gray-500">Configure commodity specifications, HSN code, and base rates</p>
          </div>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="bg-white border border-gray-200/80 rounded-2xl shadow-xs overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100 text-sm font-bold text-gray-800">
              <Package size={16} className="text-[#C8920A]" />
              Commodity Specifications
            </div>
            
            <div className="space-y-4">
              <Input
                label="Product Variety / Name"
                name="name"
                value={formData.name || ''}
                onChange={handleChange}
                required
                placeholder="e.g. Turmeric Salem Finger, Rajapuri, Gatha"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="HSN Code"
                  name="hsnCode"
                  value={formData.hsnCode || '0910'}
                  onChange={handleChange}
                  placeholder="0910 (Turmeric)"
                />
                <Select
                  label="Trading / Billing Unit"
                  name="unit"
                  value={formData.unit || 'KG'}
                  onChange={handleChange}
                  options={unitOptions}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Default Rate (₹ / Quintal)"
                  name="defaultRate"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.defaultRate ?? 0}
                  onChange={handleChange}
                  placeholder="e.g. 14500"
                />
                <Input
                  label="Opening Stock (Bags)"
                  name="openingStock"
                  type="number"
                  min="0"
                  value={formData.openingStock ?? 0}
                  onChange={handleChange}
                  placeholder="Initial bags in godown"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive ?? true}
                    onChange={handleChange}
                    className="w-4 h-4 rounded text-[#C8920A] focus:ring-[#C8920A]/30 border-gray-300 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-700">Active product (available for billing & inwards)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Actions Bar */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/products')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              icon={<Save size={16} />}
              loading={loading}
            >
              {isEdit ? 'Update Product' : 'Save Product'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
