import { apiGet } from '@/lib/api/client'
import { POST_FORMS, POST_TAGS, type ClubPost, type ClubPostForm } from '@/lib/club/types'
import * as auth from '@/platform/auth'
import * as db from '@/platform/db'

/**
 * سروا کلاب — صفحه‌های بعدیِ فهرست.
 *
 * روی وب این یک Server Action بود و از `getClubFeed` می‌خواند. اینجا همان
 * امضا را دارد و از `/api/v1/club/posts` می‌خواند.
 *
 * ⚠️ همان قاعده‌ی سرور اینجا هم رعایت شده: فیلترها **پیش از** استفاده
 * پالوده می‌شوند. این یک endpoint است، نه یک تابعِ خصوصی — هر کسی می‌تواند
 * مستقیم صدایش بزند، پس نباید به این تکیه کرد که فراخوان همان کامپوننت است.
 */

export type FeedOptions = {
  sort?: string
  form?: string | null
  tag?: string | null
  page?: number
}

export async function loadMoreClubPosts(
  options: FeedOptions
): Promise<{ posts: ClubPost[]; hasMore: boolean }> {
  const sort = options.sort === 'popular' || options.sort === 'discussed' ? options.sort : 'recent'
  const form = POST_FORMS.some((f) => f.id === options.form) ? options.form : undefined
  const tag = POST_TAGS.some((t) => t.id === options.tag) ? options.tag : undefined
  const page = Number.isFinite(options.page)
    ? Math.min(500, Math.max(0, Math.floor(options.page ?? 0)))
    : 0

  const params = new URLSearchParams({ sort })
  if (form) params.set('form', form)
  if (tag) params.set('tag', tag)
  params.set('page', String(page))

  const result = await apiGet<{ posts: Record<string, unknown>[] }>(
    `/api/v1/club/posts?${params.toString()}`
  )
  if (!result.ok) return { posts: [], hasMore: false }

  const me = auth.currentUserId()
  const posts = result.data.posts.map((row) => toClubPost(row, me))
  return { posts, hasMore: false }
}

function toClubPost(row: Record<string, unknown>, me: string | null): ClubPost {
  const createdAt = String(row.createdAt ?? new Date().toISOString())
  return {
    id: String(row.id ?? ''),
    authorName: row.anonymous ? 'بی‌نام' : String(row.authorName ?? 'کاربر سروا'),
    isAnonymous: !!row.anonymous,
    isMine: !!me && row.userId === me,
    title: (row.title as string) ?? null,
    body: String(row.body ?? ''),
    form: ((row.form as ClubPostForm) ?? 'other') as ClubPostForm,
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    meter: (row.meter as string) ?? null,
    status: 'approved',
    reviewNote: null,
    featured: false,
    likeCount: Number(row.likes ?? 0),
    commentCount: Number(row.comments ?? 0),
    likedByMe: false,
    publishedAt: createdAt,
    createdAt,
    updatedAt: createdAt
  }
}

/** سروده‌های خودِ کاربر — برای بخشِ «سروده‌های من» در پنل. */
export function myClubPosts(): ClubPost[] {
  const id = auth.currentUserId()
  if (!id) return []
  return db
    .find<Record<string, unknown>>('club_posts', (r) => r.userId === id)
    .sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')))
    .map((row) => toClubPost(row, id))
}
