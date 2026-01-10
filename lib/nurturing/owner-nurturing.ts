import { db } from '@/lib/db'
import { sendNurturingEmail } from './send-email'

interface NurturingResults {
  profileNudges: number
  propertyNudges: number
  bookingPrompts: number
  reEngagements: number
  errors: string[]
}

/**
 * Process all owner nurturing campaigns
 * Called by daily cron job at 8am UTC
 *
 * Uses onboarding state fields for smarter nudge timing:
 * - profileCompletedAt: when name was set
 * - firstPropertyAddedAt: when first property was added
 * - firstBookingAt: when first booking was made
 * - onboardingCompletedAt: when all steps were done
 */
export async function processOwnerNurturing(): Promise<NurturingResults> {
  const results: NurturingResults = {
    profileNudges: 0,
    propertyNudges: 0,
    bookingPrompts: 0,
    reEngagements: 0,
    errors: [],
  }

  const now = new Date()
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

  // 1. Profile Incomplete: 24h+ since signup, no name set
  // Quick nudge to complete profile
  try {
    const incompleteProfiles = await db.owner.findMany({
      where: {
        createdAt: { lte: oneDayAgo },
        profileCompletedAt: null, // Uses new onboarding state field
        user: { name: null },
        nurturingCampaigns: { none: { emailType: 'PROFILE_INCOMPLETE' } },
      },
      include: {
        user: true,
        properties: true,
        bookings: { orderBy: { createdAt: 'desc' }, take: 1 },
        publicChatConversations: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
      take: 50, // Process in batches
    })

    console.log(`[Nurturing] Found ${incompleteProfiles.length} owners with incomplete profiles`)

    for (const owner of incompleteProfiles) {
      const result = await sendNurturingEmail(owner, 'PROFILE_INCOMPLETE')
      if (result.success) {
        results.profileNudges++
      } else if (result.error !== 'Email already sent') {
        results.errors.push(`Profile nudge to ${owner.user.email}: ${result.error}`)
      }
    }
  } catch (error) {
    console.error('[Nurturing] Error processing profile nudges:', error)
    results.errors.push(`Profile nudge batch error: ${error}`)
  }

  // 2. Property Nudge: 24h+ since profile completed, no property added
  // Encourage adding their villa details
  try {
    const needsProperty = await db.owner.findMany({
      where: {
        profileCompletedAt: { not: null, lte: oneDayAgo }, // Profile done 24h+ ago
        firstPropertyAddedAt: null, // No property yet
        properties: { none: {} },
        nurturingCampaigns: { none: { emailType: 'ADD_PROPERTY_NUDGE' } },
      },
      include: {
        user: true,
        properties: true,
        bookings: { orderBy: { createdAt: 'desc' }, take: 1 },
        publicChatConversations: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
      take: 50,
    })

    console.log(`[Nurturing] Found ${needsProperty.length} owners needing property nudge`)

    for (const owner of needsProperty) {
      const result = await sendNurturingEmail(owner, 'ADD_PROPERTY_NUDGE')
      if (result.success) {
        results.propertyNudges++
      } else if (result.error !== 'Email already sent') {
        results.errors.push(`Property nudge to ${owner.user.email}: ${result.error}`)
      }
    }
  } catch (error) {
    console.error('[Nurturing] Error processing property nudges:', error)
    results.errors.push(`Property nudge batch error: ${error}`)
  }

  // 3. First Booking Prompt: 24h+ since property added, no bookings
  // Faster nudge to book their first clean
  try {
    const needsFirstBooking = await db.owner.findMany({
      where: {
        firstPropertyAddedAt: { not: null, lte: oneDayAgo }, // Property added 24h+ ago
        firstBookingAt: null, // No booking yet
        bookings: { none: {} },
        nurturingCampaigns: { none: { emailType: 'FIRST_BOOKING_PROMPT' } },
      },
      include: {
        user: true,
        properties: true,
        bookings: { orderBy: { createdAt: 'desc' }, take: 1 },
        publicChatConversations: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
      take: 50,
    })

    console.log(`[Nurturing] Found ${needsFirstBooking.length} owners needing first booking prompt`)

    for (const owner of needsFirstBooking) {
      const result = await sendNurturingEmail(owner, 'FIRST_BOOKING_PROMPT')
      if (result.success) {
        results.bookingPrompts++
      } else if (result.error !== 'Email already sent') {
        results.errors.push(`Booking prompt to ${owner.user.email}: ${result.error}`)
      }
    }
  } catch (error) {
    console.error('[Nurturing] Error processing booking prompts:', error)
    results.errors.push(`Booking prompt batch error: ${error}`)
  }

  // 4. Re-engagement: No login for 2+ weeks, has had activity before
  try {
    const inactive = await db.owner.findMany({
      where: {
        user: {
          lastLoginAt: { lte: twoWeeksAgo },
        },
        // Only re-engage owners who have shown some activity
        OR: [
          { properties: { some: {} } },
          { bookings: { some: {} } },
          { publicChatConversations: { some: {} } },
        ],
        nurturingCampaigns: { none: { emailType: 'RE_ENGAGEMENT' } },
      },
      include: {
        user: true,
        properties: true,
        bookings: { orderBy: { createdAt: 'desc' }, take: 1 },
        publicChatConversations: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
      take: 50,
    })

    console.log(`[Nurturing] Found ${inactive.length} inactive owners for re-engagement`)

    for (const owner of inactive) {
      const result = await sendNurturingEmail(owner, 'RE_ENGAGEMENT')
      if (result.success) {
        results.reEngagements++
      } else if (result.error !== 'Email already sent') {
        results.errors.push(`Re-engagement to ${owner.user.email}: ${result.error}`)
      }
    }
  } catch (error) {
    console.error('[Nurturing] Error processing re-engagements:', error)
    results.errors.push(`Re-engagement batch error: ${error}`)
  }

  console.log('[Nurturing] Results:', results)
  return results
}
