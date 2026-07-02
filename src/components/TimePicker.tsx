import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useLoading } from '../contexts/LoadingContext';
import type { Menu, AvailableSlot } from '../types/index';

interface Props {
  date: string;
  selectedMenu: Menu;
  onSelect: (time: string) => void;
  onBack: () => void;
}

const DAILY_MAX = 2;    // 1日に受け付ける予約の上限（1枠1予約）
const BREAK_HOURS = 1;  // 予約と予約の間に必ず空ける休憩（時間）

export function TimePicker({ date, selectedMenu, onSelect, onBack }: Props) {
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [blockedSet, setBlockedSet] = useState<Set<string>>(new Set());
  const [dayFull, setDayFull] = useState(false);
  const { withLoading } = useLoading();

  const providerMinutes = selectedMenu.provider_duration_minutes ?? selectedMenu.duration_minutes;
  const customerMinutes = selectedMenu.customer_duration_minutes ?? selectedMenu.duration_minutes;
  const slotsNeeded = Math.ceil(providerMinutes / 60);

  useEffect(() => {
    withLoading(async () => {
      const [{ data: slotData }, { data: reservData }] = await Promise.all([
        supabase
          .from('available_slots')
          .select('id, date, time, max_bookings')
          .eq('date', date)
          .order('time'),
        supabase
          .from('reservations')
          .select('time, menu:menus(provider_duration_minutes, duration_minutes)')
          .eq('date', date)
          .eq('status', 'confirmed'),
      ]);

      setSlots((slotData ?? []) as AvailableSlot[]);

      const reservations = reservData ?? [];
      // 1日の予約上限に達していたらこの日は全て×
      setDayFull(reservations.length >= DAILY_MAX);

      // 各予約の占有時間＋前後の休憩をブロック対象として集計
      const blocked = new Set<string>();
      reservations.forEach((r: any) => {
        const startH = parseInt((r.time as string).slice(0, 2));
        const rMenu = r.menu;
        const duration = rMenu?.provider_duration_minutes ?? rMenu?.duration_minutes ?? 90;
        const occupied = Math.ceil(duration / 60);
        for (let i = -BREAK_HOURS; i < occupied + BREAK_HOURS; i++) {
          blocked.add(`${String(startH + i).padStart(2, '0')}:00`);
        }
      });
      setBlockedSet(blocked);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const slotMap = new Map(slots.map(s => [s.time.slice(0, 5), s]));
  const availableTimes = slots.map(s => s.time.slice(0, 5));

  return (
    <div className="time-picker">
      <h2 className="section-title">時間を選択</h2>
      <p className="date-label">{date.replace(/-/g, '/')}</p>
      {availableTimes.length === 0 ? (
        <p className="schedule-empty">この日の受付可能な時間帯はありません</p>
      ) : (
        <div className="time-grid">
          {availableTimes.map(time => {
            const h = parseInt(time.slice(0, 2));

            // 鑑定枠（slotsNeeded時間分）すべてが開放済み・かつ休憩含めブロックされていないか確認
            const canBook = !dayFull && Array.from({ length: slotsNeeded }, (_, i) => {
              const t = `${String(h + i).padStart(2, '0')}:00`;
              return slotMap.has(t) && !blockedSet.has(t);
            }).every(Boolean);

            const endH = h + Math.ceil(customerMinutes / 60);

            return (
              <button
                key={time}
                className={`time-slot ${canBook ? 'available' : 'booked'}`}
                disabled={!canBook}
                onClick={() => onSelect(time)}
              >
                <span>{h}:00〜{endH}:00</span>
                <span className="slot-status">{canBook ? '○' : '×'}</span>
              </button>
            );
          })}
        </div>
      )}
      <button className="btn-back" onClick={onBack}>← 戻る</button>
    </div>
  );
}
