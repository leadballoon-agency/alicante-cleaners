import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { isApprovalReady, notifyIfApprovalReady } from '@/lib/notifications/approval-ready'
import { runSideEffects } from '@/lib/side-effects'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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
    const userUpdates: { name?: string; image?: string; email?: string } = {}
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

    // Email capture (problem #4 in the unified-login PR): cleaners who
    // signed up phone-only had no way to add an email afterwards - only
    // onboarding captured it, and only optionally. This lets them add one
    // from the Profile tab so they can magic-link in from any device.
    // Deliberately does NOT touch emailVerified - a normal magic-link
    // sign-in later verifies it the same way it does for every owner.
    if (updates.email !== undefined) {
      const candidate = typeof updates.email === 'string' ? updates.email.trim().toLowerCase() : ''
      if (!candidate || !EMAIL_REGEX.test(candidate)) {
        return NextResponse.json(
          { error: 'Please enter a valid email address' },
          { status: 400 }
        )
      }

      const emailTaken = await db.user.findFirst({
        where: { email: candidate, id: { not: session.user.id } },
        select: { id: true },
      })
      if (emailTaken) {
        return NextResponse.json(
          { error: 'That email is already in use' },
          { status: 409 }
        )
      }

      userUpdates.email = candidate
    }

    // Update in a transaction
    let result
    try {
      result = await db.$transaction(async (tx) => {
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
                  email: true,
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
                email: true,
              },
            },
          },
        })
      })
    } catch (err) {
      // Race: another request claimed this email between our check above and
      // this write. Never crash over an email conflict - surface the same
      // friendly message the pre-check returns.
      const isEmailConflict =
        userUpdates.email &&
        err &&
        typeof err === 'object' &&
        'code' in err &&
        (err as { code?: string }).code === 'P2002' &&
        (err as { meta?: { target?: string[] } }).meta?.target?.includes('email')

      if (isEmailConflict) {
        return NextResponse.json({ error: 'That email is already in use' }, { status: 409 })
      }
      throw err
    }

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
        email: result?.user.email,
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
