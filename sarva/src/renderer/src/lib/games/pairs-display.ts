/**
 * نمایشِ قابِ مرور در «جفت‌های ادبی» — انتخابِ خودِ بازیکن.
 *
 * سایت (sarvaedu.ir) در صفحهٔ مرور، جلدِ واقعیِ کتاب را می‌گذارد
 * (`/games/poems/…`)؛ این برنامه پیش از این داده‌ای بی‌نگاره داشت، پس همیشه
 * قابِ ساختگیِ خودش را نشان می‌داد — یک کتابِ کج با ترنجِ طلایی که نامِ اثر
 * رویش است. آن قاب دوست‌داشتنی است و کسی نخواست از دستش بدهد، پس هر دو می‌مانند
 * و انتخاب با بازیکن است.
 *
 * ⚠️ پیش‌فرض «جلدِ کتاب» است، چون همان چیزی است که سایت نشان می‌دهد و این
 * پروژه عینِ سایت بودن را معیار گذاشته است. قابِ ساختگی یک انحرافِ زیباست و
 * نه جایگزینِ رفتارِ اصلی.
 *
 * ⚠️ این تنظیم فقط صفحهٔ مرور را عوض می‌کند. کارت‌هایِ زمین در سایت متنی‌اند
 * (فقط برچسب و نام)، پس چیزی برای انتخاب نیست.
 */

import { useSyncExternalStore } from "react";

export const PAIRS_DISPLAY_MODES = [
  {
    id: "cover",
    label: "جلدِ کتاب",
    hint: "نگارهٔ واقعی — همان سایت",
  },
  {
    id: "plate",
    label: "قابِ ساختگی",
    hint: "کتابِ کج با ترنجِ طلایی",
  },
] as const;

export type PairsDisplayMode = (typeof PAIRS_DISPLAY_MODES)[number]["id"];

export const DEFAULT_PAIRS_DISPLAY: PairsDisplayMode = "cover";

const STORAGE_KEY = "sarva-pairs-display";

export function isPairsDisplayMode(value: unknown): value is PairsDisplayMode {
  return PAIRS_DISPLAY_MODES.some((m) => m.id === value);
}

function read(): PairsDisplayMode {
  if (typeof localStorage === "undefined") return DEFAULT_PAIRS_DISPLAY;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return isPairsDisplayMode(raw) ? raw : DEFAULT_PAIRS_DISPLAY;
  } catch {
    /* حالتِ خصوصی یا انبارهٔ بسته — پیش‌فرض. */
    return DEFAULT_PAIRS_DISPLAY;
  }
}

/* حافظهٔ درون‌ماژولی: «جلد/قاب» در یک نشست چند بار خوانده می‌شود و نباید هر
   بار از انباره آمد. نوشتن از همین‌جا پخش می‌شود تا هر کامپوننتی که گوش
   می‌دهد بی‌درنگ تازه شود — حتی اگر دو نمایشِ بازی هم‌زمان باز باشد. */
let current: PairsDisplayMode = read();
const listeners = new Set<() => void>();

export function getPairsDisplay(): PairsDisplayMode {
  return current;
}

export function setPairsDisplay(mode: PairsDisplayMode) {
  if (mode === current) return;
  current = mode;
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* بی‌انباره هم انتخاب در همین نشست می‌ماند. */
  }
  listeners.forEach((l) => l());
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

/** حالتِ جاری، واکنش‌پذیر. */
export function usePairsDisplay(): PairsDisplayMode {
  return useSyncExternalStore(
    subscribe,
    getPairsDisplay,
    () => DEFAULT_PAIRS_DISPLAY,
  );
}
