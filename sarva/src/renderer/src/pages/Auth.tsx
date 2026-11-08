import { useState } from 'react'
import { apiPost } from '@/lib/api/client'
import { refreshCurrentUser } from '@/lib/auth/use-current-user'
import { navigate } from '@/app/router'
import type { AuthUser } from '@/lib/auth/types'

/**
 * ورود و ثبت‌نام — بازطراحی‌شده برای یک برنامهٔ تک‌نفره.
 *
 * آنچه از سایت مانده: همان مسیرها (`/api/v1/auth/login` و `/register`)،
 * همان شکلِ `AuthUser`، همان قانون که رمزِ عبور هرگز برنمی‌گردد، و همان
 * رفتارِ بعد از ورود (تازه‌سازیِ نشست و برگشت به مقصد).
 *
 * آنچه عوض شده: تأییدِ ایمیل و کدِ پیامک حذف شده‌اند، چون در یک برنامهٔ
 * آفلاین چیزی برای فرستادن نیست. ثبت‌نام یک مرحله‌ای است و حساب روی همین
 * دستگاه می‌ماند — نه ایمیلی می‌رود و نه سروری در میان است.
 */

type Mode = 'login' | 'register'

export default function Auth({ returnTo = '/panel' }: { returnTo?: string }) {
  const [mode, setMode] = useState<Mode>('login')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)

    const path = mode === 'login' ? '/api/v1/auth/login' : '/api/v1/auth/register'
    const body =
      mode === 'login'
        ? { identifier, password }
        : { email: identifier.includes('@') ? identifier : null, phone: identifier.includes('@') ? null : identifier, password, fullName: name }

    const result = await apiPost<{ user: AuthUser }>(path, body)
    setBusy(false)

    if (!result.ok) {
      setError(result.errors.join(' '))
      return
    }
    refreshCurrentUser()
    navigate(returnTo)
  }

  const field =
    'w-full rounded-2xl border border-input bg-card px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary'

  return (
    <div dir="rtl" className="container flex min-h-[80vh] items-center justify-center py-16">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card/70 p-8 shadow-2xl backdrop-blur-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-black text-foreground">
            {mode === 'login' ? 'ورود به سروا' : 'ساختِ حساب'}
          </h1>
          <p className="mt-2 text-xs leading-6 text-muted-foreground">
            حساب فقط روی همین دستگاه است. نه ایمیلی فرستاده می‌شود و نه چیزی به اینترنت.
          </p>
        </div>

        <div className="mb-6 flex rounded-full bg-secondary p-1 text-sm">
          {(
            [
              ['login', 'ورود'],
              ['register', 'ثبت‌نام']
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setMode(key)
                setError(null)
              }}
              className={
                mode === key
                  ? 'flex-1 rounded-full bg-primary px-4 py-2 font-bold text-primary-foreground'
                  : 'flex-1 rounded-full px-4 py-2 text-muted-foreground'
              }
            >
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === 'register' && (
            <input
              className={field}
              placeholder="نام و نام خانوادگی"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          )}
          <input
            className={field}
            placeholder="ایمیل یا شمارهٔ موبایل"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            dir="ltr"
            autoComplete="username"
          />
          <input
            className={field}
            type="password"
            placeholder="رمزِ عبور (دست‌کم ۶ نویسه)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />

          {error && (
            <p className="rounded-xl bg-destructive/10 px-4 py-2 text-xs text-destructive">{error}</p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition disabled:opacity-60"
          >
            {busy ? 'کمی صبر کن…' : mode === 'login' ? 'ورود' : 'ساختِ حساب'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs leading-6 text-muted-foreground">
          بدون حساب هم می‌توانی وزن‌یاب، درسنامه و بیشترِ بازی‌ها را استفاده کنی؛ حساب فقط پیشرفتت را
          نگه می‌دارد.
        </p>
      </div>
    </div>
  )
}
