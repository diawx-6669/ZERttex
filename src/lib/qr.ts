// Decorative QR-like pattern. Deterministic from a seed string.
// NOT a real QR code and NOT scannable — always labelled as a placeholder.

const hash = (str: string) => {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

export function qrPattern(seed: string, size = 21): boolean[][] {
  let x = hash(seed) || 1;
  const rnd = () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return ((x >>> 0) % 1000) / 1000;
  };
  const grid = Array.from({ length: size }, () => Array.from({ length: size }, () => rnd() > 0.52));
  const finder = (r0: number, c0: number) => {
    for (let r = -1; r <= 7; r++)
      for (let c = -1; c <= 7; c++) {
        const rr = r0 + r;
        const cc = c0 + c;
        if (rr < 0 || cc < 0 || rr >= size || cc >= size) continue;
        const edge = r === 0 || r === 6 || c === 0 || c === 6;
        const core = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        const inside = r >= 0 && r <= 6 && c >= 0 && c <= 6;
        grid[rr][cc] = inside && (edge || core);
      }
  };
  finder(0, 0);
  finder(0, size - 7);
  finder(size - 7, 0);
  return grid;
}
