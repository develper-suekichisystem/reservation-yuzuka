import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { MenuAdmin } from './MenuAdmin';
import { ScheduleAdmin } from './ScheduleAdmin';
import { LocationAdmin } from './LocationAdmin';
import { AdminLogin, isAdminAuthenticated } from './AdminLogin';
import type { Reservation } from '../../types/index';

type AdminTab = 'reservations' | 'menus' | 'schedule' | 'locations';

function ReservationAdmin() {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReservations();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth]);

  async function fetchReservations() {
    setLoading(true);
    const [year, month] = selectedMonth.split('-').map(Number);
    const startDate = `${selectedMonth}-01`;
    const nextMonth = month === 12 ? `${year + 1}-01` : `${year}-${String(month + 1).padStart(2, '0')}`;
    const endDate = `${nextMonth}-01`;
    const { data } = await supabase
      .from('reservations')
      .select('*, user:users(*), menu:menus(*), location:locations(*)')
      .gte('date', startDate)
      .lt('date', endDate)
      .eq('status', 'confirmed')
      .order('date')
      .order('time');
    if (data) setReservations(data as Reservation[]);
    setLoading(false);
  }

  function formatTimeRange(time: string, menu?: Reservation['menu']) {
    const start = time.slice(0, 5);
    const duration = menu?.customer_duration_minutes ?? menu?.duration_minutes;
    if (!duration) return start;
    const [h, m] = start.split(':').map(Number);
    const endTotal = h * 60 + m + duration;
    const endH = Math.floor(endTotal / 60) % 24;
    const endM = endTotal % 60;
    const end = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
    return `${start} 〜 ${end}`;
  }

  function formatDateHeading(date: string) {
    const d = new Date(`${date}T00:00:00`);
    const weekday = ['日', '月', '火', '水', '木', '金', '土'][d.getDay()];
    return `${d.getMonth() + 1}月${d.getDate()}日（${weekday}）`;
  }

  const grouped = reservations.reduce<Record<string, Reservation[]>>((acc, r) => {
    const date = r.date as string;
    (acc[date] ||= []).push(r);
    return acc;
  }, {});
  const dates = Object.keys(grouped).sort();

  async function cancelReservation(id: string) {
    if (!confirm('この予約をキャンセルしますか？')) return;
    await supabase.from('reservations').update({ status: 'cancelled' }).eq('id', id);
    fetchReservations();
  }

  return (
    <>
      <div className="admin-date-picker">
        <label>月：</label>
        <input
          type="month"
          value={selectedMonth}
          onChange={e => setSelectedMonth(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="loading">読み込み中...</div>
      ) : reservations.length === 0 ? (
        <p className="no-data">この月の予約はありません</p>
      ) : (
        dates.map(date => (
          <div key={date} className="admin-date-group">
            <h3 className="admin-date-heading">{formatDateHeading(date)}</h3>
            <div className="admin-list">
              {grouped[date].map(r => (
                <div key={r.id} className="admin-card">
                  <div className="admin-time">{formatTimeRange(r.time as string, r.menu)}</div>
                  <div className="admin-info">
                    <div className="admin-name">{r.user?.name}</div>
                    <div className="admin-menu">{r.menu?.name}</div>
                    <div className="admin-contact">
                      <span>{r.user?.phone}</span>
                    </div>
                    <div>
                      {r.is_online
                        ? <span className="admin-online-badge">💻 オンライン</span>
                        : <span className="admin-offline-badge">🌸 対面{r.location ? `：${r.location.name}` : ''}</span>
                      }
                    </div>
                    {r.referrer_name && (
                      <div className="admin-referrer">紹介者: {r.referrer_name}</div>
                    )}
                  </div>
                  <button className="btn-cancel" onClick={() => cancelReservation(r.id)}>
                    キャンセル
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </>
  );
}

export function AdminPage() {
  const [authed, setAuthed] = useState(isAdminAuthenticated());
  const [tab, setTab] = useState<AdminTab>('reservations');

  if (!authed) return <AdminLogin onLogin={() => setAuthed(true)} />;

  return (
    <div className="admin-page">
      <header className="app-header">
        <h1 className="app-title">yuzunokaori 管理画面</h1>
        <p className="app-subtitle">直感カウンセラー 柚香</p>
      </header>

      <div className="admin-tabs">
        <button
          className={`admin-tab${tab === 'reservations' ? ' active' : ''}`}
          onClick={() => setTab('reservations')}
        >
          予約一覧
        </button>
        <button
          className={`admin-tab${tab === 'menus' ? ' active' : ''}`}
          onClick={() => setTab('menus')}
        >
          メニュー
        </button>
        <button
          className={`admin-tab${tab === 'schedule' ? ' active' : ''}`}
          onClick={() => setTab('schedule')}
        >
          受付設定
        </button>
        <button
          className={`admin-tab${tab === 'locations' ? ' active' : ''}`}
          onClick={() => setTab('locations')}
        >
          場所管理
        </button>
      </div>

      <div className="admin-content">
        {tab === 'reservations' && <ReservationAdmin />}
        {tab === 'menus' && <MenuAdmin />}
        {tab === 'schedule' && <ScheduleAdmin />}
        {tab === 'locations' && <LocationAdmin />}
      </div>
    </div>
  );
}
