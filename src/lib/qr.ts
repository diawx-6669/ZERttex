// Real, scannable QR codes (qrcode-generator, MIT, no dependencies).
import qrcode from 'qrcode-generator';
import type { TourId } from '../data/types';

/** Public prototype. A postcard QR opens the tour page with the referral code. */
export const SITE_URL = 'https://diawx-6669.github.io/ZERttex/';

/** Hash-router link: #/tour/<id>?ref=<code>. The router reads the query from the hash. */
export const referralUrl = (tour: TourId, ref: string) => `${SITE_URL}#/tour/${tour}?ref=${encodeURIComponent(ref)}`;

/** QR module matrix (true = dark), error correction M. Input should be ASCII (URLs are percent-encoded). */
export function qrMatrix(text: string): boolean[][] {
  const qr = qrcode(0, 'M');
  qr.addData(text, 'Byte');
  qr.make();
  const n = qr.getModuleCount();
  return Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => qr.isDark(r, c)));
}

/** Draws the QR with a quiet zone of `quiet` modules into a square at (x, y) of `size` px. */
export function drawQr(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, quiet = 2, dark = '#12213f') {
  const m = qrMatrix(text);
  const n = m.length + quiet * 2;
  const cell = size / n;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = dark;
  m.forEach((row, r) =>
    row.forEach((on, c) => {
      if (on) ctx.fillRect(Math.floor(x + (c + quiet) * cell), Math.floor(y + (r + quiet) * cell), Math.ceil(cell), Math.ceil(cell));
    }),
  );
}
