import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, ArrowLeft, Edit } from 'lucide-react';
import { getBuyerInvoiceById, getBuyerById, getActiveProducts, getSettings } from '../../database/services';
import { formatDateFull, formatCurrency, formatWeight } from '../../utils/formatters';
import { Button } from '../../components/ui/Button';

export default function BuyerInvoiceView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<any>(null);
  const [buyer, setBuyer] = useState<any>(null);
  const [products, setProducts] = useState<Record<string, string>>({});
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (id) loadData(id); }, [id]);

  const loadData = async (invId: string) => {
    try {
      const data = await getBuyerInvoiceById(invId);
      if (data) {
        setInvoice(data);
        const [b, pList, s] = await Promise.all([
          getBuyerById(data.buyerId), getActiveProducts(), getSettings()
        ]);
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

  if (loading) return <div className="p-6 text-center">Loading...</div>;
  if (!invoice) return <div className="p-6 text-center text-red-500">Invoice not found.</div>;

  return (
    <div className="bg-gray-100 min-h-screen pb-10">
      <div className="print:hidden bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <Button variant="ghost" onClick={() => navigate(-1)} icon={<ArrowLeft size={18} />}>Back</Button>
        <div className="space-x-3">
          <Button variant="outline" onClick={() => navigate(`/buyer-invoice/${invoice.id}/edit`)} icon={<Edit size={18} />}>Edit</Button>
          <Button onClick={() => window.print()} icon={<Printer size={18} />} className="bg-blue-600 hover:bg-blue-700 text-white">Print Invoice</Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto mt-8 bg-white p-10 shadow-md print:shadow-none print:mt-0 print:p-0">
        <div className="text-center mb-6 border-b-2 border-blue-900 pb-4">
          <h1 className="text-3xl font-bold text-blue-900 uppercase tracking-wider">{settings?.businessName || settings?.firmName || 'SHREE GANESH TRADING CO.'}</h1>
          <p className="text-gray-700 text-sm mt-1">{settings?.address || settings?.firmAddress || 'Market Yard, Sangli, Maharashtra - 416416'}</p>
          <div className="flex justify-center space-x-6 mt-2 text-sm font-semibold text-gray-800">
            {settings?.firmPhone && <p>Ph: {settings.firmPhone}</p>}
            {settings?.firmGstin && <p>GSTIN: {settings.firmGstin}</p>}
          </div>
          <h2 className="text-xl font-bold mt-4 bg-blue-50 py-1 border border-blue-900 inline-block px-8 rounded">TAX INVOICE</h2>
        </div>

        <div className="flex justify-between mb-6 text-sm">
          <div className="w-1/2 p-3 border border-gray-300 rounded">
            <h3 className="font-bold text-gray-700 mb-2 border-b pb-1">Billed To (Buyer)</h3>
            <div className="font-bold text-base">{buyer?.name}</div>
            <div>{buyer?.address}</div>
            <div>{buyer?.city}{buyer?.state ? `, ${buyer.state}` : ''}</div>
            {buyer?.gstin && <div className="mt-2 font-bold">GSTIN: {buyer.gstin}</div>}
          </div>
          <div className="w-5/12 space-y-2 text-right">
            <div className="flex justify-end"><span className="w-24 font-bold text-left">Invoice No:</span> <span className="font-bold text-blue-700 text-lg">{invoice.invoiceNo}</span></div>
            <div className="flex justify-end"><span className="w-24 font-bold text-left">Date:</span> <span>{formatDateFull(invoice.date)}</span></div>
            <div className="flex justify-end"><span className="w-24 font-bold text-left">Sauda Date:</span> <span>{formatDateFull(invoice.saudaDate)}</span></div>
            <div className="flex justify-end"><span className="w-24 font-bold text-left">HSN Code:</span> <span>{invoice.hsnCode || '0910'}</span></div>
          </div>
        </div>

        <table className="w-full mb-6 border-collapse border border-gray-800 text-sm">
          <thead className="bg-blue-50">
            <tr>
              <th className="border border-gray-800 p-2 text-center w-10">Sr</th>
              <th className="border border-gray-800 p-2 text-left">Item Description</th>
              <th className="border border-gray-800 p-2 text-right">Bags</th>
              <th className="border border-gray-800 p-2 text-right">Weight (Kg)</th>
              <th className="border border-gray-800 p-2 text-right">Rate/Qtl</th>
              <th className="border border-gray-800 p-2 text-right">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item: any, idx: number) => (
              <tr key={item.id}>
                <td className="border-x border-gray-800 p-2 text-center">{idx + 1}</td>
                <td className="border-x border-gray-800 p-2 font-medium">{products[item.productId] || 'Unknown'}</td>
                <td className="border-x border-gray-800 p-2 text-right">{item.bags}</td>
                <td className="border-x border-gray-800 p-2 text-right">{formatWeight(item.weightKg)}</td>
                <td className="border-x border-gray-800 p-2 text-right">{item.ratePerQuintal.toFixed(2)}</td>
                <td className="border-x border-gray-800 p-2 text-right">{formatCurrency(item.amount)}</td>
              </tr>
            ))}
            <tr className="border-y-2 border-gray-800 font-bold bg-gray-50">
              <td colSpan={2} className="border-x border-gray-800 p-2 text-right">TOTAL</td>
              <td className="border-x border-gray-800 p-2 text-right">{invoice.totalBags}</td>
              <td className="border-x border-gray-800 p-2 text-right">{formatWeight(invoice.totalWeight)}</td>
              <td className="border-x border-gray-800 p-2 text-right"></td>
              <td className="border-x border-gray-800 p-2 text-right">{formatCurrency(invoice.totalAmount)}</td>
            </tr>
          </tbody>
        </table>

        <div className="flex justify-end mb-8">
          <div className="w-1/2 border border-gray-800">
            <table className="w-full text-sm">
              <tbody>
                <tr>
                  <td className="p-2 border-b border-gray-300">Basic Amount</td>
                  <td className="p-2 border-b border-gray-300 text-right">{formatCurrency(invoice.totalAmount)}</td>
                </tr>
                <tr>
                  <td className="p-2 border-b border-gray-300">Add: Adat (@ {invoice.ratesSnapshot?.adatRate}%)</td>
                  <td className="p-2 border-b border-gray-300 text-right">{formatCurrency(invoice.adat)}</td>
                </tr>
                <tr>
                  <td className="p-2 border-b border-gray-300">Add: Container</td>
                  <td className="p-2 border-b border-gray-300 text-right">{formatCurrency(invoice.container)}</td>
                </tr>
                <tr>
                  <td className="p-2 border-b border-gray-300">Add: Market Cess / Levy</td>
                  <td className="p-2 border-b border-gray-300 text-right">{formatCurrency(invoice.levy)}</td>
                </tr>
                <tr className="bg-gray-100 font-bold">
                  <td className="p-2 border-y-2 border-gray-800">Composite Supply</td>
                  <td className="p-2 border-y-2 border-gray-800 text-right">{formatCurrency(invoice.compositeSupply)}</td>
                </tr>
                <tr>
                  <td className="p-2 border-b border-gray-300">Add: CGST (@ {invoice.ratesSnapshot?.cgstRate}%)</td>
                  <td className="p-2 border-b border-gray-300 text-right">{formatCurrency(invoice.cgst)}</td>
                </tr>
                <tr>
                  <td className="p-2 border-b border-gray-300">Add: SGST (@ {invoice.ratesSnapshot?.sgstRate}%)</td>
                  <td className="p-2 border-b border-gray-300 text-right">{formatCurrency(invoice.sgst)}</td>
                </tr>
                <tr className="font-bold border-y border-gray-800">
                  <td className="p-2">Total Value (After GST)</td>
                  <td className="p-2 text-right">{formatCurrency(invoice.netAmount)}</td>
                </tr>
                <tr>
                  <td className="p-2 border-b border-gray-300 text-red-600 font-medium">Less: TDS (@ {invoice.ratesSnapshot?.tdsRate}%)</td>
                  <td className="p-2 border-b border-gray-300 text-right text-red-600 font-medium">- {formatCurrency(invoice.tds)}</td>
                </tr>
                <tr className="bg-blue-50 font-bold text-lg">
                  <td className="p-3 border-t-2 border-gray-800">NET PAYABLE AMOUNT</td>
                  <td className="p-3 border-t-2 border-gray-800 text-right text-blue-900">{formatCurrency(invoice.payableAmount)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-between items-end mt-16 pt-8 border-t border-gray-300 text-sm font-semibold">
          <div className="text-center w-48">
            <p className="border-t border-gray-800 pt-2">Buyer's Signature</p>
          </div>
          <div className="text-center w-48">
            <p className="mb-8">For {settings?.businessName || settings?.firmName}</p>
            <p className="border-t border-gray-800 pt-2">Authorized Signatory</p>
          </div>
        </div>
      </div>
    </div>
  );
}
