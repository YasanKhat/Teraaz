"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Link } from "@/app/router";
import { useSiteContent } from "@/lib/site/use-site-content";
import type { AnnouncementTone } from "@/lib/site/content";
import styles from "./announcement-bar.module.css";

/**
 * نوار اعلان سایت.
 *
 * ---------------------------------------------------------------------------
 * چرا این شکل
 * ---------------------------------------------------------------------------
 * «خبری که همه باید ببینند» بالاترین چیزِ صفحه است — بالاتر از هدر. سه
 * تصمیم این شکل را می‌سازند:
 *
 *   ۱) **بالاتر از هدر، نه شناور روی آن.** کارت در جریان عادیِ صفحه
 *      می‌نشیند و بقیه را پایین می‌راند. جایگزینش (position: fixed) روی
 *      محتوا می‌افتد و منوی هدر را می‌پوشاند — و روی گوشی، ارتفاعِ کوچکِ
 *      صفحه را می‌خورد.
 *
 *   ۲) **هم‌عرضِ هدر، نه تمام‌عرض.** کارت در همان `container`ِ هدر است و
 *      همان سطحِ شیشه‌ایِ منوهایش را دارد؛ جایگاهش (بالای همه‌چیز) می‌گوید
 *      «این دربارهٔ کلِ سایت است»، و شکلش می‌گوید «این بخشی از سرواست».
 *
 *   ۳) **همیشه فقط یکی.** کوئری هم همین را برمی‌گرداند. دو اعلان روی هم یعنی
 *      هیچ‌کدام خوانده نمی‌شود.
 *
 * ---------------------------------------------------------------------------
 * بستنِ اعلان
 * ---------------------------------------------------------------------------
 * کلید ذخیره، شناسه **به‌علاوهٔ زمان ویرایش** است. یعنی اگر متن اعلان عوض
 * شود، همان اعلان دوباره برای همه ظاهر می‌شود — که درست است: متنِ تازه خبرِ
 * تازه است. اعلانِ `dismissible = false` اصلاً دکمهٔ بستن ندارد؛ برای
 * اختلالِ در جریان.
 *
 * چیزی در سرور ذخیره نمی‌شود: بستن یک اعلان دانشِ خصوصیِ همان مرورگر است و
 * ارزشِ یک ردیف در دیتابیس یا یک کوکیِ اضافه در هر درخواست را ندارد.
 */

const STORAGE_PREFIX = "sarva:announcement:";

/**
 * «این اعلان بسته شده؟» — یک منبعِ بیرونیِ کوچک روی localStorage.
 *
 * ⚠️ چرا useSyncExternalStore و نه یک useEffect ساده:
 *
 * localStorage در رندرِ سرور وجود ندارد، پس خواندنش باید بعد از mount باشد.
 * راهِ ساده‌اش «useEffect + setState» است — ولی آن یعنی یک setState همگام در
 * افکت، که یک رندرِ آبشاریِ اضافه می‌سازد و React هم دربارهٔ همین هشدار
 * می‌دهد.
 *
 * useSyncExternalStore دقیقاً برای همین ساخته شده: یک عکسِ فوری برای سرور
 * («بسته است»، پس چیزی رندر نمی‌شود) و یکی برای مرورگر.
 *
 * رویدادِ `storage` مرورگر فقط در *تب‌های دیگر* شلیک می‌شود، پس بستن در همین
 * تب با شنوندهٔ خودمان اطلاع داده می‌شود.
 */
const listeners = new Set<() => void>();

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function markDismissed(storageKey: string): void {
  try {
    window.localStorage.setItem(STORAGE_PREFIX + storageKey, "1");
  } catch {
    /* مرورگرِ ناشناس یا ذخیره‌سازیِ بسته — فقط برای همین بازدید بسته می‌ماند */
  }
  for (const listener of listeners) listener();
}

function useDismissed(storageKey: string): boolean {
  const getSnapshot = useCallback(() => {
    if (!storageKey) return true;
    try {
      return window.localStorage.getItem(STORAGE_PREFIX + storageKey) === "1";
    } catch {
      // ذخیره‌سازی در دسترس نیست: اعلان هر بار دیده می‌شود، که از ندیدنش بهتر
      // است.
      return false;
    }
  }, [storageKey]);

  // عکسِ فوریِ سرور همیشه «بسته» است تا HTML سرور و اولین رندرِ مرورگر یکی
  // بمانند و hydration هشدار ندهد.
  return useSyncExternalStore(subscribe, getSnapshot, () => true);
}

/**
 * هویتِ هر لحن.
 *
 * ⚠️ نسخهٔ اول یک نوارِ تخت با یک تهِ‌رنگ بود و «به‌سختی دیده می‌شد»؛ نسخهٔ
 * دوم یک نوارِ تمام‌عرضِ گرادیانی شد که از لبهٔ صفحه تا لبهٔ صفحه می‌رفت و با
 * بقیهٔ سایت — که همه‌چیزش در `container` و کارت‌های شیشه‌ایِ گرد است — هم‌زبان
 * نبود؛ بیشتر به بنرِ مرورگر می‌مانْد تا به بخشی از سروا.
 *
 * این نسخه یک **کارتِ شیشه‌ای** است، هم‌عرض و هم‌لبه با هدر (همان `container`)
 * و با همان سطحِ `glass-pop`ِ منوهای هدر. چهار چیز لحن را می‌رسانند و هیچ‌کدام
 * به‌تنهایی حاملِ معنا نیست:
 *
 *   ۱) کاشیِ آیکونِ پُررنگ — اولین نقطه‌ای که چشم می‌گیرد.
 *   ۲) برچسبِ متنیِ لحن («اطلاع‌رسانی»، «فوری» …) — برای کسی که رنگ را
 *      نمی‌بیند، و برای همه، چون یک کلمه سریع‌تر از یک رنگ خوانده می‌شود.
 *   ۳) لبهٔ رنگیِ سمتِ شروع و یک هالهٔ ملایم که از همان‌جا محو می‌شود.
 *   ۴) درخششِ آرامی که فقط `transform` را عوض می‌کند (روی compositor) و با
 *      `prefers-reduced-motion` می‌ایستد.
 */
const TONE: Record<
  AnnouncementTone,
  {
    /** رنگِ پُر — کاشیِ آیکون، لبه و دکمه. متنِ روی آن سفید است. */
    accent: string;
    /** رنگِ *متنِ* برچسب روی سطحِ کارت، جدا برای تمِ تیره. */
    ink: string;
    icon: React.ReactNode;
    label: string;
    /** فوری‌ها یک نقطهٔ تپنده دارند؛ بقیه آرام‌اند. */
    live?: boolean;
  }
> = {
  info: {
    accent: "var(--color-primary)",
    ink: "text-primary",
    label: "اطلاع‌رسانی",
    icon: (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 10.5v3a1 1 0 0 0 1 1h2l5 4V5.5l-5 4H5a1 1 0 0 0-1 1Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 9a4 4 0 0 1 0 6m2.5-8.5a7.5 7.5 0 0 1 0 11" />
      </>
    ),
  },
  success: {
    accent: "#0f9b73",
    ink: "text-emerald-700 dark:text-emerald-300",
    label: "خبر خوب",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3.5 14.4 8l5 .7-3.6 3.5.9 5-4.7-2.4-4.7 2.4.9-5L4.6 8.7l5-.7L12 3.5Z" />
    ),
  },
  warning: {
    accent: "var(--color-gold-ink)",
    ink: "text-gold-ink dark:text-gold",
    label: "توجه",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.3 3.9 2.4 17.5A2 2 0 0 0 4.1 20.5h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    ),
  },
  critical: {
    accent: "var(--color-destructive)",
    ink: "text-destructive",
    label: "فوری",
    live: true,
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5v5m0 3.5h.01" />
      </>
    ),
  },
};


export default function AnnouncementBar() {
  const content = useSiteContent();
  const announcement = content?.announcement ?? null;

  const storageKey = announcement ? `${announcement.id}:${announcement.version}` : "";
  const dismissed = useDismissed(storageKey);

  // فقط برای انیمیشن: یک فریم بعد از اینکه عنصر واقعاً در DOM نشست، ارتفاعش
  // باز می‌شود. بدون این، با ارتفاع نهایی متولد می‌شود و صفحه می‌پرد.
  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [clamped, setClamped] = useState(true);
  const cardRef = useRef<HTMLDivElement>(null);
  const swipe = useRef<{ x: number; y: number; dx: number; active: boolean } | null>(null);

  useEffect(() => {
    // بستنِ حالت اینجا انجام *نمی‌شود*: وقتی اعلانی نیست یا بسته شده،
    // کامپوننت پایین‌تر null برمی‌گرداند و چیزی رندر نمی‌شود، پس یک
    // setState همگام در افکت فقط یک رندرِ آبشاریِ بی‌فایده می‌سازد.
    if (!announcement || dismissed) return;

    const frame = requestAnimationFrame(() => setOpen(true));
    return () => cancelAnimationFrame(frame);
  }, [announcement, dismissed]);

  if (!announcement || dismissed) return null;

  const tone = TONE[announcement.tone] ?? TONE.info;
  const hasLink = !!(announcement.linkUrl && announcement.linkLabel);

  const close = () => {
    // اول انیمیشن جمع شدن، بعد ثبت — وگرنه کامپوننت همان لحظه ناپدید می‌شود
    // و بستن، پرشی به نظر می‌رسد.
    setLeaving(true);
    setTimeout(() => markDismissed(storageKey), 260);
  };

  const extra = announcement as typeof announcement & { badge?: string | null; endsAt?: string | null };
  const remainingMs = extra.endsAt ? Date.parse(extra.endsAt) - Date.now() : NaN;
  const hours = remainingMs / 3_600_000;
  const remaining = !Number.isFinite(hours) || hours <= 0 ? null
    : hours < 1 ? { text: "کمتر از یک ساعت دیگر", soon: true }
    : hours < 24 ? { text: `تا ${Math.ceil(hours).toLocaleString("fa-IR")} ساعت دیگر`, soon: true }
    : Math.ceil(hours / 24) <= 30 ? { text: `تا ${Math.ceil(hours / 24).toLocaleString("fa-IR")} روز دیگر`, soon: hours <= 48 } : null;
  const endSwipe = () => {
    const state = swipe.current;
    const card = cardRef.current;
    swipe.current = null;
    if (!state?.active || !card) return;
    card.style.transition = "";
    if (Math.abs(state.dx) > .3 * card.offsetWidth) {
      card.style.transform = `translateX(${Math.sign(state.dx) * card.offsetWidth}px)`;
      card.style.opacity = "0";
      close();
    } else {
      card.style.transform = "";
      card.style.opacity = "";
    }
  };

  const contentLink = hasLink ? (
    <>
      {announcement.linkLabel}
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 6 5 12l6 6M19 12H5" />
      </svg>
    </>
  ) : null;

  return (
    <div className={styles.slot} role="presentation">
      <div className={styles.grow} data-open={open}>
        <div className={styles.growInner}>
          <div className={`container ${styles.wrap}`}>
            <div ref={cardRef} role="region" aria-label={`اعلان سایت: ${tone.label}`} dir="rtl"
              className={styles.card} data-tone={announcement.tone} data-in={open && !leaving} data-leaving={leaving}
              data-decor-anim={tone.live || undefined}
              onPointerDown={(event) => {
                if (!announcement.dismissible || event.pointerType === "mouse" || (event.target as HTMLElement).closest("a,button")) return;
                swipe.current = { x: event.clientX, y: event.clientY, dx: 0, active: false };
              }}
              onPointerMove={(event) => {
                const state = swipe.current;
                const card = cardRef.current;
                if (!state || !card) return;
                const dx = event.clientX - state.x, dy = event.clientY - state.y;
                if (!state.active) {
                  if (Math.abs(dy) > 10) { swipe.current = null; return; }
                  if (Math.abs(dx) < 10) return;
                  state.active = true;
                  card.setPointerCapture(event.pointerId);
                  card.style.transition = "none";
                }
                state.dx = dx;
                card.style.transform = `translateX(${dx}px)`;
                card.style.opacity = String(Math.max(.2, 1 - Math.abs(dx) / card.offsetWidth));
              }}
              onPointerUp={endSwipe} onPointerCancel={endSwipe}>
              <span className={styles.halo} aria-hidden />
              <span className={styles.edge} aria-hidden />
              <span className={styles.ring} aria-hidden />
              <div className={styles.row}>
                <span className={styles.tile} aria-hidden>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9}>{tone.icon}</svg>
                  {tone.live && <span className={styles.live} />}
                </span>
                <div className={styles.copy}>
                  <div className={styles.meta}>
                    {extra.badge && <span className={styles.pill}>{extra.badge}</span>}
                    {remaining && <span className={styles.until} data-soon={remaining.soon}>
                      <svg viewBox="0 0 24 24" aria-hidden><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>{remaining.text}
                    </span>}
                    {announcement.title && <strong className={styles.title}>{announcement.title}</strong>}
                  </div>
                  <p className={styles.body} data-clamp={clamped} onClick={() => setClamped(false)}>{announcement.body}</p>
                </div>
                {announcement.dismissible && <span className={styles.closeCell}>
                  <button type="button" onClick={close} aria-label="بستن اعلان" className={styles.close}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                      <path strokeLinecap="round" d="m7 7 10 10M17 7 7 17" />
                    </svg>
                  </button>
                </span>}
                {hasLink && <span className={styles.ctaCell}>
                  {announcement.linkUrl!.startsWith("/") ?
                    <Link href={announcement.linkUrl!} className={styles.cta}>{contentLink}</Link> :
                    <a href={announcement.linkUrl!} target="_blank" rel="noopener noreferrer" className={styles.cta}>
                      {contentLink}<span className="sr-only"> (در پنجرهٔ تازه)</span>
                    </a>}
                </span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
