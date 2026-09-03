import { MAX_COLUMN_WIDTH, MIN_COLUMN_WIDTH } from './styles.ts';

let measureCanvas: HTMLCanvasElement | null = null;

function measureTextPx(text: string, font: string) {
  if (!measureCanvas) measureCanvas = document.createElement('canvas');
  const ctx = measureCanvas.getContext('2d');
  if (!ctx) return text.length * 8;
  ctx.font = font;
  return ctx.measureText(text).width;
}

/** Column width by header text (includes icon/gaps/padding). */
export function calcHeaderWidth(colName: string, headerFont: string) {
  const textW = measureTextPx(colName, headerFont);
  const iconW = 18;
  const gap = 8;
  const padding = 12 * 2;
  const extra = 12;
  const w = Math.ceil(textW + iconW + gap + padding + extra);
  return Math.max(MIN_COLUMN_WIDTH, Math.min(w, MAX_COLUMN_WIDTH));
}

export function toDateFromMaybeEpoch(v: unknown): Date | null {
  if (typeof v === 'number' || (typeof v === 'string' && /^\d+$/.test(v))) {
    const n = typeof v === 'number' ? v : Number(v);
    if (!Number.isFinite(n)) return null;

    const abs = Math.abs(n);
    let ms: number;

    if (abs < 1e11) {
      ms = n * 1000;
    } else if (abs < 1e14) {
      ms = n;
    } else if (abs < 1e17) {
      ms = Math.floor(n / 1000);
    } else {
      ms = Math.floor(n / 1e6);
    }
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }

  if (typeof v === 'string') {
    const t = Date.parse(v);
    if (!Number.isNaN(t)) return new Date(t);
  }

  return null;
}

function pad(n: number, len = 2) {
  return String(n).padStart(len, '0');
}

export function formatLocalDateTime(d: Date): string {
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const hh = d.getHours();
  const mm = d.getMinutes();
  const ss = d.getSeconds();
  const ms = d.getMilliseconds();
  return `${y}-${pad(m)}-${pad(day)} ${pad(hh)}:${pad(mm)}:${pad(ss)}.${pad(ms, 3)}`;
}
