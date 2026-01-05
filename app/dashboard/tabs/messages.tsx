'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

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
}

type Conversation = {
  id: string
  otherParty: {
    id: string
    name: string
    image: string | null
    role: 'OWNER'
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
    role: 'OWNER'
  }
  property: { name: string; address: string } | null
  myRole: 'CLEANER'
}

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'Inglés',
  es: 'Español',
  de: 'Alemán',
  fr: 'Francés',
  nl: 'Holandés',
  it: 'Italiano',
  pt: 'Portugués',
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

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) {
      return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    } else if (days === 1) {
      return 'Ayer'
    } else if (days < 7) {
      return date.toLocaleDateString('es-ES', { weekday: 'short' })
    } else {
      return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })
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
        <h2 className="text-lg font-semibold text-[#1A1A1A] mb-4">Mensajes</h2>

        {conversations.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 border border-[#EBEBEB] text-center">
            <p className="text-3xl mb-3">💬</p>
            <h3 className="font-semibold text-[#1A1A1A] mb-1">Sin mensajes</h3>
            <p className="text-sm text-[#6B6B6B]">
              Cuando un propietario te reserve, podrás chatear aquí.
              Los mensajes se traducen automáticamente.
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
                        {conv.lastMessage.isMine ? 'Tú: ' : ''}
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
                Traducción automática
              </h3>
              <p className="text-xs text-[#6B6B6B]">
                Escribe en tu idioma — el propietario lo verá en el suyo.
                Soporta español, inglés, alemán, francés, holandés, italiano y portugués.
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
          ← Volver
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
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[#6B6B6B] text-sm">
              Inicia la conversación — tu mensaje se traducirá automáticamente.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.isMine ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                  msg.isMine
                    ? 'bg-[#1A1A1A] text-white rounded-br-md'
                    : 'bg-white border border-[#EBEBEB] text-[#1A1A1A] rounded-bl-md'
                }`}
              >
                {/* AI Badge for AI-generated messages (sent on cleaner's behalf) */}
                {msg.isMine && msg.isAIGenerated && (
                  <div className="flex items-center gap-1 mb-1.5">
                    <span className="text-[10px] bg-gradient-to-r from-purple-500 to-blue-500 text-white px-1.5 py-0.5 rounded-full font-medium">
                      AI
                    </span>
                    <span className="text-[10px] text-white/60">Respuesta automática</span>
                  </div>
                )}
                <p className="text-sm">{msg.text}</p>

                {/* Show translation toggle for received messages */}
                {!msg.isMine && msg.translatedText && msg.originalText !== msg.translatedText && (
                  <button
                    onClick={() => toggleShowOriginal(msg.id)}
                    className="text-xs text-[#9B9B9B] hover:text-[#6B6B6B] mt-1 flex items-center gap-1"
                  >
                    <span>🌐</span>
                    {showOriginal[msg.id] ? 'Ver traducción' : 'Ver original'}
                  </button>
                )}

                {/* Show original text if toggled */}
                {!msg.isMine && showOriginal[msg.id] && msg.originalText !== msg.text && (
                  <div className="text-xs text-[#9B9B9B] mt-2 pt-2 border-t border-[#EBEBEB]">
                    <p>Original ({LANGUAGE_NAMES[msg.originalLang] || msg.originalLang}): {msg.originalText}</p>
                    <button
                      onClick={() => copyToClipboard(msg.originalText, `${msg.id}-orig`)}
                      className="text-[#C4785A] hover:text-[#A66048] mt-1 flex items-center gap-1"
                    >
                      {copied === `${msg.id}-orig` ? (
                        <>✓ Copiado!</>
                      ) : (
                        <>📋 Copiar original</>
                      )}
                    </button>
                  </div>
                )}

                {/* Show translation with copy for sent messages */}
                {msg.isMine && msg.translatedText && (
                  <div className="mt-2 pt-2 border-t border-white/20">
                    <p className="text-xs opacity-60 mb-1">
                      Traducción en {LANGUAGE_NAMES[msg.translatedLang || 'en'] || 'inglés'}:
                    </p>
                    <p className="text-xs opacity-80 italic">{msg.translatedText}</p>
                    <button
                      onClick={() => copyToClipboard(msg.translatedText!, `${msg.id}-trans`)}
                      className="text-xs opacity-60 hover:opacity-100 mt-1 flex items-center gap-1"
                    >
                      {copied === `${msg.id}-trans` ? (
                        <>✓ Copiado!</>
                      ) : (
                        <>📋 Copiar para WhatsApp</>
                      )}
                    </button>
                  </div>
                )}

                <p
                  className={`text-xs mt-1 ${
                    msg.isMine ? 'text-white/60' : 'text-[#9B9B9B]'
                  }`}
                >
                  {formatTime(msg.createdAt)}
                </p>
              </div>
            </div>
          ))
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
          placeholder="Escribe tu mensaje..."
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
            'Enviar'
          )}
        </button>
      </div>
    </div>
  )
}
