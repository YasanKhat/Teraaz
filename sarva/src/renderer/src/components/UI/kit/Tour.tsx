"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import styles from "./tour.module.css";

/**
 * «تور» — آموزشی که در نخستین ورود به یک صفحه پدیدار می‌شود.
 *
 * ⚠️ این مؤلفه رونوشتِ ماژولِ تور در بسته‌یِ زنده‌یِ sarvaedu.ir است
 *    (ماژولِ `29876`). رفتار، زمان‌بندی و اندازه‌ها عیناً همان‌هایی است که
 *    سایت به کار می‌برد:
 *
 *    - کلیدِ «دیده شده» در `localStorage` با نامِ `sarva-tour:<id>`؛
 *    - ۷۰۰ میلی‌ثانیه تأخیر پیش از نمایش، تا صفحه نخست آرام بگیرد؛
 *    - جست‌وجویِ لنگر در هر قاب (`requestAnimationFrame`) تا اگر لنگر هنوز
 *      در درخت نبود یا جایش عوض شد، کارت دنبالش برود؛
 *    - لنگر با `scrollIntoView` به میانِ دید می‌آید اگر بیرونِ پنجره باشد؛
 *    - زدنِ خودِ لنگر و کلیدِ `Escape` هم تور را جلو می‌برد/می‌بندد؛
 *    - اگر لنگر تا ۳ ثانیه پیدا نشود گام رد می‌شود تا تور گیر نکند.
 */

export type TourStep = {
  /** برگزیننده‌یِ لنگر، مثلاً `[data-tour="vy-poem"]`. نبودنش یعنی کارتِ میان‌صفحه. */
  target?: string;
  text: string;
};

/* شمارنده‌یِ سراسریِ تورهایِ در حالِ اجرا. صحنه‌ها با `useTourActive`
   می‌فهمند که آیا هم‌اکنون توری رویِ صفحه است یا نه. */
let activeCount = 0;
const listeners = new Set<() => void>();
const bump = (delta: number) => {
  activeCount += delta;
  listeners.forEach((listener) => listener());
};
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/** آیا هم‌اکنون توری در حالِ اجراست؟ (برای خواباندنِ انیمیشنِ پس‌زمینه) */
export function useTourActive() {
  return useSyncExternalStore(
    subscribe,
    () => activeCount > 0,
    () => false,
  );
}

export default function Tour({ id, steps }: { id: string; steps: TourStep[] }) {
  const key = `sarva-tour:${id}`;
  const [index, setIndex] = useState(-1);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const stopRef = useRef<() => void>(() => {});

  /* نخستین ورود: اگر این تور پیش‌تر دیده شده، هیچ کاری نمی‌کنیم. */
  useEffect(() => {
    try {
      if (localStorage.getItem(key)) return;
    } catch {
      return;
    }
    bump(1);
    let alive = true;
    const timer = setTimeout(() => {
      setIndex(0);
      try {
        localStorage.setItem(key, "1");
      } catch {
        /* انبارِ محلی در دسترس نیست؛ تور در همین نشست یک بار دیده می‌شود. */
      }
    }, 700);
    stopRef.current = () => {
      if (alive) bump(-1);
      alive = false;
    };
    return () => {
      clearTimeout(timer);
      stopRef.current();
    };
  }, [key]);

  const finish = () => {
    setIndex(-1);
    setRect(null);
    stopRef.current();
  };

  const next = () => {
    setRect(null);
    if (index + 1 < steps.length) setIndex(index + 1);
    else finish();
  };

  const step = index >= 0 ? steps[index] : null;

  useEffect(() => {
    if (!step) return;
    let element: HTMLElement | null = null;
    let frame = 0;
    let signature = "";
    const startedAt = performance.now();
    const onClick = () => next();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") finish();
    };
    window.addEventListener("keydown", onKey);
    const selector = step.target;
    if (!selector) return () => window.removeEventListener("keydown", onKey);

    const tick = () => {
      if (!element || !element.isConnected) {
        element?.removeEventListener("click", onClick);
        element = (Array.from(document.querySelectorAll(selector)).find(
          (candidate) => candidate.getClientRects().length > 0,
        ) ?? null) as HTMLElement | null;
        if (!element) {
          /* لنگر هنوز در درخت نیست؛ سه ثانیه صبر می‌کنیم و بعد می‌گذریم. */
          if (performance.now() - startedAt > 3000) {
            next();
            return;
          }
          frame = requestAnimationFrame(tick);
          return;
        }
        element.addEventListener("click", onClick);
        const first = element.getBoundingClientRect();
        if (first.top < 0 || first.bottom > window.innerHeight) {
          element.scrollIntoView({ block: "center", behavior: "smooth" });
        }
      }
      const box = element.getBoundingClientRect();
      const now = `${box.x}|${box.y}|${box.width}|${box.height}`;
      if (now !== signature) {
        signature = now;
        setRect(box);
      }
      frame = requestAnimationFrame(tick);
    };
    tick();
    return () => {
      cancelAnimationFrame(frame);
      element?.removeEventListener("click", onClick);
      window.removeEventListener("keydown", onKey);
    };
    /* `next`/`finish` از همین رندر بسته می‌شوند، درست مانندِ سایت. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  if (!step || (step.target && !rect)) return null;

  const width = Math.min(300, window.innerWidth - 32);
  const isLast = index === steps.length - 1;
  const body = (
    <>
      <p className={styles.text}>{step.text}</p>
      <div className={styles.foot}>
        {steps.length > 1 && (
          <span className={styles.count}>
            {(index + 1).toLocaleString("fa-IR")} از {steps.length.toLocaleString("fa-IR")}
          </span>
        )}
        {!isLast && (
          <button type="button" className={styles.skip} onClick={finish}>
            رد کردن
          </button>
        )}
        <button type="button" className={styles.next} onClick={next}>
          {isLast ? "باشه" : "بعدی"}
        </button>
      </div>
    </>
  );

  /* بی‌لنگر (یا هنوز بی‌جا): کارت در میانِ صفحه با یک لایه‌یِ تار. */
  if (!step.target || !rect) {
    return createPortal(
      <>
        <div className={styles.dim} aria-hidden />
        <div
          role="dialog"
          aria-label="راهنما"
          dir="rtl"
          className={styles.card}
          data-side="center"
          style={{ width }}
        >
          {body}
        </div>
      </>,
      document.body,
    );
  }

  const left = Math.min(
    Math.max(rect.left + rect.width / 2 - width / 2, 16),
    window.innerWidth - 16 - width,
  );
  /* کارت زیرِ لنگر می‌نشیند اگر جا باشد، وگرنه بالایش، وگرنه رویِ آن. */
  const side =
    window.innerHeight - rect.bottom >= 160
      ? "below"
      : rect.top >= 160
        ? "above"
        : "over";
  const arrow = Math.min(Math.max(rect.left + rect.width / 2 - left, 18), width - 18);

  return createPortal(
    <>
      <div
        className={styles.ring}
        aria-hidden
        style={{ top: rect.top - 6, left: rect.left - 6, width: rect.width + 12, height: rect.height + 12 }}
      />
      <div
        role="dialog"
        aria-label="راهنما"
        dir="rtl"
        className={styles.card}
        data-side={side}
        style={
          {
            left,
            width,
            ...(side === "below"
              ? { top: rect.bottom + 12 }
              : { bottom: side === "above" ? window.innerHeight - rect.top + 12 : 16 }),
            "--arrow": `${arrow}px`,
          } as CSSProperties
        }
      >
        {body}
      </div>
    </>,
    document.body,
  );
}
