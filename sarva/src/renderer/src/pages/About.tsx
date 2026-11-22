import { useEffect, useRef } from 'react'
import aboutMarkup from './about-snapshot.html?raw'
import './about-site.css'

// The public about page's captured content, with browser behaviours recreated
// below. This is static, vetted markup in the application bundle, never input
// from a visitor or an API. Hash links were adapted to the desktop router.
const prefix = 'about-module__UxSSNW__'
const cls = (name: string) => `.${prefix}${name}`

export default function About() {
  const rootRef = useRef<HTMLElement>(null)
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const revealed = [...root.querySelectorAll<HTMLElement>('[data-reveal]')]
    let revealObserver: IntersectionObserver | undefined
    let stepObserver: IntersectionObserver | undefined
    let tocObserver: IntersectionObserver | undefined
    let copyTimer: ReturnType<typeof setTimeout> | undefined
    let animationFrame: number | undefined
    const dissect = root.querySelector<HTMLElement>(cls('dissect'))
    const tabs = [...root.querySelectorAll<HTMLButtonElement>(`${cls('tabs')} [role=tab]`)]
    const panes = [...root.querySelectorAll<HTMLElement>(cls('underPane'))]
    const steps = [...root.querySelectorAll<HTMLElement>(cls('steps') + ' > ' + cls('step'))]
    const deviceTags = [...root.querySelectorAll<HTMLElement>(cls('tagDevice'))]
    const syntaxTags = [...root.querySelectorAll<HTMLElement>(cls('tagSyntax'))]
    const syllables = [...root.querySelectorAll<HTMLElement>(cls('syllRow'))]
    const pill = root.querySelector<HTMLElement>(cls('tabPill'))
    const currentText = root.querySelector<HTMLElement>(cls('stepNow') + ' ' + cls('stepText'))
    const tocLinks = [...root.querySelectorAll<HTMLAnchorElement>(cls('tocItem'))]
    const sections = tocLinks.map(a => root.querySelector<HTMLElement>(a.getAttribute('href') || ''))

    const playMeter = () => {
      syllables.forEach(row => { row.dataset.play = 'false' })
      if (animationFrame !== undefined) cancelAnimationFrame(animationFrame)
      animationFrame = requestAnimationFrame(() => syllables.forEach(row => { row.dataset.play = 'true' }))
    }
    const setStep = (index: number) => {
      if (!dissect || index < 0 || index >= steps.length) return
      dissect.dataset.step = String(index)
      tabs.forEach((tab, i) => tab.setAttribute('aria-selected', String(i === index)))
      panes.forEach((pane, i) => { pane.dataset.on = String(i === index); pane.setAttribute('aria-hidden', String(i !== index)) })
      steps.forEach((step, i) => { step.dataset.on = String(i === index) })
      deviceTags.forEach(tag => tag.setAttribute('aria-hidden', String(index !== 2)))
      syntaxTags.forEach(tag => tag.setAttribute('aria-hidden', String(index !== 3)))
      if (pill) pill.style.setProperty('--n', String(index))
      if (currentText) currentText.textContent = steps[index].querySelector(cls('stepText'))?.textContent || ''
      const current = root.querySelector<HTMLElement>(cls('stepNow'))
      current?.querySelector('[data-local-cta]')?.remove()
      if (index === 4 && current) {
        const source = steps[4].querySelector<HTMLAnchorElement>('a')
        if (source) { const link = source.cloneNode(true) as HTMLAnchorElement; link.dataset.localCta = 'true'; current.append(link) }
        playMeter()
      } else syllables.forEach(row => { row.dataset.play = 'false' })
    }
    if ('IntersectionObserver' in window) {
      revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add(prefix + 'isIn'); revealObserver?.unobserve(entry.target) }
      }), { rootMargin: '0px 0px -12% 0px' })
      revealed.forEach(e => revealObserver!.observe(e))
      tocObserver = new IntersectionObserver(entries => entries.forEach(entry => {
        if (entry.isIntersecting) tocLinks.forEach(a => {
          if (a.getAttribute('href') === '#' + entry.target.id) a.setAttribute('aria-current', 'true')
          else a.removeAttribute('aria-current')
        })
      }), { rootMargin: '-45% 0px -50% 0px' })
      sections.forEach(section => section && tocObserver!.observe(section))
      stepObserver = new IntersectionObserver(entries => entries.forEach(entry => {
        if (entry.isIntersecting && window.matchMedia('(min-width: 900px)').matches) setStep(steps.indexOf(entry.target as HTMLElement))
      }), { rootMargin: '-50% 0px -49% 0px' })
      steps.forEach(step => stepObserver!.observe(step))
    } else revealed.forEach(e => e.classList.add(prefix + 'isIn'))

    const onClick = (event: MouseEvent) => {
      const target = event.target as Element
      const tab = target.closest<HTMLButtonElement>(`${cls('tabs')} [role=tab]`)
      if (tab) {
        const index = tabs.indexOf(tab)
        setStep(index)
        if (window.matchMedia('(min-width: 900px)').matches) steps[index]?.scrollIntoView({ block: 'center', behavior: 'smooth' })
        return
      }
      if (target.closest(cls('replay'))) { playMeter(); return }
      const copy = target.closest<HTMLButtonElement>(cls('copy'))
      if (copy) {
        const success = () => {
          copy.dataset.done = 'true'; copy.setAttribute('aria-label', 'کپی شد')
          const live = copy.querySelector<HTMLElement>('[aria-live]'); if (live) live.textContent = 'کپی شد'
          copyTimer = setTimeout(() => { copy.dataset.done = 'false'; copy.setAttribute('aria-label', 'کپی ایمیل'); if (live) live.textContent = '' }, 1800)
        }
        if (navigator.clipboard) void navigator.clipboard.writeText('info@sarvaedu.ir').then(success).catch(() => { window.location.href = 'mailto:info@sarvaedu.ir' })
        else window.location.href = 'mailto:info@sarvaedu.ir'
        return
      }
      const anchor = target.closest<HTMLAnchorElement>(cls('tocItem'))
      if (anchor) {
        const section = root.querySelector<HTMLElement>(anchor.getAttribute('href') || '')
        if (section) { event.preventDefault(); section.scrollIntoView({ behavior: 'smooth', block: 'start' }) }
      }
    }
    const onPointer = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return
      const spot = (event.target as Element).closest<HTMLElement>('[data-spot]')
      if (!spot || !root.contains(spot)) return
      const r = spot.getBoundingClientRect()
      spot.style.setProperty('--mx', `${event.clientX - r.left}px`)
      spot.style.setProperty('--my', `${event.clientY - r.top}px`)
    }
    root.addEventListener('click', onClick)
    root.addEventListener('pointermove', onPointer)
    return () => {
      root.removeEventListener('click', onClick); root.removeEventListener('pointermove', onPointer)
      revealObserver?.disconnect(); stepObserver?.disconnect(); tocObserver?.disconnect()
      if (copyTimer) clearTimeout(copyTimer)
      if (animationFrame !== undefined) cancelAnimationFrame(animationFrame)
    }
  }, [])
  return <main ref={rootRef} dir="rtl" className="about-module__UxSSNW__page" dangerouslySetInnerHTML={{ __html: aboutMarkup }} />
}
