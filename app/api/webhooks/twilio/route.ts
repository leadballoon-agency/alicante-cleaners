import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendWhatsAppMessage } from '@/lib/whatsapp'

// Twilio sends webhooks as form-urlencoded
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    // Extract message details from Twilio webhook
    const from = formData.get('From') as string // e.g., 'whatsapp:+447957686529'
    const body = (formData.get('Body') as string)?.trim().toUpperCase()
    const messageSid = formData.get('MessageSid') as string

    console.log(`WhatsApp webhook received: ${messageSid} from ${from}: "${body}"`)

    if (!from || !body) {
      return new NextResponse('OK', { status: 200 })
    }

    // Extract phone number (remove 'whatsapp:' prefix)
    const phone = from.replace('whatsapp:', '')

    // Find cleaner by phone number
    const cleaner = await db.cleaner.findFirst({
      where: {
        user: {
          phone: {
            contains: phone.replace('+', '').slice(-9), // Match last 9 digits
          },
        },
      },
      include: {
        user: { select: { name: true } },
      },
    })

    if (!cleaner) {
      // Not a cleaner - could be an owner message, log and acknowledge
      console.log(`Message from non-cleaner: ${phone}`)
      return new NextResponse('OK', { status: 200 })
    }

    // Handle ACCEPT or DECLINE commands
    if (body === 'ACCEPT' || body === 'YES' || body === 'SI' || body === 'SÍ') {
      // Find their most recent pending booking
      const pendingBooking = await db.booking.findFirst({
        where: {
          cleanerId: cleaner.id,
          status: 'PENDING',
        },
        orderBy: { createdAt: 'desc' },
        include: {
          owner: {
            include: { user: { select: { name: true, phone: true } } },
          },
          property: { select: { address: true } },
        },
      })

      if (!pendingBooking) {
        await sendWhatsAppMessage(from, 'No pending bookings found to accept.')
        return new NextResponse('OK', { status: 200 })
      }

      // Accept the booking
      await db.booking.update({
        where: { id: pendingBooking.id },
        data: { status: 'CONFIRMED' },
      })

      const formattedDate = pendingBooking.date.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })

      // Confirm to cleaner
      await sendWhatsAppMessage(
        from,
        `✅ *Booking Accepted!*\n\n${formattedDate} at ${pendingBooking.time}\n${pendingBooking.property.address}\n\nThe owner has been notified.`
      )

      // Notify owner
      const ownerPhone = pendingBooking.owner.user.phone
      if (ownerPhone) {
        await sendWhatsAppMessage(
          ownerPhone,
          `*Booking Confirmed!* ✅\n\n${cleaner.user.name} has accepted your booking for ${formattedDate} at ${pendingBooking.time}.\n\n- VillaCare`
        )
      }

    } else if (body === 'DECLINE' || body === 'NO') {
      // Find their most recent pending booking
      const pendingBooking = await db.booking.findFirst({
        where: {
          cleanerId: cleaner.id,
          status: 'PENDING',
        },
        orderBy: { createdAt: 'desc' },
        include: {
          owner: {
            include: { user: { select: { name: true, phone: true } } },
          },
          property: { select: { address: true } },
        },
      })

      if (!pendingBooking) {
        await sendWhatsAppMessage(from, 'No pending bookings found to decline.')
        return new NextResponse('OK', { status: 200 })
      }

      // Decline the booking
      await db.booking.update({
        where: { id: pendingBooking.id },
        data: { status: 'CANCELLED' },
      })

      const formattedDate = pendingBooking.date.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })

      // Confirm to cleaner
      await sendWhatsAppMessage(
        from,
        `❌ *Booking Declined*\n\n${formattedDate} booking has been declined. The owner will be notified to find another cleaner.`
      )

      // Notify owner
      const ownerPhone = pendingBooking.owner.user.phone
      if (ownerPhone) {
        await sendWhatsAppMessage(
          ownerPhone,
          `*Booking Declined* ❌\n\nUnfortunately, ${cleaner.user.name} is not available for ${formattedDate}.\n\nPlease try booking with another cleaner at villacare.app\n\n- VillaCare`
        )
      }

    } else if (body === 'HELP' || body === 'AYUDA') {
      await sendWhatsAppMessage(
        from,
        `*VillaCare Commands:*\n\n• ACCEPT or YES - Accept pending booking\n• DECLINE or NO - Decline pending booking\n• HELP - Show this message\n\nFor other questions, visit villacare.app or contact support.`
      )
    } else {
      // Unknown command - could forward to support or just acknowledge
      console.log(`Unknown command from ${phone}: ${body}`)
    }

    // Always return 200 to acknowledge receipt
    return new NextResponse('OK', { status: 200 })

  } catch (error) {
    console.error('Twilio webhook error:', error)
    // Still return 200 to prevent Twilio retries
    return new NextResponse('OK', { status: 200 })
  }
}

// Twilio may send GET for verification
export async function GET() {
  return new NextResponse('Twilio WhatsApp Webhook', { status: 200 })
}
