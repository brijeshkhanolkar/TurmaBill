import Dexie, { type Table } from 'dexie';
import type { Farmer, Buyer, Product, Awak, FarmerPatti, BuyerInvoice, InventoryMovement, AppSettings } from '../types';

export class TurmaBillDB extends Dexie {
  farmers!: Table<Farmer, number>;
  buyers!: Table<Buyer, number>;
  products!: Table<Product, number>;
  awaks!: Table<Awak, number>;
  farmerPattis!: Table<FarmerPatti, number>;
  buyerInvoices!: Table<BuyerInvoice, number>;
  inventoryMovements!: Table<InventoryMovement, number>;
  settings!: Table<AppSettings, number>;

  constructor() {
    super('TurmaBillDB');
    this.version(1).stores({
      farmers: '++id, farmerCode, name, village, mobile',
      buyers: '++id, buyerCode, name, gstin, mobile',
      products: '++id, name, hsnCode, active',
      awaks: '++id, awakNo, awakDate, farmerId, buyerId, status',
      farmerPattis: '++id, pattiNo, awakId, farmerId, buyerId, date, status',
      buyerInvoices: '++id, invoiceNo, buyerId, date, status',
      inventoryMovements: '++id, productId, type, referenceType, referenceId, date',
      settings: '++id',
    });
  }
}

export const db = new TurmaBillDB();
