DROP TABLE IF EXISTS committee_members;
CREATE TABLE committee_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  year INTEGER,
  name TEXT,
  created_by TEXT,
  view_role TEXT,
  view_role_hindi TEXT,
  whatsapp TEXT
);
CREATE INDEX IF NOT EXISTS idx_committee_members_year ON committee_members(year);
CREATE INDEX IF NOT EXISTS idx_committee_members_name ON committee_members(name);

DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_code TEXT,
  name TEXT,
  village TEXT,
  fathers_name TEXT,
  mobile TEXT,
  designation TEXT,
  created_by TEXT,
  email TEXT,
  whatsapp TEXT,
  name_hindi TEXT,
  fathers_name_hindi TEXT,
  designation_hindi TEXT,
  village_hindi TEXT,
  photo TEXT
);
CREATE INDEX IF NOT EXISTS idx_users_village ON users(village);
CREATE INDEX IF NOT EXISTS idx_users_mobile ON users(mobile);
CREATE INDEX IF NOT EXISTS idx_users_name ON users(name);
CREATE INDEX IF NOT EXISTS idx_users_id_code ON users(id_code);
CREATE INDEX IF NOT EXISTS idx_users_id_code_seq ON users(id_code);

DROP TABLE IF EXISTS portal_settings;
CREATE TABLE portal_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  "key" TEXT,
  value TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_portal_settings_key ON portal_settings("key");

DROP TABLE IF EXISTS journey_entries;
CREATE TABLE journey_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  year INTEGER,
  title_en TEXT,
  title_hi TEXT,
  content_en TEXT,
  content_hi TEXT,
  position INTEGER
);
CREATE INDEX IF NOT EXISTS idx_journey_entries_position ON journey_entries(position);

DROP TABLE IF EXISTS push_subscriptions;
CREATE TABLE push_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  endpoint TEXT,
  p256dh TEXT,
  auth TEXT,
  user_agent TEXT,
  active INTEGER DEFAULT 1,
  last_error TEXT,
  created_at TEXT,
  updated_at TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_push_subscriptions_endpoint ON push_subscriptions(endpoint);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON push_subscriptions(active);
