'use client'

interface Props {
  hasExistingBookings?: boolean
  onClick: () => void
}

export default function NewBookingCard({ hasExistingBookings = false, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-2xl border-2 border-dashed border-[#DEDEDE] hover:border-[#C4785A] p-6 transition-all group text-left"
    >
      <div className="flex items-center gap-4">
        {/* Plus icon circle */}
        <div className="w-12 h-12 rounded-full bg-[#F5F5F3] group-hover:bg-[#FFF8F5] flex items-center justify-center transition-colors flex-shrink-0">
          <svg
            className="w-6 h-6 text-[#9B9B9B] group-hover:text-[#C4785A] transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[#1A1A1A] group-hover:text-[#C4785A] transition-colors">
            {hasExistingBookings ? 'Book another clean' : 'Book your first clean'}
          </h3>
          <p className="text-sm text-[#6B6B6B]">
            {hasExistingBookings
              ? 'Schedule with a trusted cleaner'
              : 'Find a cleaner and schedule your villa cleaning'}
          </p>
        </div>

        {/* Arrow */}
        <div className="text-[#9B9B9B] group-hover:text-[#C4785A] transition-colors flex-shrink-0">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>

      {/* Subtle hint */}
      <div className="mt-3 pt-3 border-t border-[#EBEBEB]">
        <p className="text-xs text-[#9B9B9B] flex items-center gap-1.5">
          <span>✨</span>
          <span>{hasExistingBookings ? 'Our AI assistant will help you rebook quickly' : 'Get matched with the perfect cleaner'}</span>
        </p>
      </div>
    </button>
  )
}
