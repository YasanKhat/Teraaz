"use client";

import { motion } from "motion/react";

/**
 * «راهنما» — بخشِ پایانیِ صفحه‌ی وزن‌یاب.
 *
 * ⚠️ این بخش در این پورت وجود نداشت و کلاس‌ها و متن‌هایش عیناً از DOMِ زنده‌ی
 *    /vazn-yab استخراج شده‌اند (۲۰۲۶-۱۱-۰۸). متنِ سه نکته توضیحِ رفتارِ واقعیِ
 *    برنامه است (تسکین و قلب، تفاوتِ گنجور با پیشنهادِ موتور، حالتِ استادی)؛
 *    همان‌طور که سایت آن‌ها را می‌گوید.
 */

const EASE = [0.16, 1, 0.3, 1] as const;

const STEPS = [
  {
    icon: "write",
    title: "بیت را بنویس",
    body: "هر مصراع در خانهٔ خودش، یا کل بیت را یک‌جا بچسبان. «بیت تصادفی» هم یک بیت از گنجور می‌آورد.",
  },
  {
    icon: "scan",
    title: "وزن و تقطیع را ببین",
    body: "نام بحر، ارکان و علامت‌های هجایی وزن. اگر بیت در گنجور باشد، وزنش از همان‌جا تأیید می‌شود.",
  },
  {
    icon: "ball",
    title: "ریتمش را بشنو",
    body: "توپ روی هجاها می‌پرد و ساز، وزن را می‌نوازد. دستگاه و سرعت را هم می‌شود عوض کرد.",
  },
];

const MARKS = [
  { name: "هجای کوتاه", desc: "صامت و مصوت کوتاه", example: "«بِ» در بِرو" },
  { name: "هجای بلند", desc: "صامت و مصوت بلند، یا صامت و مصوت کوتاه و صامت", example: "«تا»، «دل»" },
  { name: "هجای کشیده", desc: "یک بلند و یک کوتاه حساب می‌شود", example: "«دوست»، «کار»" },
];

const NOTES = [
  {
    q: "چرا علامت‌ها گاهی با تلفظ بیت یکی نیست؟",
    a: "علامت‌ها از خودِ وزن است، نه از بیت. شاعر گاهی از اختیارات شاعری استفاده می‌کند؛ مثلاً به‌جای دو هجای کوتاه یک هجای بلند می‌آورد (تسکین) یا جای کوتاه و بلند را عوض می‌کند (قلب). هجای پایان هر مصراع هم همیشه بلند حساب می‌شود. وزن‌یاب همیشه الگوی اصلی وزن را نشان می‌دهد.",
  },
  {
    q: "«ثبت‌شده در گنجور» و «پیشنهاد موتور» چه فرقی دارند؟",
    a: "اگر بیت در گنجور باشد، وزنش از همان‌جا خوانده می‌شود. اگر نباشد، موتور وزن‌یاب وزن را از روی هجاها حدس می‌زند؛ حدسش معمولاً درست است ولی ممکن است اشتباه کند.",
  },
  {
    q: "حالت استادی چیست؟",
    a: "قبل از دیدن جواب، ارکان را به ترتیب انتخاب کن. بعد از «پیدا کن» هر رکنِ حدست درست یا غلط علامت می‌خورد. اگر ارکان درست باشد ولی تعدادشان نه، جواب «نزدیک» است.",
  },
];

/**
 * آیکونِ هر گام — همان سه نگاره‌ی صفحه‌ی سایت، که خودشان نمودارِ تقطیع‌اند:
 * خط‌ها هجاها، کمان‌ها هجای بلند، و در سومی یک توپ که روی هجاها می‌پرد.
 */
function StepIcon({ kind }: { kind: "write" | "scan" | "ball" }) {
  if (kind === "write") {
    return (
      <div className=" space-y-2.5" aria-hidden>
        <div className=" flex items-center gap-2">
          <span className=" h-0.5 w-24 rounded-full bg-foreground/70" />
          <span className=" h-4 w-0.5 animate-pulse rounded-full bg-primary" />
        </div>
        <span className=" block h-0.5 w-32 rounded-full bg-foreground/25" />
      </div>
    );
  }
  if (kind === "scan") {
    return (
      <svg viewBox="-4 0 198 26" width="198" height="26" className=" overflow-visible text-foreground/80" aria-hidden>
        <path
          d="M188 9C188 23 176 23 176 9M166 16H138M128 16H100M90 9C90 23 78 23 78 9M68 16H40M30 16H2"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="-4 0 138 26" width="138" height="26" className=" overflow-visible text-foreground/80" aria-hidden>
      <path
        d="M128 16H100M90 9C90 23 78 23 78 9M68 16H40M30 16H2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <circle cx="84" cy="13" r="4" className=" fill-primary" />
    </svg>
  );
}

export default function VaznYabGuide() {
  return (
    <motion.section
      dir="rtl"
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.6, ease: EASE }}
      className=" relative z-20 mx-auto mt-20 w-full max-w-5xl sm:mt-28"
    >
      <div className=" grid gap-10 lg:grid-cols-[17rem_1fr] lg:gap-16">
        <header className=" lg:sticky lg:top-28 lg:self-start">
          <h2 className=" text-3xl font-black text-foreground sm:text-4xl">راهنما</h2>
          <p className=" mt-4 leading-8 text-muted-foreground">
            وزن‌یاب وزن عروضی هر بیت فارسی را پیدا می‌کند، علامت‌های هجایی‌اش را نشان
            می‌دهد و ریتمش را می‌نوازد.
          </p>
        </header>

        <div className=" space-y-14">
          {/* ── سه گام ────────────────────────────────────────────── */}
          <ol className=" grid gap-4 sm:grid-cols-3">
            {STEPS.map((s) => (
              <li key={s.title} className=" flex flex-col rounded-3xl border border-border bg-card p-6">
                <div className=" flex h-14 items-center">
                  <StepIcon kind={s.icon} />
                </div>
                <h3 className=" mt-5 font-bold text-foreground">{s.title}</h3>
                <p className=" mt-2 text-sm leading-7 text-muted-foreground">{s.body}</p>
              </li>
            ))}
          </ol>

          {/* ── علامت‌های هجایی ───────────────────────────────────── */}
          <div>
            <h3 className=" text-xl font-black text-foreground sm:text-2xl">علامت‌های هجایی</h3>
            <dl className=" mt-5 divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card">
              {MARKS.map((m) => (
                <div key={m.name} className=" flex flex-wrap items-center gap-x-5 gap-y-2 px-6 py-5">
                  <dt className=" w-28 shrink-0 font-semibold text-foreground">{m.name}</dt>
                  <dd className=" min-w-0 flex-1 text-sm text-muted-foreground">{m.desc}</dd>
                  <dd className=" w-full text-sm font-medium text-primary sm:w-auto">{m.example}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* ── چند نکته ──────────────────────────────────────────── */}
          <div>
            <h3 className=" text-xl font-black text-foreground sm:text-2xl">چند نکته</h3>
            <div className=" mt-5 divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card">
              {NOTES.map((n) => (
                <details key={n.q} className=" group">
                  <summary className=" flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 font-semibold text-foreground transition-colors hover:text-primary [&::-webkit-details-marker]:hidden">
                    {n.q}
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      className=" size-4 shrink-0 transition-transform group-open:rotate-180"
                      aria-hidden
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
                    </svg>
                  </summary>
                  <p className=" px-6 pb-5 text-sm leading-7 text-muted-foreground">{n.a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
