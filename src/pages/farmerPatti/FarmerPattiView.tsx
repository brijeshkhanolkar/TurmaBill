import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, ArrowLeft, Edit } from 'lucide-react';
import { getFarmerPattiById, getSettings } from '../../database/services';
import { FarmerPatti, AppSettings } from '../../types';
import { Button } from '../../components/ui/Button';
import { FarmerPattiPrint } from '../../components/print/FarmerPattiPrint';

export default function FarmerPattiView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patti, setPatti] = useState<FarmerPatti | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadData(Number(id));
  }, [id]);

  const loadData = async (pattiId: number) => {
    try {
      const [data, s] = await Promise.all([
        getFarmerPattiById(pattiId),
        getSettings()
      ]);
      if (data) setPatti(data);
      if (s) setSettings(s);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6 text-center">Loading...</div>;
  if (!patti || !settings) return <div className="p-6 text-center text-red-500">Patti not found.</div>;

  return (
    <div>
      {/* Controls - hidden when printing */}
      <div className="no-print flex items-center justify-between mb-4">
        <Button variant="ghost" onClick={() => navigate(-1)} icon={<ArrowLeft size={16} />}>Back</Button>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigate(`/farmer-patti/${patti.id}/edit`)} icon={<Edit size={16} />}>Edit</Button>
          <Button variant="primary" onClick={() => window.print()} icon={<Printer size={16} />}>Print Patti</Button>
        </div>
      </div>

      {/* Print Area */}
      <FarmerPattiPrint patti={patti} settings={settings} />
    </div>
  );
}
