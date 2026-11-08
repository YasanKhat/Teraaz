import { useMemo, useState } from 'react'
import * as db from '@/platform/db'
import { routeTable } from '@/platform/server'
import { examSummaries } from '@/platform/exams'
import { quizBank } from '@/platform/quiz-bank'
import { GRADES } from '@/lib/doroos'
import { useCurrentUser } from '@/lib/auth/use-current-user'
import { navigate } from '@/app/router'

/**
 * پنلِ مدیریت — بازطراحی‌شده برای یک برنامهٔ تک‌نفره.
 *
 * اصلِ همان پنل حفظ شده: دیدنِ آنچه در سیستم هست، مدیریتِ محتوا و داده.
 * آنچه عوض شده: به‌جای ۳۴ جدولِ Postgres و سیاست‌های دسترسی، یک نمایِ ساده
 * از داده‌ی محلیِ همین دستگاه — چون مدیرِ این نسخه خودِ کاربر است.
 *
 * سه ابزارِ اصلی:
 *   • **نمای داده** — هر جدول و تعداد ردیف‌هایش، تا بدانی چه چیزی ذخیره شده.
 *   • **پشتیبان** — خروجیِ یک فایل JSON و بازیابی‌اش.
 *   • **مسیرها** — فهرستِ endpointهایی که لایهٔ محلی پاسخ می‌دهد.
 */
export default function Admin() {
  const { user } = useCurrentUser()
  const [tick, setTick] = useState(0)

  const tables = useMemo(() => {
    void tick
    return db
      .tableNames()
      .map((name) => ({ name, rows: db.count(name) }))
      .sort((a, b) => b.rows - a.rows)
  }, [tick])

  const routes = useMemo(() => routeTable(), [])
  const exams = useMemo(() => examSummaries(), [])
  const questions = useMemo(() => quizBank().length, [])
  const lessons = useMemo(
    () => GRADES.map((g) => ({ label: g.label, ready: g.lessons.filter((l) => l.ready).length })),
    []
  )

  function exportBackup() {
    const payload = JSON.stringify(
      { version: 1, exportedAt: new Date().toISOString(), data: db.dump() },
      null,
      2
    )
    const blob = new Blob([payload], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sarva-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function importBackup(file: File) {
    void file.text().then((text) => {
      try {
        const parsed = JSON.parse(text) as { data?: Record<string, unknown[]> }
        if (!parsed.data) throw new Error('فایلِ پشتیبان معتبر نیست.')
        db.restore(parsed.data as never)
        setTick((t) => t + 1)
      } catch {
        setTick((t) => t + 1)
      }
    })
  }

  const card = 'rounded-2xl border border-border bg-card/70 p-5'

  return (
    <div dir="rtl" className="container py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-black text-foreground">مدیریتِ سروا</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {user ? `مدیر: ${user.fullName ?? user.email ?? '—'}` : 'وارد نشده‌اید — فقط داده‌ی محلی را می‌بینید.'}
        </p>
      </header>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className={card}>
          <div className="text-xs text-muted-foreground">درس‌های آماده</div>
          <div className="mt-1 text-2xl font-black text-foreground">
            {lessons.reduce((n, l) => n + l.ready, 0)}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            {lessons.map((l) => `${l.label}: ${l.ready}`).join(' · ')}
          </div>
        </div>
        <div className={card}>
          <div className="text-xs text-muted-foreground">پرسش‌های عروض سماعی</div>
          <div className="mt-1 text-2xl font-black text-foreground">{questions}</div>
        </div>
        <div className={card}>
          <div className="text-xs text-muted-foreground">امتحان‌های نهایی</div>
          <div className="mt-1 text-2xl font-black text-foreground">{exams.length}</div>
        </div>
        <div className={card}>
          <div className="text-xs text-muted-foreground">مسیرهای پاسخ‌گو</div>
          <div className="mt-1 text-2xl font-black text-foreground">{routes.length}</div>
        </div>
      </div>

      <section className="mb-8 grid gap-4 lg:grid-cols-2">
        <div className={card}>
          <h2 className="mb-3 text-lg font-bold text-foreground">پشتیبان و بازیابی</h2>
          <p className="mb-4 text-xs leading-6 text-muted-foreground">
            همهٔ پیشرفت، نشان‌شده‌ها و کارنامه‌ها در یک فایل JSON می‌آیند. این فایل تنها چیزی است که
            برای جابه‌جایی بین دو دستگاه لازم داری.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={exportBackup}
              className="rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground"
            >
              دریافتِ پشتیبان
            </button>
            <label className="cursor-pointer rounded-full border border-border px-5 py-2 text-sm font-bold text-foreground">
              بازیابی
              <input
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) importBackup(f)
                }}
              />
            </label>
            <button
              onClick={() => {
                db.reset(['users'])
                setTick((t) => t + 1)
              }}
              className="rounded-full border border-destructive/40 px-5 py-2 text-sm font-bold text-destructive"
            >
              پاک‌سازیِ داده‌ی تمرین
            </button>
          </div>
        </div>

        <div className={card}>
          <h2 className="mb-3 text-lg font-bold text-foreground">دسترسیِ سریع</h2>
          <div className="flex flex-wrap gap-2">
            {[
              ['وزن‌یاب', '/vazn-yab'],
              ['درسنامه', '/doroos'],
              ['بازی‌ها', '/game'],
              ['امتحان نهایی', '/exam'],
              ['پنلِ من', '/panel']
            ].map(([label, href]) => (
              <button
                key={href}
                onClick={() => navigate(href)}
                className="rounded-full border border-border px-4 py-1.5 text-xs font-bold text-foreground"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-bold text-foreground">داده‌ی ذخیره‌شده</h2>
        {tables.length === 0 ? (
          <p className={card + ' text-sm text-muted-foreground'}>
            هنوز چیزی ذخیره نشده است. اولین تمرین یا آزمون که ثبت شود، جدولش اینجا پیدا می‌شود.
          </p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 text-right">
                <tr>
                  <th className="px-4 py-2 font-bold">جدول</th>
                  <th className="px-4 py-2 font-bold">ردیف‌ها</th>
                </tr>
              </thead>
              <tbody>
                {tables.map((t) => (
                  <tr key={t.name} className="border-t border-border">
                    <td className="px-4 py-2 font-mono text-xs" dir="ltr">
                      {t.name}
                    </td>
                    <td className="px-4 py-2">{t.rows}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold text-foreground">مسیرهای لایهٔ محلی</h2>
        <div className="flex flex-wrap gap-2">
          {routes.map((r) => (
            <code
              key={r}
              className="rounded-lg bg-secondary/60 px-2 py-1 text-[11px] text-muted-foreground"
              dir="ltr"
            >
              {r}
            </code>
          ))}
        </div>
      </section>
    </div>
  )
}
