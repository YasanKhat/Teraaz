"use client";

import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { usePathname } from "@/app/router";
import { useReducedMotion } from "@/lib/perf/use-perf";
import { Mascot } from "@/components/literary-timeline/Mascot";
import styles from "./mascot.module.css";

const MascotCharacter = lazy(() => import("./MascotCharacter"));

/** `three` یعنی بومِ سه‌بعدی در دسترس است؛ `svg` یعنی دستگاه WebGL ندارد و
 *  همان ماسکوتِ تخت («قلمی») را می‌کشیم تا شخصیت رویِ هر دستگاهی باشد. */
type Mode = "three" | "svg";

/** جایی که ماسکوت نباید بایستد: هرچه لمس‌پذیر است، چون رویِ دکمه می‌افتد و
 *  جلویِ کلیک را می‌گیرد — هرچند خودش `pointer-events: none` است، دیدنِ
 *  یک شخصیتِ رویِ دکمه گیج‌کننده است. سایتِ زنده هم همین فهرست را دارد. */
const NO_GO =
  '[data-mascot-no-go],button,a,input,textarea,select,[role="button"],[role="dialog"]';

const SPEED = 78; // پیکسل بر ثانیه
const REST_MS = 1400; // مکثِ میانِ دو مقصد

function webglAvailable(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

function overlaps(rect: { left: number; top: number; right: number; bottom: number },
  boxes: DOMRect[]): boolean {
  return boxes.some((b) =>
    rect.left < b.right && rect.right > b.left && rect.top < b.bottom && rect.bottom > b.top);
}

/** لایه‌یِ ماسکوتِ سراسری.
 *
 *  ماسکوت در سایتِ زنده رویِ همه‌یِ صفحه‌ها هست: لایه‌ای ثابت که شخصیتی
 *  سه‌بعدی را رویِ صفحه می‌گرداند — به عنصرهایِ نشانه‌گذاری‌شده با
 *  `data-mascot-anchor` می‌رود و از هرچه لمس‌پذیر است کنار می‌کشد. اینجا
 *  همان رفتار پیاده شده است، با دو شرطِ احترام: اگر کاربر کاهشِ حرکت
 *  خواسته باشد یا پنجره پیدا نباشد، اصلاً جان نمی‌گیرد. */
export function MascotOverlay() {
  const pathname = usePathname();
  const reduced = useReducedMotion();
  const [mode, setMode] = useState<Mode | null>(null);
  const [walking, setWalking] = useState(false);
  const [cue, setCue] = useState(0);
  const holder = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });
  const restUntil = useRef(0);

  /* بومِ سه‌بعدی فقط وقتی ساخته می‌شود که دستگاه بتواند آن را بکشد؛ وگرنه
     همان ماسکوتِ تخت جایش را می‌گیرد تا شخصیت هیچ‌جا غایب نماند. */
  useEffect(() => {
    if (reduced) return;
    setMode(webglAvailable() ? "three" : "svg");
  }, [reduced]);

  /* با عوض‌شدنِ صفحه، لنگرها عوض می‌شوند: ماسکوت از نو مقصد می‌گیرد. */
  useEffect(() => {
    restUntil.current = 0;
    target.current = { x: -999, y: -999 };
  }, [pathname]);

  useEffect(() => {
    const el = holder.current;
    if (!el || reduced || !mode) return;

    let raf = 0;
    let last = performance.now();
    let boxes: DOMRect[] = [];
    const rescan = () => {
      boxes = Array.from(document.querySelectorAll(NO_GO)).map((n) => n.getBoundingClientRect());
    };
    rescan();
    window.addEventListener("resize", rescan);
    window.addEventListener("sarva:mascot-refresh", rescan);

    /** نقطه‌ای در دید برمی‌گرداند که رویِ هیچ عنصرِ لمس‌پذیری نیفتد. */
    const pickTarget = (): { x: number; y: number } => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const size = 104;
      const anchors = Array.from(document.querySelectorAll("[data-mascot-anchor]"))
        .map((n) => n.getBoundingClientRect())
        .filter((b) => b.top > 80 && b.bottom < h - 20 && b.width > 4 && b.height > 4);

      /* نیمی از وقت‌ها سراغِ یک لنگر می‌رود — اگر لنگر در دید باشد. */
      if (anchors.length && Math.random() < 0.6) {
        const a = anchors[Math.floor(Math.random() * anchors.length)];
        const x = a.left - size * 0.9;
        const y = a.top + a.height / 2 - size / 2;
        const cand = { left: x, top: y, right: x + size, bottom: y + size };
        if (cand.left > 4 && cand.right < w - 4 && !overlaps(cand, boxes)) {
          setCue((c) => c + 1); // رسیدن به لنگر = یک جهشِ کوتاه
          return { x, y };
        }
      }

      for (let i = 0; i < 24; i++) {
        const x = 12 + Math.random() * Math.max(1, w - size - 24);
        const y = 90 + Math.random() * Math.max(1, h - size - 110);
        const cand = { left: x, top: y, right: x + size, bottom: y + size };
        if (!overlaps(cand, boxes)) return { x, y };
      }
      return { x: 12, y: h - size - 20 };
    };

    /* جایِ آغاز: پایینِ صفحه، بیرونِ راه. */
    pos.current = { x: 24, y: window.innerHeight - 150 };
    el.style.visibility = "visible";
    target.current = pickTarget();

    const step = (now: number) => {
      const dt = Math.min(64, now - last) / 1000;
      last = now;

      if (document.hidden) {
        raf = requestAnimationFrame(step);
        return;
      }

      if (now >= restUntil.current) {
        const dx = target.current.x - pos.current.x;
        const dy = target.current.y - pos.current.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 2) {
          pos.current = { ...target.current };
          setWalking(false);
          restUntil.current = now + REST_MS + Math.random() * 1600;
          target.current = pickTarget();
        } else {
          const stepLen = SPEED * dt;
          pos.current = {
            x: pos.current.x + (dx / dist) * stepLen,
            y: pos.current.y + (dy / dist) * stepLen,
          };
          setWalking(true);
        }
      }

      if (holder.current) {
        holder.current.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0)`;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", rescan);
      window.removeEventListener("sarva:mascot-refresh", rescan);
    };
  }, [mode, reduced, pathname]);

  if (reduced || !mode) return null;

  return (
    <div className={styles.overlay} aria-hidden="true" data-mascot-overlay>
      <div ref={holder} className={styles.position} data-state={walking ? "walk" : "idle"}>
        <div className={styles.character} data-mascot-renderer={mode}>
          {mode === "three" ? (
            <Suspense fallback={null}>
              <MascotCharacter walking={walking} cue={cue} />
            </Suspense>
          ) : (
            <Mascot waving={walking} />
          )}
        </div>
      </div>
    </div>
  );
}

export default MascotOverlay;
