import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Helper to format date for ICS (YYYYMMDDTHHMMSS)
function formatICSDate(date: Date, time: string): string {
  const [hours, minutes] = time.split(':').map(Number)
  const d = new Date(date)
  d.setHours(hours || 9, minutes || 0, 0, 0)

  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hour = String(d.getHours()).padStart(2, '0')
  const minute = String(d.getMinutes()).padStart(2, '0')

  return `${year}${month}${day}T${hour}${minute}00`
}

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

    // Build ICS content
    const events = cleaner.bookings.map(booking => {
      const startDate = formatICSDate(booking.date, booking.time)
      // Calculate end time (add booking hours)
      const endDate = formatICSDate(
        new Date(new Date(booking.date).getTime() + booking.hours * 60 * 60 * 1000),
        booking.time
      )

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
        `DTSTAMP:${formatICSDate(new Date(), '00:00')}Z`,
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
