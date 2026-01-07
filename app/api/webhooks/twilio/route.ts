import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendWhatsAppMessage } from '@/lib/whatsapp'
import twilio from 'twilio'

// Reconstruct the public URL that Twilio signed (Vercel serverless fix)
function getTwilioSignedUrl(req: NextRequest): string {
  const proto = req.headers.get('x-forwarded-proto') ?? 'https'
  // Fallback to URL host if header missing (rare but possible)
  const host = req.headers.get('host') ?? new URL(req.url).host
  const pathname = new URL(req.url).pathname
  return `${proto}://${host}${pathname}`
}

// Validate Twilio webhook signature
function validateTwilioSignature(request: NextRequest, body: string): boolean {
  const authToken = process.env.TWILIO_AUTH_TOKEN

  if (!authToken) {
    console.error('TWILIO_AUTH_TOKEN not configured - cannot validate webhooks')
    return false
  }

  const signature = request.headers.get('x-twilio-signature')

  if (!signature) {
    console.error('Missing X-Twilio-Signature header')
    return false
  }

  // Use reconstructed public URL, not internal request.url
  const url = getTwilioSignedUrl(request)

  // Parse form data into params object for validation
  const params: Record<string, string> = {}
  const searchParams = new URLSearchParams(body)
  searchParams.forEach((value, key) => {
    params[key] = value
  })

  // Validate using Twilio's helper
  const isValid = twilio.validateRequest(authToken, signature, url, params)

  if (!isValid) {
    console.error('Invalid Twilio signature - request may be spoofed', { url })
  }

  return isValid
}

// Check if Prisma error is a unique constraint violation
function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Error &&
    'code' in error &&
    (error as { code: string }).code === 'P2002'
  )
}

// Try to claim this webhook for processing (insert-first pattern)
// Returns true if we should process, false if already processed
async function claimWebhook(messageSid: string): Promise<boolean> {
  try {
    await db.webhookEvent.create({
      data: { messageSid, source: 'twilio' },
    })
    return true // We claimed it, proceed with processing
  } catch (error) {
    if (isUniqueViolation(error)) {
      // Already processed by another instance
      return false
    }
    throw error // Re-throw unexpected errors
  }
}

// Normalise phone to E.164 format for exact matching
function normalizePhone(phone: string): string {
  // Remove whatsapp: prefix if present
  let normalized = phone.replace('whatsapp:', '')
  // Ensure it starts with +
  if (!normalized.startsWith('+')) {
    normalized = '+' + normalized
  }
  return normalized
}

// Twilio sends webhooks as form-urlencoded
export async function POST(request: NextRequest) {
  try {
    // Read body for validation
    const bodyText = await request.text()

    // Validate webhook signature in production
    if (process.env.NODE_ENV === 'production') {
      if (!validateTwilioSignature(request, bodyText)) {
        console.error('Twilio webhook signature validation failed')
        return new NextResponse('Unauthorized', { status: 403 })
      }
    }

    // Parse form data from body text
    const formData = new URLSearchParams(bodyText)

    // Extract message details from Twilio webhook
    const from = formData.get('From') as string // e.g., 'whatsapp:+447957686529'
    const body = (formData.get('Body') as string)?.trim().toUpperCase()
    const messageSid = formData.get('MessageSid') as string

    console.log(`WhatsApp webhook received: ${messageSid} from ${from}: "${body}"`)

    if (!from || !body || !messageSid) {
      return new NextResponse('OK', { status: 200 })
    }

    // Idempotency: try to claim this webhook (insert-first pattern)
    // If already claimed by another instance, skip processing
    const claimed = await claimWebhook(messageSid)
    if (!claimed) {
      console.log(`Webhook ${messageSid} already processed - skipping`)
      return new NextResponse('OK', { status: 200 })
    }

    // Normalise phone to E.164 for exact matching
    const phone = normalizePhone(from)

    // Find cleaner by exact phone match (E.164)
    const cleaner = await db.cleaner.findFirst({
      where: {
        user: {
          phone: phone, // Exact E.164 match
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

    // Parse command and optional reference code
    // Supports: "ACCEPT", "ACCEPT 1234", "YES 1234", etc.
    const parts = body.split(/\s+/)
    const command = parts[0]
    const refCode = parts[1] || null

    // Handle ACCEPT or DECLINE commands
    if (command === 'ACCEPT' || command === 'YES' || command === 'SI' || command === 'SÍ') {
      // Find booking - by reference code if provided, otherwise most recent pending
      let pendingBooking

      if (refCode) {
        // Find by specific reference code
        pendingBooking = await db.booking.findFirst({
          where: {
            cleanerId: cleaner.id,
            shortCode: refCode,
            status: 'PENDING',
          },
          include: {
            owner: {
              include: { user: { select: { name: true, phone: true } } },
            },
            property: { select: { address: true } },
          },
        })

        if (!pendingBooking) {
          await sendWhatsAppMessage(from, `No pending booking found with code #${refCode}.`)
          return new NextResponse('OK', { status: 200 })
        }
      } else {
        // Find most recent pending booking
        pendingBooking = await db.booking.findFirst({
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

        // Check if cleaner has multiple pending bookings - require reference code
        const pendingCount = await db.booking.count({
          where: {
            cleanerId: cleaner.id,
            status: 'PENDING',
          },
        })

        if (pendingCount > 1) {
          // List all pending bookings with their codes
          const pendingBookings = await db.booking.findMany({
            where: {
              cleanerId: cleaner.id,
              status: 'PENDING',
            },
            orderBy: { date: 'asc' },
            include: {
              property: { select: { address: true } },
            },
          })

          const bookingList = pendingBookings.map(b => {
            const dateStr = b.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
            return `• #${b.shortCode || '???'} - ${dateStr} at ${b.time}`
          }).join('\n')

          await sendWhatsAppMessage(
            from,
            `You have ${pendingCount} pending bookings. Please specify which one:\n\n${bookingList}\n\nReply: ACCEPT [code] or DECLINE [code]`
          )
          return new NextResponse('OK', { status: 200 })
        }
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

    } else if (command === 'DECLINE' || command === 'NO') {
      // Find booking - by reference code if provided, otherwise most recent pending
      let pendingBooking

      if (refCode) {
        pendingBooking = await db.booking.findFirst({
          where: {
            cleanerId: cleaner.id,
            shortCode: refCode,
            status: 'PENDING',
          },
          include: {
            owner: {
              include: { user: { select: { name: true, phone: true } } },
            },
            property: { select: { address: true } },
          },
        })

        if (!pendingBooking) {
          await sendWhatsAppMessage(from, `No pending booking found with code #${refCode}.`)
          return new NextResponse('OK', { status: 200 })
        }
      } else {
        pendingBooking = await db.booking.findFirst({
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

        // Check for multiple pending bookings
        const pendingCount = await db.booking.count({
          where: {
            cleanerId: cleaner.id,
            status: 'PENDING',
          },
        })

        if (pendingCount > 1) {
          const pendingBookings = await db.booking.findMany({
            where: {
              cleanerId: cleaner.id,
              status: 'PENDING',
            },
            orderBy: { date: 'asc' },
            include: {
              property: { select: { address: true } },
            },
          })

          const bookingList = pendingBookings.map(b => {
            const dateStr = b.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
            return `• #${b.shortCode || '???'} - ${dateStr} at ${b.time}`
          }).join('\n')

          await sendWhatsAppMessage(
            from,
            `You have ${pendingCount} pending bookings. Please specify which one:\n\n${bookingList}\n\nReply: ACCEPT [code] or DECLINE [code]`
          )
          return new NextResponse('OK', { status: 200 })
        }
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

    } else if (command === 'HELP' || command === 'AYUDA') {
      await sendWhatsAppMessage(
        from,
        `*VillaCare Commands:*\n\n• ACCEPT [code] - Accept a booking\n• DECLINE [code] - Decline a booking\n• HELP - Show this message\n\nThe [code] is optional if you only have one pending booking.\n\nFor other questions, visit villacare.app or contact support.`
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
