// After `vite build`: the single-file app is dist/app.html. Copy it to
// dist/index.html, to the repo root index.html and to docs/index.html, so
// GitHub Pages works whether it serves the root or the /docs folder.
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const built = path.join(root, 'dist/app.html');
for (const out of ['dist/index.html', 'index.html', 'docs/index.html']) fs.copyFileSync(built, path.join(root, out));
for (const out of ['.nojekyll', 'docs/.nojekyll']) fs.writeFileSync(path.join(root, out), '');
// Demo video + poster (media/ at the root): GitHub Pages may serve /docs, so mirror them there.
fs.mkdirSync(path.join(root, 'docs/media'), { recursive: true });
for (const f of fs.readdirSync(path.join(root, 'media'))) fs.copyFileSync(path.join(root, 'media', f), path.join(root, 'docs/media', f));
console.log('pages files written');
