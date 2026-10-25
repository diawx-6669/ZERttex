# Destination photos

Drop real, freely licensed photos here, named `<slot>-<n>.jpg`:

| Slot | Shows |
|---|---|
| `charyn-1.jpg` … | Charyn Canyon |
| `kolsai-1.jpg` … | Kolsai Lakes / Kaindy |
| `turkestan-1.jpg` … | Turkestan, Yasawi mausoleum, Otrar, Arystan Bab |
| `burabay-1.jpg` … | Burabay lakes and granite |

Every photo **must** have an entry in `src/data/photoCredits.json` (author, license, source URL).
Photos without a credit entry are ignored by the app, so nothing unattributed ever ships.

Fastest way: run `npm run photos` (downloads CC / public-domain photos from Wikimedia Commons
with author and licence filled in automatically). Needs network access to
`commons.wikimedia.org` and `upload.wikimedia.org`.

Recommended size: 1600 px wide JPEG, under 350 KB (the build inlines photos into `dist/index.html`).
