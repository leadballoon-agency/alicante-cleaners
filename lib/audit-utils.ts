/**
 * Client-safe audit utilities
 * These functions can be imported in client components
 */

// Audit action types
export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'IMPERSONATE_START'
  | 'IMPERSONATE_END'
  | 'APPROVE_CLEANER'
  | 'REJECT_CLEANER'
  | 'SUSPEND_CLEANER'
  | 'UPDATE_CLEANER'
  | 'FEATURE_CLEANER'
  | 'APPROVE_REVIEW'
  | 'REJECT_REVIEW'
  | 'UPDATE_OWNER'
  | 'UPDATE_BOOKING'
  | 'SEND_MESSAGE'
  | 'SEND_EMAIL'
  | 'SEND_NURTURING_EMAIL'
  | 'SEND_CLEANER_NURTURING_EMAIL'
  | 'CREATE_PROPERTY'
  | 'UPDATE_PROPERTY'
  | 'DELETE_PROPERTY'

export type TargetType = 'CLEANER' | 'OWNER' | 'REVIEW' | 'BOOKING' | 'PROPERTY' | 'USER' | 'MESSAGE'

/**
 * Format action for display
 */
export function formatAuditAction(action: string): string {
  const actionLabels: Record<string, string> = {
    LOGIN: 'Logged in',
    LOGOUT: 'Logged out',
    IMPERSONATE_START: 'Started impersonating',
    IMPERSONATE_END: 'Stopped impersonating',
    APPROVE_CLEANER: 'Approved cleaner',
    REJECT_CLEANER: 'Rejected cleaner',
    SUSPEND_CLEANER: 'Suspended cleaner',
    UPDATE_CLEANER: 'Updated cleaner',
    FEATURE_CLEANER: 'Featured/unfeatured cleaner',
    APPROVE_REVIEW: 'Approved review',
    REJECT_REVIEW: 'Rejected review',
    UPDATE_OWNER: 'Updated owner',
    UPDATE_BOOKING: 'Updated booking',
    SEND_MESSAGE: 'Sent message',
    SEND_EMAIL: 'Sent email',
    SEND_NURTURING_EMAIL: 'Sent nurturing email',
    SEND_CLEANER_NURTURING_EMAIL: 'Sent cleaner education email',
    CREATE_PROPERTY: 'Created property',
    UPDATE_PROPERTY: 'Updated property',
    DELETE_PROPERTY: 'Deleted property',
  }
  return actionLabels[action] || action
}

/**
 * Get relative time string (e.g., "2 hours ago")
 */
export function getRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}
