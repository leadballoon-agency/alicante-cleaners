import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { toICSDateUTC } from '@/lib/dates'

// Helper to escape ICS text
function escapeICS(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

// GET /api/calendar/[token] - Get ICS feed for cleaner
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    // Remove .ics extension if present
    const cleanToken = token.replace(/\.ics$/, '')

    // Find cleaner by calendar token
    const cleaner = await db.cleaner.findUnique({
      where: { calendarToken: cleanToken },
      include: {
        user: { select: { name: true } },
        bookings: {
          where: {
            status: { in: ['PENDING', 'CONFIRMED'] },
            date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days + future
          },
          include: {
            property: { select: { name: true, address: true } },
            owner: {
              include: {
                user: { select: { name: true, phone: true } },
              },
            },
          },
          orderBy: { date: 'asc' },
        },
      },
    })

    if (!cleaner) {
      return new NextResponse('Calendar not found', { status: 404 })
    }

    // Build ICS content.
    // `booking.date` is already the canonical UTC instant for this booking's
    // Europe/Madrid date+time (see lib/dates.ts), so we format it directly
    // as a UTC timestamp (trailing `Z`) — every calendar client renders a
    // `Z` timestamp in the viewer's own local timezone, so this is correct
    // regardless of where the cleaner's calendar app is set to. No need to
    // re-derive hours from the separate `time` string (the previous
    // approach, which used the server process's local timezone to set the
    // hour and was a source of the same class of date-shift bug).
    const events = cleaner.bookings.map(booking => {
      const startDate = toICSDateUTC(booking.date)
      const endDate = toICSDateUTC(new Date(booking.date.getTime() + booking.hours * 60 * 60 * 1000))

      const location = booking.property.address
      const summary = `${booking.service} - ${booking.property.name}`
      const description = [
        `Service: ${booking.service}`,
        `Duration: ${booking.hours} hours`,
        `Price: €${booking.price}`,
        `Status: ${booking.status}`,
        `Owner: ${booking.owner.user.name || 'N/A'}`,
        booking.owner.user.phone ? `Phone: ${booking.owner.user.phone}` : '',
        booking.notes ? `Notes: ${booking.notes}` : '',
      ].filter(Boolean).join('\\n')

      return [
        'BEGIN:VEVENT',
        `UID:${booking.id}@alicantecleaners.com`,
        `DTSTAMP:${toICSDateUTC(new Date())}`,
        `DTSTART:${startDate}`,
        `DTEND:${endDate}`,
        `SUMMARY:${escapeICS(summary)}`,
        `DESCRIPTION:${escapeICS(description)}`,
        `LOCATION:${escapeICS(location)}`,
        `STATUS:${booking.status === 'CONFIRMED' ? 'CONFIRMED' : 'TENTATIVE'}`,
        'END:VEVENT',
      ].join('\r\n')
    })

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//VillaCare//Cleaner Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:VillaCare - ${cleaner.user.name || 'My Bookings'}`,
      'X-WR-TIMEZONE:Europe/Madrid',
      ...events,
      'END:VCALENDAR',
    ].join('\r\n')

    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="villacare-calendar.ics"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (error) {
    console.error('Error generating calendar:', error)
    return new NextResponse('Error generating calendar', { status: 500 })
  }
}
