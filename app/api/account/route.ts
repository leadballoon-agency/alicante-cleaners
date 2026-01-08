/**
 * Account Management API
 * Handles pause, unpause, deletion request, and cancellation
 * with focus on retention and graceful offboarding
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// GET - Get current account status
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        accountStatus: true,
        pausedAt: true,
        pausedReason: true,
        deletionRequestedAt: true,
        deletionScheduledFor: true,
        deletionReason: true,
        role: true,
        createdAt: true,
        cleaner: {
          select: {
            totalBookings: true,
            reviewCount: true,
            rating: true,
          },
        },
        owner: {
          select: {
            totalBookings: true,
            _count: {
              select: { properties: true },
            },
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Calculate days until deletion if pending
    let daysUntilDeletion = null
    if (user.deletionScheduledFor) {
      const now = new Date()
      const diff = user.deletionScheduledFor.getTime() - now.getTime()
      daysUntilDeletion = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
    }

    return NextResponse.json({
      status: user.accountStatus,
      pausedAt: user.pausedAt,
      pausedReason: user.pausedReason,
      deletionRequestedAt: user.deletionRequestedAt,
      deletionScheduledFor: user.deletionScheduledFor,
      daysUntilDeletion,
      role: user.role,
      memberSince: user.createdAt,
      stats: user.role === 'CLEANER' ? {
        totalBookings: user.cleaner?.totalBookings || 0,
        reviewCount: user.cleaner?.reviewCount || 0,
        rating: user.cleaner?.rating ? Number(user.cleaner.rating) : null,
      } : {
        totalBookings: user.owner?.totalBookings || 0,
        propertyCount: user.owner?._count?.properties || 0,
      },
    })
  } catch (error) {
    console.error('Error fetching account status:', error)
    return NextResponse.json({ error: 'Failed to fetch account status' }, { status: 500 })
  }
}

// POST - Perform account action
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action, reason, feedback } = await request.json()

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { accountStatus: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    switch (action) {
      case 'pause': {
        // Pause the account (temporary break)
        if (user.accountStatus !== 'ACTIVE') {
          return NextResponse.json(
            { error: 'Account must be active to pause' },
            { status: 400 }
          )
        }

        await db.user.update({
          where: { id: session.user.id },
          data: {
            accountStatus: 'PAUSED',
            pausedAt: new Date(),
            pausedReason: reason || null,
          },
        })

        // If cleaner, set status to SUSPENDED so they don't appear in search
        const cleaner = await db.cleaner.findUnique({
          where: { userId: session.user.id },
        })
        if (cleaner) {
          await db.cleaner.update({
            where: { id: cleaner.id },
            data: { status: 'SUSPENDED' },
          })
        }

        return NextResponse.json({
          success: true,
          message: 'Account paused. You can reactivate anytime.',
          status: 'PAUSED',
        })
      }

      case 'unpause': {
        // Reactivate the account
        if (user.accountStatus !== 'PAUSED') {
          return NextResponse.json(
            { error: 'Account is not paused' },
            { status: 400 }
          )
        }

        await db.user.update({
          where: { id: session.user.id },
          data: {
            accountStatus: 'ACTIVE',
            pausedAt: null,
            pausedReason: null,
          },
        })

        // If cleaner, set status back to ACTIVE
        const cleaner = await db.cleaner.findUnique({
          where: { userId: session.user.id },
        })
        if (cleaner) {
          await db.cleaner.update({
            where: { id: cleaner.id },
            data: { status: 'ACTIVE' },
          })
        }

        return NextResponse.json({
          success: true,
          message: 'Welcome back! Your account is active again.',
          status: 'ACTIVE',
        })
      }

      case 'request_deletion': {
        // Request account deletion (30-day grace period)
        if (user.accountStatus === 'PENDING_DELETION') {
          return NextResponse.json(
            { error: 'Deletion already requested' },
            { status: 400 }
          )
        }

        const now = new Date()
        const deletionDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days

        await db.user.update({
          where: { id: session.user.id },
          data: {
            accountStatus: 'PENDING_DELETION',
            deletionRequestedAt: now,
            deletionScheduledFor: deletionDate,
            deletionReason: reason || null,
            deletionFeedback: feedback || null,
          },
        })

        // If cleaner, set status to SUSPENDED
        const cleaner = await db.cleaner.findUnique({
          where: { userId: session.user.id },
        })
        if (cleaner) {
          await db.cleaner.update({
            where: { id: cleaner.id },
            data: { status: 'SUSPENDED' },
          })
        }

        return NextResponse.json({
          success: true,
          message: 'Deletion scheduled. You have 30 days to change your mind.',
          status: 'PENDING_DELETION',
          deletionScheduledFor: deletionDate,
          daysUntilDeletion: 30,
        })
      }

      case 'cancel_deletion': {
        // Cancel deletion request
        if (user.accountStatus !== 'PENDING_DELETION') {
          return NextResponse.json(
            { error: 'No deletion request to cancel' },
            { status: 400 }
          )
        }

        await db.user.update({
          where: { id: session.user.id },
          data: {
            accountStatus: 'ACTIVE',
            deletionRequestedAt: null,
            deletionScheduledFor: null,
            deletionReason: null,
            deletionFeedback: null,
          },
        })

        // If cleaner, reactivate
        const cleaner = await db.cleaner.findUnique({
          where: { userId: session.user.id },
        })
        if (cleaner) {
          await db.cleaner.update({
            where: { id: cleaner.id },
            data: { status: 'ACTIVE' },
          })
        }

        return NextResponse.json({
          success: true,
          message: 'Deletion cancelled. Welcome back!',
          status: 'ACTIVE',
        })
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error processing account action:', error)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}
