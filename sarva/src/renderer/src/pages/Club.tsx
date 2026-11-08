import { useEffect, useState } from 'react'
import { useSearchParams } from '@/app/router'
import ClubFeed from '@/components/UI/club/ClubFeed'
import ClubHero from '@/components/UI/club/ClubHero'
import FeedPagination from '@/components/UI/club/FeedPagination'
import { getClubFeed, getClubStats, getClubViewer, type ClubViewer } from '@/lib/club/queries'
import { POST_FORMS, POST_TAGS, type ClubFeedSort, type ClubPost } from '@/lib/club/types'
import { parseFeedPage, type FeedQuery } from '@/lib/club/feed-url'

/**
 * سروا کلاب.
 *
 * همان `app/sarvaclub/page.tsx` با یک تفاوت: کوئری‌ها به‌جای سرور از فروشگاهِ
 * محلی خوانده می‌شوند (`lib/club/queries.ts`) و `searchParams` به‌جای نوارِ
 * آدرس از هش می‌آید. بقیه — قهرمانِ صفحه، فیلترِ قالب و موضوع، شمارهٔ صفحه،
 * کلیدِ رِندرِ ساخته‌شده از خودِ فیلترها — عیناً همان است.
 *
 * روی وب این یک انجمنِ چندکاربره بود: سروده‌ها روی سرور می‌نشستند و بقیه
 * زیرشان می‌نوشتند. در یک برنامهٔ تک‌نفره آن معنا ندارد، پس کلاب عملاً
 * «دفترچهٔ سروده‌ها»ست: همان کارت‌ها، همان امکانِ فرستادن با نام یا بی‌نام،
 * با این تفاوت که خواننده‌اش خودت هستی.
 */

type Stats = { poems: number; poets: number; comments: number }

/** پارامترهای هش → حالتِ فهرست. هر مقدارِ ناشناخته به پیش‌فرض برمی‌گردد. */
function readQuery(params: URLSearchParams): FeedQuery {
  const sort = params.get('sort')
  const form = params.get('form')
  const tag = params.get('tag')
  return {
    page: parseFeedPage(params.get('page') ?? undefined),
    sort: sort === 'popular' || sort === 'discussed' ? sort : 'recent',
    form: POST_FORMS.some((f) => f.id === form) ? (form as FeedQuery['form']) : undefined,
    tag: POST_TAGS.some((t) => t.id === tag) ? (tag as FeedQuery['tag']) : undefined
  }
}

function queryKey(q: FeedQuery): string {
  return `${q.sort}|${q.form ?? ''}|${q.tag ?? ''}|${q.page}`
}

export default function Club() {
  const search = useSearchParams()
  const query = readQuery(search)
  const [viewer, setViewer] = useState<ClubViewer>(null)
  const [posts, setPosts] = useState<ClubPost[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [stats, setStats] = useState<Stats>({ poems: 0, poets: 0, comments: 0 })
  const [loading, setLoading] = useState(true)

  const { sort, form, tag, page } = query
  const queryKeyString = queryKey(query)

  useEffect(() => {
    let alive = true
    setLoading(true)
    void (async () => {
      const v = await getClubViewer()
      const [feed, s] = await Promise.all([
        getClubFeed(v, { sort, form, tag, page: page - 1 }),
        getClubStats()
      ])
      if (!alive) return
      setViewer(v)
      setPosts(feed.posts)
      setHasMore(feed.hasMore)
      setStats(s)
      setLoading(false)
    })()
    return () => {
      alive = false
    }
  }, [sort, form, tag, page])

  return (
    <div dir="rtl" className="relative z-20 mt-6 mb-32">
      <div className="container mx-auto max-w-6xl px-4">
        <ClubHero signedIn={!!viewer} stats={stats} />
      </div>

      <div className="container mx-auto max-w-3xl px-4">
        {loading ? (
          <div className="flex justify-center py-24" role="status">
            <div className="h-9 w-9 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <>
            {/* کلید عمداً از خودِ فیلترها ساخته می‌شود: با عوض شدنِ مرتب‌سازی یا
                قالب، React باید کامپوننت را از نو بسازد، وگرنه صفحه‌های
                بارگذاری‌شدهٔ فیلترِ قبلی زیرِ فهرستِ تازه می‌چسبند. */}
            <ClubFeed
              key={queryKeyString}
              initialPosts={posts}
              initialHasMore={hasMore}
              viewerName={viewer?.name ?? null}
              filters={{ sort, form, tag }}
              startPage={page - 1}
            />

            {/* لینکِ واقعی: دکمهٔ «سروده‌های بیشتر» بالای این می‌نشیند تا
                تجربه روان‌تر شود، ولی پایه همین است — با آن است که می‌توان
                یک صفحه را نشان کرد یا به عقب برگشت. */}
            <FeedPagination query={query} hasMore={hasMore} />
          </>
        )}
      </div>
    </div>
  )
}

export type { ClubFeedSort }
