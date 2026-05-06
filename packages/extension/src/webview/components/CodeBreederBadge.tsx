import { useEffect, useRef } from 'react';

const TOTAL    = 120;
const COL_BITS = Array.from({ length: TOTAL }, (_, i) =>
  Math.sin(i * 7.3 + 2.1) > 0 ? '1' : '0',
);

function diamondPath(ctx: CanvasRenderingContext2D, CX: number, CY: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(CX, CY - r); ctx.lineTo(CX + r, CY);
  ctx.lineTo(CX, CY + r); ctx.lineTo(CX - r, CY);
  ctx.closePath();
}

function drawDiamond(ctx: CanvasRenderingContext2D, W: number, H: number) {
  const CX = W / 2, CY = H / 2, R = W * 0.46;
  const IR = R - 7; // inner diamond radius — bits are clipped here
  ctx.clearRect(0, 0, W, H);
  const fontSize = Math.max(6, W * 0.082);
  const cellW    = fontSize * 1.08;
  const cellH    = fontSize * 1.28;
  const COLS     = Math.ceil(W / cellW) + 2;
  const ROWS     = Math.ceil(H / cellH) + 4;

  function inInnerDiamond(px: number, py: number) {
    return Math.abs(px - CX) / IR + Math.abs(py - CY) / IR <= 1;
  }

  function radialAlpha(px: number, py: number) {
    const d = Math.abs(px - CX) / IR + Math.abs(py - CY) / IR;
    if (d >= 1)    return 0;
    if (d < 0.22)  return 1;
    if (d < 0.58)  return 1 - ((d - 0.22) / 0.36) * 0.42;
    return 0.58 - ((d - 0.58) / 0.42) * 0.58;
  }

  // Clip bits to inner diamond
  ctx.save();
  diamondPath(ctx, CX, CY, IR);
  ctx.clip();

  for (let c = 0; c < COLS; c++) {
    const colScroll = (c * 3.7) % TOTAL;
    for (let r = -1; r < ROWS + 3; r++) {
      const srcIdx = ((Math.floor(r + colScroll)) % TOTAL + TOTAL) % TOTAL;
      const bit    = COL_BITS[(c * 13 + srcIdx) % TOTAL];
      const px     = c * cellW + cellW * 0.35;
      const py     = r * cellH + cellH * 0.5 - (colScroll % 1) * cellH;
      if (!inInnerDiamond(px, py)) continue;
      const alpha = radialAlpha(px, py);
      if (alpha < 0.04) continue;
      ctx.globalAlpha = alpha;
      ctx.fillStyle   = bit === '1' ? '#00ee55' : '#00ddff';
      ctx.font        = `900 ${fontSize.toFixed(1)}px monospace`;
      ctx.fillText(bit, px - fontSize * 0.28, py + fontSize * 0.36);
    }
  }

  ctx.restore();
  ctx.globalAlpha = 1;

  // Outer diamond
  diamondPath(ctx, CX, CY, R - 1);
  ctx.strokeStyle = 'rgba(220,220,220,0.85)';
  ctx.lineWidth   = 2;
  ctx.stroke();

  // Inner diamond — visible border
  diamondPath(ctx, CX, CY, IR);
  ctx.strokeStyle = 'rgba(210,210,210,0.55)';
  ctx.lineWidth   = 1.2;
  ctx.stroke();
}

export function CodeBreederBadge() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawDiamond(ctx, canvas.width, canvas.height);
  }, []);

  return (
    <div className="pd-credit">
      <span className="pd-credit-by">BY</span>
      <div className="pd-credit-logo">
        <canvas ref={ref} width={40} height={40} />
        <div className="pd-credit-words">
          <span className="pd-credit-word">CODE</span>
          <span className="pd-credit-word">BREEDER</span>
        </div>
      </div>
    </div>
  );
}
