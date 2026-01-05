import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/dashboard/owner/arrival-prep - List owner's arrival prep requests
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

    const arrivalPreps = await db.arrivalPrep.findMany({
      where: { ownerId: owner.id },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
        cleaner: {
          include: {
            user: {
              select: {
                name: true,
                phone: true,
                image: true,
              },
            },
          },
        },
      },
      orderBy: { arrivalDate: 'desc' },
    })

    return NextResponse.json({
      arrivalPreps: arrivalPreps.map(prep => ({
        id: prep.id,
        arrivalDate: prep.arrivalDate,
        arrivalTime: prep.arrivalTime,
        extras: prep.extras,
        notes: prep.notes,
        status: prep.status,
        createdAt: prep.createdAt,
        property: prep.property,
        cleaner: {
          id: prep.cleaner.id,
          name: prep.cleaner.user.name,
          phone: prep.cleaner.user.phone,
          photo: prep.cleaner.user.image,
        },
      })),
    })
  } catch (error) {
    console.error('Error fetching arrival preps:', error)
    return NextResponse.json(
      { error: 'Failed to fetch arrival preps' },
      { status: 500 }
    )
  }
}

// POST /api/dashboard/owner/arrival-prep - Create new arrival prep request
export async function POST(req: NextRequest) {
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

    const body = await req.json()
    const { propertyId, cleanerId, arrivalDate, arrivalTime, extras, notes, savePreferences } = body

    // Validate required fields
    if (!propertyId || !cleanerId || !arrivalDate || !arrivalTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify property belongs to owner
    const property = await db.property.findFirst({
      where: { id: propertyId, ownerId: owner.id },
    })

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    // Verify cleaner exists
    const cleaner = await db.cleaner.findUnique({
      where: { id: cleanerId },
      include: {
        user: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
    })

    if (!cleaner) {
      return NextResponse.json(
        { error: 'Cleaner not found' },
        { status: 404 }
      )
    }

    // Create arrival prep
    const arrivalPrep = await db.arrivalPrep.create({
      data: {
        ownerId: owner.id,
        propertyId,
        cleanerId,
        arrivalDate: new Date(arrivalDate),
        arrivalTime,
        extras: extras || [],
        notes: notes || null,
      },
      include: {
        property: {
          select: {
            name: true,
            address: true,
          },
        },
      },
    })

    // Update owner's preferred extras if requested
    if (savePreferences && extras && extras.length > 0) {
      // Merge with existing preferences (keep unique)
      const existingExtras = owner.preferredExtras || []
      const mergedExtras = Array.from(new Set([...existingExtras, ...extras]))

      await db.owner.update({
        where: { id: owner.id },
        data: { preferredExtras: mergedExtras },
      })
    }

    return NextResponse.json({
      arrivalPrep: {
        id: arrivalPrep.id,
        arrivalDate: arrivalPrep.arrivalDate,
        arrivalTime: arrivalPrep.arrivalTime,
        extras: arrivalPrep.extras,
        notes: arrivalPrep.notes,
        status: arrivalPrep.status,
        property: arrivalPrep.property,
        cleaner: {
          name: cleaner.user.name,
          phone: cleaner.user.phone,
        },
      },
    })
  } catch (error) {
    console.error('Error creating arrival prep:', error)
    return NextResponse.json(
      { error: 'Failed to create arrival prep' },
      { status: 500 }
    )
  }
}
