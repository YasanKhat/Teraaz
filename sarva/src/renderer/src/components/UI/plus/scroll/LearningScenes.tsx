import { useId, type CSSProperties } from "react";
import styles from "./learning-scenes.module.css";

/* ⚠️ این چهارده کپسول عیناً از اچ‌تی‌ام‌الِ صفحه‌یِ `/plus` سایت کپی شده‌اند:
   همان جا، اندازه، ژرفا، سرعت، و همان تصمیم که کدام در تلفن بماند و
   کدام طلایی باشد. پیش از این چهل کپسول با عددهایِ ساخته‌یِ خودمان
   اینجا بود و چیدمان و لغزش با سایت یکی نبود. */
const CAPSULES = [
  { x: 4, y: 8, width: 14, height: 150, depth: 0.9, speed: 0.7, mobile: true, gold: false },
  { x: 11, y: 30, width: 9, height: 70, depth: 0.55, speed: 1.5, mobile: false, gold: false },
  { x: 6, y: 55, width: 20, height: 200, depth: 1, speed: 0.85, mobile: true, gold: false },
  { x: 15, y: 82, width: 10, height: 90, depth: 0.6, speed: 1.35, mobile: true, gold: true },
  { x: 24, y: 6, width: 8, height: 54, depth: 0.4, speed: 1.6, mobile: false, gold: false },
  { x: 30, y: 86, width: 12, height: 110, depth: 0.4, speed: 0.75, mobile: false, gold: false },
  { x: 46, y: 2, width: 9, height: 80, depth: 0.28, speed: 1.4, mobile: false, gold: false },
  { x: 57, y: 88, width: 10, height: 70, depth: 0.28, speed: 1.25, mobile: false, gold: false },
  { x: 70, y: 4, width: 12, height: 120, depth: 0.4, speed: 0.8, mobile: false, gold: true },
  { x: 78, y: 84, width: 8, height: 60, depth: 0.4, speed: 1.55, mobile: false, gold: false },
  { x: 88, y: 12, width: 18, height: 190, depth: 1, speed: 0.8, mobile: true, gold: false },
  { x: 94, y: 40, width: 10, height: 96, depth: 0.6, speed: 1.45, mobile: false, gold: true },
  { x: 85, y: 62, width: 13, height: 140, depth: 0.8, speed: 0.7, mobile: true, gold: false },
  { x: 93, y: 84, width: 9, height: 80, depth: 0.5, speed: 1.3, mobile: true, gold: false },
];

export function LearningParallax() {
  const id = useId();
  return (
    <section id="learning-rhythm" className={styles.parallax} data-learning-parallax aria-labelledby={`${id}-title`}>
      <div className={styles.capsules} aria-hidden>
        {CAPSULES.map((capsule, i) => (
          <span key={i} className={styles.capsuleTrack} data-learning-capsule data-speed={capsule.speed} data-mobile={capsule.mobile}
            style={{ "--x": `${capsule.x}%`, "--y": `${capsule.y}%`, "--w": `${capsule.width}px`, "--h": `${capsule.height}px`, "--depth": capsule.depth } as CSSProperties}>
            <i className={styles.capsule} data-gold={capsule.gold} />
          </span>
        ))}
      </div>
      <div className={styles.parallaxCopy} data-journey-surface>
        
        <h2 id={`${id}-title`}>هر درسِ کتاب، یک بازی</h2>
        
        <div className={styles.subjects}><span>واژه و املا</span><span>دستور و آرایه</span><span>معنا و قرابت</span></div>
      </div>
    </section>
  );
}
