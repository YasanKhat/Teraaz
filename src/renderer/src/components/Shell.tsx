import { type ReactNode, useEffect, useState } from 'react'
import {
  Home,
  BookOpen,
  Clock,
  Map as MapIcon,
  Users,
  Layers,
  Target,
  Sparkles,
  Trophy,
  Settings,
  Search,
  Sun,
  Moon,
  Flame,
  Menu,
  X,
  Zap,
  Compass
} from 'lucide-react'
import { useProgress, useLevel, useStreak } from '../store/useProgress'
import { navigate } from '../lib/router'
import { cn, fas } from '../lib/utils'
import { StarMark } from './ui'
import { CommandPalette } from './CommandPalette'

const groups = [
  {
    label: 'سفر در تاریخ',
    items: [
      { key: 'home', label: 'خانه', icon: Home },
      { key: 'lessons', label: 'درس‌ها', icon: BookOpen },
      { key: 'timeline', label: 'خط زمان', icon: Clock },
      { key: 'map', label: 'نقشهٔ تاریخی', icon: MapIcon },
      { key: 'figures', label: 'چهره‌ها', icon: Users }
    ]
  },
  {
    label: 'تمرین و تثبیت',
    items: [
      { key: 'quiz', label: 'آزمون‌ها', icon: Target },
      { key: 'cards', label: 'کارت‌های مرور', icon: Layers },
      { key: 'game', label: 'چالش سریع', icon: Sparkles }
    ]
  },
  {
    label: 'من',
    items: [
      { key: 'progress', label: 'پیشرفت من', icon: Trophy },
      { key: 'settings', label: 'تنظیمات', icon: Settings }
    ]
  }
]

const titles: Record<string, string> = {
  home: 'خانه',
  lessons: 'درس‌ها',
  lesson: 'درس‌نامه',
  timeline: 'خط زمان',
  map: 'نقشهٔ تاریخی',
  figures: 'چهره‌ها',
  quiz: 'آزمون‌ها',
  exam: 'آزمون',
  cards: 'کارت‌های مرور',
  game: 'چالش سریع',
  progress: 'پیشرفت من',
  settings: 'تنظیمات'
}

export function applyTheme(theme: 'dark' | 'light') {
  document.documentElement.dataset.theme = theme
}

export function Shell({ current, children }: { current: string; children: ReactNode }) {
  const { theme, motion, fontScale } = useProgress((s) => s.settings)
  const setSetting = useProgress((s) => s.setSetting)
  const xp = useProgress((s) => s.xp)
  const doneCount = useProgress((s) => s.completed.length)
  const level = useLevel()
  const streak = useStreak()
  const [mobileMenu, setMobileMenu] = useState(false)

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  useEffect(() => {
    document.documentElement.dataset.motion = motion ? 'on' : 'off'
  }, [motion])

  useEffect(() => {
    document.documentElement.style.fontSize = `${fontScale * 100}%`
    return () => {
      document.documentElement.style.fontSize = ''
    }
  }, [fontScale])

  const activeRoot = current === 'lesson' ? 'lessons' : current === 'exam' ? 'quiz' : current

  const openSearch = () => window.dispatchEvent(new Event('tabar:open-search'))

  return (
    <div className="shell">
      <div className="app-bg">
        <div className="stars" />
      </div>

      <aside className="sidebar">
        <button
          className="flex items-center gap-3 px-5 pb-4 pt-6 text-right"
          onClick={() => navigate('home')}
          aria-label="تبار، خانه"
        >
          <span className="relative grid size-11 shrink-0 place-items-center rounded-2xl border border-gold/30 bg-gold/10">
            <StarMark size={26} />
          </span>
          <span className="min-w-0">
            <span className="display-tight block text-[1.7rem] text-gold">تبار</span>
            <span className="mt-1 block text-[0.65rem] tracking-wide text-faint">تاریخ ۲ · پایهٔ یازدهم</span>
          </span>
        </button>

        <div className="px-4">
          <button onClick={openSearch} className="searchbox flex w-full items-center gap-2 px-3 py-2 text-xs">
            <Search size={14} />
            <span className="flex-1 text-right">جست‌وجوی سراسری…</span>
            <kbd className="rounded border border-line px-1.5 py-0.5 text-[0.6rem]">⌘K</kbd>
          </button>
        </div>

        <nav className="mt-4 flex-1 overflow-y-auto px-3 pb-4">
          {groups.map((g) => (
            <div key={g.label} className="mb-4">
              <div className="kicker mb-1.5 px-2.5 text-[0.6rem]">{g.label}</div>
              <div className="space-y-0.5">
                {g.items.map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.key}
                      className="nav-item w-full"
                      data-active={activeRoot === item.key}
                      onClick={() => navigate(item.key)}
                    >
                      <Icon size={17} className="shrink-0" />
                      <span className="flex-1 text-right">{item.label}</span>
                      {item.key === 'lessons' && (
                        <span className="text-[0.62rem] tabular-nums text-faint">{fas(doneCount)}/۱۶</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-line p-3.5">
          <div className="rounded-xl border border-line bg-surface/60 p-3">
            <div className="mb-1.5 flex items-center justify-between text-[0.7rem]">
              <span className="font-semibold">{level.title}</span>
              <span className="text-faint">سطح {fas(level.level)}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full bg-gradient-to-l from-gold to-gold2"
                style={{ width: `${level.progress}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[0.65rem] text-faint">
              <span>{fas(xp)} امتیاز</span>
              <span className="flex items-center gap-1 text-gold">
                <Flame size={11} /> {fas(streak)} روز
              </span>
            </div>
          </div>
        </div>
      </aside>

      <div className="with-sidebar min-h-dvh">
        <header className="topbar">
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 md:px-7">
            <button
              className="btn btn-ghost btn-sm lg:hidden"
              onClick={() => setMobileMenu(true)}
              aria-label="منو"
            >
              <Menu size={18} />
            </button>
            <div className="hidden min-w-0 items-center gap-2 text-sm sm:flex">
              <span className="text-faint">تبار</span>
              <span className="text-faint">/</span>
              <span className="truncate font-semibold">{titles[current] ?? 'سفر'}</span>
            </div>
            <div className="flex flex-1 items-center justify-end gap-1.5">
              <button
                onClick={openSearch}
                className="btn btn-ghost btn-sm md:hidden"
                aria-label="جست‌وجو"
              >
                <Search size={16} />
              </button>
              <button onClick={openSearch} className="searchbox hidden items-center gap-2 px-3 py-1.5 text-[0.72rem] md:flex">
                <Search size={13} />
                <span>جست‌وجو…</span>
                <kbd className="rounded border border-line px-1 py-0.5 text-[0.6rem]">⌘K</kbd>
              </button>
              <div className="chip cursor-default" title="روزهای پیوستهٔ مطالعه">
                <Flame size={13} className="text-rose" />
                {fas(streak)}
              </div>
              <div className="chip cursor-default" title="امتیاز تجربه">
                <Zap size={13} className="text-gold" />
                {fas(xp)}
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setSetting('theme', theme === 'dark' ? 'light' : 'dark')}
                aria-label="تغییر پوسته"
                title={theme === 'dark' ? 'روشن' : 'تاریک'}
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            </div>
          </div>
        </header>

        <main id="main" tabIndex={-1} className="mx-auto max-w-6xl px-4 pb-28 pt-5 outline-none md:px-7 lg:pb-16">{children}</main>

        <footer className="mx-auto max-w-6xl px-4 pb-24 text-center text-[0.68rem] leading-6 text-faint md:px-7 lg:pb-8">
          <div className="gold-rule mb-4" />
          تبار · تاریخ ۲ پایهٔ یازدهم · ساخته برای یادگیری، نه حفظ‌کردن
          <div className="mt-1 opacity-70">محتوای آموزشی بر پایهٔ کتاب درسی تاریخ ۲ و کتاب ماجرای بیست</div>
        </footer>
      </div>

      <nav className="mobile-nav safe-bottom">
        <div className="grid grid-cols-5">
          {[
            { key: 'home', label: 'خانه', icon: Home },
            { key: 'lessons', label: 'درس‌ها', icon: BookOpen },
            { key: 'timeline', label: 'خط زمان', icon: Compass },
            { key: 'quiz', label: 'آزمون', icon: Target },
            { key: 'progress', label: 'پیشرفت', icon: Trophy }
          ].map((item) => {
            const Icon = item.icon
            const on = activeRoot === item.key
            return (
              <button
                key={item.key}
                onClick={() => navigate(item.key)}
                className={cn('flex flex-col items-center gap-1 py-2.5 text-[0.62rem]', on ? 'text-gold' : 'text-muted')}
              >
                <Icon size={18} />
                {item.label}
              </button>
            )
          })}
        </div>
      </nav>

      {mobileMenu && (
        <div className="fixed inset-0 z-[75] lg:hidden">
          <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={() => setMobileMenu(false)} />
          <div className="panel absolute inset-y-0 right-0 w-[82%] max-w-sm overflow-y-auto rounded-none p-5">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StarMark size={26} />
                <span className="display-tight text-[1.7rem] text-gold">تبار</span>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setMobileMenu(false)} aria-label="بستن">
                <X size={17} />
              </button>
            </div>
            {groups.map((g) => (
              <div key={g.label} className="mb-4">
                <div className="kicker mb-2">{g.label}</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {g.items.map((item) => {
                    const Icon = item.icon
                    return (
                      <button
                        key={item.key}
                        className="nav-item"
                        data-active={activeRoot === item.key}
                        onClick={() => {
                          navigate(item.key)
                          setMobileMenu(false)
                        }}
                      >
                        <Icon size={16} />
                        {item.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <CommandPalette
        onNavigate={(route) => {
          navigate(route)
          setMobileMenu(false)
        }}
      />
    </div>
  )
}
