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
        display: ['"Bricolage Grotesque"', '"PingFang SC"', '"Microsoft YaHei"', 'system-ui', 'sans-serif'],
        sans: ['Figtree', '"PingFang SC"', '"Microsoft YaHei"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: { xl2: '1.25rem' },
      boxShadow: {
        card: '0 1px 0 rgb(var(--line) / 0.6), 0 12px 32px -18px rgb(var(--night) / 0.35)',
      },
    },
  },
  plugins: [],
};
