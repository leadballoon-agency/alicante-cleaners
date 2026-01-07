'use client'

import Link from 'next/link'
import Image from 'next/image'
import { BookingData } from '../page'

type Props = {
  data: BookingData
  cleaner: {
    name: string
    photo: string | null
  }
  slug: string
}

export default function Confirmation({ data, cleaner, slug }: Props) {
  const formatDate = (date: Date | null) => {
    if (!date) return ''
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    })
  }

  const handleAddToCalendar = () => {
    if (!data.date || !data.time) return

    const [hours, minutes] = data.time.split(':').map(Number)
    const startDate = new Date(data.date)
    startDate.setHours(hours, minutes, 0, 0)

    const endDate = new Date(startDate)
    endDate.setHours(endDate.getHours() + (data.service?.hours || 3))

    const formatForCalendar = (date: Date) => {
      return date.toISOString().replace(/-|:|\.\d{3}/g, '').slice(0, 15) + 'Z'
    }

    const title = encodeURIComponent(`Villa cleaning - ${cleaner.name}`)
    const details = encodeURIComponent(`${data.service?.name}\n${data.propertyAddress}`)
    const location = encodeURIComponent(data.propertyAddress)

    // Google Calendar link
    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formatForCalendar(startDate)}/${formatForCalendar(endDate)}&details=${details}&location=${location}`

    window.open(googleUrl, '_blank')
  }

  return (
    <div className="text-center">
      <div className="text-6xl mb-6">✅</div>

      <h1 className="text-2xl font-semibold text-[#1A1A1A] mb-2">
        Booking request sent!
      </h1>
      <p className="text-[#6B6B6B] mb-4">
        We&apos;ve sent the details to {data.email}
      </p>

      {/* SLA Status Badge */}
      <div className="inline-flex items-center gap-2 bg-[#FFF3E0] text-[#E65100] px-4 py-2 rounded-full text-sm font-medium mb-8">
        <span className="w-2 h-2 bg-[#E65100] rounded-full animate-pulse" />
        Awaiting cleaner confirmation
      </div>

      {/* Booking details card */}
      <div className="bg-white rounded-2xl p-5 border border-[#EBEBEB] mb-6 text-left">
        <div className="flex items-center gap-3 pb-4 border-b border-[#EBEBEB]">
          <div className="w-12 h-12 rounded-full bg-[#F5F5F3] flex items-center justify-center overflow-hidden relative">
            {cleaner.photo ? (
              <Image src={cleaner.photo} alt={cleaner.name} fill className="object-cover" unoptimized />
            ) : (
              <span className="text-xl">👤</span>
            )}
          </div>
          <div>
            <p className="font-medium text-[#1A1A1A]">{cleaner.name}</p>
            <p className="text-sm text-[#6B6B6B]">{data.service?.name}</p>
          </div>
        </div>

        <div className="py-4 space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-lg">📅</span>
            <div>
              <p className="font-medium text-[#1A1A1A]">{formatDate(data.date)}</p>
              <p className="text-sm text-[#6B6B6B]">{data.time} · {data.service?.hours} hours</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-lg">📍</span>
            <div>
              <p className="font-medium text-[#1A1A1A]">{data.propertyAddress}</p>
              <p className="text-sm text-[#6B6B6B]">{data.bedrooms} bedroom{data.bedrooms !== 1 ? 's' : ''}</p>
            </div>
          </div>

          {data.specialInstructions && (
            <div className="flex items-start gap-3">
              <span className="text-lg">📝</span>
              <div>
                <p className="text-sm text-[#6B6B6B]">{data.specialInstructions}</p>
              </div>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-[#EBEBEB] flex justify-between items-center">
          <span className="text-[#6B6B6B]">Total paid</span>
          <span className="text-xl font-semibold text-[#1A1A1A]">€{data.service?.price}</span>
        </div>
      </div>

      {/* What's next - SLA Section */}
      <div className="bg-[#F5F5F3] rounded-xl p-4 mb-6 text-left">
        <p className="text-sm font-medium text-[#1A1A1A] mb-3">What happens next?</p>
        <ul className="space-y-3 text-sm">
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-[#C4785A] text-white rounded-full flex items-center justify-center text-xs font-medium">1</span>
            <div>
              <span className="text-[#1A1A1A] font-medium">{cleaner.name.split(' ')[0]} will respond within 2 hours</span>
              <p className="text-[#9B9B9B] text-xs mt-0.5">
                We&apos;ll notify you by WhatsApp and email
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-[#C4785A] text-white rounded-full flex items-center justify-center text-xs font-medium">2</span>
            <div>
              <span className="text-[#1A1A1A] font-medium">24-hour reminder</span>
              <p className="text-[#9B9B9B] text-xs mt-0.5">
                You&apos;ll get a reminder the day before your clean
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-[#C4785A] text-white rounded-full flex items-center justify-center text-xs font-medium">3</span>
            <div>
              <span className="text-[#1A1A1A] font-medium">Photo confirmation</span>
              <p className="text-[#9B9B9B] text-xs mt-0.5">
                After the clean, you&apos;ll receive photos of the work
              </p>
            </div>
          </li>
        </ul>

        {/* Fallback guarantee */}
        <div className="mt-4 pt-3 border-t border-[#DEDEDE]">
          <p className="text-xs text-[#6B6B6B]">
            <span className="font-medium text-[#1A1A1A]">No response?</span> If the cleaner doesn&apos;t respond within 4 hours, we&apos;ll automatically find you an available alternative.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={handleAddToCalendar}
          className="w-full bg-[#1A1A1A] text-white py-3.5 rounded-xl font-medium text-base active:scale-[0.98] transition-all"
        >
          Add to calendar
        </button>

        <Link
          href="/owner/dashboard"
          className="w-full bg-[#C4785A] text-white py-3.5 rounded-xl font-medium text-base active:scale-[0.98] transition-all block text-center"
        >
          View my bookings
        </Link>

        <Link
          href={`/${slug}`}
          className="w-full bg-white border border-[#DEDEDE] text-[#1A1A1A] py-3.5 rounded-xl font-medium text-base active:scale-[0.98] transition-all block text-center"
        >
          Book another clean
        </Link>

        <Link
          href="/"
          className="w-full text-[#6B6B6B] py-3 font-medium text-sm active:opacity-70 block"
        >
          Back to home
        </Link>
      </div>

      {/* Support */}
      <p className="text-[#9B9B9B] text-xs mt-8">
        Questions? Contact us at support@alicantecleaners.com
      </p>
    </div>
  )
}
