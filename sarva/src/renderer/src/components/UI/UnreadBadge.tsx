"use client";

import { useEffect, useRef, useState } from "react";

import styles from "./unread-badge.module.css";

/**
 * نقطهٔ قرمزِ شمارنده — همان ماژولِ `139129` در بسته‌یِ زنده‌یِ سایت.
 *
 * رویِ صفر هیچی نمی‌سازد (تا فضایِ خالی رویِ آواتار نماند) و از ده به بعد
 * «۹+» می‌نویسد تا حلقه نشکند. شمارنده با هر افزایش دوباره «تکان» می‌خورد:
 * عدد به عنوانِ `key` می‌نشیند، پس رشدِ شمارنده همان انیمیشن را دوباره اجرا
 * می‌کند — وگرنه کاربر هیچ نشانی نمی‌دید که چیزی تازه رسیده.
 */
export default function UnreadBadge({ count, className = "" }: { count: number; className?: string }) {
  const previous = useRef(count);
  const [pops, setPops] = useState(0);

  useEffect(() => {
    if (count > previous.current) setPops((n) => n + 1);
    previous.current = count;
  }, [count]);

  if (count <= 0) return null;

  return (
    <span aria-hidden className={`${styles.badge} ${className}`} data-wide={count > 9 || undefined} key={pops}>
      {count > 9 ? "۹+" : count.toLocaleString("fa-IR")}
    </span>
  );
}
