#!/usr/bin/env node
// Makes the 12 credited destination photos offline-safe.
//
//   npm run photos:offline                 download from Wikimedia Commons
//   node scripts/photos-offline.cjs --from <dir>   use files you downloaded by hand
//                                                 (named like src/data/commonsPhotos.json "local")
//   --out <dir> --credits <file>           write somewhere else (used by tests)
//
// Each photo is resized to ≤ 1600 px wide and re-encoded as JPEG until it is
// ≤ 250 KB, saved as src/assets/photos/<tour>-<n>.jpg, and its author / licence
// is written to src/data/photoCredits.json. photos.ts then bundles it into the
// single-file build, so the demo shows real photos with no internet.
// Needs: curl + network to commons.wikimedia.org (download mode), Playwright Chromium (resize).

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const arg = (name, def) => {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : def;
};
const FROM = arg('--from');
const OUT = path.resolve(arg('--out', path.join(ROOT, 'src/assets/photos')));
const CREDITS = path.resolve(arg('--credits', path.join(ROOT, 'src/data/photoCredits.json')));
const MAX_W = 1600;
const MAX_BYTES = 250 * 1024;
const UA = 'SaryarqaGo-hackathon-prototype/0.2 (ZERTTEX 2026 student project)';

const list = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/commonsPhotos.json'), 'utf8'));
const filePath = (f) => `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(f)}?width=${MAX_W}`;
const pageUrl = (f) => `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(f.replace(/ /g, '_'))}`;

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const credits = fs.existsSync(CREDITS) ? JSON.parse(fs.readFileSync(CREDITS, 'utf8')) : {};
  const browser = await chromium.launch();
  const page = await browser.newPage();
  let failed = 0;
  for (const p of list) {
    try {
      const src = FROM
        ? fs.readFileSync(path.join(FROM, p.local))
        : execFileSync('curl', ['-sS', '--fail', '-L', '-A', UA, filePath(p.file)], { maxBuffer: 64 * 1024 * 1024 });
      const mime = src[0] === 0x89 ? 'image/png' : 'image/jpeg';
      const b64 = await page.evaluate(
        async ({ data, mime, maxW, maxBytes }) => {
          const img = new Image();
          img.src = `data:${mime};base64,${data}`;
          await img.decode();
          let w = Math.min(maxW, img.naturalWidth);
          for (;;) {
            const h = Math.round((img.naturalHeight * w) / img.naturalWidth);
            const c = document.createElement('canvas');
            c.width = w;
            c.height = h;
            c.getContext('2d').drawImage(img, 0, 0, w, h);
            for (let q = 0.86; q >= 0.5; q -= 0.06) {
              const url = c.toDataURL('image/jpeg', q);
              const out = url.slice(url.indexOf(',') + 1);
              if ((out.length * 3) / 4 <= maxBytes) return out;
            }
            w = Math.round(w * 0.85);
          }
        },
        { data: src.toString('base64'), mime, maxW: MAX_W, maxBytes: MAX_BYTES },
      );
      const buf = Buffer.from(b64, 'base64');
      fs.writeFileSync(path.join(OUT, p.local), buf);
      credits[p.local] = {
        author: p.author,
        license: p.license,
        ...(p.licenseUrl ? { licenseUrl: p.licenseUrl } : {}),
        source: pageUrl(p.file),
        title: p.title,
        alt: { en: p.title, zh: p.zh },
      };
      console.log(`${p.local}  ${(buf.length / 1024).toFixed(0)} KB  ←  ${p.file} (${p.author}, ${p.license})`);
    } catch (e) {
      failed++;
      console.error(`FAILED ${p.local} ← ${p.file}: ${String(e.message || e).split('\n')[0]}`);
    }
  }
  await browser.close();
  fs.writeFileSync(CREDITS, JSON.stringify(credits, null, 2) + '\n');
  console.log(`\n${list.length - failed}/${list.length} photos saved to ${OUT}. Credits: ${CREDITS}`);
  if (failed) process.exit(1);
}

main();
