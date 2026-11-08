import * as auth from '@/platform/auth'
import type { AuthUser } from './types'

/**
 * کاربرِ فعلی، برای کدِ «سمتِ سرور»ِ سروا.
 *
 * روی وب این ماژول نشست را از کوکی می‌خواند و با `server-only` قفل بود. در
 * اینجا همان امضاها را دارد اما از `platform/auth` می‌خواند — یعنی همان
 * حسابی که روی این دستگاه ساخته شده.
 *
 * تفاوتِ معنادار: `requireUser`/`requireAdmin`/`requireTeacher` روی وب ۴۰۱
 * می‌دادند و صفحه به `/auth` می‌فرستاد. اینجا هم همان استثنا را می‌اندازند
 * تا رفتارِ اجزا یکی بماند، ولی در عمل مدیر همیشه در دسترس است چون حسابِ
 * پیش‌فرض ساخته می‌شود.
 */

export class AuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthError'
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  return auth.currentUser()
}

export async function reissuedAccessToken(user: AuthUser): Promise<string | null> {
  void user
  // توکنی در کار نیست — نشست روی همین دستگاه است.
  return null
}

export async function requireUser(): Promise<AuthUser> {
  const user = auth.currentUser()
  if (!user) throw new AuthError('برای این بخش باید وارد شوی.')
  return user
}

export async function requireAdmin(): Promise<AuthUser> {
  const user = auth.currentUser()
  if (!user || (user.role !== 'admin' && user.role !== 'teacher')) {
    throw new AuthError('دسترسیِ مدیریت نداری.')
  }
  return user
}

export async function requireTeacher(): Promise<AuthUser> {
  const user = auth.currentUser()
  if (!user || user.role === 'student') throw new AuthError('دسترسیِ دبیر نداری.')
  return user
}
