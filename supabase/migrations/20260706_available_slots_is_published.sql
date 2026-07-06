-- ============================================================
-- available_slots: 公開フラグを追加
--   予約枠を「下書き（is_published=false）」で作成できるようにし、
--   管理者が「公開」した枠だけを一般利用者に表示・予約可能にする。
--   既存の枠は現状の挙動を保つため公開済み(true)に揃える。
-- ============================================================

ALTER TABLE available_slots
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT FALSE;

-- 既存の受付枠は公開済み扱い（従来どおりユーザーに表示される）
UPDATE available_slots SET is_published = TRUE WHERE is_published = FALSE;

-- 一般利用者向けの絞り込みを高速化
CREATE INDEX IF NOT EXISTS idx_available_slots_published_date
  ON available_slots (is_published, date);
