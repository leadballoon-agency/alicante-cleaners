/**
 * Admin Feed Card Transformers
 *
 * Functions to transform API data into unified AdminFeedItem format.
 * Used by the activity API and feed components.
 */

import {
  AdminFeedItem,
  BookingAdminCardData,
  CleanerSignupCardData,
  CleanerLoginCardData,
  ReviewCardData,
  OwnerActivityCardData,
  SystemAlertCardData,
  AuditEntryCardData,
  EmailSentCardData,
  AdminBookingAction,
  AdminCleanerAction,
  AdminReviewAction,
  AdminAlertAction,
  CardPriority,
} from './card-types'

// ============================================
// Test Account Detection
// ============================================

const TEST_EMAIL_PATTERNS = [
  /@example\.com$/i,
  /@test\.com$/i,
  /\+test/i,
  /^test@/i,
  /^demo@/i,
  /^mark@leadballoon/i,
  /^kerry@leadballoon/i,
  /^admin@villacare/i,
]

const TEST_NAME_PATTERNS = [
  /^test\s/i,
  /\stest$/i,
  /^demo\s/i,
  /^(clara|maria|carlos|ana|luis)\s(martinez|garcia|rodriguez|fernandez|lopez)$/i,
]

export function isTestAccount(email?: string | null, name?: string | null): boolean {
  if (email && TEST_EMAIL_PATTERNS.some(p => p.test(email))) return true
  if (name && TEST_NAME_PATTERNS.some(p => p.test(name))) return true
  return false
}

// ============================================
// Booking Transformers
// ============================================

interface ApiBooking {
  id: string
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
  service: string
  price: number | { toNumber: () => number }
  hours: number
  date: Date | string
  time: string
  notes?: string | null
  shortCode?: string | null
  createdAt: Date | string
  property?: {
    id: string
    name?: string | null
    address: string
    bedrooms: number
  } | null
  cleaner: {
    id: string
    slug: string
    user: {
      name?: string | null
      phone?: string | null
      image?: string | null
    }
  }
  owner: {
    id: string
    user: {
      id: string
      name?: string | null
      email?: string | null
      phone?: string | null
      preferredLanguage?: string | null
    }
  }
}

export function transformBookingToCard(booking: ApiBooking): BookingAdminCardData {
  const ownerEmail = booking.owner.user.email
  const ownerName = booking.owner.user.name
  const cleanerName = booking.cleaner.user.name
  const isTest = isTestAccount(ownerEmail, ownerName) || isTestAccount(null, cleanerName)

  // Determine priority based on status
  let priority: CardPriority = 'normal'
  if (booking.status === 'PENDING') priority = 'urgent'

  // Determine available actions based on status
  const availableActions: AdminBookingAction[] = ['view_details', 'contact_cleaner', 'contact_owner']
  if (booking.status === 'PENDING' || booking.status === 'CONFIRMED') {
    availableActions.push('cancel_booking', 'reassign_cleaner')
  }
  availableActions.push('login_as_cleaner', 'login_as_owner')

  // Determine card type
  let type: BookingAdminCardData['type'] = 'booking_pending'
  if (booking.status === 'CONFIRMED') type = 'booking_confirmed'
  if (booking.status === 'COMPLETED') type = 'booking_completed'

  const price = typeof booking.price === 'number'
    ? booking.price
    : booking.price?.toNumber?.() ?? 0

  return {
    id: `booking-${booking.id}`,
    type,
    timestamp: new Date(booking.createdAt),
    priority,
    isTest,
    resourceId: booking.id,
    booking: {
      id: booking.id,
      status: booking.status,
      service: booking.service,
      price,
      hours: booking.hours,
      date: typeof booking.date === 'string' ? booking.date : booking.date.toISOString().split('T')[0],
      time: booking.time,
      notes: booking.notes || undefined,
      shortCode: booking.shortCode || undefined,
      propertyId: booking.property?.id || '',
      propertyName: booking.property?.name || 'Unknown Property',
      propertyAddress: booking.property?.address || '',
      bedrooms: booking.property?.bedrooms || 0,
      cleanerId: booking.cleaner.id,
      cleanerName: cleanerName || 'Unknown Cleaner',
      cleanerPhone: booking.cleaner.user.phone || undefined,
      cleanerPhoto: booking.cleaner.user.image,
      cleanerSlug: booking.cleaner.slug,
      ownerId: booking.owner.id,
      ownerName: ownerName || 'Unknown Owner',
      ownerEmail: ownerEmail || undefined,
      ownerPhone: booking.owner.user.phone || undefined,
      ownerLanguage: booking.owner.user.preferredLanguage || undefined,
    },
    availableActions,
  }
}

// ============================================
// Cleaner Transformers
// ============================================

interface ApiCleaner {
  id: string
  userId: string
  slug: string
  bio?: string | null
  serviceAreas: string[]
  hourlyRate: number | { toNumber: () => number }
  services: string[]
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED'
  createdAt: Date | string
  user: {
    name?: string | null
    email?: string | null
    phone?: string | null
    image?: string | null
    lastLoginAt?: Date | string | null
  }
}

export function transformCleanerSignupToCard(cleaner: ApiCleaner): CleanerSignupCardData {
  const isTest = isTestAccount(cleaner.user.email, cleaner.user.name)

  const priority: CardPriority = cleaner.status === 'PENDING' ? 'urgent' : 'normal'

  const availableActions: AdminCleanerAction[] = []
  if (cleaner.status === 'PENDING') {
    availableActions.push('approve', 'reject')
  }
  availableActions.push('view_profile', 'login_as')
  if (cleaner.user.phone) {
    availableActions.push('whatsapp', 'call')
  }

  const hourlyRate = typeof cleaner.hourlyRate === 'number'
    ? cleaner.hourlyRate
    : cleaner.hourlyRate?.toNumber?.() ?? 0

  return {
    id: `cleaner-${cleaner.id}`,
    type: 'cleaner_signup',
    timestamp: new Date(cleaner.createdAt),
    priority,
    isTest,
    resourceId: cleaner.id,
    cleaner: {
      id: cleaner.id,
      userId: cleaner.userId,
      name: cleaner.user.name || 'Unknown',
      email: cleaner.user.email || undefined,
      phone: cleaner.user.phone || undefined,
      photo: cleaner.user.image,
      slug: cleaner.slug,
      bio: cleaner.bio || undefined,
      areas: cleaner.serviceAreas || [],
      hourlyRate,
      services: cleaner.services || [],
      status: cleaner.status,
      createdAt: new Date(cleaner.createdAt),
    },
    availableActions,
  }
}

export function transformCleanerLoginToCard(cleaner: ApiCleaner): CleanerLoginCardData {
  const isTest = isTestAccount(cleaner.user.email, cleaner.user.name)
  const loginTime = cleaner.user.lastLoginAt
    ? new Date(cleaner.user.lastLoginAt)
    : new Date()

  return {
    id: `login-${cleaner.id}-${loginTime.getTime()}`,
    type: 'cleaner_login',
    timestamp: loginTime,
    priority: 'low',
    isTest,
    resourceId: cleaner.id,
    cleaner: {
      id: cleaner.id,
      name: cleaner.user.name || 'Unknown',
      photo: cleaner.user.image,
      slug: cleaner.slug,
    },
    availableActions: ['view_profile', 'login_as'],
  }
}

// ============================================
// Review Transformers
// ============================================

interface ApiReview {
  id: string
  rating: number
  text?: string | null
  approved: boolean
  featured: boolean
  createdAt: Date | string
  bookingId?: string | null
  cleaner: {
    id: string
    slug: string
    user: {
      name?: string | null
      image?: string | null
    }
  }
  owner: {
    id: string
    user: {
      name?: string | null
      email?: string | null
    }
  }
  booking?: {
    service?: string
  } | null
}

export function transformReviewToCard(review: ApiReview): ReviewCardData {
  const isTest = isTestAccount(review.owner.user.email, review.owner.user.name) ||
                 isTestAccount(null, review.cleaner.user.name)

  const priority: CardPriority = !review.approved ? 'urgent' : 'normal'
  const type = review.approved ? 'review_approved' : 'review_pending'

  const availableActions: AdminReviewAction[] = []
  if (!review.approved) {
    availableActions.push('approve', 'reject')
  }
  if (review.approved && !review.featured) {
    availableActions.push('feature')
  }
  if (review.featured) {
    availableActions.push('unfeature')
  }
  availableActions.push('view_cleaner', 'view_owner')

  return {
    id: `review-${review.id}`,
    type,
    timestamp: new Date(review.createdAt),
    priority,
    isTest,
    resourceId: review.id,
    review: {
      id: review.id,
      rating: review.rating,
      text: review.text || '',
      status: review.approved ? 'APPROVED' : 'PENDING',
      featured: review.featured,
      createdAt: new Date(review.createdAt),
      authorId: review.owner.id,
      authorName: review.owner.user.name || 'Anonymous',
      authorEmail: review.owner.user.email || undefined,
      cleanerId: review.cleaner.id,
      cleanerName: review.cleaner.user.name || 'Unknown',
      cleanerSlug: review.cleaner.slug,
      cleanerPhoto: review.cleaner.user.image,
      bookingId: review.bookingId || undefined,
      service: review.booking?.service,
    },
    availableActions,
  }
}

// ============================================
// Owner Transformers
// ============================================

interface ApiOwner {
  id: string
  userId: string
  ownerType?: 'REMOTE' | 'RESIDENT' | null
  adminNotes?: string | null
  referralCode?: string | null
  createdAt: Date | string
  user: {
    name?: string | null
    email: string
    phone?: string | null
    preferredLanguage?: string | null
  }
  properties?: { id: string }[]
  bookings?: { id: string; createdAt: Date | string }[]
  _count?: {
    properties: number
    bookings: number
  }
}

interface ApiOwnerWithStats extends ApiOwner {
  propertyCount: number
  bookingCount: number
  totalSpent: number
  lastBookingDate?: Date | null
  daysSinceLastBooking?: number
}

export function transformOwnerSignupToCard(owner: ApiOwner): OwnerActivityCardData {
  const isTest = isTestAccount(owner.user.email, owner.user.name)

  const propertyCount = owner._count?.properties || owner.properties?.length || 0
  const bookingCount = owner._count?.bookings || owner.bookings?.length || 0

  return {
    id: `owner-${owner.id}`,
    type: 'owner_signup',
    timestamp: new Date(owner.createdAt),
    priority: 'normal',
    isTest,
    resourceId: owner.id,
    owner: {
      id: owner.id,
      userId: owner.userId,
      name: owner.user.name || 'Unknown',
      email: owner.user.email,
      phone: owner.user.phone || undefined,
      ownerType: owner.ownerType || undefined,
      language: owner.user.preferredLanguage || undefined,
      propertyCount,
      bookingCount,
      totalSpent: 0, // Would need aggregation
      createdAt: new Date(owner.createdAt),
      adminNotes: owner.adminNotes || undefined,
      referralCode: owner.referralCode || undefined,
    },
    availableActions: ['view_profile', 'send_message', 'send_email', 'login_as', 'add_note'],
  }
}

export function transformDormantOwnerToCard(owner: ApiOwnerWithStats): OwnerActivityCardData {
  const isTest = isTestAccount(owner.user.email, owner.user.name)

  // Determine dormant reason
  let dormantReason: OwnerActivityCardData['dormantReason']
  if (owner.daysSinceLastBooking && owner.daysSinceLastBooking >= 90) {
    dormantReason = 'no_booking_90_days'
  } else if (owner.daysSinceLastBooking && owner.daysSinceLastBooking >= 60) {
    dormantReason = 'no_booking_60_days'
  } else {
    dormantReason = 'no_booking_30_days'
  }

  return {
    id: `owner-dormant-${owner.id}`,
    type: 'owner_dormant',
    timestamp: owner.lastBookingDate
      ? new Date(owner.lastBookingDate)
      : new Date(owner.createdAt),
    priority: 'urgent',
    isTest,
    resourceId: owner.id,
    owner: {
      id: owner.id,
      userId: owner.userId,
      name: owner.user.name || 'Unknown',
      email: owner.user.email,
      phone: owner.user.phone || undefined,
      ownerType: owner.ownerType || undefined,
      language: owner.user.preferredLanguage || undefined,
      propertyCount: owner.propertyCount,
      bookingCount: owner.bookingCount,
      totalSpent: owner.totalSpent,
      lastBookingDate: owner.lastBookingDate || undefined,
      daysSinceLastBooking: owner.daysSinceLastBooking,
      createdAt: new Date(owner.createdAt),
      adminNotes: owner.adminNotes || undefined,
      referralCode: owner.referralCode || undefined,
    },
    dormantReason,
    availableActions: ['send_message', 'view_profile', 'add_note', 'login_as'],
  }
}

// ============================================
// System Alert Transformers
// ============================================

interface ApiAlert {
  id: string
  severity: 'error' | 'warning' | 'info'
  title: string
  description: string
  source: string
  metadata?: Record<string, unknown>
  resolved: boolean
  resolvedAt?: Date | string | null
  resolvedBy?: string | null
  createdAt: Date | string
}

export function transformAlertToCard(alert: ApiAlert): SystemAlertCardData {
  const priority: CardPriority = alert.severity === 'error' ? 'urgent' :
                                  alert.severity === 'warning' ? 'normal' : 'low'

  const availableActions: AdminAlertAction[] = []
  if (!alert.resolved) {
    availableActions.push('mark_resolved')
  }
  availableActions.push('view_details', 'dismiss')
  if (alert.severity === 'error') {
    availableActions.push('investigate')
  }

  return {
    id: `alert-${alert.id}`,
    type: 'system_alert',
    timestamp: new Date(alert.createdAt),
    priority,
    isTest: false,
    resourceId: alert.id,
    alert: {
      id: alert.id,
      severity: alert.severity,
      title: alert.title,
      description: alert.description,
      source: alert.source,
      metadata: alert.metadata,
      resolved: alert.resolved,
      resolvedAt: alert.resolvedAt ? new Date(alert.resolvedAt) : undefined,
      resolvedBy: alert.resolvedBy || undefined,
    },
    availableActions,
  }
}

// ============================================
// Audit Entry Transformers
// ============================================

interface ApiAuditEntry {
  id: string
  action: string
  adminId?: string | null
  adminName?: string | null
  adminRole?: string | null
  targetType?: string | null
  targetId?: string | null
  targetName?: string | null
  details?: Record<string, unknown>
  ipAddress?: string | null
  userAgent?: string | null
  createdAt: Date | string
}

export function transformAuditEntryToCard(entry: ApiAuditEntry): AuditEntryCardData {
  return {
    id: `audit-${entry.id}`,
    type: 'audit_entry',
    timestamp: new Date(entry.createdAt),
    priority: 'low',
    isTest: false,
    resourceId: entry.id,
    audit: {
      id: entry.id,
      action: entry.action,
      actorId: entry.adminId || undefined,
      actorName: entry.adminName || 'System',
      actorRole: entry.adminRole || 'system',
      targetType: entry.targetType as AuditEntryCardData['audit']['targetType'],
      targetId: entry.targetId || undefined,
      targetName: entry.targetName || undefined,
      details: entry.details,
      ipAddress: entry.ipAddress || undefined,
      userAgent: entry.userAgent || undefined,
      createdAt: new Date(entry.createdAt),
    },
    availableActions: ['view_details'],
  }
}

// ============================================
// Email Sent Transformers
// ============================================

// Owner nurturing campaign
interface ApiOwnerNurturingCampaign {
  id: string
  emailType: string
  subject?: string | null
  sentAt: Date | string
  owner: {
    id: string
    userId: string
    user: {
      name?: string | null
      email: string
    }
  }
}

// Cleaner nurturing campaign
interface ApiCleanerNurturingCampaign {
  id: string
  emailType: string
  subject?: string | null
  sentAt: Date | string
  cleaner: {
    id: string
    slug: string
    user: {
      name?: string | null
      email?: string | null
    }
  }
}

export function transformOwnerNurturingToCard(campaign: ApiOwnerNurturingCampaign): EmailSentCardData {
  const isTest = isTestAccount(campaign.owner.user.email, campaign.owner.user.name)

  return {
    id: `email-owner-${campaign.id}`,
    type: 'email_sent',
    timestamp: new Date(campaign.sentAt),
    priority: 'low',
    isTest,
    resourceId: campaign.id,
    email: {
      id: campaign.id,
      emailType: campaign.emailType,
      recipientType: 'owner',
      recipientId: campaign.owner.id,
      recipientName: campaign.owner.user.name || 'Unknown Owner',
      recipientEmail: campaign.owner.user.email,
      subject: campaign.subject || undefined,
      sentAt: new Date(campaign.sentAt),
      ownerId: campaign.owner.id,
      ownerName: campaign.owner.user.name || 'Unknown Owner',
    },
    availableActions: ['view_recipient'],
  }
}

export function transformCleanerNurturingToCard(campaign: ApiCleanerNurturingCampaign): EmailSentCardData {
  const isTest = isTestAccount(campaign.cleaner.user.email, campaign.cleaner.user.name)

  return {
    id: `email-cleaner-${campaign.id}`,
    type: 'email_sent',
    timestamp: new Date(campaign.sentAt),
    priority: 'low',
    isTest,
    resourceId: campaign.id,
    email: {
      id: campaign.id,
      emailType: campaign.emailType,
      recipientType: 'cleaner',
      recipientId: campaign.cleaner.id,
      recipientName: campaign.cleaner.user.name || 'Unknown Cleaner',
      recipientEmail: campaign.cleaner.user.email || '',
      subject: campaign.subject || undefined,
      sentAt: new Date(campaign.sentAt),
      cleanerId: campaign.cleaner.id,
      cleanerName: campaign.cleaner.user.name || 'Unknown Cleaner',
      cleanerSlug: campaign.cleaner.slug,
    },
    availableActions: ['view_recipient'],
  }
}

// ============================================
// Batch Transformer
// ============================================

interface TransformOptions {
  includeAudit?: boolean
  includeEmails?: boolean
  showTestData?: boolean
  filter?: string
}

/**
 * Transform multiple API items into a unified feed
 */
export function transformToFeed(
  data: {
    bookings?: ApiBooking[]
    cleaners?: ApiCleaner[]
    cleanerLogins?: ApiCleaner[]
    reviews?: ApiReview[]
    owners?: ApiOwner[]
    dormantOwners?: ApiOwnerWithStats[]
    alerts?: ApiAlert[]
    auditEntries?: ApiAuditEntry[]
    ownerNurturingCampaigns?: ApiOwnerNurturingCampaign[]
    cleanerNurturingCampaigns?: ApiCleanerNurturingCampaign[]
  },
  options: TransformOptions = {}
): AdminFeedItem[] {
  const items: AdminFeedItem[] = []

  // Transform bookings
  if (data.bookings) {
    items.push(...data.bookings.map(transformBookingToCard))
  }

  // Transform cleaner signups
  if (data.cleaners) {
    items.push(...data.cleaners.map(transformCleanerSignupToCard))
  }

  // Transform cleaner logins
  if (data.cleanerLogins) {
    items.push(...data.cleanerLogins.map(transformCleanerLoginToCard))
  }

  // Transform reviews
  if (data.reviews) {
    items.push(...data.reviews.map(transformReviewToCard))
  }

  // Transform owner signups
  if (data.owners) {
    items.push(...data.owners.map(transformOwnerSignupToCard))
  }

  // Transform dormant owners
  if (data.dormantOwners) {
    items.push(...data.dormantOwners.map(transformDormantOwnerToCard))
  }

  // Transform alerts
  if (data.alerts) {
    items.push(...data.alerts.map(transformAlertToCard))
  }

  // Transform audit entries (if requested)
  if (options.includeAudit && data.auditEntries) {
    items.push(...data.auditEntries.map(transformAuditEntryToCard))
  }

  // Transform email campaigns (if requested)
  if (options.includeEmails) {
    if (data.ownerNurturingCampaigns) {
      items.push(...data.ownerNurturingCampaigns.map(transformOwnerNurturingToCard))
    }
    if (data.cleanerNurturingCampaigns) {
      items.push(...data.cleanerNurturingCampaigns.map(transformCleanerNurturingToCard))
    }
  }

  // Filter out test data if requested
  let filtered = options.showTestData
    ? items
    : items.filter(item => !item.isTest)

  // Apply type filter if specified
  if (options.filter && options.filter !== 'all') {
    filtered = filtered.filter(item => {
      switch (options.filter) {
        case 'urgent':
          return item.priority === 'urgent'
        case 'bookings':
          return item.type.startsWith('booking_')
        case 'cleaners':
          return item.type.startsWith('cleaner_')
        case 'reviews':
          return item.type.startsWith('review_')
        case 'owners':
          return item.type.startsWith('owner_')
        case 'alerts':
          return item.type === 'system_alert'
        case 'emails':
          return item.type === 'email_sent'
        default:
          return true
      }
    })
  }

  // Sort by timestamp (newest first), then by priority
  filtered.sort((a, b) => {
    // Urgent items float to top
    if (a.priority === 'urgent' && b.priority !== 'urgent') return -1
    if (b.priority === 'urgent' && a.priority !== 'urgent') return 1

    // Then sort by timestamp
    return b.timestamp.getTime() - a.timestamp.getTime()
  })

  return filtered
}

// ============================================
// Count Helpers
// ============================================

export function countByType(items: AdminFeedItem[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const item of items) {
    counts[item.type] = (counts[item.type] || 0) + 1
  }
  return counts
}

export function countUrgent(items: AdminFeedItem[]): number {
  return items.filter(item => item.priority === 'urgent').length
}
