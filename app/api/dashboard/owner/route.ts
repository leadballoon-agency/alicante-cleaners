import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/dashboard/owner - Get owner profile + stats
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
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
            image: true,
          },
        },
      },
    })

    if (!owner) {
      return NextResponse.json(
        { error: 'Owner profile not found' },
        { status: 404 }
      )
    }

    // Get referral count by counting users who were referred by this owner
    // For now, we'll return empty referrals since we don't have a referrals table
    // In production, you'd track referrals in a separate table
    const referrals: { name: string; joinedAt: Date; hasBooked: boolean }[] = []

    return NextResponse.json({
      owner: {
        id: owner.id,
        name: owner.user.name || 'Unknown',
        email: owner.user.email || '',
        phone: owner.user.phone || '',
        referralCode: owner.referralCode,
        referralCredits: Number(owner.referralCredits),
        totalBookings: owner.totalBookings,
        referrals,
      },
    })
  } catch (error) {
    console.error('Error fetching owner dashboard:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
