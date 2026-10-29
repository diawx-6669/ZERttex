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
fs.cpSync(path.join(root, 'media'), path.join(root, 'docs/media'), { recursive: true });
// Offline service worker next to every copy of the page.
for (const out of ['docs/sw.js', 'dist/sw.js']) fs.copyFileSync(path.join(root, 'sw.js'), path.join(root, out));
console.log('pages files written');
