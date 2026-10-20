import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronLeft,
  CircleHelp,
  Eye,
  ListChecks,
  RotateCcw,
  Search,
  Shuffle,
  Sparkles,
  X
} from 'lucide-react'
import { bankItems, bankCounts, kindLabel, type BankItem, type BankKind } from '../data/bank'
import { lessonById } from '../data/lessons'
import { useProgress } from '../store/useProgress'
import { navigate } from '../lib/router'
import { cn, fas, normalizeFa } from '../lib/utils'

const KINDS: { id: BankKind | 'all'; label: string }[] = [
  { id: 'all', label: 'همه' },
  { id: 'tf', label: 'درست / نادرست' },
  { id: 'mcq', label: 'چهارگزینه‌ای' },
  { id: 'term', label: 'تعریف اصطلاح' },
  { id: 'short', label: 'پاسخ کوتاه' }
]

const KIND_TONE: Record<BankKind, string> = {
  tf: 'text-sky-300 border-sky-400/30 bg-sky-400/10',
  mcq: 'text-gold border-gold/30 bg-gold/10',
  term: 'text-violet-300 border-violet-400/30 bg-violet-400/10',
  short: 'text-emerald-300 border-emerald-400/30 bg-emerald-400/10'
}

function shuffleList<T>(arr: T[]): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/** کارت یک سؤال؛ پاسخ تشریحی دارد، گزینه‌دار هم می‌تواند باشد */
function QuestionCard({
  item,
  open,
  onOpen,
  chosen,
  onChoose,
  index
}: {
  item: BankItem
  open: boolean
  onOpen: () => void
  chosen?: number
  onChoose: (index: number | null) => void
  index: number
}) {
  const answerBank = useProgress((s) => s.answerBank)
  const saved = useProgress((s) => s.bank[item.id])
  const lesson = lessonById(item.lesson)
  const interactive = item.kind === 'tf' || item.kind === 'mcq'
  const correct = interactive && chosen === item.correct
  const revealed = !interactive && open

  const choose = (i: number) => {
    if (chosen !== undefined) return
    onChoose(i)
    answerBank(item.id, i === item.correct)
  }

  const reveal = () => {
    if (open) return
    onOpen()
    answerBank(item.id, true)
  }

  return (
    <article className="bank-card" data-done={saved !== undefined ? saved : undefined}>
      <header className="mb-2 flex flex-wrap items-center gap-1.5">
        <span className="text-[0.58rem] tabular-nums text-faint">{fas(index)}</span>
        <span className={cn('tag border', KIND_TONE[item.kind])}>{kindLabel(item.kind)}</span>
        <button
          className="tag hover:text-gold"
          onClick={() => navigate(`lesson/${item.lesson}`)}
          title={lesson?.title}
        >
          درس {fas(item.lesson)}
        </button>
        {saved === 1 && <Check size={13} className="ms-auto text-emerald-400" />}
        {saved === 0 && <X size={13} className="ms-auto text-rose" />}
      </header>

      <p className="bank-q">{item.q}</p>

      {interactive && (
        <div className="mt-2.5 grid gap-1.5 sm:grid-cols-2">
          {item.options?.map((opt, i) => {
            const isChosen = chosen === i
            const isRight = chosen !== undefined && i === item.correct
            return (
              <button
                key={i}
                onClick={() => choose(i)}
                disabled={chosen !== undefined}
                className={cn(
                  'bank-opt',
                  isRight && 'bank-opt--right',
                  isChosen && !isRight && 'bank-opt--wrong'
                )}
              >
                <span className="bank-opt__n">{fas(i + 1)}</span>
                <span className="flex-1 text-start">{opt}</span>
              </button>
            )
          })}
        </div>
      )}

      {interactive && chosen !== undefined && (
        <div className={cn('bank-note mt-2', correct ? 'bank-note--ok' : 'bank-note--bad')}>
          <b>{correct ? 'درست است.' : `پاسخ درست: گزینهٔ ${fas((item.correct ?? 0) + 1)}`}</b>
          {item.note && <span className="ms-1 text-muted">{item.note}</span>}
        </div>
      )}

      {!interactive && (
        <>
          {!revealed ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              <button className="btn btn-ghost btn-sm" onClick={reveal}>
                <Eye size={13} /> نمایش پاسخ
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => { onOpen(); answerBank(item.id, false) }}>
                <CircleHelp size={13} /> نمی‌دانم
              </button>
            </div>
          ) : (
            <div className="bank-answer mt-2">
              <div className="mb-1 flex items-center gap-1 text-[0.62rem] font-bold text-gold">
                <Sparkles size={11} /> پاسخ
              </div>
              <p>{item.answer}</p>
              <div className="mt-2 flex gap-1.5">
                <button className="btn btn-ghost btn-sm" onClick={() => answerBank(item.id, true)}>
                  <Check size={12} /> می‌دانستم
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => answerBank(item.id, false)}>
                  <RotateCcw size={12} /> مرور لازم است
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </article>
  )
}

export function Bank({ id }: { id?: string }) {
  const initialLesson = id ? Number(id) : 0
  const [lesson, setLesson] = useState<number>(Number.isFinite(initialLesson) ? initialLesson : 0)
  const [kind, setKind] = useState<BankKind | 'all'>('all')
  const [query, setQuery] = useState('')
  const [session, setSession] = useState(false)
  const [sessionOrder, setSessionOrder] = useState<BankItem[]>([])
  const [step, setStep] = useState(0)
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({})
  const [chosen, setChosen] = useState<Record<string, number>>({})
  const bank = useProgress((s) => s.bank)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (id) setLesson(Number(id))
  }, [id])

  const pool = useMemo(() => {
    const q = normalizeFa(query.trim())
    return bankItems.filter((item) => {
      if (lesson && item.lesson !== lesson) return false
      if (kind !== 'all' && item.kind !== kind) return false
      if (!q) return true
      return normalizeFa(item.q + ' ' + item.answer + ' ' + (item.options?.join(' ') ?? '')).includes(q)
    })
  }, [lesson, kind, query])

  const answered = useMemo(() => pool.filter((i) => bank[i.id] !== undefined).length, [pool, bank])
  const correct = useMemo(() => pool.filter((i) => bank[i.id] === 1).length, [pool, bank])
  const totalAnswered = Object.keys(bank).length
  const totalCorrect = Object.values(bank).filter((v) => v === 1).length

  const startSession = useCallback((shuffle = false) => {
    if (!pool.length) return
    setSessionOrder(shuffle ? shuffleList(pool) : pool)
    setStep(0)
    setSession(true)
  }, [pool])

  const go = useCallback((delta: number) => {
    setStep((s) => Math.min(sessionOrder.length - 1, Math.max(0, s + delta)))
  }, [sessionOrder.length])

  useEffect(() => {
    if (!session) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setSession(false); return }
      if (e.key === 'ArrowLeft') go(1)
      if (e.key === 'ArrowRight') go(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [session, go])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 })
  }, [step, session])

  const current = sessionOrder[step]
  const progress = sessionOrder.length ? ((step + 1) / sessionOrder.length) * 100 : 0

  return (
    <div className="space-y-4">
      <header>
        <div className="kicker mb-1.5">بانک سؤال</div>
        <h1 className="text-2xl font-black md:text-[1.9rem]">
          هر چه از این درس <span className="gold-text">پرسیده می‌شود</span>
        </h1>
        <p className="mt-1.5 max-w-3xl text-[0.84rem] leading-8 text-muted">
          {fas(bankCounts.total)} سؤال، دسته‌بندی‌شده بر پایهٔ کتاب درسی و ضمیمهٔ «درست / نادرست»: عبارت‌های درست و نادرستِ
          هر درس، چهارگزینه‌ای‌ها، تعریف اصطلاح‌ها و پرسش‌های تشریحی — با پاسخ. هر جا خواستی درس را مرور کنی، از همین‌جا
          شروع کن و همهٔ سؤال‌های درس را یکی‌یکی جواب بده.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { label: 'درست / نادرست', value: bankCounts.perKind.tf },
          { label: 'چهارگزینه‌ای', value: bankCounts.perKind.mcq },
          { label: 'تعریف اصطلاح', value: bankCounts.perKind.term },
          { label: 'پاسخ کوتاه', value: bankCounts.perKind.short }
        ].map((s) => (
          <div key={s.label} className="panel px-3.5 py-2.5">
            <div className="text-[0.62rem] text-faint">{s.label}</div>
            <div className="mt-0.5 text-lg font-black tabular-nums text-gold">{fas(s.value)}</div>
          </div>
        ))}
      </div>

      <div className="panel flex flex-wrap items-center gap-2 px-3.5 py-3">
        <div className="flex items-center gap-1.5 text-[0.72rem] text-muted">
          <ListChecks size={14} className="text-gold" />
          از {fas(pool.length)} سؤال، {fas(answered)} را جواب داده‌ای
          <span className="text-emerald-400">({fas(correct)} درست)</span>
        </div>
        <div className="ms-auto flex flex-wrap gap-1.5">
          <button className="btn btn-ghost btn-sm" onClick={() => startSession(false)}>
            <BookOpen size={13} /> مرور کامل
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => startSession(true)}>
            <Shuffle size={13} /> مرور تصادفی
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1">
          <button className="chip" data-active={lesson === 0} onClick={() => setLesson(0)}>
            همهٔ درس‌ها
          </button>
          {Array.from({ length: 16 }, (_, i) => i + 1).map((l) => (
            <button key={l} className="chip" data-active={lesson === l} onClick={() => setLesson(l)}>
              درس {fas(l)}
              <span className="text-[0.55rem] text-faint">{fas(bankCounts.perLesson[l] ?? 0)}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {KINDS.map((k) => (
            <button key={k.id} className="chip" data-active={kind === k.id} onClick={() => setKind(k.id)}>
              {k.label}
            </button>
          ))}
          <label className="ms-auto flex min-w-[11rem] flex-1 items-center gap-1.5 rounded-xl border border-line bg-surface/50 px-2.5 py-1.5 sm:flex-none">
            <Search size={13} className="text-faint" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="جست‌وجو در سؤال‌ها…"
              className="w-full bg-transparent text-[0.74rem] outline-none placeholder:text-faint"
              aria-label="جست‌وجو در بانک سؤال"
            />
          </label>
        </div>
      </div>

      {lesson > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-gold/20 bg-gold/[0.04] px-3 py-2 text-[0.72rem] text-muted">
          <span>
            درس {fas(lesson)}: <b className="text-ink">{lessonById(lesson)?.title}</b>
          </span>
          <button className="chip ms-auto" onClick={() => navigate(`lesson/${lesson}`)}>
            <ChevronLeft size={12} /> رفتن به فیلم درس
          </button>
        </div>
      )}

      {!session && (
        <div className="space-y-2.5">
          {pool.length === 0 && (
            <div className="panel px-4 py-8 text-center text-[0.82rem] text-muted">
              سؤالی با این فیلترها پیدا نشد. فیلترها را ساده‌تر کن.
            </div>
          )}
          {pool.slice(0, 120).map((item, i) => (
            <QuestionCard
              key={item.id}
              item={item}
              index={i + 1}
              open={!!openIds[item.id]}
              onOpen={() => setOpenIds((s) => ({ ...s, [item.id]: true }))}
              chosen={chosen[item.id]}
              onChoose={(v) => setChosen((s) => (v === null ? s : { ...s, [item.id]: v }))}
            />
          ))}
          {pool.length > 120 && (
            <p className="pt-1 text-center text-[0.7rem] text-faint">
              {fas(pool.length - 120)} سؤال دیگر هم هست؛ با انتخاب درس یا نوع سؤال، دقیق‌تر ببین.
            </p>
          )}
        </div>
      )}

      {session && current && (
        <div className="space-y-3">
          <div className="panel flex items-center gap-3 px-3.5 py-2.5">
            <span className="text-[0.7rem] tabular-nums text-muted">
              {fas(step + 1)} از {fas(sessionOrder.length)}
            </span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
              <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${progress}%` }} />
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setSession(false)}>
              <X size={13} /> پایان مرور
            </button>
          </div>

          <div ref={scrollRef}>
            <QuestionCard
              item={current}
              index={step + 1}
              open={!!openIds[current.id]}
              onOpen={() => setOpenIds((s) => ({ ...s, [current.id]: true }))}
              chosen={chosen[current.id]}
              onChoose={(v) => setChosen((s) => (v === null ? s : { ...s, [current.id]: v }))}
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            <button className="btn btn-ghost" onClick={() => go(1)} disabled={step >= sessionOrder.length - 1}>
              <ArrowLeft size={15} /> سؤال بعد
            </button>
            <span className="text-[0.62rem] text-faint">کلیدهای ← → برای جابه‌جایی</span>
            <button className="btn btn-ghost" onClick={() => go(-1)} disabled={step === 0}>
              سؤال قبل <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      <p className="pt-1 text-center text-[0.66rem] text-faint">
        {fas(totalAnswered)} پاسخ ثبت شده · {fas(totalCorrect)} درست — پیشرفتت خودکار ذخیره می‌شود.
      </p>
    </div>
  )
}
