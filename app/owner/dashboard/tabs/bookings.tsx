'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { OwnerBooking } from '../page'
import { JobsTimeline, BookingCardData } from '@/components/job-card'

type Props = {
  bookings: OwnerBooking[]
  onLeaveReview?: (bookingId: string, cleanerId: string, cleanerName: string) => void
  onMessage?: (cleanerId: string, cleanerName: string, propertyId?: string) => void
  onOpenChat?: (initialMessage?: string) => void
}

export default function BookingsTab({ bookings, onLeaveReview, onMessage, onOpenChat }: Props) {
  const router = useRouter()

  // Transform bookings to shared BookingCardData format
  const transformedBookings: BookingCardData[] = useMemo(() => {
    return bookings.map(booking => ({
      id: booking.id,
      date: new Date(booking.date).toISOString().split('T')[0],
      time: booking.time,
      service: booking.service,
      hours: 3, // Default to 3 hours - TODO: add to API
      price: booking.price,
      status: booking.status as 'pending' | 'confirmed' | 'completed' | 'cancelled',
      // Property info
      propertyId: booking.property.id,
      propertyName: booking.property.name,
      propertyAddress: booking.property.address,
      bedrooms: booking.property.bedrooms,
      // Access info (if available)
      accessNotes: booking.property.accessNotes,
      keyHolderName: booking.property.keyHolderName,
      keyHolderPhone: booking.property.keyHolderPhone,
      // Cleaner info
      cleanerId: booking.cleaner.id,
      cleanerName: booking.cleaner.name,
      cleanerPhoto: booking.cleaner.photo,
      cleanerSlug: booking.cleaner.slug,
      cleanerPhone: booking.cleaner.phone,
      // Review tracking
      hasReviewedCleaner: booking.hasReviewedCleaner,
      // Booking-specific instructions (if available)
      specialInstructions: booking.specialInstructions,
    }))
  }, [bookings])

  // Handlers for timeline actions
  const handleNewBooking = () => {
    if (onOpenChat) {
      const message = bookings.length > 0
        ? "I'd like to book another clean please"
        : "I'd like to book my first villa clean"
      onOpenChat(message)
    } else {
      router.push('/')
    }
  }

  const handleMessage = (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId)
    if (booking && onMessage) {
      onMessage(booking.cleaner.id, booking.cleaner.name, booking.property.id)
    }
  }

  const handleReview = (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId)
    if (booking && onLeaveReview) {
      onLeaveReview(bookingId, booking.cleaner.id, booking.cleaner.name)
    }
  }

  const handleBookAgain = (bookingId: string, cleanerSlug: string) => {
    const booking = bookings.find(b => b.id === bookingId)
    if (onOpenChat && booking) {
      const message = `I'd like to book another clean with ${booking.cleaner.name} at ${booking.property.name}`
      onOpenChat(message)
    } else {
      router.push(`/${cleanerSlug}`)
    }
  }

  // Calculate total spent
  const totalSpent = bookings
    .filter(b => b.status === 'completed')
    .reduce((sum, b) => sum + b.price, 0)

  const upcomingCount = bookings.filter(b => new Date(b.date) >= new Date() && b.status !== 'completed').length

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-[#EBEBEB]">
          <p className="text-xs text-[#6B6B6B] mb-1">Total</p>
          <p className="text-xl font-semibold text-[#1A1A1A]">{bookings.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-[#EBEBEB]">
          <p className="text-xs text-[#6B6B6B] mb-1">Upcoming</p>
          <p className="text-xl font-semibold text-[#C4785A]">{upcomingCount}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-[#EBEBEB]">
          <p className="text-xs text-[#6B6B6B] mb-1">Spent</p>
          <p className="text-xl font-semibold text-[#1A1A1A]">€{totalSpent}</p>
        </div>
      </div>

      {/* Timeline */}
      <JobsTimeline
        bookings={transformedBookings}
        context="owner"
        filter="all"
        showNewBookingCard={true}
        hasExistingBookings={bookings.length > 0}
        onNewBooking={handleNewBooking}
        onMessage={handleMessage}
        onReview={handleReview}
        onBookAgain={handleBookAgain}
      />

      {/* Empty state hint */}
      {bookings.length === 0 && (
        <div className="bg-[#FFF8F5] rounded-2xl p-5 border border-[#F5E6E0]">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <h3 className="font-medium text-[#1A1A1A] mb-1">Ready to book?</h3>
              <p className="text-sm text-[#6B6B6B]">
                Find a trusted cleaner in your area and book your first villa clean.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
