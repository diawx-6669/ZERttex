#!/usr/bin/env node
// Downloads freely licensed destination photos from Wikimedia Commons into
// src/assets/photos and records author + licence in src/data/photoCredits.json.
//
//   npm run photos            download (keeps existing files)
//   npm run photos -- --dry   only print what would be picked
//   npm run photos -- --force replace existing photos
//
// Needs network access to commons.wikimedia.org and upload.wikimedia.org.
// Only CC BY, CC BY-SA, CC0 and public-domain files are accepted (no NC / ND).
// Review every picked photo before presenting it; edit scripts/photos.config.json
// ("pinned") to force exact Commons files.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'src/assets/photos');
const creditsPath = join(root, 'src/data/photoCredits.json');
const config = JSON.parse(readFileSync(join(root, 'scripts/photos.config.json'), 'utf8'));
const args = new Set(process.argv.slice(2));
const DRY = args.has('--dry');
const FORCE = args.has('--force');
const UA = 'SaryarqaGo-hackathon-prototype/0.1 (ZERTTEX 2026 student project)';
const API = 'https://commons.wikimedia.org/w/api.php';

const curl = (url, extra = []) =>
  execFileSync('curl', ['-sS', '--fail', '-L', '-A', UA, ...extra, url], { maxBuffer: 64 * 1024 * 1024 });

const api = (params) => {
  const q = new URLSearchParams({ format: 'json', formatversion: '2', ...params });
  return JSON.parse(curl(`${API}?${q}`).toString('utf8'));
};

const stripHtml = (s = '') =>
  s.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();

const FREE = /^(CC BY(-SA)? \d(\.\d)?( [a-z]{2,})?|CC0( 1\.0)?|Public domain|PD.*)$/i;
const BAD_TITLE = /(map|flag|logo|stamp|coin|diagram|chart|banknote|plan\b|scheme|svg)/i;

function candidates(pages) {
  return (pages ?? [])
    .map((p) => ({ title: p.title, info: p.imageinfo?.[0] }))
    .filter(({ title, info }) => {
      if (!info || info.mime !== 'image/jpeg') return false;
      if (info.width < 1600) return false;
      const ratio = info.width / info.height;
      if (ratio < 1.2 || ratio > 2.3) return false;
      if (BAD_TITLE.test(title)) return false;
      const lic = stripHtml(info.extmetadata?.LicenseShortName?.value);
      return FREE.test(lic) && !/NC|ND/.test(lic);
    });
}

function toCredit(title, info, tourName) {
  const m = info.extmetadata ?? {};
  const name = stripHtml(m.ObjectName?.value) || title.replace(/^File:/, '').replace(/\.[a-z]+$/i, '');
  return {
    author: stripHtml(m.Artist?.value) || 'Unknown author',
    license: stripHtml(m.LicenseShortName?.value),
    licenseUrl: m.LicenseUrl?.value || undefined,
    source: info.descriptionurl,
    title: name,
    alt: { en: `${tourName.en}: ${name}`, zh: tourName.zh },
  };
}

const credits = existsSync(creditsPath) ? JSON.parse(readFileSync(creditsPath, 'utf8')) : {};
mkdirSync(outDir, { recursive: true });

for (const slot of config.slots) {
  console.log(`\n== ${slot.tour} (${slot.count} photos)`);
  const picked = [];
  const seen = new Set();
  const query = (params) => {
    const res = api({ action: 'query', prop: 'imageinfo', iiprop: 'url|size|mime|extmetadata', iiurlwidth: '1600', ...params });
    for (const c of candidates(res.query?.pages)) {
      if (picked.length >= slot.count || seen.has(c.title)) continue;
      seen.add(c.title);
      picked.push(c);
    }
  };
  if (slot.pinned?.length) query({ titles: slot.pinned.join('|') });
  for (const q of slot.queries) {
    if (picked.length >= slot.count) break;
    query({ generator: 'search', gsrsearch: `${q} filetype:bitmap`, gsrnamespace: '6', gsrlimit: '40' });
  }
  if (!picked.length) console.warn('  no suitable free photos found — try other queries or pin files');

  picked.forEach((c, i) => {
    const file = `${slot.tour}-${i + 1}.jpg`;
    const dest = join(outDir, file);
    const credit = toCredit(c.title, c.info, slot.name);
    console.log(`  ${file}  ←  ${c.title}\n      ${credit.author} · ${credit.license}`);
    if (DRY) return;
    if (existsSync(dest) && !FORCE && credits[file]) {
      console.log('      exists, skipped (use --force to replace)');
      return;
    }
    writeFileSync(dest, curl(c.info.thumburl));
    credits[file] = credit;
    console.log(`      saved ${(statSync(dest).size / 1024).toFixed(0)} KB`);
  });
}

if (!DRY) {
  writeFileSync(creditsPath, JSON.stringify(credits, null, 2) + '\n');
  console.log(`\nCredits written to ${creditsPath}. Review the photos, then run npm run build.`);
}
