/**
 * Shared Booking Creation Core
 *
 * Extracted from app/api/bookings/route.ts so every entry point that creates
 * a real booking (the public booking form, guest bookings, and the
 * session-aware AI assistant's create_booking tool) fires the exact same
 * side effects: WhatsApp notifications, owner/admin emails, nurturing
 * triggers, and onboarding-progress tracking.
 *
 * Callers are responsible for resolving WHO the booking is for (find/create
 * Owner + Property for a guest, look up the session's Owner + Property for a
 * logged-in visitor, etc). This module only owns what happens once a valid
 * { cleaner, ownerId, propertyId } triple is known: computing price
 * server-side, persisting the Booking row, and firing notifications.
 */

import { db } from '@/lib/db'
import { notifyCleanerNewBooking, sendBookingConfirmation } from '@/lib/whatsapp'
import { notifyAdminNewBooking } from '@/lib/email'
import { sendOwnerBookingReceivedEmail } from '@/lib/emails/owner-booking-emails'
import { triggerWelcomeEmail } from '@/lib/nurturing/send-email'
import { linkChatConversations } from '@/lib/nurturing/link-conversations'
import { onBookingCreated } from '@/lib/notifications/booking-notifications'
import { combineMadridDateTime, formatMadridDate } from '@/lib/dates'
import { runSideEffects, type SideEffect } from '@/lib/side-effects'
import type { Prisma } from '@prisma/client'

// Service definitions with hours - server is source of truth for pricing
export const SERVICE_DEFINITIONS: Record<string, { hours: number; name: string }> = {
  'Regular Clean': { hours: 3, name: 'Regular Clean' },
  'Deep Clean': { hours: 5, name: 'Deep Clean' },
  'Arrival Prep': { hours: 4, name: 'Arrival Prep' },
}

/** Raised for invalid input / unavailable cleaner so callers can map to the right HTTP status. */
export class BookingCreationError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'BookingCreationError'
    this.status = status
  }
}

// Generate a unique 4-digit short code for WhatsApp reference
async function generateShortCode(): Promise<string> {
  const maxAttempts = 10
  for (let i = 0; i < maxAttempts; i++) {
    const code = Math.floor(1000 + Math.random() * 9000).toString()
    const existing = await db.booking.findFirst({ where: { shortCode: code } })
    if (!existing) return code
  }
  // Fallback to longer code if all attempts fail
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export interface CreateBookingCoreParams {
  cleaner: {
    id: string
    hourlyRate: Prisma.Decimal | number | string
    user: { name: string | null; phone: string | null }
  }
  ownerId: string
  propertyId: string
  propertyAddress: string
  serviceType: string // must be a key of SERVICE_DEFINITIONS
  date: string // plain calendar day, 'YYYY-MM-DD', no timezone attached
  time: string // HH:MM
  notes?: string | null
  createdByAI?: boolean
  // Only set when this booking created a brand-new Owner (triggers welcome nurturing)
  nurturingInfo?: { ownerId: string; userId: string; email: string | null; phone: string | null } | null
  // Guest-booking fallbacks - a logged-in returning owner won't need these,
  // their info comes from the refetched Owner/User record instead.
  guestName?: string | null
  guestEmail?: string | null
  guestPhone?: string | null
  sessionEmail?: string | null
}

export interface CreateBookingCoreResult {
  booking: {
    id: string
    shortCode: string | null
    status: string
    service: string
    price: number
    hours: number
    date: Date
    time: string
    cleaner: { name: string | null; phone: string | null }
    property: { name: string; address: string }
  }
}

/**
 * Validate service type + compute price server-side. Exported so callers can
 * do this validation (and surface a friendly error) before doing other work
 * like a session/ownership check.
 */
export function resolveServicePrice(cleanerHourlyRate: Prisma.Decimal | number | string, serviceType: string) {
  const serviceDef = SERVICE_DEFINITIONS[serviceType]
  if (!serviceDef) {
    throw new BookingCreationError(
      `Invalid service type. Valid types: ${Object.keys(SERVICE_DEFINITIONS).join(', ')}`,
      400
    )
  }
  const hours = serviceDef.hours
  const price = Number(cleanerHourlyRate) * hours
  return { hours, price }
}

/**
 * Create the Booking row and fire the identical notification chain that
 * POST /api/bookings uses: WhatsApp to cleaner + owner, owner "booking
 * received" email, admin email + staff push, and (for brand new owners)
 * welcome nurturing. Status is always PENDING - the cleaner still has to
 * accept, regardless of who/what created the booking.
 */
export async function createBookingCore(params: CreateBookingCoreParams): Promise<CreateBookingCoreResult> {
  const { hours, price } = resolveServicePrice(params.cleaner.hourlyRate, params.serviceType)

  const result = await db.$transaction(async (tx) => {
    // Re-check cleaner is still ACTIVE inside the transaction (race condition guard)
    const freshCleaner = await tx.cleaner.findUnique({
      where: { id: params.cleaner.id },
      select: { status: true },
    })

    if (!freshCleaner || freshCleaner.status !== 'ACTIVE') {
      throw new BookingCreationError(
        'This cleaner is no longer available. Please try another cleaner.',
        409
      )
    }

    const shortCode = await generateShortCode()

    const booking = await tx.booking.create({
      data: {
        cleanerId: params.cleaner.id,
        ownerId: params.ownerId,
        propertyId: params.propertyId,
        service: params.serviceType,
        price,
        hours,
        shortCode,
        // Canonical instant: the UTC moment this date+time represents in
        // Europe/Madrid (constructed server-side — see lib/dates.ts). This
        // is the ONLY place a booking's `date` should be constructed;
        // never `new Date(params.date)` (that's the date-shift bug PR #25
        // fixed — see lib/dates.ts header comment).
        date: combineMadridDateTime(params.date, params.time),
        time: params.time,
        notes: params.notes || null,
        status: 'PENDING',
        createdByAI: params.createdByAI || false,
      },
      include: { property: true },
    })

    const owner = await tx.owner.findUnique({
      where: { id: params.ownerId },
      include: { user: { select: { name: true, phone: true, email: true, preferredLanguage: true } } },
    })

    return { booking, owner }
  })

  const { booking, owner } = result

  // Format for notifications always in Europe/Madrid (bookings are physical
  // events in Spain regardless of where the owner/server is) — reuse the
  // canonical instant stored on the booking, never re-derive from the raw
  // input strings.
  const formattedDate = formatMadridDate(booking.date, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  // Every notification below is fired here and awaited together (via
  // runSideEffects) before this function returns. On Vercel's serverless
  // runtime, the calling route handler's response freezes execution the
  // instant it's sent — any promise still in flight and not awaited
  // somewhere up the call chain never completes. Since createBookingCore's
  // callers immediately `return NextResponse.json(...)` after `await`ing
  // this function, everything that must actually run has to be awaited
  // in here.
  const sideEffects: SideEffect[] = []

  // Send WhatsApp notification to cleaner (outside transaction)
  const cleanerPhone = params.cleaner.user.phone
  if (cleanerPhone) {
    sideEffects.push({
      label: `whatsapp:notify-cleaner-new-booking:${booking.id}`,
      promise: notifyCleanerNewBooking(cleanerPhone, {
        ownerName: owner?.user.name || params.guestName || 'Villa Owner',
        date: formattedDate,
        time: params.time,
        address: params.propertyAddress,
        service: params.serviceType,
        price: `€${price}`,
        shortCode: booking.shortCode || undefined,
      }),
    })
  }

  // Send WhatsApp confirmation to owner (if they have a phone)
  const ownerPhone = params.guestPhone || owner?.user.phone
  if (ownerPhone) {
    sideEffects.push({
      label: `whatsapp:confirm-to-owner:${booking.id}`,
      promise: sendBookingConfirmation(ownerPhone, {
        cleanerName: params.cleaner.user.name || 'Your cleaner',
        date: formattedDate,
        time: params.time,
        address: params.propertyAddress,
        service: params.serviceType,
        price: `€${price}`,
      }),
    })
  }

  // Send booking-received email to owner (additive to WhatsApp above —
  // reliable fallback while the WABA is offline).
  const recipientEmail = owner?.user.email || params.guestEmail || params.sessionEmail
  if (recipientEmail) {
    sideEffects.push({
      label: `email:owner-booking-received:${booking.id}`,
      promise: sendOwnerBookingReceivedEmail({
        to: recipientEmail,
        ownerName: owner?.user.name || params.guestName || 'there',
        cleanerName: params.cleaner.user.name || 'your cleaner',
        service: params.serviceType,
        date: formattedDate,
        time: params.time,
        address: params.propertyAddress,
        price: `€${price}`,
        preferredLanguage: owner?.user.preferredLanguage,
      }),
    })
  }

  // Send email notification to admins
  sideEffects.push({
    label: `email:notify-admin-new-booking:${booking.id}`,
    promise: notifyAdminNewBooking({
      ownerName: owner?.user.name || params.guestName || 'Guest',
      ownerEmail: params.guestEmail || params.sessionEmail || 'Unknown',
      cleanerName: params.cleaner.user.name || 'Cleaner',
      service: params.serviceType,
      date: formattedDate,
      time: params.time,
      address: params.propertyAddress,
      price: `€${price}`,
      bookingId: booking.id,
    }),
  })

  // Arm the reminder/escalation chain: creates the BookingResponseTracker +
  // cleaner in-app notification so the 1h/2h/6h reminder-escalation cron
  // (lib/notifications/booking-notifications.ts) knows to chase this
  // PENDING booking. Every caller of createBookingCore creates a booking
  // that needs a cleaner response, so this always fires here.
  sideEffects.push({
    label: `booking-reminder-chain:${booking.id}`,
    promise: onBookingCreated({
      id: booking.id,
      cleanerId: params.cleaner.id,
      ownerName: owner?.user.name || params.guestName || 'Villa Owner',
      propertyName: booking.property.name,
      service: params.serviceType,
      date: booking.date,
      time: params.time,
      price,
    }),
  })

  // Trigger welcome email for new owners
  if (params.nurturingInfo) {
    sideEffects.push({
      label: `nurturing:trigger-welcome-email:${params.nurturingInfo.ownerId}`,
      promise: triggerWelcomeEmail(params.nurturingInfo.ownerId),
    })
    sideEffects.push({
      label: `nurturing:link-chat-conversations:${params.nurturingInfo.userId}`,
      promise: linkChatConversations(
        params.nurturingInfo.userId,
        params.nurturingInfo.email,
        params.nurturingInfo.phone
      ),
    })
  }

  await runSideEffects(sideEffects)

  // Track onboarding progress: mark first booking
  const ownerData = await db.owner.findUnique({
    where: { id: params.ownerId },
    select: {
      firstBookingAt: true,
      profileCompletedAt: true,
      firstPropertyAddedAt: true,
    },
  })

  if (ownerData && !ownerData.firstBookingAt) {
    const onboardingUpdates: { firstBookingAt: Date; onboardingCompletedAt?: Date } = {
      firstBookingAt: new Date(),
    }

    if (ownerData.profileCompletedAt && ownerData.firstPropertyAddedAt) {
      onboardingUpdates.onboardingCompletedAt = new Date()
    }

    await db.owner.update({
      where: { id: params.ownerId },
      data: onboardingUpdates,
    })
  }

  return {
    booking: {
      id: booking.id,
      shortCode: booking.shortCode,
      status: booking.status,
      service: booking.service,
      price: Number(booking.price),
      hours: booking.hours,
      date: booking.date,
      time: booking.time,
      cleaner: {
        name: params.cleaner.user.name,
        phone: params.cleaner.user.phone,
      },
      property: {
        name: booking.property.name,
        address: booking.property.address,
      },
    },
  }
}
