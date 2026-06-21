'use client'

import { useEffect, useState } from 'react'

type Action = { key: string; lever: string; icon: string; title: string; sub: string; count: number }
type TodayData = {
  manager: string
  pulse: { activeCleaners: number; averageRating: number; bookingsThisWeek: number; areasCovered: number; totalAreas: number }
  actions: Action[]
}

// Which tab each action sends the manager to
const ACTION_TAB: Record<string, string> = {
  pending_cleaners: 'cleaners',
  chase_reviews: 'reviews',
  pending_bookings: 'bookings',
  coverage_gap: 'cleaners',
}
const ACTION_CTA: Record<string, string> = {
  pending_cleaners: 'Review & approve',
  chase_reviews: 'Open reviews',
  pending_bookings: 'View bookings',
  coverage_gap: 'Find cleaners',
}
const LEVER_STYLE: Record<string, string> = {
  'Supply · approvals': 'bg-[#E6F2EC] text-[#2E7D5B]',
  'Supply · coverage': 'bg-[#E6F2EC] text-[#2E7D5B]',
  'Trust · reviews': 'bg-[#FBEFDD] text-[#B5731F]',
  'Match · bookings': 'bg-[#FBEFDD] text-[#B5731F]',
}

function greetingWord() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function TodayTab({
  onOpenAI,
  onTabChange,
}: {
  onOpenAI: () => void
  onTabChange: (tab: string) => void
}) {
  const [data, setData] = useState<TodayData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/today')
      .then((r) => r.json())
      .then((d) => { if (!d.error) setData(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse pb-24">
        <div className="h-8 w-2/3 bg-[#EFE8E1] rounded-lg" />
        <div className="h-4 w-full bg-[#F5F0EA] rounded" />
        <div className="grid grid-cols-4 gap-2 mt-4">
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-16 bg-[#F5F0EA] rounded-2xl" />)}
        </div>
        <div className="h-28 bg-[#F5F0EA] rounded-2xl mt-4" />
        <div className="h-28 bg-[#F5F0EA] rounded-2xl" />
      </div>
    )
  }

  if (!data) {
    return <div className="text-center text-[#7C7269] py-16">Couldn&apos;t load your dashboard. Pull to refresh.</div>
  }

  const { pulse, actions } = data
  const firstName = (data.manager || 'there').split(' ')[0]
  const summary =
    actions.length === 0
      ? "All quiet — nothing needs you right now. Lovely work."
      : `${actions.length} thing${actions.length > 1 ? 's' : ''} need${actions.length > 1 ? '' : 's'} you. Tackle the top one to keep the wheel turning.`

  return (
    <div className="pb-28">
      {/* Greeting */}
      <h1 className="text-[26px] leading-tight font-semibold text-[#1A1A1A]" style={{ fontFamily: 'Georgia, serif' }}>
        {greetingWord()}, {firstName} <span aria-hidden>🌅</span>
      </h1>
      <p className="text-[#7C7269] text-[14.5px] leading-relaxed mt-2">{summary}</p>

      {/* Flywheel pulse */}
      <div className="grid grid-cols-4 gap-2 mt-5">
        <Stat n={pulse.activeCleaners} l="CLEANERS" />
        <Stat n={`${pulse.averageRating || '—'}★`} l="RATING" />
        <Stat n={pulse.bookingsThisWeek} l="THIS WEEK" />
        <Stat n={`${pulse.areasCovered}/${pulse.totalAreas}`} l="AREAS" highlight={pulse.areasCovered === pulse.totalAreas} />
      </div>

      {/* Needs you now */}
      <div className="flex items-center gap-2 mt-7 mb-3">
        <span className="w-[7px] h-[7px] rounded-full bg-[#C4785A]" />
        <h2 className="text-[13px] font-bold tracking-wider uppercase text-[#7C7269]">Needs you now</h2>
        {actions.length > 0 && <span className="ml-auto text-xs font-semibold text-[#A89E95]">{actions.length}</span>}
      </div>

      {actions.length === 0 ? (
        <div className="bg-[#E6F2EC] border border-[#D3E7DC] rounded-2xl p-4 flex items-center gap-3">
          <span className="text-xl">✅</span>
          <span className="text-[13.5px] font-semibold text-[#2E7D5B]">You&apos;re all caught up. Ask me below if you want to grow.</span>
        </div>
      ) : (
        actions.map((a) => (
          <div key={a.key} className="bg-white border border-[#EFE8E1] rounded-[18px] p-4 mb-3 shadow-sm">
            <span className={`inline-block text-[10.5px] font-bold tracking-wide uppercase px-2 py-[3px] rounded-md mb-[9px] ${LEVER_STYLE[a.lever] || 'bg-[#F3E4DC] text-[#B56A4F]'}`}>
              {a.lever}
            </span>
            <div className="flex gap-3 items-start">
              <div className="w-[38px] h-[38px] rounded-[11px] bg-[#F3E4DC] flex items-center justify-center text-lg shrink-0">{a.icon}</div>
              <div>
                <div className="font-semibold text-[15px] text-[#1A1A1A] leading-snug">{a.title}</div>
                <div className="text-[13px] text-[#7C7269] mt-1 leading-relaxed">{a.sub}</div>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => onTabChange(ACTION_TAB[a.key] || 'live')}
                className="flex-1 bg-[#C4785A] text-white rounded-xl py-[11px] text-[13.5px] font-semibold active:scale-[0.97] transition-transform"
              >
                {ACTION_CTA[a.key] || 'Open'}
              </button>
              <button
                onClick={onOpenAI}
                className="bg-[#FAF7F3] text-[#1A1A1A] border border-[#EFE8E1] rounded-xl py-[11px] px-4 text-[13.5px] font-semibold active:scale-[0.97] transition-transform"
              >
                Ask AI
              </button>
            </div>
          </div>
        ))
      )}

      {/* Ask dock */}
      <button
        onClick={onOpenAI}
        className="fixed bottom-4 left-4 right-4 max-w-[760px] mx-auto bg-white border border-[#EFE8E1] rounded-2xl px-4 py-[14px] flex items-center gap-3 shadow-lg active:scale-[0.99] transition-transform"
      >
        <span className="flex-1 text-left text-[#A89E95] text-[14.5px]">Ask me anything…</span>
        <span className="w-[34px] h-[34px] rounded-[10px] bg-[#F3E4DC] flex items-center justify-center text-base">🎙️</span>
        <span className="w-[34px] h-[34px] rounded-[10px] bg-[#C4785A] text-white flex items-center justify-center text-[15px]">↑</span>
      </button>
    </div>
  )
}

function Stat({ n, l, highlight }: { n: number | string; l: string; highlight?: boolean }) {
  return (
    <div className="bg-white border border-[#EFE8E1] rounded-2xl py-3 px-2 text-center shadow-sm">
      <div className={`font-bold text-[19px] ${highlight ? 'text-[#C4785A]' : 'text-[#1A1A1A]'}`} style={{ fontFamily: 'Georgia, serif' }}>{n}</div>
      <div className="text-[10px] text-[#A89E95] mt-[3px] font-medium tracking-wide">{l}</div>
    </div>
  )
}
