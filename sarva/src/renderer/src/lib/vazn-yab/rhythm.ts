// پخشِ ریتم — لایه‌ای نازک روی موتورِ واقعی (‎score.ts‎).
//
// اینجا فقط «پخش» است: ساختنِ بافر، نگه‌داشتنِ زمینه‌ی صوتی، و قطع‌کردن.
// خودِ صدا در score.ts ساخته می‌شود و آن پورتِ مستقیمِ موتورِ سایت است.

import { renderScore, SCALES, type Hemi, type RhythmMode } from "./score";

export type { RhythmMode, Hemi } from "./score";

export const RHYTHM_MODES: { id: RhythmMode; label: string }[] = [
  { id: "shur", label: "شور" },
  { id: "chahargah", label: "چهارگاه" },
  { id: "mahur", label: "ماهور" },
];

export type SpeedId = "slow" | "normal" | "fast";

export const RHYTHM_SPEEDS: { id: SpeedId; label: string; factor: number }[] = [
  { id: "slow", label: "آرام", factor: 1.25 },
  { id: "normal", label: "عادی", factor: 1 },
  { id: "fast", label: "تند", factor: 0.78 },
];

/** زمانِ یک هجای کوتاه، به ثانیه. */
const BASE_UNIT = 0.27;

function unitFor(speed: SpeedId): number {
  return BASE_UNIT * (RHYTHM_SPEEDS.find((s) => s.id === speed)?.factor ?? 1);
}

/**
 * الگوی تقطیع را به ورودیِ موتور می‌برد.
 *
 * «-» بلند است و «U» کوتاه. `footStart` نشان می‌دهد کجا رکنِ تازه‌ای شروع
 * می‌شود — موتور روی آن‌ها تأکید می‌زند.
 */
export function hemisFromPattern(pattern: string, perHemistich?: number): Hemi[] {
  const cells = [...pattern].filter((c) => c === "-" || c === "U");
  if (!cells.length) return [];

  // الگویِ یک مصراع است یا کلِ بیت؟ اگر تعداد فرد باشد، دو نیمه می‌سازیم.
  const halves: boolean[][] = [];
  if (perHemistich) {
    for (let i = 0; i < cells.length; i += perHemistich) {
      halves.push(cells.slice(i, i + perHemistich).map((c) => c === "-"));
    }
  } else if (cells.length % 2 === 0) {
    const mid = cells.length / 2;
    halves.push(cells.slice(0, mid).map((c) => c === "-"));
    halves.push(cells.slice(mid).map((c) => c === "-"));
  } else {
    halves.push(cells.map((c) => c === "-"));
  }

  // دو مصراعِ نابرابر را به دو می‌بریم
  if (halves.length === 1 && halves[0].length > 1) {
    const mid = Math.ceil(halves[0].length / 2);
    halves.push(halves[0].slice(mid));
    halves[0] = halves[0].slice(0, mid);
  }

  return halves.map((longs) => ({
    longs,
    // هر هجا آغازِ یک رکن است، مگر آنکه در یک رکنِ چندهجایی پشتِ هم آمده باشد.
    footStart: longs.map((_, i) => i % 2 === 0),
  }));
}

export type RenderOptions = { mode: RhythmMode; speed: SpeedId };

export function renderRhythm(
  pattern: string,
  { mode, speed }: RenderOptions,
): Score & { duration: number } {
  const score = renderScore({
    hemis: hemisFromPattern(pattern),
    unit: unitFor(speed),
    mode,
    character: "lyric",
  });
  return score;
}

type Score = ReturnType<typeof renderScore>;

let ctx: AudioContext | null = null;
let source: AudioBufferSourceNode | null = null;

function audioContext(): AudioContext | null {
  if (ctx) return ctx;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx = new Ctor();
  return ctx;
}

/** ریتم را پخش می‌کند؛ هر پخشِ تازه، پخشِ قبلی را قطع می‌کند. */
export async function playRhythm(
  pattern: string,
  opts: RenderOptions,
): Promise<{ ok: boolean; duration: number }> {
  stopRhythm();
  let score: Score;
  try {
    score = renderRhythm(pattern, opts);
  } catch {
    return { ok: false, duration: 0 };
  }
  if (!score.left.length) return { ok: false, duration: 0 };

  const ac = audioContext();
  if (!ac) return { ok: false, duration: 0 };
  await ac.resume().catch(() => {});

  const buf = ac.createBuffer(2, score.left.length, score.sr);
  buf.copyToChannel(score.left, 0);
  buf.copyToChannel(score.right, 1);

  const src = ac.createBufferSource();
  src.buffer = buf;
  src.connect(ac.destination);
  src.onended = () => {
    if (source === src) source = null;
  };
  source = src;
  src.start();
  return { ok: true, duration: score.duration };
}

export function stopRhythm(): void {
  if (source) {
    try {
      source.stop();
    } catch {
      /* پیش‌تر ایستاده بود */
    }
    source = null;
  }
}

export { SCALES };
