"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValueEvent, useScroll, useTransform, type MotionValue } from "motion/react";
import { QALAMI, type Person, type StageLine } from "@/lib/literary-timeline/data";
import { CartoonFigure } from "./CartoonFigure";
import { Mascot } from "./Mascot";
import { Portrait, portraitFor } from "./Portrait";
import s from "./timeline.module.css";

/** سایت در عرضِ ۷۰۰ پیکسل رفتارِ صحنه را عوض می‌کند: تنها گوینده می‌ماند و
 *  نوارِ گروه پیدا می‌شود (HAR-4، timeline-live.css). همان شرط اینجا هم لازم
 *  است وگرنه در پنجرهٔ باریکِ برنامه همه با هم فشرده می‌شوند. */
function useNarrow() {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 700px)");
    const sync = () => setNarrow(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  return narrow;
}

/** One figure on the stage. It climbs out of the ground as the stage scrolls
 *  in, each a little after the one before, then drifts with the page. */
function Actor({ index, count, enter, drift, speaking, narrow, reduced, children }: { index: number; count: number; enter: MotionValue<number>; drift: MotionValue<number>; speaking: boolean; narrow: boolean; reduced: boolean; children: React.ReactNode }) {
  const start = index / (count + 2) * .5;
  const rise = useTransform(enter, [start, start + .45], [140, 0], { clamp: true });
  const tilt = useTransform(enter, [start, start + .45], [index % 2 ? 9 : -9, 0], { clamp: true });
  const sway = useTransform(drift, [0, 1], [index % 2 ? 14 : -14, index % 2 ? -14 : 14]);
  const y = useTransform(() => rise.get() + sway.get());
  const opacity = useTransform(enter, [start, start + .2], [0, 1], { clamp: true });
  return <motion.div className={s.actor} data-actor data-speaking={speaking || undefined} style={reduced ? undefined : { y, rotate: tilt, opacity }}>
    {/* بدن است که بزرگ و کوچک می‌شود، نه خودِ بازیگر — در سایت هم همین است و
        جابه‌جاییِ ورود (بالا آمدن) با این لرزش قاطی نمی‌شود. */}
    <motion.div className={s.actorBody} data-body animate={reduced ? undefined : {
      scale: narrow ? 1 : speaking ? 1.1 : .94,
      y: narrow || !speaking ? 0 : -12,
      opacity: narrow || speaking ? 1 : .6,
    }} transition={reduced ? { duration: 0 } : { duration: .14, ease: "easeOut" }}>
      {children}
    </motion.div>
  </motion.div>;
}

/** The chapter's featured people as full-length characters, talking in turn.
 *  The stage pins under the era dock while its lines play (the pinned stretch
 *  is `.stageTrack::after`, about 110px of scroll per line), so the bubble and
 *  the speaker are always on screen together. Scrolling back replays the lines.
 *
 *  بازنویسیِ ۱۴۰۴/۰۸/۱۷ برابرِ کدِ زنده: سایت همهٔ حباب‌ها را یک‌باره
 *  می‌نویسد و با `visibility` تنها حبابِ جاری را پیدا می‌کند؛ هر واژه را در
 *  `<span class="stageWord">` می‌پیچد تا یکی‌یکی پیدا شود؛ و دنباله، نقطهٔ
 *  نور، نوارِ گروه و شمارنده دارد. پیش از این تنها حبابِ جاری رندر می‌شد و
 *  واژه‌ها پیچیده نبودند. */
export function PoetStage({ people, lines, reduced, onPerson }: { people: Person[]; lines: StageLine[]; reduced: boolean; onPerson: (person: Person) => void }) {
  const track = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLDivElement>(null);
  const narrow = useNarrow();
  const [line, setLine] = useState(-1);
  // در سایت این همان ScrollTriggerِ «صحنه در پنجره هست؟» است: تا صحنه پیدا
  // نشود نه تکانِ بیکاری هست و نه عینک می‌آید.
  const [live, setLive] = useState(false);
  useEffect(() => {
    const box = track.current;
    if (!box) return;
    const observer = new IntersectionObserver(([entry]) => setLive(entry.isIntersecting));
    observer.observe(box);
    return () => observer.disconnect();
  }, []);
  const { scrollYProgress: enter } = useScroll({ target: ref, offset: ["start end", "end 70%"] });
  const { scrollYProgress: drift } = useScroll({ target: track, offset: ["start end", "end start"] });
  const { scrollY } = useScroll();
  const follow = () => {
    const stage = ref.current, box = track.current;
    if (!stage || !box) return;
    const pinTop = parseFloat(getComputedStyle(stage).top) || 0;
    const rect = box.getBoundingClientRect(), own = stage.getBoundingClientRect();
    // Before the pin: speak only once every figure has fully risen into view.
    if (rect.top > pinTop) {
      const inView = own.top >= pinTop && [...stage.querySelectorAll("[data-actor]")].every(actor => actor.getBoundingClientRect().bottom <= window.innerHeight);
      return setLine(inView ? 0 : -1);
    }
    const progress = (pinTop - rect.top) / Math.max(1, rect.height - own.height);
    setLine(Math.min(lines.length - 1, Math.floor(progress * lines.length)));
  };
  useMotionValueEvent(scrollY, "change", follow);
  useEffect(follow);

  const current = lines[Math.max(line, 0)];
  const hasQalami = lines.some(l => l.who === QALAMI);
  const slots = people.length + (hasQalami ? 1 : 0);
  const slotOf = (who: string) => who === QALAMI ? people.length : people.findIndex(p => p.name === who);
  const speakerSlot = current ? slotOf(current.who) : -1;
  // Visual order is right-to-left, so positions are measured from the right edge.
  const slotLeft = (slot: number) => narrow ? "50%" : `${100 - (slot + .5) / slots * 100}%`;
  const slotPercent = (slot: number) => 100 - (slot + .5) / slots * 100;
  const alignOf = (who: string) => {
    const percent = slotPercent(slotOf(who));
    return percent > 60 ? "start" : percent < 40 ? "end" : "center";
  };
  const shown = reduced ? Math.max(line, 0) : line;
  const markerLeft = slotLeft(Math.max(speakerSlot, 0));

  return <div ref={track} className={s.stageTrack} data-reduced={reduced || undefined} data-live={live || undefined} style={{ "--lines": lines.length } as React.CSSProperties}>
    <div ref={ref} className={s.stage} data-stage style={{ "--slots": slots } as React.CSSProperties}>
      <div className={s.stageTalk}>
        {lines.map((entry, i) => <motion.p key={i} className={s.stageBubble} data-bubble data-align={alignOf(entry.who)}
          style={{ visibility: i === shown ? "visible" : "hidden" }}
          animate={{ opacity: i === shown ? 1 : 0, y: i === shown ? 0 : i < shown ? -16 : 22, scale: i === shown ? 1 : .9 }}
          transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 26 }}>
          <b>{entry.who}</b>
          <span>{entry.text.split(" ").map((word, w) => <motion.span key={w} initial={false} animate={{ opacity: i === shown ? 1 : 0, y: i === shown ? 0 : 10 }} transition={reduced ? { duration: 0 } : { duration: .08, delay: i === shown ? w * .32 / Math.max(1, entry.text.split(" ").length) : 0 }}>{w > 0 && " "}<span data-w className={s.stageWord}>{word}</span></motion.span>)}</span>
        </motion.p>)}
        <i className={s.stageTail} data-tail aria-hidden="true" style={{ left: markerLeft }} />
      </div>
      <div className={s.stageFloor}>
        <i className={s.stageSpot} data-spot aria-hidden="true" style={{ left: markerLeft }} />
        {people.map((person, i) => {
          const speaking = speakerSlot === i && shown >= 0;
          return <Actor key={person.id} index={i} count={slots} enter={enter} drift={drift} speaking={speaking} narrow={narrow} reduced={reduced}>
            <button className={s.actorOpen} onClick={() => onPerson(person)}>
              <span className={s.actorFigure}>{portraitFor(person).cartoon ? <CartoonFigure id={person.id} src={portraitFor(person).src!} alt={`تصویرسازی ${person.name}`} active={speaking && live} live={live} reduced={reduced} idleDelay={1.5 + i * 2.3} /> : <span className={s.actorFallback}><Portrait person={person} /></span>}</span>
              <span className={s.actorName}>{person.name}</span>
            </button>
          </Actor>;
        })}
        {hasQalami && <Actor index={people.length} count={slots} enter={enter} drift={drift} speaking={speakerSlot === people.length && shown >= 0} narrow={narrow} reduced={reduced}>
          <span className={s.actorQalami}><Mascot waving={speakerSlot === people.length && shown >= 0 && live} /></span>
          <span className={s.actorName}>{QALAMI}</span>
        </Actor>}
      </div>
      {/* نوارِ گروه: در رایانه پنهان است و تنها در پنجرهٔ باریک پیدا می‌شود،
          آن‌جا که سایت تنها گوینده را روی صحنه نگه می‌دارد. */}
      <div className={s.stageCast} aria-hidden="true">
        {people.map((person, i) => <span key={person.id} data-speaking={speakerSlot === i && shown >= 0 ? true : undefined}><Portrait person={person} /></span>)}
        {hasQalami && <span className={s.stageCastQalami} data-speaking={speakerSlot === people.length && shown >= 0 ? true : undefined}><Mascot waving={false} /></span>}
      </div>
      {lines.length > 1 && <span className={s.stageCount} aria-hidden="true">
        <span>{(Math.max(shown, 0) + 1).toLocaleString("fa-IR")} / {lines.length.toLocaleString("fa-IR")}</span>
        {lines.map((_, i) => <i key={i} data-on={i <= shown || undefined} />)}
      </span>}
    </div>
  </div>;
}
