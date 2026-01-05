'use client'

import { useState, useRef, useEffect } from 'react'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

type CleanerInfo = {
  id: string
  slug: string
  name: string
  hourlyRate: number
  serviceAreas: string[]
}

interface PublicChatWidgetProps {
  cleaner: CleanerInfo
}

export function PublicChatWidget({ cleaner }: PublicChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Show welcome message when opened for first time
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        role: 'assistant',
        content: `Hi! I'm ${cleaner.name}'s assistant. I can help you with:\n\n• Pricing and availability\n• Booking a cleaning\n• Questions about services\n\nHow can I help you today?`,
        timestamp: new Date(),
      }
      setMessages([welcomeMessage])
    }
  }, [isOpen, cleaner.name, messages.length])

  const handleSend = async () => {
    if (!input.trim() || sending) return

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

    try {
      const response = await fetch('/api/ai/public-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cleanerSlug: cleaner.slug,
          message: userMessage.content,
          history: messages.map(m => ({ role: m.role, content: m.content })),
        }),
      })

      const data = await response.json()

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.response || 'Sorry, I had trouble responding. Please try again.',
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, assistantMessage])
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

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 ${
          isOpen ? 'hidden' : 'flex'
        } items-center gap-2 px-5 py-3`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <span className="font-medium text-sm">Chat with {cleaner.name.split(' ')[0]}</span>
        {hasInteracted && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
        )}
      </button>

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/30">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-lg">AI</span>
                </div>
                <div>
                  <h3 className="font-semibold">{cleaner.name}&apos;s Assistant</h3>
                  <p className="text-xs text-white/80">Usually responds instantly</p>
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
                        ? 'bg-[#1A1A1A] text-white rounded-br-md'
                        : 'bg-white border border-[#EBEBEB] text-[#1A1A1A] rounded-bl-md'
                    }`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-[10px] bg-gradient-to-r from-purple-500 to-blue-500 text-white px-1.5 py-0.5 rounded-full font-medium">
                          AI
                        </span>
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-line">{msg.content}</p>
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
