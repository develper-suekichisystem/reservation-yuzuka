import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { AvailableSlot } from '../../types';

const HOURS = Array.from({ length: 14 }, (_, i) => i + 9); // 9時〜22時
const MONTH_NAMES = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
const DAY_NAMES = ['日','月','火','水','木','金','土'];

function formatDate(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

interface CalendarProps {
  selected: string;
  onSelect: (date: string) => void;
}

function InlineCalendar({ selected, onSelect }: CalendarProps) {
  const today = new Date();
  const todayStr = formatDate(today.getFullYear(), today.getMonth(), today.getDate());
  const [viewYear, setViewYear] = useState(
    selected ? parseInt(selected.slice(0, 4)) : today.getFullYear()
  );
  const [viewMonth, setViewMonth] = useState(
    selected ? parseInt(selected.slice(5, 7)) - 1 : today.getMonth()
  );

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const cells: (number | null)[] = [
    ...Array<null>(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  return (
    <div className="inline-calendar">
      <div className="calendar-nav">
        <button className="nav-btn" onClick={prevMonth}>◀</button>
        <span className="calendar-month">{viewYear}年 {MONTH_NAMES[viewMonth]}</span>
        <button className="nav-btn" onClick={nextMonth}>▶</button>
      </div>
      <div className="calendar-grid">
        {DAY_NAMES.map((d, i) => (
          <div key={d} className={`calendar-dow${i === 0 ? ' sunday' : i === 6 ? ' saturday' : ''}`}>{d}</div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;
          const dateStr = formatDate(viewYear, viewMonth, day);
          const isPast = dateStr < todayStr;
          const isSelected = dateStr === selected;
          const dow = new Date(viewYear, viewMonth, day).getDay();
          return (
            <button
              key={day}
              className={`calendar-day${isPast ? ' disabled' : ''}${isSelected ? ' selected' : ''}${dow === 0 ? ' sunday' : ''}`}
              disabled={isPast}
              onClick={() => onSelect(dateStr)}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

type Mode = 'list' | 'edit';

export function ScheduleAdmin() {
  const [mode, setMode] = useState<Mode>('list');
  const [allSlots, setAllSlots] = useState<AvailableSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const [editDate, setEditDate] = useState(today);
  const [selectedTimes, setSelectedTimes] = useState<Set<string>>(new Set());
  // 編集中の日が既に公開済みだったか（保存時に公開状態を保つ）
  const [editWasPublished, setEditWasPublished] = useState(false);

  useEffect(() => { fetchSlots(); }, []);

  async function fetchSlots() {
    setLoading(true);
    const { data } = await supabase
      .from('available_slots')
      .select('*')
      .gte('date', today)
      .order('date')
      .order('time');
    if (data) setAllSlots(data as AvailableSlot[]);
    setLoading(false);
  }

  async function handleDateSelect(date: string) {
    setEditDate(date);
    const { data } = await supabase
      .from('available_slots')
      .select('time, is_published')
      .eq('date', date);
    const rows = data ?? [];
    const times = new Set(rows.map(r => (r.time as string).slice(0, 5)));
    setSelectedTimes(times);
    // 1枠でも公開済みならこの日は公開扱い（保存時に維持）
    setEditWasPublished(rows.some(r => r.is_published as boolean));
  }

  function toggleTime(time: string) {
    setSelectedTimes(prev => {
      const next = new Set(prev);
      if (next.has(time)) next.delete(time);
      else next.add(time);
      return next;
    });
  }

  async function saveSlots() {
    setSaving(true);
    await supabase.from('available_slots').delete().eq('date', editDate);
    if (selectedTimes.size > 0) {
      const rows = [...selectedTimes].map(t => ({
        date: editDate,
        time: `${t}:00`,
        max_bookings: 1,
        is_published: editWasPublished, // 新規は下書き、公開済みの日は公開を維持
      }));
      await supabase.from('available_slots').insert(rows);
    }
    await fetchSlots();
    setSaving(false);
    setMode('list');
  }

  async function removeSlot(id: string) {
    await supabase.from('available_slots').delete().eq('id', id);
    await fetchSlots();
  }

  // 日単位の公開／非公開
  async function setDayPublished(date: string, publish: boolean) {
    await supabase
      .from('available_slots')
      .update({ is_published: publish })
      .eq('date', date);
    await fetchSlots();
  }

  // 月単位でまとめて公開
  async function setMonthPublished(ym: string, publish: boolean) {
    const label = publish ? '公開' : '非公開に';
    if (!window.confirm(`${ym.replace('-', '年')}月の予約枠をすべて${label}しますか？`)) return;
    const ids = (groupedByMonth[ym] ?? []).map(s => s.id);
    if (ids.length === 0) return;
    await supabase
      .from('available_slots')
      .update({ is_published: publish })
      .in('id', ids);
    await fetchSlots();
  }

  const groupedByMonth: Record<string, AvailableSlot[]> = {};
  for (const slot of allSlots) {
    const key = slot.date.slice(0, 7);
    if (!groupedByMonth[key]) groupedByMonth[key] = [];
    groupedByMonth[key].push(slot);
  }

  if (loading) return <div className="loading">読み込み中...</div>;

  if (mode === 'list') {
    return (
      <div className="schedule-admin">
        <div className="schedule-header-row">
          <button
            className="btn-primary"
            onClick={() => { setEditDate(today); setSelectedTimes(new Set()); setEditWasPublished(false); setMode('edit'); }}
          >
            ＋ 予約受付時間を設定する
          </button>
        </div>

        {Object.keys(groupedByMonth).length === 0 ? (
          <p className="schedule-empty">予約受付中の日時はありません</p>
        ) : (
          Object.entries(groupedByMonth).map(([ym, slots]) => {
            const [y, m] = ym.split('-');
            const hasDraft = slots.some(s => !s.is_published);
            return (
              <section key={ym} className="schedule-month-group">
                <div className="schedule-month-headrow">
                  <h3 className="schedule-month-heading">{y}年 {MONTH_NAMES[parseInt(m) - 1]}</h3>
                  {hasDraft ? (
                    <button className="btn-publish-month" onClick={() => setMonthPublished(ym, true)}>
                      この月をまとめて公開
                    </button>
                  ) : (
                    <button className="btn-unpublish-month" onClick={() => setMonthPublished(ym, false)}>
                      この月を非公開に戻す
                    </button>
                  )}
                </div>
                {Object.entries(
                  slots.reduce<Record<string, AvailableSlot[]>>((acc, s) => {
                    if (!acc[s.date]) acc[s.date] = [];
                    acc[s.date].push(s);
                    return acc;
                  }, {})
                ).map(([date, daySlots]) => {
                  const dayPublished = daySlots.every(s => s.is_published);
                  return (
                    <div key={date} className={`schedule-day-row${dayPublished ? '' : ' is-draft'}`}>
                      <div className="schedule-day-head">
                        <span className="schedule-day-label">
                          {date.replace(/-/g, '/')}（{DAY_NAMES[new Date(date).getDay()]}）
                        </span>
                        <span className={`publish-badge${dayPublished ? ' published' : ''}`}>
                          {dayPublished ? '公開中' : '下書き'}
                        </span>
                        <button
                          className={dayPublished ? 'btn-unpublish-day' : 'btn-publish-day'}
                          onClick={() => setDayPublished(date, !dayPublished)}
                        >
                          {dayPublished ? '非公開' : '公開する'}
                        </button>
                      </div>
                      <div className="schedule-time-chips">
                        {daySlots.map(s => (
                          <span key={s.id} className="schedule-chip">
                            {s.time.slice(0, 5)}
                            <button className="chip-remove" onClick={() => removeSlot(s.id)} title="削除">×</button>
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </section>
            );
          })
        )}
      </div>
    );
  }

  const fmt = (h: number) => `${String(h).padStart(2, '0')}:00`;

  return (
    <div className="schedule-admin">
      <button className="btn-back" onClick={() => setMode('list')}>← 一覧に戻る</button>
      <h3 className="schedule-heading">予約受付時間の設定</h3>
      <p className="schedule-desc">
        カレンダーで日付を選び、受付する時間帯をタップして保存してください。
        保存した枠は<strong>「下書き」</strong>として作成されます。一覧の<strong>「公開する」</strong>を押すと一般利用者に表示されます。
      </p>

      <InlineCalendar selected={editDate} onSelect={handleDateSelect} />

      {editDate && (
        <>
          <p className="edit-date-label">
            {editDate.replace(/-/g, '/')}（{DAY_NAMES[new Date(editDate).getDay()]}）の受付時間
          </p>
          <div className="time-toggle-grid">
            {HOURS.map(h => {
              const time = fmt(h);
              const on = selectedTimes.has(time);
              return (
                <button
                  key={h}
                  className={`time-toggle-btn${on ? ' on' : ''}`}
                  onClick={() => toggleTime(time)}
                >
                  {h}:00〜{h + 1}:00
                </button>
              );
            })}
          </div>
          <button className="btn-save" onClick={saveSlots} disabled={saving}>
            {saving ? '保存中...' : '保存する'}
          </button>
        </>
      )}
    </div>
  );
}
