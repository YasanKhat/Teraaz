import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type AnchorHTMLAttributes,
  type ReactNode
} from 'react'

/**
 * مسیریابیِ تک‌صفحه‌ایِ سروا.
 *
 * رابطِ این ماژول عمداً همان `next/navigation` و `next/link` است —
 * `usePathname`, `useRouter`, `useSearchParams`, `<Link href>` — چون ۲۲۱ فایل
 * از کدِ خودِ سروا با همان نام‌ها صدایشان می‌زنند. تنها تفاوت در پیاده‌سازی
 * است: به‌جای router فایل‌محورِ Next، یک مسیریابِ هش‌محور نشسته که زیرِ
 * `file://` الکترون هم درست کار می‌کند (جایی که `pushState`ِ مسیر نداریم).
 */

type Listener = () => void

const listeners = new Set<Listener>()

function currentHash(): string {
  if (typeof window === 'undefined') return '#/'
  return window.location.hash || '#/'
}

/** مسیرِ فعلی، بدونِ `#` و بدونِ رشتهٔ جست‌وجو. */
export function readPath(): string {
  const raw = currentHash().replace(/^#/, '')
  const q = raw.indexOf('?')
  const path = (q === -1 ? raw : raw.slice(0, q)) || '/'
  return path.startsWith('/') ? path : '/' + path
}

/** رشتهٔ جست‌وجویِ فعلی (بخشِ بعد از `?` در هش). */
export function readSearch(): string {
  const raw = currentHash().replace(/^#/, '')
  const q = raw.indexOf('?')
  return q === -1 ? '' : raw.slice(q + 1)
}

export function navigate(to: string, options: { replace?: boolean } = {}) {
  const target = to.startsWith('#') ? to : '#' + (to.startsWith('/') ? to : '/' + to)
  if (typeof window === 'undefined') return
  if (currentHash() === target) {
    emit()
    return
  }
  if (options.replace) window.history.replaceState(null, '', target)
  else window.history.pushState(null, '', target)
  emit()
}

function emit() {
  for (const l of listeners) l()
}

/**
 * آدرس فقط با `<Link>` عوض نمی‌شود: کاربر خودش در نوارِ آدرس مسیر می‌نویسد،
 * دکمهٔ جلو/عقبِ مرورگر را می‌زند، یا منوی الکترون هش را عوض می‌کند. در همهٔ
 * این حالت‌ها مرورگر `hashchange` / `popstate` می‌فرستد اما از `navigate()`
 * خبر ندارد — پس اینجا یک بار برای همیشه گوش می‌دهیم و به همه اطلاع می‌دهیم.
 *
 * `history.pushState` طبقِ استاندارد این رویدادها را نمی‌فرستد، پس با
 * `navigate()` دوباره‌کاری نمی‌شود.
 */
function startHistoryListening(): void {
  if (typeof window === 'undefined') return
  if ((startHistoryListening as { done?: boolean }).done) return
  ;(startHistoryListening as { done?: boolean }).done = true
  window.addEventListener('hashchange', emit)
  window.addEventListener('popstate', emit)
}

startHistoryListening()

/** شنوندهٔ منوی الکترون: مسیر را از فرایندِ اصلی می‌گیرد و اعمال می‌کند. */
export function bindExternalNavigation(cb: (handler: (path: string) => void) => () => void) {
  return cb((path) => navigate(path))
}

export function usePathname(): string {
  const [path, setPath] = useState(readPath)
  useEffect(() => {
    const l = () => setPath(readPath())
    listeners.add(l)
    l()
    return () => {
      listeners.delete(l)
    }
  }, [])
  return path
}

export function useSearchParams(): URLSearchParams {
  const [search, setSearch] = useState(readSearch)
  useEffect(() => {
    const l = () => setSearch(readSearch())
    listeners.add(l)
    return () => {
      listeners.delete(l)
    }
  }, [])
  return useMemo(() => new URLSearchParams(search), [search])
}

export function useRouter() {
  const push = useCallback((to: string) => navigate(to), [])
  const replace = useCallback((to: string) => navigate(to, { replace: true }), [])
  const back = useCallback(() => window.history.back(), [])
  const forward = useCallback(() => window.history.forward(), [])
  const refresh = useCallback(() => emit(), [])
  return useMemo(
    () => ({ push, replace, back, forward, refresh, prefetch: () => {} }),
    [push, replace, back, forward, refresh]
  )
}

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string
  replace?: boolean
  prefetch?: boolean
  scroll?: boolean
  children?: ReactNode
}

export function Link({ href, replace, onClick, target, children, ...rest }: LinkProps) {
  const external = /^([a-z]+:)?\/\//i.test(href) || href.startsWith('mailto:') || href.startsWith('tel:')
  const to = external ? href : '#' + (href.startsWith('/') ? href : '/' + href)

  return (
    <a
      href={to}
      target={target ?? (external ? '_blank' : undefined)}
      rel={external && !target ? 'noreferrer noopener' : undefined}
      onClick={(e) => {
        onClick?.(e)
        if (e.defaultPrevented) return
        // کلیدهای ترکیبی (تبِ جدید، ذخیرهٔ پیوند) را به مرورگر واگذار می‌کنیم.
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
        if (external) return
        e.preventDefault()
        navigate(href, { replace })
      }}
      {...rest}
    >
      {children}
    </a>
  )
}

/** جانشینِ `next/image`: همان ویژگی‌ها را می‌گیرد و یک `<img>` ساده می‌سازد.
 *  در یک برنامهٔ محلی نه بهینه‌سازِ تصویر معنا دارد و نه lazy-loadingِ شبکه‌ای. */
type ImgProps = AnchorHTMLAttributes<never> & {
  src: string
  alt?: string
  width?: number | string
  height?: number | string
  fill?: boolean
  priority?: boolean
  quality?: number
  sizes?: string
  className?: string
  style?: React.CSSProperties
  onLoad?: () => void
}

export function Img({ src, alt = '', width, height, fill, className, style, ...rest }: ImgProps) {
  const box = fill
    ? ({ position: 'absolute', inset: 0, width: '100%', height: '100%' } as React.CSSProperties)
    : {}
  return (
    <img
      src={src}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      loading={rest.priority ? 'eager' : 'lazy'}
      decoding="async"
      className={className}
      style={{ ...box, ...style }}
    />
  )
}

/** «در حال بارگذاری»ِ سراسری برای جابه‌جاییِ صفحه‌ها — همان حسِ nprogressِ سایت. */
const LoadingContext = createContext<boolean>(false)
export const RouteLoadingProvider = LoadingContext.Provider
export const useRouteLoading = () => useContext(LoadingContext)
