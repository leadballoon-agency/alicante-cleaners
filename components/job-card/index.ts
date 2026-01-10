// Universal JobCard components
// Use these throughout the platform for owner, cleaner, and admin dashboards

export { default as JobCard } from './JobCard'
export { default as JobCardPeekModal } from './JobCardPeekModal'
export { default as JobsTimeline } from './JobsTimeline'
export { default as NewBookingCard } from './NewBookingCard'

// Types and utilities
export type { BookingCardData, JobCardContext } from './types'
export {
  getStatusStyles,
  getInitials,
  formatDate,
  getRecurringLabel,
  isToday,
  generateWhatsAppLink,
  generateCalendarLink
} from './types'
