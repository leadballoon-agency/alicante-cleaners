/**
 * Timestamp helpers for person-to-person message threads (cleaner/owner/
 * admin Messages tabs).
 *
 * Unlike bookings (see `lib/dates.ts`, always Europe/Madrid — a booking is
 * a physical event that happens in Spain), a chat message's timestamp is
 * about "when did I read/write this", which is meaningful in the *viewer's*
 * own clock. So these helpers deliberately use the browser's local
 * timezone (`toLocaleTimeString`/`toLocaleDateString` with no `timeZone`
 * override) rather than `BOOKING_TZ`.
 */

export type MessageLocale = 'es' | 'en'

const LOCALE_TAG: Record<MessageLocale, string> = { es: 'es-ES', en: 'en-US' }

const LABELS: Record<MessageLocale, { today: string; yesterday: string }> = {
  es: { today: 'Hoy', yesterday: 'Ayer' },
  en: { today: 'Today', yesterday: 'Yesterday' },
}

function toDate(input: string | Date): Date {
  return typeof input === 'string' ? new Date(input) : input
}

function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

/** Stable per-calendar-day key (viewer's local time) for grouping messages. */
export function messageDayKey(input: string | Date): string {
  const d = toDate(input)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

/** "14:32" — the small per-message clock shown in/under a chat bubble. */
export function formatMessageClock(input: string | Date, locale: MessageLocale = 'en'): string {
  return toDate(input).toLocaleTimeString(LOCALE_TAG[locale], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Date-separator label shown between messages when the calendar day
 * changes: "Today" / "Yesterday" / "Mon 8 Jul" (year omitted unless it
 * differs from the current year).
 */
export function formatDaySeparator(input: string | Date, locale: MessageLocale = 'en'): string {
  const date = toDate(input)
  const now = new Date()

  if (isSameCalendarDay(date, now)) return LABELS[locale].today

  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (isSameCalendarDay(date, yesterday)) return LABELS[locale].yesterday

  const sameYear = date.getFullYear() === now.getFullYear()
  return date.toLocaleDateString(LOCALE_TAG[locale], {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: sameYear ? undefined : 'numeric',
  })
}
