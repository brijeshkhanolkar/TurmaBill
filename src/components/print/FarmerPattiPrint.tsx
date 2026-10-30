import React from 'react';
import { FarmerPatti, AppSettings } from '../../types';
import { formatCurrency, formatDate, formatWeight } from '../../utils/formatters';

interface Props {
  patti: FarmerPatti;
  settings: AppSettings;
}

export const FarmerPattiPrint: React.FC<Props> = ({ patti, settings }) => {
  return (
    <div className="print-container bg-white text-black p-4" style={{ fontFamily: 'monospace', maxWidth: '800px', margin: '0 auto', fontSize: '14px' }}>
      <div className="text-center mb-4">
        <h2 className="font-bold text-lg">{settings.marketYard || 'Sangli Krushi Utpana Bazar Samiti, Sangli'}</h2>
        <p>By Laws No. 19 & 52 of Schedule 19 Patti</p>
      </div>

      <div className="flex justify-between mb-4">
        <div>Patti No. : {patti.pattiNo}</div>
        <div>DATE : {formatDate(patti.date)}</div>
      </div>

      <div className="mb-4">
        <h3 className="font-bold text-lg">Adatya : {settings.businessName}</h3>
        <p>Plot No. {settings.plotNo}, {settings.marketYard} {settings.address} Phone: {settings.phone}</p>
        <p>GST No. {settings.gstin}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p>Awak No. : {patti.awakNo}</p>
          <br/>
          <p>Farmer : {patti.farmerName}</p>
          <p className="ml-16">{patti.village}</p>
          <br/>
          <p>Buyer : {patti.buyerName}</p>
        </div>
        <div>
          <p>Awak Date: {formatDate(patti.awakDate)}</p>
          <p>Sauda Date: {formatDate(patti.saudaDate)}</p>
        </div>
      </div>

      <table className="w-full border-collapse mb-4 border border-black">
        <thead>
          <tr className="border-b border-black">
            <th className="border-r border-black p-1 text-left">ITEM</th>
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
              <td className="border-r border-black p-1 text-right">{formatWeight(item.weightKg)}</td>
              <td className="border-r border-black p-1 text-right">{item.ratePerQuintal.toFixed(2)}</td>
              <td className="p-1 text-right">{item.amount.toFixed(2)}</td>
            </tr>
          ))}
          <tr>
            <td className="border-r border-black p-1"></td>
            <td className="border-r border-black p-1 text-right font-bold">{patti.totalBags}</td>
            <td className="border-r border-black p-1 text-right font-bold">{formatWeight(patti.totalWeight)}</td>
            <td className="border-r border-black p-1 text-left">Container</td>
            <td className="p-1 text-right">{patti.container.toFixed(2)}</td>
          </tr>
          <tr>
            <td className="border-r border-black p-1"></td>
            <td className="border-r border-black p-1"></td>
            <td className="border-r border-black p-1"></td>
            <td className="border-r border-black p-1 text-left">Gross</td>
            <td className="p-1 text-right">{patti.gross.toFixed(2)}</td>
          </tr>
          <tr>
            <td className="border-r border-black p-1"></td>
            <td className="border-r border-black p-1"></td>
            <td className="border-r border-black p-1"></td>
            <td className="border-r border-black p-1 text-left">Hamali</td>
            <td className="p-1 text-right">{patti.hamali.toFixed(2)}</td>
          </tr>
          <tr>
            <td className="border-r border-black p-1"></td>
            <td className="border-r border-black p-1"></td>
            <td className="border-r border-black p-1"></td>
            <td className="border-r border-black p-1 text-left">Tolai</td>
            <td className="p-1 text-right">{patti.tolai.toFixed(2)}</td>
          </tr>
          <tr>
            <td className="border-r border-black p-1"></td>
            <td className="border-r border-black p-1"></td>
            <td className="border-r border-black p-1"></td>
            <td className="border-r border-black p-1 text-left">Advance</td>
            <td className="p-1 text-right">{patti.advance.toFixed(2)}</td>
          </tr>
          <tr className="border-t border-black font-bold">
            <td className="border-r border-black p-1"></td>
            <td className="border-r border-black p-1"></td>
            <td className="border-r border-black p-1"></td>
            <td className="border-r border-black p-1 text-left">Patti Amt</td>
            <td className="p-1 text-right">{patti.pattiAmount.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      <div className="flex justify-between mt-8">
        <div></div>
        <div className="text-center">
          <p>For {settings.businessName}</p>
          <p className="mt-8">E.&O.E</p>
        </div>
      </div>
    </div>
  );
};
