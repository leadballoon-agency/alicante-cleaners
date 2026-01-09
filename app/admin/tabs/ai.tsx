'use client'

import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

type Message = {
  role: 'user' | 'assistant'
  content: string
  toolsUsed?: string[]
}

type Props = {
  adminName: string
}

const QUICK_ACTIONS = [
  { label: 'Morning briefing', prompt: 'Give me the morning briefing - what needs my attention today?' },
  { label: 'Pending cleaners', prompt: 'Show me all pending cleaner applications' },
  { label: 'Pending reviews', prompt: 'Show me reviews waiting for approval' },
  { label: "Today's bookings", prompt: "What bookings are scheduled for today?" },
  { label: 'Revenue this month', prompt: 'What is our revenue this month compared to last month?' },
  { label: 'Inactive owners', prompt: 'Which owners haven\'t booked in the last 90 days?' },
]

export default function AITab({ adminName }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showQuickActions, setShowQuickActions] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

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

  return (
    <div className="flex flex-col h-[calc(100vh-180px)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-[#1A1A1A]">Admin Assistant</h2>
          <p className="text-sm text-[#6B6B6B]">Ask me anything about your platform</p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="text-sm text-[#6B6B6B] hover:text-[#1A1A1A] px-3 py-1.5 rounded-lg border border-[#EBEBEB]"
          >
            Clear chat
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.length === 0 && showQuickActions ? (
          <div className="space-y-6">
            {/* Welcome */}
            <div className="bg-gradient-to-br from-[#1A1A1A] to-[#333] rounded-2xl p-5 text-white">
              <p className="text-white/70 text-sm mb-1">{getGreeting()}, {adminName.split(' ')[0]}</p>
              <p className="text-lg font-medium">How can I help you today?</p>
            </div>

            {/* Quick Actions */}
            <div>
              <p className="text-sm text-[#6B6B6B] mb-3">Quick actions</p>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_ACTIONS.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => sendMessage(action.prompt)}
                    className="text-left px-4 py-3 bg-white rounded-xl border border-[#EBEBEB] text-sm text-[#1A1A1A] hover:border-[#C4785A] active:scale-[0.98] transition-all"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Capabilities */}
            <div className="bg-[#F5F5F3] rounded-2xl p-4">
              <p className="text-sm font-medium text-[#1A1A1A] mb-2">I can help you with:</p>
              <ul className="text-sm text-[#6B6B6B] space-y-1">
                <li>• View and manage pending cleaner applications</li>
                <li>• Moderate and approve reviews</li>
                <li>• Check bookings, revenue, and platform stats</li>
                <li>• Find specific cleaners, owners, or bookings</li>
                <li>• Feature top-performing cleaners</li>
                <li>• Update cleaner profiles (phone, rate, areas)</li>
                <li>• Invite new cleaners via WhatsApp</li>
                <li>• Send in-app messages with auto-translation</li>
              </ul>
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
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
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
                          p: ({ children }) => <p className="mb-2 last:mb-0 text-[#1A1A1A]">{children}</p>,
                          ul: ({ children }) => <ul className="mb-2 pl-4 list-disc text-[#1A1A1A]">{children}</ul>,
                          ol: ({ children }) => <ol className="mb-2 pl-4 list-decimal text-[#1A1A1A]">{children}</ol>,
                          li: ({ children }) => <li className="mb-1 text-[#1A1A1A]">{children}</li>,
                          strong: ({ children }) => <strong className="font-semibold text-[#1A1A1A]">{children}</strong>,
                          h1: ({ children }) => <h1 className="text-lg font-bold mb-2 text-[#1A1A1A]">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-base font-bold mb-2 text-[#1A1A1A]">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-sm font-bold mb-1 text-[#1A1A1A]">{children}</h3>,
                          table: ({ children }) => (
                            <div className="overflow-x-auto my-3 -mx-2">
                              <table className="min-w-full text-sm border border-[#DEDEDE] rounded-lg overflow-hidden">{children}</table>
                            </div>
                          ),
                          thead: ({ children }) => <thead className="bg-[#F5F5F3] border-b border-[#DEDEDE]">{children}</thead>,
                          tbody: ({ children }) => <tbody className="divide-y divide-[#EBEBEB]">{children}</tbody>,
                          tr: ({ children }) => <tr className="hover:bg-[#FAFAF8]">{children}</tr>,
                          th: ({ children }) => <th className="px-3 py-2.5 text-left font-semibold text-[#1A1A1A] text-xs uppercase tracking-wide">{children}</th>,
                          td: ({ children }) => {
                            // Check if content is a phone number
                            const text = String(children)
                            const phoneMatch = text.match(/^\+?\d{10,15}$/)
                            if (phoneMatch) {
                              const phone = phoneMatch[0]
                              const cleanPhone = phone.replace(/\D/g, '')
                              return (
                                <td className="px-3 py-2.5 whitespace-nowrap">
                                  <div className="flex items-center gap-2">
                                    <a
                                      href={`tel:${phone}`}
                                      className="text-[#1A1A1A] hover:text-[#C4785A] transition-colors"
                                      title="Call"
                                    >
                                      {phone}
                                    </a>
                                    <a
                                      href={`https://wa.me/${cleanPhone}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[#25D366] hover:text-[#128C7E] transition-colors"
                                      title="WhatsApp"
                                    >
                                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                      </svg>
                                    </a>
                                  </div>
                                </td>
                              )
                            }
                            return <td className="px-3 py-2.5 text-[#1A1A1A] whitespace-nowrap">{children}</td>
                          },
                          code: ({ children }) => (
                            <code className="bg-[#F5F5F3] px-1.5 py-0.5 rounded text-sm font-mono text-[#C4785A]">
                              {children}
                            </code>
                          ),
                          a: ({ href, children }) => {
                            // Special styling for WhatsApp links
                            const isWhatsApp = href?.includes('wa.me')
                            if (isWhatsApp) {
                              return (
                                <a
                                  href={href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 bg-[#25D366] text-white px-3 py-1.5 rounded-lg font-medium hover:bg-[#128C7E] transition-colors text-sm no-underline"
                                >
                                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                  </svg>
                                  {children}
                                </a>
                              )
                            }
                            return (
                              <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#C4785A] hover:text-[#B56A4F] underline"
                              >
                                {children}
                              </a>
                            )
                          },
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                      {message.toolsUsed && message.toolsUsed.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-[#EBEBEB]">
                          <p className="text-xs text-[#9B9B9B]">
                            Used: {message.toolsUsed.map(t => t.replace(/_/g, ' ')).join(', ')}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-[#EBEBEB] rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-[#C4785A] rounded-full animate-pulse" />
                    <span className="w-2 h-2 bg-[#C4785A] rounded-full animate-pulse delay-75" />
                    <span className="w-2 h-2 bg-[#C4785A] rounded-full animate-pulse delay-150" />
                    <span className="text-sm text-[#6B6B6B] ml-2">Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="mt-auto pt-4 border-t border-[#EBEBEB]">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything..."
            rows={1}
            className="flex-1 px-4 py-3 rounded-xl border border-[#DEDEDE] text-sm focus:outline-none focus:border-[#1A1A1A] resize-none"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-4 py-3 bg-[#1A1A1A] text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-transform"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-[#9B9B9B] mt-2 text-center">
          AI can make mistakes. Verify important actions.
        </p>
      </form>
    </div>
  )
}
