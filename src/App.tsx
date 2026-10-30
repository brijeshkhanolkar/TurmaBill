import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect, useState } from 'react';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import FarmerList from './pages/farmers/FarmerList';
import FarmerForm from './pages/farmers/FarmerForm';
import FarmerDetail from './pages/farmers/FarmerDetail';
import BuyerList from './pages/buyers/BuyerList';
import BuyerForm from './pages/buyers/BuyerForm';
import BuyerDetail from './pages/buyers/BuyerDetail';
import ProductList from './pages/products/ProductList';
import ProductForm from './pages/products/ProductForm';
import AwakList from './pages/awak/AwakList';
import AwakForm from './pages/awak/AwakForm';
import NewTransaction from './pages/transactions/NewTransaction';
import FarmerPattiList from './pages/farmerPatti/FarmerPattiList';
import FarmerPattiView from './pages/farmerPatti/FarmerPattiView';
import FarmerPattiForm from './pages/farmerPatti/FarmerPattiForm';
import BuyerInvoiceList from './pages/buyerInvoice/BuyerInvoiceList';
import BuyerInvoiceView from './pages/buyerInvoice/BuyerInvoiceView';
import BuyerInvoiceForm from './pages/buyerInvoice/BuyerInvoiceForm';
import { InventoryPage } from './pages/inventory/InventoryPage';
import { BillsPage } from './pages/bills/BillsPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { seedDatabase } from './database/seeds';

function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    seedDatabase().then(() => setReady(true)).catch((err) => {
      console.error('Failed to seed database:', err);
      setReady(true);
    });
  }, []);

  if (!ready) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)', gap: 16 }}>
        <div style={{
          width: 60, height: 60, background: 'linear-gradient(135deg, #C8920A, #F0C44B)',
          borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, boxShadow: '0 4px 12px rgba(200,146,10,.3)',
          animation: 'pulse 1.5s ease-in-out infinite',
        }}>
          🌾
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.4px', color: '#111827' }}>TurmaBill</div>
          <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>Loading your data…</div>
        </div>
        <style>{`@keyframes pulse { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.06); opacity: .85; } }`}</style>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: '#ffffff',
            color: '#111827',
            border: '1px solid #E5E7EB',
            borderRadius: '10px',
            fontSize: '13px',
            padding: '10px 14px',
            boxShadow: '0 4px 12px rgba(0,0,0,.10)',
            fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
          },
          success: { iconTheme: { primary: '#16A34A', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#DC2626', secondary: '#fff' } },
        }}
      />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          
          {/* Farmers */}
          <Route path="farmers" element={<FarmerList />} />
          <Route path="farmers/new" element={<FarmerForm />} />
          <Route path="farmers/:id/edit" element={<FarmerForm />} />
          <Route path="farmers/:id" element={<FarmerDetail />} />
          
          {/* Buyers */}
          <Route path="buyers" element={<BuyerList />} />
          <Route path="buyers/new" element={<BuyerForm />} />
          <Route path="buyers/:id/edit" element={<BuyerForm />} />
          <Route path="buyers/:id" element={<BuyerDetail />} />
          
          {/* Products */}
          <Route path="products" element={<ProductList />} />
          <Route path="products/new" element={<ProductForm />} />
          <Route path="products/:id/edit" element={<ProductForm />} />
          
          {/* Awak / Inward */}
          <Route path="awak" element={<AwakList />} />
          <Route path="awak/new" element={<AwakForm />} />
          <Route path="awak/:id/edit" element={<AwakForm />} />
          <Route path="inward" element={<Navigate to="/awak" replace />} />
          <Route path="awaks" element={<Navigate to="/awak" replace />} />
          
          {/* New Transaction (quick entry) */}
          <Route path="transactions/new" element={<NewTransaction />} />
          <Route path="transaction/new" element={<NewTransaction />} />
          
          {/* Farmer Patti */}
          <Route path="farmer-patti" element={<FarmerPattiList />} />
          <Route path="farmer-patti/new" element={<FarmerPattiForm />} />
          <Route path="farmer-patti/new/:awakId" element={<FarmerPattiForm />} />
          <Route path="farmer-patti/:id" element={<FarmerPattiView />} />
          <Route path="farmer-patti/:id/edit" element={<FarmerPattiForm />} />
          <Route path="patti" element={<Navigate to="/farmer-patti" replace />} />
          <Route path="patti/view/:id" element={<FarmerPattiView />} />
          
          {/* Buyer Invoice */}
          <Route path="buyer-invoice" element={<BuyerInvoiceList />} />
          <Route path="buyer-invoice/new" element={<BuyerInvoiceForm />} />
          <Route path="buyer-invoice/:id" element={<BuyerInvoiceView />} />
          <Route path="buyer-invoice/:id/edit" element={<BuyerInvoiceForm />} />
          <Route path="invoice" element={<Navigate to="/buyer-invoice" replace />} />
          <Route path="invoice/view/:id" element={<BuyerInvoiceView />} />
          
          {/* Inventory */}
          <Route path="inventory" element={<InventoryPage />} />
          
          {/* Bills */}
          <Route path="bills" element={<BillsPage />} />
          
          {/* Reports */}
          <Route path="reports" element={<ReportsPage />} />
          
          {/* Settings */}
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
