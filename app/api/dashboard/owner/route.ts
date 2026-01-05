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

    let owner = await db.owner.findUnique({
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

    // Auto-create owner profile if user doesn't have one
    if (!owner) {
      // Get user details for referral code generation
      const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, email: true, phone: true, image: true },
      })

      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }

      // Generate referral code
      const nameForCode = user.name || user.email?.split('@')[0] || 'USER'
      const cleanName = nameForCode.split(' ')[0].toUpperCase().slice(0, 4).replace(/[^A-Z]/g, 'X')
      const year = new Date().getFullYear()
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
      const referralCode = `${cleanName}${year}${random}`

      // Create owner profile
      owner = await db.owner.create({
        data: {
          userId: session.user.id,
          referralCode,
          trusted: false,
        },
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
    }

    // Get referral count by counting users who were referred by this owner
    // For now, we'll return empty referrals since we don't have a referrals table
    // In production, you'd track referrals in a separate table
    const referrals: { name: string; joinedAt: Date; hasBooked: boolean }[] = []

    // Generate a friendly display name
    const displayName = owner.user.name ||
      (owner.user.email ? owner.user.email.split('@')[0] : null) ||
      (owner.user.phone ? `Owner ${owner.user.phone.slice(-4)}` : 'Villa Owner')

    return NextResponse.json({
      owner: {
        id: owner.id,
        name: displayName,
        email: owner.user.email || '',
        phone: owner.user.phone || '',
        referralCode: owner.referralCode,
        referralCredits: Number(owner.referralCredits),
        totalBookings: owner.totalBookings,
        referrals,
        needsName: !owner.user.name, // Flag to prompt user to set their name
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
