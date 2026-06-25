-- ============================================================
-- yuzunokaori 直感カウンセラー 予約システム — Supabase Schema
-- ============================================================

-- ============================================================
-- menus（メニューマスタ）
-- ============================================================
CREATE TABLE menus (
  id                         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  name                       TEXT        NOT NULL,
  price                      INTEGER     NOT NULL,
  duration_minutes           INTEGER     DEFAULT 90,
  customer_duration_minutes  INTEGER,
  provider_duration_minutes  INTEGER,
  description                TEXT,
  is_active                  BOOLEAN     DEFAULT true,
  sort_order                 INTEGER     DEFAULT 0,
  created_at                 TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- users（LINE連携ユーザー）
-- ============================================================
CREATE TABLE users (
  id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  line_user_id   TEXT        UNIQUE NOT NULL,
  name           TEXT        NOT NULL,
  phone          TEXT,
  is_first_visit BOOLEAN     DEFAULT true,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- locations（鑑定場所）
-- ============================================================
CREATE TABLE locations (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  name       TEXT        NOT NULL,
  address    TEXT        NOT NULL,
  is_active  BOOLEAN     DEFAULT true,
  sort_order INTEGER     DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- available_slots（予約受付可能日時 — 同時間帯に最大2予約）
-- ============================================================
CREATE TABLE available_slots (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  date         DATE        NOT NULL,
  time         TIME        NOT NULL,
  max_bookings INTEGER     DEFAULT 2,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (date, time)
);

-- ============================================================
-- reservations（予約）
-- ============================================================
CREATE TABLE reservations (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID        REFERENCES users(id)     NOT NULL,
  menu_id       UUID        REFERENCES menus(id)     NOT NULL,
  location_id   UUID        REFERENCES locations(id),
  is_online     BOOLEAN     DEFAULT false,
  date          DATE        NOT NULL,
  time          TIME        NOT NULL,
  status        TEXT        DEFAULT 'confirmed'
                            CHECK (status IN ('confirmed', 'cancelled')),
  referrer_name TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE menus            ENABLE ROW LEVEL SECURITY;
ALTER TABLE users            ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations        ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE available_slots  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "menus_select_all" ON menus FOR SELECT USING (true);
CREATE POLICY "menus_insert"     ON menus FOR INSERT WITH CHECK (true);
CREATE POLICY "menus_update"     ON menus FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "menus_delete"     ON menus FOR DELETE USING (true);

CREATE POLICY "users_all"              ON users            FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "locations_all"          ON locations        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "reservations_all"       ON reservations     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "available_slots_all"    ON available_slots  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- 初期データ（メニュー）
-- ============================================================
INSERT INTO menus (name, price, duration_minutes, customer_duration_minutes, provider_duration_minutes, description, sort_order) VALUES
  ('直感カウンセリング',  10000, 90, 90, 120, 'あなたの直感とエネルギーを読み解く、90分のセッションです', 1);

-- ============================================================
-- 初期データ（場所）
-- ============================================================
INSERT INTO locations (name, address, is_active, sort_order) VALUES
  ('オンライン（Zoom）',  'ZoomのURLは予約確定後にお送りします', true, 1),
  ('場所A（調整中）',     '詳細は予約確定後にお知らせします',   true, 2);
