import type { ReservationState } from '../types/index';

interface Props {
  state: ReservationState;
  isFirstVisit: boolean;
  displayName: string;
  pictureUrl: string | null;
  onChange: (updates: Partial<ReservationState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function ReservationForm({
  state, isFirstVisit, displayName, pictureUrl, onChange, onNext, onBack,
}: Props) {
  const canProceed = !isFirstVisit || state.phone.trim() !== '';

  return (
    <div className="reservation-form">
      <h2 className="section-title">予約者情報</h2>

      <div className="line-profile-card">
        {pictureUrl ? (
          <img src={pictureUrl} alt={displayName} className="line-avatar" />
        ) : (
          <div className="line-avatar-placeholder">
            {displayName.slice(0, 1)}
          </div>
        )}
        <div className="line-profile-info">
          <p className="line-profile-label">LINEアカウント</p>
          <p className="line-profile-name">{displayName}</p>
        </div>
      </div>

      {isFirstVisit && (
        <>
          <div className="form-group">
            <label className="form-label">
              電話番号 <span className="required">*</span>
            </label>
            <p className="form-note">LINEで連絡がつかない場合のみ使用します</p>
            <input
              className="form-input"
              type="tel"
              placeholder="090-0000-0000"
              value={state.phone}
              onChange={e => onChange({ phone: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">紹介者名（任意）</label>
            <p className="form-note">紹介してくださった方のお名前をご入力ください</p>
            <input
              className="form-input"
              type="text"
              placeholder="紹介してくださった方のお名前"
              value={state.referrerName}
              onChange={e => onChange({ referrerName: e.target.value })}
            />
          </div>
        </>
      )}

      <div className="btn-group">
        <button className="btn-next" onClick={onNext} disabled={!canProceed}>
          確認へ進む
        </button>
        <button className="btn-back" onClick={onBack}>← 戻る</button>
      </div>
    </div>
  );
}
