DROP TABLE IF EXISTS generated_files;
CREATE TABLE generated_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  doc_type TEXT,
  year INTEGER,
  record_id TEXT,
  file_name TEXT,
  public_link TEXT,
  drive_path TEXT,
  generated_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_generated_files_doc_type ON generated_files(doc_type);
CREATE INDEX IF NOT EXISTS idx_generated_files_year ON generated_files(year);
CREATE INDEX IF NOT EXISTS idx_generated_files_record_id ON generated_files(record_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_generated_files_doc_year_record
  ON generated_files(doc_type, year, record_id);
