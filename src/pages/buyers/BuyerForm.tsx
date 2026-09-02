import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { getBuyerById, addBuyer, updateBuyer } from '../../database/services';
import { Buyer } from '../../types';
import { Button, Input } from '../../components/ui';

export default function BuyerForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Buyer>>({
    name: '',
    address: '',
    city: '',
    mobile: '',
    gstin: '',
    panNumber: '',
    notes: '',
    totalPurchases: 0,
    balance: 0
  });

  useEffect(() => {
    if (isEdit && id) {
      loadBuyer(id);
    }
  }, [id, isEdit]);

  const loadBuyer = async (buyerId: string) => {
    try {
      setLoading(true);
      const buyer = await getBuyerById(buyerId);
      if (buyer) {
        setFormData(buyer);
      } else {
        toast.error('Buyer not found');
        navigate('/buyers');
      }
    } catch (error) {
      toast.error('Failed to load buyer details');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.address || !formData.city || !formData.mobile) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      setLoading(true);
      if (isEdit && id) {
        await updateBuyer(id, formData as Buyer);
        toast.success('Buyer updated successfully');
      } else {
        await addBuyer({
          ...formData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as Omit<Buyer, 'id'>);
        toast.success('Buyer added successfully');
      }
      navigate('/buyers');
    } catch (error) {
      toast.error(isEdit ? 'Failed to update buyer' : 'Failed to add buyer');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-lg font-semibold text-gray-800">
          {isEdit ? 'Edit Buyer' : 'Add New Buyer'}
        </h1>
      </div>

      <div className="bg-white border border-gray-200 rounded p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 border-b pb-2">Business Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Business/Buyer Name"
                name="name"
                value={formData.name || ''}
                onChange={handleChange}
                required
                placeholder="Enter business name"
              />
              <Input
                label="City"
                name="city"
                value={formData.city || ''}
                onChange={handleChange}
                required
                placeholder="Enter city"
              />
              <Input
                label="Mobile Number"
                name="mobile"
                value={formData.mobile || ''}
                onChange={handleChange}
                required
                placeholder="10-digit mobile number"
              />
              <Input
                label="GSTIN"
                name="gstin"
                value={formData.gstin || ''}
                onChange={handleChange}
                placeholder="15-digit GST Number"
              />
              <div className="col-span-1 md:col-span-2">
                <Input
                  label="Full Address"
                  name="address"
                  value={formData.address || ''}
                  onChange={handleChange}
                  required
                  placeholder="Complete business address"
                />
              </div>
              <Input
                label="PAN Number"
                name="panNumber"
                value={formData.panNumber || ''}
                onChange={handleChange}
                placeholder="10-digit PAN"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 border-b pb-2">Additional Info</h2>
            <Input
              label="Notes"
              name="notes"
              value={formData.notes || ''}
              onChange={handleChange}
              placeholder="Any additional remarks"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="ghost"
              icon={<X size={16} />}
              onClick={() => navigate('/buyers')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              icon={<Save size={16} />}
              loading={loading}
            >
              {isEdit ? 'Update Buyer' : 'Save Buyer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
