import { useRef, useState } from 'react'
import {
  Check,
  Download,
  Info,
  Keyboard,
  Moon,
  Palette,
  RotateCcw,
  Sun,
  Trash2,
  Upload,
  Type
} from 'lucide-react'
import { useProgress } from '../store/useProgress'
import { applyTheme } from '../components/Shell'
import { cn, daysUntil, fas, jalali } from '../lib/utils'
import { SectionHead } from '../components/ui'
import { lessons } from '../data/lessons'
import { timeline } from '../data/timeline'
import { figures } from '../data/figures'
import { cities, markers } from '../data/map'
import { exams } from '../data/exams'

const STORAGE_KEY = 'tabar-history-v1'

export function Settings() {
  const settings = useProgress((s) => s.settings)
  const setSetting = useProgress((s) => s.setSetting)
  const reset = useProgress((s) => s.reset)
  const importState = useProgress((s) => s.importState)
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)

  const exportData = () => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      setMsg({ ok: false, text: 'هنوز داده‌ای برای خروجی وجود ندارد.' })
      return
    }
    const blob = new Blob([raw], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tabar-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setMsg({ ok: true, text: 'پروندهٔ پشتیبان دانلود شد.' })
  }

  const onFile = async (file: File) => {
    const text = await file.text()
    const ok = importState(text)
    setMsg(ok ? { ok: true, text: 'داده‌ها با موفقیت بازیابی شد.' } : { ok: false, text: 'پرونده معتبر نیست.' })
  }

  return (
    <div>
      <SectionHead
        kicker="تنظیمات"
        title={<>تابار را <span className="gold-text">مال خودت</span> کن</>}
        desc="ظاهر، خوانایی، تاریخ امتحان و پشتیبان‌گیری. همهٔ داده‌ها فقط روی دستگاه خودت ذخیره می‌شوند."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="surface p-5">
          <div className="mb-4 flex items-center gap-2">
            <Palette size={16} className="text-gold" />
            <h3 className="text-sm font-bold">ظاهر</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'dark' as const, label: 'شبانه', desc: 'لاجوردی و طلایی', icon: Moon },
              { id: 'light' as const, label: 'روشن', desc: 'کاغذ و مرکب', icon: Sun }
            ].map((t) => {
              const Icon = t.icon
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setSetting('theme', t.id)
                    applyTheme(t.id)
                  }}
                  className={cn(
                    'rounded-xl border p-4 text-right transition',
                    settings.theme === t.id ? 'border-gold/50 bg-gold/8' : 'border-line bg-surface2/30 hover:border-gold/25'
                  )}
                >
                  <Icon size={18} className={settings.theme === t.id ? 'text-gold' : 'text-muted'} />
                  <div className="mt-2 text-[0.82rem] font-bold">{t.label}</div>
                  <div className="text-[0.62rem] text-faint">{t.desc}</div>
                  {settings.theme === t.id && <span className="mt-1 inline-flex items-center gap-1 text-[0.58rem] text-gold"><Check size={10} /> فعال</span>}
                </button>
              )
            })}
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-[0.75rem] font-semibold">
              <span className="flex items-center gap-1.5"><Type size={14} /> اندازهٔ متن</span>
              <span className="text-[0.65rem] text-faint">{fas(Math.round(settings.fontScale * 100))}٪</span>
            </div>
            <input
              type="range"
              min={0.85}
              max={1.25}
              step={0.05}
              value={settings.fontScale}
              onChange={(e) => setSetting('fontScale', Number(e.target.value))}
              className="w-full accent-[var(--c-gold)]"
            />
            <div className="mt-1 flex justify-between text-[0.55rem] text-faint"><span>فشرده</span><span>بزرگ‌تر</span></div>
          </div>

          <button
            onClick={() => setSetting('motion', !settings.motion)}
            className="mt-5 flex w-full items-center justify-between rounded-xl border border-line bg-surface2/30 px-4 py-3"
          >
            <div className="text-right">
              <div className="text-[0.8rem] font-semibold">انیمیشن‌ها</div>
              <div className="text-[0.62rem] text-faint">اگر دستگاهت کند است یا حرکت کمتر می‌خواهی، خاموشش کن.</div>
            </div>
            <span className={cn('relative h-6 w-11 shrink-0 rounded-full transition', settings.motion ? 'bg-gold' : 'bg-line')}>
              <span className={cn('absolute top-1 size-4 rounded-full bg-bg transition-all', settings.motion ? 'right-1' : 'right-6')} />
            </span>
          </button>
        </section>

        <section className="surface p-5">
          <div className="mb-4 flex items-center gap-2">
            <Check size={16} className="text-gold" />
            <h3 className="text-sm font-bold">امتحان</h3>
          </div>
          <label className="mb-4 block">
            <div className="mb-1.5 text-[0.72rem] text-muted">عنوان امتحان</div>
            <input
              value={settings.examTitle}
              onChange={(e) => setSetting('examTitle', e.target.value)}
              className="w-full rounded-xl border border-line bg-surface2/40 px-3 py-2.5 text-[0.82rem] outline-none focus:border-gold/40"
            />
          </label>
          <label className="block">
            <div className="mb-1.5 text-[0.72rem] text-muted">تاریخ امتحان</div>
            <input
              type="date"
              value={settings.examDate}
              onChange={(e) => setSetting('examDate', e.target.value)}
              dir="ltr"
              className="w-full rounded-xl border border-line bg-surface2/40 px-3 py-2.5 text-left text-[0.82rem] tabular-nums outline-none focus:border-gold/40 [color-scheme:dark] [direction:ltr]"
            />
            <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-[0.6rem] text-faint">
              <span>تاریخ میلادی · نمایش در برنامه به شمسی است</span>
              <div className="flex items-center gap-1.5">
                <button className="rounded-md border border-line px-2 py-0.5 hover:border-gold/40 hover:text-gold" onClick={() => setSetting('examDate', new Date().toISOString().slice(0, 10))}>امروز</button>
                <button className="rounded-md border border-line px-2 py-0.5 hover:border-gold/40 hover:text-gold" onClick={() => setSetting('examDate', new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10))}>یک هفته بعد</button>
              </div>
            </div>
          </label>
          <div className="mt-3 rounded-xl border border-gold/25 bg-gold/8 p-3 text-[0.72rem] leading-6 text-muted">
            <span className="font-bold text-gold">{fas(daysUntil(settings.examDate))} روز</span> تا {settings.examTitle}
            <span className="mx-1 text-faint">·</span>
            {jalali(new Date(settings.examDate + 'T00:00:00'))}
          </div>

          <div className="mt-5 border-t border-line pt-4">
            <div className="mb-2 text-[0.78rem] font-semibold">پشتیبان‌گیری</div>
            <p className="mb-3 text-[0.65rem] leading-6 text-faint">
              پیشرفت، یادداشت‌ها و کارت‌ها در همین مرورگر ذخیره می‌شوند. برای انتقال به دستگاهی دیگر، پروندهٔ پشتیبان بگیر.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button className="btn btn-sm" onClick={exportData}><Download size={13} /> خروجی</button>
              <button className="btn btn-sm" onClick={() => fileRef.current?.click()}><Upload size={13} /> بازیابی</button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void onFile(f)
                e.target.value = ''
              }}
            />
            {msg && <div className={cn('mt-2 text-[0.65rem]', msg.ok ? 'text-turq' : 'text-rose')}>{msg.text}</div>}
          </div>
        </section>

        <section className="surface p-5">
          <div className="mb-3 flex items-center gap-2">
            <Keyboard size={16} className="text-gold" />
            <h3 className="text-sm font-bold">کلیدهای میان‌بر</h3>
          </div>
          <div className="space-y-1.5">
            {[
              ['Ctrl / ⌘ + K', 'جست‌وجوی سریع در همهٔ محتوا'],
              ['Space', 'برگرداندن کارت مرور'],
              ['۱ تا ۴', 'انتخاب گزینه در آزمون'],
              ['Enter', 'سؤال بعدی'],
              ['Esc', 'بستن پنجره‌ها']
            ].map(([k, d]) => (
              <div key={k} className="flex items-center justify-between rounded-lg border border-line bg-surface2/30 px-3 py-2">
                <span className="text-[0.68rem] text-muted">{d}</span>
                <kbd className="rounded border border-line bg-bg/60 px-1.5 py-0.5 font-mono text-[0.6rem] text-faint" dir="ltr">{k}</kbd>
              </div>
            ))}
          </div>
        </section>

        <section className="surface p-5">
          <div className="mb-3 flex items-center gap-2">
            <Info size={16} className="text-gold" />
            <h3 className="text-sm font-bold">دربارهٔ تبار</h3>
          </div>
          <p className="text-[0.72rem] leading-7 text-muted">
            تبار یک همراهِ مطالعهٔ کامل برای کتاب <span className="font-semibold text-ink">تاریخ ۲ — پایهٔ یازدهم، رشتهٔ انسانی</span> است. همهٔ محتوا بر پایهٔ متن کتاب درسی و پرسش‌های امتحان نهایی تدوین شده و برنامه کاملاً آفلاین کار می‌کند.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-1.5 text-center sm:grid-cols-3">
            {[
              ['درس', lessons.length],
              ['رویداد', timeline.length],
              ['چهره', figures.length],
              ['شهر', cities.length],
              ['نشان', markers.length],
              ['آزمون', exams.length]
            ].map(([label, n]) => (
              <div key={String(label)} className="rounded-lg border border-line bg-surface2/25 py-2">
                <div className="text-sm font-bold text-gold">{fas(Number(n))}</div>
                <div className="text-[0.55rem] text-faint">{label}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-lg border border-rose/25 bg-rose/5 p-3">
            <div className="mb-1.5 flex items-center gap-1.5 text-[0.72rem] font-bold text-rose"><Trash2 size={12} /> پاک‌کردن همهٔ داده‌ها</div>
            <p className="mb-2 text-[0.62rem] leading-5 text-faint">این کار پیشرفت، یادداشت‌ها و نشان‌ها را برای همیشه پاک می‌کند.</p>
            {confirmReset ? (
              <div className="flex gap-2">
                <button
                  className="btn btn-sm flex-1 border-rose/50 text-rose"
                  onClick={() => {
                    reset()
                    setConfirmReset(false)
                    setMsg({ ok: true, text: 'همهٔ داده‌ها پاک شد.' })
                  }}
                >
                  <Trash2 size={12} /> بله، پاک کن
                </button>
                <button className="btn btn-sm flex-1" onClick={() => setConfirmReset(false)}>انصراف</button>
              </div>
            ) : (
              <button className="btn btn-sm w-full" onClick={() => setConfirmReset(true)}>
                <RotateCcw size={12} /> شروع از نو
              </button>
            )}
          </div>
        </section>
      </div>

      <div className="mt-6 text-center text-[0.62rem] leading-6 text-faint">
        ساخته‌شده برای دانش‌آموزان تاریخ ۲ · نسخهٔ ۲٫۰ · همهٔ محتوا محلی است
      </div>
    </div>
  )
}
