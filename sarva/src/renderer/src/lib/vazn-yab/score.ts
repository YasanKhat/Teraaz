// موتورِ ریتمِ وزن‌یاب — پورتِ مستقیمِ ماژولِ 340600 از بسته‌ی زنده‌ی سایت
// (استخراج‌شده ۲۰۲۶-۱۱-۰۸ از روی کارگرِ وبِ ریتم).
//
// ⚠️ این فایل را «بهتر» نکنید و چیزی در آن از خودتان نسازید. هر ضریب، هر
//    زمانِ تأخیر و هر آستانه در اینجا همانی است که روی سایت شنیده می‌شود.
//    دو بار پیش از این یک موتورِ صدایِ اختراعی اینجا نوشته شد (موجِ سینوسی،
//    بعد یک موتورِ کوچک‌تر) و هر دو هیچ شباهتی به صدای سایت نداشتند؛ این
//    نسخه خودِ موتورِ اصلی است.
//
// آنچه اینجا می‌گذرد:
//   • compose()  — روی هجاهای هر مصراع یک ملودی می‌سازد: از درجه‌ای بالا شروع
//     می‌کند، به درجهٔ پایانی فرود می‌آید، روی هجای بلند درجهٔ پایدار برمی‌گزیند
//     و از تکرارِ پشتِ‌هم پرهیز می‌کند. بذرش از خودِ الگوی هجاهاست، پس یک وزن
//     همیشه یک ملودی می‌دهد.
//   • renderScore() — آن ملودی را با سازهای سنتزشده می‌نوازد و در یک بافرِ
//     دوکاناله می‌ریزد: سنتور (زه با الگوریتمِ Karplus-Strong)، دف، تمبک،
//     کوس، زیل، نی (در شخصیتِ عرفانی) و کف (در جشنی)، بعد بازآوا و محدودکننده.

const TAU = 2 * Math.PI
const SR = 44100

/** شمارهٔ MIDI را به هرتز می‌برد. */
const hz = (midi: number): number => 440 * 2 ** ((midi - 69) / 12)

export type RhythmMode = "shur" | "chahargah" | "mahur"

export type Character = "epic" | "lyric" | "mystic" | "festive" | "reflective"

/**
 * گام‌های سه دستگاه.
 *
 * `stable` درجه‌هایی است که ملودی می‌تواند روی هجای بلند روی آن‌ها بنشیند؛
 * همان درجه‌هایی که در موسیقیِ ایرانی «ایست» به حساب می‌آیند.
 */
export const SCALES = {
  shur: {
    notes: [62, 63.5, 65, 67, 69, 70, 72, 74, 75.5, 77, 79, 81, 82, 84],
    stable: [0, 2, 3, 4, 7, 9, 10, 11],
  },
  chahargah: {
    notes: [60, 61.5, 64, 65, 67, 68.5, 71, 72, 73.5, 76, 77, 79, 80.5, 83],
    stable: [0, 2, 4, 7, 9, 11],
  },
  mahur: {
    notes: [60, 62, 64, 65, 67, 69, 71, 72, 74, 76, 77, 79, 81, 83],
    stable: [0, 2, 4, 7, 9, 11],
  },
} as const

function makeRng(seed: number): () => number {
  let s = seed >>> 0
  return () => (s = (1664525 * s + 0x3c6ef35f) >>> 0) / 0x100000000
}

export type Hemi = { longs: boolean[]; footStart: boolean[] }

import { bareHemi } from "./prosody";

/** روی هجاهای هر مصراع ملودی می‌سازد. خروجی: شمارهٔ MIDIِ هر هجا. */
export function compose(hemis: boolean[][], mode: RhythmMode): number[][] {
  const { notes, stable } = SCALES[mode]

  // بذر از خودِ الگوی هجاهاست؛ پس یک وزن همیشه همان ملودی را می‌دهد.
  let seed = hemis[0].reduce<number>(
    (acc, long, i) => (31 * acc + (long ? 7 : 3) + i) >>> 0,
    17,
  )
  const rand = makeRng(seed)
  const maxIdx = notes.length - 1

  return hemis.map((longs, hIdx) => {
    const n = longs.length
    const out: number[] = []
    // مصراعِ اول از بالا شروع می‌کند و پایین می‌آید؛ دومی برعکس.
    const start = hIdx
      ? Math.min(9, 1 + 2 * Math.max(0, n - 2))
      : Math.max(2, 6 - 2 * Math.max(0, n - 2))
    const end = hIdx ? 0 : 7
    let cur = start
    let repeats = 0

    for (let b = 0; b < n; b++) {
      let m: number
      if (b === 0) m = start
      else if (b === n - 1) m = end
      else if (b === n - 2) m = end + (hIdx ? 1 : -1)
      else {
        const ratio = b / (n - 1)
        let dir =
          Math.sign(
            Math.round(start + (end - start) * ratio + (hIdx ? 0.8 : 2) * Math.sin(Math.PI * ratio)) -
              cur,
          ) || (0.5 > rand() ? 1 : -1)
        if (0.25 > rand()) dir = -dir
        m = cur + dir * (0.18 > rand() ? 2 : 1)

        // هجای بلند باید روی یک درجهٔ پایدار بنشیند
        if (longs[b] && !stable.includes(m)) {
          if (stable.includes(m + dir) && 2 >= Math.abs(m + dir - cur)) m += dir
          else if (stable.includes(m - dir) && m - dir !== cur) m -= dir
        }

        // و به‌اندازه‌ای مانده تا به پایان برسد
        const target = end + (hIdx ? 1 : -1)
        if (Math.abs(target - m) > n - 2 - b) {
          m = cur + Math.sign(target - cur) * Math.min(2, Math.abs(target - cur))
        }

        // دو هجای پشتِ‌هم روی یک درجه نماند
        if (m === cur) {
          if (++repeats > 1) m = cur + (cur < end ? 1 : -1)
        } else repeats = 0
      }
      cur = Math.max(0, Math.min(maxIdx, m))
      out.push(notes[cur])
    }
    return out
  })
}

/** یک فیلترِ دوقطبی (پایین‌گذر یا میان‌گذر). */
class Biquad {
  b0 = 0
  b1 = 0
  b2 = 0
  a1 = 0
  a2 = 0
  x1 = 0
  x2 = 0
  y1 = 0
  y2 = 0

  set(type: "lp" | "bp", freq: number, q = 0.707) {
    const w = (TAU * Math.min(freq, 19845)) / SR
    const r = Math.sin(w) / (2 * q)
    const c = Math.cos(w)
    const s = 1 + r
    if (type === "lp") {
      this.b0 = (1 - c) / 2 / s
      this.b1 = (1 - c) / s
      this.b2 = this.b0
    } else {
      this.b0 = r / s
      this.b1 = 0
      this.b2 = -r / s
    }
    this.a1 = (-2 * c) / s
    this.a2 = (1 - r) / s
    return this
  }

  run(x: number) {
    const y = this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2
    this.x2 = this.x1
    this.x1 = x
    this.y2 = this.y1
    this.y1 = y
    return y
  }
}

export type Score = {
  left: Float32Array
  right: Float32Array
  sr: number
  onsets: number[]
  cadence: number
  duration: number
}

/** شخصیت‌های اجرا — هر کدام ترکیبِ خودش را از سازها دارد. */
const CHARACTERS: Record<Character, Record<string, number | boolean>> = {
  epic: { tom: 1.15, bak: 1.25, santur: 0.8, low: 0.16, daf: 0, kos: 1, ney: 0, kaf: 0, gallop: true, riz: 0.6 },
  lyric: { tom: 1, bak: 1, santur: 1, low: 0, daf: 1, kos: 0, ney: 0, kaf: 0, gallop: false, riz: 0.85 },
  mystic: { tom: 0.7, bak: 0.7, santur: 0.75, low: 0, daf: 1.5, kos: 0, ney: 0.16, kaf: 0, gallop: false, riz: 0.85 },
  festive: { tom: 1.05, bak: 1.15, santur: 1, low: 0, daf: 1.3, kos: 0, ney: 0, kaf: 0.35, gallop: true, riz: 0.7 },
  reflective: { tom: 0.55, bak: 0.55, santur: 0.9, low: 0, daf: 0.5, kos: 0, ney: 0.13, kaf: 0, gallop: false, riz: 0.9 },
}

export type RenderInput = {
  hemis: Hemi[]
  /** زمانِ یک هجای کوتاه، به ثانیه. */
  unit: number
  mode: RhythmMode
  character?: Character
  tail?: number
}

/**
 * ریتم را می‌نوازد و در دو کانال می‌ریزد.
 *
 * زمان‌بندی: هر هجای بلند دو واحد می‌کشد و کوتاه یک واحد؛ بینِ دو مصراع دو
 * واحد مکث است. `tail` دنباله‌ای است که پس از آخرین هجا برای فرودِ صدا می‌ماند.
 */
export function renderScore({
  hemis,
  unit,
  mode,
  character = "lyric",
  tail = 3.4,
}: RenderInput): Score {
  const melody = compose(
    hemis.map((h) => h.longs),
    mode,
  )
  const tonic = SCALES[mode].notes[0]

  // ── زمان‌بندیِ ضرب‌ها ─────────────────────────────────────────────
  const onsets: number[] = []
  let cursor = 0.55
  hemis.forEach((h, i) => {
    for (const long of h.longs) {
      onsets.push(cursor)
      cursor += (long ? 2 : 1) * unit
    }
    if (i < hemis.length - 1) cursor += 2 * unit
  })
  const cadence = cursor
  const total = cadence + tail
  const len = Math.ceil(SR * total)

  let noiseSeed = 23
  const noise = () => ((noiseSeed = (1664525 * noiseSeed + 0x3c6ef35f) >>> 0) / 0x100000000) * 2 - 1

  const dryL = new Float32Array(len)
  const dryR = new Float32Array(len)
  const send = new Float32Array(len)

  /** یک صدا را در زمان و جای مشخص می‌گذارد. */
  const place = (
    at: number,
    dur: number,
    voice: (t: number) => number,
    opts: { gain?: number; verb?: number; pan?: number } = {},
  ) => {
    const gain = opts.gain ?? 1
    const verb = opts.verb ?? 0
    const startIdx = Math.round(SR * at)
    const ang = ((Math.max(-1, Math.min(1, opts.pan ?? 0)) + 1) * Math.PI) / 4
    const gl = Math.cos(ang)
    const gr = Math.sin(ang)
    const endIdx = Math.min(len, startIdx + Math.ceil(SR * dur))
    for (let i = Math.max(0, startIdx); i < endIdx; i++) {
      const s = voice((i - startIdx) / SR) * gain
      dryL[i] += s * gl
      dryR[i] += s * gr
      send[i] += s * verb
    }
  }

  // ── سازها ────────────────────────────────────────────────────────

  /** زه — دو سیمِ کمی ناکوک با الگوریتمِ Karplus-Strong (سنتور). */
  const stringVoice = (freq: number) => {
    const strings = [freq, 1.0025 * freq].map((f) => {
      const n = Math.max(2, Math.round(SR / f))
      const buf = new Float32Array(n)
      for (let i = 0; i < n; i++) buf[i] = noise() * (0.6 + 0.4 * Math.sin((Math.PI * i) / n))
      return { buf, i: 0, len: n }
    })
    return () => {
      let sum = 0
      for (const s of strings) {
        const next = (s.i + 1) % s.len
        const cur = s.buf[s.i]
        s.buf[s.i] = 0.4985 * (cur + s.buf[next])
        s.i = next
        sum += cur
      }
      return 0.5 * sum
    }
  }

  /** تمبک، ضربهٔ میان — «بم». */
  const tom = (t: number) =>
    Math.sin(TAU * (70 * t + 5 * (1 - Math.exp(-18 * t)))) * Math.exp(-6 * t) * Math.min(1, 800 * t) +
    (t < 0.006 ? 0.25 * noise() : 0)

  /** تمبک، ضربهٔ لبه — «بک». */
  const bakVoice = () => {
    const f = new Biquad().set("bp", 2300, 1.4)
    return (t: number) => f.run(noise()) * Math.exp(-45 * t) * 2.2 + Math.sin(640 * TAU * t) * Math.exp(-60 * t) * 0.35
  }

  /** دف. */
  const dafVoice = () => {
    const f = new Biquad().set("bp", 6200, 2.2)
    return (t: number) =>
      Math.sin(TAU * (52 * t + (60 / 14) * (1 - Math.exp(-14 * t)))) *
        Math.exp(-7 * t) *
        Math.min(1, 600 * t) *
        0.9 +
      f.run(noise()) * (Math.exp(-28 * t) + (t > 0.018 ? 0.5 * Math.exp(-30 * (t - 0.018)) : 0)) * 0.9
  }

  /** کوس — طبلِ بزرگ. */
  const kos = (t: number) =>
    Math.sin(TAU * (40 * t + (50 / 9) * (1 - Math.exp(-9 * t)))) * Math.exp(-3.2 * t) * Math.min(1, 400 * t) +
    (t < 0.02 ? 0.35 * noise() * (1 - t / 0.02) : 0)

  /** زیل. */
  const zil = (t: number) =>
    0.25 *
      [1, 1.48, 2.31, 3.17].reduce(
        (acc, n, h) => acc + Math.sin(1900 * TAU * n * t) * Math.exp(-t * (2.2 + h)),
        0,
      ) *
    Math.min(1, 3000 * t)

  const K = CHARACTERS[character]

  // ── آغاز ─────────────────────────────────────────────────────────
  const first = onsets[0]
  place(first, 0.35, (t) => Math.sin(TAU * (900 * t - 600 * t * t)) * Math.exp(-18 * t), {
    gain: 0.2,
    verb: 0.4,
  })
  if (K.kos) {
    place(first, 2.2, kos, { gain: 0.75, verb: 0.35 })
    place(first, 1.6, zil, { gain: 0.1, pan: 0.2, verb: 0.5 })
  } else {
    place(first, 0.7, dafVoice(), { gain: 0.28, verb: 0.3 })
  }
  // واخوانِ زیر و بم
  ;[tonic - 12, tonic + 7].forEach((n, i) =>
    place(first + 0.02 * i, 2.4, stringVoice(hz(n)), {
      gain: 0.12,
      pan: (i - 0.5) * 0.4,
      verb: 0.55,
    }),
  )

  // ── هجاها ────────────────────────────────────────────────────────
  let idx = 0
  hemis.forEach((h, hi) => {
    const count = h.longs.length
    const hemiStart = onsets[idx]

    h.longs.forEach((long, si) => {
      const at = onsets[idx++]
      const dur = (long ? 2 : 1) * unit
      const note = melody[hi][si]
      const pan = Math.max(-0.5, Math.min(0.5, 0.5 - si / Math.max(1, count - 1)))
      const accent = h.footStart[si] ? 1.15 : 1

      // کوبه: هجای بلند بم‌تر و کشیده‌تر
      place(at, 0.7, long ? tom : bakVoice(), {
        gain: (long ? 0.6 * (K.tom as number) : 0.3 * (K.bak as number)) * accent,
        pan: long ? 0 : 0.18,
        verb: 0.12,
      })
      if (K.gallop && long) {
        place(at + unit, 0.5, bakVoice(), { gain: 0.16 * (K.bak as number), pan: -0.15, verb: 0.12 })
      }

      // ملودی: روی هجای بلند ریز می‌زنیم، روی کوتاه یک ضربه
      if (long) {
        const span = dur * (K.riz as number)
        for (let k = 0; 0.045 * k < span; k++) {
          place(at + 0.045 * k, k ? 0.55 : 1.3, stringVoice(hz(note)), {
            gain: 0.26 * (K.santur as number) * (k ? 0.42 * (1 - (0.045 * k) / span) : 1),
            pan: -(0.4 * pan) + (k % 2 ? 0.08 : -0.08),
            verb: 0.45,
          })
        }
      } else {
        place(at, 1.6, stringVoice(hz(note)), {
          gain: 0.3 * (K.santur as number),
          pan: -(0.4 * pan),
          verb: 0.45,
        })
      }

      // بم
      if (hi || K.low) {
        place(at + 0.012, 1.6, stringVoice(hz(note - 12)), {
          gain: Math.max(hi ? 0.12 : 0, K.low as number),
          pan: 0.3 * pan,
          verb: 0.4,
        })
      }

      // نی — فقط در شخصیت‌های عرفانی و تأملی
      if (K.ney) {
        const f = hz(note)
        const span = dur + 0.25
        const bp = new Biquad().set("bp", 2 * f, 2.5)
        let phase = 0
        place(
          at,
          span,
          (t) => {
            const vib = 1 + 0.004 * Math.sin(5.2 * TAU * t) * Math.min(1, Math.max(0, (t - 0.15) / 0.3))
            const env = Math.min(1, t / 0.07) * Math.min(1, Math.max(0, (span - t) / 0.18))
            phase += (TAU * f * vib) / SR
            return (0.8 * Math.sin(phase) + 0.18 * Math.sin(2 * phase) + 0.07 * Math.sin(3 * phase) + 0.3 * bp.run(noise())) * env
          },
          { gain: K.ney as number, pan: 0.1, verb: 0.55 },
        )
      }

      // آغازِ هر رکن: تأکید
      if (h.footStart[si]) {
        if (K.daf) place(at, 0.6, dafVoice(), { gain: (hi ? 0.3 : 0.24) * (K.daf as number), pan: 0.05, verb: 0.25 })
        if (K.kos && si) place(at, 1.6, kos, { gain: 0.68, verb: 0.3 })
        if (K.kaf) {
          const bp = new Biquad().set("bp", 1300, 1.2)
          place(
            at,
            0.25,
            (t) =>
              bp.run(noise()) *
              ([0, 0.011, 0.021].reduce(
                (acc, e) => acc + (t >= e ? Math.exp(-90 * (t - e)) : 0),
                0,
              ) +
                0.3 * Math.exp(-18 * t)),
            { gain: K.kaf as number, pan: -0.25, verb: 0.3 },
          )
        }
      }
    })

    // در شخصیتِ حماسی، دنبالهٔ کوس تا پیش از مصراعِ بعد
    if (K.kos) {
      const until = idx < onsets.length ? onsets[idx] - 2 * unit : cadence
      const base = hz(tonic - 24)
      const span = until - hemiStart + 0.4
      place(
        hemiStart,
        span,
        (t) => {
          const env = Math.min(1, t / (0.35 * span)) * Math.min(1, Math.max(0, (span - t) / 0.5))
          let sum = 0
          for (let n = 1; n <= 6; n++) sum += Math.sin(TAU * base * n * t) / n ** 1.3
          return sum * env
        },
        { gain: 0.035, verb: 0.4 },
      )
      if (hi) place(hemiStart, 1.4, zil, { gain: 0.07, pan: -0.2, verb: 0.5 })
    }
  })

  // ── فرود ─────────────────────────────────────────────────────────
  const outro = cadence + Math.min(2.8, tail - 0.4)
  place(
    0.1,
    outro,
    (t) => {
      const n = Math.min(1, t / 0.8) * Math.min(1, Math.max(0, (outro - t) / 1.8))
      return (
        (0.8 * Math.sin(TAU * hz(tonic - 24) * t) +
          0.35 * Math.sin(TAU * hz(tonic - 17) * t + 0.4 * Math.sin(0.2 * TAU * t)) +
          0.18 * Math.sin(TAU * hz(tonic - 12) * t)) *
        n
      )
    },
    { gain: K.kos ? 0.04 : 0.06, verb: 0.3 },
  )

  // ── بازآوا (شانه‌ها و تمام‌گذرها) ────────────────────────────────
  const wet = [new Float32Array(len), new Float32Array(len)]
  const COMBS = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617]
  const ALLPASS = [556, 441, 341, 225]
  ;[0, 23].forEach((offset, ch) => {
    const out = wet[ch]
    for (const delay of COMBS) {
      const n = Math.round(delay + offset)
      const buf = new Float32Array(n)
      let r = 0
      let lp = 0
      for (let i = 0; i < len; i++) {
        const v = buf[r]
        lp = 0.75 * v + 0.25 * lp
        buf[r] = 0.015 * send[i] + 0.85 * lp
        out[i] += v
        r = (r + 1) % n
      }
    }
    for (const delay of ALLPASS) {
      const n = Math.round(delay + offset)
      const buf = new Float32Array(n)
      let r = 0
      for (let i = 0; i < len; i++) {
        const v = buf[r]
        const x = out[i]
        out[i] = v - x
        buf[r] = x + 0.5 * v
        r = (r + 1) % n
      }
    }
  })

  // ── تراز و محدودکننده ────────────────────────────────────────────
  let energy = 0
  for (let i = 0; i < len; i++) energy += (dryL[i] + wet[0][i]) ** 2 + (dryR[i] + wet[1][i]) ** 2
  const norm =
    1.4 * Math.min(2.2, Math.max(0.5, 0.135 / Math.max(1e-6, 1.4 * Math.sqrt(energy / (2 * len)))))

  let peak = 0
  for (let i = 0; i < len; i++) {
    const l = (dryL[i] + wet[0][i]) * norm
    const r = (dryR[i] + wet[1][i]) * norm
    const mag = Math.max(Math.abs(l), Math.abs(r))
    peak = mag > peak ? peak + (mag - peak) * 0.2 : 0.99985 * peak
    const limiter = (peak > 0.82 ? 0.82 / peak : 1) * Math.min(1, (len - i) / (SR / 2))
    dryL[i] = Math.tanh(l * limiter)
    dryR[i] = Math.tanh(r * limiter)
  }

  return { left: dryL, right: dryR, sr: SR, onsets, cadence, duration: total }
}

/* ── نیمه‌هایی که روی صحنه می‌آیند ─────────────────────────────────────── */

/**
 * `bareHemi` یِ یک وزن را به دو نیمه‌یِ هم‌شکل تبدیل می‌کند.
 *
 * ⚠️ در سایتِ اصلی همین است: یک بیت دو مصراعِ هم‌وزن دارد، پس الگویِ وزن
 *    **دو بار** تکرار می‌شود (`hemis:[bareHemi(feet), bareHemi(feet)]`) و
 *    نه اینکه یک الگو به دو نیمه تقسیم شود. نیمه‌کردنِ الگو ارکانِ آخر را
 *    می‌بُرد و وزنِ شاهنامه را «فعولن فعولن فعولن فعولن» نشان می‌داد.
 */
export function buildHemis(feet: string): Hemi[] {
  const bare = bareHemi(feet)
  if (!bare.length) return []
  return [bare, bare].map((h) => ({
    longs: h.map((x) => x.long),
    footStart: h.map((x, i) => i === 0 || (x.foot >= 0 && x.foot !== h[i - 1].foot)),
  }))
}

/* ── کشِ پارتیتور ────────────────────────────────────────────────────── */

export type ScoreInput = Parameters<typeof renderScore>[0]

/**
 * کلیدِ کش — همان رشته‌ای که سایت می‌سازد:
 * `mode|unit|character|` و سپس برای هر مصراع `longs/footStart`.
 */
export function scoreKey(input: ScoreInput): string {
  return (
    `${input.mode}|${input.unit}|${input.character}|` +
    input.hemis
      .map((h) => h.longs.map(Number).join("") + "/" + h.footStart.map(Number).join(""))
      .join("|")
  )
}

/**
 * حافظه‌ی پارتیتورها.
 *
 * ⚠️ درست مانندِ سایت، **خودِ promise** کش می‌شود نه نتیجه‌اش: اگر کاربر دوباره
 *    روی همان ریتم بزند، همان promise برمی‌گردد و پخش بی‌درنگ شروع می‌شود و
 *    دیگر «کوک ساز…» دیده نمی‌شود. سایت همزمان روی اشاره‌گرِ ماوس هم از پیش
 *    می‌سازد (`setTimeout(…, 350)`)، برای همین معمولاً پیش از کلیک آماده است.
 *
 * سقفش شش پارتیتور است و کهنه‌ترین بیرون می‌رود.
 */
const SCORE_CACHE = new Map<string, Promise<ReturnType<typeof renderScore> | null>>()

/** پارتیتوری از کش؛ اگر نباشد، می‌سازد و در کش می‌گذارد. */
export function renderCached(
  input: ScoreInput
): Promise<ReturnType<typeof renderScore> | null> {
  const key = scoreKey(input)
  let pending = SCORE_CACHE.get(key)
  if (!pending) {
    pending = new Promise((resolve) => {
      // رندر سنگین است (~۰٫۳ ثانیه)؛ با یک دور تأخیر می‌افتد تا مرورگر اول
      // حالتِ «کوک ساز…» را نشان بدهد و بعد رندر انجام شود.
      setTimeout(() => {
        try {
          resolve(renderScore(input))
        } catch {
          resolve(null)
        }
      }, 0)
    })
    SCORE_CACHE.set(key, pending)
    if (SCORE_CACHE.size > 6) {
      const oldest = SCORE_CACHE.keys().next().value
      if (oldest !== undefined) SCORE_CACHE.delete(oldest)
    }
  }
  return pending
}
