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

// タンポポの妖精シルエット（上＝綿毛の頭、下＝タンポポのドレス）
const d2r = (d: number) => (d * Math.PI) / 180;
const HEAD_ANGLES = [0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5];
const WX = 50;
const WY = 46;          // 腰（スカートの基点）
const SKIRT_N = 15;
const SKIRT_SPREAD = 100;
const SKIRT_RX = 28;
const SKIRT_RY = 26;

// 腰から (tx,ty) へ伸びる花びら（細い楕円）
function petalTo(tx: number, ty: number, w: number, key: string) {
  const dx = tx - WX;
  const dy = ty - WY;
  const dist = Math.hypot(dx, dy);
  const cx = (WX + tx) / 2;
  const cy = (WY + ty) / 2;
  const rot = (Math.atan2(dx, dy) * 180) / Math.PI;
  return (
    <ellipse key={key} cx={cx} cy={cy} rx={w} ry={dist / 2}
      transform={`rotate(${rot} ${cx} ${cy})`} />
  );
}

function StarSvg() {
  // スカートの外周（花びらの先端）
  const tips = Array.from({ length: SKIRT_N }, (_, i) => {
    const k = (i / (SKIRT_N - 1)) * 2 - 1;
    const ang = k * SKIRT_SPREAD;
    return [WX + SKIRT_RX * Math.sin(d2r(ang)), WY + SKIRT_RY * Math.cos(d2r(ang))] as const;
  });
  const skirtPoly =
    `54,46 ` + tips.map(t => `${t[0].toFixed(1)},${t[1].toFixed(1)}`).join(' ') + ` 46,46`;

  return (
    <svg viewBox="0 0 100 100" className="crystal-vessel-svg" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="starGrad" cx="50%" cy="26%" r="74%">
          <stop offset="0%" stopColor="#fef3a0" />
          <stop offset="55%" stopColor="#f5c0d0" />
          <stop offset="100%" stopColor="#e07898" />
        </radialGradient>
      </defs>

      <g fill="url(#starGrad)" opacity="0.95">
        {/* 頭（綿毛） */}
        {HEAD_ANGLES.map(a => (
          <ellipse key={`h${a}`} cx="50" cy="21" rx="13" ry="2.7"
            transform={`rotate(${a} 50 21)`} />
        ))}
        <circle cx="50" cy="21" r="7" />

        {/* 胴（茎） */}
        <path d="M47.8 30 h4.4 l-1.3 16 h-1.8 z" />

        {/* スカートの下地（花びらの隙間を埋めるドーム） */}
        <polygon points={skirtPoly} opacity="0.9" />

        {/* スカートの花びら（外側の長い列） */}
        {tips.map((t, i) => petalTo(t[0], t[1], 2.3, `so${i}`))}

        {/* スカートの花びら（内側の短い列で密度を出す） */}
        {Array.from({ length: SKIRT_N }, (_, i) => {
          const k = (i / (SKIRT_N - 1)) * 2 - 1;
          const ang = k * 90;
          const tx = WX + SKIRT_RX * 0.6 * Math.sin(d2r(ang));
          const ty = WY + SKIRT_RY * 0.6 * Math.cos(d2r(ang));
          return petalTo(tx, ty, 2.0, `si${i}`);
        })}
      </g>

      {/* やわらかな光 */}
      <circle cx="50" cy="19" r="4" fill="rgba(255,255,255,0.4)" />
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
