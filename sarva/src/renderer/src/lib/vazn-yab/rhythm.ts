// پخشِ ریتمِ وزن — نوشته‌شده از روی رفتارِ توصیف‌شده در خودِ سایت:
// «هجاهای بلند کشیده‌تر و بم‌تر نواخته می‌شوند.»
//
// ⚠️ پیش از این در این پورت اصلاً پخشی وجود نداشت؛ متنِ راهنما می‌گفت «دکمهٔ
//    پخش را بزن» ولی هیچ صدایی پشتش نبود. سه دستگاه (شور، چهارگاه، ماهور) و
//    سه سرعت (آرام، عادی، تند) همان‌هایی است که صفحهٔ زنده نشان می‌دهد.

/** دستگاه‌هایی که سایت برای صدای ریتم پیش می‌گذارد. */
export type RhythmMode = "shur" | "chahargah" | "mahur";

export const RHYTHM_MODES: { id: RhythmMode; label: string }[] = [
  { id: "shur", label: "شور" },
  { id: "chahargah", label: "چهارگاه" },
  { id: "mahur", label: "ماهور" },
];

/** سرعت‌ها؛ factor روی زمانِ هر واحد ضرب می‌شود. */
export type SpeedId = "slow" | "normal" | "fast";

export const RHYTHM_SPEEDS: { id: SpeedId; label: string; factor: number }[] = [
  { id: "slow", label: "آرام", factor: 1.25 },
  { id: "normal", label: "عادی", factor: 1 },
  { id: "fast", label: "تند", factor: 0.78 },
];

/**
 * فاصله‌های هر دستگاه بر حسبِ نیم‌پرده از نتِ پایه.
 *
 * این‌ها گام‌های شناخته‌شدهٔ موسیقیِ دستگاهیِ ایران است: ماهور شبیهِ بزرگِ
 * اروپایی، شور با درجهٔ دومِ نیم‌پرده‌ای، و چهارگاه با جهشِ چهارمِ افزوده که
 * رنگِ ویژهٔ خودش را دارد.
 */
const SCALES: Record<RhythmMode, number[]> = {
  mahur: [0, 2, 4, 5, 7, 9, 11],
  shur: [0, 1, 4, 5, 7, 8, 11],
  chahargah: [0, 1, 5, 6, 8, 11],
};

/** نتِ پایهٔ هر دستگاه (هرتز) — بم‌تر از آنچه برای آواز به کار می‌رود. */
const ROOT_HZ: Record<RhythmMode, number> = {
  mahur: 174.6,
  shur: 164.8,
  chahargah: 155.6,
};

/** زمانِ یک واحدِ کوتاه، به ثانیه. */
const BASE_UNIT = 0.27;

export type RenderOptions = {
  mode: RhythmMode;
  speed: SpeedId;
};

function unitSeconds(speed: SpeedId): number {
  return BASE_UNIT * (RHYTHM_SPEEDS.find((s) => s.id === speed)?.factor ?? 1);
}

/**
 * ریتمِ یک رشتهٔ تقطیع را به یک بافرِ صوتی تبدیل می‌کند.
 *
 * هر هجا یک ضرب است: هجای بلند (``-``) دو واحد می‌کشد و یک نت پایین‌تر نواخته
 * می‌شود؛ هجای کوتاه یک واحد و بالاتر. بینِ ضرب‌ها مکثِ کوتاهی هست تا مرزِ
 * هجاها شنیده شود.
 */
export async function renderRhythm(
  pattern: string,
  { mode, speed }: RenderOptions,
): Promise<AudioBuffer | null> {
  const cells = [...pattern].filter((c) => c === "-" || c === "U");
  if (!cells.length) return null;

  const unit = unitSeconds(speed);
  const gap = unit * 0.18;
  const tail = unit * 1.2;

  const total = cells.reduce((sum, c) => sum + (c === "-" ? 2 : 1) * unit + gap, 0) + tail;
  const sampleRate = 44100;
  const OfflineCtor =
    window.OfflineAudioContext ??
    (window as unknown as { webkitOfflineAudioContext?: typeof OfflineAudioContext })
      .webkitOfflineAudioContext;
  if (!OfflineCtor) return null;

  const ctx = new OfflineCtor(1, Math.ceil(total * sampleRate), sampleRate);
  const scale = SCALES[mode];
  const root = ROOT_HZ[mode];

  let at = 0.02;
  for (const c of cells) {
    const long = c === "-";
    const dur = (long ? 2 : 1) * unit;
    // هجای بلند: کشیده‌تر و بم‌تر. هجای کوتاه: کوتاه‌تر و زیرتر.
    const degree = scale[long ? 0 : Math.min(2, scale.length - 1)];
    const hz = root * Math.pow(2, degree / 12);

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = long ? "sine" : "triangle";
    osc.frequency.value = hz;

    // یک حملهٔ تند و یک فرودِ نرم — مثلِ ضربه‌ای که روی پوست می‌نشیند.
    const peak = long ? 0.42 : 0.3;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(peak, at + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);

    osc.connect(gain).connect(ctx.destination);
    osc.start(at);
    osc.stop(at + dur + 0.02);

    at += dur + gap;
  }

  return await ctx.startRendering();
}

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
): Promise<boolean> {
  stopRhythm();
  const buffer = await renderRhythm(pattern, opts);
  if (!buffer) return false;
  const ac = audioContext();
  if (!ac) return false;
  await ac.resume().catch(() => {});
  const src = ac.createBufferSource();
  src.buffer = buffer;
  src.connect(ac.destination);
  src.onended = () => {
    if (source === src) source = null;
  };
  source = src;
  src.start();
  return true;
}

export function stopRhythm(): void {
  if (source) {
    try {
      source.stop();
    } catch {
      /* already stopped */
    }
    source = null;
  }
}
