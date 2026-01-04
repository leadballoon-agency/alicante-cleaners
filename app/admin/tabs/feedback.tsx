'use client'

import { useState } from 'react'

type Category = 'idea' | 'issue' | 'praise' | 'question'
type Mood = 'love' | 'like' | 'meh' | 'frustrated'
type Status = 'new' | 'reviewed' | 'planned' | 'done'

type Feedback = {
  id: string
  category: Category
  mood: Mood
  message: string
  page: string
  userType: 'owner' | 'cleaner' | 'visitor' | null
  createdAt: Date
  status: Status
  votes: number
}

type Props = {
  feedback: Feedback[]
  onUpdateStatus: (id: string, status: Status) => void
}

const MOODS: Record<Mood, { emoji: string; label: string }> = {
  love: { emoji: '😍', label: 'Love it!' },
  like: { emoji: '🙂', label: 'It\'s good' },
  meh: { emoji: '😐', label: 'Could be better' },
  frustrated: { emoji: '😤', label: 'Frustrated' },
}

const CATEGORIES: Record<Category, { emoji: string; label: string; color: string }> = {
  idea: { emoji: '💡', label: 'Idea', color: 'bg-[#E3F2FD] text-[#1976D2]' },
  issue: { emoji: '🐛', label: 'Issue', color: 'bg-[#FFEBEE] text-[#C62828]' },
  praise: { emoji: '⭐', label: 'Praise', color: 'bg-[#E8F5E9] text-[#2E7D32]' },
  question: { emoji: '❓', label: 'Question', color: 'bg-[#FFF8E1] text-[#F57F17]' },
}

const STATUSES: { id: Status; label: string; color: string }[] = [
  { id: 'new', label: 'New', color: 'bg-[#E3F2FD] text-[#1976D2]' },
  { id: 'reviewed', label: 'Reviewed', color: 'bg-[#FFF3E0] text-[#E65100]' },
  { id: 'planned', label: 'Planned', color: 'bg-[#F3E5F5] text-[#7B1FA2]' },
  { id: 'done', label: 'Done', color: 'bg-[#E8F5E9] text-[#2E7D32]' },
]

type Filter = 'all' | Category

export default function FeedbackTab({ feedback, onUpdateStatus }: Props) {
  const [filter, setFilter] = useState<Filter>('all')
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filteredFeedback = feedback
    .filter(f => filter === 'all' || f.category === filter)
    .filter(f => statusFilter === 'all' || f.status === statusFilter)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const formatDate = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)

    if (hours < 1) return 'Just now'
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Stats
  const stats = {
    total: feedback.length,
    new: feedback.filter(f => f.status === 'new').length,
    ideas: feedback.filter(f => f.category === 'idea').length,
    issues: feedback.filter(f => f.category === 'issue').length,
    avgMood: feedback.length > 0
      ? (feedback.reduce((sum, f) => {
          const moodScores = { love: 4, like: 3, meh: 2, frustrated: 1 }
          return sum + moodScores[f.mood]
        }, 0) / feedback.length).toFixed(1)
      : '0',
  }

  const getMoodScore = (mood: Mood) => {
    const scores = { love: 4, like: 3, meh: 2, frustrated: 1 }
    return scores[mood]
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-[#1A1A1A]">User Feedback</h2>
        <p className="text-sm text-[#6B6B6B]">
          {stats.total} total submissions · {stats.new} need review
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-[#EBEBEB]">
          <p className="text-sm text-[#6B6B6B] mb-1">New Feedback</p>
          <p className="text-2xl font-semibold text-[#1976D2]">{stats.new}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-[#EBEBEB]">
          <p className="text-sm text-[#6B6B6B] mb-1">Feature Ideas</p>
          <p className="text-2xl font-semibold text-[#1A1A1A]">{stats.ideas}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-[#EBEBEB]">
          <p className="text-sm text-[#6B6B6B] mb-1">Issues Reported</p>
          <p className="text-2xl font-semibold text-[#C62828]">{stats.issues}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-[#EBEBEB]">
          <p className="text-sm text-[#6B6B6B] mb-1">Avg Mood</p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-semibold text-[#1A1A1A]">{stats.avgMood}</p>
            <span className="text-lg">
              {Number(stats.avgMood) >= 3.5 ? '😊' : Number(stats.avgMood) >= 2.5 ? '😐' : '😟'}
            </span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex gap-2">
          {(['all', 'idea', 'issue', 'praise', 'question'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-[#1A1A1A] text-white'
                  : 'bg-white border border-[#EBEBEB] text-[#6B6B6B] hover:bg-[#F5F5F3]'
              }`}
            >
              {f === 'all' ? 'All' : `${CATEGORIES[f].emoji} ${CATEGORIES[f].label}`}
            </button>
          ))}
        </div>

        <div className="flex gap-2 ml-auto">
          {(['all', ...STATUSES.map(s => s.id)] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-[#1A1A1A] text-white'
                  : 'bg-white border border-[#EBEBEB] text-[#6B6B6B] hover:bg-[#F5F5F3]'
              }`}
            >
              {s === 'all' ? 'All Status' : STATUSES.find(st => st.id === s)?.label}
            </button>
          ))}
        </div>
      </div>

      {/* Feedback List */}
      <div className="space-y-3">
        {filteredFeedback.length === 0 ? (
          <div className="bg-[#F5F5F3] rounded-2xl p-8 text-center">
            <span className="text-4xl block mb-3">📭</span>
            <p className="text-[#6B6B6B]">No feedback matching filters</p>
          </div>
        ) : (
          filteredFeedback.map((item) => {
            const isExpanded = expandedId === item.id

            return (
              <div
                key={item.id}
                className={`bg-white rounded-xl border overflow-hidden transition-all ${
                  item.status === 'new' ? 'border-[#1976D2]' : 'border-[#EBEBEB]'
                }`}
              >
                {/* Main row */}
                <div
                  className="p-4 cursor-pointer hover:bg-[#FAFAF8] transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                >
                  <div className="flex items-start gap-3">
                    {/* Mood emoji */}
                    <div className="text-2xl flex-shrink-0">
                      {MOODS[item.mood].emoji}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${CATEGORIES[item.category].color}`}>
                          {CATEGORIES[item.category].emoji} {CATEGORIES[item.category].label}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          STATUSES.find(s => s.id === item.status)?.color
                        }`}>
                          {STATUSES.find(s => s.id === item.status)?.label}
                        </span>
                        {item.status === 'new' && (
                          <span className="w-2 h-2 rounded-full bg-[#1976D2] animate-pulse" />
                        )}
                      </div>

                      <p className="text-[#1A1A1A] line-clamp-2">
                        {item.message || <span className="text-[#9B9B9B] italic">No message provided</span>}
                      </p>

                      <div className="flex items-center gap-3 mt-2 text-xs text-[#9B9B9B]">
                        <span>{formatDate(item.createdAt)}</span>
                        <span>·</span>
                        <span>{item.page}</span>
                        <span>·</span>
                        <span className="capitalize">{item.userType || 'Visitor'}</span>
                      </div>
                    </div>

                    {/* Expand icon */}
                    <span className={`text-[#9B9B9B] transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-0 border-t border-[#EBEBEB] bg-[#FAFAF8]">
                    <div className="pt-4 space-y-4">
                      {/* Full message */}
                      {item.message && (
                        <div>
                          <p className="text-xs font-medium text-[#6B6B6B] uppercase tracking-wide mb-1">
                            Full Message
                          </p>
                          <p className="text-[#1A1A1A] bg-white p-3 rounded-lg border border-[#EBEBEB]">
                            {item.message}
                          </p>
                        </div>
                      )}

                      {/* Details grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-white p-3 rounded-lg border border-[#EBEBEB]">
                          <p className="text-xs text-[#9B9B9B]">Mood Score</p>
                          <p className="font-medium text-[#1A1A1A]">
                            {getMoodScore(item.mood)}/4 {MOODS[item.mood].emoji}
                          </p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-[#EBEBEB]">
                          <p className="text-xs text-[#9B9B9B]">User Type</p>
                          <p className="font-medium text-[#1A1A1A] capitalize">
                            {item.userType || 'Visitor'}
                          </p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-[#EBEBEB]">
                          <p className="text-xs text-[#9B9B9B]">Page</p>
                          <p className="font-medium text-[#1A1A1A] truncate">
                            {item.page}
                          </p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-[#EBEBEB]">
                          <p className="text-xs text-[#9B9B9B]">Votes</p>
                          <p className="font-medium text-[#1A1A1A]">
                            {item.votes} upvotes
                          </p>
                        </div>
                      </div>

                      {/* Status actions */}
                      <div>
                        <p className="text-xs font-medium text-[#6B6B6B] uppercase tracking-wide mb-2">
                          Update Status
                        </p>
                        <div className="flex gap-2 flex-wrap">
                          {STATUSES.map((status) => (
                            <button
                              key={status.id}
                              onClick={(e) => {
                                e.stopPropagation()
                                onUpdateStatus(item.id, status.id)
                              }}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                item.status === status.id
                                  ? `${status.color} ring-2 ring-offset-2 ring-current`
                                  : 'bg-white border border-[#DEDEDE] text-[#6B6B6B] hover:bg-[#F5F5F3]'
                              }`}
                            >
                              {status.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
