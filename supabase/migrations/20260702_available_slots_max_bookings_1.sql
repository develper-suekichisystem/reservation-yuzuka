-- ============================================================
-- available_slots: 1枠1予約へ変更
--   既定値を 2 → 1 に変更し、既存の受付枠も 1 に揃える。
--   （1日の予約上限=2件・予約間の休憩=1時間 はアプリ側で制御するため
--    このマイグレーションはスキーマの既定値のみを変更する）
-- ============================================================

ALTER TABLE available_slots ALTER COLUMN max_bookings SET DEFAULT 1;

UPDATE available_slots SET max_bookings = 1 WHERE max_bookings <> 1;
