import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { bookSummary, loadSummary, type BookSummary as Sum } from '../lib/book'
import { fas } from '../lib/utils'

export function BookSummaryView({ lessonId }: { lessonId: number }) {
  const [data, setData] = useState<Sum | null>(bookSummary(lessonId) ?? null)

  useEffect(() => {
    const ready = bookSummary(lessonId)
    if (ready) {
      setData(ready)
      return
    }
    let alive = true
    setData(null)
    loadSummary().then(() => alive && setData(bookSummary(lessonId) ?? null))
    return () => {
      alive = false
    }
  }, [lessonId])

  if (!data) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-[0.8rem] text-faint">
        <Loader2 size={15} className="animate-spin" /> در حال آوردن خلاصهٔ کتاب…
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center justify-between border-b border-line pb-2">
        <div className="kicker">خلاصهٔ نکات درس {fas(lessonId)} — از پایان کتاب</div>
        <span className="text-[0.58rem] text-faint">{fas(data.items.length)} بند</span>
      </div>
      <div className="space-y-1.5">
        {data.items.map((line, i) => {
          const isHead = !/^[۰-۹]/.test(line) && !/^(الف|ب|پ|ت|ث|ج)\)/.test(line) && line.length < 60 && (line.endsWith(':') || !line.includes(':')) && !line.includes('،')
          const numbered = /^[۰-۹]+\s*[-.)]/.test(line)
          if (isHead) {
            return (
              <h3 key={i} className={i === 0 ? 'pt-1 text-[0.98rem] font-black' : 'border-t border-line/60 pt-4 text-[0.98rem] font-black'}>
                {line}
              </h3>
            )
          }
          return (
            <p
              key={i}
              className={
                numbered
                  ? 'ps-1 text-[0.84rem] leading-8 text-muted'
                  : 'text-[0.84rem] leading-8 text-muted'
              }
            >
              {line}
            </p>
          )
        })}
      </div>
      <div className="mt-6 border-t border-line pt-2 text-[0.6rem] text-faint">پایان خلاصهٔ درس</div>
    </div>
  )
}
