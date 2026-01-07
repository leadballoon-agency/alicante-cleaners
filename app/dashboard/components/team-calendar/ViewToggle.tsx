'use client'

type ViewMode = 'week' | 'day'

interface Props {
  viewMode: ViewMode
  onChange: (mode: ViewMode) => void
}

export default function ViewToggle({ viewMode, onChange }: Props) {
  return (
    <div className="flex bg-[#F5F5F3] rounded-lg p-0.5">
      <button
        onClick={() => onChange('week')}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
          viewMode === 'week'
            ? 'bg-white text-[#1A1A1A] shadow-sm'
            : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
        }`}
      >
        Week
      </button>
      <button
        onClick={() => onChange('day')}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
          viewMode === 'day'
            ? 'bg-white text-[#1A1A1A] shadow-sm'
            : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
        }`}
      >
        Day
      </button>
    </div>
  )
}
