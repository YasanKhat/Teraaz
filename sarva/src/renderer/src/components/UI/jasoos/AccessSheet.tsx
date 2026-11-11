"use client";

import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Check, RefreshCw, X } from "lucide-react";
import "./access.css";

const A = "access-module__NMqQxa__";

/** درِ دسترسی — همان برگه‌ای که سایت هنگامِ پایانِ سهم یا نیاز به حساب
 *  می‌آورد. برخلافِ پنجره‌یِ میان‌صفحه‌ایِ برنامه، این یک برگه‌یِ پایین‌آمده
 *  است: پرده در پس‌زمینه، دستگیره در بالا، و با کشیدن به پایین بسته می‌شود.
 *  نشانه‌گذاری و نوشته‌ها رونوشتِ `access-module`ِ سایت‌اند. */

export type AccessState =
  | { kind: "unknown" }
  | { kind: "gift"; days: number }
  | { kind: "login" }
  | { kind: "quota"; perDay: boolean }
  | { kind: "plus" };

export default function AccessSheet({
  sectionTitle,
  sectionPlus,
  perks,
  state,
  holder,
  onClose,
  onRetry,
}: {
  /** نامِ بخش، مثلاً «جاسوسِ نقش‌ها». */
  sectionTitle: string;
  /** آنچه پلاس برای این بخش می‌گشاید. */
  sectionPlus: string;
  perks: string[];
  state: AccessState;
  holder?: string;
  onClose: () => void;
  onRetry?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const isGuest = state.kind === "gift" || state.kind === "login";
  const days =
    state.kind === "gift" ? (state.days === 1 ? "یک روز" : `${state.days.toLocaleString("fa-IR")} روز`) : "";

  let heading = "";
  let body = "";
  let cta = "";
  let href = "/plus";

  switch (state.kind) {
    case "unknown":
      heading = "وضعیت اشتراک بررسی نشد";
      body = "اتصال برقرار نشد. دوباره امتحان کن.";
      cta = "تلاش دوباره";
      break;
    case "gift":
      heading = `${days} سروا پلاس، هدیهٔ ثبت‌نام`;
      body = `با ثبت‌نام، ${sectionTitle} و همهٔ بخش‌های دیگر از همین حالا باز می‌شود.`;
      cta = "ثبت‌نام رایگان";
      href = "/auth?mode=signup";
      break;
    case "login":
      heading = "برای ادامه وارد شو";
      body = `${sectionTitle} را با حساب کاربری ادامه بده.`;
      cta = "ورود / ثبت‌نام";
      href = "/auth";
      break;
    case "quota":
      heading = state.perDay ? "سهم امروزت تمام شد" : "سهم این بخش تمام شد";
      body = `${sectionTitle}: ${sectionPlus}`;
      cta = isGuest ? "ورود و مشاهدهٔ پلاس" : "انتخاب مدت اشتراک";
      href = isGuest ? "/auth" : "/checkout";
      break;
    case "plus":
      heading = "سروا پلاس";
      body = `${sectionTitle}: ${sectionPlus}`;
      cta = "انتخاب مدت اشتراک";
      break;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <motion.div
        className={A + "scrim"}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      />
      <motion.div
        dir="rtl"
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="access-sheet-title"
        className={A + "sheet"}
        initial={{ y: 48, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 32, opacity: 0 }}
        transition={{ duration: 0.26, ease: [0.2, 0.8, 0.2, 1] }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.5 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 110 || info.velocity.y > 600) onClose();
        }}
      >
        <span className={A + "grip"} aria-hidden="true" />
        <button type="button" className={A + "close"} onClick={onClose} aria-label="بستن">
          <X className="size-4" strokeWidth={2.2} />
        </button>

        <div className={A + "stage"} aria-hidden="true">
          {state.kind === "unknown" ? (
            <span className={A + "stageIcon"}>
              <RefreshCw className="size-7" strokeWidth={1.8} />
            </span>
          ) : state.kind === "login" ? (
            <span className={A + "stageLogo"} />
          ) : (
            <span className={A + "stageCard"}>{holder ?? "عضو سروا"}</span>
          )}
        </div>

        <div className={A + "body"}>
          <h2 id="access-sheet-title" className="text-lg font-black sm:text-xl">
            {heading}
          </h2>
          <p className="mt-1 text-sm leading-7 text-muted-foreground">{body}</p>

          {state.kind !== "login" && state.kind !== "unknown" && (
            <ul className={A + "perks"}>
              {perks.map((p) => (
                <li key={p}>
                  <Check aria-hidden="true" className="size-4 shrink-0 text-primary" strokeWidth={2.6} />
                  {p}
                </li>
              ))}
            </ul>
          )}

          {state.kind === "unknown" ? (
            <button type="button" className={A + "cta"} onClick={onRetry}>
              تلاش دوباره
            </button>
          ) : (
            <a href={href} className={A + "cta"}>
              {cta}
              <ArrowLeft aria-hidden="true" className="size-4" />
            </a>
          )}

          <button type="button" className={A + "secondary"} onClick={onClose}>
            بستن
          </button>
        </div>
      </motion.div>
    </div>
  );
}
