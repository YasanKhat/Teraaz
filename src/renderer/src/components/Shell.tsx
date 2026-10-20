import { type ReactNode, useEffect, useState } from 'react'
import {
  Archive,
  BookOpen,
  Flame,
  ListChecks,
  Home,
  Menu,
  Moon,
  Search,
  Settings,
  Sun,
  Target,
  Trophy,
  X,
  Zap
} from 'lucide-react'
import { useProgress, useLevel, useStreak } from '../store/useProgress'
import { navigate } from '../lib/router'
import { cn, fas } from '../lib/utils'
import { StarMark } from './ui'
import { CommandPalette } from './CommandPalette'

const NAV = [
  { key: 'home', label: 'خانه', icon: Home },
  { key: 'chapters', label: 'فصل‌ها', icon: BookOpen },
  { key: 'bank', label: 'سؤال‌ها', icon: ListChecks },
  { key: 'archive', label: 'آرشیو', icon: Archive },
  { key: 'exams', label: 'آزمون‌ها', icon: Target },
  { key: 'me', label: 'کارنامه', icon: Trophy }
]

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

  useEffect(() => { applyTheme(theme) }, [theme])
  useEffect(() => { document.documentElement.dataset.motion = motion ? 'on' : 'off' }, [motion])
  useEffect(() => {
    document.documentElement.style.fontSize = `${fontScale * 100}%`
    return () => { document.documentElement.style.fontSize = '' }
  }, [fontScale])

  const activeRoot =
    current === 'lesson' || current === 'chapter' || current === 'recap' ? 'chapters'
      : current === 'timeline' || current === 'map' || current === 'figures' ? 'archive'
      : current === 'bank' ? 'bank'
      : current === 'quiz' ? 'exams'
      : current === 'progress' ? 'me'
      : current

  const openSearch = () => window.dispatchEvent(new Event('tabar:open-search'))

  return (
    <div className="shell">
      <div className="app-bg">
        <div className="stars" />
      </div>

      {/* ریل کنار — بی‌متن، بی‌کارت */}
      <aside className="rail" aria-label="ناوبری">
        <button className="rail__mark" onClick={() => navigate('home')} aria-label="تبار">
          <StarMark size={22} />
        </button>
        <div className="rail__sep" />
        {NAV.map((item) => {
          const Icon = item.icon
          const on = activeRoot === item.key
          return (
            <button
              key={item.key}
              className="rail__btn"
              data-on={on}
              onClick={() => navigate(item.key)}
              aria-label={item.label}
              aria-current={on ? 'page' : undefined}
            >
              <Icon size={18} />
              <span className="rail__tip">{item.label}</span>
              {item.key === 'chapters' && on && (
                <span className="absolute -bottom-0.5 text-[0.45rem] tabular-nums text-gold/80">{fas(doneCount)}</span>
              )}
            </button>
          )
        })}
        <div className="rail__sep" />
        <button className="rail__btn" onClick={openSearch} aria-label="جست‌وجو">
          <Search size={18} />
          <span className="rail__tip">جست‌وجو (⌘K)</span>
        </button>
        <button className="rail__btn" onClick={() => setSetting('theme', theme === 'dark' ? 'light' : 'dark')} aria-label="تغییر پوسته">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          <span className="rail__tip">{theme === 'dark' ? 'روشن' : 'تاریک'}</span>
        </button>
        <div className="mt-auto flex flex-col items-center gap-1">
          <button className="rail__btn" onClick={() => navigate('settings')} aria-label="تنظیمات">
            <Settings size={18} />
            <span className="rail__tip">تنظیمات</span>
          </button>
          <span className="grid size-9 place-items-center rounded-full border border-gold/30 text-[0.55rem] font-bold tabular-nums text-gold" title={`${level.title} · ${xp} امتیاز`}>
            {fas(level.level)}
          </span>
        </div>
      </aside>

      <div className="with-rail min-h-dvh">
        <div className="mx-auto max-w-[1180px] px-4 pb-28 pt-1 md:px-8 lg:pb-16">
          <div className="statusline">
            <button className="statusline__chip md:hidden" onClick={() => setMobileMenu(true)} aria-label="منو">
              <Menu size={13} />
            </button>
            <button className="statusline__chip md:hidden" onClick={openSearch}>
              <Search size={12} /> <span className="hidden sm:inline">جست‌وجو</span>
            </button>
            <span className="statusline__chip" title="روزهای پیوسته"><Flame size={12} className="text-rose" /> {fas(streak)}</span>
            <span className="statusline__chip" title="امتیاز"><Zap size={12} className="text-gold" /> {fas(xp)}</span>
            <span className="statusline__chip hidden sm:inline-flex md:hidden">{level.title}</span>
          </div>

          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:right-4 focus:top-4 focus:z-[99] focus:rounded-lg focus:bg-gold focus:px-3 focus:py-2 focus:text-bg"
          >
            رفتن به محتوای اصلی
          </a>

          <main id="main" tabIndex={-1} className="pb-10 pt-4 outline-none">{children}</main>

          <footer className="mt-6 border-t border-line pt-4 text-center text-[0.66rem] leading-6 text-faint">
            تبار · تاریخ ۲ پایهٔ یازدهم · بر پایهٔ کتاب درسی و کتاب ماجرای بیست
          </footer>
        </div>
      </div>

      <nav className="dock" aria-label="ناوبری موبایل">
        {NAV.map((item) => {
          const Icon = item.icon
          const on = activeRoot === item.key
          return (
            <button
              key={item.key}
              onClick={() => navigate(item.key)}
              className={cn('flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-[0.58rem]', on ? 'bg-gold/12 text-gold' : 'text-muted')}
            >
              <Icon size={17} />
              {item.label}
            </button>
          )
        })}
      </nav>

      {mobileMenu && (
        <div className="fixed inset-0 z-[75] md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenu(false)} />
          <div className="absolute inset-y-0 right-0 w-[80%] max-w-xs overflow-y-auto border-s border-line bg-bg p-5">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StarMark size={24} />
                <span className="display-tight text-[1.6rem] text-gold">تبار</span>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setMobileMenu(false)} aria-label="بستن"><X size={17} /></button>
            </div>
            <div className="space-y-1">
              {NAV.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.key}
                    className="nav-item w-full"
                    data-active={activeRoot === item.key}
                    onClick={() => { navigate(item.key); setMobileMenu(false) }}
                  >
                    <Icon size={17} /> <span className="flex-1 text-start">{item.label}</span>
                  </button>
                )
              })}
              <button className="nav-item w-full" onClick={() => { navigate('settings'); setMobileMenu(false) }}>
                <Settings size={17} /> <span className="flex-1 text-start">تنظیمات</span>
              </button>
            </div>
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
