import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/admin/services - Get all services (with optional status filter)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // PENDING, APPROVED, REJECTED, or null for all

    const where = status ? { status: status as 'PENDING' | 'APPROVED' | 'REJECTED' } : {}

    const services = await db.teamService.findMany({
      where,
      include: {
        team: {
          include: {
            leader: {
              include: {
                user: { select: { name: true, email: true } },
              },
            },
          },
        },
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    })

    // Count by status
    const counts = await db.teamService.groupBy({
      by: ['status'],
      _count: { id: true },
    })

    const pendingCount = counts.find(c => c.status === 'PENDING')?._count.id || 0
    const approvedCount = counts.find(c => c.status === 'APPROVED')?._count.id || 0
    const rejectedCount = counts.find(c => c.status === 'REJECTED')?._count.id || 0

    return NextResponse.json({
      services,
      counts: { pending: pendingCount, approved: approvedCount, rejected: rejectedCount },
    })
  } catch (error) {
    console.error('Error fetching services:', error)
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 })
  }
}
