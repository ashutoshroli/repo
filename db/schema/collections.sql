DROP TABLE IF EXISTS collections;
CREATE TABLE collections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  year INTEGER,
  sl_no INTEGER,
  name TEXT,
  amount REAL,
  created_by TEXT,
  payment_mode TEXT,
  date TEXT,
  contribution_type INTEGER,
  detail TEXT,
  certificate_or_receipt TEXT,
  utr TEXT,
  is_resell TEXT,
  announced TEXT,
  announcedcount INTEGER,
  CHECK (amount IS NULL OR amount >= 0)
);
CREATE INDEX IF NOT EXISTS idx_collections_year ON collections(year);
CREATE INDEX IF NOT EXISTS idx_collections_payment_mode ON collections(payment_mode);
CREATE INDEX IF NOT EXISTS idx_collections_contribution_type ON collections(contribution_type);
CREATE INDEX IF NOT EXISTS idx_collections_announced ON collections(announced);
CREATE INDEX IF NOT EXISTS idx_collections_name ON collections(name);
CREATE INDEX IF NOT EXISTS idx_collections_year_sl_no ON collections(year, sl_no);
