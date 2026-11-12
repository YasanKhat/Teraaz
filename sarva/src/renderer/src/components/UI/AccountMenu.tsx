"use client";

import { Link } from "@/app/router";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "@/app/router";
import * as Menu from "@radix-ui/react-dropdown-menu";
import { BellRing, BookMarked, ChevronLeft, CreditCard, House, LogOut, Presentation, Settings, ShieldCheck, UserRound } from "lucide-react";
import { apiGet, apiPatch, apiPost } from "@/lib/api/client";
import { clearCurrentUser, refreshCurrentUser, useCurrentUser, usePlusSummary } from "@/lib/auth/use-current-user";
import { formatPhone } from "@/lib/auth/phone";
import { kindOf, NOTIFICATION_TONE } from "@/lib/plus/notification-kind";
import type { PlusNotification } from "@/lib/plus/types";
import SarvaStar from "./SarvaStar";
import UnreadBadge from "./UnreadBadge";
import styles from "./account-menu.module.css";

const fa = (n: number) => n.toLocaleString("fa-IR");

/** «۱۲ روز مانده» — فقط وقتی تاریخِ پایان داریم. */
function daysLeft(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - Date.now();
  return Number.isFinite(ms) ? Math.max(0, Math.ceil(ms / 86_400_000)) : null;
}

/** «۵ دقیقه پیش» — همان تابعِ بسته‌یِ زنده، با آستانه‌هایِ خودش. */
function since(createdAt: string): string {
  const minutes = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60_000);
  if (minutes < 1) return "همین الان";
  if (minutes < 60) return `${minutes.toLocaleString("fa-IR")} دقیقه پیش`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours.toLocaleString("fa-IR")} ساعت پیش`;
  const days = Math.floor(hours / 24);
  return days < 7
    ? `${days.toLocaleString("fa-IR")} روز پیش`
    : `${Math.floor(days / 7).toLocaleString("fa-IR")} هفته پیش`;
}

const INBOX_HREF = "/panel/home#notifications";

/**
 * سه اعلانِ نخوانده‌یِ بالایِ منو — تازه‌یِ بسته‌یِ ۱۲ نوامبر.
 *
 * ⚠️ واکشی فقط وقتی شمارنده غیرصفر است؛ در غیر این صورت هر باز شدنِ منو یک
 * درخواستِ بی‌فایده است. و ⚠️ کلیک هم «خوانده شدن» را می‌فرستد و هم شمارنده
 * را همان‌دم یکی کم می‌کند — تأخیرِ شبکه نباید عدد را دروغگو کند.
 */
function Notifications({ unread }: { unread: number }) {
  const [rows, setRows] = useState<PlusNotification[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (unread <= 0) return;
    let alive = true;
    apiGet<{ notifications: PlusNotification[] }>("/api/v1/notifications")
      .then((result) => {
        if (!alive) return;
        if (!result.ok) return void setFailed(true);
        setRows(result.data.notifications.filter((row) => !row.readAt).slice(0, 3));
      });
    return () => {
      alive = false;
    };
  }, [unread]);

  const [left, setLeft] = useState(unread);
  useEffect(() => setLeft(unread), [unread]);

  if (left <= 0) {
    return (
      <Menu.Item asChild>
        <Link href={INBOX_HREF} className={styles.inboxQuiet}>
          <BellRing size={16} strokeWidth={1.8} aria-hidden />
          <span>اعلان تازه‌ای نداری</span>
          <ChevronLeft size={15} aria-hidden className={styles.inboxChevron} />
        </Link>
      </Menu.Item>
    );
  }

  const markRead = (id: string) => {
    setLeft((n) => Math.max(0, n - 1));
    void apiPatch("/api/v1/notifications", { id }).then(refreshCurrentUser);
  };

  return (
    <section className={styles.inbox} aria-label="اعلان‌های تازه">
      <div className={styles.inboxHead}>
        <span>اعلان‌های تازه</span>
        <b>{left.toLocaleString("fa-IR")}</b>
      </div>
      {rows !== null || failed ? (
        <div className={styles.inboxList}>
          {(rows ?? []).map((row) => {
            // نوع‌هایی که سایت می‌شناسد و این‌جا هنوز در `PlusNotificationKind`
            // نیستند (مانند `admin_message`) از مسیرِ رشته می‌گذرند.
            const kind = row.kind as string;
            const { icon: Icon, tone } = kindOf(kind);
            return (
              <Menu.Item key={row.id} asChild>
                <Link
                  href={row.href ?? INBOX_HREF}
                  className={styles.inboxItem}
                  onClick={() => markRead(row.id)}
                >
                  <span className={`${styles.inboxIcon} ${NOTIFICATION_TONE[tone]}`} aria-hidden>
                    <Icon size={15} strokeWidth={1.9} />
                  </span>
                  <span className={styles.inboxText}>
                    {kind === "admin_message" && <small className={styles.inboxFrom}>از طرف سروا</small>}
                    <strong>{row.title}</strong>
                    <time dateTime={row.createdAt}>{since(row.createdAt)}</time>
                  </span>
                </Link>
              </Menu.Item>
            );
          })}
        </div>
      ) : (
        <div className={styles.inboxList} aria-busy="true">
          {Array.from({ length: Math.min(left, 3) }, (_, i) => (
            <span key={i} className={styles.inboxSkeleton} />
          ))}
        </div>
      )}
      <Menu.Item asChild>
        <Link href={INBOX_HREF} className={styles.inboxAll}>
          {left > (rows?.length ?? 0) && rows !== null ? `دیدن همه (${left.toLocaleString("fa-IR")})` : "دیدن همهٔ اعلان‌ها"}
          <ChevronLeft size={14} aria-hidden />
        </Link>
      </Menu.Item>
    </section>
  );
}

export function Avatar({ src, size }: { src: string | null; size: number }) {
  const [broken, setBroken] = useState(false);
  return (
    <span className={styles.face} style={{ width: size, height: size }}>
      {src && !broken ? (
        // eslint-disable-next-line @next/next/no-img-element -- آواتارِ آپلودی، اندازهٔ ثابتِ کوچک
        <img src={src} alt="" width={size} height={size} onError={() => setBroken(true)} />
      ) : (
        <UserRound size={Math.round(size * 0.48)} strokeWidth={1.8} aria-hidden />
      )}
    </span>
  );
}

/**
 * منوی حساب در هدرِ سایت: فقط تصویرِ کاربر، و با نگه داشتنِ ماوس یا کلیک یک
 * منوی شیشه‌ای باز می‌شود.
 *
 * ⚠️ باز شدن با hover فقط برای ماوس است. روی لمس، `pointerenter` پیش از کلیک
 * می‌آید و منو را باز و بلافاصله با همان کلیک می‌بست.
 */
export default function AccountMenu() {
  const { user, loading } = useCurrentUser();
  const { plus } = usePlusSummary();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  /** منو با hover باز شده؛ کلیکِ بعدی روی تصویر نباید ببندَدش. */
  const byHover = useRef(false);
  /** همین pointerdown از روی تصویر بود و باید «بیرون» حساب نشود. */
  const keep = useRef(false);

  useEffect(() => () => clearTimeout(timer.current), []);

  // تا پاسخِ `/me` نرسیده، نه «ورود» نه تصویر: کاربرِ واردشده یک لحظه دکمهٔ
  // ورود را می‌دید. جای خالی هم‌اندازهٔ دکمه است تا ردیف تکان نخورد.
  if (loading) return <span className={styles.placeholder} aria-hidden />;

  if (!user) {
    return (
      <Link href="/auth" className={styles.login}>
        ورود
      </Link>
    );
  }

  const isPlus = plus.state === "active";
  const unread = plus.unreadNotifications ?? 0;
  const left = isPlus ? daysLeft(plus.expiresAt) : null;
  const contact = user.email ?? formatPhone(user.phone);

  const hoverOpen = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setOpen((was) => {
        if (!was) byHover.current = true;
        return true;
      });
    }, 90);
  };
  const hoverClose = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(false), 220);
  };

  const logout = async () => {
    setLeaving(true);
    await apiPost("/api/v1/auth/logout");
    clearCurrentUser();
    router.push("/");
    router.refresh();
    /* ⚠️ import پویا: این منو در هدرِ *همهٔ* صفحه‌های سایت است و این تنها
       جایی بود که react-toastify را به باندلِ عمومی می‌کشید (~۲۴ کیلوبایتِ
       فشرده در هر بارگذاری) — برای پیامی که فقط هنگامِ خروج لازم است. */
    const { toast } = await import("react-toastify");
    toast.success("از حسابت خارج شدی", { className: "glass-toast" });
    setLeaving(false);
  };

  const items = [
    { href: "/panel/home", title: "پیشخوان", icon: House },
    { href: "/panel/bookmarks", title: "نشان‌شده‌ها", icon: BookMarked },
    { href: "/panel/subscription", title: "اشتراک و پرداخت", icon: CreditCard },
    ...(user.role === "teacher" ? [{ href: "/panel/teacher", title: "پنل دبیر", icon: Presentation }] : []),
    ...(user.role === "admin" ? [{ href: "/admin", title: "پنل مدیریت", icon: ShieldCheck }] : []),
    { href: "/panel/setting", title: "تنظیمات حساب", icon: Settings },
  ];

  return (
    <Menu.Root
      dir="rtl"
      modal={false}
      open={open}
      onOpenChange={(next) => {
        byHover.current = false;
        setOpen(next);
      }}
    >
      <Menu.Trigger
        className={styles.trigger}
        data-plus={isPlus || undefined}
        aria-label={`حساب کاربری ${user.fullName ?? ""}${unread > 0 ? ` — ${unread.toLocaleString("fa-IR")} اعلان تازه` : ""}`.replace(/\s+/g, " ").trim()}
        onPointerEnter={hoverOpen}
        onPointerLeave={hoverClose}
        onPointerDown={(e) => {
          // منویی که با hover باز شده، با کلیکِ بعدی بسته نشود؛ کلیکِ دوم می‌بندد.
          if (e.pointerType === "mouse" && open && byHover.current) {
            e.preventDefault();
            byHover.current = false;
            keep.current = true;
          }
        }}
      >
        <Avatar src={user.avatarUrl} size={36} />
        <UnreadBadge count={unread} className={styles.avatarBadge} />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Content
          className={`${styles.menu} glass-pop`}
          align="end"
          sideOffset={10}
          collisionPadding={12}
          loop
          onPointerEnter={hoverOpen}
          onPointerLeave={hoverClose}
          onPointerDownOutside={(e) => {
            if (keep.current) {
              e.preventDefault();
              keep.current = false;
            }
          }}
        >
          <div className={styles.head}>
            <Avatar src={user.avatarUrl} size={46} />
            <div className={styles.who}>
              <strong>{user.fullName || "کاربر سروا"}</strong>
              {contact && <span dir="ltr">{contact}</span>}
            </div>
          </div>

          <Notifications unread={unread} />

          {isPlus ? (
            <Menu.Item asChild>
              {/* ⚠️ «سروا پلاس» به صفحه‌یِ معرفیِ اشتراک می‌رود (`/plus`).
                  بسته‌یِ زنده‌یِ سایت برایِ مشترکِ فعال به `/panel/subscription`
                  می‌رود، ولی مقصدِ دلخواهِ شما همین صفحه‌یِ معرفی است و
                  همان مانده است. */}
              <Link href="/plus" className={styles.plus}>
                <SarvaStar size={17} aria-hidden />
                <span>سروا پلاس</span>
                {left !== null && <small>{left === 0 ? "امروز تمام می‌شود" : `${fa(left)} روز مانده`}</small>}
              </Link>
            </Menu.Item>
          ) : plus.state !== "off" ? (
            <Menu.Item asChild>
              <Link href="/plus" className={`${styles.plus} ${styles.plusOff}`}>
                <SarvaStar size={17} aria-hidden />
                <span>{plus.state === "expired" || plus.state === "revoked" ? "سروا پلاس" : "خرید سروا پلاس"}</span>
              </Link>
            </Menu.Item>
          ) : null}

          <div className={styles.list}>
            {items.map(({ href, title, icon: Icon }) => (
              <Menu.Item key={href} asChild>
                <Link href={href} className={styles.item}>
                  <Icon size={18} strokeWidth={1.7} aria-hidden />
                  {title}
                </Link>
              </Menu.Item>
            ))}
          </div>

          <Menu.Item className={styles.logout} disabled={leaving} onSelect={logout}>
            <LogOut size={17} strokeWidth={1.8} aria-hidden />
            {leaving ? "در حال خروج…" : "خروج از حساب"}
          </Menu.Item>
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  );
}
