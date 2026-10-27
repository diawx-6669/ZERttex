// Exports the postcard as a 1080 × 1350 PNG (4:5, Xiaohongshu / WeChat Moments),
// drawn on a <canvas> in the browser. Nothing is uploaded.
import { drawQr } from './qr';

export type PostcardData = {
  photos: string[]; // data URLs from FileReader
  figure: HTMLElement | null; // the on-screen postcard, used for the destination photo / SVG scene
  titleEn: string;
  titleZh: string;
  message: string;
  name: string;
  scanText: string;
  qrText: string;
};

const W = 1080;
const H = 1350;
const PHOTO_H = 1000;
const INK = '#12213f';
const PAPER = '#fbf6ea';
const DISPLAY = 'Archivo, "PingFang SC", "Microsoft YaHei", system-ui, sans-serif';
const TEXT = '"Instrument Sans", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif';

const load = (src: string, cors = false) =>
  new Promise<HTMLImageElement>((ok, fail) => {
    const img = new Image();
    if (cors) img.crossOrigin = 'anonymous';
    img.onload = () => ok(img);
    img.onerror = fail;
    img.src = src;
  });

function cover(ctx: CanvasRenderingContext2D, img: CanvasImageSource & { width: number; height: number }, x: number, y: number, w: number, h: number) {
  const iw = (img as HTMLImageElement).naturalWidth || img.width;
  const ih = (img as HTMLImageElement).naturalHeight || img.height;
  const s = Math.max(w / iw, h / ih);
  const sw = w / s;
  const sh = h / s;
  ctx.drawImage(img, (iw - sw) / 2, (ih - sh) / 2, sw, sh, x, y, w, h);
}

/** Destination image when the traveler added no photos: the bundled / CORS-enabled photo, else the SVG scene. */
async function destinationImage(figure: HTMLElement | null): Promise<HTMLImageElement | null> {
  const img = figure?.querySelector<HTMLImageElement>('img');
  if (img?.complete && img.naturalWidth) {
    try {
      const copy = await load(img.currentSrc || img.src, !img.src.startsWith('data:'));
      // Make sure it does not taint the canvas.
      const probe = document.createElement('canvas');
      probe.width = probe.height = 1;
      probe.getContext('2d')!.drawImage(copy, 0, 0, 1, 1);
      probe.toDataURL();
      return copy;
    } catch {
      /* fall through to the scene */
    }
  }
  const svg = figure?.querySelector('svg[data-scene]') ?? figure?.querySelector('svg');
  if (!svg) return null;
  const xml = new XMLSerializer().serializeToString(svg);
  const url = URL.createObjectURL(new Blob([xml], { type: 'image/svg+xml' }));
  try {
    return await load(url);
  } catch {
    return null;
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number) {
  // Works for spaced (EN) and unspaced (中文) text.
  const tokens = /\s/.test(text) ? text.split(/(\s+)/) : Array.from(text);
  const lines: string[] = [];
  let line = '';
  for (const tk of tokens) {
    const next = line + tk;
    if (ctx.measureText(next).width > maxW && line.trim()) {
      lines.push(line.trim());
      line = tk.trimStart();
    } else line = next;
  }
  if (line.trim()) lines.push(line.trim());
  return lines;
}

export async function renderPostcard(d: PostcardData): Promise<HTMLCanvasElement> {
  if (document.fonts?.ready) await document.fonts.ready;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);

  // Photo area
  ctx.fillStyle = '#d9d4c7';
  ctx.fillRect(0, 0, W, PHOTO_H);
  if (d.photos.length) {
    const imgs = await Promise.all(d.photos.map((p) => load(p)));
    const g = 4;
    const half = (W - g) / 2;
    const halfH = (PHOTO_H - g) / 2;
    const cells =
      imgs.length === 1
        ? [[0, 0, W, PHOTO_H]]
        : imgs.length === 2
          ? [[0, 0, half, PHOTO_H], [half + g, 0, half, PHOTO_H]]
          : imgs.length === 3
            ? [[0, 0, half, PHOTO_H], [half + g, 0, half, halfH], [half + g, halfH + g, half, halfH]]
            : [[0, 0, half, halfH], [half + g, 0, half, halfH], [0, halfH + g, half, halfH], [half + g, halfH + g, half, halfH]];
    imgs.forEach((img, i) => cover(ctx, img, ...(cells[i] as [number, number, number, number])));
  } else {
    const img = await destinationImage(d.figure);
    if (img) cover(ctx, img, 0, 0, W, PHOTO_H);
  }

  // Bottom fade + destination name
  const grad = ctx.createLinearGradient(0, PHOTO_H - 330, 0, PHOTO_H);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.72)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, PHOTO_H - 330, W, 330);
  ctx.fillStyle = '#fff';
  ctx.font = `800 72px ${DISPLAY}`;
  ctx.fillText(d.titleEn, 48, PHOTO_H - 92, W - 96);
  ctx.font = `600 38px ${DISPLAY}`;
  ctx.fillText(d.titleZh, 48, PHOTO_H - 40, W - 96);

  // Top-left pill
  ctx.font = `600 30px ${TEXT}`;
  const pill = 'Kazakhstan · 哈萨克斯坦';
  const pw = ctx.measureText(pill).width + 44;
  ctx.fillStyle = 'rgba(18,33,63,0.85)';
  ctx.beginPath();
  ctx.roundRect?.(36, 36, pw, 60, 30);
  if (!ctx.roundRect) ctx.rect(36, 36, pw, 60);
  ctx.fill();
  ctx.fillStyle = '#f0ebde';
  ctx.fillText(pill, 58, 77);

  // Message, name, scan text, logo
  const qrSize = 270;
  const textW = W - 48 - qrSize - 72;
  ctx.fillStyle = INK;
  ctx.font = `700 44px ${DISPLAY}`;
  let y = PHOTO_H + 80;
  for (const line of wrap(ctx, `"${d.message}"`, textW).slice(0, 2)) {
    ctx.fillText(line, 48, y);
    y += 54;
  }
  ctx.font = `400 32px ${TEXT}`;
  ctx.fillText(`- ${d.name}`, 48, y + 4);
  ctx.fillStyle = '#0e807a';
  ctx.font = `600 28px ${TEXT}`;
  ctx.fillText(d.scanText, 48, H - 92, textW);
  ctx.fillStyle = INK;
  ctx.font = `800 36px ${DISPLAY}`;
  ctx.fillText('Saryarqa Go', 48, H - 40);

  drawQr(ctx, d.qrText, W - 48 - qrSize, PHOTO_H + 36, qrSize, 2, INK);
  return c;
}

export async function downloadPostcard(d: PostcardData, filename: string) {
  const c = await renderPostcard(d);
  const url = c.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
