"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
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

// Fixed positions avoid hydration differences. Mobile keeps only six small motes.
const PARALLAX_MOTES = [
  { x: 7, y: 5, w: 15, h: 126, speed: .8, tone: "teal", mobile: true },
  { x: 90, y: 9, w: 22, h: 180, speed: 1.35, tone: "gold" },
  { x: 21, y: 17, w: 9, h: 58, speed: 1.55, tone: "gold" },
  { x: 96, y: 22, w: 12, h: 110, speed: .7, tone: "teal", mobile: true },
  { x: 5, y: 28, w: 24, h: 168, speed: 1.3, tone: "teal" },
  { x: 80, y: 33, w: 10, h: 75, speed: .85, tone: "gold", mobile: true },
  { x: 38, y: 39, w: 12, h: 96, speed: 1.45, tone: "teal" },
  { x: 94, y: 43, w: 21, h: 145, speed: .75, tone: "gold" },
  { x: 11, y: 49, w: 14, h: 125, speed: 1.5, tone: "teal", mobile: true },
  { x: 87, y: 56, w: 16, h: 135, speed: 1.25, tone: "teal" },
  { x: 25, y: 62, w: 9, h: 66, speed: .8, tone: "gold" },
  { x: 96, y: 67, w: 12, h: 98, speed: 1.4, tone: "teal", mobile: true },
  { x: 6, y: 73, w: 21, h: 156, speed: .7, tone: "gold" },
  { x: 75, y: 78, w: 10, h: 82, speed: 1.45, tone: "teal" },
  { x: 17, y: 84, w: 14, h: 105, speed: .85, tone: "teal", mobile: true },
  { x: 91, y: 89, w: 17, h: 118, speed: 1.25, tone: "gold" },
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

function Mark({ mark, plus = false }: { mark: CompareMark; plus?: boolean }) {
  const word = STATE_WORD[mark.state];
  return (
    <span className={styles.boardMark} data-mark={mark.state} data-plus={plus || undefined}>
      {mark.state === "yes" && <span className={styles.boardBadge} aria-hidden />}
      {mark.state === "no" && !plus && <span className={styles.boardDash} aria-hidden />}
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
function StoryCompare({ items }: { items: StoryItem[] }) {
  const [open, setOpen] = useState<number | null>(null);

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
                <div key={item.id} className={styles.storyCaption} style={style} data-reason-card>
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

          <div className={styles.storyDeck}>
            {items.map((item, index) => {
              const style = { "--i": index, "--accent": item.accent } as CSSProperties;
              const Icon = item.icon;
              return (
                <div key={item.id} className={styles.storyCard} style={style}>
                  <div className={styles.storyFlip} data-flipped={index === open || undefined}>
                    <div className={styles.storyFront}>
                      <div className={styles.storyFrontInner}>
                        <span className={styles.storyFrontLogo}><MainLogo /></span>
                        <div className={styles.storyFrontTop}>
                          <span className={styles.storyBrand}>
                            <span className={styles.storyBrandMark}><SarvaStar size={20} /></span>
                            سروا <b>پلاس</b>
                          </span>
                        </div>
                        <div className={styles.storyFrontBottom}>
                          <small>{item.principle}</small>
                          <strong>{item.card}</strong>
                        </div>
                      </div>
                    </div>
                    <div className={styles.storyBack}>
                      <div className={styles.storyBackInner}>
                        <span className={styles.storyBackIndex}>
                          {fa(index + 1)} / {fa(items.length)}
                        </span>
                        <span className={styles.storyEmblem}>
                          <span className={styles.storyEmblemTile}><Icon size={24} aria-hidden /></span>
                        </span>
                        <span className={styles.storyBackText}>
                          <strong>{item.card}</strong>
                          <small>{item.caption}</small>
                        </span>
                        <i className={styles.storyGlare} aria-hidden />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <nav className={styles.storyChips} aria-label="انتخابِ کارت">
          {items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setOpen(index === open ? null : index)}
              data-active={index === open || undefined}
            >
              {item.chip}
            </button>
          ))}
        </nav>
      </div>
    </section>
  );
}

function CompareBoard({ groups }: { groups: CompareGroup[] }) {
  const total = groups.reduce((n, g) => n + g.rows.length, 0);
  return <section className={styles.board} aria-labelledby="plus-compare-heading">
    <h3 id="plus-compare-heading" className={styles.boardHeading}>همهٔ تفاوت‌ها</h3>
    <div className={styles.boardTable} role="table" aria-label="مقایسهٔ کتاب کمک‌درسی و سروا پلاس">
      <div className={styles.boardScore} role="rowgroup">
        <div className={styles.boardScoreRow} role="row">
          <span className={styles.boardScoreLead} role="columnheader"><b>{fa(total)} مورد</b></span>
          <span className={styles.boardScoreBook} role="columnheader">
            <span className={styles.boardScoreName}>
              <BookOpen size={15} aria-hidden />
              <span className={styles.boardBookWord}>کتاب </span>کمک‌درسی
            </span>
            <span className={styles.boardOdometer}><span>{fa(5)}</span></span>
          </span>
          <span className={styles.boardScorePlus} role="columnheader">
            <span className={styles.boardScoreName}>
              <SarvaStar size={15} />سروا پلاس
            </span>
            <span className={styles.boardOdometer}><span>{fa(total)}</span></span>
          </span>
        </div>
      </div>
      {groups.map(group => (
        <div key={group.title} className={styles.boardGroup} role="rowgroup">
          <div className={styles.boardGroupTitle} role="row"><span role="rowheader">{group.title}</span></div>
          {group.rows.map(row => (
            <div key={row.label} className={styles.boardRow} role="row" data-on="true">
              <span className={styles.boardLabel} role="rowheader">{row.label}</span>
              <span className={styles.boardBookCell} role="cell"><Mark mark={row.book} /></span>
              <span className={styles.boardPlusCell} role="cell"><i className={styles.boardWash} aria-hidden="true" /><Mark mark={row.plus} plus /></span>
            </div>
          ))}
        </div>
      ))}
      <div className={styles.boardCost}>
        <div className={styles.boardCostBook}>
          <span className={styles.boardCostBookMark}><BookOpen size={18} aria-hidden /></span>
          <span className={styles.boardCostText}>
            <span className={styles.boardCostName}>{PLUS_COST.name}</span>
            <span className={styles.boardCostValue}>
              <small>{PLUS_COST.prefix}</small> <b>{PLUS_COST.value}</b> <small>{PLUS_COST.unit}</small>
            </span>
          </span>
        </div>
        <div className={styles.boardThread} aria-hidden>
          <span data-journey-emerge="true"><Jewel /></span>
        </div>
      </div>
    </div>
  </section>;
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
      const emerge = root.querySelector<HTMLElement>("[data-journey-emerge]");
      const orb2 = orb2Ref.current;
      const inner2 = orb2InnerRef.current;
      if (!root || !orb || !inner || !seed || !dock || !emerge || !orb2 || !inner2) return;
      gsap.registerPlugin(ScrollTrigger);
      const mm = gsap.matchMedia();
      mm.add({ motion: "(prefers-reduced-motion: no-preference)", compact: "(max-width: 699px)" }, (context) => {
        if (!context.conditions?.motion) return;
        const compact = Boolean(context.conditions.compact);
        const cards = Array.from(root.querySelectorAll<HTMLElement>("[data-reason-card]"));
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
        // Scrub owns one complete transform write on its existing GSAP frame.
        // A second requestAnimationFrame would halve the star's update cadence.
        const renderPosition = () => {
          const atStart = playhead.progress <= 0 && latestScroll <= startScroll;
          const atEnd = playhead.progress >= 1 && latestScroll >= endScroll;
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
          const from = center(seedBounds);
          const to = center(dockBounds);
          boundsLeft = bounds.left;
          fromPoint = from;
          toPoint = to;
          // Pass the cycle illustration (the copy's outside edge on mobile), then
          // trace the cards. Static slots keep entrance transforms out of geometry.
          const cycleSurface = root.querySelector<HTMLElement>(`.${compact ? styles.wheelCopy : styles.wheelArt}`);
          const surfaces = [...root.querySelectorAll<HTMLElement>("[data-journey-surface]"), ...(cycleSurface ? [cycleSurface] : []), ...cards.map((card) => card.parentElement!)].map((surface) => {
            const r = surface.getBoundingClientRect();
            return { left: r.left - bounds.left, right: r.right - bounds.left, top: r.top - bounds.top, bottom: r.bottom - bounds.top };
          }).sort((a, b) => a.top - b.top);
          const ordered = buildJourneyPoints({ from, to, width: bounds.width, compact, surfaces });
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
            journey.to(position, { x: point.x + bounds.left, duration: point.y - previous.y, ease: "sine.inOut" }, previous.y - from.y);
          }

          /* ستاره‌ی نخست: درشت از تخمه بیرون می‌آید، در میانه ریز می‌شود تا
             راه برود، و سرِ جایش در محوطه باز به اندازه‌ی همان هدف برمی‌گردد.
             برخلافِ ستاره‌ی دوم کج‌شدنِ سه‌بعدی ندارد. */
          const shrink = Math.min(260, .35 * distance);
          journey.to(inner, { scale: (compact ? 22 : 45.6) / 156, duration: shrink, ease: "sine.out" }, 0);
          journey.to(inner, { scale: dockBounds.width / 156, rotation: 0, duration: shrink, ease: "sine.inOut" }, distance - shrink);
          journey.to(glow, { opacity: 1, duration: 45, ease: "sine.in" }, distance - 45);
          journey.fromTo(root.querySelector(`.${styles.dockAura}`), { scale: .88 }, { scale: 1, duration: 140, ease: "sine.out" }, distance - 140);
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
        const renderStar2 = () => {
          const atStart = playhead2.progress <= 0 && latestScroll <= start2;
          const atEnd = playhead2.progress >= 1 && latestScroll >= end2;
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
          journey2 = gsap.timeline({ paused: true });
          journey2.to(pos2, { x: to2.x + b.left, duration: span, ease: "sine.inOut" }, 0);
          journey2.to(inner2, { scale: dockWidth2 / 360, rotationX: 48, duration: 300, ease: "sine.inOut" }, span - 300);
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
        ScrollTrigger.addEventListener("refreshInit", buildJourney);
        ScrollTrigger.addEventListener("refreshInit", buildStar2);
        cards.forEach((card) => {
          gsap.from(card, { y: 22, opacity: .35, duration: .65, ease: "power2.out", scrollTrigger: { trigger: card.parentElement, start: "top 90%", once: true } });
          gsap.timeline({ scrollTrigger: { trigger: card.parentElement, start: "top 75%", end: "bottom 25%", scrub: 1 } })
            .fromTo(card.querySelector(`.${styles.cardAura}`), { opacity: 0 }, { opacity: 1, duration: 1, ease: "sine.inOut" })
            .to(card.querySelector(`.${styles.cardAura}`), { opacity: 0, duration: 1, ease: "sine.inOut" });
        });
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

          storySection.dataset.motion = "on";
          gsap.set([...captions, ...backs, ...(chips ? [chips] : [])], { autoAlpha: 0 });
          gsap.set(glares.flat(), { autoAlpha: 0 });
          cards.forEach((card, i) => gsap.set(card, { xPercent: compact ? 0 : -58, zIndex: total - i, ...rest(i) }));

          const deck = gsap.timeline({
            defaults: { ease: "power2.inOut", duration: .6 },
            scrollTrigger: { trigger: storySection, start: "top top", end: "bottom bottom", scrub: compact ? .5 : .8 },
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
                .to(previous, compact
                  ? { xPercent: -150, yPercent: 4, rotation: -16, autoAlpha: 0, duration: .6 }
                  : { xPercent: -182 + (i - 1) * 6, yPercent: 6 + (i - 1) * 1.2, rotation: -12 + (i - 1) * 2.4, scale: .78, duration: .7 }, at)
                .to(captions[i - 1], { autoAlpha: 0, y: -20, duration: .35 }, at);
              for (let j = i + 1; j < total; j++) deck.to(cards[j], { ...rest(j - i), duration: .55 }, at + .1);
            }
            deck.fromTo(captions[i], { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, duration: .45, immediateRender: false }, at + .45)
              .to(card, { yPercent: compact ? 0 : -9, scale: compact ? 1.04 : 1.08, rotation: 0, duration: .4, ease: "power2.out" }, at + .25);
            if (flips[i]) {
              deck.to(flips[i], { rotationX: compact ? 10 : 14, rotation: compact ? -4 : -7, duration: .3, ease: "power1.out" }, at + .3)
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
                xPercent: offset * (compact ? 21 : 32),
                yPercent: Math.abs(offset) * (compact ? 4.5 : 3.5) - (compact ? 8 : 4),
                rotation: offset * (compact ? 6.5 : 5.5),
                scale: compact ? .44 : .58, autoAlpha: 1, duration: 1, ease: "power3.inOut",
              }, finale + .1 + (total - 1 - i) * .04);
          });
          deck.to({}, { duration: .4 });
        }

        root.dataset.motion = "ready";
        return () => {
          ScrollTrigger.removeEventListener("refreshInit", buildJourney);
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
      let width = root.clientWidth;
      let height = root.clientHeight;
      const observer = new ResizeObserver(([entry]) => {
        const nextWidth = Math.round(entry.contentRect.width);
        const nextHeight = Math.round(entry.contentRect.height);
        if (nextWidth === width && nextHeight !== height) scheduleRefresh();
        width = nextWidth; height = nextHeight;
      });
      observer.observe(root);
      teardown = () => { cancelAnimationFrame(frame); observer.disconnect(); mm.revert(); };
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
            <div className={styles.wheelCore}><SarvaStar size={68} /></div>
            {PLUS_ORBIT_LABELS.map(label => <span key={label} className={styles.orbitLabel}>{label}</span>)}
          </div>
        </section>

        <LearningParallax />

        <StoryCompare items={story} />

        {compare && <CompareBoard groups={compare} />}

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
