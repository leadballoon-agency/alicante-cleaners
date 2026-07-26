import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { isApprovalReady, notifyIfApprovalReady } from '@/lib/notifications/approval-ready'
import { runSideEffects } from '@/lib/side-effects'

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

    // Loaded with enough fields to evaluate approval-readiness BEFORE this
    // update is applied (see notifyIfApprovalReady call below) - this is the
    // only route that can change any of photo/bio/serviceAreas/hourlyRate
    // for an existing cleaner (photo uploads only return a blob URL; the
    // client then PATCHes it here as `photo`).
    const cleaner = await db.cleaner.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        status: true,
        bio: true,
        serviceAreas: true,
        hourlyRate: true,
        user: { select: { image: true } },
      },
    })

    if (!cleaner) {
      return NextResponse.json(
        { error: 'Cleaner profile not found' },
        { status: 404 }
      )
    }

    const wasReadyBefore = isApprovalReady(cleaner)

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

    // Best-effort staff push the moment this update carries a PENDING
    // cleaner's profile across the approval-ready threshold. Must be
    // awaited (not fire-and-forget) so the push actually completes before
    // Vercel freezes this function - see lib/side-effects.ts.
    await runSideEffects([
      {
        label: `approval-ready-push:${cleaner.id}`,
        promise: notifyIfApprovalReady(cleaner.id, wasReadyBefore),
      },
    ])

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
