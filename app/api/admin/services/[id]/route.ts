import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

// Validation schema for status update
const updateSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
})

// GET /api/admin/services/[id] - Get single service details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const service = await db.teamService.findUnique({
      where: { id },
      include: {
        team: {
          include: {
            leader: {
              include: {
                user: { select: { name: true, email: true, phone: true } },
              },
            },
            members: {
              include: {
                user: { select: { name: true } },
              },
            },
          },
        },
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

// PATCH /api/admin/services/[id] - Approve or reject service
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parseResult = updateSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { status } = parseResult.data

    // Verify service exists
    const existingService = await db.teamService.findUnique({
      where: { id },
      include: {
        team: {
          include: {
            leader: {
              include: {
                user: { select: { name: true, phone: true } },
              },
            },
          },
        },
      },
    })

    if (!existingService) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    // Update the service status
    const service = await db.teamService.update({
      where: { id },
      data: { status },
    })

    // TODO: Send notification to team leader about approval/rejection
    // Could add WhatsApp or email notification here

    return NextResponse.json({
      service,
      message: status === 'APPROVED'
        ? `Service "${service.name}" has been approved and is now live`
        : `Service "${service.name}" has been rejected`,
    })
  } catch (error) {
    console.error('Error updating service status:', error)
    return NextResponse.json({ error: 'Failed to update service' }, { status: 500 })
  }
}

// DELETE /api/admin/services/[id] - Admin delete service
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const existingService = await db.teamService.findUnique({
      where: { id },
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
