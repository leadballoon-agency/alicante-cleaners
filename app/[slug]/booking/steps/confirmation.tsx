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
        Booking confirmed!
      </h1>
      <p className="text-[#6B6B6B] mb-8">
        We&apos;ve sent the details to {data.email}
      </p>

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

      {/* What's next */}
      <div className="bg-[#F5F5F3] rounded-xl p-4 mb-6 text-left">
        <p className="text-sm font-medium text-[#1A1A1A] mb-2">What happens next?</p>
        <ul className="space-y-2 text-sm text-[#6B6B6B]">
          <li className="flex items-start gap-2">
            <span className="text-[#C4785A]">1.</span>
            <span>{cleaner.name.split(' ')[0]} will confirm your booking within 24 hours</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#C4785A]">2.</span>
            <span>You&apos;ll receive a reminder 24 hours before your clean</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#C4785A]">3.</span>
            <span>After the clean, you&apos;ll get photos of the completed work</span>
          </li>
        </ul>
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
