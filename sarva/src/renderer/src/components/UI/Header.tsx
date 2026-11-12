"use client";

import { Link } from "@/app/router";
import * as Menu from "@radix-ui/react-dropdown-menu";
import { Activity, BookOpen, Check, ChevronDown, ChevronLeft, FileText, Gamepad2, GraduationCap, History, Info, MessagesSquare, MoonStar, Music2, Shapes } from "lucide-react";
import { usePlusSummary } from "@/lib/auth/use-current-user";
import { useSiteContent } from "@/lib/site/use-site-content";
import MainLogo from "../svgs/mainLogo";
import AccountMenu from "./AccountMenu";
import DarkModeButton from "./DarkModeButton";
import PaletteButton from "./PaletteButton";
import SarvaStar from "./SarvaStar";
import styles from "./header.module.css";

/** فهرستِ سایت — ترتیب و نام‌ها برابرِ سایتِ زنده است (بسته‌ی سربرگ در
 *  HAR-4). نسبت به پورتِ پیشین دو بخش کم بود («کنکور» و «کارگاه») و ترتیب
 *  فرق می‌کرد: سایت آزمون‌ها، درسنامه، کنکور، بازی‌ها، کارگاه، شب امتحان،
 *  عروض، وزن‌یاب، خط زمان. */
const navLinks = [
  { id: "exam", title: "آزمون‌ها", href: "/exam", icon: FileText },
  { id: "doroos", title: "درسنامه", href: "/doroos", icon: BookOpen },
  { id: "konkur", title: "کنکور", href: "/konkur", icon: GraduationCap },
  { id: "game", title: "بازی‌ها", href: "/game", icon: Gamepad2 },
  { id: "learn", title: "کارگاه", href: "/learn", icon: Shapes },
  { id: "shab", title: "شب امتحان", href: "/shab-emtehan", icon: MoonStar },
  { id: "aruz", title: "عروض", href: "/aruz", icon: Activity },
  { id: "vazn", title: "وزن‌یاب", href: "/vazn-yab", icon: Music2 },
  { id: "timeline", title: "خط زمان", href: "/timeline", icon: History },
];

/** ستونِ کناریِ فهرست — دو پیوند با یک توضیحِ کوتاه زیرِ هر کدام.
 *
 *  ⚠️ این ستون تازه است. در بسته‌یِ سربرگِ ۹ نوامبر، منو فقط شبکه‌یِ نه‌بخشی
 *  را داشت (`[...k]`، بی‌هیچ ستونی)؛ در بسته‌یِ ۱۲ نوامبر ستون اضافه شده و
 *  کارتِ پلاس هم از پایینِ شبکه به *داخلِ* همین ستون کوچیده است. */
const sideLinks = [
  { id: "club", title: "سروا کلاب", note: "سؤال بپرس، جواب بگیر", href: "/sarvaclub", icon: MessagesSquare },
  { id: "about", title: "درباره سروا", note: "ما کی هستیم", href: "/about", icon: Info },
];

const BADGE_LABELS: Record<string, string> = { new: "جدید", en: "NEW", fresh: "تازه", hot: "داغ", fire: "" };

/** نشانِ کوچکِ کنارِ یک بخش (جدید/تازه/داغ/آتش). متن از `navBadges` در
 *  محتوایِ سایت می‌آید و تا چیزی تنظیم نشود چیزی نمایش داده نمی‌شود. */
function NavBadge({ kind }: { kind?: string | number }) {
  if (!kind) return null;
  if (kind === "fire") return <picture className={styles.fire}>
    <source srcSet="/emoji/fire-still.webp" media="(prefers-reduced-motion: reduce)" />
    {/* eslint-disable-next-line @next/next/no-img-element -- an emoji, not content imagery */}
    <img src="/emoji/fire.webp" alt="" width={28} height={28} loading="lazy" />
  </picture>;
  return <span className={styles.badge} data-kind={kind}>{BADGE_LABELS[kind] ?? kind}</span>;
}

/** ستارهٔ چهارپرِ کنارِ «پلاس». */
function Sparkle() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={styles.sparkle}>
      <path d="M12 1.5c.5 5.6 4.9 10 10.5 10.5-5.6.5-10 4.9-10.5 10.5C11.5 16.9 7.1 12.5 1.5 12 7.1 11.5 11.5 7.1 12 1.5Z" />
    </svg>
  );
}

/** «۱۲ روز دیگر» — متنِ کوچکِ کارتِ پلاس در فهرست.
 *
 *  ⚠️ واژه با منویِ حساب فرق می‌کند و باید فرق کند: آن‌جا «روز مانده» است و
 *  این‌جا «روز دیگر». سایت همین دو واژه را در دو جا نوشته است. */
function plusDaysText(expiresAt: string | null): string | null {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (!Number.isFinite(ms)) return null;
  const days = Math.max(0, Math.ceil(ms / 86_400_000));
  return days === 0 ? "امروز تمام می‌شود" : `${days.toLocaleString("fa-IR")} روز دیگر`;
}

export default function Header({ compact = false, previewPlus = false }: { compact?: boolean; previewPlus?: boolean }) {
  const { plus, loading } = usePlusSummary();
  // Only the development showcase may display Plus without a database connection.
  /* ⚠️ `previewPlus` در امضایِ کامپوننتِ سایت هم هست ولی در محاسبه به کار
     نمی‌رود: آن‌جا تنها `state !== "off"` و `!loading && state === "active"`
     است و بس. افزودنِ استثنایِ توسعه یعنی در پیش‌نمایش نشانِ «پلاسِ فعال»
     می‌نشیند (که به `/panel/subscription` می‌رود) و پیوندِ «سروا پلاس» — که
     باید به صفحه‌یِ خرید برود — پنهان می‌ماند. */
  const plusVisible = plus.state !== "off";
  const plusActive = !loading && plus.state === "active";
  const plusHref = plus.state === "active" ? "/panel/subscription" : "/plus";
  // در سایت عنوان همیشه «سروا پلاس» است؛ «خرید سروا پلاس» و «تمدید» مالِ
  // منویِ حساب است، نه این‌جا.
  const plusTitle = "سروا پلاس";
  const navBadges = useSiteContent()?.navBadges as Record<string, string> | undefined;

  return (
    <nav dir="rtl" aria-label="ناوبری اصلی" className={`container ${styles.header}`} data-compact={compact}>
      <div className={styles.brand}>
        <Link href="/" aria-label="سروا؛ صفحهٔ اصلی" className={styles.logo}>
          <span id="site-logo" className={styles.logoMark}><MainLogo /></span>
          <span className={styles.wordmark}>ســـروا</span>
        </Link>
        {/* ⚠️ فقط اشتراکِ فعالِ واقعی (از `/me`) این نشان را می‌سازد. */}
        {plusActive && (
          <Link href="/panel/subscription" className={styles.plusMark} aria-label="سروا پلاس فعال است" title="سروا پلاس فعال است">
            <Sparkle />
            <span>پلاس</span>
          </Link>
        )}
      </div>
      <div className={styles.actions}>
        {!compact && (
          <>
            {plusVisible && !plusActive && <Link href={plusHref} className={styles.plusLink}>{plusTitle}</Link>}
            <Menu.Root dir="rtl" modal={false}>
              <Menu.Trigger className={styles.menuTrigger}>
                فهرست <ChevronDown size={16} aria-hidden />
              </Menu.Trigger>
              <Menu.Portal>
                <Menu.Content aria-label="بخش‌های سروا" className={`${styles.menu} glass-pop`} align="start" sideOffset={12} collisionPadding={16} loop>
                  <div className={styles.grid}>
                    {navLinks.map(({ id, title, href, icon: Icon }) => (
                      <Menu.Item key={id} asChild>
                        <Link href={href} className={styles.menuItem}>
                          <span className={styles.menuIcon}><Icon size={22} strokeWidth={1.6} aria-hidden /></span>
                          <span>{title}</span>
                          <NavBadge kind={navBadges?.[id]} />
                        </Link>
                      </Menu.Item>
                    ))}
                  </div>
                  <div className={styles.side}>
                    {sideLinks.map(({ id, title, note, href, icon: Icon }) => (
                      <Menu.Item key={id} asChild>
                        <Link href={href} className={styles.sideItem}>
                          <span className={styles.sideIcon}><Icon size={19} strokeWidth={1.7} aria-hidden /></span>
                          <span className={styles.sideText}>
                            <b>{title}</b>
                            <small>{note}</small>
                          </span>
                          <ChevronLeft size={15} aria-hidden className={styles.sideChevron} />
                          <NavBadge kind={navBadges?.[id]} />
                        </Link>
                      </Menu.Item>
                    ))}
                    {plusVisible && (
                      plusActive ? (
                        /* مشترکِ فعال: کارت دیگر پیوند نیست — مُهرِ
                           «مشترک هستی» رویش می‌نشیند و جایی نمی‌رود. نشانِ
                           «پلاسِ» کنارِ لوگو (بالا) همچنان به صفحه‌یِ
                           اشتراک می‌رود، پس دسترسی از بین نمی‌رود. */
                        <Menu.Item disabled className={`${styles.plusCard} ${styles.plusOwned}`}>
                          <span className={styles.menuIcon}><SarvaStar size={24} aria-hidden /></span>
                          <span className={styles.plusText}>
                            <b>{plusTitle}</b>
                            <small>{plusDaysText(plus.expiresAt) ?? "اشتراکت فعال است"}</small>
                          </span>
                          <span className={styles.stamp} aria-label="اشتراک فعال">
                            <Check size={13} strokeWidth={3} aria-hidden />
                            مشترک هستی
                          </span>
                        </Menu.Item>
                      ) : (
                        <Menu.Item asChild>
                          <Link href={plusHref} className={styles.plusCard}>
                            <span className={styles.menuIcon}><SarvaStar size={24} aria-hidden /></span>
                            <span className={styles.plusText}>
                              <b>{plusTitle}</b>
                              <small>همهٔ درس‌ها و بازی‌ها، بی‌محدودیت</small>
                            </span>
                            <NavBadge kind={navBadges?.plus} />
                          </Link>
                        </Menu.Item>
                      )
                    )}
                  </div>
                </Menu.Content>
              </Menu.Portal>
            </Menu.Root>
            <span className={styles.divider} aria-hidden />
          </>
        )}
        <AccountMenu />
        <div className={styles.theme}><PaletteButton /><DarkModeButton /></div>
      </div>
    </nav>
  );
}
