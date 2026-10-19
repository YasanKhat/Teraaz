import { useState } from 'react'
import { motion } from 'framer-motion'
import { fas } from '../../lib/utils'
import { SignatureStage, Tag } from './kit'

type Node = { id: string; n: string; x: number; y: number; who: string; work: string; legacy: string }

const NODES: Node[] = [
  { id: 'math', n: 'ریاضیات', x: 50, y: 12, who: 'خوارزمی', work: 'جبر و مقابله؛ الگوریتم و نظام عددی', legacy: 'واژهٔ «الگوریتم» از نام اوست.' },
  { id: 'med', n: 'پزشکی', x: 84, y: 34, who: 'رازی و ابن سینا', work: 'الحاوی و قانون در طب', legacy: 'قانون تا سده‌ها در اروپا تدریس می‌شد.' },
  { id: 'astro', n: 'نجوم', x: 80, y: 76, who: 'بیرونی', work: 'زیج‌ها، رصد و اندازه‌گیری زمین', legacy: 'رصدخانه‌ها نهاد علمی شدند، نه کارگاه درباری.' },
  { id: 'chem', n: 'شیمی', x: 50, y: 90, who: 'جابر بن حیان', work: 'آزمایش، تقطیر و توصیف مواد', legacy: 'زبان آزمایش و تکرار، وارد علم شد.' },
  { id: 'phil', n: 'فلسفه', x: 16, y: 76, who: 'فارابی و ابن سینا', work: 'پیوند فلسفهٔ یونانی با اندیشهٔ اسلامی', legacy: '«معلم ثانی» لقب فارابی است.' },
  { id: 'adab', n: 'ادب فارسی', x: 12, y: 34, who: 'رودکی، فردوسی', work: 'شاهنامه و احیای زبان فارسی دری', legacy: 'هویت ایرانی در زبان بازسازی شد.' }
]

export function KnowledgeWeb() {
  const [id, setId] = useState('astro')
  const node = NODES.find((n) => n.id === id)!

  return (
    <SignatureStage
      kicker="شبکهٔ دانش · درس ۹"
      title="تمدن ایرانی-اسلامی، یک شبکه بود نه یک فهرست"
      hint="دانش‌ها به هم وصل بودند: نجوم به ریاضیات، پزشکی به فلسفه، ادب به هویت. یک گره را بگیر تا ببینی چه کسی و چه چیزی آن را ساخت."
      tone="lapis"
    >
      <div className="grid gap-3 md:grid-cols-[1.15fr_1fr]">
        <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-line bg-[radial-gradient(circle_at_50%_50%,rgba(28,58,120,0.18),transparent_70%)]">
          <svg className="absolute inset-0 size-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {NODES.map((a, i) =>
              NODES.slice(i + 1).map((b) => (
                <line
                  key={a.id + b.id}
                  x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                  stroke="var(--c-gold)"
                  strokeOpacity={a.id === id || b.id === id ? 0.5 : 0.12}
                  strokeWidth={a.id === id || b.id === id ? 0.5 : 0.3}
                />
              ))
            )}
          </svg>
          <div className="absolute left-1/2 top-1/2 size-[24%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-gold/40 bg-gold/10 backdrop-blur-sm">
            <div className="grid size-full place-items-center text-center">
              <div>
                <div className="text-[0.52rem] text-faint">بیت‌الحکمه</div>
                <div className="text-[0.6rem] font-bold text-gold">ترجمه و پژوهش</div>
              </div>
            </div>
          </div>
          {NODES.map((n) => (
            <button
              key={n.id}
              onClick={() => setId(n.id)}
              style={{ left: `${n.x}%`, top: `${n.y}%`, transform: 'translate(-50%,-50%)' }}
              className={`absolute rounded-lg border px-2 py-1 text-[0.6rem] transition ${n.id === id ? 'z-10 border-gold bg-gold text-bg shadow-lg' : 'border-line bg-surface/85 text-muted backdrop-blur hover:border-gold/50 hover:text-ink'}`}
            >
              {n.n}
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-line bg-bg/40 p-3.5">
          <Tag tone="gold">{node.n}</Tag>
          <div className="mt-1.5 text-[0.9rem] font-black">{node.who}</div>
          <p className="mt-1 text-[0.76rem] leading-7 text-muted">{node.work}</p>
          <motion.div key={node.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-2 rounded-lg border border-lapis/30 bg-lapis/8 px-2.5 py-2">
            <div className="text-[0.58rem] text-lapis dark:text-gold">ردپای پایدار</div>
            <p className="mt-0.5 text-[0.74rem] leading-6 text-muted">{node.legacy}</p>
          </motion.div>
          <div className="mt-2.5 grid grid-cols-3 gap-1">
            {NODES.map((n) => (
              <button key={n.id} onClick={() => setId(n.id)} className={`rounded-md border px-1 py-1 text-[0.56rem] ${n.id === id ? 'border-gold/60 text-gold' : 'border-line text-faint'}`}>{n.n}</button>
            ))}
          </div>
          <div className="mt-1.5 text-[0.55rem] text-faint">{fas(NODES.indexOf(node) + 1)} از {fas(NODES.length)} شاخهٔ دانش</div>
        </div>
      </div>
    </SignatureStage>
  )
}
