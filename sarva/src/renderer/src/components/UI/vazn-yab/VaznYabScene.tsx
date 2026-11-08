"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import sty from "./vazn-yab.module.css";
import VaznYabStage, { type Clock } from "./VaznYabStage";
import { GuessBar, VerdictBar } from "./VaznYabGuess";
import { findMeterLocally } from "@/lib/aruz";
import {
  bareHemi,
  characterOf,
  CHARACTER,
  judgeGuess,
  marksText,
  patternOf,
  scanFeet,
  splitFeet,
  voicingOf,
  type Verdict,
} from "@/lib/vazn-yab/prosody";
import { buildHemis, renderCached, scoreKey, type ScoreInput } from "@/lib/vazn-yab/score";
import { RHYTHM_MODES, RHYTHM_SPEEDS, type RhythmMode, type SpeedId } from "@/lib/vazn-yab/rhythm";
import { fetchGanjoorMeter, fetchRandomBeyt, GANJOOR_ERROR, type Beyt, type GanjoorMeter } from "@/lib/vazn-yab/ganjoor";
import { copyText } from "@/lib/vazn-yab/clipboard";
import { celebrate } from "@/components/exam/celebrate";
import { FAMOUS_METERS, type FamousMeter } from "@/data/seeds/meters";
import FamousMeters from "./FamousMeters";

/**
 * ماژولِ اصلیِ وزن‌یاب — پورتِ کاملِ رفتارِ صفحه‌ی زنده (۲۰۲۶-۱۱-۰۸).
 *
 * همه‌ی رفتارهای اصلی اینجا هست: نمونه، پخشِ ریتم با صحنه و توپ، دستگاه و
 * سرعت بر پایه‌ی «شخصیتِ وزن»، رونوشتِ تقطیع، بیتِ تصادفی از گنجور، چسباندنِ
 * هوشمندِ کلِ بیت، حالتِ استادی با داوری، و نشانِ «ثبت‌شده در گنجور».
 */

/** نمونه‌ای که پیش از هر جست‌وجو نشان داده می‌شود — وزنِ شاهنامه. */
const SAMPLE = FAMOUS_METERS.find((m) => m.nick === "شاهنامه") ?? FAMOUS_METERS[0];

type Result = {
  key: string
  feet: string
  bahr: string
  famous: boolean
  guess: string[]
  verdict: Verdict
  reference: { url: string } | null
  couplet: string
}

const FIELDS = [
  { name: "poem1", label: "مصراع اول", placeholder: "تَوانا بُوَد هر که دانا بُوَد" },
  { name: "poem2", label: "مصراع دوم", placeholder: "ز دانش دل پیر برنا بُوَد" },
];

const easeOutExpo = [0.16, 1, 0.3, 1] as const;

function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  layoutId,
  disabled,
  tour,
}: {
  label: string
  options: readonly { id: T; label: string }[]
  value: T
  onChange: (id: T) => void
  layoutId: string
  disabled?: boolean
  tour?: string
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      data-tour={tour}
      className={` relative inline-flex rounded-full p-1 text-xs font-semibold sm:text-sm ${sty.chip}`}
    >
      {options.map((o) => {
        const active = value === o.id;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(o.id)}
            className={` relative rounded-full px-3.5 py-1.5 transition-colors disabled:cursor-not-allowed ${
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
                className=" absolute inset-0 rounded-full bg-card shadow-sm dark:bg-white/12"
              />
            )}
            <span className=" relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/** کلیدی که نشان می‌دهد چه چیزی هم‌اکنون روی صحنه است. */
const keyOf = (feet: string, tag: string) => `${tag}:${feet}`;

export default function VaznYabScene() {
  const [modeOverride, setModeOverride] = useState<{ feet: string; mode: RhythmMode } | null>(null);
  const [speed, setSpeed] = useState<SpeedId>("normal");

  const [result, setResult] = useState<Result | null>(null);
  const [sample, setSample] = useState<FamousMeter>(SAMPLE);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [master, setMaster] = useState(false);
  const [guess, setGuess] = useState<string[]>([]);
  const [guessMissing, setGuessMissing] = useState(false);

  const [poem1, setPoem1] = useState("");
  const [poem2, setPoem2] = useState("");
  const [randomBeyt, setRandomBeyt] = useState<Beyt | null>(null);

  const [copied, setCopied] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [audioState, setAudioState] = useState<"idle" | "preparing" | "playing">("idle");

  const clock = useRef<Clock>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const tokenRef = useRef(0);
  const sectionRef = useRef<HTMLElement | null>(null);

  const showing = result ?? null;
  const feet = showing?.feet ?? sample.feet;
  const bahr = showing?.bahr ?? (sample.nick ? `${sample.bahr} · ${sample.nick}` : sample.bahr);
  const version = showing ? keyOf(feet, "result") : keyOf(feet, "famous");

  // ── تنظیماتِ نواخت بر پایه‌ی شخصیتِ وزن ─────────────────────────────
  const speedFactor = RHYTHM_SPEEDS.find((s) => s.id === speed)!.factor;
  const voicing = useMemo(
    () => voicingOf(feet, speedFactor, modeOverride?.feet === feet ? modeOverride.mode : undefined),
    [feet, speedFactor, modeOverride],
  );

  /** توصیفِ پارتیتورِ جاری — همان چیزی که کلیدِ کش از آن ساخته می‌شود. */
  const scoreInput = useMemo<ScoreInput>(
    () => ({
      hemis: buildHemis(feet),
      unit: voicing.unit,
      mode: voicing.mode,
      character: voicing.character,
    }),
    [feet, voicing.unit, voicing.mode, voicing.character],
  )

  // ── صدا ────────────────────────────────────────────────────────────
  const stop = useCallback(() => {
    tokenRef.current += 1;
    try {
      sourceRef.current?.stop();
    } catch {
      /* پیش‌تر ایستاده */
    }
    sourceRef.current = null;
    clock.current = null;
    setAudioState("idle");
  }, []);

  /** یک پارتیتور را می‌نوازد؛ اگر از پیش ساخته شده باشد، بی‌درنگ. */
  const playScore = useCallback(
    async (input: ScoreInput) => {
      stop();
      const mine = ++tokenRef.current;
      if (!ctxRef.current) {
        try {
          ctxRef.current = new AudioContext();
        } catch {
          setAudioState("idle");
          return;
        }
      }
      const ac = ctxRef.current;
      ac.resume().catch(() => {});
      setAudioState("preparing");

      const score = await renderCached(input);
      if (mine !== tokenRef.current) return;
      if (!score || !score.left.length) {
        setAudioState("idle");
        return;
      }

      const buf = ac.createBuffer(2, score.left.length, score.sr);
      buf.copyToChannel(score.left, 0);
      buf.copyToChannel(score.right, 1);
      const src = ac.createBufferSource();
      src.buffer = buf;
      src.connect(ac.destination);
      const startAt = ac.currentTime + 0.06;
      src.onended = () => {
        if (sourceRef.current === src) {
          sourceRef.current = null;
          clock.current = null;
          setAudioState("idle");
        }
      };
      sourceRef.current = src;
      clock.current = { ctx: ac, start: startAt, score };
      src.start(startAt);
      setAudioState("playing");
    },
    [stop],
  );

  /** دکمه‌ی «پخش ریتم»: پارتیتور را برای وزن و تنظیماتِ جاری می‌سازد و می‌نوازد. */
  const play = useCallback(async () => {
    // یک بیت دو مصراعِ هم‌وزن دارد: الگو دو بار تکرار می‌شود.
    await playScore(scoreInput);
  }, [playScore, scoreInput]);

  // تغییرِ وزن یا تنظیمات یعنی پخشِ پیشین بی‌اعتبار است
  useEffect(() => {
    stop();
  }, [scoreInput, stop]);

  useEffect(() => () => stop(), [stop]);

  // ── جشن بعد از داوری ──────────────────────────────────────────────
  // همان افکتی که روی سایت هست: ۲۵۰ میلی‌ثانیه بعد از نشستنِ نتیجه، صدا،
  // لرزش (روی موبایل) و — فقط برای حدسِ درست — کاغذرنگ از تابلوی داوری.
  /**
   * پیش‌ساختِ پارتیتور وقتی اشاره‌گر واردِ ماژول می‌شود.
   *
   * این همان چیزی است که در سایت باعث می‌شود زدنِ «پخش ریتم» معمولاً بی‌درنگ
   * باشد: پارتیتور ۳۵۰ میلی‌ثانیه پس از ورودِ ماوس از پیش ساخته می‌شود، پس تا
   * کاربر دکمه را پیدا کند در کش است و دیگر «کوک ساز…» دیده نمی‌شود.
   */
  useEffect(() => {
    if (!hovered) return;
    const t = setTimeout(() => {
      void renderCached(scoreInput);
    }, 350);
    return () => clearTimeout(t);
  }, [hovered, scoreInput]);

  const celebrated = useRef("");
  useEffect(() => {
    if (loading || !result?.verdict || celebrated.current === result.key) return;
    celebrated.current = result.key;
    const kind =
      result.verdict === "right" ? "correct" : result.verdict === "close" ? "partial" : "wrong";
    const t = setTimeout(() => celebrate(kind, document.getElementById("vy-verdict")), 250);
    return () => clearTimeout(t);
  }, [loading, result]);

  // ── جست‌وجو ────────────────────────────────────────────────────────
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (master && !guess.length) {
      setGuessMissing(true);
      return;
    }
    setGuessMissing(false);
    setError(null);
    setLoading(true);

    // دست‌کم ۹۰۰ میلی‌ثانیه صبر می‌کنیم تا «در حال جستجو» دیده شود.
    const minimum = new Promise((r) => setTimeout(r, 900));
    const couplet = `${(poem1 ?? "").trim()}\n${(poem2 ?? "").trim()}`;

    try {
      // اگر بیت از گنجور آمده و وزنش همراه بود، همان را به کار می‌بریم.
      const known =
        randomBeyt?.meter && couplet === `${randomBeyt.couplet.first}\n${randomBeyt.couplet.second}`
          ? randomBeyt.meter
          : null;

      // موتورِ محلی هم‌زمان شروع می‌کند؛ فقط اگر گنجور جوابی ندهد به کار می‌آید.
      const local = known
        ? Promise.resolve<string | null>(null)
        : Promise.resolve(findMeterLocally(poem1, poem2 || undefined)?.rhythm ?? null);

      const reference: GanjoorMeter | null = known
        ? { rhythm: known, source: "ganjoor", url: randomBeyt?.url }
        : await fetchGanjoorMeter(poem1, poem2);

      const found = reference?.rhythm ?? (await local);

      if (!found) {
        await minimum;
        setResult(null);
        setNotFound(true);
        return;
      }

      const feetOnly = found.replace(/\s*\([^)]*\)\s*$/, "").trim();
      const bahrOnly = (found.match(/\(([^)]*)\)\s*$/)?.[1].trim() ?? "") || "نام بحر ثبت نشده";

      await minimum;
      setResult({
        key: `result:${couplet}:${feetOnly}`,
        feet: feetOnly,
        bahr: bahrOnly,
        famous: false,
        guess: master ? guess : [],
        // سایت دقیقاً همین است: بدون مرجعِ گنجور نمره‌ای داده نمی‌شود.
        verdict: master && reference && feetOnly ? judgeGuess(guess, feetOnly) : null,
        reference,
        couplet,
      });
      setNotFound(false);
    } catch {
      setError("مشکلی پیش آمد. دوباره امتحان کن.");
    } finally {
      setLoading(false);
      scrollToStage();
    }
  };

  const reset = () => {
    setResult(null);
    setNotFound(false);
    setError(null);
    setGuess([]);
    setGuessMissing(false);
  };

  const scrollToStage = () => {
    const el = sectionRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.top < 0 || r.top > 0.35 * window.innerHeight) {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    }
  };

  // ── بیتِ تصادفی از گنجور ───────────────────────────────────────────
  const [fetching, setFetching] = useState(false);
  const onRandom = async () => {
    if (fetching) return; // محافظِ تکرارِ کلیک، مانندِ سایت
    setFetching(true);
    setError(null);
    try {
      const data = await fetchRandomBeyt();
      tokenRef.current += 1; // جست‌وجویِ در راه را بی‌اعتبار می‌کند
      setRandomBeyt(data);
      setPoem1(data.couplet.first);
      setPoem2(data.couplet.second);
      reset();
      setGuess([]);
    } catch (err) {
      // همان قاعده‌ی سایت: پیامِ خودش را نشان بده، مگر اینکه از جنسِ
      // abort/timeout/fetch باشد که در آن صورت پیامِ خودمان را می‌گذاریم.
      const msg = err instanceof Error ? err.message : "";
      setError(msg && !/abort|timeout|fetch/i.test(msg) ? msg : GANJOOR_ERROR);
    } finally {
      setFetching(false);
    }
  };

  // ── چسباندنِ هوشمند: اگر کلِ بیت چسبانده شود، خودش دو نیمه‌اش می‌کند ──
  const onPaste = (e: React.ClipboardEvent) => {
    const parts = e.clipboardData
      .getData("text")
      .split(/\r?\n|\t|\s*[/|*]+\s*|\s{3,}/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length >= 2) {
      e.preventDefault();
      setPoem1(parts[0]);
      setPoem2(parts[1]);
    }
  };

  // ── رونوشتِ تقطیع ──────────────────────────────────────────────────
  const onCopy = async () => {
    const rows = [
      bahr,
      feet,
      scanFeet(feet)
        ?.map((f) => marksText(f.marks))
        .join("   "),
    ].filter(Boolean);
    if (await copyText(rows.join("\n"))) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }
  };

  const playing = audioState === "playing";
  /** صحنه آرایه‌ی خامِ bareHemi را می‌گیرد (با شماره‌ی رکن)، نه longs/footStart. */
  const stageHemis = useMemo(() => [bareHemi(feet), bareHemi(feet)], [feet]);

  // همان `H()`ِ سایت: بیت با خطِ جدید جدا می‌شود.
  /**
   * برگزیدنِ یک وزن از «وزن‌های مشهور» — عیناً مانندِ سایت: وزن روی صحنه
   * می‌نشیند و **بی‌درنگ** با دستگاه و آهنگِ خودِ آن وزن نواخته می‌شود
   * (نه با تنظیماتِ دستیِ کاربر)، و اگر صحنه از دید خارج شده باشد صفحه می‌غلتد.
   */
  const pickFamous = useCallback(
    (m: FamousMeter) => {
      setSample(m);
      setResult(null);
      setNotFound(false);
      setModeOverride(null); // تنظیماتِ دستی برای این وزن بی‌معناست
      const v = voicingOf(m.feet, speedFactor);
      void playScore({
        hemis: buildHemis(m.feet),
        unit: v.unit,
        mode: v.mode,
        character: v.character,
      });
      const el = sectionRef.current;
      if (el && el.getBoundingClientRect().top < 0) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    },
    [speedFactor, playScore],
  );

  const isDirty = !!showing && showing.couplet === `${(poem1 ?? "").trim()}\n${(poem2 ?? "").trim()}`;
  const busy = loading || fetching;

  return (
    <div className=" relative z-30 mx-auto mt-5 w-full max-w-5xl">
      <div className={sty.scene}>
        <div aria-hidden className={sty.glow} />
        <section
          ref={sectionRef}
          onPointerEnter={() => setHovered(true)}
          className={` scroll-mt-24 overflow-hidden rounded-4xl ${sty.glass}`}
        >
          {/* ── عنوان / نتیجه ────────────────────────────────────── */}
          <div className=" flex flex-col gap-4 px-5 pt-6 sm:flex-row sm:items-start sm:justify-between sm:gap-6 sm:px-8 sm:pt-8">
            <div className=" min-w-0" aria-live="polite">
              <span className=" text-xs font-medium text-muted-foreground">
                {loading ? "در حال تحلیل وزن" : notFound ? "نتیجه" : showing ? "بحر" : "نمونه"}
              </span>
              <AnimatePresence mode="wait" initial={false}>
                <motion.h2
                  key={loading ? "loading" : notFound ? "none" : showing?.key ?? version}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.35, ease: easeOutExpo }}
                  className=" mt-1.5 text-2xl leading-snug font-black text-foreground sm:text-3xl"
                >
                  {loading ? "…" : notFound ? "وزنی پیدا نشد" : bahr}
                </motion.h2>
              </AnimatePresence>
              {!loading && !notFound && (
                <p className=" mt-1 text-sm text-muted-foreground">{splitFeet(feet).join("  ")}</p>
              )}
              {notFound && !loading && (
                <p className=" mt-1.5 text-sm text-muted-foreground">
                  هر مصراع را کامل و بدون غلط بنویس و دوباره امتحان کن.
                </p>
              )}
            </div>

            <div className=" flex shrink-0 flex-row-reverse flex-wrap items-center justify-end gap-2 sm:flex-col sm:items-end">
              {showing && !loading && (
                showing.reference ? (
                  <a
                    href={showing.reference.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className=" inline-flex items-center gap-1.5 rounded-full bg-green-600/10 px-3 py-1.5 text-xs font-bold text-green-700 transition hover:bg-green-600/15 dark:text-green-400"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden className=" size-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m5 12.5 4.5 4.5L19 7.5" />
                    </svg>
                    ثبت‌شده در گنجور
                  </a>
                ) : (
                  <span
                    title="این وزن با منبع تأیید نشده است."
                    className={` rounded-full px-3 py-1.5 text-xs font-bold text-muted-foreground ${sty.chip}`}
                  >
                    پیشنهاد موتور
                  </span>
                )
              )}

              {!notFound && (
                <button
                  type="button"
                  onClick={() => (audioState === "idle" ? play() : stop())}
                  disabled={loading}
                  aria-label={audioState === "idle" ? "پخش" : "توقف"}
                  className=" inline-flex h-12 items-center gap-2.5 rounded-full bg-primary ps-1.5 pe-6 font-bold text-primary-foreground shadow-sm transition hover:brightness-110 active:scale-95 disabled:opacity-60"
                >
                  <span className=" flex size-9 items-center justify-center rounded-full bg-primary-foreground/15">
                    {audioState === "preparing" ? (
                      <span className=" size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : playing ? (
                      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className=" size-3.5">
                        <rect x="6" y="6" width="12" height="12" rx="2.5" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className=" size-4">
                        <path d="M7 5.5v13a1 1 0 0 0 1.5.86l11-6.5a1 1 0 0 0 0-1.72l-11-6.5A1 1 0 0 0 7 5.5Z" />
                      </svg>
                    )}
                  </span>
                  {audioState === "preparing" ? "کوک ساز…" : playing ? "توقف" : "پخش ریتم"}
                </button>
              )}
            </div>
          </div>

          {/* ── صحنه‌ی تقطیع ─────────────────────────────────────── */}
          {!notFound && (
            <VaznYabStage
              hemis={stageHemis}
              feet={splitFeet(feet)}
              clock={clock}
              playing={playing}
              loading={loading}
              muted={notFound}
              version={version}
              cheer={showing?.verdict === "right" ? showing.key : ""}
            />
          )}

          {/* ── دستگاه، سرعت، رونوشت ─────────────────────────────── */}
          {!notFound && (
            <div className=" flex flex-wrap items-center justify-between gap-4 px-5 pb-6 sm:px-8 sm:pb-8">
              <div className=" flex flex-wrap items-center gap-2">
                <Segmented
                  label="دستگاه"
                  layoutId="vy-mode"
                  value={voicing.mode}
                  options={RHYTHM_MODES}
                  onChange={(m) => setModeOverride({ feet, mode: m })}
                />
                <Segmented
                  label="سرعت"
                  layoutId="vy-tempo"
                  value={speed}
                  options={RHYTHM_SPEEDS}
                  onChange={setSpeed}
                />
              </div>
              {!loading && (
                <button
                  type="button"
                  onClick={onCopy}
                  aria-label="کپی تقطیع"
                  title="کپی تقطیع"
                  className={` flex size-9 items-center justify-center rounded-full text-muted-foreground transition hover:text-foreground ${sty.chip}`}
                >
                  {copied ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className=" size-4" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m5 12.5 4.5 4.5L19 7.5" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className=" size-4" aria-hidden>
                      <rect x="8" y="8" width="12" height="12" rx="2.5" />
                      <path d="M16 8V6.5A2.5 2.5 0 0 0 13.5 4h-7A2.5 2.5 0 0 0 4 6.5v7A2.5 2.5 0 0 0 6.5 16H8" />
                    </svg>
                  )}
                </button>
              )}
            </div>
          )}

          {/* ── داوریِ حالتِ استادی ──────────────────────────────── */}
          <AnimatePresence initial={false}>
            {showing && !loading && showing.guess.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.4, ease: easeOutExpo }}
                className={` overflow-hidden border-t ${sty.rule}`}
              >
                <VerdictBar guess={showing.guess} feet={showing.feet} verdict={showing.verdict} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── فرم ─────────────────────────────────────────────── */}
          <form onSubmit={onSubmit} noValidate className={` border-t ${sty.rule}`}>
            <div className=" flex flex-wrap items-center justify-between gap-3 px-5 pt-6 sm:px-8 sm:pt-8">
              <Segmented
                label="حالت"
                tour="vy-master"
                layoutId="vy-mode-thumb"
                disabled={busy}
                value={master ? "master" : "plain"}
                options={[
                  { id: "plain", label: "معمولی" },
                  { id: "master", label: "استادی" },
                ]}
                onChange={(v) => {
                  setMaster(v === "master");
                  setGuessMissing(false);
                }}
              />
              <button
                type="button"
                onClick={onRandom}
                data-tour="vy-random"
                disabled={busy}
                className={` inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold text-foreground transition hover:text-primary active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 ${sty.chip}`}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  aria-hidden
                  className={` size-4 ${fetching ? "animate-spin" : ""}`}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.023 9.348h4.992V4.356m-.001 0-3.181 3.183a8.25 8.25 0 0 0-13.803 3.7M4.031 9.865v4.99m0 0h4.99m-4.99 0 3.181 3.182a8.25 8.25 0 0 0 13.803-3.7"
                  />
                </svg>
                بیت تصادفی
              </button>
            </div>

            <div className=" grid gap-8 px-5 pb-8 pt-6 sm:px-8 lg:grid-cols-2 lg:gap-12">
              {FIELDS.map((f, i) => {
                const value = i === 0 ? poem1 : poem2;
                const setValue = i === 0 ? setPoem1 : setPoem2;
                return (
                  <label key={f.name} className=" block">
                    <span className=" block text-xs font-semibold text-muted-foreground sm:text-sm">
                      {f.label}
                    </span>
                    <span className=" relative mt-2 block">
                      <input
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onPaste={i === 0 ? onPaste : undefined}
                        disabled={loading}
                        data-tour={i === 0 ? "vy-poem" : undefined}
                        data-bare
                        placeholder={f.placeholder}
                        autoComplete="off"
                        enterKeyHint={i === 0 ? "next" : "search"}
                        type="text"
                        dir="rtl"
                        className=" peer w-full border-0 border-b border-border bg-transparent py-2.5 text-right text-lg font-medium text-foreground outline-none transition-colors placeholder:text-muted-foreground/40 focus:outline-none aria-invalid:border-destructive disabled:opacity-60 sm:text-xl"
                      />
                      <span
                        aria-hidden
                        className=" pointer-events-none absolute inset-x-0 -bottom-px h-0.5 origin-right scale-x-0 rounded-full bg-primary transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] peer-focus:scale-x-100 peer-aria-invalid:bg-destructive"
                      />
                    </span>
                  </label>
                );
              })}
            </div>

            <AnimatePresence initial={false}>
              {master && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: easeOutExpo }}
                  className=" overflow-hidden"
                >
                  <GuessBar
                    guess={guess}
                    missing={guessMissing}
                    disabled={loading}
                    onChange={(next) => {
                      setGuess(next);
                      if (next.length) setGuessMissing(false);
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div
              className={` flex flex-col-reverse gap-4 border-t px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8 ${sty.rule}`}
            >
              <p className=" min-w-0 text-xs text-muted-foreground sm:text-sm">
                {error ? (
                  <span className=" text-destructive">{error}</span>
                ) : randomBeyt ? (
                  <>
                    {[randomBeyt.poet, randomBeyt.book, randomBeyt.poem].filter(Boolean).join("، ")}
                    {randomBeyt.url && (
                      <>
                        {" · "}
                        <a
                          href={randomBeyt.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className=" text-primary underline underline-offset-2"
                        >
                          گنجور
                        </a>
                      </>
                    )}
                  </>
                ) : (
                  "کل بیت را هم می‌شود یک‌جا چسباند."
                )}
              </p>

              {isDirty && !loading ? (
                <button
                  type="button"
                  onClick={() => {
                    setPoem1("");
                    setPoem2("");
                    reset();
                    setRandomBeyt(null);
                  }}
                  data-tour="vy-submit"
                  className={` inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-2xl px-8 font-bold transition active:scale-[0.97] sm:ms-auto text-foreground hover:text-primary ${sty.chip}`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden className=" size-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  بیت تازه
                </button>
              ) : (
                <button
                  type="submit"
                  data-tour="vy-submit"
                  disabled={loading || fetching}
                  className=" inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-2xl px-8 font-bold transition active:scale-[0.97] disabled:cursor-not-allowed sm:ms-auto bg-primary text-primary-foreground shadow-sm hover:brightness-110 disabled:opacity-70"
                >
                  {loading && (
                    <span className=" size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  )}
                  {loading ? "در حال جستجو" : "پیدا کن"}
                </button>
              )}
            </div>
          </form>
        </section>
      </div>

      {/* «وزن‌های مشهور» در سایت هم داخلِ همین قاب است، نه بیرونِ آن. */}
      <FamousMeters current={showing ? null : feet} playing={playing} onPick={pickFamous} />
    </div>
  );
}

export { SAMPLE, FAMOUS_METERS };
export type { FamousMeter };
