import * as db from '@/platform/db'
import * as auth from '@/platform/auth'
import { POST_FORMS, POST_TAGS, type ClubPostForm } from './types'

/**
 * کنش‌های سروا کلاب — بازنوشته برای یک برنامهٔ تک‌نفره.
 *
 * امضاها همان است که روی وب بود (`ActionResult<T>`، همان نامِ تابع‌ها)، پس
 * `PoemComposer`, `LikeButton`, `CommentThread`, `ReportDialog` و `PoemActions`
 * دست‌نخورده کار می‌کنند.
 *
 * آنچه عوض شده: «بررسی پیش از انتشار» که روی سرور با مدیر بود، اینجا معنا
 * ندارد — سروده همان لحظه منتشر می‌شود. و «گزارش» به‌جای این‌که برای مدیر
 * برود، در جدولِ محلی می‌نشیند تا خودت بعداً ببینیش.
 */

export type ActionResult<T = null> = { ok: true; data: T } | { ok: false; errors: string[] }

export type PostInput = {
  title?: string
  body: string
  form: string
  tags?: string[]
  meter?: string
  isAnonymous?: boolean
  alias?: string
}

const MAX_BODY = 4000
const MAX_TITLE = 120
const MAX_TAGS = 5

function validate(input: PostInput): { valid: true; clean: Required<Pick<PostInput, 'body' | 'form'>> & PostInput } | { valid: false; errors: string[] } {
  const errors: string[] = []

  const body = (input.body ?? '').trim()
  if (!body) errors.push('متنِ سروده نمی‌تواند خالی باشد.')
  if (body.length > MAX_BODY) errors.push(`سروده نمی‌تواند بلندتر از ${MAX_BODY} نویسه باشد.`)

  const title = (input.title ?? '').trim()
  if (title.length > MAX_TITLE) errors.push('عنوان بیش از حد بلند است.')

  const form = POST_FORMS.some((f) => f.id === input.form) ? input.form : 'other'
  const tags = (input.tags ?? []).filter((t) => POST_TAGS.some((x) => x.id === t)).slice(0, MAX_TAGS)

  if (errors.length) return { valid: false, errors }
  return { valid: true, clean: { ...input, body, title, form, tags } }
}

export async function createClubPost(input: PostInput): Promise<ActionResult<{ id: string }>> {
  const user = auth.currentUser()
  if (!user) return { ok: false, errors: ['برای فرستادنِ سروده باید وارد شوی.'] }

  const checked = validate(input)
  if (!checked.valid) return { ok: false, errors: checked.errors }

  const id = db.uid()
  db.insert('club_posts', {
    id,
    userId: user.id,
    authorName: user.fullName ?? user.email ?? 'کاربر سروا',
    title: checked.clean.title || null,
    body: checked.clean.body,
    form: checked.clean.form,
    tags: checked.clean.tags ?? [],
    meter: input.meter ?? null,
    anonymous: !!input.isAnonymous,
    alias: input.alias ?? null,
    likes: 0,
    comments: 0,
    createdAt: db.nowIso(),
    updatedAt: db.nowIso()
  })

  return { ok: true, data: { id } }
}

export async function updateClubPost(id: string, input: PostInput): Promise<ActionResult<null>> {
  const user = auth.currentUser()
  if (!user) return { ok: false, errors: ['وارد نشده‌ای.'] }

  const post = db.findOne<{ id: string; userId: string }>('club_posts', (r) => r.id === id)
  if (!post || post.userId !== user.id) return { ok: false, errors: ['این سروده مالِ تو نیست.'] }

  const checked = validate(input)
  if (!checked.valid) return { ok: false, errors: checked.errors }

  db.update('club_posts', id, {
    title: checked.clean.title || null,
    body: checked.clean.body,
    form: checked.clean.form as ClubPostForm,
    tags: checked.clean.tags ?? [],
    meter: input.meter ?? null,
    anonymous: !!input.isAnonymous,
    updatedAt: db.nowIso()
  })

  return { ok: true, data: null }
}

export async function deleteClubPost(id: string): Promise<ActionResult<null>> {
  const user = auth.currentUser()
  if (!user) return { ok: false, errors: ['وارد نشده‌ای.'] }

  const removed = db.remove('club_posts', (r) => r.id === id && r.userId === user.id)
  if (!removed) return { ok: false, errors: ['این سروده پیدا نشد.'] }
  return { ok: true, data: null }
}

export async function createClubComment(
  postId: string,
  body: string,
  parentId: string | null = null
): Promise<ActionResult<{ id: string }>> {
  const user = auth.currentUser()
  if (!user) return { ok: false, errors: ['برای نوشتنِ دیدگاه باید وارد شوی.'] }

  const text = (body ?? '').trim()
  if (!text) return { ok: false, errors: ['دیدگاه نمی‌تواند خالی باشد.'] }
  if (text.length > 1200) return { ok: false, errors: ['دیدگاه بیش از حد بلند است.'] }

  const id = db.uid()
  db.insert('club_comments', {
    id,
    postId,
    userId: user.id,
    authorName: user.fullName ?? user.email ?? 'کاربر سروا',
    body: text,
    parentId: parentId ?? null,
    createdAt: db.nowIso()
  })

  const post = db.findOne<{ id: string; comments: number }>('club_posts', (r) => r.id === postId)
  if (post) db.update('club_posts', postId, { comments: Number(post.comments ?? 0) + 1 })

  return { ok: true, data: { id } }
}

export async function deleteClubComment(id: string, postId: string): Promise<ActionResult<null>> {
  const user = auth.currentUser()
  if (!user) return { ok: false, errors: ['وارد نشده‌ای.'] }

  const removed = db.remove('club_comments', (r) => r.id === id && r.userId === user.id)
  if (!removed) return { ok: false, errors: ['این دیدگاه پیدا نشد.'] }
  return { ok: true, data: null }
}

export async function toggleClubLike(postId: string): Promise<ActionResult<{ liked: boolean }>> {
  const user = auth.currentUser()
  if (!user) return { ok: false, errors: ['برای پسندیدن باید وارد شوی.'] }

  const existing = db.findOne<{ id: string }>(
    'club_likes',
    (r) => r.postId === postId && r.userId === user.id
  )

  if (existing) {
    db.remove('club_likes', (r) => r.id === existing.id)
    bumpLikes(postId, -1)
    return { ok: true, data: { liked: false } }
  }

  db.insert('club_likes', { id: db.uid(), postId, userId: user.id, createdAt: db.nowIso() })
  bumpLikes(postId, 1)
  return { ok: true, data: { liked: true } }
}

function bumpLikes(postId: string, delta: number) {
  const post = db.findOne<{ id: string; likes: number }>('club_posts', (r) => r.id === postId)
  if (post) db.update('club_posts', postId, { likes: Math.max(0, Number(post.likes ?? 0) + delta) })
}

export async function reportClubContent(
  kind: 'post' | 'comment',
  targetId: string,
  reason: string,
  detail?: string
): Promise<ActionResult<null>> {
  db.insert('reports', {
    id: db.uid(),
    userId: auth.currentUserId() ?? 'guest',
    section: `club-${kind}`,
    reason,
    target: targetId,
    detail: detail ?? '',
    createdAt: db.nowIso()
  })
  return { ok: true, data: null }
}
