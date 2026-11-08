"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTokenRgb } from "@/lib/theme/use-primary-rgb";

/**
 * صحنه‌ی تقطیع — همان نموداری که روی سایت هست: هر مصراع یک ردیف، هر هجا یک
 * نشانه (هجای بلند یک خطِ راست، کوتاه یک کمان)، نامِ هر رکن زیرِ آن، و یک توپ
 * که هم‌زمان با صدا روی هجاها می‌پرد.
 *
 * ⚠️ پورتِ مستقیمِ کامپوننتِ `w` از بسته‌ی زنده‌ی سایت (۲۰۲۶-۱۱-۰۸): محاسبه‌ی
 *    چیدمان، زمان‌بندیِ ترسیم، لرزشِ هر هجا هنگامِ خوردنِ توپ، و پرشِ توپ
 *    میانِ دو هجا همگی همان است.
 *
 * نکته‌ی مهم: این کامپوننت `hemis` را به شکلِ **خروجیِ خامِ bareHemi** می‌گیرد
 * (هر هجا `{long, foot}` با شماره‌ی رکن)، نه `{longs, footStart}`. پیش از این
 * شکلِ دوم را می‌گرفت و شماره‌ی رکن را با حدس بازسازی می‌کرد، که باعث می‌شد
 * ارکانِ زیرِ خط‌ها غلط چیده شوند.
 */

/** یک هجایِ خام، همان‌طور که bareHemi می‌سازد. */
type Syll = { long: boolean; foot: number };
type Cell = { x1: number; x2: number; cx: number; y: number; long: boolean; row: number; foot: number };
type FootLabel = { x: number; y: number; foot: number; row: number; hemi: number };
type Layout = {
  w: number;
  h: number;
  cells: Cell[];
  feetLabels: FootLabel[];
  MW: number;
  SW: number;
  CUP: number;
  CUP_D: number;
  BR: number;
};

/** لرزشِ هجا وقتی توپ رویش می‌افتد. */
const wobble = (t: number) => (t < 0 ? 0 : Math.exp(-t / 0.09) * Math.sin(2 * t * Math.PI * 6.5));
/** واماندگیِ ساده. */
const decay = (t: number, tau: number) => (t < 0 ? 0 : Math.exp(-t / tau));
/** سه‌گامیِ آسان‌گیر. */
const easeOutCubic = (e: number) => 1 - (1 - Math.min(1, Math.max(0, e))) ** 3;

/** مسیرِ یک هجا: بلند خطیِ راست، کوتاه کمانی رو به پایین. */
function cellPath(c: Cell, L: Layout, bump: number): string {
  if (c.long) return `M${c.x1} ${c.y}Q${c.cx} ${c.y + 2 * bump} ${c.x2} ${c.y}`;
  const a = { x: c.x1, y: c.y - L.CUP };
  const n = { x: c.x1 + 2, y: c.y + L.CUP_D + bump };
  const s = { x: c.x2 - 2, y: c.y + L.CUP_D + bump };
  const l = { x: c.x2, y: c.y - L.CUP };
  return `M${a.x} ${a.y}C${n.x} ${n.y} ${s.x} ${s.y} ${l.x} ${l.y}`;
}

/** جایِ توپ روی یک هجا. */
function ballAt(c: Cell, L: Layout, bump = 0) {
  return c.long
    ? { x: c.cx, y: c.y + bump - L.SW / 2 - 0.95 * L.BR }
    : { x: c.cx, y: c.y - 0.25 * L.CUP + 0.75 * (L.CUP_D + bump) - L.SW / 2 - 0.95 * L.BR };
}

export type Clock = { ctx: AudioContext; start: number; score: { onsets: number[] } } | null;

export default function VaznYabStage({
  hemis,
  feet,
  clock,
  playing,
  loading,
  muted,
  version,
  cheer = "",
}: {
  hemis: Syll[][];
  feet: string[];
  clock: React.MutableRefObject<Clock>;
  playing: boolean;
  loading: boolean;
  muted: boolean;
  version: string;
  cheer?: string;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);
  const primary = useTokenRgb("--primary");
  const foreground = useTokenRgb("--foreground", "40,40,40");

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── چیدمان ─────────────────────────────────────────────────────────
  const layout = useMemo<Layout | null>(() => {
    if (!width || !hemis.length) return null;

    const pad = Math.max(8, 0.035 * width);
    const unitsOf = (h: Syll[], from = 0, to = h.length) =>
      h.slice(from, to).reduce((s, x) => s + (x.long ? 2 : 1), 0);
    const rows = hemis.map((_h, i) => ({ hemi: i, from: 0, to: hemis[i].length }));
    const widest = Math.max(...hemis.map((h) => unitsOf(h)));
    if (!widest) return null;

    const MW = Math.min(64, (width - 2 * pad) / widest);
    const SW = Math.max(1.8, 0.085 * MW);
    const CUP = 0.18 * MW;
    const CUP_D = 0.38 * MW;
    const BR = Math.max(3.5, 0.14 * MW);
    const gap = 0.17 * MW;
    const rowH = CUP + CUP_D + 0.9 * MW + 24 + Math.min(10, 0.15 * MW);
    const top = 2 * BR + 0.6 * MW + 10;

    const cells: Cell[] = [];
    const labels: FootLabel[] = [];

    // چیدمان از راست به چپ، همان‌طور که در سایت است
    rows.forEach((row, ri) => {
      const h = hemis[row.hemi];
      const y = top + ri * rowH;
      let edge = width / 2 + (unitsOf(h, row.from, row.to) * MW) / 2;
      let footRight = edge;
      let curFoot = h[row.from]?.foot;

      for (let i = row.from; i < row.to; i++) {
        const syl = h[i];
        const u = (syl.long ? 2 : 1) * MW;
        if (syl.foot !== curFoot) {
          labels.push({ x: (footRight + edge) / 2, y: y + CUP_D + 20, foot: curFoot, row: ri, hemi: row.hemi });
          footRight = edge;
          curFoot = syl.foot;
        }
        cells.push({ x1: edge - gap, x2: edge - u + gap, cx: edge - u / 2, y, long: syl.long, row: ri, foot: syl.foot });
        edge -= u;
      }
      labels.push({ x: (footRight + edge) / 2, y: y + CUP_D + 20, foot: curFoot, row: ri, hemi: row.hemi });
    });

    return { w: width, h: top + rows.length * rowH - 30, cells, feetLabels: labels, MW, SW, CUP, CUP_D, BR };
  }, [hemis, width]);

  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const labelRefs = useRef<(SVGTextElement | null)[]>([]);
  const ballRef = useRef<SVGGElement | null>(null);

  const state = useRef({ playing, loading, muted });
  const hits = useRef<number[]>([]); // زمانِ خوردنِ توپ روی هر هجا
  const kickRef = useRef<(() => void) | null>(null);
  const lastOnset = useRef(-1);
  const ballIdx = useRef(0);
  const wasPlaying = useRef(false);
  const startedAt = useRef(0);
  const versionRef = useRef("");
  const raf = useRef(0);

  // با عوض شدنِ وزن، همه چیز از نو
  useEffect(() => {
    if (!layout || versionRef.current === version) return;
    versionRef.current = version;
    startedAt.current = performance.now() / 1e3;
    hits.current = [];
    lastOnset.current = -1;
    /* توپ باید به خانه‌ی نخست برگردد. هنگامِ توقف، جایش در `ballIdx` یخ
       می‌زند (پایین‌تر، در شاخه‌ی `wasPlaying`)؛ بی‌این خط، اگر وسطِ ریتم
       توقف کنی و بعد وزن را عوض کنی، توپ همان‌جا در ناحیه‌ی میانی می‌ماند و
       تنها وقتی صدا آغاز شود یک‌باره به اول می‌پرد. */
    ballIdx.current = 0;
    /* و حلقه باید دوباره راه بیفتد: وقتی نه در حال پخش است و نه در حالِ
       جست‌وجو، `cont` غلط است و rAF خاموش مانده؛ بی‌این تکان، جایِ تازه پیش
       از آغازِ موسیقی کشیده نمی‌شود. */
    kickRef.current?.();
  }, [layout, version]);

  // ── حلقه‌ی انیمیشن ─────────────────────────────────────────────────
  useEffect(() => {
    if (!layout || !layout.cells.length) return;

    const to = primary.split(",").map(Number);
    const from = foreground.split(",").map(Number);
    /** درون‌یابی از رنگِ پیش‌زمینه به رنگِ تأکیدی. */
    const mix = (t: number, a = 1) =>
      `rgba(${to.map((p, i) => Math.round(from[i] + (p - from[i]) * t)).join(",")},${a})`;

    const n = layout.cells.length;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const tick = () => {
      raf.current = 0;
      const L = layout;
      const now = performance.now() / 1e3;
      const { loading: isLoading, muted: isMuted } = state.current;
      const clk = clock.current;
      const elapsed = now - startedAt.current;

      let cont = false;
      let active = -1;
      let seek = 0;

      if (clk) {
        seek = clk.ctx.currentTime - clk.start - (clk.ctx.outputLatency || 0);
        const onsets = clk.score.onsets;
        for (let i = 0; i < onsets.length && onsets[i] <= seek; i++) active = i;
        if (active !== lastOnset.current && active >= 0) {
          for (let k = lastOnset.current + 1; k <= active; k++) hits.current[k % n] = now - (seek - onsets[k]);
          lastOnset.current = active;
        }
        cont = true;
      } else if (wasPlaying.current) {
        ballIdx.current = lastOnset.current >= 0 ? lastOnset.current % n : ballIdx.current;
        lastOnset.current = -1;
      }
      wasPlaying.current = !!clk;

      // هنگامِ جست‌وجو، نخستین هجا تکان می‌خورد تا صحنه زنده بماند
      if (isLoading) {
        if ((now % 0.46) / 0.46 < 0.05 && (hits.current[0] ?? -9) < now - 0.23) hits.current[0] = now;
        cont = true;
      }

      const bumps: number[] = [];
      for (let i = 0; i < n; i++) {
        const cell = L.cells[i];
        const drawn = reduced ? 1 : easeOutCubic((elapsed - 0.035 * i) / 0.32);
        if (drawn < 1) cont = true;
        const since = now - (hits.current[i] ?? -9);
        if (since < 0.9) cont = true;
        const bump = reduced ? 0 : L.MW * (cell.long ? 0.2 : 0.15) * wobble(since);
        bumps[i] = bump;
        const lit = clk && active % n === i ? 1 : decay(since, 0.45) * (since < 3 ? 1 : 0);
        const el = pathRefs.current[i];
        if (el) {
          el.setAttribute("d", cellPath(cell, L, bump));
          el.style.strokeDashoffset = String(1 - drawn);
          el.style.stroke = isMuted ? mix(0, 0.22) : mix(lit, 0.92);
        }
      }

      // رکنی که توپ رویش است، پُررنگ می‌شود
      L.feetLabels.forEach((lb, i) => {
        const el = labelRefs.current[i];
        if (!el) return;
        const on = clk && active >= 0 ? L.cells[active % n] : null;
        const isActive = !!on && on.foot === lb.foot && on.row === lb.row;
        el.style.fill = isActive ? mix(1) : mix(0, 0.45);
      });

      // ── توپ ────────────────────────────────────────────────────────
      const g = ballRef.current;
      if (g) {
        const idx = Math.min(ballIdx.current, n - 1);
        let pos = ballAt(L.cells[idx], L, bumps[idx]);
        let lift = 0;

        if (clk) {
          const onsets = clk.score.onsets;
          if (active < 0) {
            // هنوز شروع نشده: از بالا می‌آید
            const p0 = ballAt(L.cells[0], L, bumps[0]);
            const t = Math.min(1, Math.max(0, (seek - (onsets[0] - 0.5)) / 0.5));
            pos = { x: p0.x, y: p0.y - (p0.y + 30) * (1 - t * t) };
          } else if (active === onsets.length - 1) {
            pos = ballAt(L.cells[active % n], L, bumps[active % n]);
            lift = 0.9 * wobble(seek - onsets[active]);
          } else {
            const span = onsets[active + 1] - onsets[active];
            const t = Math.min(1, (seek - onsets[active]) / span);
            const a = ballAt(L.cells[active % n], L, bumps[active % n]);
            const b = ballAt(L.cells[(active + 1) % n], L, 0);
            const dist = Math.hypot(b.x - a.x, b.y - a.y);
            const arc = L.MW * (0.16 + 0.8 * span * span) + 0.06 * dist + 0.4 * Math.max(0, a.y - b.y);
            pos = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t - 4 * arc * t * (1 - t) };
            lift = 0.9 * wobble(seek - onsets[active]);
          }
        } else if (isLoading) {
          const t = (now % 0.46) / 0.46;
          pos = { x: pos.x, y: pos.y - 0.9 * L.MW * 4 * t * (1 - t) };
        } else {
          const t = reduced ? 1 : Math.min(1, Math.max(0, (elapsed - 0.3 - 0.035 * n) / 0.45));
          if (t < 1) {
            pos = { x: pos.x, y: pos.y - (pos.y + 30) * (1 - t * t) };
            cont = true;
          } else if (t >= 1 && (hits.current[0] ?? -9) < startedAt.current) {
            hits.current[0] = now;
          }
        }

        const squash = Math.max(lift, wobble(now - (hits.current[idx] ?? -9)) * (clk ? 0 : 0.8));
        const sx = 1 + 0.35 * Math.max(0, squash);
        const sy = 1 - 0.3 * Math.max(0, squash);
        g.setAttribute("transform", `translate(${pos.x} ${pos.y}) scale(${sx} ${sy})`);
        g.style.opacity = isMuted ? "0" : "1";
      }

      if (cont || clk) raf.current = requestAnimationFrame(tick);
    };

    kickRef.current = () => {
      if (!raf.current) raf.current = requestAnimationFrame(tick);
    };
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf.current);
      raf.current = 0;
    };
  }, [layout, clock, primary, foreground]);

  /* ── جشن ────────────────────────────────────────────────────────────
   * وقتی حدس درست باشد، سایت یک موجِ لرزش روی همه‌ی هجاها می‌فرستد: هر
   * سلول ۴۵ میلی‌ثانیه دیرتر از قبلی تکان می‌خورد. مستقیم از کامپوننتِ `w`.
   */
  const cheered = useRef("");
  useEffect(() => {
    if (!layout || !cheer || cheered.current === cheer) return;
    cheered.current = cheer;
    const now = performance.now() / 1e3;
    layout.cells.forEach((_c, i) => {
      hits.current[i] = now + 0.35 + 0.045 * i;
    });
    kickRef.current?.();
  }, [cheer, layout]);

  useEffect(() => {
    state.current = { playing, loading, muted };
    kickRef.current?.();
  }, [playing, loading, muted]);

  return (
    <div className=" px-2 py-6 sm:px-6 sm:py-8">
      <div ref={hostRef} data-vy-stage className=" relative w-full" style={{ height: layout?.h ?? 220 }}>
        {layout && (
          <svg
            width={layout.w}
            height={layout.h}
            viewBox={`0 0 ${layout.w} ${layout.h}`}
            className=" absolute inset-0 overflow-visible"
            aria-hidden
          >
            {layout.cells.map((c, i) => (
              <g key={`${version}-${i}`}>
                <path
                  ref={(el) => {
                    pathRefs.current[i] = el;
                  }}
                  d={cellPath(c, layout, 0)}
                  pathLength={1}
                  strokeDasharray="1 2"
                  strokeDashoffset={1}
                  strokeWidth={layout.SW}
                  strokeLinecap="round"
                  fill="none"
                />
              </g>
            ))}
            {layout.feetLabels.map((lb, i) => (
              <text
                key={`${version}-f${i}`}
                ref={(el) => {
                  labelRefs.current[i] = el;
                }}
                x={lb.x}
                y={lb.y}
                textAnchor="middle"
                direction="rtl"
                style={{ fontSize: Math.max(11, Math.min(14, 0.24 * layout.MW)), fontWeight: 500 }}
              >
                {feet[lb.foot] ?? ""}
              </text>
            ))}
            <g ref={ballRef}>
              <circle r={layout.BR} fill={`rgb(${primary})`} />
            </g>
          </svg>
        )}
      </div>
    </div>
  );
}
