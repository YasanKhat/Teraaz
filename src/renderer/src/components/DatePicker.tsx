import { useEffect, useRef, useState } from 'react'
import type * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CalendarDays, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import {
  JALALI_MONTHS,
  WEEKDAYS_SHORT,
  formatJalali,
  isoToJalali,
  jalaliMonthLength,
  jalaliToIso,
  todayIso,
  weekdayOfIso
} from '../lib/jalali'
import { fa } from '../lib/digits'
import clsx from 'clsx'

export function DatePicker({
  value,
  onChange,
  placeholder = 'انتخاب تاریخ',
  disabled
}: {
  value: string
  onChange: (iso: string) => void
  placeholder?: string
  disabled?: boolean
}): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const wrapper = useRef<HTMLDivElement>(null)
  const today = todayIso()
  const initial = isoToJalali(value || today)
  const [view, setView] = useState({ jy: initial.jy, jm: initial.jm })

  useEffect(() => {
    if (!open) return
    const next = isoToJalali(value || today)
    setView({ jy: next.jy, jm: next.jm })
  }, [open, value, today])

  useEffect(() => {
    if (!open) return
    const handler = (event: MouseEvent): void => {
      if (wrapper.current && !wrapper.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const changeMonth = (delta: number): void => {
    setView((current) => {
      const total = current.jy * 12 + (current.jm - 1) + delta
      return { jy: Math.floor(total / 12), jm: (total % 12) + 1 }
    })
  }

  const shiftYear = (delta: number): void => {
    setView((current) => ({ ...current, jy: current.jy + delta }))
  }

  const length = jalaliMonthLength(view.jy, view.jm)
  const firstIso = jalaliToIso(view.jy, view.jm, 1)
  const blanks = weekdayOfIso(firstIso)
  const selectedJalali = value ? isoToJalali(value) : null

  const select = (day: number): void => {
    onChange(jalaliToIso(view.jy, view.jm, day))
    setOpen(false)
  }

  return (
    <div ref={wrapper} style={{ position: 'relative' }}>
      <button
        type="button"
        className={clsx('date-trigger', open && 'open')}
        onClick={() => setOpen((current) => !current)}
        disabled={disabled}
      >
        <CalendarDays size={15} style={{ color: 'var(--muted)' }} />
        <span>{value ? formatJalali(value, 'medium') : placeholder}</span>
        <ChevronLeft
          size={14}
          className="cal-icon"
          style={{ transform: open ? 'rotate(-90deg)' : 'none', transition: 'transform 160ms ease' }}
        />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="cal-pop"
            initial={{ opacity: 0, y: -6, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.99 }}
            transition={{ duration: 0.16 }}
          >
            <div className="cal-head">
              <div className="flex items-center gap-1">
                <button className="cal-nav" onClick={() => shiftYear(-1)} aria-label="سال قبل">
                  <ChevronsRight size={13} />
                </button>
                <button className="cal-nav" onClick={() => changeMonth(-1)} aria-label="ماه قبل">
                  <ChevronRight size={13} />
                </button>
              </div>
              <div className="cal-title">
                {JALALI_MONTHS[view.jm - 1]} {fa(view.jy)}
              </div>
              <div className="flex items-center gap-1">
                <button className="cal-nav" onClick={() => changeMonth(1)} aria-label="ماه بعد">
                  <ChevronLeft size={13} />
                </button>
                <button className="cal-nav" onClick={() => shiftYear(1)} aria-label="سال بعد">
                  <ChevronsLeft size={13} />
                </button>
              </div>
            </div>

            <div className="cal-grid">
              {WEEKDAYS_SHORT.map((day) => (
                <div key={day} className="cal-weekday">
                  {day}
                </div>
              ))}
              {Array.from({ length: blanks }).map((_, index) => (
                <div key={`blank-${index}`} className="cal-day empty" />
              ))}
              {Array.from({ length }, (_, index) => index + 1).map((day) => {
                const iso = jalaliToIso(view.jy, view.jm, day)
                const isToday = iso === today
                const isSelected =
                  selectedJalali?.jy === view.jy &&
                  selectedJalali?.jm === view.jm &&
                  selectedJalali?.jd === day
                return (
                  <button
                    key={day}
                    className={clsx('cal-day', isToday && 'today', isSelected && 'selected')}
                    onClick={() => select(day)}
                  >
                    {fa(day)}
                  </button>
                )
              })}
            </div>

            <div className="cal-foot">
              <button
                className="cal-quick"
                onClick={() => {
                  onChange(today)
                  setOpen(false)
                }}
              >
                امروز
              </button>
              <span className="tiny muted">{formatJalali(value || today, 'long')}</span>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
