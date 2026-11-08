import { useEffect, useState } from 'react'
import { Link } from '@/app/router'
import * as db from '@/platform/db'

import HomePanel from '@/components/UI/panel/HomePanel'
import AruzPanel from '@/components/UI/panel/AruzPanel'
import VocabPanel from '@/components/UI/panel/VocabPanel'
import RangAraPanel from '@/components/UI/panel/RangAraPanel'
import ExamPanel from '@/components/UI/panel/ExamPanel'
import AllBookmarks from '@/components/UI/panel/AllBookmarks'
import ClubPanel from '@/components/UI/panel/ClubPanel'
import PanelPageHeader from '@/components/UI/panel/PanelPageHeader'

/**
 * زیرصفحه‌های پنل.
 *
 * این فایل جانشینِ شانزده پوشهٔ `app/panel/*`ِ Next است. هر صفحه در نسخهٔ
 * اصلی یک تابعِ `async` روی سرور بود که چند کوئری می‌زد و نتیجه را به یک
 * کامپوننت می‌داد؛ اینجا همان کوئری‌ها صدا زده می‌شوند (از فروشگاهِ محلی)
 * و همان کامپوننت‌ها رندر می‌شوند — فقط نتیجه بعد از آماده‌شدن می‌رسد، پس
 * تا آن لحظه یک نشانِ بارگذاری نشان می‌دهیم تا پنل نیمه‌کاره دیده نشود.
 */

export type PanelRouteProps = { userId: string }

/** تا داده نیامده چه نشان بدهیم: همان اسپینرِ خودِ پنل. */
function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" role="status">
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  )
}

function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 text-sm leading-7 text-muted-foreground">
      <h2 className="mb-2 text-base font-bold text-foreground">{title}</h2>
      {children}
    </div>
  )
}

/**
 * یک نگه‌دار برای هر صفحه: داده را می‌گیرد، بارگذاری را نشان می‌دهد و اگر
 * جایی از لایهٔ داده هنوز به پایگاهِ سروری وصل بود، به‌جایِ سفید کردنِ پنل
 * یک توضیح نشان می‌دهد.
 *
 * ⚠️ چرا این لازم است: بعضی کتابخانه‌های پلاس و دبیر هنوز به `@/lib/db`
 * وصل‌اند (که در این برنامه فقط یک استاب است و پیام می‌دهد). بی‌این نگه‌دار،
 * یک استثنا در یکی از آن‌ها کلِ پنل را سفید می‌کرد.
 */
async function safe<T>(load: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await load()
  } catch (error) {
    console.error('panel:', error)
    return fallback
  }
}

/* ═══════════════════════════════════════════════════════════════════ خانه */

function PanelHome({ userId }: PanelRouteProps) {
  const [state, setState] = useState<{ overview: unknown; user: { fullName: string; createdAt: string } | null } | null>(null)

  useEffect(() => {
    let alive = true
    void (async () => {
      const { getPanelOverview, getPanelUser } = await import('@/lib/panel/queries')
      const [overview, user] = await Promise.all([
        safe(() => getPanelOverview(userId), null),
        safe(() => getPanelUser(), null)
      ])
      if (alive && overview) {
        setState({
          overview,
          user: user ? { fullName: user.fullName, createdAt: user.createdAt } : null
        })
      }
    })()
    return () => {
      alive = false
    }
  }, [userId])

  if (!state) return <Loading />
  return (
    <HomePanel
      name={state.user?.fullName ?? 'کاربر سروا'}
      memberSince={state.user?.createdAt ?? ''}
      overview={state.overview}
      todayPlan={null}
    />
  )
}

/* ═══════════════════════════════════════════════════════════════════ عروض */

function PanelAruz({ userId }: PanelRouteProps) {
  const [data, setData] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    let alive = true
    void (async () => {
      const q = await import('@/lib/panel/queries')
      const { toSkillTiles } = await import('@/lib/panel/skills')
      const [page, summary, dayCounts, bookmarks, weights] = await Promise.all([
        safe(() => q.getAruzAttempts(userId, 0, 5), { attempts: [], hasMore: false }),
        safe(() => q.getAruzSummary(userId), { attempts: 0, best: 0, questions: 0, correct: 0 }),
        safe(() => q.getAruzDayCounts(userId), []),
        safe(() => q.getBookmarks(userId, 'aruz'), []),
        safe(() => q.getAruzWeightAnswers(userId), [])
      ])
      if (alive) {
        setData({ page, summary, dayCounts, bookmarks, weights: toSkillTiles(weights) })
      }
    })()
    return () => {
      alive = false
    }
  }, [userId])

  if (!data) return <Loading />
  return (
    <AruzPanel
      initialAttempts={(data.page as { attempts: unknown[] }).attempts}
      initialHasMore={(data.page as { hasMore: boolean }).hasMore}
      summary={data.summary}
      dayCounts={data.dayCounts}
      bookmarks={data.bookmarks}
      weights={data.weights}
    />
  )
}

/* ═══════════════════════════════════════════════════════════════════ واژه */

function PanelVocab({ userId }: PanelRouteProps) {
  const [data, setData] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    let alive = true
    void (async () => {
      const q = await import('@/lib/panel/queries')
      const [page, summary, bookmarks, lessonWords, lessonTotals] = await Promise.all([
        safe(() => q.getVocabAnswers(userId, 0, 150), { answers: [], hasMore: false }),
        safe(() => q.getVocabSummary(userId), []),
        safe(() => q.getBookmarks(userId, 'vocab'), []),
        safe(() => q.getVocabLessonWords(userId), []),
        safe(() => q.getVocabLessonTotals(), [])
      ])
      if (alive) setData({ page, summary, bookmarks, lessonWords, lessonTotals })
    })()
    return () => {
      alive = false
    }
  }, [userId])

  if (!data) return <Loading />
  return (
    <VocabPanel
      initialAnswers={(data.page as { answers: unknown[] }).answers}
      initialHasMore={(data.page as { hasMore: boolean }).hasMore}
      history={data.summary}
      bookmarks={data.bookmarks}
      lessonWords={data.lessonWords}
      lessonTotals={data.lessonTotals}
    />
  )
}

/* ═════════════════════════════════════════════════════════════════ رنگ‌آرا */

function PanelRangAra({ userId }: PanelRouteProps) {
  const [data, setData] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    let alive = true
    void (async () => {
      const q = await import('@/lib/panel/queries')
      const { toSkillTiles } = await import('@/lib/panel/skills')
      const { CONCEPTS } = await import('@/lib/rang-ara/content')
      const [answers, totals] = await Promise.all([
        safe(() => q.getRangAraAnswers(userId), []),
        safe(() => q.getRangAraLessonTotals(), [])
      ])
      if (alive) {
        setData({
          answers: answers as Record<string, unknown>[],
          totals,
          tiles: toSkillTiles(answers, Object.values(CONCEPTS).map((c: { id: string; label: string }) => ({ key: c.id, label: c.label })))
        })
      }
    })()
    return () => {
      alive = false
    }
  }, [userId])

  if (!data) return <Loading />
  const answers = data.answers as Record<string, unknown>[]
  return (
    <RangAraPanel
      tiles={data.tiles}
      plays={[]}
      lessons={(data.totals as { grade: string; lesson: number; verses: number }[]).map((t) => ({
        grade: t.grade,
        lesson: t.lesson,
        verses: t.verses,
        played: 0,
        steps: 0,
        clean: 0
      }))}
      history={answers.map((a) => ({ at: String(a.answeredAt ?? ''), ok: !!(a.isCorrect ?? a.correct) }))}
    />
  )
}

/* ═════════════════════════════════════════════════════════════════ امتحان */

function PanelExam({ userId }: PanelRouteProps) {
  const [data, setData] = useState<{ attempts: unknown[] } | null>(null)

  useEffect(() => {
    let alive = true
    void (async () => {
      const q = await import('@/lib/panel/queries')
      const attempts = await safe(() => q.getExamAttempts(userId), [])
      if (alive) setData({ attempts })
    })()
    return () => {
      alive = false
    }
  }, [userId])

  if (!data) return <Loading />
  return <ExamPanel attempts={data.attempts} papers={{}} />
}

/* ════════════════════════════════════════════════════════════ نشان‌شده‌ها */

function PanelBookmarks({ userId }: PanelRouteProps) {
  const [items, setItems] = useState<unknown[] | null>(null)

  useEffect(() => {
    let alive = true
    void (async () => {
      const q = await import('@/lib/panel/queries')
      const all = await safe(() => q.getBookmarks(userId), [])
      if (alive) setItems(all)
    })()
    return () => {
      alive = false
    }
  }, [userId])

  return (
    <div className="relative z-20 flex flex-col gap-6">
      <PanelPageHeader title="نشان‌شده‌ها" description="بیت‌ها، واژه‌ها و سؤال‌های نشان‌شده." tone="gold" />
      {items ? <AllBookmarks initial={items} /> : <Loading />}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════ کلاب */

function PanelClub() {
  const [data, setData] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    let alive = true
    void (async () => {
      const q = await import('@/lib/club/queries')
      const viewer = await safe(() => q.getClubViewer(), null)
      if (!viewer) {
        if (alive) setData({ viewer: null, posts: [], comments: [], liked: [] })
        return
      }
      const [posts, comments, liked] = await Promise.all([
        safe(() => q.getMyPosts(viewer), []),
        safe(() => q.getMyComments(viewer), []),
        safe(() => q.getMyLikedPosts(viewer), [])
      ])
      if (alive) setData({ viewer, posts, comments, liked })
    })()
    return () => {
      alive = false
    }
  }, [])

  if (!data) return <Loading />
  return (
    <ClubPanel
      viewerName={(data.viewer as { name: string } | null)?.name ?? ''}
      posts={data.posts}
      comments={data.comments}
      liked={data.liked}
    />
  )
}

/* ════════════════════════════════════════════════════ صفحه‌های وابسته به پلاس */

/** پشتیبانی: تیکت‌ها هنوز در لایهٔ محلی نیستند، پس توضیح می‌دهیم. */
function PanelSupport() {
  return (
    <div className="flex flex-col gap-6">
      <PanelPageHeader title="پشتیبانی" description="پرسش‌هایت را اینجا بفرست." tone="sky" />
      <Notice title="تیکت‌ها روی همین دستگاه‌اند">
        پشتیبانی در نسخهٔ وب به یک صندوقِ مشترک وصل بود. در یک برنامهٔ تک‌نفره
        کسی آن طرف نیست که پاسخ بدهد، پس این صفحه چیزی را پنهان نمی‌کند: اگر
        مشکلی دیدی،{' '}
        <a className="text-primary underline underline-offset-4" href="mailto:matinjafaridev@gmail.com">
          matinjafaridev@gmail.com
        </a>{' '}
        بنویس.
      </Notice>
    </div>
  )
}

/** خریدها و اشتراک — پرداخت در این نسخه رایگان و همان‌لحظه است. */
function PanelBilling() {
  const [orders, setOrders] = useState<unknown[]>([])
  useEffect(() => {
    setOrders(db.find('plus_orders', () => true))
  }, [])
  return (
    <div className="flex flex-col gap-6">
      <PanelPageHeader title="خریدهای من" description="صورت‌حسابِ سروا پلاس." tone="sage" />
      {orders.length === 0 ? (
        <Notice title="هنوز خریدی نداری">
          در نسخهٔ دسکتاپ، پلاس رایگان است: از{' '}
          <Link href="/plus" className="text-primary underline underline-offset-4">
            صفحهٔ سروا پلاس
          </Link>{' '}
          فعالش کن.
        </Notice>
      ) : (
        <ul className="flex flex-col gap-2">
          {orders.map((o) => {
            const order = o as { id: string; planId?: string; status?: string; createdAt?: string }
            return (
              <li key={order.id} className="rounded-xl border border-border bg-card p-4 text-sm">
                <span className="font-bold">{order.planId ?? 'سروا پلاس'}</span>
                <span className="mx-2 text-muted-foreground">·</span>
                <span className="text-muted-foreground">{order.status ?? 'پرداخت‌شده'}</span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export default function PanelRoute({ sub, userId }: { sub: string; userId: string }) {
  switch (sub) {
    case '':
    case 'home':
      return <PanelHome userId={userId} />
    case 'aruz':
      return <PanelAruz userId={userId} />
    case 'vocab':
      return <PanelVocab userId={userId} />
    case 'rang-ara':
      return <PanelRangAra userId={userId} />
    case 'exam':
      return <PanelExam userId={userId} />
    case 'bookmarks':
      return <PanelBookmarks userId={userId} />
    case 'club':
      return <PanelClub />
    case 'support':
      return <PanelSupport />
    case 'billing':
      return <PanelBilling />

    /* این‌ها در نسخهٔ اصلی به پایگاهِ سروری وصل بوده‌اند (تحلیلِ پلاس،
       مدرسه و کلاس، دستگاه‌ها). هنوز منتقل نشده‌اند؛ به‌جایِ یک صفحهٔ
       خالی، راستش را می‌گوییم. */
    case 'analysis':
    case 'grammar':
    case 'jasoos':
    case 'subscription':
    case 'setting':
    case 'teacher':
    case 'classes':
      return (
        <Notice title="این بخش هنوز منتقل نشده">
          صفحهٔ{' '}
          <code dir="ltr" className="rounded bg-muted px-1.5 py-0.5 text-xs">
            /panel/{sub}
          </code>{' '}
          در راه است. بقیهٔ پنل — خانه، عروض، واژه، امتحان، نشان‌شده‌ها و کلاب —
          همین حالا با داده‌ی واقعی کار می‌کنند.
        </Notice>
      )

    default:
      return <NotFound />
  }
}

function NotFound() {
  return (
    <Notice title="این صفحه پیدا نشد">
      نشانی‌ای که دنبالش بودی در پنل نیست.{' '}
      <Link href="/panel" className="text-primary underline underline-offset-4">
        برگشت به پنل
      </Link>
    </Notice>
  )
}
