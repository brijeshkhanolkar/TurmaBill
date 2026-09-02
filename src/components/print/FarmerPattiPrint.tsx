import React from 'react';
import { FarmerPatti, AppSettings } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface Props {
  patti: FarmerPatti;
  settings: AppSettings;
}

export const FarmerPattiPrint: React.FC<Props> = ({ patti, settings }) => {
  return (
    <div className="bill-print print-area bg-white text-black font-serif text-sm p-4 w-[210mm] min-h-[297mm] mx-auto border border-gray-300">
      <div className="border-2 border-black p-2">
        {/* Header */}
        <div className="text-center border-b-2 border-black pb-2 mb-2">
          <h1 className="text-xl font-bold uppercase">{settings.marketYard || 'Sangli Krushi Utpana Bazar Samiti, Sangli'}</h1>
          <p className="text-sm">By Laws No. 19 & 52 of Schedule 19 Patti</p>
        </div>

        {/* Patti Info */}
        <div className="flex justify-between border-b-2 border-black pb-2 mb-2 font-bold">
          <span>Patti No. : {patti.pattiNumber}</span>
          <span>DATE : {formatDate(patti.date)}</span>
        </div>

        {/* Adatya Info */}
        <div className="border-b-2 border-black pb-2 mb-2 text-center leading-tight">
          <p className="font-bold text-lg">Adatya : {settings.businessName}</p>
          <p>{settings.address}, Plot No. {settings.plotNo}</p>
          <p>Phone: {settings.phone}</p>
          <p>GST No. {settings.gstin}</p>
        </div>

        {/* Transaction Details */}
        <div className="flex justify-between border-b-2 border-black pb-2 mb-2">
          <div>
            <p><strong>Awak No. :</strong> {patti.awakNumber}</p>
            <p><strong>Farmer :</strong> {patti.farmerName}</p>
            <p className="pl-16">{patti.village}</p>
            <p><strong>Buyer :</strong> {patti.buyerName || '-'}</p>
          </div>
          <div className="text-right">
            <p><strong>Awak Date:</strong> {formatDate(patti.date)}</p>
            <p><strong>Sauda Date:</strong> {formatDate(patti.date)}</p>
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full text-left border-collapse border border-black mb-4">
          <thead>
            <tr className="border-b-2 border-black">
              <th className="border-r border-black p-1">ITEM</th>
              <th className="border-r border-black p-1 text-right">QTY<br/>BAGS</th>
              <th className="border-r border-black p-1 text-right">WEIGHT<br/>Kg.</th>
              <th className="border-r border-black p-1 text-right">RATE<br/>Per Qnt.</th>
              <th className="p-1 text-right">AMOUNT<br/>(Rs.)</th>
            </tr>
          </thead>
          <tbody>
            {patti.items.map((item, index) => (
              <tr key={index} className="border-b border-black">
                <td className="border-r border-black p-1">{item.productName}</td>
                <td className="border-r border-black p-1 text-right">{item.bags}</td>
                <td className="border-r border-black p-1 text-right">{item.weight.toFixed(3)}</td>
                <td className="border-r border-black p-1 text-right">{item.rate.toFixed(2)}</td>
                <td className="p-1 text-right">{item.amount.toFixed(2)}</td>
              </tr>
            ))}
            {/* Totals & Deductions */}
            <tr className="border-t-2 border-black">
              <td className="border-r border-black p-1"></td>
              <td className="border-r border-black p-1 text-right font-bold">{patti.totalBags}</td>
              <td className="border-r border-black p-1 text-right font-bold">{patti.totalWeight.toFixed(3)}</td>
              <td className="border-r border-black p-1 text-right">Container</td>
              <td className="p-1 text-right">{patti.deductions?.container?.toFixed(2) || '0.00'}</td>
            </tr>
            <tr>
              <td className="border-r border-black p-1"></td>
              <td className="border-r border-black p-1"></td>
              <td className="border-r border-black p-1"></td>
              <td className="border-r border-black p-1 text-right">Gross</td>
              <td className="p-1 text-right font-bold">{patti.amount.toFixed(2)}</td>
            </tr>
            <tr>
              <td className="border-r border-black p-1"></td>
              <td className="border-r border-black p-1"></td>
              <td className="border-r border-black p-1"></td>
              <td className="border-r border-black p-1 text-right">Hamali</td>
              <td className="p-1 text-right">{patti.deductions?.hamali?.toFixed(2) || '0.00'}</td>
            </tr>
            <tr>
              <td className="border-r border-black p-1"></td>
              <td className="border-r border-black p-1"></td>
              <td className="border-r border-black p-1"></td>
              <td className="border-r border-black p-1 text-right">Tolai</td>
              <td className="p-1 text-right">{patti.deductions?.tolai?.toFixed(2) || '0.00'}</td>
            </tr>
            <tr>
              <td className="border-r border-black p-1"></td>
              <td className="border-r border-black p-1"></td>
              <td className="border-r border-black p-1"></td>
              <td className="border-r border-black p-1 text-right">Advance</td>
              <td className="p-1 text-right">{patti.deductions?.advance?.toFixed(2) || '0.00'}</td>
            </tr>
            <tr className="border-t-2 border-black">
              <td className="border-r border-black p-1"></td>
              <td className="border-r border-black p-1"></td>
              <td className="border-r border-black p-1"></td>
              <td className="border-r border-black p-1 text-right font-bold">Patti Amt</td>
              <td className="p-1 text-right font-bold">{patti.netAmount.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        {/* Footer */}
        <div className="text-right mt-16 pb-4">
          <p>For {settings.businessName}</p>
          <p className="mt-8">E.&O.E</p>
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
