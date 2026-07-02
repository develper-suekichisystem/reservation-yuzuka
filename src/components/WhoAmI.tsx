import { useState } from 'react';
import { useLiff } from '../hooks/useLiff';
import { LoadingSpinner } from './LoadingSpinner';

export function WhoAmI() {
  const { isReady, isLoggedIn, userId, displayName, error } = useLiff();
  const [copied, setCopied] = useState(false);

  if (!isReady || (!isLoggedIn && !error)) return <LoadingSpinner />;
  if (error) return <div className="error-screen">エラー: {error}</div>;

  async function copyId() {
    try {
      await navigator.clipboard.writeText(userId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // クリップボード不可の環境では手動選択してもらう
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">✦ userId 確認 ✦</h1>
        <p className="app-subtitle">LINE userId 取得ページ</p>
      </header>

      <main className="app-main">
        <h2 className="section-title">あなたの LINE userId</h2>

        {userId ? (
          <>
            <div className="line-profile-card">
              <div className="line-avatar-placeholder">
                {(displayName || '?').slice(0, 1)}
              </div>
              <div className="line-profile-info">
                <p className="line-profile-label">表示名</p>
                <p className="line-profile-name">{displayName || '(不明)'}</p>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">userId</label>
              <input className="form-input" type="text" value={userId} readOnly onFocus={e => e.target.select()} />
              <p className="form-note">
                この値を <code>ADMIN_LINE_USER_ID</code> として Vercel の環境変数に設定してください。
              </p>
            </div>

            <div className="btn-group">
              <button className="btn-next" onClick={copyId}>
                {copied ? '✓ コピーしました' : 'userId をコピー'}
              </button>
            </div>
          </>
        ) : (
          <p className="schedule-empty">
            userId を取得できませんでした。<br />
            LINEアプリ内（LIFF）で開いているかご確認ください。
          </p>
        )}
      </main>
    </div>
  );
}
