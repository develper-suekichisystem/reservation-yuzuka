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

// ひまわり型（花芯のまわりに花びら／茎／左右の葉）— 色は従来のピンク系のまま
const d2r = (d: number) => (d * Math.PI) / 180;
const HEAD_CX = 50;
const HEAD_CY = 30;      // 花の中心
const PETAL_N = 20;      // 花びらの枚数
const PETAL_RING = 14;   // 花びらリングの半径（中心→花びら中心）
const PETAL_RY = 7;      // 花びらの長さ（半径）
const PETAL_RX = 4.2;    // 花びらの幅（半径・丸みを出す）

// 中心から角度 a(度) の向きに1枚の花びらを描く
function petal(a: number, ring: number, rx: number, ry: number, key: string) {
  const cx = HEAD_CX + ring * Math.cos(d2r(a));
  const cy = HEAD_CY + ring * Math.sin(d2r(a));
  return (
    <ellipse key={key} cx={cx} cy={cy} rx={rx} ry={ry}
      transform={`rotate(${a + 90} ${cx} ${cy})`} />
  );
}

function StarSvg() {
  return (
    <svg viewBox="0 0 100 100" className="crystal-vessel-svg" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="starGrad" cx="50%" cy="30%" r="72%">
          <stop offset="0%" stopColor="#fef3a0" />
          <stop offset="55%" stopColor="#f5c0d0" />
          <stop offset="100%" stopColor="#e07898" />
        </radialGradient>
      </defs>

      {/* 茎（緑ではなく従来のグラデで統一） */}
      <path d="M48.6 44 h2.8 l-0.7 42 h-1.4 z" fill="url(#starGrad)" opacity="0.9" />

      {/* 左右の葉（細めの葉っぱ） */}
      <g fill="url(#starGrad)" opacity="0.85">
        <ellipse cx="38" cy="64" rx="11" ry="4.5" transform="rotate(-28 38 64)" />
        <ellipse cx="62" cy="70" rx="11" ry="4.5" transform="rotate(28 62 70)" />
      </g>

      <g fill="url(#starGrad)" opacity="0.95">
        {/* 花びら（外周） */}
        {Array.from({ length: PETAL_N }, (_, i) =>
          petal((360 / PETAL_N) * i, PETAL_RING, PETAL_RX, PETAL_RY, `po${i}`))}
        {/* 花びら（内側・すき間を埋める） */}
        {Array.from({ length: PETAL_N }, (_, i) =>
          petal((360 / PETAL_N) * i + 360 / PETAL_N / 2, PETAL_RING - 2.5, PETAL_RX - 0.6, PETAL_RY - 1.5, `pi${i}`))}
      </g>

      {/* 花芯 */}
      <circle cx={HEAD_CX} cy={HEAD_CY} r="8.5" fill="url(#starGrad)" />
      <circle cx={HEAD_CX} cy={HEAD_CY} r="8.5" fill="rgba(180,70,110,0.25)" />

      {/* やわらかな光 */}
      <circle cx="47" cy="27" r="3" fill="rgba(255,255,255,0.45)" />
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
        <div className="fairy-stage">
          <StarSvg />
          {/* 花のまわりを行き来する1匹の妖精 */}
          <div className="fairy-flit">
            <div className="fairy">
              <span className="fairy-wing fairy-wing-l" />
              <span className="fairy-wing fairy-wing-r" />
              <span className="fairy-body" />
              <span className="fairy-dust fairy-dust-1">･</span>
              <span className="fairy-dust fairy-dust-2">✦</span>
              <span className="fairy-dust fairy-dust-3">･</span>
            </div>
          </div>
        </div>
      </div>
      <p className="loading-text">✦ 準備しています... ✦</p>
    </div>
  );
}
