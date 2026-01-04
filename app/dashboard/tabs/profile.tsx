'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Cleaner } from '../page'
import LanguageSelector from '@/components/language-selector'

type Props = {
  cleaner: Cleaner
}

export default function ProfileTab({ cleaner }: Props) {
  const bookingUrl = `alicantecleaners.com/${cleaner.slug}`

  const menuItems = [
    { icon: '👤', label: 'Edit profile', href: '#' },
    { icon: '💰', label: 'Update pricing', href: '#' },
    { icon: '📍', label: 'Service areas', href: '#' },
    { icon: '📅', label: 'Availability', href: '#' },
    { icon: '💳', label: 'Payment settings', href: '#' },
    { icon: '🔔', label: 'Notifications', href: '#' },
  ]

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Book ${cleaner.name} for villa cleaning`,
          text: 'Trusted villa cleaning in Alicante',
          url: `https://${bookingUrl}`,
        })
      } catch {
        // User cancelled or share failed
      }
    } else {
      navigator.clipboard.writeText(`https://${bookingUrl}`)
      alert('Link copied to clipboard!')
    }
  }

  return (
    <div className="space-y-6">
      {/* Profile card */}
      <div className="bg-white rounded-2xl p-5 border border-[#EBEBEB]">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-[#F5F5F3] flex items-center justify-center overflow-hidden relative">
            {cleaner.photo ? (
              <Image src={cleaner.photo} alt={cleaner.name} fill className="object-cover" unoptimized />
            ) : (
              <span className="text-2xl">👤</span>
            )}
          </div>
          <div>
            <h2 className="font-semibold text-[#1A1A1A]">{cleaner.name}</h2>
            <p className="text-sm text-[#6B6B6B]">
              {cleaner.serviceAreas.length} service area{cleaner.serviceAreas.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="bg-[#F5F5F3] rounded-xl p-4">
          <p className="text-xs text-[#6B6B6B] mb-1">Your booking page</p>
          <p className="font-medium text-[#1A1A1A] text-sm break-all">{bookingUrl}</p>
        </div>

        <div className="flex gap-2 mt-4">
          <Link
            href={`/${cleaner.slug}`}
            className="flex-1 bg-white border border-[#DEDEDE] text-[#1A1A1A] py-2.5 rounded-xl text-sm font-medium text-center active:scale-[0.98] transition-all"
          >
            View page
          </Link>
          <button
            onClick={handleShare}
            className="flex-1 bg-[#1A1A1A] text-white py-2.5 rounded-xl text-sm font-medium active:scale-[0.98] transition-all"
          >
            Share link
          </button>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-3 border border-[#EBEBEB] text-center">
          <p className="text-xl font-semibold text-[#1A1A1A]">€{cleaner.hourlyRate}</p>
          <p className="text-xs text-[#6B6B6B]">/hour</p>
        </div>
        <div className="bg-white rounded-xl p-3 border border-[#EBEBEB] text-center">
          <p className="text-xl font-semibold text-[#1A1A1A]">5.0</p>
          <p className="text-xs text-[#6B6B6B]">rating</p>
        </div>
        <div className="bg-white rounded-xl p-3 border border-[#EBEBEB] text-center">
          <p className="text-xl font-semibold text-[#1A1A1A]">25</p>
          <p className="text-xs text-[#6B6B6B]">reviews</p>
        </div>
      </div>

      {/* Language preference */}
      <LanguageSelector
        label="Idioma preferido"
        description="Los mensajes de los propietarios se traducirán a este idioma"
      />

      {/* Menu items */}
      <div className="bg-white rounded-2xl border border-[#EBEBEB] divide-y divide-[#EBEBEB]">
        {menuItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="flex items-center gap-3 px-4 py-3.5 active:bg-[#F5F5F3] transition-colors"
          >
            <span className="text-lg">{item.icon}</span>
            <span className="font-medium text-[#1A1A1A]">{item.label}</span>
            <span className="ml-auto text-[#9B9B9B]">→</span>
          </Link>
        ))}
      </div>

      {/* Support & logout */}
      <div className="space-y-3">
        <Link
          href="#"
          className="block w-full bg-white border border-[#EBEBEB] text-[#1A1A1A] py-3.5 rounded-xl font-medium text-center active:scale-[0.98] transition-all"
        >
          Help & Support
        </Link>
        <button className="w-full text-[#C75050] py-3 font-medium text-sm active:opacity-70">
          Log out
        </button>
      </div>

      <p className="text-center text-xs text-[#9B9B9B]">
        VillaCare v1.0 · Made in Alicante
      </p>
    </div>
  )
}
