import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/dashboard/owner/properties - Get owner's properties
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
      select: { id: true },
    })

    if (!owner) {
      return NextResponse.json(
        { error: 'Owner profile not found' },
        { status: 404 }
      )
    }

    const properties = await db.property.findMany({
      where: { ownerId: owner.id },
      orderBy: { createdAt: 'desc' },
    })

    // For now, we don't have a "saved cleaner" field per property
    // In production, you might add a preferredCleanerId to Property model
    const formattedProperties = properties.map(p => ({
      id: p.id,
      name: p.name,
      address: p.address,
      bedrooms: p.bedrooms,
      savedCleaner: null, // Would need to add this relation to schema
    }))

    return NextResponse.json({ properties: formattedProperties })
  } catch (error) {
    console.error('Error fetching owner properties:', error)
    return NextResponse.json(
      { error: 'Failed to fetch properties' },
      { status: 500 }
    )
  }
}

// POST /api/dashboard/owner/properties - Create new property
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { name, address, bedrooms, bathrooms } = await request.json()

    if (!name?.trim() || !address?.trim()) {
      return NextResponse.json(
        { error: 'Name and address are required' },
        { status: 400 }
      )
    }

    const owner = await db.owner.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })

    if (!owner) {
      return NextResponse.json(
        { error: 'Owner profile not found' },
        { status: 404 }
      )
    }

    const property = await db.property.create({
      data: {
        ownerId: owner.id,
        name: name.trim(),
        address: address.trim(),
        bedrooms: bedrooms || 2,
        bathrooms: bathrooms || 1,
      },
    })

    // Track onboarding progress: mark first property as added
    const ownerData = await db.owner.findUnique({
      where: { id: owner.id },
      select: {
        firstPropertyAddedAt: true,
        profileCompletedAt: true,
        firstBookingAt: true,
      },
    })

    if (ownerData && !ownerData.firstPropertyAddedAt) {
      const onboardingUpdates: { firstPropertyAddedAt: Date; onboardingCompletedAt?: Date } = {
        firstPropertyAddedAt: new Date(),
      }

      // Check if all onboarding steps are now complete
      if (ownerData.profileCompletedAt && ownerData.firstBookingAt) {
        onboardingUpdates.onboardingCompletedAt = new Date()
      }

      await db.owner.update({
        where: { id: owner.id },
        data: onboardingUpdates,
      })
    }

    return NextResponse.json({
      success: true,
      property: {
        id: property.id,
        name: property.name,
        address: property.address,
        bedrooms: property.bedrooms,
        savedCleaner: null,
      },
    })
  } catch (error) {
    console.error('Error creating property:', error)
    return NextResponse.json(
      { error: 'Failed to create property' },
      { status: 500 }
    )
  }
}
