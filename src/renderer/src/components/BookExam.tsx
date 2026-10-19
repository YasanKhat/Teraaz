import { useEffect, useMemo, useState } from 'react'
import { Check, ChevronDown, Loader2, RotateCcw, X } from 'lucide-react'
import { cn, fas } from '../lib/utils'
import { loadExamBank, type BookBank as Bank } from '../lib/book'

let cached: Bank | null = null

export function useExamBank() {
  const [bank, setBank] = useState<Bank | null>(cached)
  useEffect(() => {
    if (cached) return
    let alive = true
    loadExamBank()
      .then((b) => {
        cached = b
        if (alive) setBank(b)
      })
      .catch(() => undefined)
    return () => {
      alive = false
    }
  }, [])
  return bank
}

export function BookExam({ lessonId }: { lessonId: number }) {
  const bank = useExamBank()
  const [picked, setPicked] = useState<Record<number, boolean>>({})
  const [open, setOpen] = useState<Record<number, boolean>>({})

  const tf = useMemo(() => bank?.tf.filter((x) => x.lesson === lessonId) ?? [], [bank, lessonId])
  const qa = useMemo(() => bank?.qa.filter((x) => x.lesson === lessonId) ?? [], [bank, lessonId])
  const done = Object.keys(picked).length
  const right = tf.reduce((n, x, i) => (picked[i] !== undefined && picked[i] === x.answer ? n + 1 : n), 0)

  useEffect(() => {
    setPicked({})
    setOpen({})
  }, [lessonId])

  if (!bank) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-[0.8rem] text-faint">
        <Loader2 size={15} className="animate-spin" /> در حال آوردن پرسش‌های کتاب…
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {tf.length > 0 && (
        <section>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <div className="kicker mb-1">درست یا نادرست</div>
              <h2 className="text-[1rem] font-black">پرسش‌های امتحانی کتاب</h2>
            </div>
            <div className="flex items-center gap-2 text-[0.62rem] text-faint">
              <span>
                {fas(done)} از {fas(tf.length)} پاسخ · {fas(right)} درست
              </span>
              {done > 0 && (
                <button className="flex items-center gap-1 text-gold hover:underline" onClick={() => setPicked({})}>
                  <RotateCcw size={10} /> از نو
                </button>
              )}
            </div>
          </div>

          <div className="divide-y divide-line rounded-xl border border-line">
            {tf.map((item, i) => {
              const given = picked[i]
              const revealed = given !== undefined
              const ok = given === item.answer
              return (
                <div key={i} className="flex flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center">
                  <p className="min-w-0 flex-1 text-[0.82rem] leading-7 text-ink/90">
                    <span className="me-1.5 text-[0.62rem] tabular-nums text-faint">{fas(i + 1)}.</span>
                    {item.text}
                  </p>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {[true, false].map((v) => {
                      const active = given === v
                      const isAnswer = revealed && item.answer === v
                      return (
                        <button
                          key={String(v)}
                          disabled={revealed}
                          onClick={() => setPicked((p) => ({ ...p, [i]: v }))}
                          className={cn(
                            'rounded-lg border px-2.5 py-1 text-[0.66rem] transition',
                            !revealed && 'border-line text-muted hover:border-gold/40 hover:text-gold',
                            revealed && isAnswer && 'border-turq/50 bg-turq/12 text-turq',
                            revealed && active && !ok && 'border-rose/50 bg-rose/10 text-rose',
                            revealed && !isAnswer && !active && 'border-line/60 text-faint opacity-60'
                          )}
                        >
                          {v ? 'درست' : 'نادرست'}
                        </button>
                      )
                    })}
                    {revealed && (
                      <span className={cn('grid size-5 place-items-center rounded-full', ok ? 'bg-turq/15 text-turq' : 'bg-rose/12 text-rose')}>
                        {ok ? <Check size={11} /> : <X size={11} />}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {qa.length > 0 && (
        <section>
          <div className="mb-3">
            <div className="kicker mb-1">پرسش و پاسخ تشریحی</div>
            <h2 className="text-[1rem] font-black">{fas(qa.length)} پرسش نمونهٔ کتاب، با پاسخ</h2>
          </div>
          <div className="space-y-2">
            {qa.map((item, i) => {
              const isOpen = !!open[i]
              return (
                <div key={i} className="overflow-hidden rounded-xl border border-line bg-surface/20">
                  <button className="flex w-full items-start gap-2 px-3.5 py-2.5 text-start" onClick={() => setOpen((o) => ({ ...o, [i]: !o[i] }))}>
                    <span className="mt-0.5 shrink-0 text-[0.62rem] tabular-nums text-gold/80">{fas(i + 1)}</span>
                    <span className="min-w-0 flex-1 text-[0.84rem] leading-7 text-ink/90">{item.q}</span>
                    <ChevronDown size={14} className={cn('mt-1 shrink-0 text-faint transition', isOpen && 'rotate-180')} />
                  </button>
                  {isOpen && (
                    <div className="border-t border-line/60 px-3.5 py-2.5 text-[0.78rem] leading-8 text-muted">
                      {item.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {tf.length === 0 && qa.length === 0 && (
        <p className="rounded-xl border border-line bg-surface/20 p-5 text-center text-[0.8rem] text-faint">
          برای این درس پرسش نمونه‌ای در کتاب ثبت نشده است.
        </p>
      )}
    </div>
  )
}
