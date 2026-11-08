import * as db from './db'
import type { AuthUser } from '@/lib/auth/types'
import type { PlusSummary } from '@/lib/plus/types'

/**
 * حسابِ کاربریِ محلی — بازطراحیِ `lib/auth/*` برای یک برنامهٔ تک‌نفره.
 *
 * آنچه از سایت مانده: شکلِ `AuthUser`، شکلِ `PlusSummary`، مسیرهای
 * `/api/v1/auth/*` و این اصل که **رمزِ عبور هرگز به کلاینت برنمی‌گردد**
 * (`password_hash` در `AuthUser` نیست).
 *
 * آنچه عوض شده: به‌جای سشنِ httpOnly و JWT، یک «کاربرِ فعلی» روی همین
 * دستگاه نشسته است. تأییدِ ایمیل و پیامک معنا ندارد — هیچ ایمیلی فرستاده
 * نمی‌شود — پس `emailVerified` همیشه درست است و ثبت‌نام یک مرحله‌ای است.
 *
 * ⚠️ رمزها با SHA-256 نمک‌دار ذخیره می‌شوند. این برای «جلوی دیدنِ رمز در
 * فایلِ پشتیبان را گرفتن» کافی است، نه برای دفاع در برابر مهاجمی که به
 * دستگاه دسترسی دارد — چنین مهاجمی به هر حال به کلِ داده دسترسی دارد.
 */

const USERS = 'users'
const SESSION_KEY = 'sarva-session-v1'

type StoredUser = AuthUser & { passwordHash: string; passwordSalt: string }

export type Role = 'student' | 'teacher' | 'admin'

async function sha256(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

async function hashPassword(password: string, salt: string): Promise<string> {
  return sha256(`${salt}:${password}`)
}

function publicUser(u: StoredUser): AuthUser {
  const { passwordHash: _ph, passwordSalt: _ps, ...rest } = u
  return rest
}

export function currentUserId(): string | null {
  try {
    return localStorage.getItem(SESSION_KEY)
  } catch {
    return null
  }
}

export function currentUser(): AuthUser | null {
  const id = currentUserId()
  if (!id) return null
  const u = db.findOne<StoredUser>(USERS, (r) => r.id === id)
  return u ? publicUser(u) : null
}

function setSession(id: string | null) {
  if (id) localStorage.setItem(SESSION_KEY, id)
  else localStorage.removeItem(SESSION_KEY)
}

/** خلاصهٔ پلاسِ کاربر.
 *
 *  خرید در این برنامه رایگان و بی‌درنگ است — همان‌طور که لازم است، چون
 *  درگاهی در کار نیست. پلاسِ فعالْ قفل‌های محتوایی را برمی‌دارد، و اینجا
 *  هیچ دلیلی ندارد چیزی پشتِ قفل بماند: کلِ محتوا روی دیسکِ خودِ کاربر است. */
export function plusSummaryFor(u: AuthUser | null): PlusSummary {
  if (!u) {
    return {
      state: 'off',
      expiresAt: null,
      expiringSoon: false,
      isTrial: false,
      unreadNotifications: 0,
      unreadTickets: 0
    }
  }
  const sub = db.findOne<{ id: string; userId: string; state: string; expiresAt: string | null }>(
    'plus_subscriptions',
    (r) => r.userId === u.id
  )
  const active = !!sub && sub.state === 'active'
  return {
    state: active ? 'active' : 'free',
    expiresAt: sub?.expiresAt ?? null,
    expiringSoon: false,
    isTrial: false,
    unreadNotifications: db.find('notifications', (r) => r.userId === u.id && !r.readAt).length,
    unreadTickets: 0
  }
}

export function me(): { user: AuthUser | null; plus: PlusSummary } {
  const user = currentUser()
  return { user, plus: plusSummaryFor(user) }
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/[^\d]/g, '')
  if (digits.startsWith('0')) return '98' + digits.slice(1)
  if (digits.startsWith('98')) return digits
  return digits
}

export async function register(input: {
  email?: string | null
  phone?: string | null
  password: string
  fullName?: string | null
  firstName?: string | null
  lastName?: string | null
  grade?: AuthUser['grade']
  role?: Role
}): Promise<{ user: AuthUser } | { error: string }> {
  const email = input.email?.trim().toLowerCase() || null
  const phone = input.phone ? normalizePhone(input.phone) : null

  if (!email && !phone) return { error: 'ایمیل یا شمارهٔ موبایل لازم است.' }
  if (!input.password || input.password.length < 6)
    return { error: 'رمزِ عبور باید دست‌کم ۶ نویسه باشد.' }

  const clash = db.findOne<StoredUser>(
    USERS,
    (r) => (email && r.email === email) || (phone && r.phone === phone)
  )
  if (clash) return { error: 'این ایمیل یا شمارهٔ موبایل قبلاً ثبت شده است.' }

  const salt = db.uid()
  const passwordHash = await hashPassword(input.password, salt)

  const name =
    input.fullName?.trim() ||
    [input.firstName, input.lastName].filter(Boolean).join(' ').trim() ||
    null

  const user: StoredUser = {
    id: db.uid(),
    email,
    phone,
    fullName: name,
    firstName: input.firstName?.trim() || null,
    lastName: input.lastName?.trim() || null,
    avatarUrl: null,
    provinceId: null,
    cityId: null,
    school: null,
    grade: input.grade ?? null,
    role: input.role ?? 'student',
    desiredRole: input.role === 'teacher' ? 'teacher' : 'student',
    emailVerified: true,
    phoneVerified: true,
    profileCompleted: false,
    isBanned: false,
    createdAt: db.nowIso(),
    passwordHash,
    passwordSalt: salt
  }

  db.insert(USERS, user)
  setSession(user.id)
  db.flushNow()
  return { user: publicUser(user) }
}

export async function login(
  identifier: string,
  password: string
): Promise<{ user: AuthUser } | { error: string }> {
  const raw = identifier.trim()
  const email = raw.toLowerCase()
  const phone = normalizePhone(raw)

  const user = db.findOne<StoredUser>(USERS, (r) => r.email === email || r.phone === phone)
  if (!user) return { error: 'حسابی با این مشخصات پیدا نشد.' }

  const hash = await hashPassword(password, user.passwordSalt)
  if (hash !== user.passwordHash) return { error: 'رمزِ عبور درست نیست.' }

  setSession(user.id)
  return { user: publicUser(user) }
}

export function logout(): void {
  setSession(null)
}

export function updateProfile(patch: Partial<AuthUser>): AuthUser | null {
  const id = currentUserId()
  if (!id) return null
  const updated = db.update<StoredUser>(USERS, id, patch as Partial<StoredUser>)
  return updated ? publicUser(updated) : null
}

/** نخستین مدیر: اگر هیچ حسابی نیست، یک حسابِ آماده می‌سازیم.
 *
 *  روی سرور این کار را `scripts/seed-admin.mjs` می‌کرد. اینجا همان نقش را
 *  دارد تا پنلِ مدیریت از همان راه‌اندازیِ اول در دسترس باشد. */
export async function ensureBootstrapAdmin(): Promise<void> {
  if (db.count(USERS) > 0) return
  await register({
    email: 'admin@sarva.local',
    password: 'sarva-admin',
    fullName: 'مدیر سروا',
    role: 'admin'
  })
  logout()
}

/** خریدِ پلاس — در این نسخه رایگان و بی‌درنگ.
 *
 *  همان مسیرِ سایت طی می‌شود (`/api/v1/plus/checkout` بعد
 *  `/api/v1/plus/orders/:id/pay`) تا صفحهٔ خرید دست‌نخورده بماند؛ فقط
 *  درگاهی در میان نیست که منتظرش بمانیم. */
export function grantPlus(userId: string, days: number | null = null): string {
  const existing = db.findOne<{ id: string; userId: string }>(
    'plus_subscriptions',
    (r) => r.userId === userId
  )
  const expiresAt = days === null ? null : new Date(Date.now() + days * 86_400_000).toISOString()

  if (existing) {
    db.update('plus_subscriptions', existing.id, {
      state: 'active',
      expiresAt,
      source: 'purchase',
      grantedAt: db.nowIso()
    })
    return existing.id
  }

  return db.insert('plus_subscriptions', {
    id: db.uid(),
    userId,
    state: 'active',
    expiresAt,
    source: 'purchase',
    grantedAt: db.nowIso()
  }).id
}

export function isAdmin(): boolean {
  const u = currentUser()
  return !!u && (u.role === 'admin' || u.role === 'teacher')
}
