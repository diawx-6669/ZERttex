// Small inline stroke icon set (no emoji, no external assets).
const paths: Record<string, string> = {
  arrow: 'M5 12h14M13 6l6 6-6 6',
  arrowLeft: 'M19 12H5M11 6l-6 6 6 6',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  x: 'M6 6l12 12M18 6L6 18',
  chevron: 'M9 6l6 6-6 6',
  chevronDown: 'M6 9l6 6 6-6',
  play: 'M8 5.5v13l11-6.5z',
  pause: 'M8 5v14M16 5v14',
  stop: 'M7 7h10v10H7z',
  globe: 'M12 3a9 9 0 100 18 9 9 0 000-18zM3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z',
  shield: 'M12 3l7.5 3v5.5c0 4.6-3.2 8.3-7.5 9.5-4.3-1.2-7.5-4.9-7.5-9.5V6z',
  shieldCheck: 'M12 3l7.5 3v5.5c0 4.6-3.2 8.3-7.5 9.5-4.3-1.2-7.5-4.9-7.5-9.5V6zM8.5 12l2.5 2.5 4.5-5',
  chat: 'M4 5h16v11H9l-5 4z',
  map: 'M9 4l-5 2v14l5-2 6 2 5-2V4l-5 2zM9 4v14M15 6v14',
  calendar: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  users: 'M9 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM2.5 20c.6-3.6 3.2-6 6.5-6s5.9 2.4 6.5 6M16 4.3a3.5 3.5 0 010 6.4M18 14.5c2 .8 3.2 2.8 3.5 5.5',
  card: 'M3 6h18v12H3zM3 10h18M7 15h4',
  phone: 'M6.5 3h3l1.5 4.5-2 1.5a12 12 0 006 6l1.5-2 4.5 1.5v3c0 1.1-.9 2-2 2C10.6 19.5 4.5 13.4 4.5 5c0-1.1.9-2 2-2z',
  video: 'M3 7h12v10H3zM15 10.5l6-3.5v10l-6-3.5',
  sun: 'M12 8a4 4 0 100 8 4 4 0 000-8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  rain: 'M7 15a4 4 0 01-.5-8A5.5 5.5 0 0117 8a3.5 3.5 0 01.5 7zM8 18l-1 2.5M12 18l-1 2.5M16 18l-1 2.5',
  road: 'M8 3L4 21M16 3l4 18M12 4v3M12 10v3M12 16v3',
  snow: 'M12 2v20M4 6.5l16 11M20 6.5l-16 11M9 3.5l3 2.5 3-2.5M9 20.5l3-2.5 3 2.5',
  copy: 'M8 8h12v12H8zM4 16V4h12',
  upload: 'M12 16V4M7 9l5-5 5 5M4 16v4h16v-4',
  menu: 'M4 7h16M4 12h16M4 17h16',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  compass: 'M12 3a9 9 0 100 18 9 9 0 000-18zM15.5 8.5l-2 5-5 2 2-5z',
  clock: 'M12 3a9 9 0 100 18 9 9 0 000-18zM12 7v5l3 2',
  volume: 'M4 9h4l5-4v14l-5-4H4zM16.5 8.5a5 5 0 010 7M19 6a8.5 8.5 0 010 12',
  info: 'M12 3a9 9 0 100 18 9 9 0 000-18zM12 11v6M12 7.5v.5',
  alert: 'M12 3l9.5 17h-19zM12 10v4.5M12 17.5v.5',
  heart: 'M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0112 7.3 4.3 4.3 0 0119.5 10c0 5.4-7.5 10-7.5 10z',
  share: 'M18 8a3 3 0 100-6 3 3 0 000 6zM6 15a3 3 0 100-6 3 3 0 000 6zM18 22a3 3 0 100-6 3 3 0 000 6zM8.6 13.5l6.8 4M15.4 6.5l-6.8 4',
  sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z',
  route: 'M6 19a2 2 0 100-4 2 2 0 000 4zM18 9a2 2 0 100-4 2 2 0 000 4zM6 15V9a3 3 0 013-3h3M18 9v6a3 3 0 01-3 3h-3',
  pin: 'M12 21s-6.5-6-6.5-11a6.5 6.5 0 0113 0c0 5-6.5 11-6.5 11zM12 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z',
  lock: 'M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 017 0v3',
  bag: 'M5 8h14l-1 12H6zM9 8V6a3 3 0 016 0v2',
  mail: 'M3 6h18v12H3zM3 7l9 6 9-6',
  image: 'M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M15.5 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z',
  refresh: 'M20 11a8 8 0 00-14.3-4.9L4 8M4 4v4h4M4 13a8 8 0 0014.3 4.9L20 16M20 20v-4h-4',
  text: 'M4 7V5h16v2M9 19h6M12 5v14',
  chart: 'M4 20V4M4 20h16M8 16l4-5 3 3 5-7',
  flag: 'M5 21V4M5 4h11l-2 4 2 4H5',
};

export type IconName = keyof typeof paths;

export function Icon({ name, size = 18, className = '', title }: { name: IconName; size?: number; className?: string; title?: string }) {
  const filled = name === 'play';
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={'shrink-0 ' + className}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
    >
      {title && <title>{title}</title>}
      <path d={paths[name]} />
    </svg>
  );
}
