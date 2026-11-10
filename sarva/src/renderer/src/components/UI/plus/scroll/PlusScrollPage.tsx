"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type RefObject, type ReactNode } from "react";
import { AnimatePresence, animate, motion, useInView, useMotionValue, useTransform } from "framer-motion";
import { ArrowDown, BookOpen } from "lucide-react";
import MainLogo from "@/components/svgs/mainLogo";
import { GeometricPattern } from "@/components/persian-patterns";
import SarvaStar, { SARVA_STAR_PATH } from "@/components/UI/SarvaStar";
import { buildJourneyPoints, journeyViewportY } from "./journey-path";
import {
  PLUS_COST,
  PLUS_ORBIT_LABELS,
  PLUS_STORY,
  PLUS_STORY_HEADING,
  PLUS_STORY_LEDE,
  type CompareGroup,
  type CompareMark,
  type StoryItem,
} from "./plus-content";
import { fa } from "@/lib/panel/format";
import { LearningParallax } from "./LearningScenes";
import StarDock from "./StarDock";
import styles from "./plus-scroll.module.css";

export type CycleStep = { title: string; body: string };

/* ⚠️ این شش ذره عیناً از اچ‌تی‌ام‌الِ صفحه‌یِ `/plus` سایت کپی شده‌اند:
   همان جا (`--mote-x/y`)، همان اندازه، همان سرعت و همان لحن. پیش از این
   شانزده ذره با عددهایِ ساخته‌یِ خودمان اینجا بود و چون سرعت‌ها فرق
   می‌کرد، دامنه‌یِ لغزشِ ذرات با سایت یکی نبود (مثل ‎-۳۲۱ در برابر ‎۱۴۶). */
const PARALLAX_MOTES = [
  { x: 6, y: 4, w: 12, h: 110, speed: .8, tone: "teal", mobile: true },
  { x: 93, y: 9, w: 16, h: 150, speed: 1.3, tone: "gold", mobile: false },
  { x: 95, y: 19, w: 10, h: 90, speed: .75, tone: "teal", mobile: true },
  { x: 4, y: 24, w: 18, h: 140, speed: 1.25, tone: "teal", mobile: false },
  { x: 90, y: 33, w: 12, h: 100, speed: .85, tone: "gold", mobile: false },
  { x: 8, y: 41, w: 10, h: 80, speed: 1.4, tone: "gold", mobile: true },
];

function Jewel({ className }: { className?: string }) {
  const id = useId();
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <defs>
        <linearGradient id={id} x1="3" y1="3" x2="18" y2="20" gradientUnits="userSpaceOnUse">
          <stop style={{ stopColor: "color-mix(in oklch, var(--primary) 25%, white)" }} /><stop offset=".36" style={{ stopColor: "color-mix(in oklch, var(--primary) 70%, white)" }} /><stop offset=".7" style={{ stopColor: "var(--primary)" }} /><stop offset="1" style={{ stopColor: "color-mix(in oklch, var(--primary) 60%, black)" }} />
        </linearGradient>
      </defs>
      <path d={SARVA_STAR_PATH} fill={`url(#${id})`} stroke="color-mix(in oklch, var(--primary) 55%, white)" strokeWidth=".45" strokeLinejoin="round" />
      <path d="m12 3 0 9-8-3.1 8 1.6 8-1.6-7 4 4 5.6-5-4-5 4 4-5.6Z" fill="#e8fff9" opacity=".2" />
    </svg>
  );
}

/** Native scrolling, a single scrubbed journey and geometry measured only on refresh. */
/**
 * یک نشانه در جدولِ «همهٔ تفاوت‌ها».
 *
 * ⚠️ دو ستون یکی نیستند و این عمدی است — سایت همین‌طور است:
 *   • ستونِ کتاب: نشانه (دارد / تا حدی / ندارد) برای صفحه‌خوان، **و** توضیح در
 *     `<small>` اگر چیزی برای گفتن داشته باشد.
 *   • ستونِ پلاس: **یا** توضیح در `<small>` **یا** واژهٔ نشانه؛ هر دو با هم
 *     نمی‌آیند. چرا؟ چون در ستونِ پلاس تقریباً همه‌چیز «دارد» است و نوشتنِ
 *     «دارد» کنارِ هر توضیح، ستون را پر از یک واژهٔ تکراری می‌کند.
 */
const STATE_WORD = { yes: "دارد", part: "تا حدی", no: "ندارد" } as const;

/** قالبِ عددِ سایت برایِ رقم‌ها (`new Intl.NumberFormat("fa-IR")`). */
const NUM = new Intl.NumberFormat("fa-IR");
/** همان تابعِ easing که سایت در همه‌یِ انیمیشن‌هایِ تخته به کار می‌برد. */
const EASE: [number, number, number, number] = [.16, 1, .3, 1];

/**
 * اودومترِ تخته — رقم با جابه‌جا شدن می‌چرخد، نه اینکه ناگهان عوض شود.
 * این همان رفتارِ سایت است: `AnimatePresence` با `mode="popLayout"`، رقمِ
 * تازه از پایین می‌آید و رقمِ کهنه به بالا می‌رود؛ جهتش به بزرگ‌تر یا
 * کوچک‌تر شدنِ عدد بستگی دارد.
 */
function Odometer({ value }: { value: number }) {
  const [shown, setShown] = useState(value);
  const [direction, setDirection] = useState(1);
  if (shown !== value) { setDirection(value > shown ? 1 : -1); setShown(value); }
  return (
    <span className={styles.boardOdometer} aria-hidden="true">
      <AnimatePresence mode="popLayout" initial={false} custom={direction}>
        <motion.span
          key={value}
          custom={direction}
          variants={{
            enter: (d: number) => ({ y: `${70 * d}%`, opacity: 0 }),
            center: { y: "0%", opacity: 1 },
            exit: (d: number) => ({ y: `${-70 * d}%`, opacity: 0 }),
          }}
          initial="enter" animate="center" exit="exit"
          transition={{ type: "spring", stiffness: 420, damping: 32 }}
        >{NUM.format(value)}</motion.span>
      </AnimatePresence>
    </span>
  );
}

/**
 * مبلغِ کتاب — از صفر تا مقدار می‌شمارد، آن هم تنها وقتی که بلوک به چشم
 * آمده باشد. اگر بلوک هنوز زیرِ صفحه است، عدد صفر می‌ماند تا وقتی برسد.
 */
function CostCounter({ value, run }: { value: number; run: boolean }) {
  const counter = useMotionValue(value);
  const text = useTransform(counter, (v) => NUM.format(1000 * Math.round(v / 1000)));
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el && el.getBoundingClientRect().top > window.innerHeight) counter.set(0);
  }, [counter]);
  useEffect(() => {
    if (!run || counter.get() === value) return;
    const controls = animate(counter, value, { duration: 1.5, ease: EASE });
    return () => controls.stop();
  }, [run, counter, value]);
  return <motion.b ref={ref}>{text}</motion.b>;
}

/**
 * آگاهی از ردیف‌ها — سایت امتیازِ تخته را از رویِ ردیف‌هایی حساب می‌کند که
 * از خطِ ۶۵٪ِ بلندایِ پنجره گذشته باشند (`data-on`). برای همین امتیاز هنگام
 * پیمایش بالا می‌رود، نه اینکه از اول «۵» و «۱۷» باشد. مقدارِ آغازین در سایت
 * «همه روشن» است و دیده‌بان بلافاصله آن را اصلاح می‌کند.
 */
function useRowAwareness(ref: RefObject<HTMLElement | null>, count: number) {
  const [on, setOn] = useState<boolean[]>(() => Array(Math.max(count, 0)).fill(true));
  useEffect(() => {
    const root = ref.current;
    if (!root || typeof IntersectionObserver === "undefined") return;
    const rows = Array.from(root.querySelectorAll<HTMLElement>("[data-row]"));
    const observer = new IntersectionObserver(() => {
      const line = .65 * window.innerHeight;
      const next = rows.map((row) => row.getBoundingClientRect().top < line);
      setOn((prev) => (prev.length === next.length && prev.every((v, i) => v === next[i]) ? prev : next));
    }, { rootMargin: "0px 0px -35% 0px" });
    rows.forEach((row) => observer.observe(row));
    return () => { observer.disconnect(); setOn(Array(Math.max(count, 0)).fill(true)); };
  }, [ref, count]);
  return on;
}

function Mark({ mark, plus = false }: { mark: CompareMark; plus?: boolean }) {
  const word = STATE_WORD[mark.state];
  return (
    <span className={styles.boardMark} data-mark={mark.state} data-plus={plus || undefined}>
      {/* ⚠️ نشانِ «دارد» یک تیک است، نه یک دایره‌یِ تهی. در سایت درونِ
          `badge` یک `svg.lucide-check` نشسته (`M20 6 9 17l-5-5`) و کنارش
          یک `sr-only`ِ «دارد». پیش از این `badge` تُهی بود و هیچ تیکی
          دیده نمی‌شد. */}
      {mark.state === "yes" && (
        <span className={styles.boardBadge}>
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </span>
      )}
      {/* ⚠️ در سایت خطِ تیره تنها وقتی است که خانه هیچ یادداشتی ندارد؛
          هر جا یادداشت هست (مثل «تا چاپ بعد») همان یادداشت جایِ خط را
          می‌گیرد و خطِ تیره نمی‌آید. */}
      {mark.state === "no" && !plus && !mark.note && <span className={styles.boardDash} aria-hidden />}
      {plus ? (
        mark.note ? <small>{mark.note}</small> : <span className="sr-only">{word}</span>
      ) : (
        <>
          <span className="sr-only">{word}</span>
          {mark.note && <small>{mark.note}</small>}
        </>
      )}
    </span>
  );
}

/**
 * بخشِ «کتاب کمک‌درسی یا سروا پلاس؟» — شش توضیحِ بلند، بعد یک دسته کارتِ
 * برگردان با همان شش ابزار، و شش دکمه برای رفتن به هر کارت.
 */
function StoryCompare({ items, children }: { items: StoryItem[]; children?: ReactNode }) {
  return (
    <section className={styles.compare}>
      <div className={styles.story}>
        <div className={styles.storyStage}>
          <div className={styles.storyIntro}>
            <h2 className={styles.storyTitle}>{PLUS_STORY_HEADING}</h2>
            <p className={styles.storyLede}>{PLUS_STORY_LEDE}</p>
          </div>

          {/* ⚠️ `display:contents` روی این دو ظرف عمدی است و از خودِ سایت
              آمده: با آن هر «توضیح» و «کارتِ» هم‌شماره در یک سطرِ شبکه
              می‌نشینند (`grid-row: calc(var(--i) + 2)`) بی‌آنکه یک لایهٔ
              واسطه ساخته شود. بستنشان در یک <div> یعنی توضیح و کارت دیگر
              روبه‌روی هم قرار نمی‌گیرند. */}
          <div className={styles.storyCaptions}>
            {items.map((item, index) => {
              const style = { "--i": index, "--accent": item.accent } as CSSProperties;
              const Icon = item.icon;
              return (
                <div key={item.id} className={styles.storyCaption} style={style}>
                  <span className={styles.storyPrinciple}>{item.principle}</span>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                  <p className={styles.storyBookLine}>
                    <BookOpen size={15} aria-hidden />
                    <span>کتاب:</span> {item.book}
                  </p>
                </div>
              );
            })}
          </div>

          {/* ⚠️ این درخت عیناً از اچ‌تی‌ام‌الِ صفحه‌یِ `/plus` سایت برداشته شده:
              هر کارت `flip` دارد که دو رویِ `front` و `back` را در بر می‌گیرد،
              رویِ جلو `frontLogo` + `frontTop` (با `brand` و `goldChip`) +
              `frontBottom` + یک `glare`، و رویِ پشت `backIndex` + `emblem` +
              `backText` + یک `glare` دیگر. پیش از این نشانِ `goldChip` نبود،
              `glare` رویِ جلو نبود، و `--accent` رویِ کارت بود نه `backInner`
              (در سایت هر کارت رنگِ خود را رویِ `backInner` می‌گیرد). */}
          <div className={styles.storyDeck} aria-hidden="true">
            {items.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={item.id} className={styles.storyCard} style={{ "--i": index } as CSSProperties}>
                  <div className={styles.storyFlip}>
                    <div className={styles.storyFront}>
                      <div className={styles.storyFrontInner}>
                        <span className={styles.storyFrontLogo} aria-hidden="true"><MainLogo /></span>
                        <div className={styles.storyFrontTop}>
                          <span className={styles.storyBrand}>
                            <span className={styles.storyBrandMark} aria-hidden="true"><SarvaStar size={20} /></span>
                            سروا <b>پلاس</b>
                          </span>
                          <span className={styles.storyGoldChip} aria-hidden="true" />
                        </div>
                        <div className={styles.storyFrontBottom}>
                          <small>{item.principle}</small>
                          <strong>{item.card}</strong>
                        </div>
                        <i className={styles.storyGlare} data-glare="true" aria-hidden="true" />
                      </div>
                    </div>
                    <div className={styles.storyBack}>
                      <div className={styles.storyBackInner} style={{ "--accent": item.accent } as CSSProperties}>
                        <span className={styles.storyBackIndex}>
                          {fa(index + 1)} / {fa(items.length)}
                        </span>
                        <span className={styles.storyEmblem} data-emblem="true">
                          <span className={styles.storyEmblemTile}><Icon size={24} aria-hidden /></span>
                        </span>
                        <span className={styles.storyBackText}>
                          <strong>{item.card}</strong>
                          <small>{item.caption}</small>
                        </span>
                        <i className={styles.storyGlare} data-glare="true" aria-hidden="true" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ⚠️ این دکمه‌ها فرزندِ «صحنه»اند، نه خواهرِ آن. در سایت
              `nav.chips` درونِ `stage` نشسته و صحنه چسبنده است؛ بیرونش که
              بگذاری `bottom:max(16px,3svh)` نسبت به کلِ بخشِ ۶۶۶۰ پیکسلی
              حساب می‌شود و دکمه‌ها هیچ‌گاه به دید نمی‌آیند. */}
          {/* ⚠️ این دکمه‌ها در سایت نه `onClick` دارند و نه نشانیِ فعالی:
              نشانه‌یِ گامِ جاری را `onUpdate`ـِ ماشه‌یِ دسته می‌گذارد و رفتن
              به هر گام با `onclick` در همان‌جا وصل می‌شود (هر دو بیرونِ
              ری‌اکت). اینجا تنها برچسب می‌ماند، درست مثلِ خودِ سایت. */}
          <nav className={styles.storyChips} aria-label="بخش‌های مقایسه">
            {items.map((item, index) => (
              <button key={item.id} type="button">
                {item.chip}
              </button>
            ))}
          </nav>
        </div>
      </div>
      {children}
    </section>
  );
}

function CompareBoard({ groups }: { groups: CompareGroup[] }) {
  const total = groups.reduce((n, g) => n + g.rows.length, 0);
  const flat = groups.flatMap((g) => g.rows);
  /* سایت به هر ردیف شماره‌یِ پیوسته‌یِ خود را می‌دهد (`data-row="0"` …)؛
     این شماره در کلِ تخته یکتاست، نه در هر گروه. */
  let rowIndex = -1;
  const tableRef = useRef<HTMLDivElement>(null);
  const on = useRowAwareness(tableRef, flat.length);
  /* امتیاز همان شمارشِ ردیف‌هایی است که از خط گذشته‌اند و نشان‌شان «دارد»
     است — برایِ ستونِ کتاب و ستونِ سروا پلاس جداگانه. */
  const scoreBook = flat.filter((row, i) => on[i] && row.book.state === "yes").length;
  const scorePlus = flat.filter((row, i) => on[i] && row.plus.state === "yes").length;
  const costRef = useRef<HTMLDivElement>(null);
  const costInView = useInView(costRef, { once: true, margin: "0px 0px -20% 0px" });
  return <div className={styles.board} aria-labelledby="plus-compare-heading">
    <h3 id="plus-compare-heading" className={styles.boardHeading}>همهٔ تفاوت‌ها</h3>
    <div className={styles.boardTable} role="table" aria-label="مقایسهٔ کتاب کمک‌درسی و سروا پلاس" ref={tableRef}>
      <div className={styles.boardScore} role="rowgroup">
        <div className={styles.boardScoreRow} role="row">
          <span className={styles.boardScoreLead} role="columnheader"><b>{fa(total)} مورد</b></span>
          <span className={styles.boardScoreBook} role="columnheader">
            <span className={styles.boardScoreName}>
              <BookOpen size={15} aria-hidden />
              <span className={styles.boardBookWord}>کتاب </span>کمک‌درسی
            </span>
            <Odometer value={scoreBook} />
          </span>
          <span className={styles.boardScorePlus} role="columnheader">
            <span className={styles.boardScoreName}>
              <SarvaStar size={15} />سروا پلاس
            </span>
            <Odometer value={scorePlus} />
          </span>
        </div>
      </div>
      {groups.map(group => (
        <div key={group.title} className={styles.boardGroup} role="rowgroup">
          <div className={styles.boardGroupTitle} role="row"><span role="rowheader">{group.title}</span></div>
          {group.rows.map(row => {
            /* ⚠️ `data-on` را حالا آگاهی از ردیف‌ها می‌گرداند، نه یک «درست» ی
               ثابت. در سایت هر ردیف تا از خطِ ۶۵٪ِ پنجره نگذرد کمرنگ است
               (`opacity:.4`) و نشان‌هایش در آنِ واحد در نمی‌آیند؛ وقتی ردیف
               روشن می‌شود نشان از `scale(.3)` به جایِ خود باز می‌گردد. پیش از
               این همه‌یِ ردیف‌ها از ابتدا روشن بودند و تخته هیچ ورودی نداشت. */
            const index = (rowIndex += 1);
            return (
            <div key={row.label} className={styles.boardRow} role="row" data-row={index} data-on={on[index] ? "true" : undefined}>
              <span className={styles.boardLabel} role="rowheader">{row.label}</span>
              <span className={styles.boardBookCell} role="cell"><Mark mark={row.book} /></span>
              <span className={styles.boardPlusCell} role="cell"><i className={styles.boardWash} aria-hidden="true" /><Mark mark={row.plus} plus /></span>
            </div>
            );
          })}
        </div>
      ))}
      {/* سایت این بلوک را با یک ورودِ نرم (بالا آمدنِ ۲۸ پیکسلی) نشان می‌دهد
          و مبلغ را از صفر تا مقدار می‌شمارد؛ پیش از این برنامه هر دو را
          نداشت و عدد همان لحظه‌یِ اول نوشته می‌شد. */}
      <div className={styles.boardCost} ref={costRef}>
        <motion.div
          className={styles.boardCostBook}
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "0px 0px -15% 0px" }}
          transition={{ duration: .8, ease: EASE }}
        >
          <span className={styles.boardCostBookMark}><BookOpen size={26} aria-hidden /></span>
          <span className={styles.boardCostText}>
            <span className={styles.boardCostName}>{PLUS_COST.name}</span>
            <span className={styles.boardCostValue}>
              <small>{PLUS_COST.prefix}</small>{" "}
              <CostCounter value={PLUS_COST.amount} run={costInView} />{" "}
              <small>{PLUS_COST.unit}</small>
            </span>
          </span>
        </motion.div>
        <div className={styles.boardThread} aria-hidden>
          <span data-journey-emerge="true"><Jewel /></span>
        </div>
      </div>
    </div>
  </div>;
}

export default function PlusScrollPage({ story = PLUS_STORY, cycle, plans, compare, header, footer, markers = false, showPath = false }: {
  story?: StoryItem[]; cycle: CycleStep[]; plans: ReactNode; compare?: CompareGroup[]; header?: ReactNode; footer?: ReactNode; markers?: boolean; showPath?: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const orbRef = useRef<HTMLDivElement>(null);
  const orbInnerRef = useRef<HTMLDivElement>(null);
  const seedRef = useRef<HTMLDivElement>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const orb2Ref = useRef<HTMLDivElement>(null);
  const orb2InnerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let disposed = false;
    let teardown = () => {};
    // Keep the initial HTML readable; defer the animation library until hydration.
    async function setup() {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]);
      if (disposed) return;
      const root = rootRef.current;
      const orb = orbRef.current;
      const inner = orbInnerRef.current;
      const seed = seedRef.current;
      const dock = dockRef.current;
      /* نگینِ درونِ «رشته»‌ی تخته‌ی هزینه — نقطه‌ی آغازِ ستاره‌ی دوم. با
         انتخابگر گرفته می‌شود چون آن نگین در مؤلفه‌ی جداگانه‌ی CompareBoard
         است و ref از آنجا به اینجا نمی‌رسد. */
      /* اگر تخته‌ی هزینه نباشد، نقطه‌ی آغاز به نگینِ قهرمان برمی‌گردد؛ پیش‌تر
         نبودِ همین یک عنصر کلِ راه‌اندازی را بیرون می‌انداخت و هیچ انیمیشنی
         اجرا نمی‌شد. حالا نبودش تنها مسیرِ ستاره‌ی دوم را کوتاه می‌کند. */
      const emerge = root.querySelector<HTMLElement>("[data-journey-emerge]") ?? seed;
      const orb2 = orb2Ref.current;
      const inner2 = orb2InnerRef.current;
      if (!root || !orb || !inner || !seed || !dock || !emerge || !orb2 || !inner2) return;
      gsap.registerPlugin(ScrollTrigger);
      const mm = gsap.matchMedia();
      /* دسته‌ی کارت‌ها نقطه‌ی شکستِ خودش را دارد و آن را با سفر سهیم نیست؛
         برای همین `matchMedia` ی جدایی می‌گیرد (پایین‌تر، سرِ خودِ دسته). */
      const deckMm = gsap.matchMedia();
      /* ⚠️ شرطِ سوم (`oneColumn`) از نسخه‌یِ زنده آمده و در برنامه نبود:
         کارت‌هایِ پلان تنها وقتی «بادبزن» می‌شوند که ستون‌ها بیش از یکی
         باشند (`max-width: 639px` یعنی یک ستون). */
      mm.add({ motion: "(prefers-reduced-motion: no-preference)", compact: "(max-width: 699px)", oneColumn: "(max-width: 639px)" }, (context) => {
        if (!context.conditions?.motion) return;
        const compact = Boolean(context.conditions.compact);
        const oneColumn = Boolean(context.conditions.oneColumn);
        const glow = root.querySelectorAll("[data-dock-glow]");
        let journey: ReturnType<typeof gsap.timeline> | undefined;
        let startScroll = 0;
        let endScroll = 1;
        let fromDocumentY = 0;
        let toDocumentY = 1;
        let latestScroll = window.scrollY;
        let measured = false;
        let boundsLeft = 0;
        const playhead = { progress: 0 };
        const position = { x: 0 };
        /* دو سرِ مسیر به مختصاتِ خودِ صفحه. سایت هنگامِ آغاز و پایان، ستاره
           را `absolute` می‌کند و همین نقطه‌ها را به‌کار می‌برد؛ تنها در
           میانه‌ی راه است که `fixed` می‌شود و مختصات نسبت به دید حساب
           می‌شود. بی‌این جابه‌جایی، ستاره به‌جای نشستن سرِ جایش، با هر
           پیمایش از بالای صفحه دورتر می‌رفت. */
        let fromPoint = { x: 0, y: 0 };
        let toPoint = { x: 0, y: 0 };
        let lastTransform = "";
        /* ⚠️ اندازه‌گیریِ زنده برایِ لحظه‌یِ نشستن. مبدأ و مقصد در زمانِ ساخت
           اندازه گرفته می‌شوند؛ اگر پس از آن چیزی در صفحه جابه‌جا شود (فونتی
           که دیر می‌رسد، نگاره‌ای که بار می‌شود، پایه‌یِ چسبانِ دسته که اضافه
           می‌گردد)، آن یادداشت کهنه می‌شود و ستاره درست کنارِ — نه درونِ —
           سوراخ می‌نشیند؛ آن هم به اندازه‌ای که هر بار فرق می‌کند. اینجا در
           همان لحظه‌ای که ستاره به ته می‌رسد، هدف دوباره اندازه گرفته
           می‌شود تا هرچه بالا دست جابه‌جا شده باشد بی‌اثر شود. خواندنِ طرح
           گران است، پس تنها هنگامِ گذار به حالتِ نشستن انجام می‌شود، نه در
           هر نما. */
        const livePoint = (el: HTMLElement | null) => {
          if (!el) return null;
          const r = el.getBoundingClientRect();
          const b = root.getBoundingClientRect();
          return { x: r.left + r.width / 2 - b.left, y: r.top + r.height / 2 - b.top };
        };
        // Scrub owns one complete transform write on its existing GSAP frame.
        // A second requestAnimationFrame would halve the star's update cadence.
        let restState = "";
        const renderPosition = () => {
          const atStart = playhead.progress <= 0 && latestScroll <= startScroll;
          const atEnd = playhead.progress >= 1 && latestScroll >= endScroll;
          const state = atStart ? "start" : atEnd ? "end" : "";
          if (state !== restState) {
            restState = state;
            if (state === "end") { const live = livePoint(root.querySelector<HTMLElement>(`.${styles.coreSlot}`) ?? dock); if (live) toPoint = live; }
            else if (state === "start") { const live = livePoint(seed); if (live) fromPoint = live; }
          }
          const anchor = atStart ? fromPoint : atEnd ? toPoint : null;
          const nextPosition = anchor ? "absolute" : "fixed";
          if (orb.style.position !== nextPosition) orb.style.position = nextPosition;
          const x = anchor ? anchor.x + boundsLeft : position.x;
          const y = anchor ? anchor.y : journeyViewportY({ progress: playhead.progress, scroll: latestScroll,
            start: startScroll, end: endScroll, fromY: fromDocumentY, toY: toDocumentY });
          const transform = `translate3d(${x.toFixed(3)}px,${y.toFixed(3)}px,0) translate(-50%,-50%)`;
          if (transform !== lastTransform) { orb.style.transform = transform; lastTransform = transform; }
        };
        const buildJourney = () => {
          journey?.kill();
          const bounds = root.getBoundingClientRect();
          const seedBounds = seed.getBoundingClientRect();
          const dockBounds = dock.getBoundingClientRect();
          const dockWidth = dock.parentElement!.getBoundingClientRect().width;
          const center = (r: DOMRect) => ({ x: r.left + r.width / 2 - bounds.left, y: r.top + r.height / 2 - bounds.top });
          /* ⚠️ مقصدِ ستاره‌یِ نخست «هسته‌یِ چرخ» است، نه لنگرگاهِ پایینِ صفحه.
             در سایت دو ستاره کاملاً مستقل‌اند: یکی از نگینِ قهرمان می‌آید و
             همان بالا، رویِ چرخِ «چطور کار می‌کند» می‌نشیند؛ دیگری از نگینِ
             تخته‌ی هزینه برمی‌خیزد و در لنگرگاه فرود می‌آید. پیش از این هر دو
             به لنگرگاه می‌رفتند و ستاره‌یِ نخست سراسرِ صفحه را می‌پیمود. */
          const coreBounds = (root.querySelector<HTMLElement>(`.${styles.coreSlot}`) ?? dock).getBoundingClientRect();
          const from = center(seedBounds);
          const to = center(coreBounds);
          boundsLeft = bounds.left;
          fromPoint = from;
          toPoint = to;
          /* مسیر در رایانه خطیِ راست است و تنها در تلفن دورِ متنِ چرخ
             می‌چرخد — همان که سایت می‌سازد، بی‌هیچ خمی از پیشِ خود. */
          const copyBounds = root.querySelector<HTMLElement>(`.${styles.wheelCopy}`)?.getBoundingClientRect();
          const copyTop = copyBounds ? copyBounds.top - bounds.top : 0;
          const copyBottom = copyBounds ? copyBounds.bottom - bounds.top : 0;
          const ordered: { x: number; y: number }[] = compact
            ? [from, { x: 12, y: copyTop - 24 }, { x: 12, y: copyBottom + 24 }, to]
            : [from, to];
          const legEase = compact ? "sine.inOut" : "power1.in";
          const distance = to.y - from.y;
          fromDocumentY = bounds.top + window.scrollY + from.y;
          toDocumentY = bounds.top + window.scrollY + to.y;
          position.x = from.x + bounds.left;
          gsap.set(orb, { opacity: 1 });
          // Render the jewel at its largest size and only scale down, preserving
          // sharp edges when it lands (including high-DPI and zoomed displays).
          gsap.set(inner, { scale: seedBounds.width / 156, rotation: 0, rotationX: 0 });
          gsap.set(glow, { opacity: 0 });
          gsap.set(seed, { opacity: 0 });
          journey = gsap.timeline({ paused: true });
          for (let i = 1; i < ordered.length; i++) {
            const previous = ordered[i - 1];
            const point = ordered[i];
            journey.to(position, { x: point.x + bounds.left, duration: point.y - previous.y, ease: legEase }, previous.y - from.y);
          }

          /* ستاره‌ی نخست: درشت از تخمه بیرون می‌آید، در میانه ریز می‌شود تا
             راه برود، و سرِ جایش در محوطه باز به اندازه‌ی همان هدف برمی‌گردد.
             برخلافِ ستاره‌ی دوم کج‌شدنِ سه‌بعدی ندارد. */
          const shrink = Math.min(260, .35 * distance);
          journey.to(inner, { scale: (compact ? 22 : 45.6) / 156, duration: shrink, ease: "sine.out" }, 0);
          journey.to(inner, { scale: coreBounds.width / 156, rotation: 0, duration: shrink, ease: "sine.inOut" }, distance - shrink);
          startScroll = Math.max(0, fromDocumentY - window.innerHeight * .77);
          endScroll = Math.max(startScroll + 1, toDocumentY - window.innerHeight * .5);
          if (pathRef.current) pathRef.current.setAttribute("d", ordered.map((p, i) => `${i ? "L" : "M"} ${p.x} ${p.y}`).join(" "));
          latestScroll = window.scrollY;
          if (!measured) playhead.progress = Math.max(0, Math.min(1, (window.scrollY - startScroll) / (endScroll - startScroll)));
          measured = true;
          journey.progress(playhead.progress);
          renderPosition();
        };
        buildJourney();
        // The small proxy lets refresh replace the measured timeline without attaching
        // multiple scrub controllers to the star. No DOM reads happen during scrolling.
        const scrub = gsap.fromTo(playhead, { progress: 0 }, {
          progress: 1, ease: "none", paused: true, immediateRender: false,
          onUpdate: () => { journey?.progress(playhead.progress); renderPosition(); },
        });
        ScrollTrigger.create({
          animation: scrub, start: () => startScroll, end: () => endScroll,
          scrub: compact ? 1 : 1.25, invalidateOnRefresh: true, markers, id: "plus-journey",
        });
        /* ── ستاره‌ی دوم ─────────────────────────────────────────────────
           دو ستاره کاملاً از هم مستقل‌اند: یکی از تخمه‌ی بالای صفحه می‌آید و
           دیگری از نگینِ «رشته»‌ی تخته‌ی هزینه — با مقیاسِ خودش و یک کج‌شدنِ
           سه‌بعدی هنگامِ فرود (rotationX ۴۸). پیش‌تر این دو یکی شده بودند و
           یک ستاره سراسرِ صفحه را می‌پیمود. */
        const playhead2 = { progress: 0 };
        const pos2 = { x: 0 };
        let journey2: ReturnType<typeof gsap.timeline> | undefined;
        let start2 = 0, end2 = 1, from2Doc = 0, to2Doc = 1, measured2 = false;
        let from2 = { x: 0, y: 0 }, to2 = { x: 0, y: 0 };
        let restState2 = "";
        const renderStar2 = () => {
          const atStart = playhead2.progress <= 0 && latestScroll <= start2;
          const atEnd = playhead2.progress >= 1 && latestScroll >= end2;
          const state = atStart ? "start" : atEnd ? "end" : "";
          if (state !== restState2) {
            restState2 = state;
            if (state === "end") { const live = livePoint(dock); if (live) to2 = live; }
            else if (state === "start") { const live = livePoint(emerge); if (live) from2 = live; }
          }
          const anchor = atStart ? from2 : atEnd ? to2 : null;
          const nextPosition = anchor ? "absolute" : "fixed";
          if (orb2.style.position !== nextPosition) orb2.style.position = nextPosition;
          const x = anchor ? anchor.x + boundsLeft : pos2.x;
          const y = anchor ? anchor.y : journeyViewportY({ progress: playhead2.progress, scroll: latestScroll,
            start: start2, end: end2, fromY: from2Doc, toY: to2Doc });
          const transform = `translate3d(${x.toFixed(3)}px,${y.toFixed(3)}px,0) translate(-50%,-50%)`;
          if (orb2.style.transform !== transform) orb2.style.transform = transform;
        };
        const buildStar2 = () => {
          journey2?.kill();
          const b = root.getBoundingClientRect();
          const eb = emerge.getBoundingClientRect();
          const db = dock.getBoundingClientRect();
          const dockWidth2 = dock.parentElement!.getBoundingClientRect().width;
          from2 = { x: eb.left + eb.width / 2 - b.left, y: eb.top + eb.height / 2 - b.top };
          to2 = { x: db.left + db.width / 2 - b.left, y: db.top + db.height / 2 - b.top };
          from2Doc = b.top + window.scrollY + from2.y;
          to2Doc = b.top + window.scrollY + to2.y;
          pos2.x = from2.x + b.left;
          const span = Math.max(1, to2Doc - from2Doc);
          gsap.set(orb2, { opacity: 1 });
          gsap.set(inner2, { scale: eb.width / 156, rotation: 0, rotationX: 0 });
          /* هاله‌ی لنگرگاه و درخشش به ستاره‌یِ دوم تعلق دارند، نه به نخستین؛
             در سایت این دو در پایانِ سفرِ دوم جان می‌گیرند. */
          gsap.set(glow, { opacity: 0 });
          journey2 = gsap.timeline({ paused: true });
          journey2.to(pos2, { x: to2.x + b.left, duration: span, ease: "sine.inOut" }, 0);
          journey2.to(inner2, { scale: dockWidth2 / 360, rotationX: 48, duration: 300, ease: "sine.inOut" }, span - 300);
          journey2.to(glow, { opacity: 1, duration: 45, ease: "sine.in" }, span - 45);
          journey2.fromTo(root.querySelector(`.${styles.dockAura}`), { scale: .88 }, { scale: 1, duration: 140, ease: "sine.out" }, span - 140);
          start2 = Math.max(0, from2Doc - window.innerHeight * .62);
          end2 = Math.max(start2 + 1, to2Doc - window.innerHeight * .5);
          if (!measured2) { playhead2.progress = Math.max(0, Math.min(1, (window.scrollY - start2) / (end2 - start2))); measured2 = true; }
          journey2.progress(playhead2.progress);
          renderStar2();
        };
        buildStar2();
        const scrub2 = gsap.fromTo(playhead2, { progress: 0 }, {
          progress: 1, ease: "none", paused: true, immediateRender: false,
          onUpdate: () => { journey2?.progress(playhead2.progress); renderStar2(); },
        });
        ScrollTrigger.create({
          animation: scrub2, start: () => start2, end: () => end2,
          scrub: compact ? 1 : 1.25, invalidateOnRefresh: true, markers, id: "plus-journey-2",
        });

        const trackAnchor = () => {
          latestScroll = window.scrollY;
          // Between the anchors, scrub alone owns the viewport position.
          if (latestScroll < startScroll || latestScroll > endScroll) renderPosition();
          if (latestScroll < start2 || latestScroll > end2) renderStar2();
        };
        window.addEventListener("scroll", trackAnchor, { passive: true });
        /* ⚠️ بازسازی رویِ رویدادِ «refresh» است (پس از تازه‌شدن)، نه
           «refreshInit» (پیش از آن) — و تفاوتش فقط در ستاره‌یِ دوم نیست،
           بلکه همان یکی است که دیده می‌شود.

           نگینِ آغازِ ستاره‌یِ دوم درونِ بخشِ میخ‌کوبِ دسته‌یِ کارت‌ها
           نشسته. ScrollTrigger در آغازِ هر تازه‌شدن، فضاهایِ میخ را
           برمی‌دارد تا اندازه‌یِ طبیعیِ عنصرها را بخواند؛ یعنی هرچه در
           `refreshInit` اندازه گرفته شود، بی‌آن فضا دیده می‌شود. آن فضا
           اینجا نزدیکِ ۳۲۵۰ پیکسل است — درست به اندازه‌ای که ستاره‌یِ دوم
           در جایِ غلط می‌نشست و به‌جایِ لنگرگاهِ پایینِ صفحه، همان بالا
           فرود می‌آمد. پس از تازه‌شدن، فضاها برقرارند و اندازه درست است. */
        let geometrySignature = "";
        let followUp = 0;
        const rebuildJourneys = () => {
          buildJourney();
          buildStar2();
          /* اگر جایگاه‌ها عوض شده باشند، یک تازه‌شدنِ دیگر لازم است تا
             کران‌هایِ خودِ این دو ماشه هم با مقدارِ تازه حساب شود. بارِ
             دوم مقدارها همان می‌مانند، پس زنجیره همان‌جا می‌ایستد. */
          const signature = `${startScroll}|${endScroll}|${start2}|${end2}`;
          if (signature !== geometrySignature) {
            geometrySignature = signature;
            if (!followUp) {
              followUp = window.requestAnimationFrame(() => {
                followUp = 0;
                ScrollTrigger.refresh();
              });
            }
          }
        };
        ScrollTrigger.addEventListener("refresh", rebuildJourneys);
        /* ⚠️ اینجا تا پیش از این یک انیمیشنِ ورود برایِ `[data-reason-card]`
           بود که آن نشان تنها رویِ همین توضیح‌هایِ دسته نشسته بود — و چون
           با `opacity` کار می‌کرد، با `autoAlpha`یِ خودِ دسته می‌جنگید:
           رفتن به پایین درست بود، ولی برگشتن به بالا توضیح‌هایِ رفته را
           دوباره پیدا می‌کرد و رویِ هم می‌افتادند (شش متنِ رویِ هم در یک
           جا). نه آن نشان در سایت هست و نه `cardAura`یی که دنبالش می‌گشت؛
           هر دو از خودِ این برنامه بودند و دسته به‌تنهایی درست کار می‌کند. */
        root.querySelectorAll<HTMLElement>("[data-parallax-track]").forEach((track) => {
          if (compact && track.dataset.mobile !== "true") return;
          const speed = Number(track.dataset.speed);
          const travel = () => (1 - speed) * Math.min(window.innerHeight, 1000) * (compact ? .32 : .65);
          gsap.fromTo(track.firstElementChild, { y: () => -travel(), x: compact ? 0 : -5 }, {
            y: travel, x: compact ? 0 : 5, ease: "none",
            scrollTrigger: { trigger: track, start: "top bottom", end: "bottom top", scrub: compact ? .7 : 1.15, invalidateOnRefresh: true },
          });
        });
        const parallaxScene = root.querySelector<HTMLElement>("[data-learning-parallax]");
        if (parallaxScene) {
          // One trigger and one timeline for the entire dense field. Hidden mobile
          // capsules get no tween; there are no perpetual loops or layout reads.
          const field = gsap.timeline({ scrollTrigger: { trigger: parallaxScene, start: "top bottom", end: "bottom top", scrub: 1.2, invalidateOnRefresh: true } });
          parallaxScene.querySelectorAll<HTMLElement>("[data-learning-capsule]").forEach((track) => {
            if (compact && track.dataset.mobile !== "true") return;
            const travel = () => (1 - Number(track.dataset.speed)) * (compact ? 420 : 760);
            field.fromTo(track.firstElementChild, { y: () => -travel() }, { y: travel, duration: 1, ease: "none" }, 0);
          });
        }
        root.querySelectorAll<HTMLElement>("[data-cycle-step]").forEach((step) => {
          gsap.from(step, { x: 12, opacity: .4, duration: .5, ease: "power2.out", scrollTrigger: { trigger: step, start: "top 88%", once: true } });
        });
        gsap.to(root.querySelector(`.${styles.wheelRing}`), { rotation: 70, ease: "none", scrollTrigger: { trigger: root.querySelector(`.${styles.wheel}`), start: "top bottom", end: "bottom top", scrub: .6 } });
        /* ── کارت‌هایِ سه‌بعدیِ مقایسه ───────────────────────────────────
           شش کارت رویِ هم دسته‌اند. با پیمایش، هربار کارتِ رویی بالا
           می‌آید و در دو مرحله می‌چرخد (`rotationX` کوتاه، سپس
           `rotationY: ۱۸۰`) و کارتِ پیشین به کنار می‌رود؛ در پایان همه
           بادبزن می‌شوند. زاویه‌ها، جابه‌جایی‌ها و زمان‌بندی عیناً از
           نسخه‌یِ زنده گرفته شده‌اند. */
        const storySection = root.querySelector<HTMLElement>(`.${styles.story}`);
        const stage = storySection?.querySelector<HTMLElement>(`.${styles.storyStage}`);
        const intro = storySection?.querySelector<HTMLElement>(`.${styles.storyIntro}`);
        if (storySection && stage && intro) {
          /* ⚠️ شرطِ «فشرده»ی دسته با شرطِ سفر یکی نیست. در بسته‌یِ زنده دو
             شرطِ جداست: سفر `(max-width: 699px)`، و دسته
             `(max-width: 899px) and (orientation: portrait)` در برابر
             `(min-width: 900px), (orientation: landscape)`. پیش از این هر دو
             از ۶۹۹ پیروی می‌کردند و در پهنا‌یِ میانه (مثل ۸۲۰) کارت ۵۸٪ به
             چپ می‌رفت، در حالی که سایت آن را میان می‌نشاند. */
          deckMm.add({ motion: "(prefers-reduced-motion: no-preference)", deckCompact: "(max-width: 899px) and (orientation: portrait)", deckWide: "(min-width: 900px), (orientation: landscape)" }, (deckContext) => {
          const deckCompact = Boolean(deckContext.conditions?.deckCompact);
          storySection.style.setProperty("--len", "640");
          const captions = Array.from(storySection.querySelectorAll<HTMLElement>(`.${styles.storyCaption}`));
          const cards = Array.from(storySection.querySelectorAll<HTMLElement>(`.${styles.storyCard}`));
          const chips = storySection.querySelector<HTMLElement>(`.${styles.storyChips}`);
          const glares = cards.map((c) => Array.from(c.querySelectorAll<HTMLElement>(`.${styles.storyGlare}`)));
          const emblems = cards.map((c) => c.querySelector<HTMLElement>(`[data-emblem]`));
          const fronts = cards.map((c) => c.querySelector<HTMLElement>(`.${styles.storyFront}`));
          const backs = cards.map((c) => c.querySelector<HTMLElement>(`.${styles.storyBack}`));
          const flips = cards.map((c) => c.querySelector<HTMLElement>(`.${styles.storyFlip}`));
          const total = cards.length;
          // جایِ آرامشِ هر کارت در دسته — از نسخه‌یِ زنده
          const REST = [
            { yPercent: 0, scale: 1, rotation: 0 },
            { yPercent: 3.2, scale: .965, rotation: -2.6 },
            { yPercent: 6.2, scale: .93, rotation: 2.2 },
            { yPercent: 9, scale: .895, rotation: -1.8 },
            { yPercent: 11.6, scale: .86, rotation: 2.8 },
            { yPercent: 14, scale: .83, rotation: -1.4 },
          ];
          const rest = (i: number) => REST[i] ?? { yPercent: 14 + i * 2.4, scale: .83, rotation: 0 };
          /* ⚠️ درازایِ کلِ دسته بر حسبِ «گام» — همان `N` در بسته‌یِ زنده:
             یک پیش‌درآمدِ ۱٫۲، سپس ۲٫۴ برای هر کارت، و ۱٫۵ و ۰٫۴ برایِ
             فرجام و مکث. هم نشانه‌یِ گامِ جاری و هم مقصدِ کلیک با همین
             مقیاس حساب می‌شوند. */
          const SPAN = 1.2 + 2.4 * total + 1.5 + .4;
          const chipButtons = chips ? Array.from(chips.querySelectorAll<HTMLButtonElement>("button")) : [];
          const markChip = (active: number) => {
            chipButtons.forEach((chip, i) => {
              if (i === active) chip.setAttribute("data-active", "");
              else chip.removeAttribute("data-active");
            });
          };

          storySection.dataset.motion = "on";
          gsap.set([...captions, ...backs, ...(chips ? [chips] : [])], { autoAlpha: 0 });
          gsap.set(glares.flat(), { autoAlpha: 0 });
          cards.forEach((card, i) => gsap.set(card, { xPercent: deckCompact ? 0 : -58, zIndex: total - i, ...rest(i) }));

          const deck = gsap.timeline({
            defaults: { ease: "power2.inOut", duration: .6 },
            scrollTrigger: {
              trigger: storySection, start: "top top", end: "bottom bottom", scrub: deckCompact ? .5 : .8,
              /* ⚠️ نشانه‌یِ نگینِ جاری از پیشرویِ پیمایش می‌آید، نه از
                 کلیک — همان محاسبه‌یِ سایت، و `-1` یعنی دسته به پایان
                 رسیده و هیچ نگینی روشن نیست. */
              onUpdate: (self) => {
                const progress = self.progress * SPAN;
                const active = progress > 1.2 + 2.4 * total ? -1 : Math.floor((progress - 1.2 - .3) / 2.4);
                markChip(active);
              },
            },
          });
          deck.from(cards, { yPercent: "+=24", autoAlpha: 0, duration: .8, stagger: .05, ease: "power3.out" }, 0)
            .to(intro, { autoAlpha: 0, y: -30, duration: .5 }, .85);
          if (chips) deck.to(chips, { autoAlpha: 1, duration: .4 }, 1);

          cards.forEach((card, i) => {
            const at = 1.2 + 2.4 * i;
            const [glareIn, glareOut] = glares[i];
            if (i > 0) {
              const previous = cards[i - 1];
              deck.set(previous, { zIndex: 20 + i }, at)
                .to(previous, deckCompact
                  ? { xPercent: -150, yPercent: 4, rotation: -16, autoAlpha: 0, duration: .6 }
                  : { xPercent: -182 + (i - 1) * 6, yPercent: 6 + (i - 1) * 1.2, rotation: -12 + (i - 1) * 2.4, scale: .78, duration: .7 }, at)
                .to(captions[i - 1], { autoAlpha: 0, y: -20, duration: .35 }, at);
              for (let j = i + 1; j < total; j++) deck.to(cards[j], { ...rest(j - i), duration: .55 }, at + .1);
            }
            deck.fromTo(captions[i], { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, duration: .45, immediateRender: false }, at + .45)
              .to(card, { yPercent: deckCompact ? 0 : -9, scale: deckCompact ? 1.04 : 1.08, rotation: 0, duration: .4, ease: "power2.out" }, at + .25);
            if (flips[i]) {
              deck.to(flips[i], { rotationX: deckCompact ? 10 : 14, rotation: deckCompact ? -4 : -7, duration: .3, ease: "power1.out" }, at + .3)
                .to(flips[i], { rotationY: 180, duration: .8, ease: "power3.inOut" }, at + .5)
                .to(flips[i], { rotationX: 0, rotation: 0, duration: .6 }, at + .75);
            }
            if (glareIn) deck.fromTo(glareIn, { xPercent: -70, autoAlpha: 0 }, { xPercent: 0, autoAlpha: .9, duration: .4, ease: "sine.in", immediateRender: false }, at + .5);
            if (fronts[i]) deck.set(fronts[i], { autoAlpha: 0 }, at + .9);
            if (backs[i]) deck.set(backs[i], { autoAlpha: 1 }, at + .9);
            if (glareOut) deck.fromTo(glareOut, { xPercent: 0, autoAlpha: .9 }, { xPercent: 70, autoAlpha: 0, duration: .45, ease: "sine.out", immediateRender: false }, at + .9);
            if (emblems[i]) deck.fromTo(emblems[i], { scale: .82 }, { scale: 1, duration: .7, ease: "back.out(2)", immediateRender: false }, at + .9);
            deck.to(card, { yPercent: 0, scale: 1, duration: .55, ease: "back.out(1.7)" }, at + 1.25);
          });

          const finale = 1.2 + 2.4 * total;
          deck.to(captions[total - 1], { autoAlpha: 0, y: -20, duration: .35 }, finale);
          if (chips) deck.to(chips, { autoAlpha: 0, duration: .3 }, finale);
          cards.forEach((card, i) => {
            const offset = (total - 1) / 2 - i;
            deck.set(card, { zIndex: 40 + i }, finale)
              .to(card, {
                xPercent: offset * (deckCompact ? 21 : 32),
                yPercent: Math.abs(offset) * (deckCompact ? 4.5 : 3.5) - (deckCompact ? 8 : 4),
                rotation: offset * (deckCompact ? 6.5 : 5.5),
                scale: deckCompact ? .44 : .58, autoAlpha: 1, duration: 1, ease: "power3.inOut",
              }, finale + .1 + (total - 1 - i) * .04);
          });
          deck.to({}, { duration: .4 });

          /* ⚠️ کلیکِ هر نگین پنجره را به میانه‌یِ گامِ خودش می‌برد — همان
             فرمولِ سایت: آغازِ ماشه به اضافه‌یِ درازایِ آن ضرب در جایِ آن
             گام بر کلِ درازا. پیش از این نگین‌ها تنها یک حالتِ محلیِ
             ری‌اکت را عوض می‌کردند و هیچ کاری نمی‌کردند. */
          chipButtons.forEach((chip, index) => {
            chip.onclick = () => {
              const trigger = deck.scrollTrigger;
              if (!trigger) return;
              const top = trigger.start + (trigger.end - trigger.start) * ((1.2 + 2.4 * index + 2) / SPAN);
              window.scrollTo({ top, behavior: "smooth" });
            };
          });
          return () => {
            chipButtons.forEach((chip) => { chip.onclick = null; });
          };
          });
        }

        /* ── کارت‌هایِ پلان ───────────────────────────────────────────────
           سه کارت از جایِ خودشان به سویِ میانِ شبکه می‌آیند: هر کارت از
           فاصله‌اش تا میانِ شبکه شروع می‌کند، به اندازه‌یِ `(i-mid)*6`
           درجه چرخیده است و کوچک‌تر است؛ با `stagger` پشتِ سرِ هم می‌رسند.
           در یک ستون (تلفنِ باریک) این بادبزن بی‌معناست و سایت به جایش هر
           کارت را جداگانه از پایین می‌آورد. زاویه، مقیاس، زمان‌بندی و
           توقف‌ها عیناً از بسته‌یِ خودِ سایت گرفته شده‌اند. */
        const planCards = gsap.utils.toArray<HTMLElement>("[data-plan-card]", root);
        const planGrid = planCards[0]?.parentElement as HTMLElement | undefined;
        if (planGrid && planCards.length > 1 && !oneColumn) {
          const middle = (element: HTMLElement) => ({ x: element.offsetLeft + element.offsetWidth / 2, y: element.offsetTop + element.offsetHeight / 2 });
          const mid = (planCards.length - 1) / 2;
          planCards.forEach((card, i) => gsap.set(card, { zIndex: planCards.length - i }));
          gsap.from(planCards, {
            x: (_index: number, target: HTMLElement) => middle(planGrid).x - middle(target).x,
            y: (_index: number, target: HTMLElement) => middle(planCards[0]).y - middle(target).y + 50,
            rotation: (index: number) => (index - mid) * 6,
            /* ⚠️ در سایت تا پیش از رسیدن به تریگر هیچ ترادیسی رویِ کارت‌ها
               نیست (فقط `z-index` می‌نشیند)؛ بی‌این، نخستین کارت همان لحظه‌یِ
               ساخت ۳۰۴ پیکسل کنار می‌رود و در آن ۳۰۰ پیکسلِ پیش از آغاز،
               لرزش دیده می‌شود. */
            scale: .84, ease: "power3.out", stagger: .08, immediateRender: false,
            scrollTrigger: { trigger: planGrid, start: "top 88%", end: "top 30%", scrub: .9, invalidateOnRefresh: true },
          });
        } else {
          planCards.forEach((card) => {
            gsap.from(card, {
              y: 70, rotationX: 24, scale: .94, opacity: 0, transformPerspective: 900, transformOrigin: "50% 0%",
              ease: "power2.out", scrollTrigger: { trigger: card, start: "top 96%", end: "top 62%", scrub: .6 },
            });
          });
        }

        /* میخِ دسته همین حالا ساخته شده و فضایش برقرار است — نخستین اندازه‌ی
           درستِ ستاره‌یِ دوم اینجا گرفته می‌شود. */
        rebuildJourneys();
        root.dataset.motion = "ready";
        return () => {
          ScrollTrigger.removeEventListener("refresh", rebuildJourneys);
          if (followUp) window.cancelAnimationFrame(followUp);
          window.removeEventListener("scroll", trackAnchor);
          orb.style.removeProperty("transform");
          orb2.style.removeProperty("transform");
          journey?.kill();
          journey2?.kill();
          delete root.dataset.motion;
        };
      }, root);
      const refresh = () => { if (!disposed) ScrollTrigger.refresh(); };
      let frame = 0;
      const scheduleRefresh = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(refresh); };
      if (document.fonts.status !== "loaded") void document.fonts.ready.then(() => { if (!disposed) scheduleRefresh(); });
      // Ignore the observer's initial delivery. ScrollTrigger already handles window
      // resizes; only late content/height changes need an additional refresh here.
      /* ⚠️ پاییدنِ بلندایِ خودِ «ریشه» کافی نیست. سربرگِ برنامه بیرونِ این
         صفحه است و ممکن است پس از ساخته شدنِ تریگرها بلندتر شود؛ آن وقت
         همه‌یِ جایگاه‌ها به همان اندازه جابه‌جا می‌مانند (اینجا دیده شد:
         ۱۰۲ پیکسل) بی‌آن‌که بلندایِ ریشه تکان بخورد. برای همین «پوسته»‌ای را
         هم می‌پاییم که ریشه در آن نشسته است — نه `<html>` و `<body>` را، که
         اندازه‌شان همان اندازه‌یِ پنجره است و تغییرِ سند را نشان نمی‌دهند. */
      let shell: HTMLElement = root;
      while (shell.parentElement && shell.parentElement !== document.body) shell = shell.parentElement as HTMLElement;
      let width = root.clientWidth;
      let height = root.clientHeight;
      let shellHeight = shell.clientHeight;
      const observer = new ResizeObserver((entries) => {
        let changed = false;
        for (const entry of entries) {
          const nextHeight = Math.round(entry.contentRect.height);
          if (entry.target === root) {
            const nextWidth = Math.round(entry.contentRect.width);
            /* تغییرِ عرض را خودِ ScrollTrigger می‌گیرد؛ اینجا تنها تغییرِ
               بلندا مهم است. */
            if (nextWidth === width && nextHeight !== height) changed = true;
            width = nextWidth; height = nextHeight;
          } else if (nextHeight !== shellHeight) {
            changed = true;
          }
          if (entry.target === shell) shellHeight = nextHeight;
        }
        if (changed) scheduleRefresh();
      });
      observer.observe(root);
      if (shell !== root) observer.observe(shell);
      window.addEventListener("load", scheduleRefresh);
      teardown = () => {
        cancelAnimationFrame(frame); observer.disconnect();
        window.removeEventListener("load", scheduleRefresh); mm.revert(); deckMm.revert();
      };
    }
    // No animation-library download or observers until motion is actually wanted.
    const preference = window.matchMedia("(prefers-reduced-motion: no-preference)");
    let started = false;
    const start = () => { if (!started && preference.matches) { started = true; void setup(); } };
    preference.addEventListener("change", start);
    start();
    return () => { disposed = true; preference.removeEventListener("change", start); teardown(); };
  }, [markers, story.length]);

  return (
    <div ref={rootRef} className={styles.page} dir="rtl">
      <div className={styles.bgPattern} aria-hidden><GeometricPattern opacity={.035} /></div>
      <div className={styles.chromeTop}>{header}</div>
      <main className={styles.content}>
        <div className={styles.parallaxField} aria-hidden>
          {PARALLAX_MOTES.map((mote, index) => (
            <span key={index} className={styles.parallaxTrack} data-parallax-track data-speed={mote.speed} data-mobile={mote.mobile === true}
              style={{ "--mote-x": `${mote.x}%`, "--mote-y": `${mote.y}%`, "--mote-width": `${mote.w}px`, "--mote-height": `${mote.h}px` } as CSSProperties}>
              <span className={styles.parallaxMote} data-tone={mote.tone} />
            </span>
          ))}
        </div>
        <header className={styles.hero}>
          <div className={styles.heroInner}>
            
            <h1 className={styles.heroTitle}>سروا پلاس</h1>
            <p className={styles.heroLede}>همهٔ درس‌های بازی‌ها، نقش و آرایهٔ درسنامه، هوشواره، همهٔ امتحان‌های نهایی و مرور شب امتحان.</p>
            {/* ⚠️ مسیریابِ برنامه هش‌محور است (`#/plus`)؛ اگر لنگر کارِ خودش را
                بکند، `#plans` مسیر را عوض می‌کند و صفحه به ناکجاآباد می‌رود.
                برای همین جهش را می‌گیریم و خودمان نرم می‌لغزیم. `href` سرِ
                جایش می‌ماند تا راست‌کلیک و صفحه‌خوان همچنان درست باشند. */}
            <a
              className={styles.heroCta}
              href="#plans"
              onClick={(event) => {
                const target = document.getElementById("plans");
                if (!target) return;
                event.preventDefault();
                target.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            >دیدن قیمت‌ها <ArrowDown size={16} aria-hidden /></a>
            <div ref={seedRef} className={styles.heroSeed} aria-hidden><Jewel /></div>
            
          </div>
        </header>

        <section className={styles.wheel}>
          <div className={styles.wheelCopy}>
            
            <h2 className={styles.wheelTitle}>چطور کار می‌کند</h2>
            
            <ol className={styles.cycleList}>{cycle.map((step, i) => (
              <li key={step.title} className={styles.cycleCard} data-cycle-step>
                <span className={styles.cycleIndex}>{(i + 1).toLocaleString("fa-IR")}</span>
                <span><span className={styles.cycleTitle}>{step.title}</span><span className={styles.cycleBody}>{step.body}</span></span>
              </li>
            ))}</ol>
          </div>
          <div className={styles.wheelArt} aria-hidden>
            <div className={styles.wheelRing}><i /><i /><i /></div>
            {/* سایت ستاره را درونِ یک لایه‌یِ `coreSlot` می‌گذارد؛ این لایه
               جایِ نشستنِ ستاره است (`orbHolder` به سمتِ آن می‌رود). */}
            <div className={styles.wheelCore}><div className={styles.coreSlot}><SarvaStar size={68} /></div></div>
            {PLUS_ORBIT_LABELS.map(label => <span key={label} className={styles.orbitLabel}>{label}</span>)}
          </div>
        </section>

        <LearningParallax />

        <StoryCompare items={story}>
          {compare && <CompareBoard groups={compare} />}
        </StoryCompare>

        <section className={styles.plans} id="plans">
          <div className={styles.dockScene} aria-hidden>
            <div className={styles.dockAura} data-dock-glow />
            <StarDock className={styles.dockVector} />
            <div ref={dockRef} className={styles.dockTarget} />
            <Jewel className={styles.dockFallback} />
          </div>
          <div className={styles.plansIntro}><h2>قیمت‌ها</h2></div>
          <div className={styles.planContent}>{plans}</div>
        </section>
      </main>
      {footer}
      {showPath && <svg className={styles.pathSvg} aria-hidden><path ref={pathRef} className={styles.pathLine} /></svg>}
      <div className={styles.stage} aria-hidden>
        <div ref={orbRef} className={styles.orbHolder}><div ref={orbInnerRef} className={styles.orb}><Jewel className={styles.orbStar} /></div></div>
        <div ref={orb2Ref} className={styles.orbHolder}><div ref={orb2InnerRef} className={styles.orb}><Jewel className={styles.orbStar} /></div></div>
      </div>
    </div>
  );
}
