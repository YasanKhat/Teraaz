import * as db from '@/platform/db'
import * as auth from '@/platform/auth'
import type { ClubComment, ClubPost, ClubPostForm, ClubStatus } from './types'

/**
 * پرس‌وجوهای سروا کلاب — بازنوشته روی داده‌ی محلی.
 *
 * امضاها همان است که روی وب بود، پس `ClubPanel` و فهرستِ کلاب دست‌نخورده
 * کار می‌کنند. تنها تفاوتِ معنادار: چون کلاب در این نسخه تک‌نفره است،
 * `likedByMe` و `isMine` از روی حسابِ محلیِ همین دستگاه حساب می‌شوند.
 */

export const FEED_PAGE_SIZE = 12

export type ClubViewer = { id: string; name: string } | null

export async function getClubViewer(): Promise<ClubViewer> {
  const user = auth.currentUser()
  return user ? { id: user.id, name: user.fullName ?? user.email ?? 'کاربر سروا' } : null
}

export type FeedOptions = {
  sort?: string
  form?: string | null
  tag?: string | null
  page?: number
}

export async function getClubFeed(
  viewer: ClubViewer,
  options: FeedOptions = {}
): Promise<{ posts: ClubPost[]; hasMore: boolean }> {
  void viewer
  const sort = options.sort === 'popular' || options.sort === 'discussed' ? options.sort : 'recent'
  const page = Math.max(0, Math.floor(options.page ?? 0))

  let rows = db.find<Record<string, unknown>>('club_posts', () => true)
  if (options.form) rows = rows.filter((r) => r.form === options.form)
  if (options.tag) rows = rows.filter((r) => Array.isArray(r.tags) && (r.tags as string[]).includes(options.tag!))

  rows = [...rows].sort((a, b) =>
    sort === 'popular'
      ? Number(b.likes ?? 0) - Number(a.likes ?? 0)
      : sort === 'discussed'
        ? Number(b.comments ?? 0) - Number(a.comments ?? 0)
        : String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''))
  )

  const slice = rows.slice(page * FEED_PAGE_SIZE, (page + 1) * FEED_PAGE_SIZE)
  return {
    posts: slice.map((r) => toClubPost(r, auth.currentUserId())),
    hasMore: (page + 1) * FEED_PAGE_SIZE < rows.length
  }
}

export async function getClubPost(id: string, viewer: ClubViewer): Promise<ClubPost | null> {
  void viewer
  const row = db.findOne<Record<string, unknown>>('club_posts', (r) => r.id === id)
  return row ? toClubPost(row, auth.currentUserId()) : null
}

export async function getClubComments(postId: string, viewer: ClubViewer): Promise<ClubComment[]> {
  void viewer
  return db
    .find<Record<string, unknown>>('club_comments', (r) => r.postId === postId)
    .sort((a, b) => String(a.createdAt ?? '').localeCompare(String(b.createdAt ?? '')))
    .map<ClubComment>((r) => ({
      id: String(r.id ?? ''),
      postId: String(r.postId ?? ''),
      parentId: (r.parentId as string) ?? null,
      replyToId: (r.replyToId as string) ?? null,
      authorName: String(r.authorName ?? 'کاربر سروا'),
      body: String(r.body ?? ''),
      status: 'approved' as ClubStatus,
      createdAt: String(r.createdAt ?? '')
    }))
}

export async function getMyPosts(viewer: ClubViewer): Promise<ClubPost[]> {
  if (!viewer) return []
  return db
    .find<Record<string, unknown>>('club_posts', (r) => r.userId === viewer.id)
    .sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')))
    .map((r) => toClubPost(r, viewer.id))
}

export type MyComment = ClubComment & { postTitle: string | null; postExcerpt: string }

export async function getMyComments(viewer: ClubViewer): Promise<MyComment[]> {
  if (!viewer) return []
  return db
    .find<Record<string, unknown>>('club_comments', (r) => r.userId === viewer.id)
    .map((r) => {
      const post = db.findOne<{ id: string; title?: string; body?: string }>(
        'club_posts',
        (p) => p.id === String(r.postId)
      )
      const comment: ClubComment = {
        id: String(r.id ?? ''),
        postId: String(r.postId ?? ''),
        parentId: (r.parentId as string) ?? null,
        replyToId: (r.replyToId as string) ?? null,
        authorName: String(r.authorName ?? ''),
        body: String(r.body ?? ''),
        status: 'approved' as ClubStatus,
        createdAt: String(r.createdAt ?? '')
      }
      return {
        ...comment,
        postTitle: post?.title ?? null,
        postExcerpt: (post?.body ?? '').slice(0, 80)
      }
    })
}

export async function getClubStats(): Promise<{ poems: number; poets: number; comments: number }> {
  const posts = db.find<{ userId?: string }>('club_posts', () => true)
  return {
    poems: posts.length,
    poets: new Set(posts.map((p) => p.userId ?? '')).size,
    comments: db.count('club_comments')
  }
}

export async function getMyLikedPosts(viewer: ClubViewer): Promise<ClubPost[]> {
  if (!viewer) return []
  const liked = db.find<{ postId: string }>('club_likes', (r) => r.userId === viewer.id)
  return liked.flatMap((l) => {
    const row = db.findOne<Record<string, unknown>>('club_posts', (r) => r.id === l.postId)
    return row ? [toClubPost(row, viewer.id)] : []
  })
}

function toClubPost(row: Record<string, unknown>, me: string | null): ClubPost {
  const createdAt = String(row.createdAt ?? new Date().toISOString())
  return {
    id: String(row.id ?? ''),
    authorName: row.anonymous ? String(row.alias ?? 'بی‌نام') : String(row.authorName ?? 'کاربر سروا'),
    isAnonymous: !!row.anonymous,
    isMine: !!me && row.userId === me,
    title: (row.title as string) ?? null,
    body: String(row.body ?? ''),
    form: (row.form as ClubPostForm) ?? 'other',
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    meter: (row.meter as string) ?? null,
    status: (row.status as ClubStatus) ?? 'approved',
    reviewNote: (row.reviewNote as string) ?? null,
    featured: !!row.featured,
    likeCount: Number(row.likes ?? 0),
    commentCount: Number(row.comments ?? 0),
    likedByMe: !!me && db.findOne('club_likes', (r) => r.postId === row.id && r.userId === me) !== null,
    publishedAt: createdAt,
    createdAt,
    updatedAt: String(row.updatedAt ?? createdAt)
  }
}
