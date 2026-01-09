import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

// Validation schema for creating/updating services
const serviceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  type: z.enum(['CUSTOM', 'ADDON']),
  priceType: z.enum(['HOURLY', 'FIXED']),
  price: z.number().positive().optional(), // Required for FIXED type
  hours: z.number().int().positive().optional(), // Required for HOURLY type
  sortOrder: z.number().int().min(0).optional(),
})

// GET /api/dashboard/cleaner/services - Get team services
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get cleaner with team info
    const cleaner = await db.cleaner.findUnique({
      where: { userId: session.user.id },
      include: {
        ledTeam: {
          include: {
            services: {
              orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
            },
          },
        },
        memberOfTeam: {
          include: {
            services: {
              where: { status: 'APPROVED' }, // Non-leaders only see approved
              orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
            },
          },
        },
      },
    })

    if (!cleaner) {
      return NextResponse.json({ error: 'Cleaner not found' }, { status: 404 })
    }

    // Determine team and services
    const isTeamLeader = !!cleaner.ledTeam
    const team = cleaner.ledTeam || cleaner.memberOfTeam
    const services = team?.services || []

    return NextResponse.json({
      services,
      isTeamLeader,
      teamId: team?.id || null,
      teamName: team?.name || null,
    })
  } catch (error) {
    console.error('Error fetching services:', error)
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 })
  }
}

// POST /api/dashboard/cleaner/services - Create new service (team leaders only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get cleaner and verify they're a team leader
    const cleaner = await db.cleaner.findUnique({
      where: { userId: session.user.id },
      include: { ledTeam: true },
    })

    if (!cleaner) {
      return NextResponse.json({ error: 'Cleaner not found' }, { status: 404 })
    }

    if (!cleaner.ledTeam) {
      return NextResponse.json(
        { error: 'Only team leaders can create services' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const parseResult = serviceSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { name, description, type, priceType, price, hours, sortOrder } = parseResult.data

    // Validate pricing based on priceType
    if (priceType === 'FIXED' && !price) {
      return NextResponse.json(
        { error: 'Fixed price services require a price' },
        { status: 400 }
      )
    }

    if (priceType === 'HOURLY' && !hours) {
      return NextResponse.json(
        { error: 'Hourly services require hours estimate' },
        { status: 400 }
      )
    }

    // Create the service
    const service = await db.teamService.create({
      data: {
        teamId: cleaner.ledTeam.id,
        name,
        description: description || null,
        type,
        priceType,
        price: priceType === 'FIXED' ? price : null,
        hours: priceType === 'HOURLY' ? hours : null,
        sortOrder: sortOrder ?? 0,
        status: 'PENDING', // Always starts as pending, needs admin approval
      },
    })

    return NextResponse.json({ service })
  } catch (error) {
    console.error('Error creating service:', error)
    return NextResponse.json({ error: 'Failed to create service' }, { status: 500 })
  }
}
