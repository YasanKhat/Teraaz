import {
  BadgeCheck,
  Bell,
  CalendarClock,
  CalendarX,
  CircleX,
  ClipboardList,
  CreditCard,
  Eye,
  FilePen,
  Megaphone,
  MessageSquareQuote,
  MessageSquareReply,
  ShieldOff,
  Sparkles,
  UserMinus,
  UserPlus,
  type LucideIcon,
} from "lucide-react";

import type { PlusNotificationKind } from "./types";

/**
 * آیکون و لحنِ هر نوع اعلان — رونوشتِ ماژولِ `961260` در بسته‌یِ زنده‌یِ
 * سایت (باندلِ سربرگِ ۱۲ نوامبر).
 *
 * ⚠️ سایت چند نوع دارد که هنوز در `PlusNotificationKind` نیستند
 * (`admin_message`، `report_resolved` و چهار نوعِ `forum_*`). آن‌ها اینجا
 * نگه داشته شده‌اند تا اگر روزی از راه برسند بی‌نام نمانند؛ `kindOf` برای
 * هرچه نشناسد به زنگوله و لحنِ خنثی برمی‌گردد.
 */

export type NotificationTone = "plus" | "support" | "school" | "warn" | "neutral";

export type NotificationKindStyle = { icon: LucideIcon; tone: NotificationTone };

/** رنگِ آیکون و زمینه‌اش برای هر لحن — کلاس‌هایِ تیلویند، برابرِ سایت. */
export const NOTIFICATION_TONE: Record<NotificationTone, string> = {
  plus: "text-gold-ink bg-gold/15",
  support: "text-primary bg-primary/12",
  school:
    "text-[oklch(0.5_0.13_265)] bg-[oklch(0.6_0.13_265/0.12)] dark:text-[oklch(0.78_0.1_265)]",
  warn: "text-[oklch(0.55_0.14_45)] bg-[oklch(0.7_0.14_60/0.15)] dark:text-[oklch(0.8_0.12_60)]",
  neutral: "text-muted-foreground bg-foreground/[0.06]",
};

export const NOTIFICATION_KINDS: Record<string, NotificationKindStyle> = {
  plus_activated: { icon: Sparkles, tone: "plus" },
  plus_renewed: { icon: Sparkles, tone: "plus" },
  plus_expiring: { icon: CalendarClock, tone: "warn" },
  plus_expired: { icon: CalendarX, tone: "warn" },
  plus_revoked: { icon: ShieldOff, tone: "warn" },
  payment_action_needed: { icon: CreditCard, tone: "warn" },
  ticket_reply: { icon: MessageSquareReply, tone: "support" },
  teacher_approved: { icon: BadgeCheck, tone: "school" },
  teacher_rejected: { icon: CircleX, tone: "warn" },
  teacher_needs_revision: { icon: FilePen, tone: "warn" },
  teacher_revoked: { icon: ShieldOff, tone: "warn" },
  teacher_viewed_student: { icon: Eye, tone: "school" },
  teacher_feedback: { icon: MessageSquareQuote, tone: "school" },
  teacher_assignment: { icon: ClipboardList, tone: "school" },
  class_joined: { icon: UserPlus, tone: "school" },
  class_removed: { icon: UserMinus, tone: "neutral" },
  welcome: { icon: Sparkles, tone: "support" },
  admin_message: { icon: Megaphone, tone: "support" },
  report_resolved: { icon: BadgeCheck, tone: "support" },
  forum_reply: { icon: MessageSquareReply, tone: "support" },
  forum_mention: { icon: MessageSquareQuote, tone: "support" },
  forum_accepted: { icon: BadgeCheck, tone: "plus" },
  forum_moderation: { icon: ClipboardList, tone: "neutral" },
  forum_followed: { icon: Bell, tone: "neutral" },
};

export function kindOf(kind: PlusNotificationKind | string): NotificationKindStyle {
  return NOTIFICATION_KINDS[kind] ?? { icon: Bell, tone: "neutral" };
}
