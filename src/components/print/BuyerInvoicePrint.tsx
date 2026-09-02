import React from 'react';
import { BuyerInvoice, AppSettings } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface Props {
  invoice: BuyerInvoice;
  settings: AppSettings;
}

export const BuyerInvoicePrint: React.FC<Props> = ({ invoice, settings }) => {
  return (
    <div className="bill-print print-area bg-white text-black font-serif text-sm p-4 w-[210mm] min-h-[297mm] mx-auto border border-gray-300">
      <div className="border-2 border-black p-2">
        {/* Header */}
        <div className="text-center border-b-2 border-black pb-2 mb-2">
          <p className="text-xs">Subject to Sangli Jurisdiction only</p>
          <p className="text-xs">(Availing Composite Supply Covered u/s 2(30) of GST Act,2017)</p>
          <h1 className="text-lg font-bold uppercase mt-1">{settings.marketYard || 'Sangli Krushi Utappan Bazar Samiti Sangli'}</h1>
          <p className="text-sm">By laws No. 18 & 52, Of Schedule 18 Bill</p>
        </div>

        {/* Adtya Info */}
        <div className="border-b-2 border-black pb-2 mb-2 text-center leading-tight">
          <p className="font-bold text-lg">Adtya : {settings.businessName}</p>
          <p>{settings.address}, Plot No.{settings.plotNo} Phone : {settings.phone}</p>
          <p>GST No. {settings.gstin}     Prop {settings.proprietor}</p>
        </div>

        {/* Buyer Info */}
        <div className="flex border-b-2 border-black">
          <div className="w-1/2 border-r-2 border-black p-2">
            <p><strong>Buyer:</strong> {invoice.buyerName}</p>
            <p><strong>Address:</strong> {invoice.buyerCity}</p>
            <p className="mt-4"><strong>GSTIN:</strong> {invoice.buyerGstin || ''}</p>
            <p><strong>State:</strong> {invoice.buyerState || 'Maharashtra'}</p>
          </div>
          <div className="w-1/2 p-2">
            <p><strong>INVOICE No. :</strong> {invoice.invoiceNumber}</p>
            <p><strong>Date :</strong> {formatDate(invoice.date)}</p>
            <p><strong>Sauda Date :</strong> {formatDate(invoice.date)}</p>
            <p className="mt-4"><strong>HSN Code:</strong> 0910</p>
          </div>
        </div>

        {/* Title */}
        <div className="text-center border-b-2 border-black py-1 font-bold">
          TAX INVOICE
        </div>

        {/* Items Table */}
        <table className="w-full text-left border-collapse border-b-2 border-black">
          <thead>
            <tr className="border-b-2 border-black text-xs">
              <th className="border-r border-black p-1 text-center">Sr</th>
              <th className="border-r border-black p-1">FARMER</th>
              <th className="border-r border-black p-1">ITEM</th>
              <th className="border-r border-black p-1 text-right">QTY</th>
              <th className="border-r border-black p-1 text-right">WEIGHT</th>
              <th className="border-r border-black p-1 text-right">RATE</th>
              <th className="p-1 text-right">AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, index) => (
              <tr key={index} className="border-b border-black text-xs">
                <td className="border-r border-black p-1 text-center">{index + 1}</td>
                <td className="border-r border-black p-1">{item.farmerName}</td>
                <td className="border-r border-black p-1">{item.productName}</td>
                <td className="border-r border-black p-1 text-right">{item.bags}</td>
                <td className="border-r border-black p-1 text-right">{item.weight.toFixed(3)}</td>
                <td className="border-r border-black p-1 text-right">{item.rate.toFixed(2)}</td>
                <td className="p-1 text-right">{item.amount.toFixed(2)}</td>
              </tr>
            ))}
            {/* Totals */}
            <tr className="border-t-2 border-black font-bold">
              <td className="border-r border-black p-1"></td>
              <td className="border-r border-black p-1 text-center">TOTAL</td>
              <td className="border-r border-black p-1"></td>
              <td className="border-r border-black p-1 text-right">{invoice.totalBags}</td>
              <td className="border-r border-black p-1 text-right">{invoice.totalWeight.toFixed(3)}</td>
              <td className="border-r border-black p-1"></td>
              <td className="p-1 text-right">{invoice.amount.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        {/* Additional Charges & GST */}
        <div className="flex border-b-2 border-black">
          <div className="w-1/2 border-r-2 border-black p-2">
            <div className="flex justify-between"><span>Market Cess</span> <span>{invoice.charges?.marketCess?.toFixed(2) || '0.00'}</span></div>
            <div className="flex justify-between"><span>Supervision Fee</span> <span>{invoice.charges?.supervision?.toFixed(2) || '0.00'}</span></div>
            <div className="flex justify-between mt-4"><span>TDS :</span> <span>{invoice.charges?.tds?.toFixed(2) || '0.00'}</span></div>
            <div className="flex justify-between font-bold mt-2"><span>Payable</span> <span>{invoice.payableAmount?.toFixed(2) || '0.00'}</span></div>
          </div>
          <div className="w-1/2 p-2">
            <div className="flex justify-between"><span>Container</span> <span>{invoice.charges?.container?.toFixed(2) || '0.00'}</span></div>
            <div className="flex justify-between"><span>Adat</span> <span>{invoice.charges?.adat?.toFixed(2) || '0.00'}</span></div>
            <div className="flex justify-between"><span>Levy</span> <span>{invoice.charges?.levy?.toFixed(2) || '0.00'}</span></div>
            
            <div className="flex justify-between font-bold mt-2"><span>Composite Supply</span> <span>{invoice.subTotal?.toFixed(2) || invoice.netAmount.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>CGST @ {invoice.charges?.cgstRate || 2.50}%</span> <span>{invoice.charges?.cgst?.toFixed(2) || '0.00'}</span></div>
            <div className="flex justify-between"><span>SGST @ {invoice.charges?.sgstRate || 2.50}%</span> <span>{invoice.charges?.sgst?.toFixed(2) || '0.00'}</span></div>
            <div className="flex justify-between font-bold mt-2 border-t border-black pt-1"><span>NET AMOUNT</span> <span>{invoice.netAmount.toFixed(2)}</span></div>
          </div>
        </div>

        {/* Bank Details */}
        <div className="border-b-2 border-black p-2 text-xs">
          {settings.banks?.map((bank, idx) => (
            <div key={idx} className="mb-2">
              <p>Bank Details {bank.name}</p>
              <p>A/c No. {bank.accountNumber}</p>
              <p>IFSC Code {bank.ifsc}</p>
            </div>
          ))}
          {(!settings.banks || settings.banks.length === 0) && (
            <>
              <div className="mb-2">
                <p>Bank Details RAJARAMBAPU SAHAKARI BANK</p>
                <p>A/c No. 023411500013896</p>
                <p>IFSC Code RRBP0000023</p>
              </div>
              <div>
                <p>Bank Details ICICI BANK BR-M. YARD SANGLI</p>
                <p>A/c No. 653505054607</p>
                <p>IFSC Code ICIC0006535</p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-2 mt-2">
          <p>Goods Delivered at our Shop</p>
          <div className="text-right mt-8">
            <p>For {settings.businessName}</p>
          </div>
        </div>
      </div>

      {/* Inline styles for precise print control */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};
