import { useState } from 'react'
import { Check } from 'lucide-react'
import { cn, fas } from '../lib/utils'
import type { BookQuestion } from '../data/book/examQuestions'

/** پرسش‌های رسمی کتاب، با پاسخِ بازشو */
export function QuestionCards({ items }: { items: BookQuestion[] }) {
  const [open, setOpen] = useState<number[]>([])
  const toggle = (i: number) => setOpen((v) => (v.includes(i) ? v.filter((x) => x !== i) : [...v, i]))
  return (
    <ol className="film-qbank">
      {items.map((q, i) => {
        const isOpen = open.includes(i)
        return (
          <li key={q.id}>
            <div className="film-qbank__head">
              <span className="film-qbank__n">{fas(q.n)}</span>
              <span className="film-qbank__kind">{q.kindLabel}</span>
            </div>
            <p className="film-qbank__q">{q.q}</p>
            {q.options && q.options.length > 1 && (
              <div className="film-qbank__opts">
                {q.options.map((o, k) => (
                  <span key={k} className="film-qbank__opt">
                    <b>{fas(k + 1)}</b> {o}
                  </span>
                ))}
              </div>
            )}
            <button className={cn('film-qbank__reveal', isOpen && 'is-open')} onClick={() => toggle(i)}>
              {isOpen ? 'بستن پاسخ' : 'نمایش پاسخ'}
            </button>
            {isOpen && (
              <p className="film-qbank__a">
                <Check size={12} /> {q.answer}
              </p>
            )}
          </li>
        )
      })}
    </ol>
  )
}

