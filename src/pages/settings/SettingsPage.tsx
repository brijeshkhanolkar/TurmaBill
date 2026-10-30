import React, { useState, useEffect } from 'react';
import { getSettings, updateSettings } from '../../database/services';
import { AppSettings } from '../../types';
import { Save, Building2, BarChart2, Hash, Shield, RefreshCw, Key, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppAuth } from '../../context/AuthContext';


const LabeledInput = ({
  label, type = 'text', value, onChange, placeholder, step, min
}: {
  label: string; type?: string;
  value: string | number;
  onChange: (val: string) => void;
  placeholder?: string; step?: string; min?: string;
}) => (
  <div className="form-group">
    <label className="form-label">{label}</label>
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      step={step}
      min={min}
      className="form-input"
    />
  </div>
);

const SectionCard = ({ icon: Icon, title, children, accentColor = 'var(--turmeric)' }: {
  icon: React.ElementType; title: string; children: React.ReactNode; accentColor?: string;
}) => (
  <div className="card" style={{ overflow: 'hidden' }}>
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '14px 20px', borderBottom: '1px solid var(--border)',
      background: '#FAFAFA'
    }}>
      <div style={{
        width: 30, height: 30, borderRadius: 8,
        background: accentColor + '18',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <Icon size={15} style={{ color: accentColor }} />
      </div>
      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{title}</div>
    </div>
    <div style={{ padding: '20px' }}>
      {children}
    </div>
  </div>
);

function ClerkSettingsSection() {
  const { isClerkEnabled, clerkKey, openAuthModal } = useAppAuth();

  return (
    <SectionCard icon={ShieldCheck} title="Authentication & Clerk Security" accentColor="#2563EB">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'between', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
              Authentication Status: {isClerkEnabled ? (
                <span style={{ color: '#16A34A', fontWeight: 700 }}>● Clerk Connected</span>
              ) : (
                <span style={{ color: '#C8920A', fontWeight: 700 }}>● Local Demo Mode</span>
              )}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              {isClerkEnabled ? (
                <span>Publishable Key: <code>{clerkKey?.slice(0, 16)}...</code></span>
              ) : (
                <span>No Clerk key connected. Running with offline-capable trader demo account.</span>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={openAuthModal}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Key size={14} className="text-[#C8920A]" />
            {isClerkEnabled ? 'Manage Clerk Key' : 'Connect Clerk Key'}
          </button>
        </div>
      </div>
    </SectionCard>
  );
}

const DEFAULT_SETTINGS: AppSettings = {

  businessName: '',
  address: '',
  plotNo: '',
  phone: '',
  gstin: '',
  proprietor: '',
  marketYard: '',
  banks: [],
  adatRate: 2.5,
  levyRate: 30,
  tdsRate: 2,
  containerRate: 14,
  hamaliRate: 6.20,
  tolaiRate: 3.40,
  cgstRate: 2.5,
  sgstRate: 2.5,
  defaultMarketCess: 0,
  defaultSupervisionFee: 0,
  nextAwakNo: 1,
  nextPattiNo: 1,
  nextInvoiceNo: 1,
  allowNegativeStock: false,
  adminPin: '',
  // Backwards compat fields for SettingsPage form
  defaultRates: {
    adat: 2.5, levy: 30, tds: 2, container: 14,
    hamali: 6.20, tolai: 3.40, cgst: 2.5, sgst: 2.5,
    marketCess: 0, supervision: 0,
  },
  nextBillNumbers: { awak: 1, patti: 1, invoice: 1 },
} as unknown as AppSettings;

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getSettings();
        setSettings(data || DEFAULT_SETTINGS);
      } catch {
        toast.error('Failed to load settings');
        setSettings(DEFAULT_SETTINGS);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const setRoot = (field: string, value: any) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  };

  const setRate = (field: string, value: string) => {
    if (!settings) return;
    const num = parseFloat(value) || 0;
    setSettings({
      ...settings,
      defaultRates: { ...(settings as any).defaultRates, [field]: num },
      [field + 'Rate']: num,
    } as any);
  };

  const setBillNo = (field: string, value: string) => {
    if (!settings) return;
    const num = parseInt(value) || 1;
    setSettings({
      ...settings,
      nextBillNumbers: { ...(settings as any).nextBillNumbers, [field]: num },
    } as any);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    try {
      setSaving(true);
      await updateSettings(settings);
      toast.success('Settings saved successfully!');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card" style={{ padding: 20 }}>
            <div className="skeleton" style={{ height: 18, width: '30%', marginBottom: 16 }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j}>
                  <div className="skeleton" style={{ height: 11, width: '40%', marginBottom: 6 }} />
                  <div className="skeleton" style={{ height: 36 }} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!settings) return null;

  const dr = (settings as any).defaultRates ?? {};
  const bn = (settings as any).nextBillNumbers ?? {};

  return (
    <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 19, fontWeight: 700, letterSpacing: '-0.4px' }}>Settings</h1>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Configure your business details and billing defaults</div>
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={saving}
          id="save-settings-btn"
        >
          {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>

      {/* Business Details */}
      <SectionCard icon={Building2} title="Business Details" accentColor="#2563EB">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          <LabeledInput label="Business Name" value={settings.businessName} onChange={v => setRoot('businessName', v)} placeholder="e.g. Khanolkar Agro Pvt Ltd" />
          <LabeledInput label="Market Yard" value={settings.marketYard} onChange={v => setRoot('marketYard', v)} placeholder="Nanded Market Yard" />
          <LabeledInput label="Address" value={settings.address} onChange={v => setRoot('address', v)} placeholder="Full address" />
          <LabeledInput label="Plot No" value={settings.plotNo} onChange={v => setRoot('plotNo', v)} placeholder="Plot / Gala No." />
          <LabeledInput label="Phone" value={settings.phone} onChange={v => setRoot('phone', v)} placeholder="10-digit mobile" />
          <LabeledInput label="GSTIN" value={settings.gstin} onChange={v => setRoot('gstin', v)} placeholder="27XXXXX0000X1ZX" />
          <LabeledInput label="Proprietor Name" value={settings.proprietor} onChange={v => setRoot('proprietor', v)} placeholder="Full name" />
        </div>
      </SectionCard>

      {/* Calculation Rates */}
      <SectionCard icon={BarChart2} title="Default Calculation Rates" accentColor="var(--turmeric)">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
          <LabeledInput label="Adat %" type="number" step="0.01" value={dr.adat ?? settings.adatRate ?? 2.5} onChange={v => setRate('adat', v)} />
          <LabeledInput label="Levy %" type="number" step="0.01" value={dr.levy ?? settings.levyRate ?? 30} onChange={v => setRate('levy', v)} />
          <LabeledInput label="TDS %" type="number" step="0.01" value={dr.tds ?? settings.tdsRate ?? 2} onChange={v => setRate('tds', v)} />
          <LabeledInput label="Container ₹/bag" type="number" step="0.01" value={dr.container ?? settings.containerRate ?? 14} onChange={v => setRate('container', v)} />
          <LabeledInput label="Hamali ₹/bag" type="number" step="0.01" value={dr.hamali ?? settings.hamaliRate ?? 6.20} onChange={v => setRate('hamali', v)} />
          <LabeledInput label="Tolai ₹/quintal" type="number" step="0.01" value={dr.tolai ?? settings.tolaiRate ?? 3.40} onChange={v => setRate('tolai', v)} />
          <LabeledInput label="CGST %" type="number" step="0.01" value={dr.cgst ?? settings.cgstRate ?? 2.5} onChange={v => setRate('cgst', v)} />
          <LabeledInput label="SGST %" type="number" step="0.01" value={dr.sgst ?? settings.sgstRate ?? 2.5} onChange={v => setRate('sgst', v)} />
          <LabeledInput label="Market Cess %" type="number" step="0.01" value={dr.marketCess ?? settings.defaultMarketCess ?? 0} onChange={v => setRate('marketCess', v)} />
          <LabeledInput label="Supervision ₹" type="number" step="0.01" value={dr.supervision ?? settings.defaultSupervisionFee ?? 0} onChange={v => setRate('supervision', v)} />
        </div>
      </SectionCard>

      {/* Bill Numbering & System */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <SectionCard icon={Hash} title="Bill Numbering" accentColor="#16A34A">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <LabeledInput label="Next Awak Number" type="number" min="1" value={bn.awak ?? settings.nextAwakNo ?? 1} onChange={v => setBillNo('awak', v)} />
            <LabeledInput label="Next Patti Number" type="number" min="1" value={bn.patti ?? settings.nextPattiNo ?? 1} onChange={v => setBillNo('patti', v)} />
            <LabeledInput label="Next Invoice Number" type="number" min="1" value={bn.invoice ?? settings.nextInvoiceNo ?? 1} onChange={v => setBillNo('invoice', v)} />
          </div>
        </SectionCard>

        <SectionCard icon={Shield} title="System Settings" accentColor="#7C3AED">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <div
                onClick={() => setRoot('allowNegativeStock', !settings.allowNegativeStock)}
                style={{
                  width: 42, height: 24, borderRadius: 12,
                  background: settings.allowNegativeStock ? 'var(--turmeric)' : '#D1D5DB',
                  position: 'relative', cursor: 'pointer',
                  transition: 'background 200ms',
                  flexShrink: 0,
                }}
              >
                <div style={{
                  width: 18, height: 18, background: 'white', borderRadius: '50%',
                  position: 'absolute', top: 3,
                  left: settings.allowNegativeStock ? 21 : 3,
                  transition: 'left 200ms',
                  boxShadow: '0 1px 3px rgba(0,0,0,.2)',
                }} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>Allow Negative Stock</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Allow sales to exceed available stock</div>
              </div>
            </label>

            <div className="divider" style={{ margin: '4px 0' }} />

            <div className="form-group">
              <label className="form-label">Admin PIN</label>
              <input
                type="password"
                value={settings.adminPin || ''}
                onChange={e => setRoot('adminPin', e.target.value)}
                placeholder="Leave empty to disable"
                className="form-input"
                maxLength={8}
              />
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                PIN for sensitive operations (max 8 digits)
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Clerk Auth Section */}
        <ClerkSettingsSection />
      </div>

      {/* Save button at bottom */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button type="submit" className="btn btn-primary" disabled={saving} id="save-settings-bottom-btn">
          {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>
    </form>
  );
};
