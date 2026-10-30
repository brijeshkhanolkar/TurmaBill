import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, ArrowLeft, Edit } from 'lucide-react';
import { getBuyerInvoiceById, getSettings } from '../../database/services';
import { BuyerInvoice, AppSettings } from '../../types';
import { Button } from '../../components/ui/Button';
import { BuyerInvoicePrint } from '../../components/print/BuyerInvoicePrint';

export default function BuyerInvoiceView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<BuyerInvoice | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadData(Number(id));
  }, [id]);

  const loadData = async (invoiceId: number) => {
    try {
      const [data, s] = await Promise.all([
        getBuyerInvoiceById(invoiceId),
        getSettings()
      ]);
      if (data) setInvoice(data);
      if (s) setSettings(s);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6 text-center">Loading...</div>;
  if (!invoice || !settings) return <div className="p-6 text-center text-red-500">Invoice not found.</div>;

  return (
    <div>
      <div className="no-print flex items-center justify-between mb-4">
        <Button variant="ghost" onClick={() => navigate(-1)} icon={<ArrowLeft size={16} />}>Back</Button>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigate(`/buyer-invoice/${invoice.id}/edit`)} icon={<Edit size={16} />}>Edit</Button>
          <Button variant="primary" onClick={() => window.print()} icon={<Printer size={16} />}>Print Invoice</Button>
        </div>
      </div>

      <BuyerInvoicePrint invoice={invoice} settings={settings} />
    </div>
  );
}
