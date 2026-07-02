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
  // タンポポの妖精シルエット（上＝綿毛の頭、下＝タンポポのドレス）
  const headAngles = [0, 30, 60, 90, 120, 150];
  const skirtAngles = [-55, -35, -18, 0, 18, 35, 55];
  const deg2rad = (d: number) => (d * Math.PI) / 180;

  return (
    <svg viewBox="0 0 100 100" className="crystal-vessel-svg" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="starGrad" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#fef3a0" />
          <stop offset="55%" stopColor="#f5c0d0" />
          <stop offset="100%" stopColor="#e07898" />
        </radialGradient>
      </defs>

      <g fill="url(#starGrad)" opacity="0.94">
        {/* 頭（綿毛） */}
        {headAngles.map(a => (
          <ellipse key={`h${a}`} cx="50" cy="23" rx="14" ry="2.8"
            transform={`rotate(${a} 50 23)`} />
        ))}
        <circle cx="50" cy="23" r="7.5" />

        {/* 胴（茎） */}
        <path d="M47.4 33 h5.2 l-1.4 18 h-2.4 z" />

        {/* スカート（下向きのタンポポ） */}
        {skirtAngles.map(a => {
          const r = deg2rad(a);
          const cx = 50 + 13 * Math.sin(r);
          const cy = 50 + 13 * Math.cos(r);
          return (
            <ellipse key={`s${a}`} cx={cx} cy={cy} rx="2.7" ry="13"
              transform={`rotate(${a} ${cx} ${cy})`} />
          );
        })}
      </g>

      {/* やわらかな光 */}
      <circle cx="50" cy="21" r="4.5" fill="rgba(255,255,255,0.4)" />
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
