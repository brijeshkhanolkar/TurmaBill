import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Activity, Users, ShoppingCart, Package, 
  FileText, Plus, Eye, Printer, TrendingUp, AlertCircle 
} from 'lucide-react';
import { getAllAwaks, getAllBuyerInvoices, getInventoryStock } from '../database/services';
import { Awak, BuyerInvoice, InventoryStock } from '../types';
import { formatCurrency, formatDate, formatWeight, getTodayString } from '../utils/formatters';
import { Button, Table, Thead, Tbody, Tr, Th, Td, Badge } from '../components/ui';

export default function Dashboard() {
  const navigate = useNavigate();
  const [recentAwaks, setRecentAwaks] = useState<Awak[]>([]);
  const [stats, setStats] = useState({
    todayTransactions: 0,
    todayPurchase: 0,
    todaySales: 0,
    currentStockBags: 0,
    pendingItems: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const today = getTodayString();
      
      const [awaks, invoices, stock] = await Promise.all([
        getAllAwaks(),
        getAllBuyerInvoices(),
        getInventoryStock()
      ]);

      // Calculate stats
      const todayAwaks = awaks.filter(a => a.date === today);
      const todayInvoices = invoices.filter(i => i.date === today);
      
      const todayPurchase = todayAwaks.reduce((sum, a) => sum + (a.totalAmount || 0), 0);
      const todaySales = todayInvoices.reduce((sum, i) => sum + (i.totalAmount || 0), 0);
      const stockBags = stock.reduce((sum, s) => sum + s.quantityBags, 0);
      const pendingAwaks = awaks.filter(a => a.status === 'PENDING').length;

      setStats({
        todayTransactions: todayAwaks.length + todayInvoices.length,
        todayPurchase,
        todaySales,
        currentStockBags: stockBags,
        pendingItems: pendingAwaks
      });

      // Recent 10 awaks
      setRecentAwaks(awaks.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10));
    } catch (error) {
      console.error('Error loading dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold text-gray-800">Dashboard</h1>
        <span className="text-sm text-gray-500">{formatDate(getTodayString())}</span>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white border border-gray-200 rounded p-4 border-l-4 border-l-blue-500 shadow-sm flex flex-col">
          <div className="flex items-center text-gray-500 mb-1">
            <Activity size={16} className="mr-2" />
            <span className="text-xs font-medium uppercase">Today's Trans</span>
          </div>
          <span className="text-xl font-bold text-gray-800">{stats.todayTransactions}</span>
        </div>
        
        <div className="bg-white border border-gray-200 rounded p-4 border-l-4 border-l-green-600 shadow-sm flex flex-col">
          <div className="flex items-center text-gray-500 mb-1">
            <TrendingUp size={16} className="mr-2" />
            <span className="text-xs font-medium uppercase">Today's Purchase</span>
          </div>
          <span className="text-xl font-bold text-gray-800">{formatCurrency(stats.todayPurchase)}</span>
        </div>

        <div className="bg-white border border-gray-200 rounded p-4 border-l-4 border-l-yellow-500 shadow-sm flex flex-col">
          <div className="flex items-center text-gray-500 mb-1">
            <ShoppingCart size={16} className="mr-2" />
            <span className="text-xs font-medium uppercase">Today's Sales</span>
          </div>
          <span className="text-xl font-bold text-gray-800">{formatCurrency(stats.todaySales)}</span>
        </div>

        <div className="bg-white border border-gray-200 rounded p-4 border-l-4 border-l-purple-500 shadow-sm flex flex-col">
          <div className="flex items-center text-gray-500 mb-1">
            <Package size={16} className="mr-2" />
            <span className="text-xs font-medium uppercase">Current Stock</span>
          </div>
          <span className="text-xl font-bold text-gray-800">{stats.currentStockBags} <span className="text-sm font-normal text-gray-500">bags</span></span>
        </div>

        <div className="bg-white border border-gray-200 rounded p-4 border-l-4 border-l-red-500 shadow-sm flex flex-col">
          <div className="flex items-center text-gray-500 mb-1">
            <AlertCircle size={16} className="mr-2" />
            <span className="text-xs font-medium uppercase">Pending Items</span>
          </div>
          <span className="text-xl font-bold text-gray-800">{stats.pendingItems}</span>
        </div>
      </div>

      {/* Quick Actions Row */}
      <div className="bg-white p-4 rounded border border-gray-200 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" icon={<Plus size={16} />} onClick={() => navigate('/transactions/new')}>
            New Transaction
          </Button>
          <Button variant="secondary" icon={<FileText size={16} />} onClick={() => navigate('/farmer-patti')}>
            Farmer Patti
          </Button>
          <Button variant="secondary" icon={<FileText size={16} />} onClick={() => navigate('/buyer-invoice')}>
            Buyer Invoice
          </Button>
          <Button variant="ghost" icon={<Users size={16} />} onClick={() => navigate('/farmers/new')} className="border border-gray-200">
            Add Farmer
          </Button>
          <Button variant="ghost" icon={<Users size={16} />} onClick={() => navigate('/buyers/new')} className="border border-gray-200">
            Add Buyer
          </Button>
          <Button variant="ghost" icon={<Package size={16} />} onClick={() => navigate('/products/new')} className="border border-gray-200">
            Add Product
          </Button>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-white rounded border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-sm font-semibold text-gray-700">Recent Awaks</h2>
          <Link to="/awak" className="text-sm text-blue-600 hover:underline">View All</Link>
        </div>
        <div className="overflow-x-auto">
          <Table className="table-compact">
            <Thead>
              <Tr>
                <Th>Awak No</Th>
                <Th>Date</Th>
                <Th>Farmer</Th>
                <Th>Product</Th>
                <Th className="text-right">Bags</Th>
                <Th className="text-right">Weight</Th>
                <Th className="text-right">Amount</Th>
                <Th className="text-center">Status</Th>
                <Th className="text-right">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {recentAwaks.length === 0 ? (
                <Tr>
                  <Td colSpan={9} className="text-center text-gray-500 py-4">
                    {loading ? 'Loading...' : 'No recent awaks found'}
                  </Td>
                </Tr>
              ) : (
                recentAwaks.map((awak) => (
                  <Tr key={awak.id}>
                    <Td className="font-medium">{awak.awakNo}</Td>
                    <Td>{formatDate(awak.date)}</Td>
                    <Td>{awak.farmerName}</Td>
                    <Td>{awak.productName}</Td>
                    <Td className="text-right">{awak.totalBags}</Td>
                    <Td className="text-right">{formatWeight(awak.totalWeight)}</Td>
                    <Td className="text-right">{formatCurrency(awak.totalAmount || 0)}</Td>
                    <Td className="text-center">
                      <Badge variant={awak.status === 'COMPLETED' ? 'success' : awak.status === 'PENDING' ? 'warning' : 'default'}>
                        {awak.status}
                      </Badge>
                    </Td>
                    <Td className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" icon={<Eye size={14} />} onClick={() => navigate(`/awak/${awak.id}/edit`)} />
                        <Button variant="ghost" size="sm" icon={<Printer size={14} />} onClick={() => window.print()} />
                      </div>
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </div>
      </div>
    </div>
  );
}
