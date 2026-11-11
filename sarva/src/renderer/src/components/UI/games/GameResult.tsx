"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { MotionConfig, animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { RotateCcw, SlidersHorizontal } from "lucide-react";
import MainLogo from "@/components/svgs/mainLogo";
import { NumberTicker } from "@/components/UI/kit/magic/number-ticker";
import "./game-result.css";

const R = "game-result-module__Ay1yLG__";

/** کارتِ نتیجه‌یِ همگانیِ سایت (`game-result-module`).
 *
 *  رونوشتِ کامپوننتِ واقعیِ سایت — نه بازسازی از رویِ ظاهر. جدولِ سطح‌ها،
 *  خط‌هایِ هر سطح، پویانمایی‌ها، شمارنده‌یِ اعداد و حتا جشنِ کاغذ‌رنگی همگی
 *  از خودِ بسته خوانده شده‌اند. */

export type Mark = "ok" | "bad" | "skip";
export type Bar = { key?: string; label: string; ok: number; total: number; sub?: string };
export type Breakdown = {
  key: string;
  tab: string;
  title: string;
  weakWord?: string;
  rows: Bar[];
};
export type Stat = { label: string; value: number; mark?: Mark; unit?: string; decimals?: number };

/** همان تابعِ `ease`ِ سایت. */
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const tierOf = (pct: number) =>
  pct >= 100 ? "perfect" : pct >= 80 ? "great" : pct >= 60 ? "good" : pct >= 40 ? "fair" : "low";

/** تیتر و خط‌هایِ هر سطح — بی‌کم‌وکاست از سایت. */
const TIER_COPY: Record<string, { title: string; lines: string[] }> = {
  perfect: {
    title: "بی‌نقص!",
    lines: ["همه را درست جواب دادی.", "حتی یک اشتباه هم نداشتی.", "بهتر از این نمی‌شد."],
  },
  great: {
    title: "عالی بود",
    lines: ["فقط چند مورد جا ماند.", "خیلی کم اشتباه کردی.", "تقریباً همه را درست زدی."],
  },
  good: {
    title: "خوب بود",
    lines: ["بیشترش را درست زدی.", "چند مورد دیگر هم جا بیفتد، عالی می‌شود.", "اشتباه‌ها را یک بار مرور کن."],
  },
  fair: {
    title: "بد نبود",
    lines: ["با کمی تمرین بهتر می‌شود.", "اشتباه‌ها را مرور کن و دوباره امتحان بده.", "هنوز جای کار دارد."],
  },
  low: {
    title: "باید بیشتر تمرین کنی",
    lines: [
      "درسنامه را یک بار دیگر بخوان و دوباره بیا.",
      "از همان‌هایی که اشتباه کردی شروع کن.",
      "دفعهٔ بعد بهتر می‌شود.",
    ],
  },
};

/** تیک‌هایِ میزانی — همان `h` در بسته‌یِ سایت. */
const TICKS = [
  { from: 0, to: 40, label: "نیاز به تمرین", tier: ["low"] },
  { from: 40, to: 60, label: "متوسط", tier: ["fair"] },
  { from: 60, to: 80, label: "خوب", tier: ["good"] },
  { from: 80, to: 100, label: "عالی", tier: ["great", "perfect"] },
];

/** همان `resultTone`ِ سایت: سطح را از درصد می‌گیرد و خط را با تخمِ داده برمی‌گزیند. */
export function resultTone(pct: number, seed: number, override?: Partial<Record<string, { title?: string; lines?: string[] }>>) {
  const t = tierOf(pct);
  const o = override?.[t];
  const title = o?.title ?? TIER_COPY[t].title;
  const lines = o?.lines ?? TIER_COPY[t].lines;
  return { tier: t, title, line: lines[Math.abs(Math.round(seed)) % lines.length] };
}

/** کلاسِ دکمه‌هایِ نتیجه، همان `resultButton`ِ سایت. */
export const resultButton = { primary: R + "primary", ghost: R + "ghost" };

const faNum = (n: number) => n.toLocaleString("fa-IR");

/** کمانِ حلقه: پیرامونِ دایره با شعاعِ ۴۲. */
const CIRC = 2 * Math.PI * 42;

/**
 * حلقه‌یِ درصد — `AnimatedCircularProgress`ِ سایت.
 *
 * فرمول‌ها از بسته خوانده شده و با عددهایِ صفحه‌یِ ذخیره‌شده سنجیده شد (۲۰٪):
 *   کمانِ رنگی = درصد / ۱۰۰ × پیرامون             ← ۵۲.۷۸ ✓
 *   کمانِ پشت  = (۱۰۰ − درصد − ۶) / ۱۰۰ × پیرامون ← ۱۹۵.۲۸ ✓
 *   جابه‌جایی  = −(درصد + ۳) / ۱۰۰ × پیرامون       ← −۶۰.۷۰ ✓
 */
function Ring({ value, label, className }: { value: number; label?: string; className?: string }) {
  const gid = useId().replace(/:/g, "");
  const reduce = useReducedMotion();
  const target = Math.max(0, Math.min(100, Math.round(value)));
  const v = useMotionValue(reduce ? target : 0);

  useEffect(() => {
    if (reduce) {
      v.set(target);
      return;
    }
    const controls = animate(v, target, { duration: 1.1, ease: EASE });
    return () => controls.stop();
  }, [target, reduce, v]);

  const fillDash = useTransform(v, (e) => `${(e / 100) * CIRC} ${CIRC}`);
  const restDash = useTransform(v, (e) => `${(Math.max(0, 100 - e - 6) / 100) * CIRC} ${CIRC}`);
  const restOffset = useTransform(v, (e) => -((e + 3) / 100) * CIRC);
  const restOpacity = useTransform(v, [96, 100], [1, 0]);
  const fillOpacity = useTransform(v, [0, 0.5], [0, 1]);
  const shown = useTransform(v, (e) => faNum(Math.round(e)));

  return (
    <div
      role="img"
      aria-label={label ?? (reduce ? `${faNum(target)} درصد` : `${faNum(target)} درصد`)}
      style={{ containerType: "inline-size" }}
      className={"relative shrink-0 " + (className ?? "")}
    >
      <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden="true">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="var(--gold)" />
          </linearGradient>
        </defs>
        <motion.circle
          cx="50" cy="50" r="42" fill="none" strokeWidth="9" strokeLinecap="round"
          className="stroke-border"
          style={{ strokeDasharray: restDash, strokeDashoffset: restOffset, opacity: restOpacity }}
        />
        <motion.circle
          cx="50" cy="50" r="42" fill="none" strokeWidth="9" strokeLinecap="round"
          stroke={`url(#${gid})`}
          style={{ strokeDasharray: fillDash, opacity: fillOpacity }}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center">
        <motion.span
          className="panel-num flex items-baseline font-bold tracking-tight"
          style={{ fontSize: target >= 100 ? "22cqw" : "26cqw" }}
        >
          <motion.span>{shown}</motion.span>
          <span aria-hidden="true" className="text-[0.62em] font-semibold opacity-70">٪</span>
        </motion.span>
      </span>
    </div>
  );
}

const LEGEND: Record<Mark, string> = { ok: "درست", bad: "نادرست", skip: "بی‌پاسخ" };

function Legend({ skip }: { skip?: boolean }) {
  return (
    <span className={R + "legend"} aria-hidden="true">
      <span><i data-mark="ok" />{LEGEND.ok}</span>
      <span><i data-mark="bad" />{LEGEND.bad}</span>
      {skip && <span><i data-mark="skip" />{LEGEND.skip}</span>}
    </span>
  );
}

export default function GameResult({
  pct,
  ringLabel = "درصد پاسخ درست",
  tone,
  context,
  stats,
  marks,
  marksTitle = "پاسخ‌ها به ترتیب",
  breakdowns,
  children,
  actions,
  celebrate = true,
}: {
  pct: number;
  ringLabel?: string;
  tone: { tier: string; title: string; line: string };
  /** زیرتیترِ اختیاریِ زیرِ خطِ سطح. */
  context?: string;
  stats: Stat[];
  marks?: Mark[];
  marksTitle?: string;
  breakdowns?: Breakdown[];
  children?: React.ReactNode;
  actions?: React.ReactNode;
  /** جشنِ کاغذ‌رنگی — سایت از ۹۰٪ به بالا می‌ریزد. */
  celebrate?: boolean;
}) {
  const reduce = useReducedMotion();
  const p = Math.max(0, Math.min(100, Math.round(pct)));
  const charts = useMemo(() => (breakdowns ?? []).filter((b) => b.rows.length > 0), [breakdowns]);
  const hasChart = charts.length > 0;
  const [activeKey, setActiveKey] = useState(charts[0]?.key);
  const chart = charts.find((c) => c.key === activeKey) ?? charts[0];

  /** کاغذ‌رنگیِ سایت: دو افکنه از دو گوشه، ۹۰۰ میلی‌ثانیه پس از نمایش. */
  const shouldCelebrate = celebrate && p >= 90 && !reduce;
  useEffect(() => {
    if (!shouldCelebrate) return;
    let dead = false;
    const t = window.setTimeout(() => {
      import("canvas-confetti").then(({ default: confetti }) => {
        if (dead) return;
        const read = (name: string, fallback: string) => {
          try {
            const cv = document.createElement("canvas").getContext("2d");
            if (!cv) return fallback;
            cv.fillStyle = getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
            cv.fillRect(0, 0, 1, 1);
            const [r, g, b] = cv.getImageData(0, 0, 1, 1).data;
            return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
          } catch {
            return fallback;
          }
        };
        const opts = {
          particleCount: 60,
          spread: 70,
          startVelocity: 42,
          ticks: 160,
          colors: [read("--primary", "#008687"), read("--gold", "#d9b25f"), "#ffffff"],
          disableForReducedMotion: true,
        };
        confetti({ ...opts, angle: 60, origin: { x: 0, y: 0.7 } });
        confetti({ ...opts, angle: 120, origin: { x: 1, y: 0.7 } });
      });
    }, 900);
    return () => {
      dead = true;
      clearTimeout(t);
    };
  }, [shouldCelebrate]);

  const tickIndex = TICKS.findIndex((t) => t.tier.includes(tone.tier));

  return (
    <MotionConfig reducedMotion="user">
      <motion.section
        dir="rtl"
        className={R + "card"}
        data-wide={hasChart || undefined}
        data-tier={tone.tier}
        aria-labelledby="game-result-title"
        initial={{ opacity: 0, y: 18, scale: 0.985, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: 0.55, ease: EASE }}
      >
        <span className={R + "logo"} aria-hidden="true">
          <MainLogo />
        </span>

        <div className={R + "main"}>
          <header className={R + "hero"}>
            <Ring value={p} label={`${faNum(p)} ${ringLabel}`} className={R + "ring"} />
            <div className={R + "copy"}>
              <motion.h2
                id="game-result-title"
                className={"game-display " + R + "title"}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.2, ease: EASE }}
              >
                {tone.title}
              </motion.h2>
              <motion.p
                className={R + "line"}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.3, ease: EASE }}
              >
                {tone.line}
              </motion.p>
              {context && <p className={R + "context"}>{context}</p>}
            </div>
          </header>

          <div className={R + "level"} data-tier={tone.tier}>
            <div
              className={R + "levelTrack"}
              role="meter"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={p}
              aria-valuetext={`${faNum(p)} درصد، سطح ${TICKS[tickIndex]?.label ?? ""}`}
            >
              <div className={R + "levelMask"}>
                <motion.span
                  className={R + "levelFill"}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: p / 100 }}
                  transition={{ duration: 1.1, delay: 0.25, ease: EASE }}
                />
              </div>
              <span className={R + "levelRail"}>
                <motion.span
                  className={R + "levelThumb"}
                  initial={{ right: "0%" }}
                  animate={{ right: `${p}%` }}
                  transition={{ duration: 1.1, delay: 0.25, ease: EASE }}
                />
              </span>
            </div>
            <ol className={R + "levelTicks"} aria-hidden="true">
              {TICKS.map((t, i) => (
                <li key={t.label} style={{ width: `${t.to - t.from}%` }} data-on={i === tickIndex || undefined}>
                  {t.label}
                </li>
              ))}
            </ol>
          </div>

          <dl className={R + "stats"} data-count={stats.length}>
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                className={R + "stat"}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 380, damping: 30, delay: 0.35 + 0.06 * i }}
              >
                <dt>
                  {s.mark && <span className={R + "dot"} data-mark={s.mark} aria-hidden="true" />}
                  {s.label}
                </dt>
                <dd className="game-num">
                  <NumberTicker value={s.value} decimalPlaces={s.decimals ?? 0} delay={0.4 + 0.06 * i} />
                  {s.unit && <span className={R + "unit"}>{s.unit}</span>}
                </dd>
              </motion.div>
            ))}
          </dl>

          {marks && marks.length > 0 && (
            <section className={R + "marks"} aria-label={marksTitle}>
              <div className={R + "sectionHead"}>
                <h3 className="game-title">{marksTitle}</h3>
                <Legend skip={marks.includes("skip")} />
              </div>
              <ol>
                {marks.map((m, i) => {
                  const word = LEGEND[m];
                  const t = `${faNum(i + 1)}: ${word}`;
                  return (
                    <motion.li
                      key={i}
                      data-mark={m}
                      title={t}
                      initial={{ opacity: 0, scale: 0.4 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 520,
                        damping: 26,
                        delay: 0.5 + 0.025 * Math.min(i, 40),
                      }}
                    >
                      <span className="sr-only">{t}</span>
                    </motion.li>
                  );
                })}
              </ol>
            </section>
          )}

          {children}

          <div className={R + "actions"}>{actions}</div>
        </div>

        {hasChart && chart && (
          <motion.aside
            className={R + "chart"}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, delay: 0.3, ease: EASE }}
          >
            <div className={R + "sectionHead"}>
              <h3 className="game-title">{chart.title}</h3>
              <Legend />
            </div>
            {charts.length > 1 && (
              <div className={R + "tabs"} role="tablist" aria-label="نوع تفکیک">
                {charts.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    role="tab"
                    aria-selected={c.key === chart.key}
                    onClick={() => setActiveKey(c.key)}
                  >
                    {c.tab}
                  </button>
                ))}
              </div>
            )}
            <Bars chart={chart} />
          </motion.aside>
        )}
      </motion.section>
    </MotionConfig>
  );
}

function Bars({ chart }: { chart: Breakdown }) {
  const [all, setAll] = useState(false);
  /** ترتیبِ سایت: نخست بیشترین تعداد، سپس کمترین دقت. */
  const sorted = [...chart.rows].sort(
    (a, b) => b.total - a.total || a.ok / a.total - b.ok / b.total,
  );
  const shown = all ? sorted : sorted.slice(0, 7);
  const widest = Math.max(...sorted.map((r) => r.total), 1);
  /** ضعیف‌ترین نقش: بیشترین نادرست، و در برابرِ برابر کمترین دقت. */
  const weak = sorted.reduce<Bar | null>((best, r) => {
    const wrong = r.total - r.ok;
    if (wrong === 0) return best;
    if (!best) return r;
    const bw = best.total - best.ok;
    return wrong > bw || (wrong === bw && r.ok / r.total < best.ok / best.total) ? r : best;
  }, null);

  return (
    <>
      <ul className={R + "bars"}>
        {shown.map((row, i) => {
          const wrong = row.total - row.ok;
          return (
            <li key={row.key ?? row.label} title={`${row.label}: ${faNum(row.ok)} از ${faNum(row.total)}`}>
              <div className={R + "barHead"}>
                <span className={R + "barLabel"}>{row.label}</span>
                <span className="game-num">
                  <b>{faNum(row.ok)}</b> از {faNum(row.total)}
                </span>
              </div>
              {row.sub && <div className={R + "barSub"}>{row.sub}</div>}
              <motion.div
                className={R + "bar"}
                style={{ width: `${(row.total / widest) * 100}%` }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.7, delay: 0.45 + 0.07 * i, ease: EASE }}
              >
                {row.ok > 0 && <span data-mark="ok" style={{ flexGrow: row.ok }} />}
                {wrong > 0 && <span data-mark="bad" style={{ flexGrow: wrong }} />}
              </motion.div>
            </li>
          );
        })}
      </ul>
      {sorted.length > 7 && (
        <button type="button" className={R + "more"} onClick={() => setAll((v) => !v)}>
          {all ? "نمایش کمتر" : `نمایش همه (${faNum(sorted.length)})`}
        </button>
      )}
      {weak && chart.weakWord !== undefined && (
        <p className={R + "weak"}>
          بیشترین اشتباه در {chart.weakWord ? `${chart.weakWord} ` : ""}«{weak.label}» بود.
        </p>
      )}
    </>
  );
}
