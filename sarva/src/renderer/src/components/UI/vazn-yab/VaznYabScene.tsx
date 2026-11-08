"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import sty from "./vazn-yab.module.css";
import { findMeterLocally } from "@/lib/aruz";
import { RHYTHM_MODES, RHYTHM_SPEEDS } from "@/lib/vazn-yab/rhythm";
import { ARKAN } from "@/lib/aruz/meters";

/**
 * ماژولِ اصلیِ وزن‌یاب — همان «صحنه»‌ای که در صفحه‌ی سایت هست.
 *
 * ⚠️ این کامپوننت جایگزینِ «نمایشِ تقلیدی»‌ای می‌شود که پیش از این در این
 *    پورت بود: یک صحنه‌ی سه‌بعدی که وانمود می‌کرد بیتی را تایپ و تحلیل
 *    می‌کند. روی سایتِ واقعی چنین چیزی نیست — آن بالا یک ابزارِ واقعی است که
 *    یک نمونه (متقارب مثمن محذوف · شاهنامه) را نشان می‌دهد و کاربر در همان
 *    ماژول بیت می‌نویسد و جواب می‌گیرد. این همان ساختار است.
 *
 * ساختار و کلاس‌ها از DOMِ زنده‌ی /vazn-yab استخراج شده‌اند (۲۰۲۶-۱۱-۰۸).
 */

type ModeId = (typeof RHYTHM_MODES)[number]["id"];
type SpeedId = (typeof RHYTHM_SPEEDS)[number]["id"];

/** نمونه‌ای که پیش از هر جست‌وجو نشان داده می‌شود. */
const SAMPLE = {
  badge: "نمونه",
  title: "متقارب مثمن محذوف · شاهنامه",
  feet: "فعولن فعولن فعولن فعل",
  mesra1: "تَوانا بُوَد هر که دانا بُوَد",
  mesra2: "ز دانش دل پیر برنا بُوَد",
};

function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  layoutId,
}: {
  label: string;
  options: readonly { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
  layoutId: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
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
            onClick={() => onChange(o.id)}
            className={` relative rounded-full px-3.5 py-1.5 transition-colors disabled:cursor-not-allowed ${
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
                className=" absolute inset-0 rounded-full bg-card shadow-sm"
              />
            )}
            <span className=" relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

const patternOf = (feet: string) =>
  feet
    .split(/\s+/)
    .filter(Boolean)
    .map((f) => ARKAN[f] ?? "")
    .join("");

export default function VaznYabScene() {
  // پیش‌فرض‌ها همان‌هایی است که صفحه‌ی واقعی نشان می‌دهد
  const [mode, setMode] = useState<ModeId>("chahargah");
  const [speed, setSpeed] = useState<SpeedId>("normal");
  const [master, setMaster] = useState(false);

  const [mesra1, setMesra1] = useState("");
  const [mesra2, setMesra2] = useState("");
  const [result, setResult] = useState<{ title: string; feet: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const shown = result ?? { title: SAMPLE.title, feet: SAMPLE.feet };
  const isSample = result === null;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const guess = findMeterLocally(mesra1, mesra2 || undefined);
    if (!guess) {
      setResult(null);
      setError("وزن این بیت پیدا نشد. مصراع‌ها را درست بنویس، یا «بیت تصادفی» را بزن.");
      return;
    }
    setResult({ title: guess.name, feet: guess.ark });
  };

  const onRandom = () => {
    // همان بیتِ نمونه را می‌آورد؛ روی سایت این دکمه از گنجور می‌خواند.
    setMesra1(SAMPLE.mesra1.replace(/[ًَُِّْٓ]/g, ""));
    setMesra2(SAMPLE.mesra2.replace(/[ًَُِّْٓ]/g, ""));
    setResult(null);
    setError(null);
  };

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(shown.feet);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* دسترسی نبود؛ کاری نمی‌شود کرد */
    }
  };

  return (
    <div className=" relative z-30 mx-auto mt-5 w-full max-w-5xl">
      <div className={sty.scene}>
        <div className={` ${sty.glow}`} aria-hidden />
        <section className={` scroll-mt-24 overflow-hidden rounded-4xl ${sty.glass}`}>
          {/* ── نتیجه / نمونه ───────────────────────────────────────── */}
          <div className=" flex flex-col gap-4 px-5 pt-6 sm:flex-row sm:items-start sm:justify-between sm:gap-6 sm:px-8 sm:pt-8">
            <div className=" min-w-0">
              <span className=" text-xs font-medium text-muted-foreground">
                {isSample ? SAMPLE.badge : "وزن"}
              </span>
              <h2 className=" mt-1.5 text-2xl leading-snug font-black text-foreground sm:text-3xl">
                {shown.title}
              </h2>
              <p className=" mt-1 text-sm text-muted-foreground">{shown.feet}</p>
              {error && <p className=" mt-2 text-sm text-destructive">{error}</p>}
            </div>
            <div className=" flex shrink-0 flex-row-reverse flex-wrap items-center justify-end gap-2 sm:flex-col sm:items-end">
              <PlayButton
                feet={shown.feet}
                mode={mode}
                speed={speed}
                speedFactor={RHYTHM_SPEEDS.find((s) => s.id === speed)!.factor}
              />
            </div>
          </div>

          {/* ── دستگاه، سرعت، کپی ───────────────────────────────────── */}
          <div className=" flex flex-wrap items-center justify-between gap-4 px-5 pb-6 sm:px-8 sm:pb-8">
            <div className=" flex flex-wrap items-center gap-2">
              <Segmented
                label="دستگاه"
                options={RHYTHM_MODES}
                value={mode}
                onChange={setMode}
                layoutId="vy-mode-pill"
              />
              <Segmented
                label="سرعت"
                options={RHYTHM_SPEEDS}
                value={speed}
                onChange={setSpeed}
                layoutId="vy-speed-pill"
              />
            </div>
            <button
              type="button"
              aria-label="کپی تقطیع"
              onClick={onCopy}
              className={` flex size-9 items-center justify-center rounded-full text-muted-foreground transition hover:text-foreground ${sty.chip}`}
            >
              {copied ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className=" size-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m5 12.5 4.5 4.5L19 7.5" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className=" size-4">
                  <rect x="9" y="9" width="11" height="11" rx="2.5" />
                  <path strokeLinecap="round" d="M5 15V6a2 2 0 0 1 2-2h8" />
                </svg>
              )}
            </button>
          </div>

          {/* ── فرم ─────────────────────────────────────────────────── */}
          <form onSubmit={onSubmit} className={` border-t ${sty.rule}`}>
            <div className=" flex flex-wrap items-center justify-between gap-3 px-5 pt-6 sm:px-8 sm:pt-8">
              <Segmented
                label="حالت"
                options={
                  [
                    { id: "normal", label: "معمولی" },
                    { id: "master", label: "استادی" },
                  ] as const
                }
                value={master ? "master" : "normal"}
                onChange={(id) => setMaster(id === "master")}
                layoutId="vy-mode-pill-2"
              />
              <button
                type="button"
                onClick={onRandom}
                className={` inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold text-foreground transition hover:text-primary active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 ${sty.chip}`}
              >
                بیت تصادفی
              </button>
            </div>

            <div className=" grid gap-8 px-5 pb-8 pt-6 sm:px-8 lg:grid-cols-2 lg:gap-12">
              <label className=" block">
                <span className=" block text-xs font-semibold text-muted-foreground sm:text-sm">
                  مصراع اول
                </span>
                <input
                  type="text"
                  value={mesra1}
                  onChange={(e) => setMesra1(e.target.value)}
                  placeholder={SAMPLE.mesra1}
                  className=" peer w-full border-0 border-b border-border bg-transparent py-2.5 text-right text-lg font-medium text-foreground outline-none transition-colors placeholder:text-muted-foreground/40 focus:outline-none aria-invalid:border-destructive disabled:opacity-60 sm:text-xl"
                />
              </label>
              <label className=" block">
                <span className=" block text-xs font-semibold text-muted-foreground sm:text-sm">
                  مصراع دوم
                </span>
                <input
                  type="text"
                  value={mesra2}
                  onChange={(e) => setMesra2(e.target.value)}
                  placeholder={SAMPLE.mesra2}
                  className=" peer w-full border-0 border-b border-border bg-transparent py-2.5 text-right text-lg font-medium text-foreground outline-none transition-colors placeholder:text-muted-foreground/40 focus:outline-none aria-invalid:border-destructive disabled:opacity-60 sm:text-xl"
                />
              </label>
            </div>

            {master && (
              <p className=" px-5 pb-2 text-xs text-muted-foreground sm:px-8 sm:text-sm">
                پیش از دیدن جواب، ارکان را به ترتیب کنارِ هم بچین.
              </p>
            )}

            <div
              className={` flex flex-col-reverse gap-4 border-t px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8 ${sty.rule}`}
            >
              <p className=" min-w-0 text-xs text-muted-foreground sm:text-sm">
                کل بیت را هم می‌شود یک‌جا چسباند.
              </p>
              <button
                type="submit"
                className=" inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-2xl px-8 font-bold transition active:scale-[0.97] disabled:cursor-not-allowed sm:ms-auto bg-primary text-primary-foreground shadow-sm hover:brightness-110 disabled:opacity-70"
              >
                پیدا کن
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

/**
 * دکمهٔ «پخش ریتم».
 *
 * صدا با سازهای واقعی ساخته می‌شود (دف، تمبک، سنتور) — نه با یک موجِ ساده.
 */
function PlayButton({
  feet,
  mode,
  speed,
  speedFactor,
}: {
  feet: string;
  mode: ModeId;
  speed: SpeedId;
  speedFactor: number;
}) {
  const [playing, setPlaying] = useState(false);
  const token = useRef(0);

  useEffect(() => {
    let cancelled = false;
    token.current += 1;
    // تغییرِ وزن یا تنظیمات یعنی پخشِ قبلی بی‌اعتبار است
    setPlaying(false);
    return () => {
      cancelled = true;
    };
  }, [feet, mode, speed]);

  const onClick = async () => {
    const mine = ++token.current;
    setPlaying(true);
    const { playRhythm, stopRhythm } = await import("@/lib/vazn-yab/rhythm");
    const { ok, duration } = await playRhythm(patternOf(feet), { mode, speed });
    if (mine !== token.current) return;
    setPlaying(ok);
    if (ok) {
      window.setTimeout(() => {
        if (mine === token.current) {
          setPlaying(false);
          stopRhythm();
        }
      }, duration * 1000 + 200);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="پخش"
      className=" inline-flex h-12 items-center gap-2.5 rounded-full bg-primary ps-1.5 pe-6 font-bold text-primary-foreground shadow-sm transition hover:brightness-110 active:scale-95 disabled:opacity-60"
    >
      <span className=" flex size-9 items-center justify-center rounded-full bg-primary-foreground/15">
        <AnimatePresence mode="wait" initial={false}>
          {playing ? (
            <motion.span
              key="bars"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className=" flex h-3.5 items-end gap-0.5"
            >
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className=" w-0.5 animate-pulse rounded-full bg-current"
                  style={{ height: `${[60, 100, 40][i]}%`, animationDelay: `${120 * i}ms` }}
                />
              ))}
            </motion.span>
          ) : (
            <motion.svg
              key="play"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              viewBox="0 0 24 24"
              fill="currentColor"
              className=" size-3.5"
            >
              <path d="M7 5.5v13a1 1 0 0 0 1.5.86l11-6.5a1 1 0 0 0 0-1.72l-11-6.5A1 1 0 0 0 7 5.5Z" />
            </motion.svg>
          )}
        </AnimatePresence>
      </span>
      پخش ریتم
    </button>
  );
}
