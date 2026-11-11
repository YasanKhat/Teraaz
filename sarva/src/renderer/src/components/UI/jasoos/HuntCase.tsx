"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Crosshair } from "lucide-react";
import { animate } from "motion/react";
import HuntAgent from "./HuntAgent";
import { sfx } from "@/lib/jasoos-sfx";
import "./hunt.css";

const H = "hunt-module__hXhGKa__";

/** یک مظنون: نقشی که ادعا می‌کند، و مدرکش. */
export type HuntSuspect = {
  role: string;
  isSpy: boolean;
  evidence: string;
  wordInVerse?: string;
};

export type HuntLevel = {
  id: number | string;
  title?: string;
  contentType?: string;
  verseLines: string[];
  suspects: HuntSuspect[];
};

/** واژه‌هایِ مدرک را در بیت نشانه می‌زنیم — همان `evidenceWords`ِ سایت. */
function markEvidence(
  lines: string[],
  words: string | undefined,
): { text: string; mark?: boolean }[][] {
  const wanted = (words ?? "")
    .split(/[\s،,؛;:]+/)
    .map((w) => w.replace(/^[«"'(]+|[»"')!؟?.،,؛;]+$/g, ""))
    .filter((w) => w.length > 1);
  return lines.map((line) => {
    if (wanted.length === 0) return [{ text: line }];
    const spans: { text: string; mark?: boolean }[] = [];
    let cursor = 0;
    for (const w of wanted) {
      const at = line.indexOf(w, cursor);
      if (at < 0) continue;
      if (at > cursor) spans.push({ text: line.slice(cursor, at) });
      spans.push({ text: w, mark: true });
      cursor = at + w.length;
    }
    if (cursor < line.length) spans.push({ text: line.slice(cursor) });
    return spans.length ? spans : [{ text: line }];
  });
}

/** بیت را در جایِ خود جا می‌دهد: قلم را می‌کاهد تا از قاب بیرون نزند. */
function fitText(el: HTMLElement) {
  el.style.fontSize = "";
  let size = parseFloat(getComputedStyle(el).fontSize);
  for (
    let i = 0;
    i < 8 && (el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1);
    i++
  ) {
    size *= 0.94;
    el.style.fontSize = `${size}px`;
  }
}

const SKYLINE_D =
  "M0 60V34h18V22h14v12h10V12h16v48zM70 60V30h22V18h8v12h14v30zM130 60V24h12V8h18v16h10v36zM186 60V36h26V20h12v40zM236 60V14h20v10h12v36zM284 60V28h18V16h14v44zM330 60V22h14v10h16V6h14v54zM380 60V30h20v30z";
const HOLE_D =
  "M0-18L2-6M16-8L5-2M14 12L4 3M-4 18L-1 6M-17 6L-5 1M-12-13L-3-4";

export default function HuntCase({
  level,
  index,
  total,
  onResolve,
  onNext,
  nextLabel,
}: {
  level: HuntLevel;
  /** شمارهٔ این پرونده (از صفر). */
  index: number;
  total: number;
  /** پایانِ پرونده: آیا جاسوس شکار شد یا در رفت. */
  onResolve: (hit: boolean, spy: HuntSuspect) => void;
  onNext: () => void;
  nextLabel: string;
}) {
  const spyIndex = level.suspects.findIndex((s) => s.isSpy);
  const spy = level.suspects[spyIndex];
  const nextRef = useRef<HTMLButtonElement>(null);
  const [phase, setPhase] = useState<"hunt" | "shot" | "reveal">("hunt");
  const [shotAt, setShotAt] = useState<number | null>(null);
  const [outcome, setOutcome] = useState<"hit" | "miss" | null>(null);
  const [escaped, setEscaped] = useState(false);
  /** نشانه رویِ کدام پنجره قفل شده (موشوار یا لمسی). */
  const [locked, setLocked] = useState<number | null>(null);
  const [touchArmed, setTouchArmed] = useState(false);
  const [aim, setAim] = useState<{ x: number; y: number } | null>(null);
  const timers = useRef<number[]>([]);

  const stageRef = useRef<HTMLDivElement>(null);
  const facadeRef = useRef<HTMLDivElement>(null);
  const verseRef = useRef<HTMLDivElement>(null);
  const windowRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const pointerType = useRef<string>("mouse");
  const geo = useRef<{ w: number; h: number; heads: { x: number; y: number }[] } | null>(null);
  const [tracer, setTracer] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);

  useEffect(() => {
    const t = timers.current;
    return () => t.forEach(clearTimeout);
  }, []);

  const after = (ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  const stateFor = (i: number): string => {
    if (phase === "hunt") return "idle";
    if (i === shotAt) return outcome === "hit" ? "down" : "struck";
    if (i === spyIndex && escaped) return "escaped";
    return "clear";
  };

  const fire = useCallback(
    (i: number) => {
      if (phase !== "hunt") return;
      const hit = level.suspects[i].isSpy;
      setShotAt(i);
      setPhase("shot");
      setTouchArmed(false);
      setTracer(null);
      sfx("shot");

      // ردِّ گلوله از پایینِ قاب تا سرِ آن مظنون، و لرزشِ لوله
      const g = measure();
      const head = g?.heads[i];
      if (g && head) setTracer({ x1: g.w / 2, y1: g.h + 8, x2: head.x, y2: head.y });
      if (stageRef.current) {
        animate(
          stageRef.current,
          { x: [0, -7, 5, -2, 0], y: [0, 6, -3, 1, 0] },
          { duration: 0.34, ease: "easeOut" },
        );
      }

      after(110, () => {
        setOutcome(hit ? "hit" : "miss");
        sfx(hit ? "down" : "miss");
      });

      if (hit) {
        after(1050, () => setPhase("reveal"));
        onResolve(true, level.suspects[spyIndex]);
      } else {
        // یک شلیک، یک پرونده: اگر خطا رفت، جاسوس همان‌جا در می‌رود.
        after(560, () => {
          setEscaped(true);
          sfx("escape");
        });
        after(1350, () => setPhase("reveal"));
        onResolve(false, level.suspects[spyIndex]);
      }
    },
    [phase, level, spyIndex, onResolve],
  );

  // کلیدهای ۱ تا n — همان که سایت در span.keys نشان می‌دهد.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.repeat) return;
      if (phase !== "hunt") return;
      const n = Number(e.key);
      if (Number.isFinite(n) && n >= 1 && n <= level.suspects.length) {
        e.preventDefault();
        fire(n - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, level, fire]);

  /** جایِ قاب و سرِ هر مظنون را می‌سنجد — همان محاسبه‌یِ سایت. */
  const measure = () => {
    const stage = stageRef.current;
    if (!stage) return null;
    const box = stage.getBoundingClientRect();
    const heads = windowRefs.current.map((btn) => {
      const pane = btn?.querySelector(`.${H}pane`)?.getBoundingClientRect();
      if (!pane) return { x: 0, y: 0 };
      const l = 0.86 * pane.height;
      const top = pane.bottom + 0.03 * pane.height - l;
      return { x: pane.left + pane.width / 2 - box.left, y: top + (54 / 130) * l - box.top };
    });
    geo.current = { w: box.width, h: box.height, heads };
    return geo.current;
  };

  /** چشم‌هایِ مظنون‌ها نشانه را دنبال می‌کنند (--ex / --ey رویِ هر پنجره). */
  const trackEyes = (x: number, y: number) => {
    const g = geo.current;
    if (!g) return;
    g.heads.forEach((head, i) => {
      const dx = x - head.x;
      const dy = y - head.y;
      const r = Math.hypot(dx, dy) || 1;
      const k = Math.min(1, r / 220);
      const el = windowRefs.current[i];
      el?.style.setProperty("--ex", `${((dx / r) * 2.2 * k).toFixed(2)}px`);
      el?.style.setProperty("--ey", `${((dy / r) * 1.6 * k).toFixed(2)}px`);
    });
  };

  const onStageMove = (e: React.PointerEvent) => {
    if (e.pointerType === "touch") return;
    const g = measure() ?? geo.current;
    const box = stageRef.current?.getBoundingClientRect();
    if (!g || !box) return;
    const x = e.clientX - box.left;
    const y = e.clientY - box.top;
    setAim({ x, y });
    trackEyes(x, y);
  };

  // بیت در جایِ خود جا شود، و با تغییرِ اندازه دوباره
  useEffect(() => {
    const el = verseRef.current;
    if (!el) return;
    fitText(el);
    const ro = new ResizeObserver(() => fitText(el));
    ro.observe(el);
    return () => ro.disconnect();
  }, [level.id, phase === "reveal"]);

  const aiming = phase === "shot" || (phase === "hunt" && (touchArmed || locked !== null));
  const revealed = phase === "reveal";
  const marked = markEvidence(
    level.verseLines.filter(Boolean),
    revealed ? level.suspects[shotAt ?? spyIndex]?.wordInVerse : undefined,
  );
  const resolved = shotAt !== null ? level.suspects[shotAt] : revealed ? level.suspects[spyIndex] : null;

  return (
    <section
      className={H + "case"}
      data-phase={phase}
      data-outcome={outcome ?? undefined}
    >
      <div
        ref={stageRef}
        className={H + "stage"}
        data-aiming={aiming || undefined}
        onPointerMove={onStageMove}
      >
        <span className={H + "moon"} aria-hidden="true" />

        <div className={H + "intel"} data-tour="jasoos-verse">
          <div ref={verseRef} className={H + "verse"} data-prose={level.contentType !== "poem" || undefined}>
            {marked.map((line, i) => (
              <p key={i}>
                {line.map((seg, j) =>
                  seg.mark ? (
                    <mark key={j} className={H + "evidence"}>
                      {seg.text}
                    </mark>
                  ) : (
                    <span key={j}>{seg.text}</span>
                  ),
                )}
              </p>
            ))}
          </div>
        </div>

        <div ref={facadeRef} className={H + "facade"}>
          <svg className={H + "skyline"} viewBox="0 0 400 60" preserveAspectRatio="none" aria-hidden="true">
            <path d={SKYLINE_D} />
          </svg>
          <div
            className={H + "windows"}
            data-tour="jasoos-windows"
            data-n={level.suspects.length}
            style={{ ["--n" as string]: level.suspects.length }}
          >
            {level.suspects.map((s, i) => {
              const st = stateFor(i);
              return (
                <button
                  key={i}
                  type="button"
                  ref={(el) => {
                    windowRefs.current[i] = el;
                  }}
                  className={H + "window"}
                  style={{ ["--i" as string]: i }}
                  data-state={st}
                  data-locked={locked === i || undefined}
                  disabled={phase !== "hunt"}
                  aria-label={`شلیک به ${s.role}`}
                  onPointerDown={(e) => {
                    pointerType.current = e.pointerType;
                  }}
                  onPointerEnter={(e) => {
                    if (e.pointerType !== "touch") {
                      setLocked(i);
                      if (phase === "hunt") sfx("lock");
                    }
                  }}
                  onPointerLeave={(e) => {
                    if (e.pointerType !== "touch") setLocked(null);
                  }}
                  onClick={(e) => {
                    // روی لمسی: زدنِ نخست نشانه را می‌گذارد، دومی شلیک می‌کند.
                    if (e.detail === 0 && pointerType.current === "touch" && locked !== i) {
                      setTouchArmed(true);
                      setLocked(i);
                      return;
                    }
                    fire(i);
                  }}
                >
                  <span className={H + "pane"}>
                    <span className={H + "agent"}>
                      <HuntAgent outfit={i} />
                    </span>
                    <span className={H + "sash"} aria-hidden="true" />
                    {st === "struck" && (
                      <svg className={H + "hole"} viewBox="-20 -20 40 40" aria-hidden="true">
                        <path d={HOLE_D} />
                        <circle r="4.2" />
                      </svg>
                    )}
                    {st === "down" && (
                      <span className={H + "stamp"} aria-hidden="true">
                        شکار شد
                      </span>
                    )}
                    {st === "escaped" && (
                      <span className={H + "stamp"} aria-hidden="true">
                        در رفت
                      </span>
                    )}
                  </span>
                  <span className={H + "plate"}>
                    <span className={H + "plateNum"} aria-hidden="true">
                      {(i + 1).toLocaleString("fa-IR")}
                    </span>
                    <span className={H + "role"}>{s.role}</span>
                    <span className={H + "plateSub"} aria-hidden="true">
                      {st === "down" ? "شکار شد" : st === "escaped" ? "در رفت" : st === "struck" ? "اشتباه" : ""}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <span className={H + "scopeClip"} aria-hidden="true">
          <span
            className={H + "scope"}
            data-on={aiming || undefined}
            data-locked={locked !== null || undefined}
            style={
              aim
                ? { left: aim.x, top: aim.y }
                : undefined
            }
          >
            <svg viewBox="-50 -50 100 100">
              <g className={H + "reticleUnder"}>
                <circle r="30" />
                <path d="M-47 0h32M15 0h32M0-47v32M0 15v32" />
              </g>
              <g className={H + "reticleInk"}>
                <circle r="30" />
                <path d="M-47 0h32M15 0h32M0-47v32M0 15v32" />
                <circle r="1.8" className={H + "reticleDot"} />
                <path d="M-9-30v6M9-30v6M-9 30v-6M9 30v-6" className={H + "reticleTicks"} />
              </g>
            </svg>
            {(locked !== null || phase !== "hunt") && (
              <span className={H + "readout"}>
                {phase === "hunt" && locked !== null
                  ? level.suspects[locked].role
                  : outcome === "hit"
                    ? "شکار شد!"
                    : outcome === "miss"
                      ? "در رفت"
                      : ""}
              </span>
            )}
          </span>
        </span>

        <svg className={H + "tracer"} aria-hidden="true">
          {tracer && (
            <line
              x1={tracer.x1}
              y1={tracer.y1}
              x2={tracer.x2}
              y2={tracer.y2}
              style={{
                ["--len" as string]: Math.hypot(tracer.x2 - tracer.x1, tracer.y2 - tracer.y1),
              }}
            />
          )}
        </svg>
        <span className={H + "flash"} aria-hidden="true" data-on={phase === "shot" || undefined} />
      </div>

      <div className={H + "console"} data-tour="jasoos-console">
        {revealed ? (
          <div className={H + "debrief"} role="status">
            <div className={H + "debriefCopy"}>
              <h3 className={H + "debriefTitle"}>
                {outcome === "hit"
                  ? "شکار شد!"
                  : `جاسوس «${spy.role}» بود و در رفت.`}
              </h3>
              <p>{spy.evidence}</p>
            </div>
            <button
              ref={nextRef}
              type="button"
              className={H + "next"}
              onClick={onNext}
            >
              {nextLabel}
              <ArrowLeft aria-hidden="true" className="size-4" />
            </button>
          </div>
        ) : (
          <div className={H + "brief"}>
            <Crosshair aria-hidden="true" className={H + "briefIcon"} />
            <p>
              {touchArmed && locked !== null
                ? "دوباره بزن تا شلیک شود."
                : `نقشی را بزن که در این ${level.contentType === "poem" ? "بیت" : "جمله"} نیست.`}
            </p>
            {touchArmed && locked !== null && phase === "hunt" ? (
              <button type="button" className={H + "fireBtn"} onClick={() => fire(locked)}>
                شلیک
              </button>
            ) : (
              <span className={H + "keys"} aria-hidden="true">
                <kbd>۱</kbd>–<kbd>{level.suspects.length.toLocaleString("fa-IR")}</kbd>
              </span>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
