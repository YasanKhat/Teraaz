"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/**
 * صحنه‌ی تقطیع — همان نموداری که روی سایت هست: هر مصراع یک ردیف، هر هجا یک
 * نشانه (هجای بلند یک خطِ راست، کوتاه یک کمان)، نامِ هر رکن زیرِ آن، و یک توپ
 * که هم‌زمان با صدا روی هجاها می‌پرد.
 *
 * ⚠️ پورتِ مستقیمِ کامپوننتِ `w` از بسته‌ی زنده‌ی سایت (۲۰۲۶-۱۱-۰۸): محاسبه‌ی
 *    چیدمان، زمان‌بندیِ ترسیم، لرزشِ هر هجا هنگامِ خوردنِ توپ، و پرشِ توپ
 *    میانِ دو هجا همگی همان است.
 */

type Hemi = { longs: boolean[]; footStart: boolean[] };
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
  hemis: Hemi[];
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

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const layout = useMemo<Layout | null>(() => {
    if (!width) return null;
    const pad = Math.max(8, 0.035 * width);
    const units = (h: Hemi) => h.longs.reduce((s, l) => s + (l ? 2 : 1), 0);
    const maxUnits = Math.max(...hemis.map(units));
    if (!maxUnits) return null;

    const MW = Math.min(64, (width - 2 * pad) / maxUnits);
    const CUP = 0.18 * MW;
    const CUP_D = 0.38 * MW;
    const BR = Math.max(3.5, 0.14 * MW);
    const gap = 0.17 * MW;
    const rowH = CUP + CUP_D + 0.9 * MW + 24 + Math.min(10, 0.15 * MW);
    const top = 2 * BR + 0.6 * MW + 10;

    const cells: Cell[] = [];
    const labels: FootLabel[] = [];

    hemis.forEach((h, row) => {
      const y = top + row * rowH;
      // چیدمان از راست به چپ
      let edge = width / 2 + units(h) * (MW / 2);
      let footRight = edge;
      let curFoot = h.longs.length ? 0 : -1;

      h.longs.forEach((long, i) => {
        const u = (long ? 2 : 1) * MW;
        const foot = h.footStart[i] ? i : curFoot;
        const footId = h.footStart[i] ? h.footStart.slice(0, i + 1).filter(Boolean).length - 1 : curFoot;
        if (footId !== curFoot) {
          labels.push({ x: (footRight + edge) / 2, y: y + CUP_D + 20, foot: curFoot, row, hemi: row });
          footRight = edge;
          curFoot = footId;
        }
        cells.push({ x1: edge - gap, x2: edge - u + gap, cx: edge - u / 2, y, long, row, foot: curFoot });
        edge -= u;
      });
      labels.push({ x: (footRight + edge) / 2, y: y + CUP_D + 20, foot: curFoot, row, hemi: row });
    });

    return {
      w: width,
      h: top + hemis.length * rowH - 30,
      cells,
      feetLabels: labels,
      MW,
      SW: Math.max(1.8, 0.085 * MW),
      CUP,
      CUP_D,
      BR,
    };
  }, [hemis, width]);

  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const labelRefs = useRef<(SVGTextElement | null)[]>([]);
  const ballRef = useRef<SVGGElement | null>(null);
  const state = useRef({ playing, loading, muted });
  state.current = { playing, loading, muted };

  const hits = useRef<number[]>([]);
  /** بیدار کردنِ حلقه‌ی انیمیشن — سایت هم همین را دارد (`L.current`). */
  const kickRef = useRef<(() => void) | null>(null);
  const lastIndex = useRef(-1);
  const ballIdx = useRef(0);
  const startedAt = useRef(0);
  const wasPlaying = useRef(false);
  const versionRef = useRef("");
  const raf = useRef(0);
  const [color, setColor] = useState("56, 152, 236");

  useEffect(() => {
    const v = getComputedStyle(document.documentElement).getPropertyValue("--primary").trim();
    if (v) setColor(v.replace(/rgb\(|\)/g, ""));
  }, []);

  useEffect(() => {
    if (!layout || versionRef.current === version) return;
    versionRef.current = version;
    startedAt.current = performance.now() / 1e3;
    hits.current = [];
    lastIndex.current = -1;
  }, [layout, version]);

  useEffect(() => {
    if (!layout || !layout.cells.length) return;

    const fg = "40,40,40";
    const rgba = (t: number, a = 1) => `rgba(${fg},${a})`;
    const accent = (t: number, a = 1) => `rgba(${color},${a})`;

    const tick = () => {
      raf.current = requestAnimationFrame(tick);
      const L = layout;
      const now = performance.now() / 1e3;
      const { loading: isLoading, muted: isMuted } = state.current;
      const c = clock.current;
      const elapsed = now - startedAt.current;
      const n = L.cells.length;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let active = -1;
      let seek = 0;

      if (c) {
        seek = c.ctx.currentTime - c.start - (c.ctx.outputLatency || 0);
        const onsets = c.score.onsets;
        for (let i = 0; i < onsets.length && onsets[i] <= seek; i++) active = i;
        if (active !== lastIndex.current && active >= 0) {
          for (let r = lastIndex.current + 1; r <= active; r++) hits.current[r % n] = now - (seek - onsets[r]);
          lastIndex.current = active;
        }
      } else if (wasPlaying.current) {
        ballIdx.current = lastIndex.current >= 0 ? lastIndex.current % n : ballIdx.current;
        lastIndex.current = -1;
      }
      wasPlaying.current = !!c;

      // هنگامِ جست‌وجو، نخستین هجا را تکان می‌دهیم تا صحنه زنده بماند
      if (isLoading && (elapsed % 0.46) / 0.46 < 0.05 && (hits.current[0] ?? -9) < now - 0.23) {
        hits.current[0] = now;
      }

      const bumps: number[] = [];
      for (let i = 0; i < n; i++) {
        const cell = L.cells[i];
        const drawn = reduced ? 1 : easeOutCubic((elapsed - 0.035 * i) / 0.32);
        const since = now - (hits.current[i] ?? -9);
        const bump = reduced ? 0 : L.MW * (cell.long ? 0.2 : 0.15) * wobble(since);
        bumps[i] = bump;
        const lit = c && active % n === i ? 1 : decay(since, 0.45) * (since < 3 ? 1 : 0);
        const el = pathRefs.current[i];
        if (el) {
          el.setAttribute("d", cellPath(cell, L, bump));
          el.style.strokeDashoffset = String(1 - drawn);
          el.style.stroke = isMuted ? rgba(0, 0.22) : accent(lit, 0.92);
        }
      }

      L.feetLabels.forEach((lb, i) => {
        const el = labelRefs.current[i];
        if (!el) return;
        const cell = c && active >= 0 ? L.cells[active % n] : null;
        const on = cell && cell.foot === lb.foot && cell.row === lb.row;
        el.style.fill = on ? accent(1) : rgba(0, 0.45);
      });

      const g = ballRef.current;
      if (g) {
        const idx = Math.min(ballIdx.current, n - 1);
        let pos = ballAt(L.cells[idx], L, bumps[idx]);
        let scale = 0;
        if (c) {
          const onsets = c.score.onsets;
          if (active < 0) {
            const p0 = ballAt(L.cells[0], L, bumps[0]);
            const r = Math.min(1, Math.max(0, (seek - (onsets[0] - 0.5)) / 0.5));
            pos = { x: p0.x, y: p0.y - (p0.y + 30) * (1 - r * r) };
          } else if (active === onsets.length - 1) {
            pos = ballAt(L.cells[active % n], L, bumps[active % n]);
            scale = 0.9 * wobble(seek - onsets[active]);
          } else {
            const span = onsets[active + 1] - onsets[active];
            const t = Math.min(1, (seek - onsets[active]) / span);
            const a = ballAt(L.cells[active % n], L, bumps[active % n]);
            const b = ballAt(L.cells[(active + 1) % n], L, 0);
            const dist = Math.hypot(b.x - a.x, b.y - a.y);
            const lift = L.MW * (0.16 + 0.8 * span * span) + 0.06 * dist + 0.4 * Math.max(0, a.y - b.y);
            pos = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t - 4 * lift * t * (1 - t) };
            scale = 0.9 * wobble(seek - onsets[active]);
          }
        }
        g.setAttribute("transform", `translate(${pos.x} ${pos.y}) scale(${1 + scale})`);
      }
    };

    const kick = () => {
      if (!raf.current) raf.current = requestAnimationFrame(tick);
    };
    kickRef.current = kick;
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf.current);
      raf.current = 0;
    };
  }, [layout, clock, color]);

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
              <g key={i}>
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
                key={`f${i}`}
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
              <circle r={layout.BR} fill={`rgb(${color})`} />
            </g>
          </svg>
        )}
      </div>
    </div>
  );
}
