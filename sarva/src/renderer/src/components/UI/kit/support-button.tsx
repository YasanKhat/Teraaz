/**
 * دکمه‌ی «پشتیبانی» — همان دکمه‌ای که سایت زیرِ «سؤالی داری؟» می‌گذارد.
 *
 * ⚠️ مقصد `/panel/support` است، نه یک `mailto:`. سایت پشتیبانی را داخلِ حساب
 * می‌برد تا گفت‌وگو به همان کاربر وصل شود؛ فرستادنِ کاربر به برنامه‌ی ایمیل
 * یعنی پیامی که هیچ‌وقت به پرونده‌اش وصل نمی‌شود.
 */
import { Link } from "@/app/router";
import styles from "./support-button.module.css";

export default function SupportButton({ children = "پشتیبانی", href = "/panel/support" }: { children?: string; href?: string }) {
  return (
    <Link href={href} className={styles.button}>
      <svg viewBox="0 0 32 32" className={styles.face} aria-hidden="true">
        <path className={styles.bubble} d="M16 4.5c-6.6 0-11.5 4.3-11.5 9.9 0 3.1 1.5 5.8 4 7.6l-.9 4.4c-.1.6.5 1 1 .7l4.6-2.6c.9.2 1.8.3 2.8.3 6.6 0 11.5-4.3 11.5-9.9S22.6 4.5 16 4.5Z" />
        <g className={styles.eyes}>
          <ellipse cx="11.6" cy="13.4" rx="1.35" ry="1.6" />
          <ellipse cx="20.4" cy="13.4" rx="1.35" ry="1.6" />
        </g>
        <ellipse className={styles.cheek} cx="9.2" cy="16.6" rx="1.7" ry="1.05" />
        <ellipse className={styles.cheek} cx="22.8" cy="16.6" rx="1.7" ry="1.05" />
        <path className={styles.smile} d="M13.2 17.2c1.6 1.5 4 1.5 5.6 0" />
      </svg>
      <span>{children}</span>
    </Link>
  );
}
