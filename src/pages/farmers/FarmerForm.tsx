import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { getFarmerById, addFarmer, updateFarmer } from '../../database/services';
import { Farmer } from '../../types';
import { Button, Input } from '../../components/ui';

export default function FarmerForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Farmer>>({
    name: '',
    village: '',
    mobile: '',
    address: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    panNumber: '',
    notes: '',
    totalTransactions: 0,
    balance: 0
  });

  useEffect(() => {
    if (isEdit && id) {
      loadFarmer(id);
    }
  }, [id, isEdit]);

  const loadFarmer = async (farmerId: string) => {
    try {
      setLoading(true);
      const farmer = await getFarmerById(farmerId);
      if (farmer) {
        setFormData(farmer);
      } else {
        toast.error('Farmer not found');
        navigate('/farmers');
      }
    } catch (error) {
      toast.error('Failed to load farmer details');
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
    if (!formData.name || !formData.village || !formData.mobile) {
      toast.error('Please fill required fields');
      return;
    }

    try {
      setLoading(true);
      if (isEdit && id) {
        await updateFarmer(id, formData as Farmer);
        toast.success('Farmer updated successfully');
      } else {
        await addFarmer({
          ...formData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as Omit<Farmer, 'id'>);
        toast.success('Farmer added successfully');
      }
      navigate('/farmers');
    } catch (error) {
      toast.error(isEdit ? 'Failed to update farmer' : 'Failed to add farmer');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-lg font-semibold text-gray-800">
          {isEdit ? 'Edit Farmer' : 'Add New Farmer'}
        </h1>
      </div>

      <div className="bg-white border border-gray-200 rounded p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 border-b pb-2">Basic Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Farmer Name"
                name="name"
                value={formData.name || ''}
                onChange={handleChange}
                required
                placeholder="Enter full name"
              />
              <Input
                label="Village"
                name="village"
                value={formData.village || ''}
                onChange={handleChange}
                required
                placeholder="Enter village"
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
                label="PAN Number"
                name="panNumber"
                value={formData.panNumber || ''}
                onChange={handleChange}
                placeholder="Optional"
              />
              <div className="col-span-1 md:col-span-2">
                <Input
                  label="Address"
                  name="address"
                  value={formData.address || ''}
                  onChange={handleChange}
                  placeholder="Full address"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 border-b pb-2">Bank Details (Optional)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Bank Name"
                name="bankName"
                value={formData.bankName || ''}
                onChange={handleChange}
                placeholder="e.g. State Bank of India"
              />
              <Input
                label="Account Number"
                name="accountNumber"
                value={formData.accountNumber || ''}
                onChange={handleChange}
                placeholder="Enter A/C number"
              />
              <Input
                label="IFSC Code"
                name="ifscCode"
                value={formData.ifscCode || ''}
                onChange={handleChange}
                placeholder="Enter IFSC"
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
              onClick={() => navigate('/farmers')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              icon={<Save size={16} />}
              loading={loading}
            >
              {isEdit ? 'Update Farmer' : 'Save Farmer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
