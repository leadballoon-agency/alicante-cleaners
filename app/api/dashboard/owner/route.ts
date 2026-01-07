import { NextRequest, NextResponse } from 'next/server'
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

// PATCH /api/dashboard/owner - Update owner profile
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, phone } = body

    // Validate inputs
    const updates: { name?: string; phone?: string | null } = {}

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length < 2) {
        return NextResponse.json(
          { error: 'Name must be at least 2 characters' },
          { status: 400 }
        )
      }
      updates.name = name.trim()
    }

    if (phone !== undefined) {
      if (phone === '' || phone === null) {
        updates.phone = null
      } else if (typeof phone === 'string') {
        // Normalize phone: remove spaces, ensure starts with +
        const normalizedPhone = phone.replace(/\s/g, '')
        if (!normalizedPhone.match(/^\+\d{10,15}$/)) {
          return NextResponse.json(
            { error: 'Invalid phone format. Include country code (e.g., +34612345678)' },
            { status: 400 }
          )
        }

        // Check if phone is already in use by another user
        const existingUser = await db.user.findFirst({
          where: {
            phone: normalizedPhone,
            id: { not: session.user.id },
          },
        })

        if (existingUser) {
          return NextResponse.json(
            { error: 'This phone number is already registered to another account' },
            { status: 400 }
          )
        }

        updates.phone = normalizedPhone
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid updates provided' },
        { status: 400 }
      )
    }

    // Update the user record
    const updatedUser = await db.user.update({
      where: { id: session.user.id },
      data: updates,
      select: {
        name: true,
        email: true,
        phone: true,
      },
    })

    return NextResponse.json({
      success: true,
      user: updatedUser,
    })
  } catch (error) {
    console.error('Error updating owner profile:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
