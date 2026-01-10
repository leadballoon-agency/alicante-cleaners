/**
 * Create Onboarding Magic Link
 *
 * POST /api/ai/onboarding/create
 *
 * Called by the AI after collecting all visitor information.
 * Creates a PendingOnboarding record and sends a magic link via SMS.
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { randomBytes } from 'crypto'

interface OnboardingData {
  cleanerSlug: string

  // Visitor info
  visitorName: string
  visitorPhone: string
  visitorEmail?: string

  // Property details
  bedrooms: number
  bathrooms: number
  outdoorAreas: string[]
  accessNotes?: string
  address?: string
  ownerType?: 'REMOTE' | 'RESIDENT' // REMOTE = visits from abroad, RESIDENT = lives there

  // Booking details
  serviceType: 'regular' | 'deep' | 'arrival'
  preferredDate: string // ISO date string
  preferredTime: string
}

const SERVICE_CONFIG = {
  regular: { name: 'Regular Clean', hours: 3 },
  deep: { name: 'Deep Clean', hours: 5 },
  arrival: { name: 'Arrival Prep', hours: 4 },
}

export async function POST(request: Request) {
  try {
    const data: OnboardingData = await request.json()

    // Validate required fields
    if (!data.cleanerSlug || !data.visitorName || !data.visitorPhone ||
        !data.bedrooms || !data.bathrooms || !data.serviceType ||
        !data.preferredDate || !data.preferredTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get cleaner
    const cleaner = await db.cleaner.findUnique({
      where: { slug: data.cleanerSlug },
      include: { user: { select: { name: true } } },
    })

    if (!cleaner) {
      return NextResponse.json(
        { error: 'Cleaner not found' },
        { status: 404 }
      )
    }

    // Calculate price
    const serviceInfo = SERVICE_CONFIG[data.serviceType]
    const servicePrice = Number(cleaner.hourlyRate) * serviceInfo.hours

    // Generate unique token
    const token = randomBytes(32).toString('hex')

    // Set expiration (24 hours)
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    // Create pending onboarding
    const onboarding = await db.pendingOnboarding.create({
      data: {
        cleanerId: cleaner.id,
        token,
        visitorName: data.visitorName,
        visitorPhone: data.visitorPhone,
        visitorEmail: data.visitorEmail,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        outdoorAreas: data.outdoorAreas,
        accessNotes: data.accessNotes,
        address: data.address,
        ownerType: data.ownerType,
        serviceType: data.serviceType,
        servicePrice,
        serviceHours: serviceInfo.hours,
        preferredDate: new Date(data.preferredDate),
        preferredTime: data.preferredTime,
        expiresAt,
      },
    })

    // Build magic link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const magicLink = `${baseUrl}/onboard/${token}`

    // TODO: Send SMS with magic link
    // For now, log it (in production, use Twilio/MessageBird)
    console.log(`\n📱 Magic Link for ${data.visitorName}:`)
    console.log(`   ${magicLink}`)
    console.log(`   Phone: ${data.visitorPhone}\n`)

    // Log AI usage
    await db.aIUsageLog.create({
      data: {
        cleanerId: cleaner.id,
        conversationId: 'public-onboarding',
        action: 'ONBOARDING_CREATED',
        tokensUsed: 0,
      },
    })

    return NextResponse.json({
      success: true,
      onboardingId: onboarding.id,
      magicLink,
      message: `Magic link created for ${data.visitorName}`,
    })
  } catch (error) {
    console.error('Onboarding creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create onboarding' },
      { status: 500 }
    )
  }
}
