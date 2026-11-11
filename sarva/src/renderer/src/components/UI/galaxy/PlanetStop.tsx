"use client";

import { Link } from "@/app/router";
import { motion } from "motion/react";
import { RevealGroup, RevealItem, RevealWords } from "@/components/UI/aruz/reveal";
import PlanetSlot from "./PlanetSlot";
import type { PlanetKind } from "./planetKind";

export type Stop = {
  index: string;
  tag: string;
  title: string;
  desc: string;
  steps: string[];
  href: string;
  cta: string;
  accent: string;
  planet: PlanetKind;
};

/** نشانی‌هایی که بازی‌شان هنوز راه نیفتاده: به‌جایِ دکمهٔ «شروع» یک نشانِ
 *  «به‌زودی» می‌گیرند. این همان سازوکارِ خودِ سایت است — آنجا یک
 *  `new Set(["/game/taar"])` پشتِ تابعِ `isSoon` است. */
const SOON_HREFS = new Set([
  "/game/taar",
  // ⚠️ این دو بازی هنوز به برنامه نیامده‌اند. همین‌که داده‌شان برسد و
  //    ساخته شوند، تنها همین دو رشته از این مجموعه بیرون می‌روند و
  //    دکمهٔ «شروع» خودبه‌خود برمی‌گردد.
  "/game/imla",
  "/game/tarazoo",
]);

export function isSoon(href: string) {
  return SOON_HREFS.has(href);
}

/** One stop on the galaxy map: a planet on one side, its briefing panel on the
 *  other. Sides alternate so the space cable can weave between them. */
export default function PlanetStop({
  stop,
  flip,
  reduced,
}: {
  stop: Stop;
  flip: boolean;
  reduced: boolean;
}) {
  const { index, tag, title, desc, steps, href, cta, accent, planet } = stop;

  return (
    <section
      dir="rtl"
      className="relative z-20 container flex min-h-[86vh] items-center py-16"
    >
      <div className="grid w-full items-center gap-8 lg:grid-cols-2 lg:gap-14">
        {/* the planet
            ⚠️ این wrapper عمداً هیچ transform ای ندارد.

            قبلاً همین جعبه یک `motion.div` با `initial={{ scale: 0.7 }}` بود
            و `PlanetSlot` داخلش. صحنه اسلات را یک بار با
            `getBoundingClientRect()` اندازه می‌گیرد — و برای سیاره‌هایی که
            هنوز به دیدرس نرسیده بودند، آن اندازه‌گیری روی حالتِ ۷۰٪ می‌افتاد.
            نتیجه: سیاره‌های پایینِ صفحه برای همیشه کوچک می‌ماندند.

            حالا اسلات در یک جعبهٔ ثابت است و «ظاهر شدن» داخلِ خودِ صحنهٔ
            سه‌بعدی انجام می‌شود (GalaxyScene → Planets). هالهٔ تزئینی هنوز
            انیمیشن دارد، چون اندازه‌گیری‌ای رویش انجام نمی‌شود. */}
        <div
          className={`relative z-10 flex justify-center ${flip ? "lg:order-2" : ""}`}
        >
          {/* planet halo — a radial gradient, NOT a blurred div. A 70px blur on
              a 288px box forces the compositor to allocate and filter a texture
              for every planet; a gradient paints in one pass and looks the
              same. */}
          <motion.div
            aria-hidden
            initial={reduced ? false : { opacity: 0, scale: 0.7 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ type: "spring", stiffness: 70, damping: 16 }}
            className="pointer-events-none absolute left-1/2 top-1/2 size-80 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              background: `radial-gradient(closest-side, ${accent}55, ${accent}22 45%, transparent 72%)`,
            }}
          />
          <PlanetSlot kind={planet} />
        </div>

        {/* briefing panel — opaque so the starfield never washes out the text */}
        <RevealGroup
          stagger={0.1}
          className={`relative z-20 ${flip ? "lg:order-1" : ""}`}
        >
          <div className="relative z-20 rounded-[1.75rem] border border-border bg-card p-6 shadow-2xl sm:p-8">
            <RevealItem>
              <div className="mb-4 flex items-center gap-3">
                <span
                  className="font-mono text-xs tracking-[0.3em]"
                  style={{ color: accent }}
                >
                  PLANET {index}
                </span>
                <span className="h-px flex-1" style={{ background: `${accent}55` }} />
                <span
                  className="rounded-full px-3 py-1 text-xs font-bold"
                  style={{
                    color: accent,
                    background: `color-mix(in oklch, ${accent} 14%, transparent)`,
                  }}
                >
                  {tag}
                </span>
              </div>
            </RevealItem>

            {/* نامِ بازی با پفک؛ توضیح و گام‌ها با وزیرمتن می‌مانند. */}
            <h2 className="game-display text-2xl font-black text-foreground sm:text-3xl">
              <RevealWords text={title} inherit />
            </h2>

            <RevealItem>
              <p className="mt-3 leading-relaxed text-muted-foreground">{desc}</p>
            </RevealItem>

            <RevealItem>
              <ul className="mt-5 space-y-2.5">
                {steps.map((s, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 text-sm text-foreground/90"
                  >
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2.5}
                        className="size-3"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m4.5 12.75 6 6 9-13.5"
                        />
                      </svg>
                    </span>
                    {s}
                  </li>
                ))}
              </ul>
            </RevealItem>

            <RevealItem>
              {isSoon(href) ? (
                <span
                  className="mt-7 inline-flex min-h-11 cursor-not-allowed items-center gap-2 rounded-xl border border-border bg-muted px-6 font-bold text-muted-foreground"
                  aria-disabled="true"
                >
                  به‌زودی
                </span>
              ) : (
                <Link
                  href={href}
                  className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-6 font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:brightness-95 active:scale-95"
                >
                  {cta}
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    className="size-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M11 6 5 12l6 6M19 12H5"
                    />
                  </svg>
                </Link>
              )}
            </RevealItem>
          </div>
        </RevealGroup>
      </div>
    </section>
  );
}
