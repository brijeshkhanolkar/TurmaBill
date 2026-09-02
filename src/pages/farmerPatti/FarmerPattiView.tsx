import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, ArrowLeft, Download, Edit } from 'lucide-react';
import { getFarmerPattiById, getFarmerById, getBuyerById, getActiveProducts, getSettings } from '../../database/services';
import { formatDateFull, formatCurrency, formatWeight } from '../../utils/formatters';
import { Button } from '../../components/ui/Button';

export default function FarmerPattiView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patti, setPatti] = useState<any>(null);
  const [farmer, setFarmer] = useState<any>(null);
  const [buyer, setBuyer] = useState<any>(null);
  const [products, setProducts] = useState<Record<string, string>>({});
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadData(id);
  }, [id]);

  const loadData = async (pattiId: string) => {
    try {
      const data = await getFarmerPattiById(pattiId);
      if (data) {
        setPatti(data);
        const [f, b, pList, s] = await Promise.all([
          getFarmerById(data.farmerId),
          data.buyerId ? getBuyerById(data.buyerId) : Promise.resolve(null),
          getActiveProducts(),
          getSettings()
        ]);
        setFarmer(f);
        setBuyer(b);
        setProducts(pList.reduce((acc: any, p: any) => ({ ...acc, [p.id]: p.name }), {}));
        setSettings(s);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="p-6 text-center">Loading...</div>;
  if (!patti) return <div className="p-6 text-center text-red-500">Patti not found.</div>;

  return (
    <div className="bg-gray-100 min-h-screen pb-10">
      {/* Non-printable controls */}
      <div className="print:hidden bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <Button variant="ghost" onClick={() => navigate(-1)} icon={<ArrowLeft size={18} />}>Back</Button>
        <div className="space-x-3">
          <Button variant="outline" onClick={() => navigate(`/farmer-patti/${patti.id}/edit`)} icon={<Edit size={18} />}>Edit</Button>
          <Button onClick={handlePrint} icon={<Printer size={18} />} className="bg-amber-600 hover:bg-amber-700 text-white">Print Patti</Button>
        </div>
      </div>

      {/* Printable Area - matches typical physical bill style */}
      <div className="max-w-4xl mx-auto mt-8 bg-white p-8 shadow-md print:shadow-none print:mt-0 print:p-0">
        
        <div className="text-center mb-6 border-b-2 border-amber-800 pb-4">
          <h1 className="text-3xl font-bold text-amber-900 uppercase tracking-wider">{settings?.businessName || settings?.firmName || 'SHREE GANESH TRADING CO.'}</h1>
          <p className="text-gray-700 text-sm mt-1">{settings?.address || settings?.firmAddress || 'Market Yard, Sangli, Maharashtra - 416416'}</p>
          <div className="flex justify-center space-x-6 mt-2 text-sm font-semibold text-gray-800">
            {settings?.firmPhone && <p>Ph: {settings.firmPhone}</p>}
            {settings?.firmGstin && <p>GSTIN: {settings.firmGstin}</p>}
          </div>
          <h2 className="text-xl font-bold mt-4 bg-amber-100 py-1 border border-amber-800 inline-block px-8 rounded">FARMER PATTI (VIKRI BILL)</h2>
        </div>

        <div className="flex justify-between mb-6 text-sm">
          <div className="w-1/2 space-y-2">
            <div className="flex"><span className="w-24 font-bold">Farmer:</span> <span className="font-semibold text-base">{farmer?.name}</span></div>
            <div className="flex"><span className="w-24 font-bold">Village:</span> <span>{farmer?.village}</span></div>
            <div className="flex"><span className="w-24 font-bold">Phone:</span> <span>{farmer?.phone || '-'}</span></div>
          </div>
          <div className="w-1/2 space-y-2 text-right">
            <div className="flex justify-end"><span className="w-24 font-bold text-left">Patti No:</span> <span className="font-bold text-red-600 text-lg">{patti.pattiNo}</span></div>
            <div className="flex justify-end"><span className="w-24 font-bold text-left">Date:</span> <span>{formatDateFull(patti.date)}</span></div>
            <div className="flex justify-end"><span className="w-24 font-bold text-left">Buyer:</span> <span>{buyer?.name || '-'}</span></div>
          </div>
        </div>

        <table className="w-full mb-6 border-collapse border border-gray-800 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-gray-800 p-2 text-center w-12">Sr</th>
              <th className="border border-gray-800 p-2 text-left">Particulars / Commodity</th>
              <th className="border border-gray-800 p-2 text-right">Bags</th>
              <th className="border border-gray-800 p-2 text-right">Weight (Kg)</th>
              <th className="border border-gray-800 p-2 text-right">Rate / Qtl</th>
              <th className="border border-gray-800 p-2 text-right">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {patti.items.map((item: any, idx: number) => (
              <tr key={item.id}>
                <td className="border-x border-gray-800 p-2 text-center">{idx + 1}</td>
                <td className="border-x border-gray-800 p-2 font-medium">{products[item.productId] || 'Unknown Item'}</td>
                <td className="border-x border-gray-800 p-2 text-right">{item.bags}</td>
                <td className="border-x border-gray-800 p-2 text-right">{formatWeight(item.weightKg)}</td>
                <td className="border-x border-gray-800 p-2 text-right">{item.ratePerQuintal.toFixed(2)}</td>
                <td className="border-x border-gray-800 p-2 text-right">{formatCurrency(item.amount)}</td>
              </tr>
            ))}
            {/* Empty rows for layout */}
            {Array.from({ length: Math.max(0, 5 - patti.items.length) }).map((_, i) => (
              <tr key={`empty-${i}`}>
                <td className="border-x border-gray-800 p-2 text-transparent">-</td>
                <td className="border-x border-gray-800 p-2"></td>
                <td className="border-x border-gray-800 p-2"></td>
                <td className="border-x border-gray-800 p-2"></td>
                <td className="border-x border-gray-800 p-2"></td>
                <td className="border-x border-gray-800 p-2"></td>
              </tr>
            ))}
            <tr className="border-y-2 border-gray-800 font-bold bg-gray-50">
              <td colSpan={2} className="border-x border-gray-800 p-2 text-right">TOTAL</td>
              <td className="border-x border-gray-800 p-2 text-right">{patti.totalBags}</td>
              <td className="border-x border-gray-800 p-2 text-right">{formatWeight(patti.totalWeight)}</td>
              <td className="border-x border-gray-800 p-2 text-right"></td>
              <td className="border-x border-gray-800 p-2 text-right">{formatCurrency(patti.totalAmount)}</td>
            </tr>
          </tbody>
        </table>

        <div className="flex justify-end mb-8">
          <div className="w-1/2 border border-gray-800">
            <table className="w-full text-sm">
              <tbody>
                <tr>
                  <td className="p-2 border-b border-gray-300">Total Amount</td>
                  <td className="p-2 border-b border-gray-300 text-right">{formatCurrency(patti.totalAmount)}</td>
                </tr>
                <tr>
                  <td className="p-2 border-b border-gray-300">Less: Container</td>
                  <td className="p-2 border-b border-gray-300 text-right">- {formatCurrency(patti.container)}</td>
                </tr>
                <tr className="bg-gray-100 font-semibold">
                  <td className="p-2 border-y-2 border-gray-800">Gross Amount</td>
                  <td className="p-2 border-y-2 border-gray-800 text-right">{formatCurrency(patti.gross)}</td>
                </tr>
                <tr>
                  <td className="p-2 border-b border-gray-300">Less: Hamali (@ ₹{patti.ratesSnapshot?.hamali}/bag)</td>
                  <td className="p-2 border-b border-gray-300 text-right">- {formatCurrency(patti.hamali)}</td>
                </tr>
                <tr>
                  <td className="p-2 border-b border-gray-300">Less: Tolai (@ ₹{patti.ratesSnapshot?.tolai}/qtl)</td>
                  <td className="p-2 border-b border-gray-300 text-right">- {formatCurrency(patti.tolai)}</td>
                </tr>
                {patti.advance > 0 && (
                  <tr>
                    <td className="p-2 border-b border-gray-300 text-red-600 font-medium">Less: Advance</td>
                    <td className="p-2 border-b border-gray-300 text-right text-red-600 font-medium">- {formatCurrency(patti.advance)}</td>
                  </tr>
                )}
                <tr className="bg-green-50 font-bold text-lg">
                  <td className="p-3 border-t-2 border-gray-800">NET PAYABLE AMOUNT</td>
                  <td className="p-3 border-t-2 border-gray-800 text-right text-green-800">{formatCurrency(patti.pattiAmount)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-between items-end mt-16 pt-8 border-t border-gray-300 text-sm font-semibold">
          <div className="text-center w-48">
            <p className="border-t border-gray-800 pt-2">Farmer's Signature</p>
          </div>
          <div className="text-center w-48">
            <p className="mb-8">For {settings?.businessName || settings?.firmName || 'Firm Name'}</p>
            <p className="border-t border-gray-800 pt-2">Authorized Signatory</p>
          </div>
        </div>

      </div>
    </div>
  );
}
