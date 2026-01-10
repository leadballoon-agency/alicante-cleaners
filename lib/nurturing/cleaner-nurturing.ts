import { db } from '@/lib/db'
import { sendCleanerNurturingEmail } from './send-email'

interface CleanerNurturingResults {
  profileTips: number
  calendarGuides: number
  bookingTips: number
  teamOpportunities: number
  promoteTips: number
  reactivations: number
  errors: string[]
}

/**
 * Process all cleaner education campaigns
 * Called by daily cron job at 8am UTC
 *
 * Email sequence timing:
 * - PROFILE_TIPS: 24h after signup if profile incomplete
 * - CALENDAR_SYNC_GUIDE: 48h after signup if calendar not connected
 * - BOOKING_MANAGEMENT_TIPS: 1 week after first completed booking
 * - TEAM_OPPORTUNITY: 2 weeks after signup if not on a team
 * - PROMOTE_PROFILE_TIPS: 3 weeks after signup
 * - CLEANER_REACTIVATION: 2 weeks no login
 */
export async function processCleanerNurturing(): Promise<CleanerNurturingResults> {
  const results: CleanerNurturingResults = {
    profileTips: 0,
    calendarGuides: 0,
    bookingTips: 0,
    teamOpportunities: 0,
    promoteTips: 0,
    reactivations: 0,
    errors: [],
  }

  const now = new Date()
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
  const threeWeeksAgo = new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000)

  // 1. Profile Tips: 24h+ since signup, profile incomplete (no bio or no photo)
  try {
    const needsProfileTips = await db.cleaner.findMany({
      where: {
        status: 'ACTIVE', // Only active cleaners
        createdAt: { lte: oneDayAgo },
        OR: [
          { bio: null },
          { bio: '' },
          { user: { image: null } },
        ],
        nurturingCampaigns: { none: { emailType: 'PROFILE_TIPS' } },
      },
      include: {
        user: true,
        bookings: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
      take: 50,
    })

    console.log(`[Cleaner Nurturing] Found ${needsProfileTips.length} cleaners needing profile tips`)

    for (const cleaner of needsProfileTips) {
      const result = await sendCleanerNurturingEmail(cleaner, 'PROFILE_TIPS')
      if (result.success) {
        results.profileTips++
      } else if (result.error !== 'Email already sent') {
        results.errors.push(`Profile tips to ${cleaner.user.email}: ${result.error}`)
      }
    }
  } catch (error) {
    console.error('[Cleaner Nurturing] Error processing profile tips:', error)
    results.errors.push(`Profile tips batch error: ${error}`)
  }

  // 2. Calendar Sync Guide: 48h+ since signup, calendar not connected
  try {
    const needsCalendarGuide = await db.cleaner.findMany({
      where: {
        status: 'ACTIVE',
        createdAt: { lte: twoDaysAgo },
        googleCalendarConnected: false,
        nurturingCampaigns: { none: { emailType: 'CALENDAR_SYNC_GUIDE' } },
      },
      include: {
        user: true,
        bookings: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
      take: 50,
    })

    console.log(`[Cleaner Nurturing] Found ${needsCalendarGuide.length} cleaners needing calendar guide`)

    for (const cleaner of needsCalendarGuide) {
      const result = await sendCleanerNurturingEmail(cleaner, 'CALENDAR_SYNC_GUIDE')
      if (result.success) {
        results.calendarGuides++
      } else if (result.error !== 'Email already sent') {
        results.errors.push(`Calendar guide to ${cleaner.user.email}: ${result.error}`)
      }
    }
  } catch (error) {
    console.error('[Cleaner Nurturing] Error processing calendar guides:', error)
    results.errors.push(`Calendar guide batch error: ${error}`)
  }

  // 3. Booking Management Tips: 1 week after first completed booking
  try {
    const needsBookingTips = await db.cleaner.findMany({
      where: {
        status: 'ACTIVE',
        totalBookings: { gte: 1 },
        bookings: {
          some: {
            status: 'COMPLETED',
            createdAt: { lte: oneWeekAgo },
          },
        },
        nurturingCampaigns: { none: { emailType: 'BOOKING_MANAGEMENT_TIPS' } },
      },
      include: {
        user: true,
        bookings: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
      take: 50,
    })

    console.log(`[Cleaner Nurturing] Found ${needsBookingTips.length} cleaners needing booking tips`)

    for (const cleaner of needsBookingTips) {
      const result = await sendCleanerNurturingEmail(cleaner, 'BOOKING_MANAGEMENT_TIPS')
      if (result.success) {
        results.bookingTips++
      } else if (result.error !== 'Email already sent') {
        results.errors.push(`Booking tips to ${cleaner.user.email}: ${result.error}`)
      }
    }
  } catch (error) {
    console.error('[Cleaner Nurturing] Error processing booking tips:', error)
    results.errors.push(`Booking tips batch error: ${error}`)
  }

  // 4. Team Opportunity: 2 weeks after signup, not on a team
  try {
    const needsTeamInfo = await db.cleaner.findMany({
      where: {
        status: 'ACTIVE',
        createdAt: { lte: twoWeeksAgo },
        teamId: null,
        teamLeader: false,
        nurturingCampaigns: { none: { emailType: 'TEAM_OPPORTUNITY' } },
      },
      include: {
        user: true,
        bookings: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
      take: 50,
    })

    console.log(`[Cleaner Nurturing] Found ${needsTeamInfo.length} cleaners for team opportunity`)

    for (const cleaner of needsTeamInfo) {
      const result = await sendCleanerNurturingEmail(cleaner, 'TEAM_OPPORTUNITY')
      if (result.success) {
        results.teamOpportunities++
      } else if (result.error !== 'Email already sent') {
        results.errors.push(`Team opportunity to ${cleaner.user.email}: ${result.error}`)
      }
    }
  } catch (error) {
    console.error('[Cleaner Nurturing] Error processing team opportunities:', error)
    results.errors.push(`Team opportunity batch error: ${error}`)
  }

  // 5. Promote Profile Tips: 3 weeks after signup
  try {
    const needsPromoteTips = await db.cleaner.findMany({
      where: {
        status: 'ACTIVE',
        createdAt: { lte: threeWeeksAgo },
        nurturingCampaigns: { none: { emailType: 'PROMOTE_PROFILE_TIPS' } },
      },
      include: {
        user: true,
        bookings: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
      take: 50,
    })

    console.log(`[Cleaner Nurturing] Found ${needsPromoteTips.length} cleaners for promote tips`)

    for (const cleaner of needsPromoteTips) {
      const result = await sendCleanerNurturingEmail(cleaner, 'PROMOTE_PROFILE_TIPS')
      if (result.success) {
        results.promoteTips++
      } else if (result.error !== 'Email already sent') {
        results.errors.push(`Promote tips to ${cleaner.user.email}: ${result.error}`)
      }
    }
  } catch (error) {
    console.error('[Cleaner Nurturing] Error processing promote tips:', error)
    results.errors.push(`Promote tips batch error: ${error}`)
  }

  // 6. Reactivation: No login for 2+ weeks, has had some activity
  try {
    const inactive = await db.cleaner.findMany({
      where: {
        status: 'ACTIVE',
        user: {
          lastLoginAt: { lte: twoWeeksAgo },
        },
        // Only re-engage cleaners who have shown some activity
        OR: [
          { totalBookings: { gte: 1 } },
          { reviewCount: { gte: 1 } },
        ],
        nurturingCampaigns: { none: { emailType: 'CLEANER_REACTIVATION' } },
      },
      include: {
        user: true,
        bookings: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
      take: 50,
    })

    console.log(`[Cleaner Nurturing] Found ${inactive.length} inactive cleaners for reactivation`)

    for (const cleaner of inactive) {
      const result = await sendCleanerNurturingEmail(cleaner, 'CLEANER_REACTIVATION')
      if (result.success) {
        results.reactivations++
      } else if (result.error !== 'Email already sent') {
        results.errors.push(`Reactivation to ${cleaner.user.email}: ${result.error}`)
      }
    }
  } catch (error) {
    console.error('[Cleaner Nurturing] Error processing reactivations:', error)
    results.errors.push(`Reactivation batch error: ${error}`)
  }

  console.log('[Cleaner Nurturing] Results:', results)
  return results
}
