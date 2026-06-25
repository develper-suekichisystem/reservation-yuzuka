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

export function TimePicker({ date, selectedMenu, onSelect, onBack }: Props) {
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [occupancyMap, setOccupancyMap] = useState<Map<string, number>>(new Map());
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

      // 各1時間スロットの予約数を集計
      const occ = new Map<string, number>();
      (reservData ?? []).forEach((r: any) => {
        const startH = parseInt((r.time as string).slice(0, 2));
        const rMenu = r.menu;
        const duration = rMenu?.provider_duration_minutes ?? rMenu?.duration_minutes ?? 90;
        const occupied = Math.ceil(duration / 60);
        for (let i = 0; i < occupied; i++) {
          const t = `${String(startH + i).padStart(2, '0')}:00`;
          occ.set(t, (occ.get(t) ?? 0) + 1);
        }
      });
      setOccupancyMap(occ);
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
            const slotInfo = slotMap.get(time);
            const maxBookings = slotInfo?.max_bookings ?? 2;

            // slotsNeeded時間分すべてのスロットで空きがあるか確認
            const canBook = Array.from({ length: slotsNeeded }, (_, i) => {
              const t = `${String(h + i).padStart(2, '0')}:00`;
              const occupied = occupancyMap.get(t) ?? 0;
              return slotMap.has(t) && occupied < maxBookings;
            }).every(Boolean);

            const currentOccupancy = occupancyMap.get(time) ?? 0;
            const remaining = maxBookings - currentOccupancy;

            const endH = h + Math.ceil(customerMinutes / 60);

            return (
              <button
                key={time}
                className={`time-slot ${canBook ? 'available' : 'booked'}`}
                disabled={!canBook}
                onClick={() => onSelect(time)}
              >
                <span>{h}:00〜{endH}:00</span>
                <span>
                  {canBook ? (
                    <>
                      <span className="slot-status">○</span>
                      {remaining < maxBookings && (
                        <span className="slot-remaining">残り{remaining}枠</span>
                      )}
                    </>
                  ) : (
                    <span className="slot-status">×</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}
      <button className="btn-back" onClick={onBack}>← 戻る</button>
    </div>
  );
}
