'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: Date
}

// Skeleton loading for action cards
function SkeletonCards() {
  return (
    <div className="grid grid-cols-2 gap-2 mt-3">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="flex items-center gap-2 p-3 bg-gradient-to-br from-[#FAFAF8] to-[#F5F5F3] border border-[#EBEBEB] rounded-xl animate-pulse"
        >
          <div className="w-5 h-5 bg-[#EBEBEB] rounded" />
          <div className="h-4 bg-[#EBEBEB] rounded w-16" />
        </div>
      ))}
    </div>
  )
}

// Render action cards: [[emoji|label|url]]
function renderActionCards(content: string): React.ReactNode {
  // Check if content has action cards
  const cardPattern = /\[\[([^|]+)\|([^|]+)\|([^\]]+)\]\]/g
  const hasCards = cardPattern.test(content)

  if (!hasCards) return null

  const cards: { emoji: string; label: string; url: string }[] = []
  let match
  const regex = /\[\[([^|]+)\|([^|]+)\|([^\]]+)\]\]/g
  while ((match = regex.exec(content)) !== null) {
    cards.push({ emoji: match[1], label: match[2], url: match[3] })
  }

  if (cards.length === 0) return null

  return (
    <div className="grid grid-cols-2 gap-2 mt-3">
      {cards.map((card, i) => (
        <a
          key={i}
          href={card.url}
          className="flex items-center gap-2 p-3 bg-gradient-to-br from-[#FAFAF8] to-[#F5F5F3] border border-[#EBEBEB] rounded-xl hover:border-[#C4785A] hover:shadow-sm transition-all group"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-lg">{card.emoji}</span>
          <span className="text-sm font-medium text-[#1A1A1A] group-hover:text-[#C4785A]">{card.label}</span>
        </a>
      ))}
    </div>
  )
}

// Simple markdown renderer for links and bold
function renderMessageContent(content: string): React.ReactNode {
  // Remove action cards from text content (they're rendered separately)
  const textContent = content.replace(/\[\[[^\]]+\]\]/g, '').trim()

  // Split by markdown patterns
  const parts = textContent.split(/(\[.*?\]\(.*?\)|\*\*.*?\*\*|→)/g)

  const textElements = parts.map((part, i) => {
    // Link: [text](url)
    const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/)
    if (linkMatch) {
      return (
        <a
          key={i}
          href={linkMatch[2]}
          className="text-[#C4785A] underline hover:text-[#A66347] font-medium"
          onClick={(e) => {
            e.stopPropagation()
          }}
        >
          {linkMatch[1]}
        </a>
      )
    }

    // Bold: **text**
    const boldMatch = part.match(/\*\*(.*?)\*\*/)
    if (boldMatch) {
      return <strong key={i} className="font-semibold">{boldMatch[1]}</strong>
    }

    // Arrow styling
    if (part === '→') {
      return <span key={i} className="text-[#C4785A]">→</span>
    }

    return part
  })

  const actionCards = renderActionCards(content)

  return (
    <>
      {textElements}
      {actionCards}
    </>
  )
}

// Generate or retrieve session ID for anonymous users
function getSessionId(): string {
  if (typeof window === 'undefined') return 'server'

  let sessionId = localStorage.getItem('villacare_support_session')
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
    localStorage.setItem('villacare_support_session', sessionId)
  }
  return sessionId
}

export default function FeedbackWidget() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [showPulse, setShowPulse] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const lastReadRef = useRef<Date>(new Date())
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Get user type from session
  const userType = session?.user?.role === 'CLEANER'
    ? 'cleaner'
    : session?.user?.role === 'OWNER' || session?.user?.role === 'ADMIN'
      ? 'owner'
      : 'visitor'

  const userName = session?.user?.name?.split(' ')[0] || ''
  const userLang = (session?.user as { preferredLanguage?: string })?.preferredLanguage || 'en'

  // Localized greetings
  const greetings: Record<string, { hi: string; quickAccess: string; askAnything: string; whatHelp: string; howHelp: string; welcome: string; imOwner: string; imCleaner: string; askServices: string }> = {
    en: { hi: 'Hi', quickAccess: 'Quick access:', askAnything: 'Or ask me anything about the platform!', whatHelp: 'What can I help you with?', howHelp: 'How can I help?', welcome: 'Welcome to VillaCare.', imOwner: "I'm a villa owner", imCleaner: "I'm a cleaner", askServices: 'Or just ask me anything about our services!' },
    es: { hi: 'Hola', quickAccess: 'Acceso rápido:', askAnything: '¡O pregúntame cualquier cosa sobre la plataforma!', whatHelp: '¿En qué puedo ayudarte?', howHelp: '¿Cómo puedo ayudar?', welcome: 'Bienvenido a VillaCare.', imOwner: 'Soy propietario', imCleaner: 'Soy limpiador/a', askServices: '¡O pregúntame sobre nuestros servicios!' },
    de: { hi: 'Hallo', quickAccess: 'Schnellzugriff:', askAnything: 'Oder frag mich alles über die Plattform!', whatHelp: 'Wie kann ich dir helfen?', howHelp: 'Wie kann ich helfen?', welcome: 'Willkommen bei VillaCare.', imOwner: 'Ich bin Villenbesitzer', imCleaner: 'Ich bin Reinigungskraft', askServices: 'Oder frag mich einfach zu unseren Services!' },
    fr: { hi: 'Salut', quickAccess: 'Accès rapide:', askAnything: 'Ou demande-moi ce que tu veux sur la plateforme!', whatHelp: 'Comment puis-je vous aider?', howHelp: 'Comment puis-je aider?', welcome: 'Bienvenue sur VillaCare.', imOwner: 'Je suis propriétaire', imCleaner: 'Je suis agent de nettoyage', askServices: 'Ou pose-moi des questions sur nos services!' },
    nl: { hi: 'Hoi', quickAccess: 'Snelle toegang:', askAnything: 'Of vraag me alles over het platform!', whatHelp: 'Waarmee kan ik je helpen?', howHelp: 'Hoe kan ik helpen?', welcome: 'Welkom bij VillaCare.', imOwner: 'Ik ben villa-eigenaar', imCleaner: 'Ik ben schoonmaker', askServices: 'Of vraag me iets over onze diensten!' },
    it: { hi: 'Ciao', quickAccess: 'Accesso rapido:', askAnything: 'O chiedimi qualsiasi cosa sulla piattaforma!', whatHelp: 'Come posso aiutarti?', howHelp: 'Come posso aiutare?', welcome: 'Benvenuto su VillaCare.', imOwner: 'Sono proprietario', imCleaner: 'Sono addetto pulizie', askServices: 'O chiedimi dei nostri servizi!' },
    pt: { hi: 'Olá', quickAccess: 'Acesso rápido:', askAnything: 'Ou pergunte-me qualquer coisa sobre a plataforma!', whatHelp: 'Como posso ajudar?', howHelp: 'Como posso ajudar?', welcome: 'Bem-vindo ao VillaCare.', imOwner: 'Sou proprietário', imCleaner: 'Sou profissional de limpeza', askServices: 'Ou pergunte sobre nossos serviços!' },
  }
  const t = greetings[userLang] || greetings.en

  // Hide on admin, onboarding, dashboard, and cleaner profile pages (they have their own chat/nav widgets)
  const isAdminPage = pathname?.startsWith('/admin') ?? false
  const isOnboardingPage = pathname?.startsWith('/onboarding') ?? false
  const isDashboardPage = pathname?.startsWith('/dashboard') ?? false
  const isOwnerDashboardPage = pathname?.startsWith('/owner/dashboard') ?? false

  // Cleaner profiles are single-segment paths like /clara, /maria that aren't known routes
  const isCleanerProfilePage = (() => {
    if (!pathname) return false
    const segments = pathname.split('/').filter(Boolean)
    if (segments.length !== 1) return false
    const knownRoots = ['about', 'login', 'join', 'dashboard', 'owner', 'admin', 'onboarding', 'privacy', 'terms', 'guide', 'onboard', 'features']
    return !knownRoots.includes(segments[0])
  })()

  // Mount effect
  useEffect(() => {
    setMounted(true)
  }, [])

  // Pulse animation
  useEffect(() => {
    if (!mounted || isOpen) return

    const timeout = setTimeout(() => setShowPulse(true), 2000)
    const interval = setInterval(() => {
      setShowPulse(true)
      setTimeout(() => setShowPulse(false), 2000)
    }, 12000)

    return () => {
      clearTimeout(timeout)
      clearInterval(interval)
    }
  }, [mounted, isOpen])

  // Proactive nudge - send personalized message after delay if no conversation
  useEffect(() => {
    if (!mounted || isOpen || conversationId) return

    // Check if we already nudged this session
    const nudgeKey = `villacare_nudged_${getSessionId()}`
    if (typeof window !== 'undefined' && localStorage.getItem(nudgeKey)) return

    const nudgeDelay = 20000 // 20 seconds

    const timer = setTimeout(async () => {
      // Double-check no conversation started
      if (conversationId || isOpen) return

      // Generate personalized nudge based on user type
      let nudgeMessage = ''

      if (session?.user?.role === 'ADMIN') {
        nudgeMessage = `Hey ${userName || 'there'}! 👋 Need quick access?

[[📊|Dashboard|/admin]][[💬|Support|/admin?tab=support]]

Or ask me anything about the platform!`
      } else if (userType === 'cleaner') {
        nudgeMessage = `${t.hi} ${userName || 'there'}! 👋 ${t.howHelp}

[[📅|My bookings|/dashboard?tab=bookings]][[📆|Availability|/dashboard?tab=schedule]]`
      } else if (userType === 'owner') {
        nudgeMessage = `${t.hi} ${userName || 'there'}! 👋 ${t.whatHelp}

[[📅|Book a clean|/owner/dashboard?tab=bookings]][[💬|Messages|/owner/dashboard?tab=messages]]`
      } else {
        // Visitor - help them figure out what they need
        nudgeMessage = `${t.hi}! 👋 ${t.welcome}

[[🏡|${t.imOwner}|/login]][[🧹|${t.imCleaner}|/onboarding/cleaner]]

${t.askServices}`
      }

      // Create the nudge message locally (shows as unread)
      const nudge: Message = {
        id: `nudge_${Date.now()}`,
        role: 'assistant',
        content: nudgeMessage,
        createdAt: new Date(),
      }

      setMessages([nudge])
      setUnreadCount(1)

      // Mark as nudged so we don't do it again
      if (typeof window !== 'undefined') {
        localStorage.setItem(nudgeKey, 'true')
      }
    }, nudgeDelay)

    return () => clearTimeout(timer)
  }, [mounted, isOpen, conversationId, session, userType, userName, t])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Load existing conversation when chat opens
  useEffect(() => {
    if (!mounted || !isOpen) return

    const loadConversation = async () => {
      try {
        const sessionId = getSessionId()
        const response = await fetch(`/api/support/conversations?sessionId=${sessionId}`)
        if (response.ok) {
          const data = await response.json()
          if (data.conversation) {
            setConversationId(data.conversation.id)
            setMessages(data.messages.map((m: Message) => ({
              ...m,
              createdAt: new Date(m.createdAt),
            })))
          }
        }
      } catch (error) {
        console.error('Failed to load conversation:', error)
      }
    }

    loadConversation()
  }, [mounted, isOpen])

  // Mark as read when chat opens
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0)
      lastReadRef.current = new Date()
    }
  }, [isOpen])

  // Get greeting based on user type
  const getGreeting = useCallback(() => {
    // Admin gets quick links (always English for admin)
    if (session?.user?.role === 'ADMIN') {
      return `Hey ${userName || 'there'}! 👋 Quick access:

[[📊|Dashboard|/admin]][[💬|Support|/admin?tab=support]][[👥|Cleaners|/admin?tab=cleaners]][[⭐|Reviews|/admin?tab=reviews]]

Or ask me anything about the platform!`
    } else if (userType === 'owner') {
      return userName
        ? `${t.hi} ${userName}! 👋 ${t.whatHelp}

[[📅|Book a clean|/owner/dashboard?tab=bookings]][[🏠|My villas|/owner/dashboard?tab=villas]][[💬|Messages|/owner/dashboard?tab=messages]][[📋|Bookings|/owner/dashboard?tab=bookings]]`
        : `${t.hi}! 👋 ${t.whatHelp}`
    } else if (userType === 'cleaner') {
      return userName
        ? `${t.hi} ${userName}! 👋 ${t.howHelp}

[[📅|My bookings|/dashboard?tab=bookings]][[📆|Availability|/dashboard?tab=schedule]][[👤|My profile|/dashboard?tab=profile]][[💬|Messages|/dashboard?tab=messages]]`
        : `${t.hi}! 👋 ${t.howHelp}`
    } else {
      return `${t.hi}! 👋 ${t.welcome}

[[🏡|${t.imOwner}|/login]][[🧹|${t.imCleaner}|/onboarding/cleaner]]

${t.askServices}`
    }
  }, [session, userType, userName, t])

  // Send message
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: input.trim(),
      createdAt: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/support/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          conversationId,
          sessionId: getSessionId(),
          page: pathname || '/',
          userType,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setConversationId(data.conversationId)

        const assistantMessage: Message = {
          id: `assistant_${Date.now()}`,
          role: 'assistant',
          content: data.response,
          createdAt: new Date(),
        }

        setMessages(prev => [...prev, assistantMessage])
      } else {
        throw new Error('Failed to send message')
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      setMessages(prev => [...prev, {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: "I'm sorry, I couldn't process your message. Please try again.",
        createdAt: new Date(),
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  const handleOpen = () => {
    setIsOpen(true)
    // Add greeting if no messages
    if (messages.length === 0) {
      setMessages([{
        id: 'greeting',
        role: 'assistant',
        content: getGreeting(),
        createdAt: new Date(),
      }])
    }
  }

  // Don't render on admin/onboarding/dashboard/owner dashboard/cleaner profile pages or until mounted
  if (!mounted || isAdminPage || isOnboardingPage || isDashboardPage || isOwnerDashboardPage || isCleanerProfilePage) return null

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={handleOpen}
        className={`fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-[#C4785A] to-[#A66347] text-white shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 ${
          isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
        }`}
        aria-label="Get help"
      >
        {/* Pulse ring */}
        {showPulse && (
          <span className="absolute inset-0 rounded-full bg-[#C4785A] animate-ping opacity-30" />
        )}

        {/* Notification badge - only shows when there are unread messages */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg animate-bounce">
            <span className="text-xs font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span>
          </span>
        )}

        {/* Villa icon */}
        <svg
          width="26"
          height="26"
          viewBox="0 0 32 32"
          fill="none"
        >
          {/* Villa roof */}
          <path
            d="M16 4L4 14h4v12h16V14h4L16 4z"
            fill="currentColor"
            opacity="0.9"
          />
          {/* Door */}
          <rect x="13" y="18" width="6" height="8" rx="1" fill="#A66347" />
          {/* Window left */}
          <rect x="7" y="16" width="4" height="4" rx="0.5" fill="#FFF8F5" opacity="0.8" />
          {/* Window right */}
          <rect x="21" y="16" width="4" height="4" rx="0.5" fill="#FFF8F5" opacity="0.8" />
        </svg>
      </button>

      {/* Modal Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleClose}
      />

      {/* Chat Window */}
      <div
        className={`fixed bottom-6 right-6 z-50 w-[calc(100vw-48px)] max-w-[400px] h-[min(600px,calc(100vh-120px))] transition-all duration-300 ease-out ${
          isOpen
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-4 scale-95 pointer-events-none'
        }`}
      >
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden h-full flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-br from-[#C4785A] to-[#A66347] px-5 py-4 text-white flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-xl">💬</span>
                </div>
                <div>
                  <h2 className="font-semibold text-lg">VillaCare Support</h2>
                  <p className="text-white/70 text-sm">
                    {userType === 'visitor' ? 'How can we help?' : `Hi ${userName || 'there'}!`}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                aria-label="Close chat"
              >
                <span className="text-lg">×</span>
              </button>
            </div>

            {/* User context badge */}
            {session?.user && (
              <div className="mt-3 flex items-center gap-2">
                <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs">
                  {session.user.role === 'ADMIN' ? '👔 Admin' : userType === 'cleaner' ? '🧹 Cleaner' : '🏡 Owner'}
                </span>
                <span className="text-white/60 text-xs">
                  Logged in as {session.user.email}
                </span>
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FAFAF8]">
            {/* Skeleton loading state - shows briefly before greeting */}
            {messages.length === 0 && !isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[85%] px-4 py-3 rounded-2xl bg-white border border-[#EBEBEB] rounded-bl-md shadow-sm">
                  <div className="space-y-2 animate-pulse">
                    <div className="h-4 bg-[#EBEBEB] rounded w-32" />
                    <div className="h-3 bg-[#EBEBEB] rounded w-48" />
                  </div>
                  <SkeletonCards />
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-4 py-3 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-[#1A1A1A] text-white rounded-br-md'
                      : 'bg-white border border-[#EBEBEB] text-[#1A1A1A] rounded-bl-md shadow-sm'
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap">{renderMessageContent(message.content)}</div>
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-[#EBEBEB] px-4 py-3 rounded-2xl rounded-bl-md shadow-sm">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-[#C4785A] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-[#C4785A] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-[#C4785A] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-[#EBEBEB] bg-white flex-shrink-0">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-1 px-4 py-3 rounded-xl border border-[#DEDEDE] text-base focus:outline-none focus:border-[#C4785A] transition-colors disabled:opacity-50"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#C4785A] to-[#A66347] text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                aria-label="Send message"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>

            <p className="text-xs text-[#9B9B9B] text-center mt-2">
              Powered by AI · Your feedback helps us improve
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
