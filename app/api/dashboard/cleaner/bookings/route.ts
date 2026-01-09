import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { getAccessNotesForUI } from '@/lib/access-control'

// GET /api/dashboard/cleaner/bookings - Get cleaner's bookings
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
      select: {
        id: true,
        teamLeader: true,
        user: {
          select: { name: true, image: true },
        },
        // Get the team this cleaner leads (if any)
        ledTeam: {
          select: {
            id: true,
            members: {
              select: {
                id: true,
                user: { select: { name: true, image: true } },
              },
            },
          },
        },
      },
    })

    if (!cleaner) {
      return NextResponse.json(
        { error: 'Cleaner profile not found' },
        { status: 404 }
      )
    }

    const cleanerName = cleaner.user.name || 'Unknown'
    const cleanerPhoto = cleaner.user.image || null

    // For team leaders, get team member IDs to include their bookings
    const cleanerIds = [cleaner.id]
    const teamMembersMap: Record<string, { name: string; photo: string | null }> = {
      [cleaner.id]: { name: cleanerName, photo: cleanerPhoto }
    }

    // If this cleaner leads a team, include team members' bookings
    if (cleaner.teamLeader && cleaner.ledTeam) {
      cleaner.ledTeam.members.forEach(member => {
        cleanerIds.push(member.id)
        teamMembersMap[member.id] = {
          name: member.user.name || 'Unknown',
          photo: member.user.image || null
        }
      })
    }

    const bookings = await db.booking.findMany({
      where: { cleanerId: { in: cleanerIds } },
      include: {
        property: {
          select: {
            id: true,
            address: true,
            bedrooms: true,
            notes: true, // Encrypted access notes
            keyHolderName: true,
            keyHolderPhone: true,
          },
        },
        owner: {
          include: {
            user: {
              select: {
                name: true,
                phone: true,
                email: true,
                preferredLanguage: true,
              },
            },
          },
        },
        review: {
          select: { id: true },
        },
      },
      orderBy: { date: 'desc' },
    })

    // Transform bookings to match frontend expectations
    const formattedBookings = bookings.map(b => {
      const memberInfo = teamMembersMap[b.cleanerId] || { name: 'Unknown', photo: null }

      // Apply just-in-time access control for property access notes
      // Only show access notes within 24 hours of the booking
      const accessNotesResult = getAccessNotesForUI(
        b.property.notes,
        b.date,
        b.time
      )

      return {
        id: b.id,
        status: b.status.toLowerCase() as 'pending' | 'confirmed' | 'completed',
        service: b.service,
        price: Number(b.price),
        hours: b.hours,
        date: b.date,
        time: b.time,
        property: {
          id: b.property.id,
          address: b.property.address,
          bedrooms: b.property.bedrooms,
          // Just-in-time access: notes only visible 24h before booking
          accessNotes: accessNotesResult.notes,
          accessNotesAvailable: accessNotesResult.canView,
          accessNotesMessage: accessNotesResult.message,
          // Key holder contact (only show when access notes are visible)
          keyHolderName: accessNotesResult.canView ? b.property.keyHolderName : null,
          keyHolderPhone: accessNotesResult.canView ? b.property.keyHolderPhone : null,
        },
        owner: {
          id: b.owner.id,
          name: b.owner.user.name || 'Unknown',
          phone: b.owner.user.phone || '',
          email: b.owner.user.email || '',
          preferredLanguage: b.owner.user.preferredLanguage || 'en',
          trusted: b.owner.trusted,
          referredBy: b.owner.referredBy,
          memberSince: b.owner.createdAt,
          totalBookings: b.owner.totalBookings,
          cleanerRating: b.owner.cleanerRating ? Number(b.owner.cleanerRating) : null,
          cleanerReviewCount: b.owner.cleanerReviewCount,
        },
        hasReviewedOwner: !!b.review,
        // Cleaner info for team visibility
        cleanerId: b.cleanerId,
        cleanerName: memberInfo.name,
        cleanerPhoto: memberInfo.photo,
      }
    })

    return NextResponse.json({ bookings: formattedBookings })
  } catch (error) {
    console.error('Error fetching cleaner bookings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    )
  }
}
