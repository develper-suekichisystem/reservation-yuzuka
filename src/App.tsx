import { useState } from 'react';
import { useLoading } from './contexts/LoadingContext';
import { useLiff } from './hooks/useLiff';
import { StepIndicator } from './components/StepIndicator';
import { MenuSelect } from './components/MenuSelect';
import { CalendarPicker } from './components/CalendarPicker';
import { TimePicker } from './components/TimePicker';
import { LocationPicker } from './components/LocationPicker';
import { ReservationForm } from './components/ReservationForm';
import { Confirmation } from './components/Confirmation';
import { Complete } from './components/Complete';
import { AdminPage } from './components/admin/AdminPage';
import { LoadingSpinner } from './components/LoadingSpinner';
import { supabase } from './lib/supabase';
import type { Step, ReservationState, Menu, Location } from './types/index';

const MAX_BOOKINGS = 2;

const INITIAL_STATE: ReservationState = {
  selectedMenu: null,
  selectedDate: null,
  selectedTime: null,
  selectedLocation: null,
  isOnline: false,
  phone: '',
  referrerName: '',
};

function ReservationApp() {
  const { isReady, isLoggedIn, userId, displayName, pictureUrl, error } = useLiff();
  const [step, setStep] = useState<Step>('menu');
  const [state, setState] = useState<ReservationState>(INITIAL_STATE);
  const [isFirstVisit, setIsFirstVisit] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [completedId, setCompletedId] = useState('');
  const { withLoading } = useLoading();

  if (!isReady || (!isLoggedIn && !error)) return <LoadingSpinner />;
  if (error)   return <div className="error-screen">エラー: {error}</div>;
  if (!userId) return <LoadingSpinner />;

  const name = displayName ?? 'ゲスト';

  function update(updates: Partial<ReservationState>) {
    setState(prev => ({ ...prev, ...updates }));
  }

  async function handleMenuSelect(menu: Menu) {
    update({ selectedMenu: menu });
    await withLoading(async () => {
      const { data } = await supabase
        .from('users')
        .select('is_first_visit')
        .eq('line_user_id', userId)
        .maybeSingle();
      setIsFirstVisit(data ? (data.is_first_visit as boolean) : true);
    });
    setStep('calendar');
  }

  function handleLocationSelect(location: Location | null, isOnline: boolean) {
    update({ selectedLocation: location, isOnline });
    setStep(isFirstVisit ? 'form' : 'confirm');
  }

  async function handleConfirm() {
    if (!state.selectedMenu || !state.selectedDate || !state.selectedTime) return;
    const menu = state.selectedMenu;
    const date = state.selectedDate;
    const time = state.selectedTime;
    setSubmitting(true);

    await withLoading(async () => { try {
      // ユーザーのupsert
      const upsertPayload: Record<string, unknown> = { line_user_id: userId, name };
      if (isFirstVisit && state.phone.trim()) {
        upsertPayload.phone = state.phone.trim();
      }

      const { data: user, error: ue } = await supabase
        .from('users')
        .upsert(upsertPayload, { onConflict: 'line_user_id' })
        .select()
        .single();
      if (ue || !user) throw new Error('ユーザー登録に失敗しました');

      // 予約枠の空き確認（最大2件）
      const providerMinutes = menu.provider_duration_minutes ?? menu.duration_minutes;
      const slotsNeeded = Math.ceil(providerMinutes / 60);
      const startHour = parseInt(time.slice(0, 2));
      const neededTimes = Array.from({ length: slotsNeeded }, (_, i) =>
        `${String(startHour + i).padStart(2, '0')}:00`
      );

      const { data: existingReservations } = await supabase
        .from('reservations')
        .select('time, menu:menus(provider_duration_minutes, duration_minutes)')
        .eq('date', date)
        .eq('status', 'confirmed');

      // 各時間スロットの予約数を集計
      const occupancy = new Map<string, number>();
      (existingReservations ?? []).forEach((r: any) => {
        const rStartH = parseInt((r.time as string).slice(0, 2));
        const rDuration = r.menu?.provider_duration_minutes ?? r.menu?.duration_minutes ?? 90;
        const rSlots = Math.ceil(rDuration / 60);
        for (let i = 0; i < rSlots; i++) {
          const t = `${String(rStartH + i).padStart(2, '0')}:00`;
          occupancy.set(t, (occupancy.get(t) ?? 0) + 1);
        }
      });

      const isFull = neededTimes.some(t => (occupancy.get(t) ?? 0) >= MAX_BOOKINGS);
      if (isFull) throw new Error('この時間はすでに満枠です。別の時間をお選びください。');

      const { data: reservation, error: re } = await supabase
        .from('reservations')
        .insert({
          user_id: user.id,
          menu_id: menu.id,
          location_id: state.selectedLocation?.id ?? null,
          is_online: state.isOnline,
          date,
          time,
          referrer_name: state.referrerName || null,
        })
        .select()
        .single();
      if (re || !reservation) throw new Error('予約の作成に失敗しました');

      if (isFirstVisit) {
        await supabase
          .from('users')
          .update({ is_first_visit: false })
          .eq('line_user_id', userId);
      }

      const locationName = state.isOnline
        ? 'オンライン（Zoom）'
        : state.selectedLocation?.name ?? '';

      fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userName: name,
          menuName: menu.name,
          date,
          time,
          customerDurationMinutes: menu.customer_duration_minutes ?? menu.duration_minutes,
          reservationId: reservation.id,
          isOnline: state.isOnline,
          locationName,
        }),
      }).catch(console.error);

      setCompletedId(reservation.id as string);
      setStep('complete');
    } catch (err) {
      alert(err instanceof Error ? err.message : '予約に失敗しました');
    } finally {
      setSubmitting(false);
    } });
  }

  const backFromConfirm = () => setStep(isFirstVisit ? 'form' : 'location');

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">✦ yuzunokaori ✦</h1>
        <p className="app-subtitle">直感カウンセラー 渡邉柚香</p>
      </header>

      {step !== 'complete' && <StepIndicator currentStep={step} />}

      <main className="app-main">
        {step === 'menu' && (
          <MenuSelect onSelect={handleMenuSelect} />
        )}
        {step === 'calendar' && (
          <CalendarPicker
            onSelect={date => { update({ selectedDate: date }); setStep('time'); }}
            onBack={() => setStep('menu')}
          />
        )}
        {step === 'time' && state.selectedDate && state.selectedMenu && (
          <TimePicker
            date={state.selectedDate}
            selectedMenu={state.selectedMenu}
            onSelect={time => { update({ selectedTime: time }); setStep('location'); }}
            onBack={() => setStep('calendar')}
          />
        )}
        {step === 'location' && (
          <LocationPicker
            onSelect={handleLocationSelect}
            onBack={() => setStep('time')}
          />
        )}
        {step === 'form' && (
          <ReservationForm
            state={state}
            isFirstVisit={isFirstVisit}
            displayName={name}
            pictureUrl={pictureUrl}
            onChange={update}
            onNext={() => setStep('confirm')}
            onBack={() => setStep('location')}
          />
        )}
        {step === 'confirm' && (
          <Confirmation
            state={state}
            displayName={name}
            pictureUrl={pictureUrl}
            isFirstVisit={isFirstVisit}
            onConfirm={handleConfirm}
            onBack={backFromConfirm}
            submitting={submitting}
          />
        )}
        {step === 'complete' && (
          <Complete
            reservationId={completedId}
            onNewReservation={() => { setState(INITIAL_STATE); setStep('menu'); setCompletedId(''); }}
          />
        )}
      </main>
    </div>
  );
}

export default function App() {
  if (window.location.hash === '#admin') return <AdminPage />;
  return <ReservationApp />;
}
