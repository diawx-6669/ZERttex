import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { assertBudget } from './src/data/budget';

// Build-time guard: the build fails if the budget lines do not add up to BUDGET_CAP.
const budgetGuard = (): Plugin => ({
  name: 'budget-guard',
  buildStart() {
    assertBudget();
  },
});

// Single-file build: dist/index.html contains all JS and CSS inline,
// so the prototype opens by double-click or from any static host.
export default defineConfig({
  base: './',
  plugins: [budgetGuard(), react(), viteSingleFile()],
  build: { target: 'es2019', cssCodeSplit: false, assetsInlineLimit: 100_000_000, rollupOptions: { input: 'app.html' } },
});
