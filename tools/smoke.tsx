/* اجرای آزمون دودی: هر صفحه را یک‌بار رندر می‌کند تا خطاهای زمان اجرا پیدا شوند */
import { renderToString } from 'react-dom/server'
import { Home } from '../src/renderer/src/pages/Home'
import { Chapters } from '../src/renderer/src/pages/Chapters'
import { Chapter } from '../src/renderer/src/pages/Chapter'
import { Bank } from '../src/renderer/src/pages/Bank'
import { Archive } from '../src/renderer/src/pages/Archive'
import { Progress } from '../src/renderer/src/pages/Progress'
import { Recap } from '../src/renderer/src/pages/Recap'
import { Quiz } from '../src/renderer/src/pages/Quiz'
import { Settings } from '../src/renderer/src/pages/Settings'
import { LessonExperience } from '../src/renderer/src/pages/LessonExperience'

const mem = new Map<string, string>()
;(globalThis as any).localStorage = {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => void mem.set(k, v),
  removeItem: (k: string) => void mem.delete(k),
  clear: () => mem.clear()
}
;(globalThis as any).window = {
  location: { hash: '' },
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => {},
  matchMedia: () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }),
  setTimeout: (fn: any, t: number) => setTimeout(fn, t)
}

async function main() {
  const pages: [string, any, any][] = [
    ['Home', Home, {}],
    ['Chapters', Chapters, {}],
    ['Chapter', Chapter, { id: '2' }],
    ['Bank', Bank, { id: '4' }],
    ['Bank(ch)', Bank, { id: 'ch2' }],
    ['Archive', Archive, { tab: 'figures' }],
    ['Progress', Progress, {}],
    ['Recap', Recap, { id: '3' }],
    ['Quiz', Quiz, {}],
    ['Settings', Settings, {}],
    ['LessonFilm', LessonExperience, { id: '3' }]
  ]
  let fail = 0
  const expect = (cond: boolean, msg: string) => {
    if (!cond) {
      fail++
      console.log(`FAIL ${msg}`)
    }
  }
  for (const [name, Comp, props] of pages) {
    try {
      const html = renderToString(<Comp {...props} />)
      const flat = html.replace(/<!-- -->/g, '')
      console.log(`ok   ${name.padEnd(10)} ${html.length} bytes`)
      if (name === 'Bank') {
        const cards = (html.match(/class="bank-card/g) ?? []).length
        expect(cards === 59, `Bank(درس ۴) باید ۵۹ کارت بسازد، ساخت: ${cards}`)
        expect(flat.includes('درست / نادرست'), 'Bank(درس ۴) باید برچسب نوع سؤال داشته باشد')
        expect(flat.includes('درس ۴'), 'Bank(درس ۴) باید نشان درس ۴ را داشته باشد')
      }
      if (name === 'Bank(ch)') {
        const cards = (html.match(/class="bank-card/g) ?? []).length
        expect(cards === 120, `Bank(پردهٔ ۲) باید ۱۲۰ کارت بسازد، ساخت: ${cards}`)
        expect(flat.includes('پردهٔ ۲'), 'Bank(پردهٔ ۲) باید عنوان پرده را داشته باشد')
      }
      if (name === 'Home') expect(flat.includes('سؤال‌ها'), 'خانه باید پیوند سؤال‌ها را داشته باشد')
    } catch (e: any) {
      fail++
      console.log(`FAIL ${name}: ${e?.message?.slice(0, 300)}`)
    }
  }
  console.log(fail ? `${fail} آزمون شکست خورد` : 'همهٔ صفحه‌ها سالم رندر شدند')
  process.exit(fail ? 1 : 0)
}
main()
