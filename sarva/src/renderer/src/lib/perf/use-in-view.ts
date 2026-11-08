import { useEffect, useState, type RefObject } from 'react'

/**
 * `useInView` با امضای framer-motion.
 *
 * چند کامپوننتِ خانه (Highlighter، AnimatedBeam، ShinyButton، NumberTicker)
 * این hook را از `motion/react` می‌گرفتند. بستهٔ `motion` در این نسخه آن را
 * صادر نمی‌کند، و سروا خودش هم یک `useInView` دارد — ولی با امضای دیگری
 * (`rootMargin`, `once`) که با این فراخوان‌ها جور نیست.
 *
 * پس اینجا همان hookِ فریمِر‌موشن با همان گزینه‌ها (`amount`, `once`, `margin`)
 * پیاده شده، تا آن کامپوننت‌ها دست‌نخورده بمانند.
 */

export type UseInViewOptions = {
  root?: RefObject<Element | null>
  /** «چه قدر از عنصر دیده شود» — ۰ تا ۱، یا "some" / "all". */
  amount?: number | 'some' | 'all'
  margin?: string
  once?: boolean
  initial?: boolean
}

export function useInView(
  ref: RefObject<Element | null>,
  options: UseInViewOptions = {}
): boolean {
  const { root, amount = 'some', margin = '0px', once = false, initial = false } = options
  const [inView, setInView] = useState(initial)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return

    const threshold =
      amount === 'all' ? 1 : amount === 'some' ? 0 : Math.min(Math.max(Number(amount) || 0, 0), 1)

    let done = false
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return
        const visible = entry.isIntersecting
        setInView(visible)
        if (visible && once) {
          done = true
          io.disconnect()
        }
      },
      { root: root?.current ?? null, rootMargin: margin, threshold }
    )

    io.observe(el)
    return () => {
      if (!done) io.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, root, amount, margin, once])

  return inView
}

export default useInView
