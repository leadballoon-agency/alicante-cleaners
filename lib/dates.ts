/**
 * Canonical timezone handling for bookings.
 *
 * ROOT CAUSE (booking date-shift bug, first real booking, Jul 2026):
 * The booking flow's date picker built a plain JS `Date` from calendar
 * components in the *visitor's browser timezone*
 * (`app/[slug]/booking/steps/date-time.tsx`, `new Date(year, month, d)`),
 * then the payment step serialized it with `data.date.toISOString()`
 * (`app/[slug]/booking/steps/payment.tsx`). `toISOString()` converts a local
 * instant to UTC using the *browser's* offset, which silently shifts the
 * calendar day whenever that offset isn't the one the business actually
 * operates in (Europe/Madrid). The API then trusted that already-shifted
 * ISO string blindly (`new Date(date)` in `app/api/bookings/route.ts`), and
 * every downstream display formatted the instant without ever specifying a
 * timezone, so it rendered whatever day the shifted instant happened to
 * fall on in the server/browser's local zone.
 *
 * FIX / CONVENTION:
 * All VillaCare bookings are physical events that happen in Spain, so the
 * one canonical timezone for interpreting and displaying a booking's
 * "date" is Europe/Madrid (`BOOKING_TZ` below) — never the visitor's
 * browser timezone, never the server process's default timezone (UTC on
 * Vercel).
 *
 * - Clients send the raw, unambiguous strings the user picked —
 *   `date: 'YYYY-MM-DD'` and `time: 'HH:MM'` — never a client-constructed
 *   `Date`/ISO string (see `formatDateOnlyLocal` for extracting the former
 *   safely from a calendar-grid `Date` without going through `toISOString`).
 * - The server is the only place that turns those strings into the
 *   canonical UTC instant, via `combineMadridDateTime`, which is what gets
 *   stored in `Booking.date`.
 * - Every display site (emails, WhatsApp, dashboards, ICS, admin) formats
 *   that instant with `timeZone: BOOKING_TZ` via the helpers below, never
 *   with a bare `toLocaleDateString()`/`toLocaleString()`.
 */

export const BOOKING_TZ = 'Europe/Madrid'

/** en-GB reads naturally for a Spain-based audience ("14 July 2026"). */
const DEFAULT_LOCALE = 'en-GB'

type DateInput = Date | string

function toDate(input: DateInput): Date {
  return typeof input === 'string' ? new Date(input) : input
}

/**
 * The Europe/Madrid UTC offset (in minutes, e.g. +60 CET / +120 CEST) in
 * effect at the given instant. Computed via Intl rather than a hard-coded
 * DST table so it stays correct across DST transitions indefinitely.
 */
function getMadridOffsetMinutes(instant: Date): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: BOOKING_TZ,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  const parts: Record<string, string> = {}
  for (const part of dtf.formatToParts(instant)) {
    if (part.type !== 'literal') parts[part.type] = part.value
  }

  // Interpreting Madrid's wall-clock reading for `instant` as if it were
  // UTC gives us an instant whose distance from the real `instant` is
  // exactly Madrid's current offset from UTC.
  const asIfUTC = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  )

  return Math.round((asIfUTC - instant.getTime()) / 60000)
}

/**
 * Combine a plain `YYYY-MM-DD` date and `HH:MM` time — as picked by the
 * user, with no timezone attached — into the UTC instant they represent
 * in Europe/Madrid. This is the ONLY place a booking's `date` should be
 * constructed; do it server-side, never client-side.
 */
export function combineMadridDateTime(dateStr: string, timeStr: string): Date {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr)
  const timeMatch = /^(\d{1,2}):(\d{2})$/.exec(timeStr)
  if (!dateMatch || !timeMatch) {
    throw new Error(`Invalid date/time for combineMadridDateTime: ${dateStr} ${timeStr}`)
  }

  const [, year, month, day] = dateMatch.map(Number) as unknown as [number, number, number, number]
  const [, hour, minute] = timeMatch.map(Number) as unknown as [number, number, number]

  // First guess: treat the wall-clock numbers as UTC, then correct by
  // Madrid's actual offset at that moment. Re-check once more in case the
  // first correction landed on the other side of a DST transition.
  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0))
  const offset = getMadridOffsetMinutes(guess)
  let result = new Date(guess.getTime() - offset * 60000)

  const offset2 = getMadridOffsetMinutes(result)
  if (offset2 !== offset) {
    result = new Date(guess.getTime() - offset2 * 60000)
  }

  return result
}

/** Y/M/D/H/M/S of an instant, read in Europe/Madrid wall-clock time. */
export function getMadridDateParts(input: DateInput): {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
} {
  const date = toDate(input)
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: BOOKING_TZ,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  const parts: Record<string, string> = {}
  for (const part of dtf.formatToParts(date)) {
    if (part.type !== 'literal') parts[part.type] = part.value
  }
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  }
}

/**
 * `YYYY-MM-DD` key for an instant's Europe/Madrid calendar day — use this to
 * compare "is this the same day" (e.g. for Today/Tomorrow labels) instead of
 * `Date#toDateString()`, which compares in whatever timezone the browser or
 * server process happens to be running in.
 */
export function getMadridDateKey(input: DateInput): string {
  const p = getMadridDateParts(input)
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`
}

/**
 * Shift an instant by whole calendar days/months while preserving its
 * Europe/Madrid wall-clock time-of-day — safe across DST transitions
 * (unlike `date.setDate(date.getDate() + 7)`, which shifts by 24h wall
 * clock in whatever timezone the process happens to run in).
 */
export function shiftMadridCalendar(
  input: DateInput,
  { days = 0, months = 0 }: { days?: number; months?: number }
): Date {
  const p = getMadridDateParts(input)
  const guess = new Date(Date.UTC(p.year, p.month - 1 + months, p.day + days, p.hour, p.minute, p.second))

  const offset = getMadridOffsetMinutes(guess)
  let result = new Date(guess.getTime() - offset * 60000)

  const offset2 = getMadridOffsetMinutes(result)
  if (offset2 !== offset) {
    result = new Date(guess.getTime() - offset2 * 60000)
  }

  return result
}

export function addDaysMadrid(input: DateInput, days: number): Date {
  return shiftMadridCalendar(input, { days })
}

export function addMonthsMadrid(input: DateInput, months: number): Date {
  return shiftMadridCalendar(input, { months })
}

/**
 * Format an instant for display, always in Europe/Madrid time. Use this
 * (or `formatMadridDateTime`) everywhere a booking date is shown — emails,
 * WhatsApp messages, dashboards, admin — instead of a bare
 * `toLocaleDateString()`/`toLocaleString()`.
 */
export function formatMadridDate(
  input: DateInput,
  options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
  locale: string = DEFAULT_LOCALE
): string {
  const date = toDate(input)
  return date.toLocaleDateString(locale, { ...options, timeZone: BOOKING_TZ })
}

export function formatMadridDateTime(
  input: DateInput,
  options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  },
  locale: string = DEFAULT_LOCALE
): string {
  const date = toDate(input)
  return date.toLocaleString(locale, { ...options, timeZone: BOOKING_TZ })
}

/**
 * Extract `YYYY-MM-DD` from a `Date` using its LOCAL (not UTC) components.
 * Safe to use client-side on a `Date` built from calendar-grid components
 * (`new Date(year, month, day)`), since that Date's local Y/M/D already IS
 * the calendar day the user clicked — unlike `toISOString().split('T')[0]`,
 * which re-derives the day via a UTC conversion and can shift it by one
 * depending on the browser's timezone offset (the root cause of this bug).
 */
export function formatDateOnlyLocal(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** `YYYYMMDDTHHMMSSZ` — UTC timestamp format used by ICS and Google Calendar `dates=` links. */
export function toICSDateUTC(input: DateInput): string {
  const date = toDate(input)
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  const hour = String(date.getUTCHours()).padStart(2, '0')
  const minute = String(date.getUTCMinutes()).padStart(2, '0')
  const second = String(date.getUTCSeconds()).padStart(2, '0')
  return `${year}${month}${day}T${hour}${minute}${second}Z`
}

/**
 * Build a Google Calendar "add event" template link from a booking's
 * correct UTC instant + duration. Because the `dates=` param is a real UTC
 * instant (trailing `Z`), Google renders it in the *viewer's* local
 * timezone automatically — correct regardless of where the owner is
 * looking at their calendar from.
 */
export function buildGoogleCalendarLink(params: {
  start: DateInput
  hours: number
  title: string
  details?: string
  location?: string
}): string {
  const start = toDate(params.start)
  const end = new Date(start.getTime() + params.hours * 60 * 60 * 1000)

  const search = new URLSearchParams({
    action: 'TEMPLATE',
    text: params.title,
    dates: `${toICSDateUTC(start)}/${toICSDateUTC(end)}`,
  })
  if (params.details) search.set('details', params.details)
  if (params.location) search.set('location', params.location)

  return `https://calendar.google.com/calendar/render?${search.toString()}`
}
