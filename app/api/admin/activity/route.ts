import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

type ActivityItem = {
  id: string
  type: 'booking' | 'review' | 'cleaner_signup' | 'owner_signup' | 'booking_completed' | 'cleaner_approved' | 'cleaner_message' | 'cleaner_login' | 'service_pending' | 'easter_egg'
  title: string
  description: string
  timestamp: Date
  status?: string
  actionable?: boolean
  resourceId?: string
  meta?: Record<string, unknown>
  isTest?: boolean // Flag for test/demo data
}

// Detect test accounts by email patterns
const TEST_EMAIL_PATTERNS = [
  /@example\.com$/i,
  /@test\.com$/i,
  /\+test/i,
  /^test@/i,
  /^demo@/i,
  /^mark@leadballoon/i, // Dev accounts
  /^kerry@leadballoon/i,
  /^admin@villacare/i,
]

// Detect test accounts by name patterns
const TEST_NAME_PATTERNS = [
  /^test\s/i,
  /\stest$/i,
  /^demo\s/i,
  /^(clara|maria|carlos|ana|luis)\s(martinez|garcia|rodriguez|fernandez|lopez)$/i, // Seed data names
]

function isTestAccount(email?: string | null, name?: string | null): boolean {
  if (email && TEST_EMAIL_PATTERNS.some(p => p.test(email))) return true
  if (name && TEST_NAME_PATTERNS.some(p => p.test(name))) return true
  return false
}

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get recent activity from multiple sources
    const [
      recentBookings,
      recentReviews,
      recentCleaners,
      recentOwners,
      recentCleanerMessages,
      recentCleanerLogins,
      pendingServices,
      easterEggEvents,
    ] = await Promise.all([
      // Recent bookings (last 24 hours)
      db.booking.findMany({
        where: {
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
        include: {
          cleaner: { include: { user: { select: { name: true } } } },
          owner: { include: { user: { select: { name: true } } } },
          property: { select: { name: true, address: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),

      // Recent reviews (last 48 hours)
      db.review.findMany({
        where: {
          createdAt: { gte: new Date(Date.now() - 48 * 60 * 60 * 1000) },
        },
        include: {
          cleaner: { include: { user: { select: { name: true } } } },
          owner: { include: { user: { select: { name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),

      // Recent cleaner signups (last 7 days)
      db.cleaner.findMany({
        where: {
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),

      // Recent owner signups (last 7 days)
      db.owner.findMany({
        where: {
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),

      // Recent messages from cleaners (last 48 hours)
      db.message.findMany({
        where: {
          createdAt: { gte: new Date(Date.now() - 48 * 60 * 60 * 1000) },
          senderRole: 'CLEANER',
        },
        include: {
          conversation: {
            include: {
              cleaner: {
                include: { user: { select: { name: true } } },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),

      // Recent cleaner logins (last 24 hours)
      db.cleaner.findMany({
        where: {
          user: {
            lastLoginAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
        },
        include: {
          user: { select: { name: true, lastLoginAt: true } },
        },
        orderBy: { user: { lastLoginAt: 'desc' } },
        take: 20,
      }),

      // Pending team services (awaiting approval)
      db.teamService.findMany({
        where: {
          status: 'PENDING',
        },
        include: {
          team: {
            include: {
              leader: {
                include: { user: { select: { name: true } } },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),

      // 🎭 Easter egg interactions (Alan & Amanda summoned!)
      db.aIUsageLog.findMany({
        where: {
          action: { in: ['EASTER_EGG_ALAN', 'EASTER_EGG_AMANDA'] },
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
        include: {
          cleaner: {
            include: { user: { select: { name: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ])

    // Transform into unified activity feed
    const activities: ActivityItem[] = []

    // Add bookings
    for (const booking of recentBookings) {
      const ownerEmail = (booking.owner as { user: { email?: string | null } }).user?.email
      const isTest = isTestAccount(ownerEmail, booking.owner.user.name) ||
                     isTestAccount(null, booking.cleaner.user.name)
      activities.push({
        id: `booking-${booking.id}`,
        type: booking.status === 'COMPLETED' ? 'booking_completed' : 'booking',
        title: booking.status === 'COMPLETED'
          ? `Booking completed`
          : `New ${booking.service.toLowerCase().replace('_', ' ')} booking`,
        description: `${booking.cleaner.user.name} → ${booking.property?.name || 'Property'} for ${booking.owner.user.name}`,
        timestamp: booking.createdAt,
        status: booking.status.toLowerCase(),
        actionable: booking.status === 'PENDING',
        resourceId: booking.id,
        isTest,
        meta: {
          cleanerName: booking.cleaner.user.name,
          ownerName: booking.owner.user.name,
          property: booking.property?.name || booking.property?.address,
          price: booking.price ? Number(booking.price) : null,
          service: booking.service,
        },
      })
    }

    // Add reviews
    for (const review of recentReviews) {
      const ownerEmail = (review.owner as { user: { email?: string | null } }).user?.email
      const isTest = isTestAccount(ownerEmail, review.owner.user.name) ||
                     isTestAccount(null, review.cleaner.user.name)
      activities.push({
        id: `review-${review.id}`,
        type: 'review',
        title: `${review.rating}★ review ${review.approved ? 'published' : 'pending'}`,
        description: `"${review.text?.slice(0, 60)}${(review.text?.length || 0) > 60 ? '...' : ''}" for ${review.cleaner.user.name}`,
        timestamp: review.createdAt,
        status: review.approved ? 'approved' : 'pending',
        actionable: !review.approved,
        resourceId: review.id,
        isTest,
        meta: {
          rating: review.rating,
          cleanerName: review.cleaner.user.name,
          reviewerName: review.owner.user.name,
        },
      })
    }

    // Add cleaner signups
    for (const cleaner of recentCleaners) {
      const isActive = cleaner.status === 'ACTIVE'
      const isTest = isTestAccount(cleaner.user.email, cleaner.user.name)
      activities.push({
        id: `cleaner-${cleaner.id}`,
        type: isActive ? 'cleaner_approved' : 'cleaner_signup',
        title: isActive ? 'Cleaner approved' : 'New cleaner application',
        description: `${cleaner.user.name} joined${cleaner.serviceAreas?.length ? ` - ${cleaner.serviceAreas.slice(0, 2).join(', ')}` : ''}`,
        timestamp: cleaner.createdAt,
        status: isActive ? 'active' : 'pending',
        actionable: cleaner.status === 'PENDING',
        resourceId: cleaner.id,
        isTest,
        meta: {
          name: cleaner.user.name,
          email: cleaner.user.email,
          areas: cleaner.serviceAreas,
        },
      })
    }

    // Add owner signups
    for (const owner of recentOwners) {
      const isTest = isTestAccount(owner.user.email, owner.user.name)
      activities.push({
        id: `owner-${owner.id}`,
        type: 'owner_signup',
        title: 'New owner registered',
        description: owner.user.name || owner.user.email || 'Unknown',
        timestamp: owner.createdAt,
        resourceId: owner.id,
        isTest,
        meta: {
          name: owner.user.name,
          email: owner.user.email,
        },
      })
    }

    // Add cleaner messages
    for (const message of recentCleanerMessages) {
      const cleanerName = message.conversation.cleaner.user.name || 'Cleaner'
      const isTest = isTestAccount(null, cleanerName)
      const messagePreview = message.originalText.length > 50
        ? message.originalText.slice(0, 50) + '...'
        : message.originalText
      activities.push({
        id: `message-${message.id}`,
        type: 'cleaner_message',
        title: `Message from ${cleanerName}`,
        description: `"${messagePreview}"`,
        timestamp: message.createdAt,
        status: message.isRead ? 'read' : 'unread',
        actionable: !message.isRead,
        resourceId: message.conversationId,
        isTest,
        meta: {
          cleanerName,
          conversationId: message.conversationId,
          isRead: message.isRead,
        },
      })
    }

    // Add cleaner logins
    for (const cleaner of recentCleanerLogins) {
      if (cleaner.user.lastLoginAt) {
        const isTest = isTestAccount(null, cleaner.user.name)
        activities.push({
          id: `login-${cleaner.id}-${cleaner.user.lastLoginAt.getTime()}`,
          type: 'cleaner_login',
          title: `${cleaner.user.name || 'Cleaner'} logged in`,
          description: cleaner.serviceAreas?.length
            ? cleaner.serviceAreas.slice(0, 2).join(', ')
            : 'Active cleaner',
          timestamp: cleaner.user.lastLoginAt,
          resourceId: cleaner.id,
          isTest,
          meta: {
            cleanerName: cleaner.user.name,
            slug: cleaner.slug,
          },
        })
      }
    }

    // Add pending services
    for (const service of pendingServices) {
      const teamLeaderName = service.team.leader.user.name || 'Team Leader'
      const isTest = isTestAccount(null, teamLeaderName)
      const priceInfo = service.priceType === 'FIXED'
        ? `€${Number(service.price)}`
        : `${service.hours}h`
      activities.push({
        id: `service-${service.id}`,
        type: 'service_pending',
        title: `New ${service.type === 'ADDON' ? 'add-on' : 'service'}: ${service.name}`,
        description: `${teamLeaderName} • ${priceInfo}`,
        timestamp: service.createdAt,
        status: 'pending',
        actionable: true,
        resourceId: service.id,
        isTest,
        meta: {
          serviceName: service.name,
          teamLeaderName,
          teamName: service.team.name,
          type: service.type,
          priceType: service.priceType,
          price: service.price ? Number(service.price) : null,
          hours: service.hours,
        },
      })
    }

    // 🎭 Add easter egg events (Alan & Amanda summoned!)
    for (const event of easterEggEvents) {
      const character = event.action === 'EASTER_EGG_ALAN' ? 'Alan' : 'Amanda'
      const emoji = event.action === 'EASTER_EGG_ALAN' ? '🎤' : '💕'
      const cleanerName = event.cleaner?.user?.name || 'Unknown cleaner'
      const isTest = isTestAccount(null, cleanerName)
      activities.push({
        id: `easter-egg-${event.id}`,
        type: 'easter_egg',
        title: `${emoji} ${character} was summoned!`,
        description: `On ${cleanerName}'s profile chat`,
        timestamp: event.createdAt,
        status: character.toLowerCase(),
        resourceId: event.cleanerId || undefined,
        isTest,
        meta: {
          character,
          cleanerName,
          tokensUsed: event.tokensUsed,
        },
      })
    }

    // Sort all activities by timestamp
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Get counts for badges
    const pendingCount = {
      bookings: recentBookings.filter(b => b.status === 'PENDING').length,
      reviews: recentReviews.filter(r => !r.approved).length,
      cleaners: recentCleaners.filter(c => c.status === 'PENDING').length,
      services: pendingServices.length,
    }

    return NextResponse.json({
      activities: activities.slice(0, 50),
      pendingCount,
      lastUpdated: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching activity:', error)
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 })
  }
}
