import { useId } from 'react';
import type { TourId } from '../data/types';

// Hand-drawn inline SVG destination scenes. No external images, works offline.

const useSafeId = () => useId().replace(/[^a-zA-Z0-9]/g, '');

type SceneProps = { id: TourId; className?: string; title?: string };

export function Scene({ id, className = '', title }: SceneProps) {
  const Comp = { charyn: Charyn, kolsai: Kolsai, turkestan: Turkestan, burabay: Burabay }[id];
  return <Comp className={className} title={title} />;
}

type P = { className?: string; title?: string };

const Svg = ({ className, title, children, vb = '0 0 400 320' }: P & { children: React.ReactNode; vb?: string }) => (
  <svg
    data-scene=""
    viewBox={vb}
    preserveAspectRatio="xMidYMid slice"
    className={'block h-full w-full ' + (className ?? '')}
    role={title ? 'img' : undefined}
    aria-label={title}
    aria-hidden={title ? undefined : true}
  >
    {children}
  </svg>
);

function Charyn({ className, title }: P) {
  const u = useSafeId();
  return (
    <Svg className={className} title={title}>
      <defs>
        <linearGradient id={`${u}sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7fb6d8" />
          <stop offset="0.6" stopColor="#f3d3a6" />
          <stop offset="1" stopColor="#f0b47a" />
        </linearGradient>
        <linearGradient id={`${u}w1`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d9744a" />
          <stop offset="1" stopColor="#8e3a24" />
        </linearGradient>
        <linearGradient id={`${u}w2`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c45a35" />
          <stop offset="1" stopColor="#6e2a1a" />
        </linearGradient>
        <linearGradient id={`${u}w3`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#a8452a" />
          <stop offset="1" stopColor="#4f1d12" />
        </linearGradient>
        <linearGradient id={`${u}riv`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5fd3c6" />
          <stop offset="1" stopColor="#138a86" />
        </linearGradient>
      </defs>
      <rect width="400" height="320" fill={`url(#${u}sky)`} />
      <circle cx="318" cy="70" r="22" fill="#fff4d6" opacity="0.9" />
      <path d="M0 150 Q100 136 200 146 T400 140 V200 H0Z" fill="#d9b48a" opacity="0.7" />
      <path d="M0 160 L40 120 L70 130 L95 100 L120 118 L150 96 L175 128 L190 150 L190 320 H0Z" fill={`url(#${u}w1)`} />
      <path d="M230 150 L250 110 L268 120 L290 88 L315 112 L340 96 L370 124 L400 112 V320 H230Z" fill={`url(#${u}w1)`} />
      <path d="M0 210 L30 170 L55 182 L80 150 L110 172 L140 160 L172 196 L180 320 H0Z" fill={`url(#${u}w2)`} />
      <path d="M250 200 L270 160 L300 176 L320 150 L352 172 L380 158 L400 172 V320 H240Z" fill={`url(#${u}w2)`} />
      <path d="M150 112 h8 v40 h-8z M300 100 h7 v30 h-7z" fill="#7a2f1d" opacity="0.6" />
      <path d="M0 270 L40 236 L90 250 L140 228 L168 260 L160 320 H0Z" fill={`url(#${u}w3)`} />
      <path d="M260 262 L300 236 L340 250 L380 230 L400 240 V320 H250Z" fill={`url(#${u}w3)`} />
      <path d="M200 320 C170 290 230 270 205 240 C188 220 222 200 210 170 L222 170 C236 200 202 222 220 244 C246 272 196 292 236 320Z" fill={`url(#${u}riv)`} />
      <path d="M208 250 q8 -4 14 0 M206 290 q10 -5 20 0" stroke="#d6fffa" strokeWidth="1.5" fill="none" opacity="0.7" />
    </Svg>
  );
}

function Kolsai({ className, title }: P) {
  const u = useSafeId();
  const tree = (x: number, y: number, s: number, c: string) => (
    <path
      key={`${x}-${y}`}
      d={`M${x} ${y - 46 * s} L${x + 12 * s} ${y - 22 * s} L${x + 6 * s} ${y - 22 * s} L${x + 16 * s} ${y} L${x - 16 * s} ${y} L${x - 6 * s} ${y - 22 * s} L${x - 12 * s} ${y - 22 * s}Z`}
      fill={c}
    />
  );
  return (
    <Svg className={className} title={title}>
      <defs>
        <linearGradient id={`${u}sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3f7fb8" />
          <stop offset="1" stopColor="#cfe6ef" />
        </linearGradient>
        <linearGradient id={`${u}mt`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7d8fa6" />
          <stop offset="1" stopColor="#4b5d75" />
        </linearGradient>
        <linearGradient id={`${u}lake`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2fc4b8" />
          <stop offset="1" stopColor="#0b6f78" />
        </linearGradient>
      </defs>
      <rect width="400" height="320" fill={`url(#${u}sky)`} />
      <path d="M0 170 L60 90 L95 120 L150 50 L205 118 L250 70 L310 130 L350 96 L400 140 V220 H0Z" fill={`url(#${u}mt)`} />
      <path d="M150 50 L170 74 L160 72 L150 82 L140 70 L132 74Z M250 70 L266 92 L256 88 L248 98 L240 88Z M60 90 L74 108 L64 106 L56 112 L50 104Z M350 96 L362 112 L352 110 L346 116 L340 108Z" fill="#f4f8fb" />
      <path d="M0 200 Q80 160 160 186 T320 176 T400 190 V240 H0Z" fill="#2f5a4a" />
      {[20, 52, 84, 300, 334, 368, 396].map((x, i) => tree(x, 226 - (i % 2) * 6, 0.9 + (i % 3) * 0.12, '#1d4436'))}
      <path d="M0 236 Q200 222 400 236 V320 H0Z" fill={`url(#${u}lake)`} />
      <path d="M40 250 h70 M150 262 h90 M270 252 h80 M90 286 h60 M230 296 h90" stroke="#c9fff7" strokeWidth="1.6" strokeLinecap="round" opacity="0.55" />
      <path d="M150 238 L170 262 L130 262Z M250 238 L266 258 L234 258Z" fill="#7d8fa6" opacity="0.25" />
      {[120, 150, 250, 278].map((x, i) => tree(x, 238, 0.7 + (i % 2) * 0.15, '#153a2d'))}
    </Svg>
  );
}

function Turkestan({ className, title }: P) {
  const u = useSafeId();
  return (
    <Svg className={className} title={title}>
      <defs>
        <linearGradient id={`${u}sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1b2550" />
          <stop offset="0.55" stopColor="#7a4a7a" />
          <stop offset="0.85" stopColor="#f08a5d" />
          <stop offset="1" stopColor="#f6c27a" />
        </linearGradient>
        <linearGradient id={`${u}dome`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5fe0d0" />
          <stop offset="1" stopColor="#127e86" />
        </linearGradient>
        <linearGradient id={`${u}wall`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e2b98a" />
          <stop offset="1" stopColor="#a87449" />
        </linearGradient>
        <linearGradient id={`${u}sand`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d9a065" />
          <stop offset="1" stopColor="#9a5c34" />
        </linearGradient>
      </defs>
      <rect width="400" height="320" fill={`url(#${u}sky)`} />
      {[[40, 30], [90, 60], [150, 24], [330, 40], [370, 80], [260, 20], [20, 90]].map(([x, y]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r="1.3" fill="#fff" opacity="0.8" />
      ))}
      <path d="M300 54 a14 14 0 1 0 10 24 a11 11 0 1 1 -10 -24z" fill="#fbe7b5" opacity="0.9" />
      <path d="M0 236 Q100 218 200 230 T400 226 V320 H0Z" fill={`url(#${u}sand)`} />
      {/* main portal (pishtaq) */}
      <rect x="110" y="128" width="84" height="112" fill={`url(#${u}wall)`} />
      <path d="M128 240 V170 a24 24 0 0 1 48 0 V240Z" fill="#6b3f26" />
      <path d="M134 240 V174 a18 18 0 0 1 36 0 V240Z" fill="#3a2418" />
      <rect x="110" y="128" width="84" height="8" fill="#2aa79d" />
      <rect x="104" y="140" width="10" height="100" fill="#c99467" />
      <rect x="190" y="140" width="10" height="100" fill="#c99467" />
      {/* main hall and ribbed dome */}
      <rect x="194" y="160" width="120" height="80" fill={`url(#${u}wall)`} />
      <rect x="226" y="144" width="56" height="18" fill="#c99467" />
      <path d="M222 146 C222 96 286 96 286 146Z" fill={`url(#${u}dome)`} />
      <path d="M236 146 C236 112 254 104 254 104 M254 104 C254 104 272 112 272 146 M246 146 C246 116 254 104 254 104 M262 146 C262 116 254 104 254 104" stroke="#0d5f66" strokeWidth="1.2" fill="none" opacity="0.6" />
      <path d="M254 104 v-14" stroke="#e8c26a" strokeWidth="2" />
      <circle cx="254" cy="88" r="3" fill="#e8c26a" />
      <path d="M296 176 C296 152 326 152 326 176Z" fill={`url(#${u}dome)`} opacity="0.9" />
      <rect x="292" y="176" width="38" height="64" fill="#c99467" />
      {[206, 230, 254, 278].map((x) => (
        <path key={x} d={`M${x} 236 V206 a7 7 0 0 1 14 0 V236Z`} fill="#6b3f26" />
      ))}
      <rect x="194" y="160" width="120" height="5" fill="#2aa79d" />
      <path d="M0 270 Q120 250 240 268 T400 262 V320 H0Z" fill="#7d4728" opacity="0.6" />
      <path d="M40 250 l6 -18 l6 18 M60 254 l5 -14 l5 14" stroke="#4d2c1a" strokeWidth="2" fill="none" />
    </Svg>
  );
}

function Burabay({ className, title }: P) {
  const u = useSafeId();
  const pine = (x: number, y: number, s: number) => (
    <g key={`${x}-${y}`}>
      <rect x={x - 1.5 * s} y={y - 10 * s} width={3 * s} height={10 * s} fill="#4a3424" />
      <ellipse cx={x} cy={y - 26 * s} rx={10 * s} ry={20 * s} fill="#24503b" />
      <ellipse cx={x + 3 * s} cy={y - 32 * s} rx={6 * s} ry={11 * s} fill="#2f6449" />
    </g>
  );
  return (
    <Svg className={className} title={title}>
      <defs>
        <linearGradient id={`${u}sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8cc4e6" />
          <stop offset="1" stopColor="#eaf3ef" />
        </linearGradient>
        <linearGradient id={`${u}rock`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#c9c2b6" />
          <stop offset="1" stopColor="#7e7568" />
        </linearGradient>
        <linearGradient id={`${u}lake`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#48a9c9" />
          <stop offset="1" stopColor="#14607a" />
        </linearGradient>
      </defs>
      <rect width="400" height="320" fill={`url(#${u}sky)`} />
      <path d="M0 180 Q60 150 120 166 T260 158 T400 168 V230 H0Z" fill="#5f8a6c" opacity="0.7" />
      {/* Okzhetpes-like stacked granite */}
      <path d="M232 214 C226 180 236 150 252 134 C262 110 290 108 296 132 C312 148 318 182 310 214Z" fill={`url(#${u}rock)`} />
      <path d="M252 134 C258 120 282 116 290 132 C278 126 262 128 252 134Z" fill="#e3ddd2" />
      <path d="M262 160 q14 -6 26 2 M258 186 q18 -8 40 0" stroke="#6b6357" strokeWidth="1.5" fill="none" opacity="0.6" />
      <path d="M60 214 C56 190 74 172 96 178 C114 168 136 182 134 214Z" fill={`url(#${u}rock)`} />
      <path d="M150 214 C152 196 168 188 182 194 C196 190 206 204 204 214Z" fill={`url(#${u}rock)`} opacity="0.9" />
      {[20, 40, 150, 176, 214, 330, 352, 376].map((x, i) => pine(x, 222, 0.9 + (i % 3) * 0.15))}
      <path d="M0 222 Q200 210 400 222 V320 H0Z" fill={`url(#${u}lake)`} />
      {/* Zhumbaktas-like rock in the water */}
      <path d="M170 262 C166 244 176 230 188 232 C200 230 208 246 204 262Z" fill="#9b9283" />
      <path d="M160 264 h56" stroke="#cdeef7" strokeWidth="2" opacity="0.6" />
      <path d="M232 228 C240 250 302 250 310 228" fill="#7e7568" opacity="0.25" />
      <path d="M30 252 h80 M240 270 h100 M80 292 h90 M260 300 h60" stroke="#cdeef7" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    </Svg>
  );
}

/** Wide homepage hero: steppe, mountains, a lake and a distant dome under a gold sun. */
export function HeroLandscape({ className = '' }: { className?: string }) {
  const u = useSafeId();
  return (
    <svg viewBox="0 0 1200 520" preserveAspectRatio="xMidYMax slice" className={'block h-full w-full ' + className} aria-hidden>
      <defs>
        <linearGradient id={`${u}sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#12213f" />
          <stop offset="0.5" stopColor="#2e4a78" />
          <stop offset="0.8" stopColor="#c98a5c" />
          <stop offset="1" stopColor="#f2c58a" />
        </linearGradient>
        <radialGradient id={`${u}sun`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffe3a3" />
          <stop offset="1" stopColor="#ffe3a3" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${u}far`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5a6f95" />
          <stop offset="1" stopColor="#3b4f74" />
        </linearGradient>
        <linearGradient id={`${u}mid`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a65a3a" />
          <stop offset="1" stopColor="#6a3021" />
        </linearGradient>
        <linearGradient id={`${u}steppe`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c9a46a" />
          <stop offset="1" stopColor="#8a6a3e" />
        </linearGradient>
        <linearGradient id={`${u}lake`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3fd0c2" />
          <stop offset="1" stopColor="#0d6b72" />
        </linearGradient>
      </defs>
      <rect width="1200" height="520" fill={`url(#${u}sky)`} />
      <circle cx="860" cy="250" r="160" fill={`url(#${u}sun)`} opacity="0.7" />
      <circle cx="860" cy="250" r="46" fill="#ffd98c" />
      {[[120, 60], [260, 110], [420, 40], [640, 80], [980, 50], [1100, 120], [760, 30]].map(([x, y]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r="1.6" fill="#fff" opacity="0.7" />
      ))}
      <g className="drift">
        <path d="M-40 330 L80 220 L150 260 L260 150 L370 250 L440 200 L540 290 L1240 320 V400 H-40Z" fill={`url(#${u}far)`} />
        <path d="M260 150 L292 190 L276 186 L262 200 L246 184 L232 190Z M80 220 L102 246 L88 242 L76 252 L66 242Z" fill="#eef3f8" opacity="0.95" />
      </g>
      {/* distant Silk Road dome */}
      <g transform="translate(980 300)" opacity="0.85">
        <rect x="-30" y="0" width="60" height="34" fill="#2b2a44" />
        <path d="M-20 0 C-20 -34 20 -34 20 0Z" fill="#2c8f8f" />
        <path d="M0 -26 v-12" stroke="#e8c26a" strokeWidth="2" />
        <rect x="-44" y="6" width="10" height="28" fill="#2b2a44" />
      </g>
      <path d="M560 380 L620 300 L660 320 L700 270 L760 330 L800 310 L840 360 L860 400 H560Z" fill={`url(#${u}mid)`} />
      <path d="M0 360 Q300 320 600 350 T1200 340 V520 H0Z" fill={`url(#${u}steppe)`} />
      <path d="M80 420 Q260 396 460 412 Q560 420 520 446 Q380 476 160 462 Q40 450 80 420Z" fill={`url(#${u}lake)`} />
      <path d="M140 430 h120 M300 440 h110 M200 452 h80" stroke="#d6fffa" strokeWidth="2" strokeLinecap="round" opacity="0.55" />
      <path d="M0 470 Q300 440 600 466 T1200 456 V520 H0Z" fill="#6e5230" />
      <path d="M700 460 q60 -20 120 -4 q50 10 100 0" stroke="#e1c48c" strokeWidth="3" fill="none" strokeDasharray="10 12" opacity="0.7" />
    </svg>
  );
}
