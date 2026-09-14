DROP TABLE IF EXISTS error_log;
CREATE TABLE error_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  error_id TEXT,
  source TEXT,
  page TEXT,
  message TEXT,
  stack TEXT,
  context TEXT,
  created_at TEXT,
  reported TEXT,
  client_ip TEXT
);
CREATE INDEX IF NOT EXISTS idx_error_log_created_at ON error_log(created_at);
CREATE INDEX IF NOT EXISTS idx_error_log_reported ON error_log(reported);
CREATE INDEX IF NOT EXISTS idx_error_log_dedup ON error_log(source, page, created_at);
CREATE UNIQUE INDEX IF NOT EXISTS uq_error_log_error_id ON error_log(error_id);
