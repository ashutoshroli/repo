DROP TABLE IF EXISTS popups;
CREATE TABLE popups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  popup_id TEXT,
  title TEXT,
  roles TEXT,
  active TEXT,
  start_at TEXT,
  end_at TEXT,
  created_at TEXT,
  updated_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_popups_active ON popups(active);
CREATE INDEX IF NOT EXISTS idx_popups_popup_id ON popups(popup_id);
CREATE INDEX IF NOT EXISTS idx_popups_start_at ON popups(start_at);
CREATE INDEX IF NOT EXISTS idx_popups_end_at ON popups(end_at);

DROP TABLE IF EXISTS popup_slides;
CREATE TABLE popup_slides (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slide_id TEXT,
  popup_id TEXT,
  slide_order INTEGER,
  image_url TEXT,
  text TEXT,
  link_url TEXT,
  link_text TEXT,
  duration_ms INTEGER
);
CREATE INDEX IF NOT EXISTS idx_popup_slides_popup_id ON popup_slides(popup_id);
