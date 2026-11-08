// سازهای کوبه‌ای و زهی — پورتِ مستقیمِ ماژولِ 771384 از بسته‌ی زنده‌ی سایت
// (استخراج‌شده در ۲۰۲۶-۱۱-۰۸).
//
// ⚠️ این فایل را «بهتر» یا «ساده‌تر» نکنید. هر ضریب و هر توان در اینجا همانی
//    است که روی سایت شنیده می‌شود؛ کوچک‌ترین تغییرش صدا را از نسخه‌ی اصلی
//    جدا می‌کند. یک بار پیش از این همین‌جا یک موتورِ صدایِ «اختراعی» نوشته شد
//    (موجِ سینوسیِ ساده) که هیچ شباهتی به صدای سایت نداشت؛ این نسخه آن را
//    جایگزین می‌کند.
//
// همهٔ این صداها «سنتزشده»‌اند، نه نمونه‌برداری‌شده: هیچ فایلِ صوتی لازم
// ندارند و در برنامه‌ی آفلاین هم درست کار می‌کنند.

/** نت‌های گامِ شور، به شمارهٔ MIDI (با ربع‌پرده‌ها: ‎63.5‎ و ‎75.5‎). */
export const SHUR = [62, 63.5, 65, 67, 69, 70, 72, 74, 75.5, 77, 79, 81, 82, 84];

/** شمارهٔ MIDI را به هرتز می‌برد. */
export const hz = (midi: number): number => 440 * 2 ** ((midi - 69) / 12);

// یک مولّدِ اعدادِ شبه‌تصادفیِ قطعی (LCG). بذر ثابت است تا هر بار که یک صدا
// ساخته می‌شود دقیقاً همان صدایِ قبل باشد — وگرنه هر بارِ پخش کمی فرق می‌کرد.
function rng(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => (s = (1664525 * s + 0x3c6ef35f) >>> 0) / 0x100000000;
}

/** آرایه را نرمال می‌کند و در یک بافرِ تک‌کاناله می‌گذارد. */
function toBuffer(ctx: BaseAudioContext, arr: Float32Array, peak = 0.9): AudioBuffer {
  let max = 0;
  for (let i = 0; i < arr.length; i++) max = Math.max(max, Math.abs(arr[i]));
  const gain = max > 0 ? peak / max : 1;
  const buf = ctx.createBuffer(1, arr.length, ctx.sampleRate);
  const ch = buf.getChannelData(0);
  for (let i = 0; i < arr.length; i++) ch[i] = arr[i] * gain;
  return buf;
}

/** ضربهٔ بمِ دف — «دم». */
export function dafDom(ctx: BaseAudioContext): AudioBuffer {
  const sr = ctx.sampleRate;
  const n = Math.ceil(0.7 * sr);
  const out = new Float32Array(n);
  const rand = rng(37);
  let noise = 0;
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    noise += (2 * rand() - 1 - noise) * 0.04;
    out[i] =
      Math.sin(2 * Math.PI * (58 + 30 * Math.exp(-18 * t)) * t) * Math.exp(-t / 0.3) +
      noise * Math.exp(-t / 0.08) * 1.4;
  }
  return toBuffer(ctx, out, 0.9);
}

/** جینگِ حلقه‌های دف — همان زنگِ فلزیِ کنارِ دف. */
export function dafJingle(ctx: BaseAudioContext, seed = 41): AudioBuffer {
  const sr = ctx.sampleRate;
  const n = Math.ceil(0.32 * sr);
  const out = new Float32Array(n);
  const rand = rng(seed);
  const partials = Array.from({ length: 7 }, () => ({
    f: 3800 + 5200 * rand(),
    p: 6.28 * rand(),
  }));
  let env = 0;
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    env = Math.exp(-t / 0.09) * (0.6 + 0.4 * Math.abs(Math.sin(190 * t + 0.4 * rand())));
    let sum = 0;
    for (const { f, p } of partials) sum += Math.sin(2 * Math.PI * f * t + p);
    out[i] = (sum / partials.length) * env * (0.7 + (2 * rand() - 1) * 0.3);
  }
  return toBuffer(ctx, out, 0.6);
}

/** پاسخِ ضربهٔ یک اتاق — برای بازآوا (reverb). */
export function roomImpulse(ctx: BaseAudioContext, dur = 2.4): AudioBuffer {
  const sr = ctx.sampleRate;
  const n = Math.ceil(dur * sr);
  const buf = ctx.createBuffer(2, n, sr);
  for (let c = 0; c < 2; c++) {
    const rand = rng(71 + 13 * c);
    const ch = buf.getChannelData(c);
    let lp = 0;
    for (let i = 0; i < n; i++) {
      const t = i / sr;
      lp += (2 * rand() - 1 - lp) * (0.9 - (t / dur) * 0.75);
      ch[i] = lp * Math.exp(-t / (0.28 * dur)) * (t < 0.012 ? t / 0.012 : 1);
    }
  }
  return buf;
}

/**
 * سنتور — با الگوریتمِ Karplus-Strong دو سیمِ کمی ناکوک (‎0‎ و ‎0.045‎
 * نیم‌پرده) که همان لرزشِ آشنای ساز را می‌سازد.
 */
export function santur(ctx: BaseAudioContext, note: number, dur = 1.7): AudioBuffer {
  const sr = ctx.sampleRate;
  const n = Math.ceil(dur * sr);
  const out = new Float32Array(n);
  const rand = rng(Math.round(97 * note));
  const damp = 0.9965 - 45e-5 * Math.max(0, note - 72);

  for (const detune of [0, 0.045]) {
    const len = Math.max(2, Math.round(sr / hz(note + detune) - 0.5));
    const line = new Float32Array(len + 1);
    let v = 0;
    for (let i = 0; i <= len; i++) {
      v += (2 * rand() - 1 - v) * 0.55;
      line[i] = v;
    }
    let idx = 0;
    let prev = 0;
    for (let i = 0; i < n; i++) {
      const cur = line[idx];
      const next = (cur + prev) * 0.5 * damp;
      prev = cur;
      line[idx] = next;
      idx = idx === len ? 0 : idx + 1;
      out[i] += 0.5 * cur;
    }
  }

  // صدایِ چکش در آغاز
  const attack = Math.min(n, 0.006 * sr);
  for (let i = 0; i < attack; i++) {
    out[i] += (2 * rand() - 1) * (1 - i / attack) * 0.25;
  }
  // و محو شدن در پایان
  const fade = Math.floor(0.08 * sr);
  for (let i = 0; i < fade; i++) out[n - 1 - i] *= i / fade;

  return toBuffer(ctx, out, 0.75);
}

/** ضربهٔ لبهٔ تمبک — «بک». */
export function tombakBak(ctx: BaseAudioContext): AudioBuffer {
  const sr = ctx.sampleRate;
  const n = Math.ceil(0.16 * sr);
  const out = new Float32Array(n);
  const rand = rng(23);
  let prev = 0;
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    const white = 2 * rand() - 1;
    const diff = white - prev;
    prev = white;
    out[i] =
      diff * Math.exp(-t / 0.012) * 0.7 +
      Math.sin(2 * Math.PI * 540 * t) * Math.exp(-t / 0.045) * 0.6 +
      Math.sin(2 * Math.PI * 1260 * t) * Math.exp(-t / 0.02) * 0.25;
  }
  return toBuffer(ctx, out, 0.8);
}

/** ضربهٔ میانِ تمبک — «بم». */
export function tombakBom(ctx: BaseAudioContext): AudioBuffer {
  const sr = ctx.sampleRate;
  const n = Math.ceil(0.45 * sr);
  const out = new Float32Array(n);
  const rand = rng(11);
  let phase = 0;
  let noise = 0;
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    phase += (2 * Math.PI * (68 + 95 * Math.exp(-28 * t))) / sr;
    noise += (2 * rand() - 1 - noise) * 0.08;
    out[i] = Math.sin(phase) * Math.exp(-t / 0.16) + noise * Math.exp(-t / 0.03) * 0.8;
  }
  return toBuffer(ctx, out, 0.95);
}

/** گذرِ هوا — برای گذارها. */
export function whoosh(ctx: BaseAudioContext): AudioBuffer {
  const sr = ctx.sampleRate;
  const n = Math.ceil(0.5 * sr);
  const out = new Float32Array(n);
  const rand = rng(53);
  let s = 0;
  let lp = 0;
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    const coef = 0.02 + 0.25 * Math.sin(Math.PI * Math.min(1, t / 0.42));
    s += (2 * rand() - 1 - s) * coef;
    lp += (s - lp) * 0.5;
    const env = Math.sin(Math.PI * Math.min(1, t / 0.5)) ** 1.5;
    out[i] = (s - 0.6 * lp) * env;
  }
  return toBuffer(ctx, out, 0.5);
}
