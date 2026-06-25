import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useLoading } from '../contexts/LoadingContext';
import type { Location } from '../types';

interface Props {
  onSelect: (location: Location | null, isOnline: boolean) => void;
  onBack: () => void;
}

type Mode = 'none' | 'online' | 'offline';

export function LocationPicker({ onSelect, onBack }: Props) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [mode, setMode] = useState<Mode>('none');
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const { withLoading } = useLoading();

  useEffect(() => {
    withLoading(async () => {
      const { data } = await supabase
        .from('locations')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')
        .order('name');
      if (data) setLocations(data as Location[]);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleModeChange(m: Mode) {
    setMode(m);
    setSelectedLocationId('');
  }

  const canProceed =
    mode === 'online' ||
    (mode === 'offline' && selectedLocationId !== '');

  function handleNext() {
    if (!canProceed) return;
    if (mode === 'online') {
      onSelect(null, true);
    } else {
      const loc = locations.find(l => l.id === selectedLocationId) ?? null;
      onSelect(loc, false);
    }
  }

  return (
    <div className="location-picker">
      <h2 className="section-title">鑑定方法を選択</h2>

      <div className="online-offline-toggle">
        <button
          className={`toggle-btn${mode === 'online' ? ' selected-online' : ''}`}
          onClick={() => handleModeChange('online')}
        >
          <span className="toggle-icon">💻</span>
          オンライン
        </button>
        <button
          className={`toggle-btn${mode === 'offline' ? ' selected-offline' : ''}`}
          onClick={() => handleModeChange('offline')}
        >
          <span className="toggle-icon">🌸</span>
          対面
        </button>
      </div>

      {mode === 'online' && (
        <p className="form-note">
          ZoomのURLは予約確定後にLINEでお送りします。
        </p>
      )}

      {mode === 'offline' && (
        <>
          <p className="location-hint">ご希望の場所をお選びください</p>
          <div className="location-list">
            {locations.map(loc => (
              <button
                key={loc.id}
                className={`location-card${selectedLocationId === loc.id ? ' selected' : ''}`}
                onClick={() => setSelectedLocationId(loc.id)}
              >
                <span className="location-name">{loc.name}</span>
                <span className="location-address">{loc.address}</span>
              </button>
            ))}
          </div>
        </>
      )}

      <div className="btn-group">
        <button className="btn-next" onClick={handleNext} disabled={!canProceed}>
          次へ
        </button>
        <button className="btn-back" onClick={onBack}>← 戻る</button>
      </div>
    </div>
  );
}
