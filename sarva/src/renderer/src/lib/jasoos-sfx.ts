"use client";

/** صداهایِ «جاسوسِ نقش‌ها».
 *
 *  سایت این صداها را از فایل نمی‌آورد — با وب‌آدیو می‌سازدشان. پوشه‌یِ صدا در
 *  هیچ درخواستی دیده نشد، و بسته در عوض `AudioContext` و `createOscillator`
 *  صدا می‌زند. پارامترها (بسامد، زمان، شدت) رونوشتِ همان تابعِ `z` در بسته
 *  است؛ نامِ کلیدِ ذخیره هم همان «sarva:jasoos:sfx» است. */

let ctx: AudioContext | null = null;
let noise: AudioBuffer | null = null;

/** پوشِ افزایش/کاهش — صدا را بی‌تقّه‌زدن باز و بسته می‌کند. */
function env(a: AudioContext, at: number, peak: number, dur: number) {
  const g = a.createGain();
  g.gain.setValueAtTime(1e-4, at);
  g.gain.exponentialRampToValueAtTime(peak, at + 0.008);
  g.gain.exponentialRampToValueAtTime(1e-4, at + dur);
  g.connect(a.destination);
  return g;
}

export function audio(): AudioContext | null {
  if (!ctx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** زنگ: یک موج با هماهنگِ دومش — برایِ شکار و پایان. */
export function bell(a: AudioContext, at: number, freq: number, gain: number, dur: number) {
  const out = env(a, at, gain, dur);
  for (const [mult, amp] of [
    [1, 1],
    [2, 0.14],
  ]) {
    const osc = a.createOscillator();
    const g = a.createGain();
    osc.frequency.setValueAtTime(freq * mult, at);
    g.gain.value = amp;
    osc.connect(g).connect(out);
    osc.start(at);
    osc.stop(at + dur + 0.05);
  }
}

/** فش‌فشِ گلوله: نویزِ سفید از صافیِ میان‌گذر که می‌لغزد. */
export function hiss(
  a: AudioContext,
  at: number,
  f0: number,
  f1: number,
  gain: number,
  dur: number,
) {
  if (!noise) {
    noise = a.createBuffer(1, Math.floor(0.8 * a.sampleRate), a.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = 2 * Math.random() - 1;
  }
  const src = a.createBufferSource();
  src.buffer = noise;
  const bp = a.createBiquadFilter();
  bp.type = "bandpass";
  bp.Q.value = 0.8;
  bp.frequency.setValueAtTime(f0, at);
  bp.frequency.exponentialRampToValueAtTime(f1, at + dur);
  src.connect(bp).connect(env(a, at, gain, dur));
  src.start(at);
  src.stop(at + dur + 0.05);
}

/** یک نتِ لغزان. */
export function tone(
  a: AudioContext,
  at: number,
  type: OscillatorType,
  f0: number,
  f1: number,
  gain: number,
  dur: number,
) {
  const osc = a.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(f0, at);
  osc.frequency.exponentialRampToValueAtTime(f1, at + dur);
  osc.connect(env(a, at, gain, dur));
  osc.start(at);
  osc.stop(at + dur + 0.05);
}

const KEY = "sarva:jasoos:sfx";
const listeners = new Set<() => void>();
const read = () => {
  try {
    return localStorage.getItem(KEY) !== "off";
  } catch {
    return true;
  }
};

/** برایِ useSyncExternalStore: هر بار صدا خاموش/روشن شود، آگاه می‌کند. */
export function subscribeSfx(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function setSfxOn(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? "on" : "off");
  } catch {
    /* ذخیره در دسترس نیست؛ همین نشست کافی است. */
  }
  listeners.forEach((fn) => fn());
}

export { read as sfxIsOn };

export type SfxKind = "lock" | "shot" | "down" | "miss" | "escape" | "finish";

/** همان نگاشتِ سایت: هر رخداد چه صدایی دارد. */
export function sfx(kind: SfxKind) {
  if (!read()) return;
  const a = audio();
  if (!a) return;
  const t = a.currentTime + 0.01;
  switch (kind) {
    case "lock":
      tone(a, t, "sine", 1900, 2300, 0.012, 0.05);
      break;
    case "shot":
      hiss(a, t, 3800, 260, 0.2, 0.2);
      tone(a, t, "sine", 130, 42, 0.26, 0.24);
      bell(a, t + 0.32, 3400, 0.012, 0.07);
      bell(a, t + 0.41, 2900, 0.008, 0.06);
      break;
    case "down":
      tone(a, t, "triangle", 170, 65, 0.1, 0.3);
      bell(a, t + 0.18, 1046.5, 0.06, 0.3);
      bell(a, t + 0.26, 1568, 0.055, 0.55);
      break;
    case "miss":
      tone(a, t, "sine", 2600, 800, 0.028, 0.22);
      tone(a, t + 0.12, "triangle", 233, 146, 0.08, 0.24);
      break;
    case "escape":
      hiss(a, t, 700, 2400, 0.05, 0.35);
      break;
    case "finish":
      [784, 1046.5, 1318.5].forEach((f, i) => bell(a, t + 0.09 * i, f, 0.05, 0.4));
      bell(a, t + 0.3, 1568, 0.055, 0.9);
      break;
  }
}
