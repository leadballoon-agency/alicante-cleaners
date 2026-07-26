import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/dashboard/owner/referrals - Get owner's referral stats
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const owner = await db.owner.findUnique({
      where: { userId: session.user.id },
    })

    if (!owner) {
      return NextResponse.json(
        { error: 'Owner profile not found' },
        { status: 404 }
      )
    }

    // Find owners who were referred by this owner's referral code.
    // referredBy is only ever written as an Owner.referralCode (see
    // lib/referrals.ts) — matching on the referrer's display name was
    // dead code (no owner-creation path ever wrote a name there) and has
    // been dropped.
    const referredOwners = await db.owner.findMany({
      where: {
        referredBy: owner.referralCode,
      },
      include: {
        user: {
          select: { name: true, createdAt: true },
        },
      },
    })

    const referrals = referredOwners.map(r => ({
      name: r.user.name || 'Unknown',
      joinedAt: r.user.createdAt,
      hasBooked: r.totalBookings > 0,
    }))

    const completedReferrals = referrals.filter(r => r.hasBooked).length
    const creditsEarned = completedReferrals * 10 // €10 per completed referral

    return NextResponse.json({
      referralCode: owner.referralCode,
      referralCredits: Number(owner.referralCredits),
      referrals,
      stats: {
        total: referrals.length,
        completed: completedReferrals,
        pending: referrals.length - completedReferrals,
        creditsEarned,
      },
    })
  } catch (error) {
    console.error('Error fetching referrals:', error)
    return NextResponse.json(
      { error: 'Failed to fetch referrals' },
      { status: 500 }
    )
  }
}
