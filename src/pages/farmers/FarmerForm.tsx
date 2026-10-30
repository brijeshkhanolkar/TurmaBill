import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, User, Phone, MapPin, Building2, FileText } from 'lucide-react';
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
    if (!formData.name?.trim() || !formData.village?.trim() || !formData.mobile?.trim()) {
      toast.error('Please enter name, village, and mobile number');
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
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            icon={<ArrowLeft size={16} />} 
            onClick={() => navigate('/farmers')}
            className="text-gray-500 hover:text-gray-900"
          >
            Back
          </Button>
          <div className="h-4 w-px bg-gray-200" />
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              {isEdit ? 'Edit Farmer Profile' : 'Add New Farmer'}
            </h1>
            <p className="text-xs text-gray-500">Enter personal contact and bank settlement info</p>
          </div>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="bg-white border border-gray-200/80 rounded-2xl shadow-xs overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
          {/* Section 1: Basic Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100 text-sm font-bold text-gray-800">
              <User size={16} className="text-[#C8920A]" />
              Basic Information
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Farmer Name"
                name="name"
                value={formData.name || ''}
                onChange={handleChange}
                required
                placeholder="e.g. Ramesh Patel"
              />
              <Input
                label="Village / Town"
                name="village"
                value={formData.village || ''}
                onChange={handleChange}
                required
                placeholder="e.g. Sangli"
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
                label="PAN Number (Optional)"
                name="panNumber"
                value={formData.panNumber || ''}
                onChange={handleChange}
                placeholder="e.g. ABCDE1234F"
              />
              <div className="sm:col-span-2">
                <Input
                  label="Address (Optional)"
                  name="address"
                  value={formData.address || ''}
                  onChange={handleChange}
                  placeholder="Street or locality"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Bank Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100 text-sm font-bold text-gray-800">
              <Building2 size={16} className="text-[#C8920A]" />
              Bank & Payment Details (Optional)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                placeholder="Account number"
              />
              <Input
                label="IFSC Code"
                name="ifscCode"
                value={formData.ifscCode || ''}
                onChange={handleChange}
                placeholder="e.g. SBIN0001234"
              />
            </div>
          </div>

          {/* Section 3: Additional Notes */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100 text-sm font-bold text-gray-800">
              <FileText size={16} className="text-[#C8920A]" />
              Notes & Remarks
            </div>
            <Input
              label="Remarks / Notes"
              name="notes"
              value={formData.notes || ''}
              onChange={handleChange}
              placeholder="Any specific note regarding this farmer"
            />
          </div>

          {/* Actions Bar */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="secondary"
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
