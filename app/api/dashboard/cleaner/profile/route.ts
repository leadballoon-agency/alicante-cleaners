import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// PATCH /api/dashboard/cleaner/profile - Update cleaner profile
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const updates = await request.json()

    const cleaner = await db.cleaner.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })

    if (!cleaner) {
      return NextResponse.json(
        { error: 'Cleaner profile not found' },
        { status: 404 }
      )
    }

    // Separate user updates from cleaner updates
    const userUpdates: { name?: string; image?: string } = {}
    const cleanerUpdates: {
      bio?: string
      serviceAreas?: string[]
      hourlyRate?: number
      reviewsLink?: string
    } = {}

    if (updates.name !== undefined) {
      userUpdates.name = updates.name
    }
    if (updates.photo !== undefined) {
      userUpdates.image = updates.photo
    }
    if (updates.bio !== undefined) {
      cleanerUpdates.bio = updates.bio
    }
    if (updates.serviceAreas !== undefined) {
      cleanerUpdates.serviceAreas = updates.serviceAreas
    }
    if (updates.hourlyRate !== undefined) {
      cleanerUpdates.hourlyRate = updates.hourlyRate
    }
    if (updates.reviewsLink !== undefined) {
      cleanerUpdates.reviewsLink = updates.reviewsLink
    }

    // Update in a transaction
    const result = await db.$transaction(async (tx) => {
      if (Object.keys(userUpdates).length > 0) {
        await tx.user.update({
          where: { id: session.user.id },
          data: userUpdates,
        })
      }

      if (Object.keys(cleanerUpdates).length > 0) {
        return await tx.cleaner.update({
          where: { id: cleaner.id },
          data: cleanerUpdates,
          include: {
            user: {
              select: {
                name: true,
                image: true,
              },
            },
          },
        })
      }

      return await tx.cleaner.findUnique({
        where: { id: cleaner.id },
        include: {
          user: {
            select: {
              name: true,
              image: true,
            },
          },
        },
      })
    })

    return NextResponse.json({
      success: true,
      cleaner: {
        id: result?.id,
        slug: result?.slug,
        bio: result?.bio,
        serviceAreas: result?.serviceAreas,
        hourlyRate: result?.hourlyRate ? Number(result.hourlyRate) : null,
        name: result?.user.name,
        photo: result?.user.image,
      },
    })
  } catch (error) {
    console.error('Error updating cleaner profile:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
