/**
 * محتوای قابل‌ویرایشِ سایت — گرفته‌شده از پاسخِ واقعیِ `/api/v1/site-content`
 * در تاریخِ ‎۲۰۲۶-۱۱-۰۸.
 *
 * روی وب این متن‌ها در جدولِ `site_content` بودند و مدیر از پنل عوضشان
 * می‌کرد. در یک برنامهٔ تک‌نفره مدیر همان کسی است که برنامه را باز کرده، پس
 * اینجا به‌صورتِ یک بذر نشسته‌اند و کاربر می‌تواند در پایگاهِ محلی عوضشان کند.
 *
 * ⚠️ چرا این فایل مهم است: بدون یک مقدارِ پیش‌فرض، نوارِ اعلان اصلاً رندر
 * نمی‌شود — چون `useSiteContent` حالتِ «نیامده» و «نبود» را از هم جدا
 * نمی‌کند و هر دو یعنی «چیزی نشان نده». اولین چیزی که بازدیدکنندهٔ سایت
 * بالای صفحه می‌بیند همین نوار است.
 */

export type SiteAnnouncement = {
  id: string
  version: string
  title: string
  body: string
  tone: 'warning' | 'info' | 'success'
  linkUrl: string | null
  linkLabel: string | null
  dismissible: boolean
}

export type SiteSupporters = {
  enabled: boolean
  title: string
  subtitle: string | null
  ctaUrl: string | null
  ctaLabel: string | null
  items: { id: string; name: string; logoUrl: string | null; url: string | null }[]
}

export type SiteContentSeed = {
  announcement: SiteAnnouncement | null
  supporters: SiteSupporters
  navBadges: Record<string, string | number>
}

export const SITE_CONTENT_SEED: SiteContentSeed = {
  announcement: {
    id: 'sarvaclub-launch',
    version: 'sarvaclub-launch-1',
    title: 'سروا کلاب راه اندازی شد🔥',
    body: 'اگه سوال داری فقط کافیه تو سروا کلاب بپرسی تا هم دبیران فعال در سروا و هم دانش آموزان دیگر پاسخ بدهند💚',
    tone: 'success',
    linkUrl: '/sarvaclub',
    linkLabel: 'سروا کلاب',
    dismissible: true
  },
  supporters: {
    enabled: true,
    title: 'با سپاس از حامیان سروا',
    subtitle: null,
    ctaUrl: null,
    ctaLabel: null,
    items: []
  },
  navBadges: {}
}
