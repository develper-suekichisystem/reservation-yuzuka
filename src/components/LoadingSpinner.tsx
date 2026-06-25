interface Props {
  variant?: 'full' | 'overlay';
}

const SPARKLES = [
  { top: '10%', left: '15%', delay: '0s',   size: '18px', char: '✦' },
  { top: '7%',  left: '70%', delay: '0.6s', size: '12px', char: '✧' },
  { top: '25%', left: '87%', delay: '1.0s', size: '16px', char: '★' },
  { top: '60%', left: '5%',  delay: '0.3s', size: '14px', char: '✦' },
  { top: '75%', left: '80%', delay: '0.8s', size: '12px', char: '✧' },
  { top: '45%', left: '3%',  delay: '1.3s', size: '10px', char: '★' },
  { top: '20%', left: '48%', delay: '1.6s', size: '14px', char: '✦' },
];

function StarSvg() {
  return (
    <svg viewBox="0 0 100 100" className="crystal-vessel-svg" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="starGrad" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#fef3a0" />
          <stop offset="50%" stopColor="#f5c0d0" />
          <stop offset="100%" stopColor="#e07898" />
        </radialGradient>
      </defs>
      <polygon
        points="50,8 61,35 90,35 68,54 76,82 50,64 24,82 32,54 10,35 39,35"
        fill="url(#starGrad)"
        opacity="0.92"
      />
      <circle cx="50" cy="44" r="12" fill="rgba(255,255,255,0.35)" />
    </svg>
  );
}

export function LoadingSpinner({ variant = 'full' }: Props) {
  const isFull = variant === 'full';

  return (
    <div className={isFull ? 'spinner-overlay' : 'spinner-overlay-api'}>
      {isFull && SPARKLES.map((s, i) => (
        <div
          key={i}
          className="sparkle"
          style={{ top: s.top, left: s.left, animationDelay: s.delay, fontSize: s.size, color: i % 2 === 0 ? '#e07898' : '#c8a820' }}
        >
          {s.char}
        </div>
      ))}
      <div className="spinner-container">
        <StarSvg />
      </div>
      <p className="loading-text">✦ 準備しています... ✦</p>
    </div>
  );
}
