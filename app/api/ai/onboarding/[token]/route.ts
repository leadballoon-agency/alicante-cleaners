/**
 * Get Onboarding Details
 *
 * GET /api/ai/onboarding/[token]
 *
 * Returns the onboarding details for the magic link page.
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

const SERVICE_NAMES: Record<string, string> = {
  regular: 'Regular Clean',
  deep: 'Deep Clean',
  arrival: 'Arrival Prep',
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    const onboarding = await db.pendingOnboarding.findUnique({
      where: { token },
      include: {
        cleaner: {
          include: { user: { select: { name: true, image: true } } },
        },
      },
    })

    if (!onboarding) {
      return NextResponse.json(
        { error: 'Onboarding not found' },
        { status: 404 }
      )
    }

    // Check if expired
    if (new Date() > onboarding.expiresAt && onboarding.status === 'PENDING') {
      // Mark as expired
      await db.pendingOnboarding.update({
        where: { id: onboarding.id },
        data: { status: 'EXPIRED' },
      })

      return NextResponse.json(
        { error: 'Onboarding link expired' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: onboarding.id,
      cleanerName: onboarding.cleaner.user.name,
      cleanerPhoto: onboarding.cleaner.user.image,
      visitorName: onboarding.visitorName,
      visitorPhone: onboarding.visitorPhone,
      bedrooms: onboarding.bedrooms,
      bathrooms: onboarding.bathrooms,
      outdoorAreas: onboarding.outdoorAreas,
      accessNotes: onboarding.accessNotes,
      serviceType: onboarding.serviceType,
      serviceName: SERVICE_NAMES[onboarding.serviceType] || onboarding.serviceType,
      servicePrice: Number(onboarding.servicePrice),
      serviceHours: onboarding.serviceHours,
      preferredDate: onboarding.preferredDate.toISOString(),
      preferredTime: onboarding.preferredTime,
      status: onboarding.status,
      expiresAt: onboarding.expiresAt.toISOString(),
    })
  } catch (error) {
    console.error('Onboarding fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch onboarding' },
      { status: 500 }
    )
  }
}
