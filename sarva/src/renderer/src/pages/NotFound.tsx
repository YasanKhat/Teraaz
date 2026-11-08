import { Link } from '@/app/router'

/** همان صفحهٔ ۴۰۴ِ سایت، با همان لحن. */
export function NotFound() {
  return (
    <div
      dir="rtl"
      className="container flex min-h-[70vh] flex-col items-center justify-center gap-6 text-center"
    >
      <div className="text-7xl font-black text-gold">۴۰۴</div>
      <h1 className="text-2xl font-black text-foreground">این صفحه پیدا نشد</h1>
      <p className="max-w-md text-sm leading-7 text-muted-foreground">
        نشانی‌ای که دنبالش بودی اینجا نیست. شاید آدرس را اشتباه نوشته‌ای، یا این صفحه دیگر وجود
        ندارد.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground"
        >
          صفحهٔ اصلی
        </Link>
        <Link
          href="/doroos"
          className="rounded-full border border-border px-6 py-2.5 text-sm font-bold text-foreground"
        >
          درسنامه
        </Link>
      </div>
    </div>
  )
}

export default NotFound
