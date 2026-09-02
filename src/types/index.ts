// Farmer
export interface Farmer {
  id?: number;
  farmerCode: string;
  name: string;
  village: string;
  mobile: string;
  address?: string;
  bankName?: string;
  accountNumber?: string;
  ifsc?: string;
  pan?: string;
  notes?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

// Buyer
export interface Buyer {
  id?: number;
  buyerCode: string;
  name: string;
  address: string;
  city?: string;
  mobile: string;
  gstin: string;
  pan?: string;
  notes?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

// Product
export interface Product {
  id?: number;
  name: string;
  hsnCode: string;
  unit: string;
  defaultRate: number;
  openingStock?: number;
  openingStockBags?: number;
  openingStockWeight?: number;
  active: boolean;
  createdAt: string | Date;
}

// Transaction Item
export interface TransactionItem {
  id?: string;
  productId: number | string;
  productName: string;
  hsnCode: string;
  bags: number;
  weightKg: number;
  ratePerQuintal: number;
  amount: number;
}

// Rates Snapshot - stored with each bill
export interface RatesSnapshot {
  adatRate: number;
  levyRate: number;
  tdsRate: number;
  containerRate: number;
  hamaliRate: number;
  tolaiRate: number;
  cgstRate: number;
  sgstRate: number;
  marketCess: number;
  supervisionFee: number;
}

// Awak (Inward Entry)
export interface Awak {
  id?: number;
  awakNo: number;
  awakDate: string;
  saudaDate: string;
  farmerId: number;
  farmerName: string;
  village: string;
  buyerId: number;
  buyerName: string;
  items: TransactionItem[];
  advance: number;
  notes: string;
  status: 'active' | 'cancelled';
  createdAt: string | Date;
  updatedAt: string | Date;
}

// Farmer Patti
export interface FarmerPatti {
  id?: number;
  pattiNo: number;
  awakId: number;
  awakNo: number;
  awakDate: string;
  saudaDate: string;
  date: string;
  farmerId: number;
  farmerName: string;
  village: string;
  buyerId: number;
  buyerName: string;
  items: TransactionItem[];
  ratesSnapshot: RatesSnapshot;
  totalBags: number;
  totalWeight: number;
  totalAmount: number;
  container: number;
  gross: number;
  hamali: number;
  tolai: number;
  advance: number;
  pattiAmount: number;
  status: 'active' | 'cancelled';
  createdAt: string | Date;
  updatedAt: string | Date;
}

// Buyer Invoice
export interface BuyerInvoice {
  id?: number;
  invoiceNo: number;
  date: string;
  saudaDate: string;
  buyerId: number;
  buyerName: string;
  buyerAddress: string;
  buyerGstin: string;
  buyerState: string;
  items: BuyerInvoiceItem[];
  ratesSnapshot: RatesSnapshot;
  totalBags: number;
  totalWeight: number;
  totalAmount: number;
  container: number;
  adat: number;
  levy: number;
  hamali: number;
  tolai: number;
  marketCess: number;
  supervisionFee: number;
  compositeSupply: number;
  cgst: number;
  sgst: number;
  netAmount: number;
  tds: number;
  payable: number;
  hsnCode: string;
  status: 'active' | 'cancelled';
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface BuyerInvoiceItem extends TransactionItem {
  srNo: number;
  farmerName: string;
  farmerId: number | string;
  awakId?: number;
  awakNo?: number;
}

// Inventory Movement
export interface InventoryMovement {
  id?: number;
  productId: number;
  productName: string;
  type: 'PURCHASE' | 'SALE' | 'ADJUSTMENT';
  bags: number;
  weightKg: number;
  referenceType: 'AWAK' | 'INVOICE' | 'ADJUSTMENT';
  referenceId: number;
  referenceNo: number | string;
  notes: string;
  date: string;
  createdAt: string | Date;
}

// Inventory Stock
export interface InventoryStock {
  productId: number;
  productName: string;
  openingBags: number;
  openingWeight: number;
  purchasedBags: number;
  purchasedWeight: number;
  soldBags: number;
  soldWeight: number;
  adjustmentBags: number;
  adjustmentWeight: number;
  currentBags: number;
  currentWeight: number;
  stockValue: number;
}

// Settings
export interface AppSettings {
  id?: number;
  businessName: string;
  address: string;
  phone: string;
  gstin: string;
  proprietor: string;
  marketYard: string;
  plotNo: string;
  banks: BankDetail[];
  adatRate: number;
  levyRate: number;
  tdsRate: number;
  containerRate: number;
  hamaliRate: number;
  tolaiRate: number;
  cgstRate: number;
  sgstRate: number;
  defaultMarketCess: number;
  defaultSupervisionFee: number;
  nextAwakNo: number;
  nextPattiNo: number;
  nextInvoiceNo: number;
  allowNegativeStock: boolean;
  adminPin: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface BankDetail {
  bankName: string;
  accountNumber: string;
  ifsc: string;
}

// User role
export type UserRole = 'ADMIN' | 'OPERATOR';

// Search result
export interface SearchResult {
  type: 'farmer' | 'buyer' | 'awak' | 'patti' | 'invoice' | 'product';
  id: number;
  label: string;
  sublabel: string;
  number?: number;
  date?: string;
  amount?: number;
}

// For farmer patti calculation result
export interface FarmerPattiCalc {
  items: TransactionItem[];
  totalBags: number;
  totalWeight: number;
  totalAmount: number;
  container: number;
  gross: number;
  hamali: number;
  tolai: number;
  advance: number;
  pattiAmount: number;
}

// For buyer invoice calculation result
export interface BuyerInvoiceCalc {
  items: BuyerInvoiceItem[];
  totalBags: number;
  totalWeight: number;
  totalAmount: number;
  container: number;
  adat: number;
  hamali: number;
  tolai: number;
  levy: number;
  marketCess: number;
  supervisionFee: number;
  compositeSupply: number;
  cgst: number;
  sgst: number;
  netAmount: number;
  tds: number;
  payable: number;
}
