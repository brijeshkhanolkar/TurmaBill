import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, Building2, MapPin, FileText } from 'lucide-react';
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
    if (!formData.name?.trim() || !formData.city?.trim() || !formData.mobile?.trim()) {
      toast.error('Please enter buyer name, city, and mobile number');
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
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            icon={<ArrowLeft size={16} />} 
            onClick={() => navigate('/buyers')}
            className="text-gray-500 hover:text-gray-900"
          >
            Back
          </Button>
          <div className="h-4 w-px bg-gray-200" />
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              {isEdit ? 'Edit Buyer Profile' : 'Add New Buyer'}
            </h1>
            <p className="text-xs text-gray-500">Configure business, billing location, and tax credentials</p>
          </div>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="bg-white border border-gray-200/80 rounded-2xl shadow-xs overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
          {/* Section 1: Business Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100 text-sm font-bold text-gray-800">
              <Building2 size={16} className="text-[#C8920A]" />
              Business & Contact Information
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Business / Buyer Name"
                name="name"
                value={formData.name || ''}
                onChange={handleChange}
                required
                placeholder="e.g. Mahavir Spices Corp."
              />
              <Input
                label="City / Market"
                name="city"
                value={formData.city || ''}
                onChange={handleChange}
                required
                placeholder="e.g. Mumbai or Sangli"
              />
              <Input
                label="Mobile / Phone Number"
                name="mobile"
                value={formData.mobile || ''}
                onChange={handleChange}
                required
                placeholder="10-digit mobile number"
              />
              <Input
                label="Full Address (Optional)"
                name="address"
                value={formData.address || ''}
                onChange={handleChange}
                placeholder="Shop number, APMC Market Yard"
              />
            </div>
          </div>

          {/* Section 2: Tax & Compliance */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100 text-sm font-bold text-gray-800">
              <FileText size={16} className="text-[#C8920A]" />
              Tax & Compliance Details
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="GSTIN Number (Optional)"
                name="gstin"
                value={formData.gstin || ''}
                onChange={handleChange}
                placeholder="e.g. 27AAAAA0000A1Z5"
              />
              <Input
                label="PAN Number (Optional)"
                name="panNumber"
                value={formData.panNumber || ''}
                onChange={handleChange}
                placeholder="e.g. ABCDE1234F"
              />
            </div>
          </div>

          {/* Section 3: Notes */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100 text-sm font-bold text-gray-800">
              <FileText size={16} className="text-[#C8920A]" />
              Notes & Trade Terms
            </div>
            <Input
              label="Remarks / Notes"
              name="notes"
              value={formData.notes || ''}
              onChange={handleChange}
              placeholder="Credit terms, special billing instructions, etc."
            />
          </div>

          {/* Actions Bar */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="secondary"
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
