'use client'

import Link from 'next/link'
import { Booking, Cleaner } from '../page'

type Props = {
  cleaner: Cleaner
  bookings: Booking[]
}

export default function HomeTab({ cleaner, bookings }: Props) {
  // Show pending state for unverified cleaners
  if (cleaner.status === 'PENDING') {
    return <PendingState cleaner={cleaner} />
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const nextWeek = new Date(today)
  nextWeek.setDate(nextWeek.getDate() + 7)

  // Filter bookings
  const todayBookings = bookings.filter(b => {
    const bookingDate = new Date(b.date)
    bookingDate.setHours(0, 0, 0, 0)
    return bookingDate.getTime() === today.getTime() && b.status !== 'completed'
  })

  const upcomingBookings = bookings.filter(b => {
    const bookingDate = new Date(b.date)
    bookingDate.setHours(0, 0, 0, 0)
    return bookingDate > today && b.status !== 'completed'
  }).slice(0, 3)

  // Calculate stats for this week
  const thisWeekBookings = bookings.filter(b => {
    const bookingDate = new Date(b.date)
    return bookingDate >= today && bookingDate < nextWeek
  })

  const thisWeekEarnings = thisWeekBookings
    .filter(b => b.status !== 'completed')
    .reduce((sum, b) => sum + b.price, 0)

  const completedThisMonth = bookings.filter(b => {
    const bookingDate = new Date(b.date)
    return bookingDate.getMonth() === today.getMonth() && b.status === 'completed'
  }).length

  const formatDate = (date: Date) => {
    const d = new Date(date)
    const isToday = d.toDateString() === today.toDateString()
    const isTomorrow = d.toDateString() === tomorrow.toDateString()

    if (isToday) return 'Today'
    if (isTomorrow) return 'Tomorrow'

    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  return (
    <div className="space-y-6">
      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-[#EBEBEB]">
          <p className="text-sm text-[#6B6B6B] mb-1">This week</p>
          <p className="text-2xl font-semibold text-[#1A1A1A]">€{thisWeekEarnings}</p>
          <p className="text-xs text-[#9B9B9B]">{thisWeekBookings.length} booking{thisWeekBookings.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-[#EBEBEB]">
          <p className="text-sm text-[#6B6B6B] mb-1">This month</p>
          <p className="text-2xl font-semibold text-[#1A1A1A]">{completedThisMonth}</p>
          <p className="text-xs text-[#9B9B9B]">completed</p>
        </div>
      </div>

      {/* Today's schedule */}
      <div>
        <h2 className="text-sm font-medium text-[#1A1A1A] mb-3">Today&apos;s schedule</h2>
        {todayBookings.length === 0 ? (
          <div className="bg-[#F5F5F3] rounded-2xl p-6 text-center">
            <p className="text-[#6B6B6B]">No bookings today</p>
            <p className="text-sm text-[#9B9B9B] mt-1">Enjoy your day off!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayBookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} showDate={false} />
            ))}
          </div>
        )}
      </div>

      {/* Upcoming bookings */}
      {upcomingBookings.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-[#1A1A1A]">Upcoming</h2>
            <button className="text-sm text-[#C4785A] font-medium">View all</button>
          </div>
          <div className="space-y-3">
            {upcomingBookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} formatDate={formatDate} />
            ))}
          </div>
        </div>
      )}

      {/* Share your link */}
      <div className="bg-[#FFF8F5] rounded-2xl p-5 border border-[#F5E6E0]">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🔗</span>
          <div className="flex-1">
            <h3 className="font-medium text-[#1A1A1A] mb-1">Get more bookings</h3>
            <p className="text-sm text-[#6B6B6B] mb-3">
              Share your booking link with villa owners
            </p>
            <div className="flex gap-2">
              <Link
                href={`/${cleaner.slug}`}
                className="flex-1 bg-white border border-[#DEDEDE] text-[#1A1A1A] py-2 px-3 rounded-lg text-sm font-medium text-center active:scale-[0.98] transition-all"
              >
                View page
              </Link>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`https://alicantecleaners.com/${cleaner.slug}`)
                  alert('Link copied!')
                }}
                className="flex-1 bg-[#1A1A1A] text-white py-2 px-3 rounded-lg text-sm font-medium active:scale-[0.98] transition-all"
              >
                Copy link
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function PendingState({ cleaner }: { cleaner: Cleaner }) {
  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <div className="bg-[#FFF8F5] rounded-2xl p-5 border border-[#F5E6E0]">
        <div className="flex items-start gap-3">
          <span className="text-3xl">&#9203;</span>
          <div>
            <h2 className="text-lg font-semibold text-[#1A1A1A] mb-1">Application Pending</h2>
            <p className="text-sm text-[#6B6B6B]">
              Your profile is awaiting verification by a team leader. Once verified, you&apos;ll be able to accept bookings.
            </p>
          </div>
        </div>
      </div>

      {/* What to do next */}
      <div className="bg-white rounded-2xl p-5 border border-[#EBEBEB]">
        <h3 className="font-medium text-[#1A1A1A] mb-4">What to do next</h3>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-[#E8F5E9] rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm">&#128172;</span>
            </div>
            <div>
              <p className="font-medium text-[#1A1A1A] text-sm">Chat with a Team Leader</p>
              <p className="text-xs text-[#6B6B6B] mt-0.5">
                Visit a team leader&apos;s profile and introduce yourself via the chat widget
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-[#E3F2FD] rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm">&#128100;</span>
            </div>
            <div>
              <p className="font-medium text-[#1A1A1A] text-sm">Complete your profile</p>
              <p className="text-xs text-[#6B6B6B] mt-0.5">
                Add a photo and bio to make a good impression
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-[#F5F5F3] rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm">&#9200;</span>
            </div>
            <div>
              <p className="font-medium text-[#1A1A1A] text-sm">Wait for verification</p>
              <p className="text-xs text-[#6B6B6B] mt-0.5">
                Team leaders review applications and will accept you when ready
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Profile preview */}
      <div className="bg-white rounded-2xl p-5 border border-[#EBEBEB]">
        <h3 className="font-medium text-[#1A1A1A] mb-4">Your Profile</h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#6B6B6B]">Hourly Rate</span>
            <span className="text-sm font-medium text-[#1A1A1A]">&euro;{cleaner.hourlyRate}/hr</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#6B6B6B]">Service Areas</span>
            <span className="text-sm font-medium text-[#1A1A1A]">
              {cleaner.serviceAreas.length} area{cleaner.serviceAreas.length !== 1 ? 's' : ''}
            </span>
          </div>
          {cleaner.bio ? (
            <div className="pt-3 border-t border-[#EBEBEB]">
              <p className="text-sm text-[#6B6B6B]">{cleaner.bio}</p>
            </div>
          ) : (
            <div className="pt-3 border-t border-[#EBEBEB]">
              <p className="text-sm text-[#9B9B9B] italic">No bio added yet - add one to stand out!</p>
            </div>
          )}
        </div>
      </div>

      {/* Help */}
      <div className="text-center">
        <p className="text-sm text-[#6B6B6B]">
          Questions? Contact{' '}
          <a href="mailto:support@alicantecleaners.com" className="text-[#C4785A] font-medium">
            support@alicantecleaners.com
          </a>
        </p>
      </div>
    </div>
  )
}

function BookingCard({
  booking,
  showDate = true,
  formatDate,
}: {
  booking: Booking
  showDate?: boolean
  formatDate?: (date: Date) => string
}) {
  const statusColors = {
    pending: 'bg-[#FFF3E0] text-[#E65100]',
    confirmed: 'bg-[#E8F5E9] text-[#2E7D32]',
    completed: 'bg-[#F5F5F3] text-[#6B6B6B]',
  }

  const statusLabels = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    completed: 'Completed',
  }

  return (
    <div className="bg-white rounded-2xl p-4 border border-[#EBEBEB]">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-[#1A1A1A]">{booking.service}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[booking.status]}`}>
              {statusLabels[booking.status]}
            </span>
          </div>
          <p className="text-sm text-[#6B6B6B]">
            {showDate && formatDate ? `${formatDate(booking.date)} · ` : ''}{booking.time} · {booking.hours}h
          </p>
        </div>
        <span className="font-semibold text-[#1A1A1A]">€{booking.price}</span>
      </div>

      <div className="flex items-center gap-2 text-sm text-[#6B6B6B]">
        <span>📍</span>
        <span className="truncate">{booking.property.address}</span>
      </div>

      {booking.status === 'pending' && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-[#EBEBEB]">
          <button className="flex-1 bg-[#1A1A1A] text-white py-2 rounded-lg text-sm font-medium active:scale-[0.98] transition-all">
            Accept
          </button>
          <button className="flex-1 bg-white border border-[#DEDEDE] text-[#1A1A1A] py-2 rounded-lg text-sm font-medium active:scale-[0.98] transition-all">
            Decline
          </button>
        </div>
      )}

      {booking.status === 'confirmed' && (
        <div className="mt-3 pt-3 border-t border-[#EBEBEB]">
          <a
            href={`tel:${booking.owner.phone}`}
            className="flex items-center justify-center gap-2 w-full bg-[#F5F5F3] text-[#1A1A1A] py-2 rounded-lg text-sm font-medium active:scale-[0.98] transition-all"
          >
            <span>📞</span>
            <span>Call {booking.owner.name.split(' ')[0]}</span>
          </a>
        </div>
      )}
    </div>
  )
}
