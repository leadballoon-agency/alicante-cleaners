'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

interface SuccessStats {
  profileScore: number
  profileViews: number
  completedJobs: number
  unlocked: boolean
}

interface TeamProgression {
  currentLevel: 'solo' | 'team_member' | 'team_leader' | 'services_active'
  levelNumber: number
  levelName: string
  nextLevel: string | null
  nextAction: string | null
  progress: number
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export default function SuccessTab() {
  const [stats, setStats] = useState<SuccessStats | null>(null)
  const [teamProgression, setTeamProgression] = useState<TeamProgression | null>(null)
  const [greeting, setGreeting] = useState('')
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isSending, setIsSending] = useState(false)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    // Scroll to bottom when messages change
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  const fetchInitialData = async () => {
    try {
      const response = await fetch('/api/ai/success-chat')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
        setGreeting(data.greeting)
        setTeamProgression(data.teamProgression)
      }
    } catch (error) {
      console.error('Failed to fetch success data:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async (content: string) => {
    if (!content.trim() || isSending) return

    const userMessage: ChatMessage = { role: 'user', content: content.trim() }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInputValue('')
    setIsSending(true)

    try {
      const response = await fetch('/api/ai/success-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      })

      if (response.ok) {
        const data = await response.json()
        setMessages([...newMessages, { role: 'assistant', content: data.message }])
      } else {
        setMessages([
          ...newMessages,
          { role: 'assistant', content: 'Sorry, I had trouble responding. Please try again.' },
        ])
      }
    } catch (error) {
      console.error('Chat error:', error)
      setMessages([
        ...newMessages,
        { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' },
      ])
    } finally {
      setIsSending(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(inputValue)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="w-6 h-6 border-2 border-[#C4785A]/20 border-t-[#C4785A] rounded-full animate-spin" />
      </div>
    )
  }

  const profileScore = stats?.profileScore || 0
  const unlocked = stats?.unlocked || false

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-[#1A1A1A]">Success Coach</h2>
        <p className="text-sm text-[#6B6B6B]">Your personal AI coach to maximize bookings</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-[#EBEBEB] text-center">
          <div className="relative w-12 h-12 mx-auto mb-2">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                stroke="#EBEBEB"
                strokeWidth="4"
              />
              <circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                stroke={profileScore >= 80 ? '#2E7D32' : profileScore >= 50 ? '#F59E0B' : '#C4785A'}
                strokeWidth="4"
                strokeDasharray={`${(profileScore / 100) * 125.6} 125.6`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
              {profileScore}
            </span>
          </div>
          <p className="text-xs text-[#6B6B6B]">Profile</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#EBEBEB] text-center">
          <p className="text-2xl font-bold text-[#1A1A1A]">{stats?.profileViews || 0}</p>
          <p className="text-xs text-[#6B6B6B] mt-1">Views this week</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#EBEBEB] text-center">
          <p className="text-2xl font-bold text-[#1A1A1A]">{stats?.completedJobs || 0}</p>
          <p className="text-xs text-[#6B6B6B] mt-1">Jobs completed</p>
        </div>
      </div>

      {/* Path to Team Leader - Business Growth Journey */}
      {teamProgression && (
        <div className="bg-white rounded-2xl p-5 border border-[#EBEBEB]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-[#1A1A1A]">Your Business Journey</h3>
            <span className="text-xs text-[#6B6B6B]">Level {teamProgression.levelNumber}/4</span>
          </div>

          {/* Progress Steps */}
          <div className="relative">
            {/* Progress Line */}
            <div className="absolute top-4 left-4 right-4 h-1 bg-[#EBEBEB] rounded-full">
              <div
                className="h-full bg-gradient-to-r from-[#C4785A] to-[#2E7D32] rounded-full transition-all duration-500"
                style={{ width: `${teamProgression.progress}%` }}
              />
            </div>

            {/* Steps */}
            <div className="relative flex justify-between">
              {[
                { level: 1, label: 'Solo', icon: '👤', key: 'solo' },
                { level: 2, label: 'Team', icon: '👥', key: 'team_member' },
                { level: 3, label: 'Leader', icon: '⭐', key: 'team_leader' },
                { level: 4, label: 'Owner', icon: '🏆', key: 'services_active' },
              ].map((step) => {
                const isActive = teamProgression.levelNumber >= step.level
                const isCurrent = teamProgression.levelNumber === step.level
                return (
                  <div key={step.key} className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm z-10 transition-all ${
                        isActive
                          ? isCurrent
                            ? 'bg-[#C4785A] text-white ring-4 ring-[#C4785A]/20'
                            : 'bg-[#2E7D32] text-white'
                          : 'bg-[#F5F5F3] text-[#9B9B9B]'
                      }`}
                    >
                      {step.icon}
                    </div>
                    <span className={`text-[10px] mt-1 ${isActive ? 'text-[#1A1A1A] font-medium' : 'text-[#9B9B9B]'}`}>
                      {step.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Current Status & Next Action */}
          <div className="mt-5 pt-4 border-t border-[#EBEBEB]">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-[#E8F5E9] text-[#2E7D32] text-xs font-medium rounded-full">
                {teamProgression.levelName}
              </span>
            </div>
            {teamProgression.nextAction && (
              <p className="text-sm text-[#6B6B6B]">{teamProgression.nextAction}</p>
            )}
            {teamProgression.currentLevel === 'solo' && (
              <Link
                href="/join/team-leader-guide"
                className="mt-3 flex items-center justify-center gap-2 w-full bg-[#C4785A] text-white py-2.5 rounded-xl text-sm font-medium active:scale-[0.98] transition-all"
              >
                <span>🚀</span>
                <span>Create Your Team</span>
              </Link>
            )}
            {teamProgression.currentLevel === 'team_leader' && (
              <Link
                href="/join/services-guide"
                className="mt-3 flex items-center justify-center gap-2 w-full bg-[#C4785A] text-white py-2.5 rounded-xl text-sm font-medium active:scale-[0.98] transition-all"
              >
                <span>➕</span>
                <span>Add Custom Services</span>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Greeting Card */}
      <div className="bg-gradient-to-br from-[#FFF8F5] to-[#FFF0EA] rounded-2xl p-5 border border-[#F5E6E0]">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-[#C4785A] flex items-center justify-center flex-shrink-0">
            <span className="text-lg">🎯</span>
          </div>
          <div>
            <p className="text-sm text-[#1A1A1A]">{greeting || 'Welcome to your Success Dashboard!'}</p>
          </div>
        </div>
      </div>

      {/* Unlocked: AI Chat */}
      {unlocked ? (
        <div className="bg-white rounded-2xl border border-[#EBEBEB] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#EBEBEB]">
            <h3 className="font-medium text-[#1A1A1A]">Chat with your Success Coach</h3>
            <p className="text-xs text-[#6B6B6B]">Ask anything about growing your business</p>
          </div>

          {/* Chat Messages */}
          <div
            ref={chatContainerRef}
            className="h-64 overflow-y-auto p-4 space-y-4"
          >
            {messages.length === 0 ? (
              <div className="text-center text-sm text-[#9B9B9B] py-8">
                <p>Ask me anything!</p>
                <p className="mt-2 text-xs">Try: &quot;How can I get more bookings?&quot;</p>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                      msg.role === 'user'
                        ? 'bg-[#1A1A1A] text-white'
                        : 'bg-[#F5F5F3] text-[#1A1A1A]'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            {isSending && (
              <div className="flex justify-start">
                <div className="bg-[#F5F5F3] rounded-2xl px-4 py-2.5">
                  <span className="flex gap-1">
                    <span className="w-2 h-2 bg-[#9B9B9B] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-[#9B9B9B] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-[#9B9B9B] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-[#EBEBEB]">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask your Success Coach..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-[#DEDEDE] text-sm focus:outline-none focus:border-[#C4785A]"
                disabled={isSending}
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isSending}
                className="px-4 py-2.5 bg-[#C4785A] text-white rounded-xl text-sm font-medium disabled:opacity-50 active:scale-[0.98] transition-all"
              >
                Send
              </button>
            </div>
          </form>

          {/* Quick Questions - dynamic based on progression */}
          <div className="px-4 pb-4 flex flex-wrap gap-2">
            {[
              'How can I get more bookings?',
              'Review my profile',
              ...(teamProgression?.currentLevel === 'team_leader'
                ? ['How do I add specialists to my team?']
                : teamProgression?.currentLevel === 'solo'
                ? ['How do I create a team?']
                : ['Show my stats']),
            ].map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                disabled={isSending}
                className="px-3 py-1.5 bg-[#F5F5F3] text-[#6B6B6B] rounded-full text-xs hover:bg-[#EBEBEB] transition-colors disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Locked State - Teaser Mode */
        <div className="bg-white rounded-2xl border border-[#EBEBEB] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#EBEBEB]">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-[#1A1A1A]">Success Coach</h3>
              <span className="px-2 py-0.5 bg-[#F5F5F3] text-[#6B6B6B] rounded-full text-xs">
                🔒 Locked
              </span>
            </div>
          </div>

          <div className="p-5 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#F5F5F3] flex items-center justify-center">
              <span className="text-3xl opacity-50">🤖</span>
            </div>
            <h4 className="font-medium text-[#1A1A1A] mb-2">
              Complete your first job to unlock!
            </h4>
            <p className="text-sm text-[#6B6B6B] mb-4">
              Your personal AI coach will help you get more bookings, analyze your profile,
              and provide personalized tips for success.
            </p>

            {/* Progress to unlock */}
            <div className="bg-[#FAFAF8] rounded-xl p-4 text-left">
              <p className="text-xs text-[#6B6B6B] mb-2">Profile Progress</p>
              <div className="h-2 bg-[#EBEBEB] rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-[#C4785A] rounded-full transition-all duration-500"
                  style={{ width: `${profileScore}%` }}
                />
              </div>
              <p className="text-sm">
                <span className="font-medium text-[#1A1A1A]">{profileScore}%</span>
                <span className="text-[#6B6B6B]"> ready for your first booking</span>
              </p>
            </div>
          </div>

          {/* What's included preview */}
          <div className="px-5 pb-5">
            <p className="text-xs text-[#6B6B6B] mb-3">What you&apos;ll unlock:</p>
            <div className="space-y-2">
              {[
                { icon: '📊', text: 'Profile view analytics' },
                { icon: '💬', text: 'AI-powered coaching chat' },
                { icon: '💡', text: 'Personalized growth tips' },
                { icon: '📈', text: 'Revenue insights' },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-2 text-sm text-[#9B9B9B]">
                  <span>{item.icon}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Profile Checklist */}
      <div className="bg-white rounded-2xl p-5 border border-[#EBEBEB]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-[#1A1A1A]">Profile Checklist</h3>
          <span className="text-xs text-[#6B6B6B]">{profileScore}% complete</span>
        </div>

        <div className="space-y-3">
          {[
            { id: 'photo', label: 'Add a profile photo', done: profileScore >= 20, priority: 'high' },
            { id: 'bio', label: 'Write your bio (100+ chars)', done: profileScore >= 40, priority: 'high' },
            { id: 'areas', label: 'Set service areas (3+)', done: profileScore >= 55, priority: 'medium' },
            { id: 'rate', label: 'Set your hourly rate', done: profileScore >= 65, priority: 'high' },
            { id: 'calendar', label: 'Sync your calendar', done: profileScore >= 75, priority: 'low' },
          ].map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center ${
                  item.done
                    ? 'bg-[#2E7D32] text-white'
                    : 'border-2 border-[#DEDEDE]'
                }`}
              >
                {item.done && (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className={`text-sm ${item.done ? 'text-[#9B9B9B] line-through' : 'text-[#1A1A1A]'}`}>
                {item.label}
              </span>
              {!item.done && item.priority === 'high' && (
                <span className="px-1.5 py-0.5 bg-[#FFF3E0] text-[#E65100] text-[10px] font-medium rounded">
                  Priority
                </span>
              )}
            </div>
          ))}
        </div>

        <Link
          href="/join/profile-guide"
          className="mt-4 flex items-center justify-center gap-2 w-full bg-[#F5F5F3] text-[#1A1A1A] py-3 rounded-xl text-sm font-medium active:scale-[0.98] transition-all"
        >
          <span>📖</span>
          <span>View Profile Guide</span>
        </Link>
      </div>
    </div>
  )
}
