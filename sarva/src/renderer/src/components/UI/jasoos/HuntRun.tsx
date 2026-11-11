"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import HuntCase, { type HuntLevel, type HuntSuspect } from "./HuntCase";
import Tour, { type TourStep } from "@/components/UI/kit/Tour";
import { Volume2, VolumeX } from "lucide-react";
import { setSfxOn, sfxIsOn, sfx, subscribeSfx } from "@/lib/jasoos-sfx";
import "./hunt.css";

const H = "hunt-module__hXhGKa__";

type Result = { level: HuntLevel; hit: boolean; spy: HuntSuspect };

const CHANCES = 3;

/** سطح‌هایِ پایان — همان جدول و همان آستانه‌هایِ سایت (برپایه‌یِ درصدِ درست). */
const TIERS = [
  { from: 0, to: 40, label: "نیاز به تمرین", tier: "low" },
  { from: 40, to: 60, label: "متوسط", tier: "fair" },
  { from: 60, to: 80, label: "خوب", tier: "good" },
  { from: 80, to: 100, label: "عالی", tier: "great" },
] as const;

const END_COPY: Record<string, { title?: string; lines: string[] }> = {
  perfect: {
    title: "همه شکار شدند",
    lines: ["هیچ جاسوسی در نرفت.", "همهٔ نقش‌ها را درست تشخیص دادی."],
  },
  great: {
    title: "مأموریت موفق",
    lines: ["فقط چند جاسوس در رفت.", "نقش‌ها را خوب می‌شناسی."],
  },
  good: {
    title: "پایان مأموریت",
    lines: ["بیشتر جاسوس‌ها شکار شدند.", "جاسوس‌هایی که در رفتند پایین ببین."],
  },
  fair: {
    title: "پایان مأموریت",
    lines: [
      "جاسوس‌هایی که در رفتند مرور کن.",
      "نقش‌هایی که جا ماندند را دوباره تمرین کن.",
    ],
  },
  low: {
    lines: [
      "نقش‌های این درس را یک بار دیگر مرور کن.",
      "جاسوس‌هایی که در رفتند پایین ببین.",
    ],
  },
};

/** آموزشِ نخستین — همان چهار گامِ سایت، هر کدام روی یک لنگرِ data-tour. */
const JASOOS_TOUR: TourStep[] = [
  { target: '[data-tour="jasoos-verse"]', text: "اول متن را بخوان." },
  {
    target: '[data-tour="jasoos-windows"]',
    text: "هر پنجره یک نقش دارد. سه نقش در متن هست و یکی نیست. آن یکی جاسوس است.",
  },
  {
    target: '[data-tour="jasoos-console"]',
    text: "روی پنجرهٔ جاسوس بزن تا شلیک کنی. روی گوشی دو بار بزن. کلیدهای ۱ تا ۴ هم کار می‌کنند.",
  },
  {
    target: '[data-tour="jasoos-ammo"]',
    text: "با هر شلیک اشتباه یکی از فرصت‌ها کم می‌شود.",
  },
];

/** گردشِ کاملِ شکار: اچ‌یوا‌دی، پرونده‌ها یکی‌یکی، و کارنامه‌یِ پایان.
 *
 *  سایت اینجا نقشه و در ندارد — یک اچ‌یوا‌دی با «شماره‌یِ پرونده» و «فرصت»،
 *  یک ردیف تیک به‌ازای هر پرونده، و در پایان فهرستِ «جاسوس‌هایی که در رفتند». */
export default function HuntRun({
  levels,
  onShot,
  onLevel,
  onFinish,
  onAgain,
  onChangeLessons,
}: {
  levels: HuntLevel[];
  /** پس از هر شلیک — برایِ ذخیره‌یِ پاسخ. */
  onShot?: (level: HuntLevel, suspect: HuntSuspect) => void;
  /** پرونده‌یِ رویِ میز عوض شد. */
  onLevel?: (level: HuntLevel | null) => void;
  /** شکار به پایان رسید. */
  onFinish?: () => void;
  onAgain: () => void;
  onChangeLessons: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<Result[]>([]);
  const [finished, setFinished] = useState(false);
  const level = levels[index];
  const isLast = index >= levels.length - 1;
  const sfxOn = useSyncExternalStore(subscribeSfx, sfxIsOn, () => true);
  const cbs = useRef({ onShot, onLevel, onFinish });
  cbs.current = { onShot, onLevel, onFinish };

  useEffect(() => {
    if (finished) {
      sfx("finish");
      cbs.current.onFinish?.();
    }
  }, [finished]);

  useEffect(() => {
    cbs.current.onLevel?.(finished ? null : level ?? null);
  }, [level, finished]);

  /** سه فرصت برایِ کلِ شکار — سایت با هر شلیکِ اشتباه یکی از این‌ها را برمی‌دارد. */
  const [chances, setChances] = useState(CHANCES);


  const onResolve = useCallback(
    (hit: boolean, spy: HuntSuspect) => {
      if (!level) return;
      setResults((prev) => {
        if (prev.some((r) => r.level.id === level.id)) return prev;
        return [...prev, { level, hit, spy }];
      });
      if (!hit) setChances((c) => Math.max(0, c - 1));
      cbs.current.onShot?.(level, spy);
    },
    [level],
  );

  const onNext = () => {
    // شکار یا تا پایانِ فرصت‌ها ادامه می‌یابد یا تا پایانِ پرونده‌ها.
    if (isLast || chances <= 0) setFinished(true);
    else setIndex((i) => i + 1);
  };

  const escaped = useMemo(() => results.filter((r) => !r.hit), [results]);
  const hunted = results.length - escaped.length;
  const pct = results.length ? (hunted / results.length) * 100 : 0;
  /** سایت برایِ ۱۰۰٪ «perfect» می‌آورد وگرنه «great»؛ بقیه از جدول. */
  const tier = pct >= 100 ? "perfect" : (TIERS.find((t) => pct < t.to)?.tier ?? "low");
  const tierLabel = TIERS.find((t) => pct < t.to)?.label ?? "عالی";
  const copy = END_COPY[tier];

  return (
    <div className={H + "game"} dir="rtl" aria-label="جاسوسِ نقش‌ها" tabIndex={-1}>
      <div className={H + "hud"}>
        <span className={H + "count"}>
          پرونده {(Math.min(index + 1, levels.length)).toLocaleString("fa-IR")} از{" "}
          {levels.length.toLocaleString("fa-IR")}
        </span>
        <span
          className={H + "ammo"}
          data-tour="jasoos-ammo"
          role="img"
          aria-label={`فرصت: ${Math.max(0, chances).toLocaleString("fa-IR")} از ${CHANCES.toLocaleString("fa-IR")}`}
        >
          {Array.from({ length: CHANCES }, (_, a) => (
            <span key={a} className={H + "round"} data-spent={a >= chances || undefined} />
          ))}
        </span>
        <button
          type="button"
          className="game-icon-button"
          onClick={() => setSfxOn(!sfxOn)}
          aria-label={sfxOn ? "بی‌صدا" : "با صدا"}
          aria-pressed={!sfxOn}
        >
          {sfxOn ? (
            <Volume2 aria-hidden="true" className="size-4" />
          ) : (
            <VolumeX aria-hidden="true" className="size-4" />
          )}
        </button>
      </div>

      <Tour id="play-jasoos" steps={JASOOS_TOUR} />
      <ol className={H + "ticks"}>
        {levels.map((l, i) => {
          const r = results.find((x) => x.level.id === l.id);
          return (
            <li
              key={l.id}
              className={H + "tick"}
              data-state={r ? (r.hit ? "hit" : "miss") : i === index ? "now" : "todo"}
            />
          );
        })}
      </ol>

      {!finished && level && (
        <HuntCase
          key={level.id}
          level={level}
          index={index}
          total={levels.length}
          onResolve={onResolve}
          onNext={onNext}
          nextLabel={isLast ? "نتیجه" : "پروندهٔ بعد"}
        />
      )}

      {finished && (
        <section className={H + "end"} aria-labelledby="jasoos-escaped">
          {chances <= 0 && escaped.length > 0 && (
            <p className={H + "endTitle"}>فرصت‌ها تمام شد</p>
          )}
          <h3 id="jasoos-escaped" className="game-title text-lg">
            {copy.title ?? "پایان مأموریت"}
          </h3>
          {copy.lines.map((line) => (
            <p key={line}>{line}</p>
          ))}
          {escaped.length > 0 && (
            <ul className={H + "escaped"}>
              {escaped.map(({ level: l, spy }) => (
                <li key={l.id}>
                  <div className={H + "escapedHead"}>
                    جاسوس: <span>{spy.role}</span>
                  </div>
                  <p className={H + "escapedVerse"}>{l.verseLines.filter(Boolean).join(" / ")}</p>
                  <p>{spy.evidence}</p>
                </li>
              ))}
            </ul>
          )}
          <div className={H + "endScore"}>
            {results.length.toLocaleString("fa-IR")} پرونده ·{" "}
            {Math.round(pct).toLocaleString("fa-IR")} درصد شکار · {tierLabel}
          </div>
          <div className={H + "endActions"}>
            <button type="button" className={H + "next"} onClick={onAgain}>
              یک دست دیگر
            </button>
            <button type="button" className={H + "secondary"} onClick={onChangeLessons}>
              تغییر درس
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
