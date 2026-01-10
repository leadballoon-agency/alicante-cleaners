/**
 * Admin Feed Card Types
 *
 * Type definitions for the unified admin activity feed.
 * All activity items are represented as cards with peek/hold interactions.
 */

// Card type enum
export type AdminCardType =
  | 'booking_pending'
  | 'booking_confirmed'
  | 'booking_completed'
  | 'cleaner_signup'
  | 'cleaner_login'
  | 'review_pending'
  | 'review_approved'
  | 'owner_signup'
  | 'owner_dormant'
  | 'system_alert'
  | 'audit_entry'
  | 'email_sent'

// Priority levels for feed ordering
export type CardPriority = 'urgent' | 'normal' | 'low'

// Base interface for all admin cards
export interface AdminCardBase {
  id: string
  type: AdminCardType
  timestamp: Date
  priority: CardPriority
  isTest: boolean
  resourceId?: string
}

// ============================================
// Booking Cards
// ============================================

export type BookingCardType = 'booking_pending' | 'booking_confirmed' | 'booking_completed'

export type AdminBookingAction =
  | 'view_details'
  | 'contact_cleaner'
  | 'contact_owner'
  | 'cancel_booking'
  | 'reassign_cleaner'
  | 'login_as_cleaner'
  | 'login_as_owner'

export interface BookingAdminCardData extends AdminCardBase {
  type: BookingCardType
  booking: {
    id: string
    status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
    service: string
    price: number
    hours: number
    date: string
    time: string
    notes?: string
    shortCode?: string
    // Property
    propertyId: string
    propertyName: string
    propertyAddress: string
    bedrooms: number
    // Cleaner
    cleanerId: string
    cleanerName: string
    cleanerPhone?: string
    cleanerPhoto?: string | null
    cleanerSlug: string
    // Owner
    ownerId: string
    ownerName: string
    ownerEmail?: string
    ownerPhone?: string
    ownerLanguage?: string
  }
  availableActions: AdminBookingAction[]
}

// ============================================
// Cleaner Signup Cards
// ============================================

export type AdminCleanerAction =
  | 'approve'
  | 'reject'
  | 'view_profile'
  | 'login_as'
  | 'whatsapp'
  | 'call'

export interface CleanerSignupCardData extends AdminCardBase {
  type: 'cleaner_signup'
  cleaner: {
    id: string
    userId: string
    name: string
    email?: string
    phone?: string
    photo?: string | null
    slug: string
    bio?: string
    areas: string[]
    hourlyRate: number
    services: string[]
    status: 'PENDING' | 'ACTIVE' | 'SUSPENDED'
    createdAt: Date
  }
  availableActions: AdminCleanerAction[]
}

// Cleaner login activity (less actionable, mostly informational)
export interface CleanerLoginCardData extends AdminCardBase {
  type: 'cleaner_login'
  cleaner: {
    id: string
    name: string
    photo?: string | null
    slug: string
  }
  availableActions: ('view_profile' | 'login_as')[]
}

// ============================================
// Review Cards
// ============================================

export type ReviewCardType = 'review_pending' | 'review_approved'

export type AdminReviewAction =
  | 'approve'
  | 'reject'
  | 'feature'
  | 'unfeature'
  | 'view_cleaner'
  | 'view_owner'

export interface ReviewCardData extends AdminCardBase {
  type: ReviewCardType
  review: {
    id: string
    rating: number
    text: string
    status: 'PENDING' | 'APPROVED' | 'REJECTED'
    featured: boolean
    createdAt: Date
    // Author (owner)
    authorId: string
    authorName: string
    authorEmail?: string
    // Cleaner being reviewed
    cleanerId: string
    cleanerName: string
    cleanerSlug: string
    cleanerPhoto?: string | null
    // Booking context
    bookingId?: string
    service?: string
  }
  availableActions: AdminReviewAction[]
}

// ============================================
// Owner Activity Cards
// ============================================

export type OwnerCardType = 'owner_signup' | 'owner_dormant'

export type AdminOwnerAction =
  | 'view_profile'
  | 'send_message'
  | 'send_email'
  | 'login_as'
  | 'add_note'
  | 'whatsapp'

export interface OwnerActivityCardData extends AdminCardBase {
  type: OwnerCardType
  owner: {
    id: string
    userId: string
    name: string
    email: string
    phone?: string
    ownerType?: 'REMOTE' | 'RESIDENT'
    language?: string
    // Stats
    propertyCount: number
    bookingCount: number
    totalSpent: number
    // Engagement
    lastBookingDate?: Date
    daysSinceLastBooking?: number
    createdAt: Date
    // CRM
    adminNotes?: string
    referralCode?: string
  }
  // For dormant owners, include re-engagement context
  dormantReason?: 'no_booking_30_days' | 'no_booking_60_days' | 'no_booking_90_days'
  availableActions: AdminOwnerAction[]
}

// ============================================
// System Alert Cards
// ============================================

export type AlertSeverity = 'error' | 'warning' | 'info'

export type AdminAlertAction =
  | 'mark_resolved'
  | 'view_details'
  | 'dismiss'
  | 'investigate'

export interface SystemAlertCardData extends AdminCardBase {
  type: 'system_alert'
  alert: {
    id: string
    severity: AlertSeverity
    title: string
    description: string
    source: string // e.g., 'twilio', 'stripe', 'calendar_sync', 'cron'
    metadata?: Record<string, unknown>
    resolved: boolean
    resolvedAt?: Date
    resolvedBy?: string
  }
  availableActions: AdminAlertAction[]
}

// ============================================
// Email Sent Cards
// ============================================

export type EmailCardType = 'email_sent'

export type EmailRecipientType = 'owner' | 'cleaner'

export interface EmailSentCardData extends AdminCardBase {
  type: 'email_sent'
  email: {
    id: string
    emailType: string // NurturingEmailType or CleanerNurturingEmailType
    recipientType: EmailRecipientType
    // Recipient
    recipientId: string
    recipientName: string
    recipientEmail: string
    // Context
    subject?: string
    sentAt: Date
    // For linking
    cleanerId?: string
    cleanerName?: string
    cleanerSlug?: string
    ownerId?: string
    ownerName?: string
  }
  availableActions: ('view_recipient')[]}

// ============================================
// Audit Entry Cards
// ============================================

export type AuditAction =
  | 'cleaner_approved'
  | 'cleaner_rejected'
  | 'cleaner_suspended'
  | 'review_approved'
  | 'review_rejected'
  | 'review_featured'
  | 'booking_cancelled'
  | 'owner_impersonated'
  | 'cleaner_impersonated'
  | 'settings_updated'
  | 'email_sent'
  | 'whatsapp_sent'
  | string // Allow other action types

export interface AuditEntryCardData extends AdminCardBase {
  type: 'audit_entry'
  audit: {
    id: string
    action: AuditAction
    // Actor (admin who performed the action)
    actorId?: string
    actorName: string
    actorRole: string
    // Target (what was acted upon)
    targetType?: 'cleaner' | 'owner' | 'booking' | 'review' | 'settings'
    targetId?: string
    targetName?: string
    // Details
    details?: Record<string, unknown>
    ipAddress?: string
    userAgent?: string
    createdAt: Date
  }
  // Audit entries are read-only
  availableActions: ('view_details')[]
}

// ============================================
// Union Type for Feed Items
// ============================================

export type AdminFeedItem =
  | BookingAdminCardData
  | CleanerSignupCardData
  | CleanerLoginCardData
  | ReviewCardData
  | OwnerActivityCardData
  | SystemAlertCardData
  | AuditEntryCardData
  | EmailSentCardData

// ============================================
// Filter Types
// ============================================

export type FeedFilter =
  | 'all'
  | 'urgent'
  | 'bookings'
  | 'cleaners'
  | 'reviews'
  | 'owners'
  | 'alerts'
  | 'emails'

export interface FeedFilterState {
  activeFilter: FeedFilter
  showAudit: boolean
  showTestData: boolean
  showEmails: boolean
  dateRange?: 'today' | 'week' | 'month' | 'all'
}

// ============================================
// API Response Types
// ============================================

export interface AdminFeedResponse {
  items: AdminFeedItem[]
  counts: {
    total: number
    byType: Partial<Record<AdminCardType, number>>
    urgent: number
  }
  hasMore: boolean
  nextCursor?: string
}

// ============================================
// Visual Styling Helpers
// ============================================

export const CARD_STYLES: Record<AdminCardType, {
  borderColor: string
  icon: string
  urgentBg: string
  label: string
}> = {
  booking_pending: {
    borderColor: '#E65100',
    icon: 'calendar',
    urgentBg: '#FFF8F5',
    label: 'Pending Booking',
  },
  booking_confirmed: {
    borderColor: '#1565C0',
    icon: 'calendar-check',
    urgentBg: 'white',
    label: 'Confirmed Booking',
  },
  booking_completed: {
    borderColor: '#2E7D32',
    icon: 'check-circle',
    urgentBg: 'white',
    label: 'Completed Booking',
  },
  cleaner_signup: {
    borderColor: '#7B1FA2',
    icon: 'user-plus',
    urgentBg: '#FFF8F5',
    label: 'New Cleaner',
  },
  cleaner_login: {
    borderColor: '#9B9B9B',
    icon: 'log-in',
    urgentBg: 'white',
    label: 'Cleaner Login',
  },
  review_pending: {
    borderColor: '#C4785A',
    icon: 'star',
    urgentBg: '#FFF8F5',
    label: 'Pending Review',
  },
  review_approved: {
    borderColor: '#2E7D32',
    icon: 'star-check',
    urgentBg: 'white',
    label: 'Approved Review',
  },
  owner_signup: {
    borderColor: '#0288D1',
    icon: 'home-plus',
    urgentBg: 'white',
    label: 'New Owner',
  },
  owner_dormant: {
    borderColor: '#FF9800',
    icon: 'home-alert',
    urgentBg: '#FFF3E0',
    label: 'Dormant Owner',
  },
  system_alert: {
    borderColor: '#D32F2F',
    icon: 'alert-triangle',
    urgentBg: '#FFEBEE',
    label: 'System Alert',
  },
  audit_entry: {
    borderColor: '#9B9B9B',
    icon: 'scroll',
    urgentBg: 'white',
    label: 'Audit Log',
  },
  email_sent: {
    borderColor: '#7B1FA2',
    icon: 'mail',
    urgentBg: 'white',
    label: 'Email Sent',
  },
}

// Helper to get styles for a card
export function getCardStyles(type: AdminCardType) {
  return CARD_STYLES[type]
}

// Helper to determine if a card type is actionable (requires attention)
export function isActionableType(type: AdminCardType): boolean {
  return [
    'booking_pending',
    'cleaner_signup',
    'review_pending',
    'owner_dormant',
    'system_alert',
  ].includes(type)
}

// Helper to get filter for a card type
export function getFilterForType(type: AdminCardType): FeedFilter {
  if (type.startsWith('booking_')) return 'bookings'
  if (type.startsWith('cleaner_')) return 'cleaners'
  if (type.startsWith('review_')) return 'reviews'
  if (type.startsWith('owner_')) return 'owners'
  if (type === 'system_alert') return 'alerts'
  if (type === 'email_sent') return 'emails'
  return 'all'
}

// Helper to format relative time
export function formatRelativeTime(date: Date | string): string {
  const now = new Date()
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const diffMs = now.getTime() - dateObj.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return dateObj.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  })
}

// Helper that handles null/undefined dates
export function getRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return 'Never'
  return formatRelativeTime(date)
}

// ============================================
// Shared Status Colors
// ============================================

export const BOOKING_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-[#FFF3E0] text-[#E65100]',
  confirmed: 'bg-[#E8F5E9] text-[#2E7D32]',
  completed: 'bg-[#F5F5F3] text-[#6B6B6B]',
  cancelled: 'bg-[#FFEBEE] text-[#C62828]',
}

export const BOOKING_STATUS_DOTS: Record<string, string> = {
  pending: 'bg-[#E65100]',
  confirmed: 'bg-[#2E7D32]',
  completed: 'bg-[#6B6B6B]',
  cancelled: 'bg-[#C62828]',
}

export const CLEANER_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-[#FFF3E0] text-[#E65100]',
  active: 'bg-[#E8F5E9] text-[#2E7D32]',
  suspended: 'bg-[#FFEBEE] text-[#C62828]',
}
