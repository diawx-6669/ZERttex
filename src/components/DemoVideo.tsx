import { useState } from 'react';
import { SITE_URL } from '../lib/qr';
import { useApp } from '../state';
import { Tag } from './Tag';

// The 48-second product demo. The file lives next to index.html (media/, copied to docs/media
// by scripts/publish-pages.cjs). Opened from a place without media/ (e.g. dist/index.html),
// the player falls back to the copy on GitHub Pages.
const FILE = 'media/saryarqa-go-demo.mp4';
const POSTER = 'media/saryarqa-go-demo-poster.jpg';

export function DemoVideo() {
  const { t } = useApp();
  const [src, setSrc] = useState(FILE);
  const [poster, setPoster] = useState(POSTER);
  return (
    <figure className="card overflow-hidden" data-testid="demo-video">
      <video
        className="block aspect-video w-full bg-night"
        src={src}
        poster={poster}
        controls
        playsInline
        preload="none"
        onError={() => {
          if (src === FILE) {
            setSrc(SITE_URL + FILE);
            setPoster(SITE_URL + POSTER);
          }
        }}
      >
        <a href={SITE_URL + FILE}>{t({ en: 'Download the demo video (MP4)', zh: '下载演示视频（MP4）' })}</a>
      </video>
      <figcaption className="flex flex-wrap items-center gap-2 px-4 py-3 text-sm text-muted">
        <span>{t({ en: 'Team Shredders · 48 s · captions in Russian', zh: 'Shredders 团队 · 48 秒 · 俄语字幕' })}</span>
        <Tag kind="demo" extra={t({ en: 'test-mode payment', zh: '测试模式支付' })} />
      </figcaption>
    </figure>
  );
}
