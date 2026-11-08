/**
 * جایگزینِ توابعِ Next.js که در کدِ اصلی صدا زده می‌شدند.
 *
 * `revalidatePath` / `revalidateTag` روی سرور حافظهٔ کشِ صفحه را خالی
 * می‌کردند تا کاربر تغییرش را بلافاصله ببیند. اینجا صفحه‌ای که از پیش ساخته
 * شده باشد وجود ندارد: state در خودِ کامپوننت است و پس از هر عمل، لیست دوباره
 * خوانده می‌شود. پس این تابع‌ها هیچ کاری نمی‌کنند — اما باید **تعریف** باشند،
 * وگرنه کدِ اصلی هنگام صدا زدنشان با ReferenceError می‌افتاد.
 */

type Global = typeof globalThis & {
  revalidatePath?: (path: string, type?: string) => void
  revalidateTag?: (tag: string) => void
  redirect?: (url: string) => void
  notFound?: () => never
  unstable_noStore?: () => void
}

export function installNextShims(): void {
  const g = globalThis as Global
  // بی‌صدا: در SPA هر تغییرِ داده با رِندرِ دوباره دیده می‌شود.
  if (typeof g.revalidatePath !== 'function') g.revalidatePath = () => {}
  if (typeof g.revalidateTag !== 'function') g.revalidateTag = () => {}
  if (typeof g.unstable_noStore !== 'function') g.unstable_noStore = () => {}

  /* مسیریابی در اینجا با `redirect` جابه‌جا نمی‌شود (روی سرور یک استثنای
     خاص می‌انداخت)؛ کامپوننت‌ها از `useNavigate` خودشان استفاده می‌کنند. پس
     این دو فقط هشدار می‌دهند که اگر جایی جا مانده، در کنسول دیده شود. */
  if (typeof g.redirect !== 'function') {
    g.redirect = (url: string) => {
      history.pushState(null, '', url)
      dispatchEvent(new HashChangeEvent('hashchange'))
    }
  }
  if (typeof g.notFound !== 'function') {
    g.notFound = () => {
      history.pushState(null, '', '/#/404')
      dispatchEvent(new HashChangeEvent('hashchange'))
      return undefined as never
    }
  }
}
