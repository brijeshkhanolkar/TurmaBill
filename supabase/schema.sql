-- TurmaBill Database Schema for Supabase
-- Run this in the Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- FARMERS
-- ============================================================
CREATE TABLE IF NOT EXISTS farmers (
  id BIGSERIAL PRIMARY KEY,
  farmer_code TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL,
  village TEXT NOT NULL DEFAULT '',
  mobile TEXT DEFAULT '',
  address TEXT DEFAULT '',
  bank_name TEXT DEFAULT '',
  account_number TEXT DEFAULT '',
  ifsc TEXT DEFAULT '',
  pan TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- BUYERS
-- ============================================================
CREATE TABLE IF NOT EXISTS buyers (
  id BIGSERIAL PRIMARY KEY,
  buyer_code TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  city TEXT DEFAULT '',
  mobile TEXT DEFAULT '',
  gstin TEXT DEFAULT '',
  pan TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  hsn_code TEXT DEFAULT '0910',
  unit TEXT DEFAULT 'KG',
  default_rate NUMERIC(12,2) DEFAULT 0,
  opening_stock_bags INTEGER DEFAULT 0,
  opening_stock_weight NUMERIC(12,3) DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AWAKS (Inward Entries)
-- ============================================================
CREATE TABLE IF NOT EXISTS awaks (
  id BIGSERIAL PRIMARY KEY,
  awak_no INTEGER NOT NULL,
  awak_date TEXT NOT NULL,
  sauda_date TEXT NOT NULL,
  farmer_id BIGINT REFERENCES farmers(id) ON DELETE SET NULL,
  farmer_name TEXT NOT NULL DEFAULT '',
  village TEXT DEFAULT '',
  buyer_id BIGINT REFERENCES buyers(id) ON DELETE SET NULL,
  buyer_name TEXT NOT NULL DEFAULT '',
  items JSONB NOT NULL DEFAULT '[]',
  advance NUMERIC(12,2) DEFAULT 0,
  notes TEXT DEFAULT '',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FARMER PATTIS
-- ============================================================
CREATE TABLE IF NOT EXISTS farmer_pattis (
  id BIGSERIAL PRIMARY KEY,
  patti_no INTEGER NOT NULL,
  awak_id BIGINT REFERENCES awaks(id) ON DELETE SET NULL,
  awak_no INTEGER DEFAULT 0,
  awak_date TEXT DEFAULT '',
  sauda_date TEXT DEFAULT '',
  date TEXT NOT NULL,
  farmer_id BIGINT REFERENCES farmers(id) ON DELETE SET NULL,
  farmer_name TEXT NOT NULL DEFAULT '',
  village TEXT DEFAULT '',
  buyer_id BIGINT REFERENCES buyers(id) ON DELETE SET NULL,
  buyer_name TEXT DEFAULT '',
  items JSONB NOT NULL DEFAULT '[]',
  rates_snapshot JSONB NOT NULL DEFAULT '{}',
  total_bags INTEGER DEFAULT 0,
  total_weight NUMERIC(12,3) DEFAULT 0,
  total_amount NUMERIC(12,2) DEFAULT 0,
  container NUMERIC(12,2) DEFAULT 0,
  gross NUMERIC(12,2) DEFAULT 0,
  hamali NUMERIC(12,2) DEFAULT 0,
  tolai NUMERIC(12,2) DEFAULT 0,
  advance NUMERIC(12,2) DEFAULT 0,
  patti_amount NUMERIC(12,2) DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- BUYER INVOICES
-- ============================================================
CREATE TABLE IF NOT EXISTS buyer_invoices (
  id BIGSERIAL PRIMARY KEY,
  invoice_no INTEGER NOT NULL,
  date TEXT NOT NULL,
  sauda_date TEXT DEFAULT '',
  buyer_id BIGINT REFERENCES buyers(id) ON DELETE SET NULL,
  buyer_name TEXT NOT NULL DEFAULT '',
  buyer_address TEXT DEFAULT '',
  buyer_gstin TEXT DEFAULT '',
  buyer_state TEXT DEFAULT '',
  items JSONB NOT NULL DEFAULT '[]',
  rates_snapshot JSONB NOT NULL DEFAULT '{}',
  total_bags INTEGER DEFAULT 0,
  total_weight NUMERIC(12,3) DEFAULT 0,
  total_amount NUMERIC(12,2) DEFAULT 0,
  container NUMERIC(12,2) DEFAULT 0,
  adat NUMERIC(12,2) DEFAULT 0,
  levy NUMERIC(12,2) DEFAULT 0,
  hamali NUMERIC(12,2) DEFAULT 0,
  tolai NUMERIC(12,2) DEFAULT 0,
  market_cess NUMERIC(12,2) DEFAULT 0,
  supervision_fee NUMERIC(12,2) DEFAULT 0,
  composite_supply NUMERIC(12,2) DEFAULT 0,
  cgst NUMERIC(12,2) DEFAULT 0,
  sgst NUMERIC(12,2) DEFAULT 0,
  net_amount NUMERIC(12,2) DEFAULT 0,
  tds NUMERIC(12,2) DEFAULT 0,
  payable NUMERIC(12,2) DEFAULT 0,
  hsn_code TEXT DEFAULT '0910',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INVENTORY MOVEMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS inventory_movements (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'PURCHASE',
  bags INTEGER DEFAULT 0,
  weight_kg NUMERIC(12,3) DEFAULT 0,
  reference_type TEXT DEFAULT '',
  reference_id BIGINT DEFAULT 0,
  reference_no INTEGER DEFAULT 0,
  notes TEXT DEFAULT '',
  date TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS settings (
  id BIGSERIAL PRIMARY KEY,
  business_name TEXT DEFAULT 'SHRI SWAPN SIDDHI TRADING COMPANY',
  address TEXT DEFAULT 'Plot No. 135, Vasant Market Yard Sangli',
  phone TEXT DEFAULT '8856920740',
  gstin TEXT DEFAULT '27DEIPP6008E1ZH',
  proprietor TEXT DEFAULT 'Basavraj S. Patil',
  market_yard TEXT DEFAULT 'Sangli Krushi Utpanna Bazar Samiti, Sangli',
  plot_no TEXT DEFAULT '135',
  banks JSONB DEFAULT '[{"bankName":"RAJARAMBAPU SAHAKARI BANK","accountNumber":"023411500013896","ifsc":"RRBP0000023"},{"bankName":"ICICI BANK BR-M. YARD SANGLI","accountNumber":"653505054607","ifsc":"ICIC0006535"}]',
  adat_rate NUMERIC(5,2) DEFAULT 2.5,
  levy_rate NUMERIC(5,2) DEFAULT 30,
  tds_rate NUMERIC(5,2) DEFAULT 2,
  container_rate NUMERIC(8,2) DEFAULT 14,
  hamali_rate NUMERIC(8,2) DEFAULT 6.20,
  tolai_rate NUMERIC(8,2) DEFAULT 3.40,
  cgst_rate NUMERIC(5,2) DEFAULT 2.5,
  sgst_rate NUMERIC(5,2) DEFAULT 2.5,
  default_market_cess NUMERIC(8,2) DEFAULT 0,
  default_supervision_fee NUMERIC(8,2) DEFAULT 0,
  next_awak_no INTEGER DEFAULT 482,
  next_patti_no INTEGER DEFAULT 18,
  next_invoice_no INTEGER DEFAULT 101,
  allow_negative_stock BOOLEAN DEFAULT FALSE,
  admin_pin TEXT DEFAULT '0000',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY (allow all for now - single tenant app)
-- ============================================================
ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE awaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmer_pattis ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Allow full access with anon key (single-tenant business app)
CREATE POLICY "Allow all on farmers" ON farmers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on buyers" ON buyers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on awaks" ON awaks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on farmer_pattis" ON farmer_pattis FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on buyer_invoices" ON buyer_invoices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on inventory_movements" ON inventory_movements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on settings" ON settings FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Default Settings
INSERT INTO settings (id, business_name, address, phone, gstin, proprietor, market_yard, plot_no)
VALUES (1, 'SHRI SWAPN SIDDHI TRADING COMPANY', 'Plot No. 135, Vasant Market Yard Sangli', '8856920740', '27DEIPP6008E1ZH', 'Basavraj S. Patil', 'Sangli Krushi Utpanna Bazar Samiti, Sangli', '135')
ON CONFLICT (id) DO NOTHING;

-- Sample Farmers
INSERT INTO farmers (id, farmer_code, name, village, mobile) VALUES
  (1, 'F001', 'BABASAHEB KEDAR', 'KOREGAON', '9876543210'),
  (2, 'F002', 'BALAPPA N ALGUNDDI', 'ALGUNDDI', '9876543211'),
  (3, 'F003', 'RAMESH PATIL', 'MIRAJ', '9876543212')
ON CONFLICT (id) DO NOTHING;

-- Sample Buyers
INSERT INTO buyers (id, buyer_code, name, address, city, gstin) VALUES
  (1, 'B001', 'SHAH RATANSHI KHIMAJI', 'MUMBAI', 'MUMBAI', '27AABCS1234F1Z5'),
  (2, 'B002', 'RUSHABH CORPORATION', 'SANGLI', 'SANGLI', '27ABCPC2320G1ZE'),
  (3, 'B003', 'MAHALAXMI TRADERS', 'PUNE', 'PUNE', '27AADCM5678K1ZP')
ON CONFLICT (id) DO NOTHING;

-- Sample Products
INSERT INTO products (id, name, hsn_code, unit, default_rate, opening_stock_bags, opening_stock_weight, active) VALUES
  (1, 'KADI', '0910', 'KG', 15000, 100, 5000, true),
  (2, 'GATTA', '0910', 'KG', 14000, 50, 2500, true),
  (3, 'POLISHED', '0910', 'KG', 18000, 20, 1000, true)
ON CONFLICT (id) DO NOTHING;

-- Sample Awak
INSERT INTO awaks (id, awak_no, awak_date, sauda_date, farmer_id, farmer_name, village, buyer_id, buyer_name, items, advance, status) VALUES
  (1, 481, '2026-04-01', '2026-04-06', 1, 'BABASAHEB KEDAR', 'KOREGAON', 1, 'SHAH RATANSHI KHIMAJI',
   '[{"productId":1,"productName":"KADI","hsnCode":"0910","bags":1,"weightKg":48.5,"ratePerQuintal":15000,"amount":7275}]',
   0, 'active')
ON CONFLICT (id) DO NOTHING;

-- Sample Farmer Patti
INSERT INTO farmer_pattis (id, patti_no, awak_id, awak_no, awak_date, sauda_date, date, farmer_id, farmer_name, village, buyer_id, buyer_name, items, rates_snapshot, total_bags, total_weight, total_amount, container, gross, hamali, tolai, advance, patti_amount, status) VALUES
  (1, 17, 1, 481, '2026-04-01', '2026-04-06', '2026-04-28', 1, 'BABASAHEB KEDAR', 'KOREGAON', 1, 'SHAH RATANSHI KHIMAJI',
   '[{"productId":1,"productName":"KADI","hsnCode":"0910","bags":1,"weightKg":48.5,"ratePerQuintal":15000,"amount":7275}]',
   '{"adatRate":2.5,"levyRate":30,"tdsRate":2,"containerRate":14,"hamaliRate":6.2,"tolaiRate":3.4,"cgstRate":2.5,"sgstRate":2.5,"marketCess":0,"supervisionFee":0}',
   1, 48.500, 7275.00, 14.00, 7289.00, 6.20, 1.65, 0.00, 7281.15, 'active')
ON CONFLICT (id) DO NOTHING;

-- Sample Buyer Invoice
INSERT INTO buyer_invoices (id, invoice_no, date, sauda_date, buyer_id, buyer_name, buyer_address, buyer_gstin, buyer_state, items, rates_snapshot, total_bags, total_weight, total_amount, container, adat, levy, hamali, tolai, market_cess, supervision_fee, composite_supply, cgst, sgst, net_amount, tds, payable, hsn_code, status) VALUES
  (1, 100, '2026-02-12', '2026-02-06', 2, 'RUSHABH CORPORATION', 'SANGLI', '27ABCPC2320G1ZE', 'MAHARASHTRA',
   '[{"srNo":1,"farmerId":2,"farmerName":"BALAPPA N ALGUNDDI","productId":1,"productName":"KADI","hsnCode":"0910","bags":17,"weightKg":839.5,"ratePerQuintal":15950,"amount":133900.25},{"srNo":2,"farmerId":2,"farmerName":"BALAPPA N ALGUNDDI","productId":2,"productName":"GATTA","hsnCode":"0910","bags":4,"weightKg":197,"ratePerQuintal":14200,"amount":27974}]',
   '{"adatRate":2.5,"levyRate":30,"tdsRate":2,"containerRate":14,"hamaliRate":6.2,"tolaiRate":3.4,"cgstRate":2.5,"sgstRate":2.5,"marketCess":0,"supervisionFee":0}',
   21, 1036.500, 161874.25, 294.00, 4046.86, 37.55, 130.20, 35.24, 1294.99, 80.94, 166252.66, 0.00, 0.00, 166252.66, 81.00, 166171.66, '0910', 'active')
ON CONFLICT (id) DO NOTHING;

-- Reset sequences
SELECT setval('farmers_id_seq', (SELECT COALESCE(MAX(id), 0) FROM farmers) + 1, false);
SELECT setval('buyers_id_seq', (SELECT COALESCE(MAX(id), 0) FROM buyers) + 1, false);
SELECT setval('products_id_seq', (SELECT COALESCE(MAX(id), 0) FROM products) + 1, false);
SELECT setval('awaks_id_seq', (SELECT COALESCE(MAX(id), 0) FROM awaks) + 1, false);
SELECT setval('farmer_pattis_id_seq', (SELECT COALESCE(MAX(id), 0) FROM farmer_pattis) + 1, false);
SELECT setval('buyer_invoices_id_seq', (SELECT COALESCE(MAX(id), 0) FROM buyer_invoices) + 1, false);
SELECT setval('inventory_movements_id_seq', (SELECT COALESCE(MAX(id), 0) FROM inventory_movements) + 1, false);
SELECT setval('settings_id_seq', (SELECT COALESCE(MAX(id), 0) FROM settings) + 1, false);
