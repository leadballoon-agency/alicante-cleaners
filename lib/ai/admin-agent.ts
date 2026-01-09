import Anthropic from '@anthropic-ai/sdk'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { loadKnowledge } from './knowledge'

// Lazy initialization
let anthropic: Anthropic | null = null

function getAnthropic(): Anthropic {
  if (!anthropic) {
    anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })
  }
  return anthropic
}

// Tool definitions for the Admin AI Agent
export const ADMIN_TOOLS: Anthropic.Tool[] = [
  {
    name: 'get_dashboard_stats',
    description: 'Get platform-wide statistics including cleaner counts, booking counts, revenue, and ratings. Use this for overview questions.',
    input_schema: {
      type: 'object' as const,
      properties: {
        period: {
          type: 'string',
          enum: ['today', 'this_week', 'this_month', 'all_time'],
          description: 'Time period for stats',
        },
      },
      required: [],
    },
  },
  {
    name: 'query_cleaners',
    description: 'Search and filter cleaners. Use this to find cleaners by status, area, name, or other criteria.',
    input_schema: {
      type: 'object' as const,
      properties: {
        status: {
          type: 'string',
          enum: ['pending', 'active', 'suspended', 'all'],
          description: 'Filter by cleaner status',
        },
        area: {
          type: 'string',
          description: 'Filter by service area (e.g., "San Juan", "El Campello")',
        },
        search: {
          type: 'string',
          description: 'Search by name, email, or phone',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (default 10)',
        },
      },
      required: [],
    },
  },
  {
    name: 'query_owners',
    description: 'Search and filter villa owners. Use this to find owners by name, email, or booking history.',
    input_schema: {
      type: 'object' as const,
      properties: {
        search: {
          type: 'string',
          description: 'Search by name or email',
        },
        hasBookings: {
          type: 'boolean',
          description: 'Filter to only owners with bookings',
        },
        inactive_days: {
          type: 'number',
          description: 'Find owners who haven\'t booked in X days',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (default 10)',
        },
      },
      required: [],
    },
  },
  {
    name: 'query_bookings',
    description: 'Search and filter bookings. Use this to find bookings by status, date, cleaner, or owner.',
    input_schema: {
      type: 'object' as const,
      properties: {
        status: {
          type: 'string',
          enum: ['pending', 'confirmed', 'completed', 'cancelled', 'all'],
          description: 'Filter by booking status',
        },
        date_filter: {
          type: 'string',
          enum: ['today', 'tomorrow', 'this_week', 'next_week', 'this_month'],
          description: 'Filter by date range',
        },
        cleaner_id: {
          type: 'string',
          description: 'Filter by specific cleaner ID',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (default 10)',
        },
      },
      required: [],
    },
  },
  {
    name: 'query_reviews',
    description: 'Search and filter reviews. Use this to find reviews pending approval or by rating.',
    input_schema: {
      type: 'object' as const,
      properties: {
        status: {
          type: 'string',
          enum: ['pending', 'approved', 'all'],
          description: 'Filter by approval status',
        },
        min_rating: {
          type: 'number',
          description: 'Minimum star rating (1-5)',
        },
        max_rating: {
          type: 'number',
          description: 'Maximum star rating (1-5)',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (default 10)',
        },
      },
      required: [],
    },
  },
  {
    name: 'approve_cleaner',
    description: 'Approve a pending cleaner application. Only use when explicitly asked to approve.',
    input_schema: {
      type: 'object' as const,
      properties: {
        cleaner_id: {
          type: 'string',
          description: 'The cleaner ID to approve',
        },
      },
      required: ['cleaner_id'],
    },
  },
  {
    name: 'reject_cleaner',
    description: 'Reject a pending cleaner application. Only use when explicitly asked to reject.',
    input_schema: {
      type: 'object' as const,
      properties: {
        cleaner_id: {
          type: 'string',
          description: 'The cleaner ID to reject',
        },
        reason: {
          type: 'string',
          description: 'Reason for rejection',
        },
      },
      required: ['cleaner_id'],
    },
  },
  {
    name: 'approve_review',
    description: 'Approve a pending review. Only use when explicitly asked to approve.',
    input_schema: {
      type: 'object' as const,
      properties: {
        review_id: {
          type: 'string',
          description: 'The review ID to approve',
        },
      },
      required: ['review_id'],
    },
  },
  {
    name: 'feature_cleaner',
    description: 'Toggle featured status for a cleaner. Featured cleaners appear prominently on the homepage.',
    input_schema: {
      type: 'object' as const,
      properties: {
        cleaner_id: {
          type: 'string',
          description: 'The cleaner ID to feature/unfeature',
        },
        featured: {
          type: 'boolean',
          description: 'Whether to feature (true) or unfeature (false)',
        },
      },
      required: ['cleaner_id', 'featured'],
    },
  },
  {
    name: 'get_cleaner_details',
    description: 'Get detailed information about a specific cleaner including their bookings, reviews, and team.',
    input_schema: {
      type: 'object' as const,
      properties: {
        cleaner_id: {
          type: 'string',
          description: 'The cleaner ID to look up',
        },
      },
      required: ['cleaner_id'],
    },
  },
  {
    name: 'send_message_to_cleaner',
    description: 'Send a message to a cleaner. The message will be automatically translated to their preferred language. Use this when an admin wants to communicate with a cleaner.',
    input_schema: {
      type: 'object' as const,
      properties: {
        cleaner_id: {
          type: 'string',
          description: 'The cleaner ID to message',
        },
        cleaner_name: {
          type: 'string',
          description: 'The cleaner name (for confirmation)',
        },
        message: {
          type: 'string',
          description: 'The message content to send',
        },
      },
      required: ['cleaner_id', 'message'],
    },
  },
  {
    name: 'update_cleaner',
    description: 'Update a cleaner profile. Use this to change phone number, email, hourly rate, service areas, or other profile details.',
    input_schema: {
      type: 'object' as const,
      properties: {
        cleaner_id: {
          type: 'string',
          description: 'The cleaner ID to update',
        },
        phone: {
          type: 'string',
          description: 'New phone number (format: +34XXXXXXXXX)',
        },
        email: {
          type: 'string',
          description: 'New email address',
        },
        hourly_rate: {
          type: 'number',
          description: 'New hourly rate in EUR',
        },
        service_areas: {
          type: 'array',
          items: { type: 'string' },
          description: 'New service areas list',
        },
        bio: {
          type: 'string',
          description: 'New bio/description',
        },
      },
      required: ['cleaner_id'],
    },
  },
  {
    name: 'generate_whatsapp_invite',
    description: 'Generate a WhatsApp click-to-chat link with a pre-filled invitation or onboarding message. Returns a clickable link the admin can use to contact someone via WhatsApp.',
    input_schema: {
      type: 'object' as const,
      properties: {
        phone: {
          type: 'string',
          description: 'Phone number to message (format: +34XXXXXXXXX or just numbers)',
        },
        recipient_name: {
          type: 'string',
          description: 'Name of the person being contacted',
        },
        message_type: {
          type: 'string',
          enum: ['invite_new_cleaner', 'welcome_existing', 'custom'],
          description: 'Type of message to generate',
        },
        custom_message: {
          type: 'string',
          description: 'Custom message text (only used if message_type is "custom")',
        },
      },
      required: ['phone', 'message_type'],
    },
  },
  {
    name: 'get_owner_details',
    description: 'Get detailed information about a specific owner including their properties, bookings, and admin notes.',
    input_schema: {
      type: 'object' as const,
      properties: {
        owner_id: {
          type: 'string',
          description: 'The owner ID to look up',
        },
      },
      required: ['owner_id'],
    },
  },
  {
    name: 'update_owner_notes',
    description: 'Update CRM notes for an owner. Use this to record preferences, special instructions, or observations.',
    input_schema: {
      type: 'object' as const,
      properties: {
        owner_id: {
          type: 'string',
          description: 'The owner ID to update',
        },
        notes: {
          type: 'string',
          description: 'The admin notes to save (replaces existing notes)',
        },
        append: {
          type: 'boolean',
          description: 'If true, append to existing notes instead of replacing',
        },
      },
      required: ['owner_id', 'notes'],
    },
  },
]

// Tool handlers
async function handleGetDashboardStats(params: { period?: string }) {
  const now = new Date()
  let startDate: Date | undefined

  switch (params.period) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      break
    case 'this_week':
      const dayOfWeek = now.getDay()
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek)
      break
    case 'this_month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      break
    default:
      startDate = undefined
  }

  const [
    totalCleaners,
    activeCleaners,
    pendingCleaners,
    totalOwners,
    totalBookings,
    periodBookings,
    pendingReviews,
    revenueData,
  ] = await Promise.all([
    db.cleaner.count(),
    db.cleaner.count({ where: { status: 'ACTIVE' } }),
    db.cleaner.count({ where: { status: 'PENDING' } }),
    db.owner.count(),
    db.booking.count(),
    startDate ? db.booking.count({ where: { createdAt: { gte: startDate } } }) : db.booking.count(),
    db.review.count({ where: { approved: false } }),
    db.booking.aggregate({
      _sum: { price: true },
      where: {
        status: 'COMPLETED',
        ...(startDate ? { createdAt: { gte: startDate } } : {}),
      },
    }),
  ])

  return {
    period: params.period || 'all_time',
    cleaners: { total: totalCleaners, active: activeCleaners, pending: pendingCleaners },
    owners: { total: totalOwners },
    bookings: { total: totalBookings, period: periodBookings },
    pendingReviews,
    revenue: Number(revenueData._sum.price || 0),
  }
}

async function handleQueryCleaners(params: {
  status?: string
  area?: string
  search?: string
  limit?: number
}) {
  const limit = params.limit || 10

  const where: Prisma.CleanerWhereInput = {}

  if (params.status && params.status !== 'all') {
    where.status = params.status.toUpperCase() as Prisma.EnumCleanerStatusFilter['equals']
  }

  if (params.area) {
    where.serviceAreas = { has: params.area }
  }

  if (params.search) {
    where.OR = [
      { user: { name: { contains: params.search, mode: 'insensitive' } } },
      { user: { email: { contains: params.search, mode: 'insensitive' } } },
      { user: { phone: { contains: params.search } } },
    ]
  }

  const cleaners = await db.cleaner.findMany({
    where,
    include: {
      user: { select: { name: true, email: true, phone: true } },
      _count: { select: { bookings: true, reviews: true } },
    },
    take: limit,
    orderBy: { createdAt: 'desc' },
  })

  return cleaners.map(c => ({
    id: c.id,
    name: c.user.name || 'Unknown',
    email: c.user.email,
    phone: c.user.phone,
    status: c.status.toLowerCase(),
    areas: c.serviceAreas,
    hourlyRate: Number(c.hourlyRate),
    rating: c.rating ? Number(c.rating) : null,
    reviewCount: c.reviewCount,
    totalBookings: c._count.bookings,
    teamLeader: c.teamLeader,
    featured: c.featured,
    joinedAt: c.createdAt.toISOString().split('T')[0],
  }))
}

async function handleQueryOwners(params: {
  search?: string
  hasBookings?: boolean
  inactive_days?: number
  limit?: number
}) {
  const limit = params.limit || 10
  const where: Prisma.OwnerWhereInput = {}

  if (params.search) {
    where.user = {
      OR: [
        { name: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
      ],
    }
  }

  if (params.hasBookings) {
    where.bookings = { some: {} }
  }

  const owners = await db.owner.findMany({
    where,
    include: {
      user: { select: { name: true, email: true, createdAt: true } },
      _count: { select: { properties: true, bookings: true } },
      bookings: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { createdAt: true },
      },
    },
    take: limit,
    orderBy: { createdAt: 'desc' },
  })

  let results = owners.map(o => ({
    id: o.id,
    name: o.user.name || 'Unknown',
    email: o.user.email,
    propertyCount: o._count.properties,
    bookingCount: o._count.bookings,
    lastBooking: o.bookings[0]?.createdAt?.toISOString().split('T')[0] || null,
    trusted: o.trusted,
    memberSince: o.user.createdAt.toISOString().split('T')[0],
    hasNotes: !!o.adminNotes,
  }))

  // Filter by inactive days if specified
  if (params.inactive_days) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - params.inactive_days)
    results = results.filter(o => {
      if (!o.lastBooking) return true
      return new Date(o.lastBooking) < cutoffDate
    })
  }

  return results
}

async function handleQueryBookings(params: {
  status?: string
  date_filter?: string
  cleaner_id?: string
  limit?: number
}) {
  const limit = params.limit || 10
  const where: Prisma.BookingWhereInput = {}

  if (params.status && params.status !== 'all') {
    where.status = params.status.toUpperCase() as Prisma.EnumBookingStatusFilter['equals']
  }

  if (params.cleaner_id) {
    where.cleanerId = params.cleaner_id
  }

  if (params.date_filter) {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    switch (params.date_filter) {
      case 'today':
        where.date = { gte: today, lt: tomorrow }
        break
      case 'tomorrow':
        const dayAfter = new Date(tomorrow)
        dayAfter.setDate(dayAfter.getDate() + 1)
        where.date = { gte: tomorrow, lt: dayAfter }
        break
      case 'this_week':
        const weekEnd = new Date(today)
        weekEnd.setDate(weekEnd.getDate() + (7 - today.getDay()))
        where.date = { gte: today, lt: weekEnd }
        break
      case 'next_week':
        const nextWeekStart = new Date(today)
        nextWeekStart.setDate(nextWeekStart.getDate() + (7 - today.getDay()))
        const nextWeekEnd = new Date(nextWeekStart)
        nextWeekEnd.setDate(nextWeekEnd.getDate() + 7)
        where.date = { gte: nextWeekStart, lt: nextWeekEnd }
        break
      case 'this_month':
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)
        where.date = { gte: today, lt: monthEnd }
        break
    }
  }

  const bookings = await db.booking.findMany({
    where,
    include: {
      cleaner: { include: { user: { select: { name: true } } } },
      owner: { include: { user: { select: { name: true } } } },
      property: { select: { name: true, address: true } },
    },
    take: limit,
    orderBy: { date: 'asc' },
  })

  return bookings.map(b => ({
    id: b.id,
    status: b.status.toLowerCase(),
    service: b.service,
    price: Number(b.price),
    date: b.date.toISOString().split('T')[0],
    time: b.time,
    cleaner: b.cleaner.user.name || 'Unknown',
    owner: b.owner.user.name || 'Unknown',
    property: b.property.name || b.property.address,
  }))
}

async function handleQueryReviews(params: {
  status?: string
  min_rating?: number
  max_rating?: number
  limit?: number
}) {
  const limit = params.limit || 10
  const where: Prisma.ReviewWhereInput = {}

  if (params.status === 'pending') {
    where.approved = false
  } else if (params.status === 'approved') {
    where.approved = true
  }

  if (params.min_rating || params.max_rating) {
    where.rating = {
      ...(params.min_rating ? { gte: params.min_rating } : {}),
      ...(params.max_rating ? { lte: params.max_rating } : {}),
    }
  }

  const reviews = await db.review.findMany({
    where,
    include: {
      cleaner: { include: { user: { select: { name: true } } } },
      owner: { include: { user: { select: { name: true } } } },
    },
    take: limit,
    orderBy: { createdAt: 'desc' },
  })

  return reviews.map(r => ({
    id: r.id,
    rating: r.rating,
    text: r.text.length > 100 ? r.text.substring(0, 100) + '...' : r.text,
    fullText: r.text,
    approved: r.approved,
    featured: r.featured,
    cleaner: r.cleaner.user.name || 'Unknown',
    owner: r.owner.user.name || 'Unknown',
    createdAt: r.createdAt.toISOString().split('T')[0],
  }))
}

async function handleApproveCleaner(params: { cleaner_id: string }) {
  const cleaner = await db.cleaner.update({
    where: { id: params.cleaner_id },
    data: { status: 'ACTIVE' },
    include: { user: { select: { name: true } } },
  })

  return {
    success: true,
    message: `${cleaner.user.name} has been approved and is now active.`,
    cleaner: {
      id: cleaner.id,
      name: cleaner.user.name,
      status: 'active',
    },
  }
}

async function handleRejectCleaner(params: { cleaner_id: string; reason?: string }) {
  // Get cleaner info before deleting
  const cleaner = await db.cleaner.findUnique({
    where: { id: params.cleaner_id },
    include: { user: { select: { name: true, id: true } } },
  })

  if (!cleaner) {
    return { success: false, message: 'Cleaner not found' }
  }

  // Delete cleaner and associated user
  await db.cleaner.delete({ where: { id: params.cleaner_id } })
  await db.user.delete({ where: { id: cleaner.user.id } })

  return {
    success: true,
    message: `${cleaner.user.name}'s application has been rejected.`,
    reason: params.reason || 'No reason provided',
  }
}

async function handleApproveReview(params: { review_id: string }) {
  const review = await db.review.update({
    where: { id: params.review_id },
    data: { approved: true },
    include: {
      cleaner: { include: { user: { select: { name: true } } } },
      owner: { include: { user: { select: { name: true } } } },
    },
  })

  return {
    success: true,
    message: `Review for ${review.cleaner.user.name} has been approved.`,
    review: {
      id: review.id,
      rating: review.rating,
      cleaner: review.cleaner.user.name,
      owner: review.owner.user.name,
    },
  }
}

async function handleFeatureCleaner(params: { cleaner_id: string; featured: boolean }) {
  const cleaner = await db.cleaner.update({
    where: { id: params.cleaner_id },
    data: { featured: params.featured },
    include: { user: { select: { name: true } } },
  })

  return {
    success: true,
    message: params.featured
      ? `${cleaner.user.name} is now featured on the homepage.`
      : `${cleaner.user.name} has been removed from featured cleaners.`,
    cleaner: {
      id: cleaner.id,
      name: cleaner.user.name,
      featured: cleaner.featured,
    },
  }
}

async function handleGetCleanerDetails(params: { cleaner_id: string }) {
  const cleaner = await db.cleaner.findUnique({
    where: { id: params.cleaner_id },
    include: {
      user: { select: { name: true, email: true, phone: true, createdAt: true } },
      bookings: {
        take: 5,
        orderBy: { date: 'desc' },
        include: {
          owner: { include: { user: { select: { name: true } } } },
          property: { select: { name: true } },
        },
      },
      reviews: {
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { owner: { include: { user: { select: { name: true } } } } },
      },
      ledTeam: { include: { members: { include: { user: { select: { name: true } } } } } },
      memberOfTeam: { include: { leader: { include: { user: { select: { name: true } } } } } },
    },
  })

  if (!cleaner) {
    return { error: 'Cleaner not found' }
  }

  return {
    id: cleaner.id,
    name: cleaner.user.name,
    email: cleaner.user.email,
    phone: cleaner.user.phone,
    status: cleaner.status.toLowerCase(),
    slug: cleaner.slug,
    bio: cleaner.bio,
    areas: cleaner.serviceAreas,
    hourlyRate: Number(cleaner.hourlyRate),
    rating: cleaner.rating ? Number(cleaner.rating) : null,
    reviewCount: cleaner.reviewCount,
    totalBookings: cleaner.totalBookings,
    teamLeader: cleaner.teamLeader,
    featured: cleaner.featured,
    joinedAt: cleaner.user.createdAt.toISOString().split('T')[0],
    team: cleaner.ledTeam
      ? {
          role: 'leader',
          name: cleaner.ledTeam.name,
          memberCount: cleaner.ledTeam.members.length,
          members: cleaner.ledTeam.members.map(m => m.user.name),
        }
      : cleaner.memberOfTeam
        ? {
            role: 'member',
            name: cleaner.memberOfTeam.name,
            leader: cleaner.memberOfTeam.leader.user.name,
          }
        : null,
    recentBookings: cleaner.bookings.map(b => ({
      date: b.date.toISOString().split('T')[0],
      service: b.service,
      status: b.status.toLowerCase(),
      owner: b.owner.user.name,
      property: b.property.name,
    })),
    recentReviews: cleaner.reviews.map(r => ({
      rating: r.rating,
      text: r.text.length > 80 ? r.text.substring(0, 80) + '...' : r.text,
      owner: r.owner.user.name,
      approved: r.approved,
    })),
  }
}

// Handler for sending messages to cleaners
async function handleSendMessageToCleaner(
  params: { cleaner_id: string; cleaner_name?: string; message: string },
  adminId: string
) {
  // Import translation utility
  const { detectAndTranslate } = await import('@/lib/translate')

  // Get the cleaner and their preferred language
  const cleaner = await db.cleaner.findUnique({
    where: { id: params.cleaner_id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          preferredLanguage: true,
        },
      },
    },
  })

  if (!cleaner) {
    return { success: false, error: 'Cleaner not found' }
  }

  // Get admin info
  const admin = await db.user.findUnique({
    where: { id: adminId },
    select: {
      id: true,
      name: true,
      preferredLanguage: true,
    },
  })

  if (!admin) {
    return { success: false, error: 'Admin not found' }
  }

  // Find or create conversation between admin and cleaner
  let conversation = await db.conversation.findFirst({
    where: {
      adminId: adminId,
      cleanerId: cleaner.id,
    },
  })

  if (!conversation) {
    conversation = await db.conversation.create({
      data: {
        adminId: adminId,
        cleanerId: cleaner.id,
      },
    })
  }

  // Translate message if needed
  const cleanerLang = cleaner.user.preferredLanguage || 'es'
  const { originalLang, translatedText } = await detectAndTranslate(
    params.message,
    cleanerLang as 'en' | 'es' | 'de' | 'fr' | 'nl' | 'it' | 'pt'
  )

  // Create the message
  const message = await db.message.create({
    data: {
      conversationId: conversation.id,
      senderId: adminId,
      senderRole: 'ADMIN',
      originalText: params.message,
      originalLang: originalLang,
      translatedText: translatedText !== params.message ? translatedText : null,
      translatedLang: translatedText !== params.message ? cleanerLang : null,
    },
  })

  // Update conversation timestamp
  await db.conversation.update({
    where: { id: conversation.id },
    data: { updatedAt: new Date() },
  })

  return {
    success: true,
    messageId: message.id,
    recipient: cleaner.user.name,
    originalMessage: params.message,
    translatedMessage: translatedText !== params.message ? translatedText : null,
    translatedTo: translatedText !== params.message ? cleanerLang : null,
  }
}

// Handler for updating cleaner profiles
async function handleUpdateCleaner(params: {
  cleaner_id: string
  phone?: string
  email?: string
  hourly_rate?: number
  service_areas?: string[]
  bio?: string
}) {
  // Get current cleaner data
  const cleaner = await db.cleaner.findUnique({
    where: { id: params.cleaner_id },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
    },
  })

  if (!cleaner) {
    return { success: false, error: 'Cleaner not found' }
  }

  const updates = {
    user: {} as Record<string, string>,
    cleaner: {} as Record<string, unknown>,
  }
  const changes: string[] = []

  // Update user-level fields (phone, email)
  if (params.phone && params.phone !== cleaner.user.phone) {
    updates.user.phone = params.phone
    changes.push(`phone: ${cleaner.user.phone || 'none'} → ${params.phone}`)
  }

  if (params.email && params.email !== cleaner.user.email) {
    updates.user.email = params.email
    changes.push(`email: ${cleaner.user.email || 'none'} → ${params.email}`)
  }

  // Update cleaner-level fields
  if (params.hourly_rate !== undefined) {
    updates.cleaner.hourlyRate = params.hourly_rate
    changes.push(`hourly rate: €${Number(cleaner.hourlyRate)} → €${params.hourly_rate}`)
  }

  if (params.service_areas) {
    updates.cleaner.serviceAreas = params.service_areas
    changes.push(`service areas: ${cleaner.serviceAreas.join(', ')} → ${params.service_areas.join(', ')}`)
  }

  if (params.bio) {
    updates.cleaner.bio = params.bio
    changes.push('bio updated')
  }

  if (changes.length === 0) {
    return { success: false, error: 'No changes provided' }
  }

  // Apply updates
  try {
    if (Object.keys(updates.user).length > 0) {
      await db.user.update({
        where: { id: cleaner.user.id },
        data: updates.user,
      })
    }

    if (Object.keys(updates.cleaner).length > 0) {
      await db.cleaner.update({
        where: { id: params.cleaner_id },
        data: updates.cleaner,
      })
    }

    return {
      success: true,
      cleaner: cleaner.user.name,
      changes,
      message: `Successfully updated ${cleaner.user.name}'s profile with ${changes.length} change(s).`,
    }
  } catch (error: unknown) {
    // Handle unique constraint errors
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      const meta = 'meta' in error ? error.meta as { target?: string[] } : {}
      const field = meta.target?.[0] || 'field'
      return {
        success: false,
        error: `The ${field} "${params[field as keyof typeof params]}" is already in use by another user.`,
      }
    }
    throw error
  }
}

// Handler for generating WhatsApp invite links
function handleGenerateWhatsAppInvite(params: {
  phone: string
  recipient_name?: string
  message_type: 'invite_new_cleaner' | 'welcome_existing' | 'custom'
  custom_message?: string
}) {
  // Clean phone number (remove spaces, dashes, etc.)
  const cleanPhone = params.phone.replace(/\D/g, '')

  let message: string

  switch (params.message_type) {
    case 'invite_new_cleaner':
      message = `¡Hola${params.recipient_name ? ` ${params.recipient_name}` : ''}! 👋

Te escribo desde VillaCare, una plataforma de limpieza de villas en Alicante.

Nos encantaría invitarte a unirte a nuestra red de limpiadores profesionales. Podrás:
✓ Gestionar tus reservas fácilmente
✓ Recibir pagos seguros
✓ Construir tu reputación con reseñas

Para registrarte, visita: ${process.env.NEXT_PUBLIC_APP_URL || 'https://alicantecleaners.com'}/onboarding/cleaner

¿Te interesa? ¡Responde a este mensaje y te cuento más!`
      break

    case 'welcome_existing':
      message = `¡Hola${params.recipient_name ? ` ${params.recipient_name}` : ''}! 👋

¡Bienvenida a VillaCare! Tu perfil ya está configurado y listo para recibir reservas.

Para acceder a tu panel de control:
1. Ve a ${process.env.NEXT_PUBLIC_APP_URL || 'https://alicantecleaners.com'}/dashboard
2. Inicia sesión con tu número de teléfono
3. Usa el código: 123456 (desarrollo)

Tu página pública está en: ${process.env.NEXT_PUBLIC_APP_URL || 'https://alicantecleaners.com'}/[tu-slug]

¿Alguna pregunta? ¡Estoy aquí para ayudarte!`
      break

    case 'custom':
      message = params.custom_message || 'Hola desde VillaCare'
      break

    default:
      message = 'Hola desde VillaCare'
  }

  // URL encode the message
  const encodedMessage = encodeURIComponent(message)
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`

  return {
    success: true,
    phone: params.phone,
    recipient: params.recipient_name || 'Unknown',
    messageType: params.message_type,
    whatsappLink: whatsappUrl,
    messagePreview: message.substring(0, 150) + (message.length > 150 ? '...' : ''),
    instructions: 'Click the WhatsApp link above to open a chat with the pre-filled message.',
  }
}

// Handler for getting detailed owner information
async function handleGetOwnerDetails(params: { owner_id: string }) {
  const owner = await db.owner.findUnique({
    where: { id: params.owner_id },
    include: {
      user: { select: { name: true, email: true, createdAt: true, preferredLanguage: true } },
      properties: {
        select: { id: true, name: true, address: true, bedrooms: true, bathrooms: true },
      },
      bookings: {
        take: 5,
        orderBy: { date: 'desc' },
        include: {
          cleaner: { include: { user: { select: { name: true } } } },
          property: { select: { name: true } },
        },
      },
      reviews: {
        take: 3,
        orderBy: { createdAt: 'desc' },
        include: { cleaner: { include: { user: { select: { name: true } } } } },
      },
    },
  })

  if (!owner) {
    return { error: 'Owner not found' }
  }

  // Calculate favorite cleaner
  const cleanerBookings: Record<string, { name: string; count: number }> = {}
  for (const booking of owner.bookings) {
    const name = booking.cleaner.user.name || 'Unknown'
    if (!cleanerBookings[booking.cleanerId]) {
      cleanerBookings[booking.cleanerId] = { name, count: 0 }
    }
    cleanerBookings[booking.cleanerId].count++
  }
  const favoriteCleaner = Object.values(cleanerBookings).sort((a, b) => b.count - a.count)[0]

  return {
    id: owner.id,
    name: owner.user.name,
    email: owner.user.email,
    language: owner.user.preferredLanguage,
    memberSince: owner.user.createdAt.toISOString().split('T')[0],
    trusted: owner.trusted,
    totalBookings: owner.totalBookings,
    referralCode: owner.referralCode,
    referralCredits: Number(owner.referralCredits),
    preferredExtras: owner.preferredExtras,
    adminNotes: owner.adminNotes || 'No notes yet',
    favoriteCleaner: favoriteCleaner ? `${favoriteCleaner.name} (${favoriteCleaner.count} bookings)` : null,
    properties: owner.properties.map(p => ({
      name: p.name,
      address: p.address,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
    })),
    recentBookings: owner.bookings.map(b => ({
      date: b.date.toISOString().split('T')[0],
      service: b.service,
      status: b.status.toLowerCase(),
      cleaner: b.cleaner.user.name,
      property: b.property.name,
    })),
    recentReviews: owner.reviews.map(r => ({
      rating: r.rating,
      text: r.text.length > 80 ? r.text.substring(0, 80) + '...' : r.text,
      cleaner: r.cleaner.user.name,
    })),
  }
}

// Handler for updating owner notes
async function handleUpdateOwnerNotes(params: {
  owner_id: string
  notes: string
  append?: boolean
}) {
  const owner = await db.owner.findUnique({
    where: { id: params.owner_id },
    include: { user: { select: { name: true } } },
  })

  if (!owner) {
    return { success: false, error: 'Owner not found' }
  }

  let newNotes: string
  if (params.append && owner.adminNotes) {
    // Add timestamp and append
    const timestamp = new Date().toISOString().split('T')[0]
    newNotes = `${owner.adminNotes}\n\n[${timestamp}] ${params.notes}`
  } else {
    newNotes = params.notes
  }

  await db.owner.update({
    where: { id: params.owner_id },
    data: { adminNotes: newNotes },
  })

  return {
    success: true,
    owner: owner.user.name,
    message: params.append
      ? `Added note to ${owner.user.name}'s profile.`
      : `Updated notes for ${owner.user.name}.`,
    currentNotes: newNotes,
  }
}

// Process tool calls
export async function processToolCall(
  toolName: string,
  toolInput: Record<string, unknown>,
  adminId?: string
): Promise<string> {
  try {
    let result: unknown

    switch (toolName) {
      case 'get_dashboard_stats':
        result = await handleGetDashboardStats(toolInput as { period?: string })
        break
      case 'query_cleaners':
        result = await handleQueryCleaners(toolInput as Parameters<typeof handleQueryCleaners>[0])
        break
      case 'query_owners':
        result = await handleQueryOwners(toolInput as Parameters<typeof handleQueryOwners>[0])
        break
      case 'query_bookings':
        result = await handleQueryBookings(toolInput as Parameters<typeof handleQueryBookings>[0])
        break
      case 'query_reviews':
        result = await handleQueryReviews(toolInput as Parameters<typeof handleQueryReviews>[0])
        break
      case 'approve_cleaner':
        result = await handleApproveCleaner(toolInput as { cleaner_id: string })
        break
      case 'reject_cleaner':
        result = await handleRejectCleaner(toolInput as { cleaner_id: string; reason?: string })
        break
      case 'approve_review':
        result = await handleApproveReview(toolInput as { review_id: string })
        break
      case 'feature_cleaner':
        result = await handleFeatureCleaner(toolInput as { cleaner_id: string; featured: boolean })
        break
      case 'get_cleaner_details':
        result = await handleGetCleanerDetails(toolInput as { cleaner_id: string })
        break
      case 'send_message_to_cleaner':
        if (!adminId) {
          result = { error: 'Admin ID required for sending messages' }
        } else {
          result = await handleSendMessageToCleaner(
            toolInput as { cleaner_id: string; cleaner_name?: string; message: string },
            adminId
          )
        }
        break
      case 'update_cleaner':
        result = await handleUpdateCleaner(
          toolInput as {
            cleaner_id: string
            phone?: string
            email?: string
            hourly_rate?: number
            service_areas?: string[]
            bio?: string
          }
        )
        break
      case 'generate_whatsapp_invite':
        result = handleGenerateWhatsAppInvite(
          toolInput as {
            phone: string
            recipient_name?: string
            message_type: 'invite_new_cleaner' | 'welcome_existing' | 'custom'
            custom_message?: string
          }
        )
        break
      case 'get_owner_details':
        result = await handleGetOwnerDetails(toolInput as { owner_id: string })
        break
      case 'update_owner_notes':
        result = await handleUpdateOwnerNotes(
          toolInput as { owner_id: string; notes: string; append?: boolean }
        )
        break
      default:
        result = { error: `Unknown tool: ${toolName}` }
    }

    // OPTIMIZATION: Compact JSON (no pretty printing) saves ~30% tokens
    return JSON.stringify(result)
  } catch (error) {
    console.error(`Error processing tool ${toolName}:`, error)
    return JSON.stringify({ error: `Failed to execute ${toolName}` })
  }
}

// Admin AI System Prompt - COMPACT VERSION (~400 tokens vs ~1000)
const ADMIN_SYSTEM_PROMPT = `You are the VillaCare Admin Assistant. Be concise.

RULES:
- Query DB for data, don't guess
- Before updating/messaging: look up person first, confirm identity
- Never show database IDs in output
- Use markdown tables for lists
- Format WhatsApp links as: [Send WhatsApp](url)

WORKFLOW for updates:
1. Search by name → show matches with phone/areas/stats
2. Ask admin to confirm correct person
3. Make update → generate WhatsApp welcome if needed`

// Chat message types
export interface AdminChatMessage {
  role: 'user' | 'assistant'
  content: string
}

// Determine which tools are needed based on message content
function selectRelevantTools(message: string): Anthropic.Tool[] {
  const lowerMsg = message.toLowerCase()

  // Always include basic query tools
  const baseTools = ['get_dashboard_stats', 'query_cleaners', 'get_cleaner_details']
  const selectedToolNames = new Set(baseTools)

  // Add tools based on keywords
  if (lowerMsg.includes('owner') || lowerMsg.includes('villa') || lowerMsg.includes('property') || lowerMsg.includes('customer')) {
    selectedToolNames.add('query_owners')
    selectedToolNames.add('get_owner_details')
  }
  if (lowerMsg.includes('note') || lowerMsg.includes('crm') || lowerMsg.includes('remember') || lowerMsg.includes('preference')) {
    selectedToolNames.add('query_owners')
    selectedToolNames.add('get_owner_details')
    selectedToolNames.add('update_owner_notes')
  }
  if (lowerMsg.includes('booking') || lowerMsg.includes('schedule') || lowerMsg.includes('today')) {
    selectedToolNames.add('query_bookings')
  }
  if (lowerMsg.includes('review') || lowerMsg.includes('rating') || lowerMsg.includes('approve')) {
    selectedToolNames.add('query_reviews')
    selectedToolNames.add('approve_review')
  }
  if (lowerMsg.includes('approve') || lowerMsg.includes('pending') || lowerMsg.includes('application')) {
    selectedToolNames.add('approve_cleaner')
    selectedToolNames.add('reject_cleaner')
  }
  if (lowerMsg.includes('feature') || lowerMsg.includes('homepage') || lowerMsg.includes('highlight')) {
    selectedToolNames.add('feature_cleaner')
  }
  if (lowerMsg.includes('message') || lowerMsg.includes('send') || lowerMsg.includes('contact')) {
    selectedToolNames.add('send_message_to_cleaner')
  }
  if (lowerMsg.includes('update') || lowerMsg.includes('change') || lowerMsg.includes('phone') || lowerMsg.includes('number')) {
    selectedToolNames.add('update_cleaner')
  }
  if (lowerMsg.includes('whatsapp') || lowerMsg.includes('invite') || lowerMsg.includes('onboard') || lowerMsg.includes('welcome')) {
    selectedToolNames.add('generate_whatsapp_invite')
    selectedToolNames.add('update_cleaner')
  }

  return ADMIN_TOOLS.filter(t => selectedToolNames.has(t.name))
}

// Main chat function with tool use loop
export async function chatWithAdminAgent(
  messages: AdminChatMessage[],
  adminName: string,
  adminId: string
): Promise<{ response: string; toolsUsed: string[]; model: string; toolCount: number }> {
  const client = getAnthropic()
  const toolsUsed: string[] = []

  // OPTIMIZATION: Limit conversation history to last 6 messages
  const recentMessages = messages.slice(-6)

  // Build conversation messages
  const conversationMessages: Anthropic.MessageParam[] = recentMessages.map(m => ({
    role: m.role,
    content: m.content,
  }))

  // OPTIMIZATION: Select only relevant tools based on latest message
  const latestMessage = messages[messages.length - 1]?.content || ''
  const relevantTools = selectRelevantTools(latestMessage)

  // OPTIMIZATION: Use Haiku 3.5 for simple queries, Sonnet 4 for complex ones
  const isSimpleQuery = relevantTools.length <= 4 && !latestMessage.toLowerCase().includes('approve')
  const model = isSimpleQuery ? 'claude-3-5-haiku-20241022' : 'claude-sonnet-4-20250514'

  // Load admin knowledge base
  const adminKnowledge = loadKnowledge('admin')
  const knowledgeSection = adminKnowledge ? `\n\nKNOWLEDGE BASE:\n${adminKnowledge.substring(0, 1500)}` : ''

  console.log(`[Admin AI] Using ${model} with ${relevantTools.length}/${ADMIN_TOOLS.length} tools, kb: ${adminKnowledge.length} chars`)

  // Initial request
  let response = await client.messages.create({
    model,
    max_tokens: 1024,
    system: `${ADMIN_SYSTEM_PROMPT}\nAdmin: ${adminName} | Date: ${new Date().toISOString().split('T')[0]}${knowledgeSection}`,
    tools: relevantTools,
    messages: conversationMessages,
  })

  // Tool use loop
  while (response.stop_reason === 'tool_use') {
    const toolUseBlocks = response.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
    )

    const toolResults: Anthropic.ToolResultBlockParam[] = []

    for (const toolUse of toolUseBlocks) {
      toolsUsed.push(toolUse.name)
      const result = await processToolCall(toolUse.name, toolUse.input as Record<string, unknown>, adminId)
      toolResults.push({
        type: 'tool_result',
        tool_use_id: toolUse.id,
        content: result,
      })
    }

    // Continue conversation with tool results
    response = await client.messages.create({
      model,
      max_tokens: 1024,
      system: `${ADMIN_SYSTEM_PROMPT}\nAdmin: ${adminName} | Date: ${new Date().toISOString().split('T')[0]}`,
      tools: relevantTools,
      messages: [
        ...conversationMessages,
        { role: 'assistant', content: response.content },
        { role: 'user', content: toolResults },
      ],
    })
  }

  // Extract text response
  const textBlocks = response.content.filter(
    (block): block is Anthropic.TextBlock => block.type === 'text'
  )
  const responseText = textBlocks.map(b => b.text).join('\n')

  return { response: responseText, toolsUsed, model, toolCount: relevantTools.length }
}
