import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Clock3, Eye, EyeOff, FileText, Loader2, Printer } from 'lucide-react'
import { loadPapers, paperById, type Paper } from '../lib/book'
import { navigate } from '../lib/router'
import { fas } from '../lib/utils'
import { papersMeta } from '../data/papersMeta'

const sectionRe = /^[۰-۹]+\.\s/
const subRe = /^(الف|ب|پ|ت|ث|ج|ح|خ|د|ذ|ر|ز|س|ش|ص|ض|ط|ظ|ع|غ|ف|ق|ک|گ|ل|م|ن|و|ه|ی)\)/
const itemRe = /^[۰-۹]+\s*[-.)]\s*/

function QuestionLine({ text }: { text: string }) {
  if (sectionRe.test(text) && text.length < 90) {
    return (
      <div className="mt-5 flex items-center gap-2 border-b border-line/70 pb-1.5 first:mt-0">
        <span className="grid size-5 place-items-center rounded-md bg-gold/15 text-[0.6rem] font-black text-gold">
          {text.slice(0, text.indexOf('.'))}
        </span>
        <span className="text-[0.86rem] font-black text-ink">{text.slice(text.indexOf('.') + 1).trim()}</span>
      </div>
    )
  }
  if (subRe.test(text)) {
    return <p className="mt-3 text-[0.8rem] font-bold text-ink/85">{text}</p>
  }
  if (itemRe.test(text)) {
    const n = text.match(/^[۰-۹]+/)![0]
    return (
      <div className="flex gap-2 py-[3px] text-[0.8rem] leading-7 text-muted">
        <span className="mt-0.5 w-5 shrink-0 text-left text-[0.7rem] tabular-nums text-faint">{n}</span>
        <span>{text.replace(itemRe, '')}</span>
      </div>
    )
  }
  return <p className="py-[3px] ps-7 text-[0.8rem] leading-7 text-muted">{text}</p>
}

export function PaperPage({ id }: { id?: string }) {
  const [ready, setReady] = useState(false)
  const paper = paperById(id) ?? null
  const [showKeys, setShowKeys] = useState(false)

  useEffect(() => {
    let alive = true
    setReady(false)
    loadPapers().then(() => alive && setReady(true))
    return () => {
      alive = false
    }
  }, [id])

  useEffect(() => setShowKeys(false), [id])

  const [data, setData] = useState<Paper | null>(paper)
  useEffect(() => {
    setData(paperById(id) ?? null)
  }, [id, ready])

  const meta = useMemo(() => papersMeta.find((p) => p.id === id), [id])

  if (!data) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-[0.8rem] text-faint">
        <Loader2 size={15} className="animate-spin" /> در حال باز کردن برگهٔ امتحان…
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="no-print mb-4 flex flex-wrap items-center gap-2">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('exams')}>
          <ArrowRight size={14} /> همهٔ آزمون‌ها
        </button>
        <button className="btn btn-sm" onClick={() => window.print()}>
          <Printer size={13} /> چاپ برگه
        </button>
        <button
          className={showKeys ? 'btn btn-sm btn-ghost border-turq/40 text-turq' : 'btn btn-sm'}
          onClick={() => setShowKeys((v) => !v)}
        >
          {showKeys ? <EyeOff size={13} /> : <Eye size={13} />}
          {showKeys ? 'پنهان کردن پاسخنامه' : 'دیدن پاسخنامهٔ رسمی'}
        </button>
      </div>

      <article className="surface relative overflow-hidden p-6 sm:p-8">
        <span className="pointer-events-none absolute -left-3 -top-8 select-none font-display text-[9rem] font-black text-gold/[0.05]">
          {fas(data.num)}
        </span>
        <header className="relative border-b border-line pb-4">
          <div className="kicker mb-1 flex items-center gap-1.5">
            <FileText size={12} /> برگهٔ رسمی کتاب · {data.term}
          </div>
          <h1 className="font-display text-xl font-black leading-snug sm:text-2xl">{data.title}</h1>
          <div className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line text-[0.62rem] sm:grid-cols-4">
            <div className="bg-surface2/60 px-2.5 py-2">
              <div className="text-faint">رشته</div>
              <div className="mt-0.5 font-bold text-ink">ادبیات و علوم انسانی</div>
            </div>
            <div className="bg-surface2/60 px-2.5 py-2">
              <div className="text-faint">درس</div>
              <div className="mt-0.5 font-bold text-ink">تاریخ {fas(2)}</div>
            </div>
            <div className="bg-surface2/60 px-2.5 py-2">
              <div className="text-faint">مدت</div>
              <div className="mt-0.5 flex items-center gap-1 font-bold text-ink">
                <Clock3 size={11} /> {fas(data.minutes || 90)} دقیقه
              </div>
            </div>
            <div className="bg-surface2/60 px-2.5 py-2">
              <div className="text-faint">نمره</div>
              <div className="mt-0.5 font-bold text-gold">{fas(20)}</div>
            </div>
          </div>
        </header>

        <div className="relative mt-4">
          {data.questions.map((q, i) => (
            <QuestionLine key={i} text={q} />
          ))}
          <div className="mt-6 flex items-center justify-between border-t border-line pt-2 text-[0.62rem] text-faint">
            <span>پایان سؤال‌ها · موفق باشی</span>
            <span>جمع نمرات: {fas(20)}</span>
          </div>
        </div>

        {showKeys && (
          <section className="mt-7 rounded-xl border border-turq/25 bg-turq/[0.04] p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="kicker text-turq">پاسخنامهٔ تشریحی</div>
              <span className="text-[0.58rem] text-faint">{fas(data.answers.length)} بند</span>
            </div>
            <div className="space-y-1">
              {data.answers.map((a, i) =>
                a.n ? (
                  <div key={i} className="flex gap-2 text-[0.78rem] leading-7">
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded bg-turq/12 text-[0.6rem] font-bold text-turq">
                      {a.n}
                    </span>
                    <span className="text-ink/85">{a.text}</span>
                  </div>
                ) : (
                  <div key={i} className="pt-3 text-[0.72rem] font-bold text-ink/70">
                    {a.text}
                  </div>
                )
              )}
            </div>
          </section>
        )}
      </article>

      <div className="no-print mt-3 flex items-center justify-between text-[0.62rem] text-faint">
        <span>
          {meta ? `${fas(meta.count)} سطر سؤال · ${fas(data.answers.length)} پاسخ` : ''}
        </span>
        <button className="flex items-center gap-1 hover:text-gold" onClick={() => navigate(`exams`)}>
          بازگشت <ArrowLeft size={12} />
        </button>
      </div>
    </div>
  )
}
