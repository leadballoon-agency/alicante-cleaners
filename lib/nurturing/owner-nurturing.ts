import { db } from '@/lib/db'
import { sendNurturingEmail } from './send-email'

interface NurturingResults {
  profileNudges: number
  bookingPrompts: number
  reEngagements: number
  errors: string[]
}

/**
 * Process all owner nurturing campaigns
 * Called by daily cron job at 8am UTC
 */
export async function processOwnerNurturing(): Promise<NurturingResults> {
  const results: NurturingResults = {
    profileNudges: 0,
    bookingPrompts: 0,
    reEngagements: 0,
    errors: [],
  }

  const now = new Date()
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

  // 1. Profile Incomplete: 2+ days old, no name, no properties
  try {
    const incompleteProfiles = await db.owner.findMany({
      where: {
        createdAt: { lte: twoDaysAgo },
        user: { name: null },
        properties: { none: {} },
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

  // 2. First Booking Prompt: Property added 3+ days ago, no bookings
  try {
    const needsFirstBooking = await db.owner.findMany({
      where: {
        properties: {
          some: {
            createdAt: { lte: threeDaysAgo },
          },
        },
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

  // 3. Re-engagement: No login for 2+ weeks, has had activity before
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
