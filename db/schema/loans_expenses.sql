DROP TABLE IF EXISTS loans;
CREATE TABLE loans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  year INTEGER,
  name TEXT,
  amount REAL,
  intrest_rate REAL,
  tenure INTEGER,
  signature TEXT,
  loan_documents TEXT,
  created_by TEXT,
  status TEXT,
  loan_id TEXT,
  loan_status TEXT,
  final_repayment_date TEXT,
  cash_amount REAL,
  online_amount REAL,
  CHECK (amount IS NULL OR amount >= 0)
);
CREATE INDEX IF NOT EXISTS idx_loans_year ON loans(year);
CREATE INDEX IF NOT EXISTS idx_loans_loan_id ON loans(loan_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
CREATE INDEX IF NOT EXISTS idx_loans_name ON loans(name);

DROP TABLE IF EXISTS expenses;
CREATE TABLE expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  year INTEGER,
  discription TEXT,
  amount REAL,
  created_by TEXT,
  category TEXT,
  discription_hindi TEXT,
  CHECK (amount IS NULL OR amount >= 0)
);
CREATE INDEX IF NOT EXISTS idx_expenses_year ON expenses(year);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);

DROP TABLE IF EXISTS loan_guarantors;
CREATE TABLE loan_guarantors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  year INTEGER,
  loaner TEXT,
  guarantor TEXT,
  guarantor_signature TEXT,
  created_by TEXT,
  loan_id TEXT
);
CREATE INDEX IF NOT EXISTS idx_loan_guarantors_loan_id ON loan_guarantors(loan_id);
CREATE INDEX IF NOT EXISTS idx_loan_guarantors_guarantor ON loan_guarantors(guarantor);
CREATE INDEX IF NOT EXISTS idx_loan_guarantors_year_loaner ON loan_guarantors(year, loaner);

DROP TABLE IF EXISTS loan_consents;
CREATE TABLE loan_consents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  consent_id TEXT,
  loan_id TEXT,
  person_id TEXT,
  role TEXT,
  token TEXT,
  status TEXT,
  otp INTEGER,
  otp_verified TEXT,
  send_count INTEGER,
  created_at TEXT,
  responded_at TEXT,
  device_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  geo_lat REAL,
  geo_lng REAL,
  geo_accuracy REAL,
  photo_url TEXT,
  signature_url TEXT,
  decline_remarks TEXT,
  verification_status TEXT,
  verification_remarks TEXT,
  verified_by TEXT,
  verified_at TEXT,
  CHECK (role IS NULL OR role IN ('loaner', 'guarantor'))
);
CREATE INDEX IF NOT EXISTS idx_loan_consents_loan_id ON loan_consents(loan_id);
CREATE INDEX IF NOT EXISTS idx_loan_consents_token ON loan_consents(token);
CREATE INDEX IF NOT EXISTS idx_loan_consents_person_id ON loan_consents(person_id);
CREATE INDEX IF NOT EXISTS idx_loan_consents_consent_id ON loan_consents(consent_id);
CREATE INDEX IF NOT EXISTS idx_loan_consents_role ON loan_consents(role);
CREATE INDEX IF NOT EXISTS idx_loan_consents_status ON loan_consents(status);
CREATE INDEX IF NOT EXISTS idx_loan_consents_responded_at ON loan_consents(responded_at);
CREATE INDEX IF NOT EXISTS idx_loan_consents_verification_status ON loan_consents(verification_status);
