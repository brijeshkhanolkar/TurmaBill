import { TransactionItem, BuyerInvoiceItem, RatesSnapshot, FarmerPattiCalc, BuyerInvoiceCalc } from '../types';

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calculateItemAmount(weightKg: number, ratePerQuintal: number): number {
  return roundMoney((weightKg / 100) * ratePerQuintal);
}

export function calculateContainer(totalBags: number, containerRate: number): number {
  return roundMoney(totalBags * containerRate);
}

export function calculateGross(totalAmount: number, container: number): number {
  return roundMoney(totalAmount + container);
}

export function calculateHamali(totalBags: number, hamaliRate: number): number {
  return roundMoney(totalBags * hamaliRate);
}

export function calculateTolai(totalWeightKg: number, tolaiRate: number): number {
  return roundMoney((totalWeightKg / 100) * tolaiRate);
}

export function calculatePattiAmount(gross: number, hamali: number, tolai: number, advance: number): number {
  return roundMoney(gross - hamali - tolai - advance);
}

export function calculateAdat(totalAmount: number, adatRate: number): number {
  return roundMoney(totalAmount * (adatRate / 100));
}

export function calculateLevy(hamali: number, tolai: number, levyRate: number): number {
  return roundMoney((hamali + tolai) * (levyRate / 100));
}

export function calculateTDS(adat: number, tdsRate: number): number {
  return roundMoney(adat * (tdsRate / 100));
}

export function calculateCGST(compositeSupply: number, cgstRate: number): number {
  return roundMoney(compositeSupply * (cgstRate / 100));
}

export function calculateSGST(compositeSupply: number, sgstRate: number): number {
  return roundMoney(compositeSupply * (sgstRate / 100));
}

export function calculateFullFarmerPatti(items: TransactionItem[], advance: number, rates: RatesSnapshot): FarmerPattiCalc {
  let totalBags = 0;
  let totalWeight = 0;
  let totalAmount = 0;

  const processedItems = items.map(item => {
    const amount = calculateItemAmount(item.weightKg, item.ratePerQuintal);
    totalBags += item.bags;
    totalWeight += item.weightKg;
    totalAmount += amount;
    return { ...item, amount };
  });

  const container = calculateContainer(totalBags, rates.containerRate);
  const gross = calculateGross(totalAmount, container);
  const hamali = calculateHamali(totalBags, rates.hamaliRate);
  const tolai = calculateTolai(totalWeight, rates.tolaiRate);
  const pattiAmount = calculatePattiAmount(gross, hamali, tolai, advance);

  return {
    items: processedItems,
    totalBags,
    totalWeight,
    totalAmount,
    container,
    gross,
    hamali,
    tolai,
    advance,
    pattiAmount
  };
}

export function calculateFullBuyerInvoice(items: BuyerInvoiceItem[], rates: RatesSnapshot): BuyerInvoiceCalc {
  let totalBags = 0;
  let totalWeight = 0;
  let totalAmount = 0;

  const processedItems = items.map(item => {
    const amount = calculateItemAmount(item.weightKg, item.ratePerQuintal);
    totalBags += item.bags;
    totalWeight += item.weightKg;
    totalAmount += amount;
    return { ...item, amount };
  });

  const adat = calculateAdat(totalAmount, rates.adatRate);
  const container = calculateContainer(totalBags, rates.containerRate);
  const hamali = calculateHamali(totalBags, rates.hamaliRate);
  const tolai = calculateTolai(totalWeight, rates.tolaiRate);
  const levy = calculateLevy(hamali, tolai, rates.levyRate);
  
  const marketCess = roundMoney(totalAmount * (rates.marketCess / 100));
  const supervisionFee = roundMoney(totalAmount * (rates.supervisionFee / 100));
  
  // Composite Supply = Amount + Container + Adat + Levy (matches physical bill format)
  const compositeSupply = roundMoney(totalAmount + container + adat + levy);
  const cgst = calculateCGST(compositeSupply, rates.cgstRate);
  const sgst = calculateSGST(compositeSupply, rates.sgstRate);
  
  // Net Amount = Composite Supply + GST (if any)
  const netAmount = roundMoney(compositeSupply + cgst + sgst);
  const tds = calculateTDS(adat, rates.tdsRate);
  const payable = roundMoney(netAmount - tds);

  return {
    items: processedItems,
    totalBags,
    totalWeight,
    totalAmount,
    container,
    adat,
    hamali,
    tolai,
    levy,
    marketCess,
    supervisionFee,
    compositeSupply,
    cgst,
    sgst,
    netAmount,
    tds,
    payable
  };
}
