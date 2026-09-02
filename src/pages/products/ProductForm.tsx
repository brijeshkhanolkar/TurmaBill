import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, X } from 'lucide-react';
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
    { value: 'Quintals', label: 'Quintals' }
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
    if (!formData.name || !formData.unit) {
      toast.error('Please fill all required fields');
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
    <div className="max-w-xl mx-auto space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-lg font-semibold text-gray-800">
          {isEdit ? 'Edit Product' : 'Add New Product'}
        </h1>
      </div>

      <div className="bg-white border border-gray-200 rounded p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-1 md:col-span-2">
                <Input
                  label="Product Name"
                  name="name"
                  value={formData.name || ''}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Turmeric Bulb, Turmeric Finger"
                />
              </div>
              <Input
                label="HSN Code"
                name="hsnCode"
                value={formData.hsnCode || ''}
                onChange={handleChange}
                required
                placeholder="0910"
              />
              <Select
                label="Unit of Measure"
                name="unit"
                value={formData.unit || 'KG'}
                onChange={handleChange}
                options={unitOptions}
                required
              />
              <Input
                label="Default Rate (₹)"
                name="defaultRate"
                type="number"
                value={formData.defaultRate?.toString() || '0'}
                onChange={handleChange}
                required
              />
              <Input
                label="Opening Stock (Bags)"
                name="openingStock"
                type="number"
                value={formData.openingStock?.toString() || '0'}
                onChange={handleChange}
              />
              
              <div className="col-span-1 md:col-span-2 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Product is active</span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-6">
                  Inactive products won't appear in new transactions.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="ghost"
              icon={<X size={16} />}
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
