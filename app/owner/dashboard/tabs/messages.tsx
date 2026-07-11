'use client'

import { Fragment, useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { formatMessageClock, formatDaySeparator, messageDayKey } from '@/lib/message-time'
import { REACTION_EMOJIS, groupReactions, type MessageReactionView } from '@/lib/message-reactions'

type Message = {
  id: string
  text: string
  originalText: string
  translatedText: string | null
  originalLang: string
  translatedLang: string | null
  isMine: boolean
  senderRole: 'OWNER' | 'CLEANER'
  isRead: boolean
  isAIGenerated?: boolean
  createdAt: string
  // Optional: not every code path that builds a Message includes it
  // (untyped res.json() shapes) — always default to [] before use.
  reactions?: MessageReactionView[]
}

type Conversation = {
  id: string
  otherParty: {
    id: string
    name: string
    image: string | null
    role: 'CLEANER'
  }
  property: { name: string; address: string } | null
  lastMessage: Message | null
  updatedAt: string
}

type ConversationDetail = {
  id: string
  otherParty: {
    id: string
    name: string
    image: string | null
    role: 'CLEANER'
  }
  property: { name: string; address: string } | null
  myRole: 'OWNER'
}

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  es: 'Spanish',
  de: 'German',
  fr: 'French',
  nl: 'Dutch',
  it: 'Italian',
  pt: 'Portuguese',
}

export default function MessagesTab() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<ConversationDetail | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showOriginal, setShowOriginal] = useState<Record<string, boolean>>({})
  const [copied, setCopied] = useState<string | null>(null)
  const [openReactionPicker, setOpenReactionPicker] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(messageId)
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Fetch conversations
  useEffect(() => {
    fetchConversations()
  }, [])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Poll for new messages when in a conversation
  useEffect(() => {
    if (!selectedConversation) return

    const interval = setInterval(() => {
      fetchMessages(selectedConversation.id)
    }, 5000) // Poll every 5 seconds

    return () => clearInterval(interval)
  }, [selectedConversation])

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/messages/conversations')
      const data = await res.json()
      setConversations(data.conversations || [])
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (conversationId: string) => {
    try {
      const res = await fetch(`/api/messages/conversations/${conversationId}`)
      const data = await res.json()
      setSelectedConversation(data.conversation)
      setMessages(data.messages || [])
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const handleSelectConversation = async (conversationId: string) => {
    setLoading(true)
    await fetchMessages(conversationId)
    setLoading(false)
  }

  const handleSendMessage = async () => {
    if (!selectedConversation || !newMessage.trim()) return

    setSending(true)
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          text: newMessage.trim(),
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setMessages((prev) => [...prev, data.message])
        setNewMessage('')
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  const toggleShowOriginal = (messageId: string) => {
    setShowOriginal((prev) => ({
      ...prev,
      [messageId]: !prev[messageId],
    }))
  }

  const handleReact = async (messageId: string, emoji: (typeof REACTION_EMOJIS)[number]) => {
    setOpenReactionPicker(null)
    const target = messages.find((m) => m.id === messageId)
    if (!target) return
    // `reactions` may be missing on messages built by untyped code paths
    // (e.g. res.json() shapes), so default defensively.
    const mine = (target.reactions ?? []).find((r) => r.mine)
    const removing = mine?.emoji === emoji
    const nextEmoji = removing ? null : emoji

    const prevMessages = messages
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m
        const others = (m.reactions ?? []).filter((r) => !r.mine)
        return {
          ...m,
          reactions: nextEmoji ? [...others, { emoji: nextEmoji, mine: true }] : others,
        }
      })
    )

    try {
      const res = await fetch(`/api/messages/${messageId}/reaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji: nextEmoji }),
      })
      if (!res.ok) throw new Error('Failed to update reaction')
    } catch (error) {
      console.error('Error updating reaction:', error)
      setMessages(prevMessages)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    } else if (days === 1) {
      return 'Yesterday'
    } else if (days < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' })
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  if (loading && !selectedConversation) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-[#C4785A] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Conversation list view
  if (!selectedConversation) {
    return (
      <div>
        <h2 className="text-lg font-semibold text-[#1A1A1A] mb-4">Messages</h2>

        {conversations.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 border border-[#EBEBEB] text-center">
            <p className="text-3xl mb-3">💬</p>
            <h3 className="font-semibold text-[#1A1A1A] mb-1">No messages yet</h3>
            <p className="text-sm text-[#6B6B6B]">
              When you book a cleaner, you can message them here.
              Messages are automatically translated!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => handleSelectConversation(conv.id)}
                className="w-full bg-white rounded-xl p-4 border border-[#EBEBEB] hover:border-[#C4785A] transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#F5F5F3] flex items-center justify-center overflow-hidden flex-shrink-0">
                    {conv.otherParty.image ? (
                      <Image
                        src={conv.otherParty.image}
                        alt={conv.otherParty.name || ''}
                        width={48}
                        height={48}
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <span className="text-xl">👤</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-[#1A1A1A]">
                        {conv.otherParty.name}
                      </h3>
                      <span className="text-xs text-[#9B9B9B]">
                        {formatTime(conv.updatedAt)}
                      </span>
                    </div>
                    {conv.property && (
                      <p className="text-xs text-[#C4785A] mb-1">
                        {conv.property.name}
                      </p>
                    )}
                    {conv.lastMessage && (
                      <p className="text-sm text-[#6B6B6B] truncate">
                        {conv.lastMessage.isMine ? 'You: ' : ''}
                        {conv.lastMessage.text}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Translation info */}
        <div className="mt-6 bg-[#FFF8F5] rounded-xl p-4 border border-[#F5E6E0]">
          <div className="flex items-start gap-3">
            <span className="text-xl">🌍</span>
            <div>
              <h3 className="font-medium text-[#1A1A1A] text-sm mb-1">
                Auto-translation enabled
              </h3>
              <p className="text-xs text-[#6B6B6B]">
                Write in your language — your cleaner sees it in theirs.
                Supports English, Spanish, German, French, Dutch, Italian, and Portuguese.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Conversation detail view
  return (
    <div className="flex flex-col h-[calc(100vh-220px)]">
      {/* Conversation header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => {
            setSelectedConversation(null)
            fetchConversations()
          }}
          className="text-[#6B6B6B] hover:text-[#1A1A1A]"
        >
          ← Back
        </button>
        <div className="w-10 h-10 rounded-full bg-[#F5F5F3] flex items-center justify-center overflow-hidden">
          {selectedConversation.otherParty.image ? (
            <Image
              src={selectedConversation.otherParty.image}
              alt={selectedConversation.otherParty.name || ''}
              width={40}
              height={40}
              className="object-cover"
              unoptimized
            />
          ) : (
            <span className="text-lg">👤</span>
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-[#1A1A1A]">
            {selectedConversation.otherParty.name}
          </h3>
          {selectedConversation.property && (
            <p className="text-xs text-[#6B6B6B]">
              {selectedConversation.property.name}
            </p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto space-y-3 mb-4"
        onClick={() => setOpenReactionPicker(null)}
      >
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[#6B6B6B] text-sm">
              Start the conversation — your message will be translated automatically!
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const prevMsg = messages[index - 1]
            const showDateSeparator =
              !prevMsg || messageDayKey(msg.createdAt) !== messageDayKey(prevMsg.createdAt)
            // Defensive: messages appended from untyped res.json() paths may
            // lack `reactions` — never crash the tab over a missing array.
            const reactions = msg.reactions ?? []
            return (
            <Fragment key={msg.id}>
              {showDateSeparator && (
                <div className="flex justify-center py-1">
                  <span className="text-[11px] text-[#9B9B9B] bg-[#F5F5F3] px-3 py-1 rounded-full">
                    {formatDaySeparator(msg.createdAt, 'en')}
                  </span>
                </div>
              )}
              <div
                className={`flex ${msg.isMine ? 'justify-end' : 'justify-start'}`}
              >
              <div className={`relative max-w-[80%] ${reactions.length > 0 ? 'mb-3' : ''}`}>
              <div
                onClick={(e) => {
                  if (msg.isMine) return
                  e.stopPropagation()
                  setOpenReactionPicker((prev) => (prev === msg.id ? null : msg.id))
                }}
                className={`rounded-2xl px-4 py-2.5 ${
                  msg.isMine
                    ? 'bg-[#C4785A] text-white rounded-br-md'
                    : 'bg-white border border-[#EBEBEB] text-[#1A1A1A] rounded-bl-md'
                } ${!msg.isMine ? 'cursor-pointer active:scale-[0.99] transition-transform' : ''}`}
              >
                {/* AI Badge for AI-generated messages */}
                {!msg.isMine && msg.isAIGenerated && (
                  <div className="flex items-center gap-1 mb-1.5">
                    <span className="text-[10px] bg-gradient-to-r from-purple-500 to-blue-500 text-white px-1.5 py-0.5 rounded-full font-medium">
                      AI
                    </span>
                    <span className="text-[10px] text-[#9B9B9B]">Auto-response</span>
                  </div>
                )}
                <p className="text-sm">{msg.text}</p>

                {/* Show translation toggle for received messages */}
                {!msg.isMine && msg.translatedText && msg.originalText !== msg.translatedText && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleShowOriginal(msg.id)
                    }}
                    className="text-xs text-[#9B9B9B] hover:text-[#6B6B6B] mt-1 flex items-center gap-1"
                  >
                    <span>🌐</span>
                    {showOriginal[msg.id] ? 'Show translated' : 'Show original'}
                  </button>
                )}

                {/* Show original text if toggled */}
                {!msg.isMine && showOriginal[msg.id] && msg.originalText !== msg.text && (
                  <div className="text-xs text-[#9B9B9B] mt-2 pt-2 border-t border-[#EBEBEB]">
                    <p>Original ({LANGUAGE_NAMES[msg.originalLang] || msg.originalLang}): {msg.originalText}</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        copyToClipboard(msg.originalText, `${msg.id}-orig`)
                      }}
                      className="text-[#C4785A] hover:text-[#A66048] mt-1 flex items-center gap-1"
                    >
                      {copied === `${msg.id}-orig` ? (
                        <>✓ Copied!</>
                      ) : (
                        <>📋 Copy original</>
                      )}
                    </button>
                  </div>
                )}

                {/* Show translation with copy for sent messages */}
                {msg.isMine && msg.translatedText && (
                  <div className="mt-2 pt-2 border-t border-white/20">
                    <p className="text-xs opacity-60 mb-1">
                      {LANGUAGE_NAMES[msg.translatedLang || 'es'] || 'Spanish'} translation:
                    </p>
                    <p className="text-xs opacity-80 italic">{msg.translatedText}</p>
                    <button
                      onClick={() => copyToClipboard(msg.translatedText!, `${msg.id}-trans`)}
                      className="text-xs opacity-60 hover:opacity-100 mt-1 flex items-center gap-1"
                    >
                      {copied === `${msg.id}-trans` ? (
                        <>✓ Copied!</>
                      ) : (
                        <>📋 Copy for WhatsApp</>
                      )}
                    </button>
                  </div>
                )}

                <p
                  className={`text-[10px] mt-1 text-right ${
                    msg.isMine ? 'text-white/60' : 'text-[#9B9B9B]'
                  }`}
                >
                  {formatMessageClock(msg.createdAt, 'en')}
                </p>
              </div>

              {/* Reaction picker - incoming messages only, one open at a time */}
              {openReactionPicker === msg.id && !msg.isMine && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute left-0 -bottom-9 flex items-center gap-0.5 bg-white border border-[#EBEBEB] rounded-full px-1.5 py-1 shadow-md z-20"
                >
                  {REACTION_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleReact(msg.id, emoji)}
                      aria-label={`React with ${emoji}`}
                      className="w-7 h-7 flex items-center justify-center text-base leading-none rounded-full active:scale-90 transition-transform"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              {/* Reaction chips - shown on any bubble that has reactions */}
              {reactions.length > 0 && (
                <div className={`absolute -bottom-3 flex gap-1 ${msg.isMine ? 'right-2' : 'left-2'}`}>
                  {groupReactions(reactions).map(({ emoji, count, mine }) => (
                    <span
                      key={emoji}
                      className={`inline-flex items-center gap-0.5 bg-white border rounded-full px-1.5 py-0.5 text-[11px] leading-none shadow-sm ${
                        mine ? 'border-[#C4785A]' : 'border-[#EBEBEB]'
                      }`}
                    >
                      <span>{emoji}</span>
                      {count > 1 && <span className="text-[#6B6B6B]">{count}</span>}
                    </span>
                  ))}
                </div>
              )}
              </div>
              </div>
            </Fragment>
          )})
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
          placeholder="Type your message..."
          className="flex-1 px-4 py-3 rounded-xl border border-[#DEDEDE] focus:outline-none focus:border-[#1A1A1A] transition-colors"
        />
        <button
          onClick={handleSendMessage}
          disabled={!newMessage.trim() || sending}
          className="px-4 py-3 bg-[#1A1A1A] text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending ? (
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
          ) : (
            'Send'
          )}
        </button>
      </div>
    </div>
  )
}
