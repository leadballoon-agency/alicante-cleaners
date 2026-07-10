'use client'

import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { formatMadridDate } from '@/lib/dates'
import { pushDataLayerEvent } from '@/lib/analytics/datalayer'

type BookingSummary = {
  service: string
  date: string
  time: string
  price: number
  cleaner: { name: string | null }
  property: { name: string; address: string }
}

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  easterEgg?: 'alan' | 'amanda' // 🎭 Easter egg character!
  booking?: BookingSummary // Set when the AI booked directly for a returning owner
}

type CleanerInfo = {
  id: string
  slug: string
  name: string
  hourlyRate: number
  serviceAreas: string[]
  teamLeader?: boolean
}

interface PublicChatWidgetProps {
  cleaner: CleanerInfo
  // Tailwind `bottom-*` class for the floating trigger/modal position.
  // The booking flow has a full-width sticky "Continue" button at the
  // bottom of each step, so it passes a taller offset here to keep the
  // chat bubble from sitting on top of it on small viewports.
  bottomOffsetClassName?: string
}

// Generate or retrieve session ID for conversation tracking
function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  let sessionId = sessionStorage.getItem('chat_session_id')
  if (!sessionId) {
    sessionId = `chat_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    sessionStorage.setItem('chat_session_id', sessionId)
  }
  return sessionId
}

export function PublicChatWidget({ cleaner, bottomOffsetClassName = 'bottom-6' }: PublicChatWidgetProps) {
  const searchParams = useSearchParams()
  const applicantId = searchParams.get('applicant')
  const source = searchParams.get('source') // Track where visitor came from (e.g., homepage-translation-cta)
  const isApplicant = Boolean(applicantId)

  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)
  const [sessionId, setSessionId] = useState<string>('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Initialize session ID on mount
  useEffect(() => {
    setSessionId(getSessionId())
  }, [])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-open chat for applicants
  useEffect(() => {
    if (isApplicant && !isOpen) {
      setIsOpen(true)
    }
  }, [isApplicant, isOpen])

  // Show welcome message when opened for first time
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeContent = isApplicant
        ? `Hi! I'm ${cleaner.name}'s assistant. ${cleaner.name} asked me to chat with you about joining the team!\n\nI'd love to learn a bit about your cleaning experience. What brings you to VillaCare?`
        : `Hi! I'm ${cleaner.name}'s assistant. I can help you with:\n\n• Pricing and availability\n• Booking a cleaning\n• Questions about services\n\nHow can I help you today?`

      const welcomeMessage: Message = {
        id: 'welcome',
        role: 'assistant',
        content: welcomeContent,
        timestamp: new Date(),
      }
      setMessages([welcomeMessage])
    }
  }, [isOpen, cleaner.name, messages.length, isApplicant])

  const handleSend = async () => {
    if (!input.trim() || sending) return

    // Whether this is the very first message the visitor has sent in this
    // widget session (welcome message is assistant-authored, so no prior
    // 'user' message means this is it).
    const isFirstUserMessage = !messages.some(m => m.role === 'user')

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setSending(true)
    setHasInteracted(true)

    if (isFirstUserMessage) {
      pushDataLayerEvent('chat_started', { cleaner_slug: cleaner.slug })
    }

    try {
      // Use different API endpoint for applicants vs regular visitors
      const apiEndpoint = isApplicant ? '/api/ai/applicant-chat' : '/api/ai/public-chat'
      const requestBody = isApplicant
        ? {
            teamLeaderSlug: cleaner.slug,
            applicantId,
            message: userMessage.content,
            history: messages.map(m => ({ role: m.role, content: m.content })),
            sessionId,
          }
        : {
            cleanerSlug: cleaner.slug,
            message: userMessage.content,
            history: messages.map(m => ({ role: m.role, content: m.content })),
            sessionId,
            source: source || undefined, // Pass source for conversion tracking
          }

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.response || 'Sorry, I had trouble responding. Please try again.',
        timestamp: new Date(),
        easterEgg: data.easterEgg, // 🎭 Alan or Amanda appeared!
        booking: data.bookingCreated ? data.booking : undefined, // Booked directly for a returning owner
      }

      setMessages(prev => [...prev, assistantMessage])

      if (data.bookingCreated && data.booking) {
        pushDataLayerEvent('booking_created', {
          service: data.booking.service,
          value: data.booking.price,
          currency: 'EUR',
          cleaner_slug: cleaner.slug,
          source: 'ai_assistant',
        })
      }

      if (data.magicLinkCreated) {
        pushDataLayerEvent('magic_link_created', { cleaner_slug: cleaner.slug })
      }
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setSending(false)
    }
  }

  const buttonText = isApplicant
    ? `Chat with ${cleaner.name.split(' ')[0]}'s Team`
    : `Chat with ${cleaner.name.split(' ')[0]}`

  const headerTitle = isApplicant
    ? 'Team Application Chat'
    : `${cleaner.name}'s Assistant`

  const headerSubtitle = isApplicant
    ? `Chatting about joining ${cleaner.name.split(' ')[0]}'s team`
    : 'Usually responds instantly'

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed ${bottomOffsetClassName} right-6 z-50 ${
          isApplicant ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-[#C4785A] hover:bg-[#B56A4F]'
        } text-white rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 ${
          isOpen ? 'hidden' : 'flex'
        } items-center gap-2 px-5 py-3`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <span className="font-medium text-sm">{buttonText}</span>
        {hasInteracted && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
        )}
      </button>

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/30">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className={`${
              isApplicant ? 'bg-emerald-500' : 'bg-[#C4785A]'
            } text-white px-4 py-3 flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-lg">{isApplicant ? '👋' : '💬'}</span>
                </div>
                <div>
                  <h3 className="font-semibold">{headerTitle}</h3>
                  <p className="text-xs text-white/80">{headerSubtitle}</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white p-1"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FAFAF8]">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                      msg.role === 'user'
                        ? 'bg-[#C4785A] text-white rounded-br-md'
                        : msg.easterEgg === 'alan'
                          ? 'bg-blue-50 border-2 border-blue-300 text-[#1A1A1A] rounded-bl-md'
                          : msg.easterEgg === 'amanda'
                            ? 'bg-pink-50 border-2 border-pink-300 text-[#1A1A1A] rounded-bl-md'
                            : 'bg-white border border-[#EBEBEB] text-[#1A1A1A] rounded-bl-md'
                    }`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-1 mb-1">
                        {msg.easterEgg === 'alan' ? (
                          <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                            🎤 Alan Carr
                          </span>
                        ) : msg.easterEgg === 'amanda' ? (
                          <span className="text-[10px] bg-pink-500 text-white px-1.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                            💕 Amanda Holden
                          </span>
                        ) : (
                          <span className="text-[10px] bg-[#C4785A] text-white px-1.5 py-0.5 rounded-full font-medium">
                            Assistant
                          </span>
                        )}
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-line">{msg.content}</p>
                    {msg.booking && (
                      <div className="mt-3 bg-[#FAFAF8] border border-[#EBEBEB] rounded-xl p-3 space-y-1">
                        <div className="flex items-center gap-1.5 text-[#2E7D32] text-xs font-semibold mb-1.5">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                          Booking requested
                        </div>
                        <p className="text-sm font-medium text-[#1A1A1A]">{msg.booking.service}</p>
                        <p className="text-xs text-[#6B6B6B]">{msg.booking.property.name}</p>
                        <p className="text-xs text-[#6B6B6B]">
                          {formatMadridDate(msg.booking.date, {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                          })}{' '}
                          at {msg.booking.time}
                        </p>
                        <p className="text-sm font-semibold text-[#C4785A] pt-0.5">€{msg.booking.price}</p>
                        <p className="text-[11px] text-[#9B9B9B] pt-1.5 leading-snug">
                          {msg.booking.cleaner.name || 'Your cleaner'} will confirm shortly — you&apos;ll get an email.
                        </p>
                        <a
                          href="/owner/dashboard"
                          className="inline-block text-xs font-medium text-[#1A1A1A] underline pt-1"
                        >
                          View in your dashboard →
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="bg-white border border-[#EBEBEB] rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-[#9B9B9B] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-[#9B9B9B] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-[#9B9B9B] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-[#EBEBEB] bg-white">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-[#DEDEDE] focus:outline-none focus:border-[#1A1A1A] text-sm"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || sending}
                  className="px-4 py-2.5 bg-[#1A1A1A] text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Send
                </button>
              </div>
              <p className="text-[10px] text-[#9B9B9B] text-center mt-2">
                AI assistant powered by VillaCare
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
