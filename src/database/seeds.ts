import { db } from './db';
import type { Farmer, Buyer, Product, Awak, FarmerPatti, BuyerInvoice, InventoryMovement, AppSettings } from '../types';

let seedPromise: Promise<void> | undefined;

async function seedDatabaseOnce() {
  const count = await db.settings.count();
  if (count > 0) {
    return; // Already seeded
  }

  await db.transaction('rw', [db.settings, db.farmers, db.buyers, db.products, db.awaks, db.farmerPattis, db.buyerInvoices, db.inventoryMovements], async () => {
    // 1. Settings
    const settings: AppSettings = {
      businessName: 'SHRI SWAPN SIDDHI TRADING COMPANY',
      address: 'Plot No. 135, Vasant Market Yard Sangli',
      phone: '8856920740',
      gstin: '27DEIPP6008E1ZH',
      proprietor: 'Basavraj S. Patil',
      marketYard: 'Sangli Krushi Utpanna Bazar Samiti, Sangli',
      plotNo: '135',
      banks: [
        { bankName: 'RAJARAMBAPU SAHAKARI BANK', accountNumber: '023411500013896', ifsc: 'RRBP0000023' },
        { bankName: 'ICICI BANK BR-M. YARD SANGLI', accountNumber: '653505054607', ifsc: 'ICIC0006535' }
      ],
      adatRate: 2.5,
      levyRate: 30,
      tdsRate: 2,
      containerRate: 14,
      hamaliRate: 6.20,
      tolaiRate: 3.40,
      cgstRate: 2.5,
      sgstRate: 2.5,
      defaultMarketCess: 0,
      defaultSupervisionFee: 0,
      nextAwakNo: 482,
      nextPattiNo: 18,
      nextInvoiceNo: 101,
      allowNegativeStock: false,
      adminPin: '0000',
    };
    await db.settings.add(settings);

    // 2. Farmers
    const farmers: Omit<Farmer, 'id'>[] = [
      { farmerCode: 'F001', name: 'BABASAHEB KEDAR', village: 'KOREGAON', mobile: '9876543210', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { farmerCode: 'F002', name: 'BALAPPA N ALGUNDDI', village: 'ALGUNDDI', mobile: '9876543211', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { farmerCode: 'F003', name: 'RAMESH PATIL', village: 'MIRAJ', mobile: '9876543212', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    ];
    await db.farmers.bulkAdd(farmers);

    // 3. Buyers
    const buyers: Omit<Buyer, 'id'>[] = [
      { buyerCode: 'B001', name: 'SHAH RATANSHI KHIMAJI', address: 'MUMBAI', gstin: '27AABCS1234F1Z5', mobile: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { buyerCode: 'B002', name: 'RUSHABH CORPORATION', address: 'SANGLI', gstin: '27ABCPC2320G1ZE', mobile: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { buyerCode: 'B003', name: 'MAHALAXMI TRADERS', address: 'PUNE', gstin: '27AADCM5678K1ZP', mobile: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    ];
    await db.buyers.bulkAdd(buyers);

    // 4. Products
    const products: Omit<Product, 'id'>[] = [
      { name: 'KADI', hsnCode: '0910', unit: 'KG', defaultRate: 15000, openingStockBags: 100, openingStockWeight: 5000, active: true, createdAt: new Date().toISOString() },
      { name: 'GATTA', hsnCode: '0910', unit: 'KG', defaultRate: 14000, openingStockBags: 50, openingStockWeight: 2500, active: true, createdAt: new Date().toISOString() },
      { name: 'POLISHED', hsnCode: '0910', unit: 'KG', defaultRate: 18000, openingStockBags: 20, openingStockWeight: 1000, active: true, createdAt: new Date().toISOString() }
    ];
    await db.products.bulkAdd(products);

    // 5. Awak
    const awak: Omit<Awak, 'id'> = {
      awakNo: 481,
      awakDate: '2026-04-01',
      saudaDate: '2026-04-06',
      farmerId: 1,
      farmerName: 'BABASAHEB KEDAR',
      village: 'KOREGAON',
      buyerId: 1,
      buyerName: 'SHAH RATANSHI KHIMAJI',
      items: [
        { productId: 1, productName: 'KADI', hsnCode: '0910', bags: 1, weightKg: 48.500, ratePerQuintal: 15000, amount: 7275.00 }
      ],
      advance: 0,
      notes: '',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await db.awaks.add(awak);

    // 6. Farmer Patti
    const farmerPatti: Omit<FarmerPatti, 'id'> = {
      pattiNo: 17,
      awakId: 1,
      awakNo: 481,
      awakDate: '2026-04-01',
      saudaDate: '2026-04-06',
      date: '2026-04-28',
      farmerId: 1,
      farmerName: 'BABASAHEB KEDAR',
      village: 'KOREGAON',
      buyerId: 1,
      buyerName: 'SHAH RATANSHI KHIMAJI',
      items: [
        { productId: 1, productName: 'KADI', hsnCode: '0910', bags: 1, weightKg: 48.500, ratePerQuintal: 15000, amount: 7275.00 }
      ],
      ratesSnapshot: { adatRate: 2.5, levyRate: 30, tdsRate: 2, containerRate: 14, hamaliRate: 6.20, tolaiRate: 3.40, cgstRate: 2.5, sgstRate: 2.5, marketCess: 0, supervisionFee: 0 },
      totalBags: 1,
      totalWeight: 48.500,
      totalAmount: 7275.00,
      container: 14.00,
      gross: 7289.00,
      hamali: 6.20,
      tolai: 1.65,
      advance: 0,
      pattiAmount: 7281.15,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await db.farmerPattis.add(farmerPatti);

    // 7. Buyer Invoice
    const buyerInvoice: Omit<BuyerInvoice, 'id'> = {
      invoiceNo: 100,
      date: '2026-02-12',
      saudaDate: '2026-02-06',
      buyerId: 2,
      buyerName: 'RUSHABH CORPORATION',
      buyerAddress: 'SANGLI',
      buyerGstin: '27ABCPC2320G1ZE',
      buyerState: 'MAHARASHTRA',
      items: [
        { srNo: 1, farmerId: 2, farmerName: 'BALAPPA N ALGUNDDI', productId: 1, productName: 'KADI', hsnCode: '0910', bags: 17, weightKg: 839.500, ratePerQuintal: 15950, amount: 133900.25 },
        { srNo: 2, farmerId: 2, farmerName: 'BALAPPA N ALGUNDDI', productId: 2, productName: 'GATTA', hsnCode: '0910', bags: 4, weightKg: 197.000, ratePerQuintal: 14200, amount: 27974.00 }
      ],
      hsnCode: '0910',
      totalBags: 21,
      totalWeight: 1036.500,
      totalAmount: 161874.25,
      container: 294.00,
      adat: 4046.86,
      hamali: 130.20,
      tolai: 35.24,
      levy: 37.55,
      marketCess: 1294.99,
      supervisionFee: 80.94,
      compositeSupply: 166252.66,
      cgst: 0,
      sgst: 0,
      netAmount: 166252.66,
      tds: 81.00,
      payable: 166171.66,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await db.buyerInvoices.add(buyerInvoice);

    // 8. Inventory Movements
    const inventoryMovements: Omit<InventoryMovement, 'id'>[] = [
      {
        productId: 1,
        productName: 'KADI',
        type: 'IN',
        referenceType: 'AWAK',
        referenceId: 1,
        referenceNo: '481',
        bags: 1,
        weightKg: 48.500,
        date: '2026-04-01',
        createdAt: new Date().toISOString()
      },
      {
        productId: 1,
        productName: 'KADI',
        type: 'IN',
        referenceType: 'INVOICE',
        referenceId: 1,
        referenceNo: '100',
        bags: 17,
        weightKg: 839.500,
        date: '2026-02-12',
        createdAt: new Date().toISOString()
      },
      {
        productId: 2,
        productName: 'GATTA',
        type: 'IN',
        referenceType: 'INVOICE',
        referenceId: 1,
        referenceNo: '100',
        bags: 4,
        weightKg: 197.000,
        date: '2026-02-12',
        createdAt: new Date().toISOString()
      }
    ];
    await db.inventoryMovements.bulkAdd(inventoryMovements);
  });
}

/**
 * React StrictMode runs effects twice in development.  Sharing this promise
 * prevents two concurrent first-run seed transactions and duplicate samples.
 */
export function seedDatabase(): Promise<void> {
  seedPromise ??= seedDatabaseOnce();
  return seedPromise;
}
