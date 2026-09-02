import { db } from './db';
import type { Farmer, Buyer, Product, Awak, FarmerPatti, BuyerInvoice, InventoryMovement, AppSettings, RatesSnapshot, InventoryStock, SearchResult } from '../types';

// Earlier UI screens and the persisted schema used different field names.  These
// adapters keep the on-disk records canonical while giving every screen a safe,
// complete shape.  They also make existing IndexedDB data survive upgrades.
const number = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  if (Number.isFinite(parsed)) return parsed;
  const embedded = typeof value === 'string' ? Number(value.match(/\d+(?:\.\d+)?/)?.[0]) : NaN;
  return Number.isFinite(embedded) ? embedded : fallback;
};

const ratesFor = (settings: any): RatesSnapshot => ({
  adatRate: number(settings?.defaultRates?.adat ?? settings?.adatRate, 2.5),
  levyRate: number(settings?.defaultRates?.levy ?? settings?.levyRate, 30),
  tdsRate: number(settings?.defaultRates?.tds ?? settings?.tdsRate, 2),
  containerRate: number(settings?.defaultRates?.container ?? settings?.containerRate, 14),
  hamaliRate: number(settings?.defaultRates?.hamali ?? settings?.hamaliRate, 6.2),
  tolaiRate: number(settings?.defaultRates?.tolai ?? settings?.tolaiRate, 3.4),
  cgstRate: number(settings?.defaultRates?.cgst ?? settings?.cgstRate, 2.5),
  sgstRate: number(settings?.defaultRates?.sgst ?? settings?.sgstRate, 2.5),
  marketCess: number(settings?.defaultRates?.marketCess ?? settings?.defaultMarketCess, 0),
  supervisionFee: number(settings?.defaultRates?.supervision ?? settings?.defaultSupervisionFee, 0),
});

const enrichSettings = (value: any) => {
  if (!value) return undefined;
  const rates = ratesFor(value);
  return {
    ...value,
    adatRate: rates.adatRate, levyRate: rates.levyRate, tdsRate: rates.tdsRate,
    containerRate: rates.containerRate, hamaliRate: rates.hamaliRate, tolaiRate: rates.tolaiRate,
    cgstRate: rates.cgstRate, sgstRate: rates.sgstRate,
    defaultMarketCess: rates.marketCess, defaultSupervisionFee: rates.supervisionFee,
    rates,
    defaultRates: value.defaultRates ?? {
      adat: rates.adatRate, levy: rates.levyRate, tds: rates.tdsRate,
      container: rates.containerRate, hamali: rates.hamaliRate, tolai: rates.tolaiRate,
      cgst: rates.cgstRate, sgst: rates.sgstRate, marketCess: rates.marketCess,
      supervision: rates.supervisionFee,
    },
    nextAwakNo: number(value.nextBillNumbers?.awak ?? value.nextAwakNo, 1),
    nextPattiNo: number(value.nextBillNumbers?.patti ?? value.nextFarmerPattiNo ?? value.nextPattiNo, 1),
    nextInvoiceNo: number(value.nextBillNumbers?.invoice ?? value.nextBuyerInvoiceNo ?? value.nextInvoiceNo, 1),
    nextFarmerPattiNo: number(value.nextBillNumbers?.patti ?? value.nextFarmerPattiNo ?? value.nextPattiNo, 1),
    nextBuyerInvoiceNo: number(value.nextBillNumbers?.invoice ?? value.nextBuyerInvoiceNo ?? value.nextInvoiceNo, 1),
    nextBillNumbers: value.nextBillNumbers ?? {
      awak: number(value.nextAwakNo, 1), patti: number(value.nextPattiNo, 1), invoice: number(value.nextInvoiceNo, 1),
    },
  };
};

const enrichItem = (item: any, index = 0) => ({
  ...item,
  srNo: number(item.srNo, index + 1),
  productName: item.productName ?? '',
  hsnCode: item.hsnCode ?? '0910',
  farmerName: item.farmerName ?? '',
  weightKg: number(item.weightKg ?? item.weight),
  weight: number(item.weight ?? item.weightKg),
  ratePerQuintal: number(item.ratePerQuintal ?? item.rate),
  rate: number(item.rate ?? item.ratePerQuintal),
  amount: number(item.amount),
});

const enrichAwak = (value: any) => ({
  ...value,
  awakNo: number(value.awakNo),
  awakDate: value.awakDate ?? value.date,
  date: value.date ?? value.awakDate,
  farmerId: number(value.farmerId),
  buyerId: number(value.buyerId),
  farmerName: value.farmerName ?? '',
  buyerName: value.buyerName ?? '',
  items: (value.items ?? []).map(enrichItem),
  totalBags: number(value.totalBags, (value.items ?? []).reduce((sum: number, item: any) => sum + number(item.bags), 0)),
  totalWeight: number(value.totalWeight, (value.items ?? []).reduce((sum: number, item: any) => sum + number(item.weightKg ?? item.weight), 0)),
  totalAmount: number(value.totalAmount, (value.items ?? []).reduce((sum: number, item: any) => sum + number(item.amount), 0)),
  productName: value.productName ?? value.items?.[0]?.productName ?? '',
  status: value.status === 'active' || value.status === 'COMPLETED' ? 'COMPLETED' : 'PENDING',
});

const enrichPatti = (value: any) => ({
  ...value,
  pattiNo: number(value.pattiNo ?? value.pattiNumber),
  pattiNumber: number(value.pattiNumber ?? value.pattiNo),
  awakNo: number(value.awakNo ?? value.awakNumber),
  awakNumber: number(value.awakNumber ?? value.awakNo),
  date: value.date ?? value.awakDate,
  items: (value.items ?? []).map(enrichItem),
  totalWeight: number(value.totalWeight),
  totalNetWeight: number(value.totalNetWeight ?? value.totalWeight),
  totalAmount: number(value.totalAmount ?? value.amount),
  amount: number(value.amount ?? value.gross ?? value.totalAmount),
  gross: number(value.gross ?? value.amount),
  pattiAmount: number(value.pattiAmount ?? value.netAmount),
  netAmount: number(value.netAmount ?? value.pattiAmount),
  deductions: value.deductions ?? { container: number(value.container), hamali: number(value.hamali), tolai: number(value.tolai), advance: number(value.advance) },
  status: value.status === 'cancelled' ? 'cancelled' : 'COMPLETED',
});

const enrichInvoice = (value: any) => ({
  ...value,
  invoiceNo: number(value.invoiceNo ?? value.invoiceNumber),
  invoiceNumber: number(value.invoiceNumber ?? value.invoiceNo),
  buyerCity: value.buyerCity ?? value.buyerAddress ?? '',
  items: (value.items ?? []).map(enrichItem),
  totalAmount: number(value.totalAmount ?? value.amount),
  amount: number(value.amount ?? value.totalAmount),
  compositeSupply: number(value.compositeSupply ?? value.subTotal),
  subTotal: number(value.subTotal ?? value.compositeSupply),
  payable: number(value.payable ?? value.payableAmount),
  payableAmount: number(value.payableAmount ?? value.payable),
  charges: value.charges ?? { container: number(value.container), adat: number(value.adat), levy: number(value.levy), tds: number(value.tds), marketCess: number(value.marketCess), supervision: number(value.supervisionFee), cgst: number(value.cgst), sgst: number(value.sgst), cgstRate: number(value.ratesSnapshot?.cgstRate, 2.5), sgstRate: number(value.ratesSnapshot?.sgstRate, 2.5) },
  status: value.status === 'cancelled' ? 'cancelled' : 'COMPLETED',
});

// Farmer services
export async function getAllFarmers(): Promise<Farmer[]> {
  return db.farmers.toArray();
}

export async function getFarmerById(id: number): Promise<Farmer | undefined> {
  return db.farmers.get(Number(id));
}

export async function addFarmer(farmer: Omit<Farmer, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
  return db.farmers.add({
    ...farmer,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as any);
}

export async function updateFarmer(id: number, farmer: Partial<Farmer>): Promise<void> {
  await db.farmers.update(Number(id), { ...farmer, updatedAt: new Date().toISOString() });
}

export async function deleteFarmer(id: number): Promise<void> {
  await db.farmers.delete(Number(id));
}

export async function searchFarmers(query: string): Promise<Farmer[]> {
  const q = query.toLowerCase();
  return db.farmers.filter(f => f.name.toLowerCase().includes(q) || f.village.toLowerCase().includes(q)).toArray();
}

// Buyer services
export async function getAllBuyers(): Promise<Buyer[]> {
  return db.buyers.toArray();
}

export async function getBuyerById(id: number): Promise<Buyer | undefined> {
  return db.buyers.get(Number(id));
}

export async function addBuyer(buyer: Omit<Buyer, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
  return db.buyers.add({
    ...buyer,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as any);
}

export async function updateBuyer(id: number, buyer: Partial<Buyer>): Promise<void> {
  await db.buyers.update(Number(id), { ...buyer, updatedAt: new Date().toISOString() });
}

export async function deleteBuyer(id: number): Promise<void> {
  await db.buyers.delete(Number(id));
}

export async function searchBuyers(query: string): Promise<Buyer[]> {
  const q = query.toLowerCase();
  return db.buyers.filter(b => b.name.toLowerCase().includes(q) || (b.gstin && b.gstin.toLowerCase().includes(q))).toArray();
}

// Product services
export async function getAllProducts(): Promise<Product[]> {
  return db.products.toArray();
}

export async function getActiveProducts(): Promise<Product[]> {
  return db.products.filter(p => p.active !== false && (p as any).isActive !== false).toArray();
}

export async function getProductById(id: number): Promise<Product | undefined> {
  return db.products.get(Number(id));
}

export async function addProduct(product: Omit<Product, 'id' | 'createdAt'>): Promise<number> {
  return db.products.add({
    ...product,
    createdAt: new Date().toISOString(),
  } as any);
}

export async function updateProduct(id: number, product: Partial<Product>): Promise<void> {
  await db.products.update(Number(id), product);
}

export async function deleteProduct(id: number): Promise<void> {
  await db.products.delete(Number(id));
}

// Awak services
export async function getAllAwaks(): Promise<Awak[]> {
  return (await db.awaks.toArray()).map(enrichAwak) as Awak[];
}

export async function getAwakById(id: number): Promise<Awak | undefined> {
  const awak = await db.awaks.get(Number(id));
  return awak ? enrichAwak(awak) as Awak : undefined;
}

export async function addAwak(awak: Omit<Awak, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
  const canonical = enrichAwak(awak);
  const [farmer, buyer, products] = await Promise.all([
    db.farmers.get(Number(canonical.farmerId)), db.buyers.get(Number(canonical.buyerId)), db.products.toArray(),
  ]);
  canonical.farmerName ||= farmer?.name ?? '';
  canonical.village ||= farmer?.village ?? '';
  canonical.buyerName ||= buyer?.name ?? '';
  canonical.items = canonical.items.map((item: any, index: number) => enrichItem({
    ...item,
    productId: Number(item.productId),
    productName: item.productName || products.find(p => Number(p.id) === Number(item.productId))?.name,
    hsnCode: item.hsnCode || products.find(p => Number(p.id) === Number(item.productId))?.hsnCode,
  }, index));
  return db.awaks.add({
    ...canonical,
    awakDate: canonical.awakDate ?? canonical.date,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as any);
}

export async function updateAwak(id: number, awak: Partial<Awak>): Promise<void> {
  await db.awaks.update(Number(id), { ...enrichAwak(awak), updatedAt: new Date().toISOString() } as any);
}

export async function deleteAwak(id: number): Promise<void> {
  await db.awaks.delete(Number(id));
}

export async function getNextAwakNo(): Promise<number> {
  const settings = await getSettings();
  return settings ? settings.nextAwakNo : 1;
}

// Farmer Patti services
export async function getAllFarmerPattis(): Promise<FarmerPatti[]> {
  return (await db.farmerPattis.toArray()).map(enrichPatti) as FarmerPatti[];
}

export async function getFarmerPattiById(id: number): Promise<FarmerPatti | undefined> {
  const patti = await db.farmerPattis.get(Number(id));
  return patti ? enrichPatti(patti) as FarmerPatti : undefined;
}

export async function addFarmerPatti(patti: Omit<FarmerPatti, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
  const canonical = enrichPatti(patti);
  const [farmer, buyer] = await Promise.all([db.farmers.get(Number(canonical.farmerId)), db.buyers.get(Number(canonical.buyerId))]);
  canonical.farmerName ||= farmer?.name ?? '';
  canonical.village ||= farmer?.village ?? '';
  canonical.buyerName ||= buyer?.name ?? '';
  canonical.ratesSnapshot ??= await getRatesSnapshot();
  return db.farmerPattis.add({
    ...canonical,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as any);
}

export async function updateFarmerPatti(id: number, patti: Partial<FarmerPatti>): Promise<void> {
  await db.farmerPattis.update(Number(id), { ...enrichPatti(patti), updatedAt: new Date().toISOString() } as any);
}

export async function deleteFarmerPatti(id: number): Promise<void> {
  await db.farmerPattis.delete(Number(id));
}

export async function getNextPattiNo(): Promise<number> {
  const settings = await getSettings();
  return settings ? settings.nextPattiNo : 1;
}

export async function getFarmerPattisByFarmer(farmerId: number): Promise<FarmerPatti[]> {
  return (await db.farmerPattis.where('farmerId').equals(farmerId).toArray()).map(enrichPatti) as FarmerPatti[];
}

// Buyer Invoice services
export async function getAllBuyerInvoices(): Promise<BuyerInvoice[]> {
  return (await db.buyerInvoices.toArray()).map(enrichInvoice) as BuyerInvoice[];
}

export async function getBuyerInvoiceById(id: number): Promise<BuyerInvoice | undefined> {
  const invoice = await db.buyerInvoices.get(Number(id));
  return invoice ? enrichInvoice(invoice) as BuyerInvoice : undefined;
}

export async function addBuyerInvoice(invoice: Omit<BuyerInvoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
  const canonical = enrichInvoice(invoice);
  const [buyer, farmers, products] = await Promise.all([db.buyers.get(Number(canonical.buyerId)), db.farmers.toArray(), db.products.toArray()]);
  canonical.buyerName ||= buyer?.name ?? '';
  canonical.buyerAddress ||= buyer?.address ?? '';
  canonical.buyerCity ||= buyer?.city ?? buyer?.address ?? '';
  canonical.buyerGstin ||= buyer?.gstin ?? '';
  canonical.items = canonical.items.map((item: any, index: number) => enrichItem({
    ...item,
    productId: Number(item.productId),
    productName: item.productName || products.find(p => Number(p.id) === Number(item.productId))?.name,
    hsnCode: item.hsnCode || products.find(p => Number(p.id) === Number(item.productId))?.hsnCode,
    farmerName: item.farmerName || farmers.find(f => Number(f.id) === Number(item.farmerId))?.name,
  }, index));
  canonical.ratesSnapshot ??= await getRatesSnapshot();
  return db.buyerInvoices.add({
    ...canonical,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as any);
}

export async function updateBuyerInvoice(id: number, invoice: Partial<BuyerInvoice>): Promise<void> {
  await db.buyerInvoices.update(Number(id), { ...enrichInvoice(invoice), updatedAt: new Date().toISOString() } as any);
}

export async function deleteBuyerInvoice(id: number): Promise<void> {
  await db.buyerInvoices.delete(Number(id));
}

export async function getNextInvoiceNo(): Promise<number> {
  const settings = await getSettings();
  return settings ? settings.nextInvoiceNo : 1;
}

export async function getBuyerInvoicesByBuyer(buyerId: number): Promise<BuyerInvoice[]> {
  return (await db.buyerInvoices.where('buyerId').equals(buyerId).toArray()).map(enrichInvoice) as BuyerInvoice[];
}

// Inventory services
export async function getInventoryMovements(productId?: number): Promise<InventoryMovement[]> {
  const normalise = (movement: any) => ({ ...movement, weightKg: number(movement.weightKg ?? movement.weight), weight: number(movement.weight ?? movement.weightKg) });
  if (productId) {
    return (await db.inventoryMovements.where('productId').equals(productId).toArray()).map(normalise) as InventoryMovement[];
  }
  return (await db.inventoryMovements.toArray()).map(normalise) as InventoryMovement[];
}

export async function addInventoryMovement(movement: Omit<InventoryMovement, 'id' | 'createdAt'>): Promise<number> {
  const input: any = movement;
  const products = await getAllProducts();
  const product = products.find(p => Number(p.id) === Number(input.productId));
  return db.inventoryMovements.add({
    ...input,
    productId: Number(input.productId),
    productName: input.productName ?? product?.name ?? '',
    bags: number(input.bags ?? input.quantityBags),
    weightKg: number(input.weightKg ?? input.weight),
    referenceNo: input.referenceNo ?? input.referenceId ?? '',
    notes: input.notes ?? '',
    createdAt: new Date().toISOString(),
  } as any);
}

export async function getInventoryStock(): Promise<InventoryStock[]> {
  const products = await getAllProducts();
  const movements = await getInventoryMovements();
  
  return products.map(product => {
    const openingBags = number(product.openingStockBags ?? product.openingStock);
    const openingWeight = number(product.openingStockWeight);
    let purchasedBags = 0, purchasedWeight = 0, soldBags = 0, soldWeight = 0, adjustmentBags = 0, adjustmentWeight = 0;
    
    const prodMovements = movements.filter(m => m.productId === product.id);
    for (const m of prodMovements) {
      if (m.type === 'IN' || m.type === 'PURCHASE') {
        purchasedBags += number(m.bags); purchasedWeight += number(m.weightKg);
      } else if (m.type === 'OUT' || m.type === 'SALE') {
        soldBags += number(m.bags); soldWeight += number(m.weightKg);
      } else {
        adjustmentBags += number(m.bags); adjustmentWeight += number(m.weightKg);
      }
    }
    
    return {
      productId: product.id!,
      productName: product.name,
      openingBags, openingWeight, purchasedBags, purchasedWeight, soldBags, soldWeight,
      adjustmentBags, adjustmentWeight,
      adjustedBags: adjustmentBags, adjustedWeight: adjustmentWeight,
      currentBags: openingBags + purchasedBags - soldBags + adjustmentBags,
      currentWeight: openingWeight + purchasedWeight - soldWeight + adjustmentWeight,
      quantityBags: openingBags + purchasedBags - soldBags + adjustmentBags,
      currentStockBags: openingBags + purchasedBags - soldBags + adjustmentBags,
      currentStockWeight: openingWeight + purchasedWeight - soldWeight + adjustmentWeight,
      stockValue: ((openingWeight + purchasedWeight - soldWeight + adjustmentWeight) / 100) * number(product.defaultRate),
      defaultRate: number(product.defaultRate),
    } as InventoryStock;
  });
}

export async function addStockAdjustment(productId: number | any, productName?: string, bags?: number, weightKg?: number, notes?: string): Promise<number> {
  // Support the single-object form used by the inventory screen.
  if (typeof productId === 'object') {
    const input = productId;
    const products = await getAllProducts();
    const product = products.find(p => String(p.id) === String(input.productId) || p.name.toLowerCase() === String(input.productId).toLowerCase());
    const direction = input.type === 'REMOVE' ? -1 : 1;
    return addStockAdjustment(Number(product?.id ?? input.productId), product?.name ?? String(input.productId), direction * number(input.bags), direction * number(input.weight ?? input.weightKg), input.notes ?? 'Stock adjustment');
  }
  return addInventoryMovement({
    productId,
    productName: productName ?? '',
    type: 'ADJUSTMENT',
    referenceType: 'ADJUSTMENT',
    referenceId: 0,
    referenceNo: 0,
    bags: number(bags),
    weightKg: number(weightKg),
    date: new Date().toISOString().split('T')[0],
    notes: notes ?? '',
  });
}

// Settings services
export async function getSettings(): Promise<AppSettings> {
  const settings = await db.settings.toArray();
  return enrichSettings(settings[0]) as AppSettings;
}

export async function updateSettings(settings: Partial<AppSettings>): Promise<void> {
  const current = await getSettings();
  const normalised = enrichSettings({ ...current, ...settings, defaultRates: (settings as any).defaultRates ?? (current as any)?.defaultRates, nextBillNumbers: (settings as any).nextBillNumbers ?? (current as any)?.nextBillNumbers });
  if (current && current.id) {
    await db.settings.update(current.id, normalised);
  } else {
    await db.settings.add(normalised as AppSettings);
  }
}

export async function getRatesSnapshot(): Promise<RatesSnapshot> {
  const settings = await getSettings();
  return {
    adatRate: settings.adatRate,
    levyRate: settings.levyRate,
    tdsRate: settings.tdsRate,
    containerRate: settings.containerRate,
    hamaliRate: settings.hamaliRate,
    tolaiRate: settings.tolaiRate,
    cgstRate: settings.cgstRate,
    sgstRate: settings.sgstRate,
    marketCess: settings.defaultMarketCess,
    supervisionFee: settings.defaultSupervisionFee,
  };
}

// Global search
export async function globalSearch(query: string): Promise<SearchResult[]> {
  const q = query.toLowerCase();
  const results: SearchResult[] = [];

  const farmers = await db.farmers.toArray();
  farmers.filter(f => f.name.toLowerCase().includes(q) || f.village.toLowerCase().includes(q)).forEach(f => {
    results.push({ type: 'farmer', id: f.id!, label: f.name, sublabel: f.village });
  });

  const buyers = await db.buyers.toArray();
  buyers.filter(b => b.name.toLowerCase().includes(q) || (b.gstin && b.gstin.toLowerCase().includes(q))).forEach(b => {
    results.push({ type: 'buyer', id: b.id!, label: b.name, sublabel: b.gstin || '' });
  });

  const awaks = await db.awaks.toArray();
  awaks.filter(a => a.awakNo.toString().includes(q) || a.farmerName.toLowerCase().includes(q) || a.buyerName.toLowerCase().includes(q)).forEach(a => {
    results.push({ type: 'awak', id: a.id!, label: `Awak #${a.awakNo}`, sublabel: `${a.farmerName} - ${a.buyerName}`, number: a.awakNo });
  });

  const pattis = await db.farmerPattis.toArray();
  pattis.filter(p => p.pattiNo.toString().includes(q) || p.farmerName.toLowerCase().includes(q)).forEach(p => {
    results.push({ type: 'patti', id: p.id!, label: `Patti #${p.pattiNo}`, sublabel: p.farmerName, number: p.pattiNo, amount: p.pattiAmount });
  });

  const invoices = await db.buyerInvoices.toArray();
  invoices.filter(i => i.invoiceNo.toString().includes(q) || i.buyerName.toLowerCase().includes(q)).forEach(i => {
    results.push({ type: 'invoice', id: i.id!, label: `Invoice #${i.invoiceNo}`, sublabel: i.buyerName, number: i.invoiceNo, amount: i.netAmount });
  });

  const products = await db.products.toArray();
  products.filter(p => p.name.toLowerCase().includes(q)).forEach(p => {
    results.push({ type: 'product', id: p.id!, label: p.name, sublabel: `HSN: ${p.hsnCode}` });
  });

  return results;
}

// Aliases for convenience
export const getFarmerPattis = getAllFarmerPattis;
export const getBuyerInvoices = getAllBuyerInvoices;
