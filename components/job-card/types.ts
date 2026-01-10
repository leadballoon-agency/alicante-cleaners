// Universal booking data shared between owner and cleaner dashboards
export interface BookingCardData {
  id: string
  date: string          // YYYY-MM-DD format
  time: string          // "10:00" or "10:00 - 13:00"
  service: string       // "Regular Clean", "Deep Clean", etc.
  hours: number
  price: number
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'

  // Property info
  propertyId: string
  propertyName?: string
  propertyAddress: string
  bedrooms?: number
  bathrooms?: number

  // Access info (shown to both, editable by owner)
  accessNotes?: string
  keyHolderName?: string
  keyHolderPhone?: string

  // Booking-specific instructions (editable by owner)
  specialInstructions?: string

  // Cleaner info (owner sees this)
  cleanerId: string
  cleanerName: string
  cleanerPhoto?: string | null
  cleanerSlug: string
  cleanerPhone?: string

  // Owner info (cleaner sees this)
  ownerId?: string
  ownerName?: string
  ownerPhone?: string
  ownerLanguage?: string

  // Recurring info
  isRecurring?: boolean
  recurringFrequency?: 'weekly' | 'fortnightly' | 'monthly'
  recurringGroupId?: string

  // Review tracking
  hasReviewedCleaner?: boolean
}

// Context determines which actions are shown
export type JobCardContext = 'owner' | 'cleaner' | 'admin'

// Status badge styling
export const getStatusStyles = (status: string): { bg: string; text: string; label: string } => {
  switch (status.toLowerCase()) {
    case 'confirmed':
      return { bg: 'bg-[#E8F5E9]', text: 'text-[#2E7D32]', label: 'Confirmed' }
    case 'pending':
      return { bg: 'bg-[#FFF3E0]', text: 'text-[#E65100]', label: 'Pending' }
    case 'completed':
      return { bg: 'bg-[#E3F2FD]', text: 'text-[#1565C0]', label: 'Completed' }
    case 'cancelled':
      return { bg: 'bg-[#FFEBEE]', text: 'text-[#C62828]', label: 'Cancelled' }
    default:
      return { bg: 'bg-[#F5F5F5]', text: 'text-[#6B6B6B]', label: status }
  }
}

// Recurring badge label
export const getRecurringLabel = (frequency?: string): string | null => {
  if (!frequency) return null
  switch (frequency) {
    case 'weekly': return 'Weekly'
    case 'fortnightly': return 'Fortnightly'
    case 'monthly': return 'Monthly'
    default: return null
  }
}

// Get initials from name
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Format date with relative labels
export const formatDate = (dateStr: string, format: 'relative' | 'full' = 'relative'): string => {
  const date = new Date(dateStr)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  if (format === 'relative') {
    if (date.toDateString() === today.toDateString()) return 'Today'
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow'

    // Within next 7 days - show day name
    const daysAhead = Math.floor((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    if (daysAhead > 0 && daysAhead < 7) {
      return date.toLocaleDateString('en-GB', { weekday: 'long' })
    }
  }

  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

// Check if booking is today
export const isToday = (dateStr: string): boolean => {
  const date = new Date(dateStr)
  const today = new Date()
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  )
}

// Generate WhatsApp link
export const generateWhatsAppLink = (phone: string, message: string): string => {
  const cleanPhone = phone.replace(/\s/g, '').replace('whatsapp:', '')
  const phoneNumber = cleanPhone.startsWith('+') ? cleanPhone.slice(1) : cleanPhone
  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
}

// Generate Google Calendar link
export const generateCalendarLink = (booking: BookingCardData): string => {
  const startDate = new Date(`${booking.date}T${booking.time.split('-')[0].trim().padStart(5, '0')}:00`)
  const endDate = new Date(startDate.getTime() + booking.hours * 60 * 60 * 1000)

  const formatCalDate = (d: Date) => d.toISOString().replace(/-|:|\.\d+/g, '').slice(0, 15) + 'Z'

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${booking.service} - ${booking.cleanerName}`,
    dates: `${formatCalDate(startDate)}/${formatCalDate(endDate)}`,
    details: `Cleaning by ${booking.cleanerName}\n${booking.propertyName || booking.propertyAddress}`,
    location: booking.propertyAddress
  })

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}
