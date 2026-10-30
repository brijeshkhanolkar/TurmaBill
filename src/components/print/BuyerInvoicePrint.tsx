import React from 'react';
import { BuyerInvoice, AppSettings } from '../../types';
import { formatCurrency, formatDateFull, formatWeight } from '../../utils/formatters';

interface Props {
  invoice: BuyerInvoice;
  settings: AppSettings;
}

export const BuyerInvoicePrint: React.FC<Props> = ({ invoice, settings }) => {
  return (
    <div className="print-container bg-white text-black p-4" style={{ fontFamily: 'monospace', maxWidth: '800px', margin: '0 auto', fontSize: '14px' }}>
      <div className="flex justify-between mb-4">
        <span>Subject to Sangli Jurisdiction only</span>
        <span>(Availing Composite Supply...)</span>
      </div>

      <div className="text-center mb-4">
        <h2 className="font-bold text-lg">{settings.marketYard || 'Sangli Krushi Utappan Bazar Samiti Sangli'}</h2>
        <p>By laws No. 18 & 52, Of Schedule 18 Bill</p>
      </div>

      <div className="mb-4">
        <h3 className="font-bold text-lg">Adtya : {settings.businessName}</h3>
        <p>Plot No.{settings.plotNo}, {settings.marketYard} {settings.address} Phone :{settings.phone}</p>
        <p>GST No. {settings.gstin}     Prop {settings.proprietor}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 border-t border-b border-black py-2">
        <div>
          <p>Buyer: {invoice.buyerName}</p>
          <p>Address: {invoice.buyerAddress}</p>
          <br/>
          <p>GSTIN  {invoice.buyerGstin}</p>
          <p>State: {invoice.buyerState}</p>
        </div>
        <div className="border-l border-black pl-4">
          <p>INVOICE No. : {invoice.invoiceNo}</p>
          <p>Date : {formatDateFull(invoice.date)}</p>
          <p>Sauda Date : {formatDateFull(invoice.saudaDate)}</p>
          <p>HSN Code    {invoice.hsnCode}</p>
        </div>
      </div>

      <h3 className="text-center font-bold mb-2">TAX INVOICE</h3>

      <table className="w-full border-collapse mb-4 border border-black">
        <thead>
          <tr className="border-b border-black">
            <th className="border-r border-black p-1 text-left">Sr</th>
            <th className="border-r border-black p-1 text-left">FARMER</th>
            <th className="border-r border-black p-1 text-left">ITEM</th>
            <th className="border-r border-black p-1 text-right">QTY</th>
            <th className="border-r border-black p-1 text-right">WEIGHT</th>
            <th className="border-r border-black p-1 text-right">RATE</th>
            <th className="p-1 text-right">AMOUNT</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item, index) => (
            <tr key={index} className="border-b border-black">
              <td className="border-r border-black p-1">{item.srNo}</td>
              <td className="border-r border-black p-1">{item.farmerName}</td>
              <td className="border-r border-black p-1">{item.productName}</td>
              <td className="border-r border-black p-1 text-right">{item.bags}</td>
              <td className="border-r border-black p-1 text-right">{formatWeight(item.weightKg)}</td>
              <td className="border-r border-black p-1 text-right">{item.ratePerQuintal.toFixed(2)}</td>
              <td className="p-1 text-right">{item.amount.toFixed(2)}</td>
            </tr>
          ))}
          <tr className="border-b border-black font-bold">
            <td className="border-r border-black p-1"></td>
            <td className="border-r border-black p-1 text-center" colSpan={2}>TOTAL</td>
            <td className="border-r border-black p-1 text-right">{invoice.totalBags}</td>
            <td className="border-r border-black p-1 text-right">{formatWeight(invoice.totalWeight)}</td>
            <td className="border-r border-black p-1 text-right"></td>
            <td className="p-1 text-right">{invoice.totalAmount.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="flex justify-between"><span>Market Cess</span> <span>{invoice.marketCess.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Supervision Fee</span> <span>{invoice.supervisionFee.toFixed(2)}</span></div>
          <br/>
          <div className="flex justify-between font-bold"><span>TDS :</span> <span>{invoice.tds.toFixed(2)}</span></div>
          <div className="flex justify-between font-bold"><span>Payable</span> <span>{invoice.payable.toFixed(2)}</span></div>
        </div>
        <div className="border-l border-black pl-4">
          <div className="flex justify-between"><span>Container</span> <span>{invoice.container.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Adat</span> <span>{invoice.adat.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Levy</span> <span>{invoice.levy.toFixed(2)}</span></div>
          <br/>
          <div className="flex justify-between"><span>Composite Supply</span> <span>{invoice.compositeSupply.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>CGST @ {invoice.ratesSnapshot?.cgstRate?.toFixed(2) || '2.50'}%</span> <span>{invoice.cgst.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>SGST @ {invoice.ratesSnapshot?.sgstRate?.toFixed(2) || '2.50'}%</span> <span>{invoice.sgst.toFixed(2)}</span></div>
          <div className="flex justify-between font-bold mt-1"><span>NET AMOUNT</span> <span>{invoice.netAmount.toFixed(2)}</span></div>
        </div>
      </div>

      <div className="mb-4">
        {settings.banks?.map((bank, idx) => (
          <div key={idx} className="mb-2">
            <p>Bank Details {bank.bankName}</p>
            <p>A/c No. {bank.accountNumber}</p>
            <p>IFSC Code {bank.ifsc}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-between mt-8">
        <div>Goods Delivered at our Shop</div>
        <div className="text-center">
          <p>For {settings.businessName}</p>
          <p className="mt-8"></p>
        </div>
      </div>
    </div>
  );
};
