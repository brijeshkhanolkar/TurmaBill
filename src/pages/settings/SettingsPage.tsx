import React, { useState, useEffect } from 'react';
import { getSettings, updateSettings } from '../../database/services';
import { AppSettings } from '../../types';
import { Save } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    const load = async () => {
      const data = await getSettings();
      if (!data) {
        setSettings({
          businessName: '',
          address: '',
          plotNo: '',
          phone: '',
          gstin: '',
          proprietor: '',
          marketYard: '',
          banks: [],
          defaultRates: {
            adat: 2.5,
            levy: 30,
            tds: 2,
            container: 14,
            hamali: 6.20,
            tolai: 3.40,
            cgst: 2.5,
            sgst: 2.5,
            marketCess: 0,
            supervision: 0
          },
          nextBillNumbers: {
            awak: 1,
            patti: 1,
            invoice: 1
          },
          allowNegativeStock: false
        } as unknown as AppSettings);
      } else {
        setSettings(data);
      }
    };
    load();
  }, []);

  const handleChange = (section: string, field: string, value: any) => {
    if (!settings) return;
    if (section === 'root') {
      setSettings({ ...settings, [field]: value });
    } else {
      setSettings({
        ...settings,
        [section]: {
          ...(settings as any)[section],
          [field]: value
        }
      });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (settings) {
      await updateSettings(settings);
      alert('Settings saved successfully!');
    }
  };

  if (!settings) return <div>Loading...</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
        <button onClick={handleSave} className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded flex items-center gap-2">
          <Save size={18} /> Save Settings
        </button>
      </div>

      <form className="space-y-6" onSubmit={handleSave}>
        {/* Business Details */}
        <section className="bg-white p-6 rounded shadow">
          <h2 className="text-lg font-bold border-b pb-2 mb-4">Business Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm">Business Name</label><input type="text" value={settings.businessName} onChange={(e) => handleChange('root', 'businessName', e.target.value)} className="w-full border rounded p-2" /></div>
            <div><label className="block text-sm">Market Yard</label><input type="text" value={settings.marketYard} onChange={(e) => handleChange('root', 'marketYard', e.target.value)} className="w-full border rounded p-2" /></div>
            <div><label className="block text-sm">Address</label><input type="text" value={settings.address} onChange={(e) => handleChange('root', 'address', e.target.value)} className="w-full border rounded p-2" /></div>
            <div><label className="block text-sm">Plot No</label><input type="text" value={settings.plotNo} onChange={(e) => handleChange('root', 'plotNo', e.target.value)} className="w-full border rounded p-2" /></div>
            <div><label className="block text-sm">Phone</label><input type="text" value={settings.phone} onChange={(e) => handleChange('root', 'phone', e.target.value)} className="w-full border rounded p-2" /></div>
            <div><label className="block text-sm">GSTIN</label><input type="text" value={settings.gstin} onChange={(e) => handleChange('root', 'gstin', e.target.value)} className="w-full border rounded p-2" /></div>
            <div><label className="block text-sm">Proprietor</label><input type="text" value={settings.proprietor} onChange={(e) => handleChange('root', 'proprietor', e.target.value)} className="w-full border rounded p-2" /></div>
          </div>
        </section>

        {/* Calculation Rates */}
        <section className="bg-white p-6 rounded shadow">
          <h2 className="text-lg font-bold border-b pb-2 mb-4">Calculation Rates</h2>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="block text-sm">Adat %</label><input type="number" step="0.01" value={settings.defaultRates.adat} onChange={(e) => handleChange('defaultRates', 'adat', Number(e.target.value))} className="w-full border rounded p-2" /></div>
            <div><label className="block text-sm">Levy %</label><input type="number" step="0.01" value={settings.defaultRates.levy} onChange={(e) => handleChange('defaultRates', 'levy', Number(e.target.value))} className="w-full border rounded p-2" /></div>
            <div><label className="block text-sm">TDS %</label><input type="number" step="0.01" value={settings.defaultRates.tds} onChange={(e) => handleChange('defaultRates', 'tds', Number(e.target.value))} className="w-full border rounded p-2" /></div>
            <div><label className="block text-sm">Container (₹/bag)</label><input type="number" step="0.01" value={settings.defaultRates.container} onChange={(e) => handleChange('defaultRates', 'container', Number(e.target.value))} className="w-full border rounded p-2" /></div>
            <div><label className="block text-sm">Hamali (₹/bag)</label><input type="number" step="0.01" value={settings.defaultRates.hamali} onChange={(e) => handleChange('defaultRates', 'hamali', Number(e.target.value))} className="w-full border rounded p-2" /></div>
            <div><label className="block text-sm">Tolai (₹/quintal)</label><input type="number" step="0.01" value={settings.defaultRates.tolai} onChange={(e) => handleChange('defaultRates', 'tolai', Number(e.target.value))} className="w-full border rounded p-2" /></div>
            <div><label className="block text-sm">CGST %</label><input type="number" step="0.01" value={settings.defaultRates.cgst} onChange={(e) => handleChange('defaultRates', 'cgst', Number(e.target.value))} className="w-full border rounded p-2" /></div>
            <div><label className="block text-sm">SGST %</label><input type="number" step="0.01" value={settings.defaultRates.sgst} onChange={(e) => handleChange('defaultRates', 'sgst', Number(e.target.value))} className="w-full border rounded p-2" /></div>
          </div>
        </section>

        {/* Bill Numbering & System */}
        <div className="grid grid-cols-2 gap-6">
          <section className="bg-white p-6 rounded shadow">
            <h2 className="text-lg font-bold border-b pb-2 mb-4">Bill Numbering</h2>
            <div className="space-y-4">
              <div><label className="block text-sm">Next Awak Number</label><input type="number" value={settings.nextBillNumbers.awak} onChange={(e) => handleChange('nextBillNumbers', 'awak', Number(e.target.value))} className="w-full border rounded p-2" /></div>
              <div><label className="block text-sm">Next Patti Number</label><input type="number" value={settings.nextBillNumbers.patti} onChange={(e) => handleChange('nextBillNumbers', 'patti', Number(e.target.value))} className="w-full border rounded p-2" /></div>
              <div><label className="block text-sm">Next Invoice Number</label><input type="number" value={settings.nextBillNumbers.invoice} onChange={(e) => handleChange('nextBillNumbers', 'invoice', Number(e.target.value))} className="w-full border rounded p-2" /></div>
            </div>
          </section>
          
          <section className="bg-white p-6 rounded shadow">
            <h2 className="text-lg font-bold border-b pb-2 mb-4">System Settings</h2>
            <div className="space-y-4 mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={settings.allowNegativeStock} onChange={(e) => handleChange('root', 'allowNegativeStock', e.target.checked)} className="w-5 h-5 accent-yellow-600" />
                <span>Allow Negative Stock</span>
              </label>
              <div className="mt-4"><label className="block text-sm">Admin PIN</label><input type="password" value={settings.adminPin || ''} onChange={(e) => handleChange('root', 'adminPin', e.target.value)} className="w-full border rounded p-2" placeholder="Leave empty for none" /></div>
            </div>
          </section>
        </div>
      </form>
    </div>
  );
};
