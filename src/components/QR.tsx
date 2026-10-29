import { useMemo } from 'react';
import { qrMatrix } from '../lib/qr';

/** Real, scannable QR code (SVG, 2-module quiet zone). */
export function QR({ text, label }: { text: string; label: string }) {
  const grid = useMemo(() => qrMatrix(text), [text]);
  const n = grid.length;
  const d = grid.flatMap((row, r) => row.map((on, c) => (on ? `M${c} ${r}h1v1h-1z` : ''))).join('');
  return (
    <svg viewBox={`-2 -2 ${n + 4} ${n + 4}`} className="h-full w-full" role="img" aria-label={label} data-qr={text} shapeRendering="crispEdges">
      <rect x="-2" y="-2" width={n + 4} height={n + 4} fill="#fff" />
      <path d={d} fill="#12213f" />
    </svg>
  );
}
