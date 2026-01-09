import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

// Validation schema for updating services
const updateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  description: z.string().max(500, 'Description too long').optional(),
  type: z.enum(['CUSTOM', 'ADDON']).optional(),
  priceType: z.enum(['HOURLY', 'FIXED']).optional(),
  price: z.number().positive().optional(),
  hours: z.number().int().positive().optional(),
  sortOrder: z.number().int().min(0).optional(),
})

// GET /api/dashboard/cleaner/services/[id] - Get single service
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cleaner = await db.cleaner.findUnique({
      where: { userId: session.user.id },
      include: { ledTeam: true, memberOfTeam: true },
    })

    if (!cleaner) {
      return NextResponse.json({ error: 'Cleaner not found' }, { status: 404 })
    }

    const teamId = cleaner.ledTeam?.id || cleaner.memberOfTeam?.id
    if (!teamId) {
      return NextResponse.json({ error: 'Not in a team' }, { status: 403 })
    }

    const service = await db.teamService.findFirst({
      where: {
        id,
        teamId,
      },
    })

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    return NextResponse.json({ service })
  } catch (error) {
    console.error('Error fetching service:', error)
    return NextResponse.json({ error: 'Failed to fetch service' }, { status: 500 })
  }
}

// PATCH /api/dashboard/cleaner/services/[id] - Update service
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
        { error: 'Only team leaders can update services' },
        { status: 403 }
      )
    }

    // Verify the service belongs to this team
    const existingService = await db.teamService.findFirst({
      where: {
        id,
        teamId: cleaner.ledTeam.id,
      },
    })

    if (!existingService) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    const body = await request.json()
    const parseResult = updateSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const updates = parseResult.data

    // If changing price type, validate accordingly
    const newPriceType = updates.priceType || existingService.priceType
    if (newPriceType === 'FIXED' && updates.priceType === 'FIXED' && !updates.price && !existingService.price) {
      return NextResponse.json(
        { error: 'Fixed price services require a price' },
        { status: 400 }
      )
    }

    if (newPriceType === 'HOURLY' && updates.priceType === 'HOURLY' && !updates.hours && !existingService.hours) {
      return NextResponse.json(
        { error: 'Hourly services require hours estimate' },
        { status: 400 }
      )
    }

    // Build update data
    const updateData: Record<string, unknown> = {}
    if (updates.name !== undefined) updateData.name = updates.name
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.type !== undefined) updateData.type = updates.type
    if (updates.priceType !== undefined) {
      updateData.priceType = updates.priceType
      // Clear the irrelevant field when changing price type
      if (updates.priceType === 'FIXED') {
        updateData.hours = null
      } else {
        updateData.price = null
      }
    }
    if (updates.price !== undefined) updateData.price = updates.price
    if (updates.hours !== undefined) updateData.hours = updates.hours
    if (updates.sortOrder !== undefined) updateData.sortOrder = updates.sortOrder

    // If any pricing or content changed, reset to pending for re-approval
    const needsReapproval = updates.name || updates.description || updates.price || updates.hours || updates.priceType
    if (needsReapproval && existingService.status === 'APPROVED') {
      updateData.status = 'PENDING'
    }

    const service = await db.teamService.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ service })
  } catch (error) {
    console.error('Error updating service:', error)
    return NextResponse.json({ error: 'Failed to update service' }, { status: 500 })
  }
}

// DELETE /api/dashboard/cleaner/services/[id] - Delete service
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
        { error: 'Only team leaders can delete services' },
        { status: 403 }
      )
    }

    // Verify the service belongs to this team
    const existingService = await db.teamService.findFirst({
      where: {
        id,
        teamId: cleaner.ledTeam.id,
      },
    })

    if (!existingService) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    await db.teamService.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting service:', error)
    return NextResponse.json({ error: 'Failed to delete service' }, { status: 500 })
  }
}
