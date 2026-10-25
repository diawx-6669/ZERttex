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
      },
      fontFamily: {
        display: ['Archivo', '"PingFang SC"', '"Microsoft YaHei"', 'system-ui', 'sans-serif'],
        sans: ['"Instrument Sans"', '"PingFang SC"', '"Microsoft YaHei"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: { xl2: '1.25rem' },
      boxShadow: {
        card: '0 1px 2px rgb(var(--ink) / 0.04), 0 8px 24px -12px rgb(var(--ink) / 0.12)',
      },
    },
  },
  plugins: [],
};
