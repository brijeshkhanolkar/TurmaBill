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
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="text-2xl font-bold text-amber-700 mb-2">🌾 TURMABILL</div>
          <div className="text-sm text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#fff',
            color: '#1a1a1a',
            border: '1px solid #e5e7eb',
            fontSize: '13px',
            padding: '8px 12px',
          },
          success: {
            iconTheme: { primary: '#2E7D32', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#dc2626', secondary: '#fff' },
          },
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
