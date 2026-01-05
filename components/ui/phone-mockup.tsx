'use client'

import Image from 'next/image'

interface PhoneMockupProps {
  src: string
  alt: string
  className?: string
}

export function PhoneMockup({ src, alt, className = '' }: PhoneMockupProps) {
  return (
    <div className={`relative ${className}`}>
      {/* Phone frame */}
      <div className="relative mx-auto w-[280px] h-[580px] bg-[#1A1A1A] rounded-[3rem] p-3 shadow-2xl">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-[#1A1A1A] rounded-b-2xl z-10" />

        {/* Screen */}
        <div className="relative w-full h-full bg-white rounded-[2.25rem] overflow-hidden">
          <Image
            src={src}
            alt={alt}
            fill
            className="object-cover object-top"
            sizes="280px"
          />
        </div>

        {/* Home indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-28 h-1 bg-white/30 rounded-full" />
      </div>
    </div>
  )
}

interface PhoneMockupPairProps {
  leftSrc: string
  leftAlt: string
  rightSrc: string
  rightAlt: string
  className?: string
}

export function PhoneMockupPair({ leftSrc, leftAlt, rightSrc, rightAlt, className = '' }: PhoneMockupPairProps) {
  return (
    <div className={`flex justify-center items-center gap-4 ${className}`}>
      <div className="relative -rotate-6 transform-gpu">
        <PhoneMockup src={leftSrc} alt={leftAlt} />
      </div>
      <div className="relative rotate-6 transform-gpu -ml-16">
        <PhoneMockup src={rightSrc} alt={rightAlt} />
      </div>
    </div>
  )
}
