'use client'

import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

type Message = {
  role: 'user' | 'assistant'
  content: string
  toolsUsed?: string[]
}

interface Props {
  isOpen: boolean
  onClose: () => void
  adminName: string
  // Optional context from selected card
  initialContext?: {
    type: string
    id: string
    summary: string
  } | null
}

const QUICK_ACTIONS = [
  { label: 'Morning briefing', prompt: 'Give me the morning briefing - what needs my attention today?' },
  { label: 'Pending cleaners', prompt: 'Show me all pending cleaner applications' },
  { label: 'Pending reviews', prompt: 'Show me reviews waiting for approval' },
  { label: "Today's bookings", prompt: "What bookings are scheduled for today?" },
]

export default function AdminAIPanel({ isOpen, onClose, adminName, initialContext }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showQuickActions, setShowQuickActions] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // Touch handling for swipe to close
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchDelta, setTouchDelta] = useState(0)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen])

  // Handle initial context from selected card
  useEffect(() => {
    if (isOpen && initialContext && messages.length === 0) {
      const contextMessage = `Tell me more about this ${initialContext.type}: ${initialContext.summary}`
      sendMessage(contextMessage)
    }
  }, [isOpen, initialContext]) // eslint-disable-line react-hooks/exhaustive-deps

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return

    setShowQuickActions(false)
    const userMessage: Message = { role: 'user', content: content.trim() }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/admin/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response')
      }
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message,
        toolsUsed: data.toolsUsed,
      }
      setMessages([...newMessages, assistantMessage])
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: `Sorry, I encountered an error: ${errorMessage}`,
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const clearChat = () => {
    setMessages([])
    setShowQuickActions(true)
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  // Touch handlers for swipe to close
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null) return
    const delta = e.touches[0].clientX - touchStart
    // Only allow swiping right (positive delta)
    if (delta > 0) {
      setTouchDelta(delta)
    }
  }

  const handleTouchEnd = () => {
    // If swiped more than 100px, close the panel
    if (touchDelta > 100) {
      onClose()
    }
    setTouchStart(null)
    setTouchDelta(0)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        style={{ opacity: isOpen ? Math.max(0, 1 - (touchDelta / 400)) : 0 }}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={`fixed top-0 right-0 bottom-0 w-[85vw] max-w-[400px] bg-[#FAFAF8] z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-out ${
          !isOpen && touchDelta === 0 ? 'pointer-events-none' : ''
        }`}
        style={{
          transform: isOpen
            ? `translateX(${touchDelta}px)`
            : 'translateX(100%)',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#EBEBEB] bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1A1A1A] to-[#333] flex items-center justify-center">
              <span className="text-white text-lg">AI</span>
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#1A1A1A]">Admin Assistant</h2>
              <p className="text-xs text-[#6B6B6B]">Your AI assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                className="text-xs text-[#6B6B6B] hover:text-[#1A1A1A] px-2 py-1 rounded-lg border border-[#EBEBEB]"
              >
                Clear
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-[#F5F5F3] flex items-center justify-center text-[#6B6B6B]"
            >
              <span className="text-lg">&times;</span>
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && showQuickActions ? (
            <div className="space-y-4">
              {/* Welcome */}
              <div className="bg-gradient-to-br from-[#1A1A1A] to-[#333] rounded-2xl p-4 text-white">
                <p className="text-white/70 text-xs mb-1">{getGreeting()}, {adminName.split(' ')[0]}</p>
                <p className="text-sm font-medium">How can I help?</p>
              </div>

              {/* Quick Actions */}
              <div>
                <p className="text-xs text-[#6B6B6B] mb-2">Quick actions</p>
                <div className="space-y-2">
                  {QUICK_ACTIONS.map((action, idx) => (
                    <button
                      key={idx}
                      onClick={() => sendMessage(action.prompt)}
                      className="w-full text-left px-3 py-2.5 bg-white rounded-xl border border-[#EBEBEB] text-sm text-[#1A1A1A] hover:border-[#C4785A] active:scale-[0.98] transition-all"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, idx) => (
                <div
                  key={idx}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[90%] rounded-2xl px-3 py-2.5 ${
                      message.role === 'user'
                        ? 'bg-[#1A1A1A] text-white'
                        : 'bg-white border border-[#EBEBEB]'
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({ children }) => <p className="mb-2 last:mb-0 text-sm text-[#1A1A1A]">{children}</p>,
                            ul: ({ children }) => <ul className="mb-2 pl-4 list-disc text-sm text-[#1A1A1A]">{children}</ul>,
                            ol: ({ children }) => <ol className="mb-2 pl-4 list-decimal text-sm text-[#1A1A1A]">{children}</ol>,
                            li: ({ children }) => <li className="mb-1 text-sm text-[#1A1A1A]">{children}</li>,
                            strong: ({ children }) => <strong className="font-semibold text-[#1A1A1A]">{children}</strong>,
                            h1: ({ children }) => <h1 className="text-base font-bold mb-2 text-[#1A1A1A]">{children}</h1>,
                            h2: ({ children }) => <h2 className="text-sm font-bold mb-2 text-[#1A1A1A]">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-xs font-bold mb-1 text-[#1A1A1A]">{children}</h3>,
                            table: ({ children }) => (
                              <div className="overflow-x-auto my-2 -mx-1">
                                <table className="min-w-full text-xs border border-[#DEDEDE] rounded-lg overflow-hidden">{children}</table>
                              </div>
                            ),
                            thead: ({ children }) => <thead className="bg-[#F5F5F3] border-b border-[#DEDEDE]">{children}</thead>,
                            tbody: ({ children }) => <tbody className="divide-y divide-[#EBEBEB]">{children}</tbody>,
                            tr: ({ children }) => <tr className="hover:bg-[#FAFAF8]">{children}</tr>,
                            th: ({ children }) => <th className="px-2 py-1.5 text-left font-semibold text-[#1A1A1A] text-xs">{children}</th>,
                            td: ({ children }) => <td className="px-2 py-1.5 text-[#1A1A1A] text-xs">{children}</td>,
                            code: ({ children }) => (
                              <code className="bg-[#F5F5F3] px-1 py-0.5 rounded text-xs font-mono text-[#C4785A]">
                                {children}
                              </code>
                            ),
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm">{message.content}</p>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-[#EBEBEB] rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-[#C4785A] animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 rounded-full bg-[#C4785A] animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 rounded-full bg-[#C4785A] animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 pb-safe border-t border-[#DEDEDE] bg-[#F5F5F3]">
          <div className="flex items-end gap-2 bg-white rounded-xl border-2 border-[#1A1A1A]/20 focus-within:border-[#1A1A1A] transition-colors p-1">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message here..."
              className="flex-1 px-3 py-2.5 rounded-lg bg-transparent focus:outline-none resize-none text-sm placeholder:text-[#9B9B9B]"
              rows={1}
              style={{ maxHeight: '100px' }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="w-10 h-10 rounded-lg bg-[#1A1A1A] text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all shrink-0"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
