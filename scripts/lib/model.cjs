// Loads the ONE money config (src/data/budget.ts) and the payback model
// (src/lib/paybackModel.ts) into Node scripts, so documents never carry
// their own copy of the numbers. Bundled on the fly with esbuild (ships with Vite).
const path = require('path');
const esbuild = require('esbuild');

const ROOT = path.resolve(__dirname, '../..');
const src = `
export * from './src/data/budget';
export * from './src/lib/paybackModel';
`;
const out = esbuild.buildSync({
  stdin: { contents: src, resolveDir: ROOT, loader: 'ts' },
  bundle: true,
  format: 'cjs',
  platform: 'node',
  write: false,
  logLevel: 'silent',
});
const mod = { exports: {} };
new Function('module', 'exports', 'require', out.outputFiles[0].text)(mod, mod.exports, require);
const M = mod.exports;
M.assertBudget();
module.exports = M;
