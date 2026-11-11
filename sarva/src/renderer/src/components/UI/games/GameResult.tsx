"use client";

import { useId } from "react";
import "./game-result.css";

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

/** کمانِ حلقه: پیرامونِ دایره با شعاعِ ۴۲. */
const CIRC = 263.894;

function Ring({ pct, gid }: { pct: number; gid: string }) {
  const shown = Math.min(100, Math.max(0, pct));
  return (
    <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--primary)" />
          <stop offset="100%" stopColor="var(--gold)" />
        </linearGradient>
      </defs>
      <circle
        cx="50"
        cy="50"
        r="42"
        fill="none"
        strokeWidth="9"
        strokeLinecap="round"
        className="stroke-border"
        strokeDasharray={`${((CIRC * shown) / 100).toFixed(2)} 263.89`}
        strokeDashoffset="0"
        opacity="1"
      />
      <circle
        cx="50"
        cy="50"
        r="42"
        fill="none"
        strokeWidth="9"
        strokeLinecap="round"
        stroke={`url(#${gid})`}
        strokeDasharray={`${((CIRC * shown) / 100).toFixed(2)} 263.89`}
        strokeDashoffset="0"
      />
    </svg>
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
  const fa = (n: number) => n.toLocaleString("fa-IR");
  const widest = Math.max(1, ...bars.map((b) => b.total));
  const activeTick = TICKS.findIndex((_, i) => {
    const from = TICKS.slice(0, i).reduce((s, t) => s + t.w, 0);
    return pct >= from && pct < from + TICKS[i].w;
  });

  return (
    <section dir="rtl" className={R + "card"} data-wide="true" data-tier={tier} aria-labelledby="game-result-title">
      <div className={R + "main"}>
        <header className={R + "hero"}>
          <div role="img" aria-label={ringLabel} className={"relative shrink-0 " + R + "ring"} style={{ containerType: "inline-size" }}>
            <Ring pct={pct} gid={gid} />
            <span className="absolute inset-0 grid place-items-center">
              <span className="panel-num flex items-baseline font-bold tracking-tight" style={{ fontSize: "26cqw" }}>
                <span>{fa(pct)}</span>
                <span aria-hidden="true" className="text-[0.62em] font-semibold opacity-70">٪</span>
              </span>
            </span>
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
            aria-valuetext={`${fa(pct)} درصد، سطح ${TICKS[activeTick]?.label ?? ""}`}
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
            <dd className="game-num"><span className="inline-block tabular-nums">{fa(hunted)}</span></dd>
          </div>
          <div className={R + "stat"}>
            <dt><span className={R + "dot"} data-mark="bad" aria-hidden="true" />در رفت</dt>
            <dd className="game-num"><span className="inline-block tabular-nums">{fa(escaped)}</span></dd>
          </div>
          <div className={R + "stat"}>
            <dt>فرصت باقی‌مانده</dt>
            <dd className="game-num">
              <span className="inline-block tabular-nums">{fa(chancesLeft)}</span>
              <span className={R + "unit"}>از {fa(chances)}</span>
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
              const t = `${fa(i + 1)}: ${word}`;
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
            <li key={b.label} title={`${b.label}: ${fa(b.ok)} از ${fa(b.total)}`}>
              <div className={R + "barHead"}>
                <span className={R + "barLabel"}>{b.label}</span>
                <span className="game-num"><b>{fa(b.ok)}</b> از {fa(b.total)}</span>
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
