"use client";

import { useEffect, useId } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import MainLogo from "@/components/svgs/mainLogo";
import "./game-result.css";

const faNum = (n: number) => n.toLocaleString("fa-IR");

const R = "game-result-module__Ay1yLG__";

/** کارتِ نتیجه‌یِ همگانیِ سایت (`game-result-module`).
 *
 *  رونوشتِ نشانه‌گذاریِ واقعیِ صفحه‌یِ پایان: حلقه‌یِ درصد، تیتر و خطِ سطح،
 *  میزانیِ سطح با چهار تیک، آمار، نشانِ هر پرونده، و بازویِ نمودارِ تفکیک.
 *  این بخش در سایت برایِ همه‌یِ بازی‌ها یکی است. */

export type Mark = "ok" | "bad" | "skip";
export type Bar = { label: string; ok: number; total: number };

const TICKS = [
  { label: "نیاز به تمرین", w: 40 },
  { label: "متوسط", w: 20 },
  { label: "خوب", w: 20 },
  { label: "عالی", w: 20 },
];

/** کمانِ حلقه: پیرامونِ دایره با شعاعِ ۴۲ (`2 * Math.PI * 42`). */
const CIRC = 2 * Math.PI * 42;

/**
 * حلقه‌یِ درصد — رونوشتِ `AnimatedCircularProgress`ِ سایت.
 *
 * فرمول‌ها از خودِ بسته خوانده شده و با صفحه‌یِ ذخیره‌شده سنجیده شد (۲۰٪):
 *   کمانِ رنگی   = درصد / ۱۰۰ × پیرامون            ← ۵۲.۷۸ ✓
 *   کمانِ پشت    = (۱۰۰ − درصد − ۶) / ۱۰۰ × پیرامون ← ۱۹۵.۲۸ ✓
 *   جابه‌جایی    = −(درصد + ۳) / ۱۰۰ × پیرامون      ← −۶۰.۷۰ ✓
 *
 * هر سه از یک مقدارِ متحرک می‌آیند که در ۱٫۱ ثانیه از صفر تا درصد بالا
 * می‌رود؛ شماره‌یِ میانِ حلقه هم همراهِ همان کمان می‌شمرد.
 */
function Ring({ pct, gid }: { pct: number; gid: string }) {
  const reduce = useReducedMotion();
  const target = Math.max(0, Math.min(100, Math.round(pct)));
  const v = useMotionValue(reduce ? target : 0);

  useEffect(() => {
    if (reduce) {
      v.set(target);
      return;
    }
    const controls = animate(v, target, { duration: 1.1, ease: [0.22, 1, 0.36, 1] });
    return () => controls.stop();
  }, [target, reduce, v]);

  const fillDash = useTransform(v, (e) => `${(e / 100) * CIRC} ${CIRC}`);
  /* کمانِ پشت ۶ واحد کوتاه‌تر از باقی‌مانده است تا گِردیِ سرِ خط رویِ کمانِ
     رنگی را نپوشاند. */
  const restDash = useTransform(v, (e) => `${(Math.max(0, 100 - e - 6) / 100) * CIRC} ${CIRC}`);
  const restOffset = useTransform(v, (e) => -((e + 3) / 100) * CIRC);
  /* نزدیکِ ۱۰۰٪ کمانِ پشت محو می‌شود: دیگر چیزی باقی نمانده که نشان بدهد. */
  const restOpacity = useTransform(v, [96, 100], [1, 0]);
  const fillOpacity = useTransform(v, [0, 0.5], [0, 1]);
  const shown = useTransform(v, (e) => faNum(Math.round(e)));

  return (
    <>
      <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden="true">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="var(--gold)" />
          </linearGradient>
        </defs>
        <motion.circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          strokeWidth="9"
          strokeLinecap="round"
          className="stroke-border"
          style={{ strokeDasharray: restDash, strokeDashoffset: restOffset, opacity: restOpacity }}
        />
        <motion.circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          strokeWidth="9"
          strokeLinecap="round"
          stroke={`url(#${gid})`}
          style={{ strokeDasharray: fillDash, opacity: fillOpacity }}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center">
        <motion.span
          className="panel-num flex items-baseline font-bold tracking-tight"
          style={{ fontSize: target >= 100 ? "22cqw" : "26cqw" }}
        >
          {/* ⚠️ MotionValue را فقط یک `motion.span` می‌تواند به‌عنوانِ فرزند
              بپذیرد؛ در `<span>` معمولی React همان شیء را چاپ می‌کند و خطا
              می‌دهد. */}
          <motion.span>{shown}</motion.span>
          <span aria-hidden="true" className="text-[0.62em] font-semibold opacity-70">٪</span>
        </motion.span>
      </span>
    </>
  );
}


export default function GameResult({
  percent,
  tier,
  title,
  line,
  ringLabel,
  hunted,
  escaped,
  chancesLeft,
  chances,
  marks,
  bars,
  weakest,
  onAgain,
  onChange,
}: {
  percent: number;
  tier: string;
  title: string;
  line: string;
  /** برچسبِ خواننده‌یِ صفحه برایِ حلقه، مثلاً «۲۰ درصد شکار». */
  ringLabel: string;
  hunted: number;
  escaped: number;
  chancesLeft: number;
  chances: number;
  marks: Mark[];
  bars: Bar[];
  /** نقشی که بیشترین اشتباه در آن بوده. */
  weakest?: string;
  onAgain: () => void;
  onChange: () => void;
}) {
  const gid = useId().replace(/:/g, "");
  const pct = Math.round(percent);
  const widest = Math.max(1, ...bars.map((b) => b.total));
  const activeTick = TICKS.findIndex((_, i) => {
    const from = TICKS.slice(0, i).reduce((s, t) => s + t.w, 0);
    return pct >= from && pct < from + TICKS[i].w;
  });

  return (
    <section dir="rtl" className={R + "card"} data-wide="true" data-tier={tier} aria-labelledby="game-result-title">
      {/* نشانِ محوِ سروا، پشتِ همه‌چیز — در سایت `span.logo` است و با
          `z-index: -2` و `opacity: .22` پشتِ کارت می‌نشیند. بدونش کارت
          یک مستطیلِ تُهی به‌نظر می‌رسد. */}
      <span className={R + "logo"} aria-hidden="true">
        <MainLogo />
      </span>
      <div className={R + "main"}>
        <header className={R + "hero"}>
          <div role="img" aria-label={ringLabel} className={"relative shrink-0 " + R + "ring"} style={{ containerType: "inline-size" }}>
            <Ring pct={pct} gid={gid} />
          </div>
          <div className={R + "copy"}>
            <h2 id="game-result-title" className={"game-display " + R + "title"}>{title}</h2>
            <p className={R + "line"}>{line}</p>
          </div>
        </header>

        <div className={R + "level"} data-tier={tier}>
          <div
            className={R + "levelTrack"}
            role="meter"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
            aria-valuetext={`${faNum(pct)} درصد، سطح ${TICKS[activeTick]?.label ?? ""}`}
          >
            <div className={R + "levelMask"}>
              <span className={R + "levelFill"} style={{ transform: `scaleX(${pct / 100})` }} />
            </div>
            <span className={R + "levelRail"}>
              <span className={R + "levelThumb"} style={{ right: `${pct}%` }} />
            </span>
          </div>
          <ol className={R + "levelTicks"} aria-hidden="true">
            {TICKS.map((t, i) => (
              <li key={t.label} data-on={i === activeTick ? "true" : undefined} style={{ width: `${t.w}%` }}>
                {t.label}
              </li>
            ))}
          </ol>
        </div>

        <dl className={R + "stats"} data-count={3}>
          <div className={R + "stat"}>
            <dt><span className={R + "dot"} data-mark="ok" aria-hidden="true" />شکار شد</dt>
            <dd className="game-num"><span className="inline-block tabular-nums">{faNum(hunted)}</span></dd>
          </div>
          <div className={R + "stat"}>
            <dt><span className={R + "dot"} data-mark="bad" aria-hidden="true" />در رفت</dt>
            <dd className="game-num"><span className="inline-block tabular-nums">{faNum(escaped)}</span></dd>
          </div>
          <div className={R + "stat"}>
            <dt>فرصت باقی‌مانده</dt>
            <dd className="game-num">
              <span className="inline-block tabular-nums">{faNum(chancesLeft)}</span>
              <span className={R + "unit"}>از {faNum(chances)}</span>
            </dd>
          </div>
        </dl>

        <section className={R + "marks"} aria-label="پرونده‌ها">
          <div className={R + "sectionHead"}>
            <h3 className="game-title">پرونده‌ها</h3>
            <span className={R + "legend"} aria-hidden="true">
              <span><i data-mark="ok" />درست</span>
              <span><i data-mark="bad" />نادرست</span>
              <span><i data-mark="skip" />بی‌پاسخ</span>
            </span>
          </div>
          <ol>
            {marks.map((m, i) => {
              const word = m === "ok" ? "درست" : m === "bad" ? "نادرست" : "بی‌پاسخ";
              const t = `${faNum(i + 1)}: ${word}`;
              return (
                <li key={i} data-mark={m} title={t}>
                  <span className="sr-only">{t}</span>
                </li>
              );
            })}
          </ol>
        </section>

        <div className={R + "actions"}>
          <button type="button" className={R + "primary"} onClick={onAgain}>یک دست دیگر</button>
          <button type="button" className={R + "ghost"} onClick={onChange}>تغییر درس</button>
        </div>
      </div>

      <aside className={R + "chart"}>
        <div className={R + "sectionHead"}>
          <h3 className="game-title">به تفکیک نقشِ جاسوس</h3>
          <span className={R + "legend"} aria-hidden="true">
            <span><i data-mark="ok" />درست</span>
            <span><i data-mark="bad" />نادرست</span>
          </span>
        </div>
        <ul className={R + "bars"}>
          {bars.map((b) => (
            <li key={b.label} title={`${b.label}: ${faNum(b.ok)} از ${faNum(b.total)}`}>
              <div className={R + "barHead"}>
                <span className={R + "barLabel"}>{b.label}</span>
                <span className="game-num"><b>{faNum(b.ok)}</b> از {faNum(b.total)}</span>
              </div>
              <div className={R + "bar"} style={{ width: `${(b.total / widest) * 100}%` }}>
                {b.ok > 0 && <span data-mark="ok" style={{ flexGrow: b.ok }} />}
                {b.total - b.ok > 0 && <span data-mark="bad" style={{ flexGrow: b.total - b.ok }} />}
              </div>
            </li>
          ))}
        </ul>
        {weakest && <p className={R + "weak"}>بیشترین اشتباه در نقشِ «{weakest}» بود.</p>}
      </aside>
    </section>
  );
}
