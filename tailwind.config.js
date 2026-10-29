/** @type {import('tailwindcss').Config} */
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: v('bg'),
        surface: v('surface'),
        surface2: v('surface-2'),
        ink: v('ink'),
        muted: v('muted'),
        line: v('line'),
        night: v('night'),
        nightInk: v('night-ink'),
        teal: v('teal'),
        tealInk: v('teal-ink'),
        gold: v('gold'),
        danger: v('danger'),
        ok: v('ok'),
        warn: v('warn'),
        sun: v('sun'),
        sunInk: v('sun-ink'),
        pink: v('pink'),
        edge: v('edge'),
      },
      fontFamily: {
        display: ['Inter', '"PingFang SC"', '"Hiragino Sans GB"', '"Microsoft YaHei"', '"Noto Sans CJK SC"', 'system-ui', 'sans-serif'],
        sans: ['Inter', '"PingFang SC"', '"Hiragino Sans GB"', '"Microsoft YaHei"', '"Noto Sans CJK SC"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: { xl2: '1.25rem' },
      boxShadow: {
        card: '4px 4px 0 0 rgb(var(--shadow))',
        hard: '4px 4px 0 0 rgb(var(--shadow))',
        'hard-sm': '2px 2px 0 0 rgb(var(--shadow))',
        'hard-lg': '8px 8px 0 0 rgb(var(--shadow))',
      },
    },
  },
  plugins: [],
};
