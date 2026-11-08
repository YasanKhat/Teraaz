"use client";

import { AnimatePresence, motion } from "motion/react";
import sty from "./vazn-yab.module.css";
import { GUESS_FEET, marksText, splitFeet, type Verdict } from "@/lib/vazn-yab/prosody";
import { ARKAN } from "@/lib/aruz/meters";

/**
 * حالتِ استادی و داوریِ حدس.
 *
 * ⚠️ پورتِ مستقیمِ کامپوننت‌های `q` و `Q` از بسته‌ی زنده‌ی سایت (۲۰۲۶-۱۱-۰۸).
 *    در حالتِ استادی کاربر پیش از دیدنِ جواب، ارکان را یکی‌یکی می‌چیند؛ بعد از
 *    «پیدا کن» هر رکن درست یا غلط علامت می‌خورد و کلِ حدس «درست»، «نزدیک»
 *    (ارکان درست ولی تعدادشان نه) یا «نشد» داوری می‌شود.
 */

const SPRING = { type: "spring" as const, stiffness: 520, damping: 32 };

export function GuessBar({
  guess,
  missing,
  disabled,
  onChange,
}: {
  guess: string[];
  missing: boolean;
  disabled: boolean;
  onChange: (next: string[]) => void;
}) {
  return (
    <div className={` border-t px-5 py-5 sm:px-8 ${sty.rule}`}>
      <div className=" flex items-center justify-between gap-3">
        <span className=" text-sm font-bold text-foreground">حدس تو</span>
        {guess.length > 0 && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange([])}
            className=" text-xs font-bold text-muted-foreground transition hover:text-destructive"
          >
            پاک کردن
          </button>
        )}
      </div>

      <div
        aria-live="polite"
        className={` mt-2 flex min-h-13 flex-wrap items-center gap-1.5 rounded-2xl border border-dashed p-2 transition-colors ${
          missing ? "border-destructive" : "border-border"
        }`}
      >
        <AnimatePresence initial={false} mode="popLayout">
          {guess.length ? (
            guess.map((g, n) => (
              <motion.button
                key={`${n}-${g}`}
                layout
                type="button"
                disabled={disabled}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={SPRING}
                onClick={() => onChange(guess.filter((_, i) => i !== n))}
                aria-label={`حذف ${g}`}
                className=" inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground"
              >
                {g}
                <span aria-hidden className=" text-xs opacity-75">
                  ×
                </span>
              </motion.button>
            ))
          ) : (
            <span className=" px-2 text-sm text-muted-foreground">رکن‌ها را به ترتیب انتخاب کن</span>
          )}
        </AnimatePresence>
      </div>

      {missing && (
        <span className=" mt-2 block text-sm font-bold text-destructive">
          اول وزن را حدس بزن.
        </span>
      )}

      <div className=" mt-3 flex flex-wrap gap-1.5">
        {GUESS_FEET.map((f) => (
          <button
            key={f}
            type="button"
            disabled={disabled || guess.length >= 8}
            onClick={() => onChange([...guess, f])}
            className={` inline-flex flex-col items-center gap-0.5 rounded-xl px-3 pb-1.5 pt-1.5 transition hover:text-primary active:scale-95 disabled:opacity-50 ${sty.chip}`}
          >
            <span className=" text-sm font-semibold">{f}</span>
            <span aria-hidden className=" text-[10px] leading-none tracking-widest text-muted-foreground">
              {marksText(ARKAN[f])}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/** تکان‌خوردنِ ملایم هنگامِ داوریِ غلط. */
const easeOutExpo = [0.16, 1, 0.3, 1] as const;

export function VerdictBar({
  guess,
  feet,
  verdict,
}: {
  guess: string[];
  feet: string;
  verdict: Verdict;
}) {
  const truth = splitFeet(feet);
  const tone =
    verdict === "right"
      ? "text-green-700 dark:text-green-400"
      : verdict === "close"
        ? "text-gold-ink dark:text-gold"
        : "text-destructive";
  const badge =
    verdict === "right" ? "bg-green-600/15" : verdict === "close" ? "bg-gold/15" : "bg-destructive/10";
  const icon =
    verdict === "right" ? "m5 12.5 4.5 4.5L19 7.5" : verdict === "close" ? "M6 12h12" : "M7 7l10 10M17 7 7 17";
  const text =
    verdict === "right"
      ? "درست حدس زدی."
      : verdict === "close"
        ? "ارکان درست است، ولی تعدادشان نه."
        : verdict === "wrong"
          ? "این بار نشد. ارکان درست را ببین."
          : "وزن مرجع تأیید نشد؛ حدست نمره‌گذاری نمی‌شود.";

  return (
    <div
      id="vy-verdict"
      className=" flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8"
    >
      <motion.p
        className={` flex items-center gap-3 font-bold ${verdict ? tone : "text-muted-foreground"}`}
        initial={false}
        animate={verdict === "wrong" ? { x: [0, -7, 7, -4, 4, 0] } : { x: 0 }}
        transition={{ duration: 0.45, delay: 0.15 }}
      >
        {verdict && (
          <motion.span
            aria-hidden
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 520, damping: 16, delay: 0.1 }}
            className={` flex size-9 shrink-0 items-center justify-center rounded-full ${badge}`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.6}
              strokeLinecap="round"
              strokeLinejoin="round"
              className=" size-4.5"
            >
              <motion.path
                d={icon}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.4, delay: 0.25, ease: easeOutExpo }}
              />
            </svg>
          </motion.span>
        )}
        {text}
      </motion.p>

      <div className=" flex flex-wrap items-center gap-2">
        <span className=" me-1 text-xs text-muted-foreground">حدس تو</span>
        {guess.map((g, i) => (
          <span
            key={i}
            className={` rounded-lg px-2.5 py-1 text-sm font-semibold ${
              !verdict
                ? "bg-secondary text-foreground"
                : g === truth[i]
                  ? "bg-green-600/15 text-green-700 dark:text-green-400"
                  : "bg-destructive/10 text-destructive line-through decoration-1"
            }`}
          >
            {g}
          </span>
        ))}
      </div>
    </div>
  );
}
