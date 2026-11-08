"use client";

import { motion } from "motion/react";
import { FAMOUS_METERS, type FamousMeter } from "@/data/seeds/meters";
import { ARKAN } from "@/lib/aruz/meters";

/**
 * «وزن‌های مشهور» — بخشی از صفحهٔ وزن‌یاب که در این پورت وجود نداشت.
 *
 * ⚠️ این کامپوننت بازنویسیِ مستقیمِ کامپوننتِ زندهٔ سایت است (نگاره، کلاس‌ها و
 *    ساختارش عیناً از همان آمده، ۲۰۲۶-۱۱-۰۸)؛ چرا که پیش از این اصلاً نبود و
 *    سلیقهٔ شخصی در آن دخالت داده نشده.
 *
 * هر کارت سه چیز نشان می‌دهد: نام (یا نامِ مستعار)، نگارهٔ تقطیع، و — اگر
 * باشد — بیتی که همه این وزن را با آن به یاد می‌آورند. زدن روی کارت، آن وزن را
 * برای پخش برمی‌گزیند.
 */

const EASE = [0.16, 1, 0.3, 1] as const;

/** ارکان را به رشته‌ای از هجا می‌برد: «-» بلند، «U» کوتاه. */
function patternOf(feet: string): string {
  return feet
    .split(/\s+/)
    .filter(Boolean)
    .map((f) => ARKAN[f] ?? "")
    .join("");
}

function splitFeet(feet: string): string[] {
  return feet.split(/\s+/).filter(Boolean);
}

/**
 * نگارهٔ تقطیعِ وزن: هر هجای بلند یک خطِ راستِ کشیده و هر هجای کوتاه یک کمانِ
 * کوتاه. این همان شکلی است که در کتاب‌های عروض برای نشان‌دادنِ وزن می‌کشند.
 */
function ScansionGlyph({ pattern }: { pattern: string }) {
  const cells = [...pattern];
  const total = cells.reduce((sum, c) => sum + (c === "-" ? 2 : 1) * 9 + 3, 0);
  const parts: string[] = [];
  let x = 0;
  for (const c of cells) {
    const w = (c === "-" ? 2 : 1) * 9;
    const right = total - x;
    const left = right - w;
    parts.push(
      c === "-"
        ? `M${right - 1.5} 8H${left + 1.5}`
        : `M${right - 1} 3C${right - 1} 13 ${left + 1} 13 ${left + 1} 3`,
    );
    x += w + 3;
  }
  return (
    <svg
      viewBox={`-2 0 ${total + 4} 14`}
      style={{ width: "100%", maxWidth: total + 4 }}
      className=" min-w-0 overflow-visible"
      aria-hidden
    >
      <path
        d={parts.join("")}
        fill="none"
        stroke="currentColor"
        strokeWidth={2.2}
        strokeLinecap="round"
      />
    </svg>
  );
}

/** سه میلهٔ لرزان — نشانهٔ «همین الآن پخش می‌شود». */
function PlayingBars() {
  return (
    <span className=" flex h-3 items-end gap-0.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className=" w-0.5 animate-pulse rounded-full bg-current"
          style={{ height: `${[60, 100, 40][i]}%`, animationDelay: `${120 * i}ms` }}
        />
      ))}
    </span>
  );
}

export default function FamousMeters({
  current,
  playing,
  onPick,
}: {
  current: string | null;
  playing: boolean;
  onPick: (m: FamousMeter) => void;
}) {
  return (
    <motion.section
      dir="rtl"
      aria-labelledby="vy-meters"
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.6, ease: EASE }}
      className=" relative z-20 mx-auto mt-16 w-full max-w-6xl sm:mt-24"
    >
      <h2 id="vy-meters" className=" text-3xl font-black text-foreground sm:text-4xl">
        وزن‌های مشهور
      </h2>
      <ol className=" mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FAMOUS_METERS.map((m) => {
          const isCurrent = current === m.feet;
          return (
            <li key={m.feet}>
              <button
                type="button"
                onClick={() => onPick(m)}
                aria-pressed={isCurrent}
                className={` group flex h-full w-full flex-col rounded-3xl border bg-card p-5 text-start transition hover:-translate-y-0.5 hover:shadow-md sm:p-5 ${
                  isCurrent
                    ? "border-primary/60 ring-2 ring-primary/15"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <span className=" flex items-start justify-between gap-3">
                  <span className=" min-w-0">
                    <span className=" block text-lg font-black text-foreground">
                      {m.nick ?? m.bahr}
                    </span>
                    {m.nick && (
                      <span className=" mt-1 block text-xs text-muted-foreground">
                        {m.bahr}
                      </span>
                    )}
                  </span>
                  <span
                    aria-hidden
                    className={` flex size-9 shrink-0 items-center justify-center rounded-full transition ${
                      isCurrent && playing
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-foreground group-hover:bg-primary group-hover:text-primary-foreground"
                    }`}
                  >
                    {isCurrent && playing ? (
                      <PlayingBars />
                    ) : (
                      <svg viewBox="0 0 24 24" fill="currentColor" className=" size-3.5">
                        <path d="M7 5.5v13a1 1 0 0 0 1.5.86l11-6.5a1 1 0 0 0 0-1.72l-11-6.5A1 1 0 0 0 7 5.5Z" />
                      </svg>
                    )}
                  </span>
                </span>

                <span
                  className={` mt-4 flex items-center ${
                    isCurrent ? "text-primary" : "text-foreground/70"
                  }`}
                >
                  <ScansionGlyph pattern={patternOf(m.feet)} />
                </span>

                <span className=" mt-3 block text-xs text-muted-foreground">
                  {splitFeet(m.feet).join(" ")}
                </span>

                {m.couplet && (
                  <span className=" mt-4 hidden border-t border-border pt-4 text-sm leading-7 text-muted-foreground sm:block">
                    <span className=" block">{m.couplet[0]}</span>
                    <span className=" block">
                      {m.couplet[1]}
                      {m.poet && <span className=" ms-2 text-xs">{m.poet}</span>}
                    </span>
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ol>
    </motion.section>
  );
}
