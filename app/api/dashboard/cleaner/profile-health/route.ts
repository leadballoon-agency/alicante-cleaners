/**
 * Cleaner Dashboard Profile Health API
 *
 * GET: Returns the authenticated cleaner's profile completeness score and
 * per-field checklist (photo, bio, service areas, hourly rate, reviews,
 * languages, calendar sync). Used by the "Get Started" onboarding card.
 *
 * Intentionally available to PENDING cleaners (not just ACTIVE) - new
 * signups need this data to know what to complete before they can go live.
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { getProfileHealth } from '@/lib/ai/success-agent-tools'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

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

    const health = await getProfileHealth(cleaner.id)

    return NextResponse.json({ health })
  } catch (error) {
    console.error('Error fetching profile health:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile health' },
      { status: 500 }
    )
  }
}
