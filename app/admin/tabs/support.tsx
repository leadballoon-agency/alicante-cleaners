'use client'

import { useState } from 'react'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  isAI: boolean
  createdAt: Date
}

type Conversation = {
  id: string
  userType: string
  userName: string
  userEmail?: string
  status: 'active' | 'resolved' | 'escalated'
  sentiment?: string
  topic?: string
  summary?: string
  page: string
  messageCount: number
  lastMessage?: string
  createdAt: Date
  updatedAt: Date
  messages: Message[]
}

type Stats = {
  total: number
  active: number
  escalated: number
  resolved: number
}

type Props = {
  conversations: Conversation[]
  stats: Stats
  onResolve: (id: string) => void
  onRefresh: () => void
}

const STATUS_CONFIG = {
  active: { label: 'Active', color: 'bg-[#E3F2FD] text-[#1976D2]', dot: 'bg-[#1976D2]' },
  escalated: { label: 'Escalated', color: 'bg-[#FFEBEE] text-[#C62828]', dot: 'bg-[#C62828]' },
  resolved: { label: 'Resolved', color: 'bg-[#E8F5E9] text-[#2E7D32]', dot: 'bg-[#2E7D32]' },
}

const SENTIMENT_EMOJI: Record<string, string> = {
  positive: '😊',
  neutral: '😐',
  negative: '😔',
}

const USER_TYPE_BADGE: Record<string, { label: string; color: string }> = {
  owner: { label: '🏡 Owner', color: 'bg-[#FFF8F5] text-[#C4785A]' },
  cleaner: { label: '🧹 Cleaner', color: 'bg-[#E3F2FD] text-[#1976D2]' },
  visitor: { label: '👤 Visitor', color: 'bg-[#F5F5F3] text-[#6B6B6B]' },
}

export default function SupportTab({ conversations, stats, onResolve, onRefresh }: Props) {
  const [filter, setFilter] = useState<'all' | 'active' | 'escalated' | 'resolved'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filteredConversations = conversations.filter(
    c => filter === 'all' || c.status === filter
  )

  const formatDate = (date: Date) => {
    const now = new Date()
    const d = new Date(date)
    const diff = now.getTime() - d.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)

    if (hours < 1) return 'Just now'
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#1A1A1A]">Support Conversations</h2>
          <p className="text-sm text-[#6B6B6B]">
            {stats.escalated > 0 && (
              <span className="text-[#C62828] font-medium">{stats.escalated} need attention · </span>
            )}
            {stats.active} active · {stats.resolved} resolved
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="px-3 py-1.5 text-sm text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-4 border border-[#EBEBEB]">
          <p className="text-sm text-[#6B6B6B] mb-1">Total Chats</p>
          <p className="text-2xl font-semibold text-[#1A1A1A]">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-[#EBEBEB]">
          <p className="text-sm text-[#6B6B6B] mb-1">Active</p>
          <p className="text-2xl font-semibold text-[#1976D2]">{stats.active}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-[#C62828]">
          <p className="text-sm text-[#6B6B6B] mb-1">Needs Attention</p>
          <p className="text-2xl font-semibold text-[#C62828]">{stats.escalated}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-[#EBEBEB]">
          <p className="text-sm text-[#6B6B6B] mb-1">Resolved</p>
          <p className="text-2xl font-semibold text-[#2E7D32]">{stats.resolved}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'escalated', 'active', 'resolved'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-[#1A1A1A] text-white'
                : 'bg-white border border-[#EBEBEB] text-[#6B6B6B] hover:bg-[#F5F5F3]'
            }`}
          >
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            {f === 'escalated' && stats.escalated > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-[#C62828] text-white text-xs rounded-full">
                {stats.escalated}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Conversations */}
      <div className="space-y-3">
        {filteredConversations.length === 0 ? (
          <div className="bg-[#F5F5F3] rounded-2xl p-8 text-center">
            <span className="text-4xl block mb-3">💬</span>
            <p className="text-[#6B6B6B]">No conversations yet</p>
            <p className="text-sm text-[#9B9B9B] mt-1">
              Support conversations will appear here when users chat with the AI assistant
            </p>
          </div>
        ) : (
          filteredConversations.map((conversation) => {
            const isExpanded = expandedId === conversation.id
            const statusConfig = STATUS_CONFIG[conversation.status]
            const userTypeConfig = USER_TYPE_BADGE[conversation.userType] || USER_TYPE_BADGE.visitor

            return (
              <div
                key={conversation.id}
                className={`bg-white rounded-xl border overflow-hidden transition-all ${
                  conversation.status === 'escalated' ? 'border-[#C62828]' : 'border-[#EBEBEB]'
                }`}
              >
                {/* Header row */}
                <div
                  className="p-4 cursor-pointer hover:bg-[#FAFAF8] transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : conversation.id)}
                >
                  <div className="flex items-start gap-3">
                    {/* User avatar */}
                    <div className="w-10 h-10 rounded-full bg-[#F5F5F3] flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">
                        {conversation.sentiment ? SENTIMENT_EMOJI[conversation.sentiment] : '👤'}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-medium text-[#1A1A1A] truncate">
                          {conversation.userName}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${userTypeConfig.color}`}>
                          {userTypeConfig.label}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusConfig.color}`}>
                          {statusConfig.label}
                        </span>
                      </div>

                      {/* Summary or last message */}
                      <p className="text-sm text-[#6B6B6B] line-clamp-2">
                        {conversation.summary || conversation.lastMessage || 'No messages'}
                      </p>

                      {/* Meta */}
                      <div className="flex items-center gap-3 mt-2 text-xs text-[#9B9B9B]">
                        <span>{formatDate(conversation.updatedAt)}</span>
                        <span>·</span>
                        <span>{conversation.messageCount} messages</span>
                        {conversation.topic && (
                          <>
                            <span>·</span>
                            <span className="capitalize">{conversation.topic}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Expand icon */}
                    <span className={`text-[#9B9B9B] transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </div>
                </div>

                {/* Expanded conversation */}
                {isExpanded && (
                  <div className="border-t border-[#EBEBEB] bg-[#FAFAF8]">
                    {/* Messages */}
                    <div className="p-4 max-h-[400px] overflow-y-auto space-y-3">
                      {conversation.messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                              message.role === 'user'
                                ? 'bg-[#1A1A1A] text-white rounded-br-md'
                                : 'bg-white border border-[#EBEBEB] text-[#1A1A1A] rounded-bl-md'
                            }`}
                          >
                            {message.role === 'assistant' && !message.isAI && (
                              <span className="text-xs text-[#C4785A] block mb-1">Admin response</span>
                            )}
                            <p className="whitespace-pre-wrap">{message.content}</p>
                            <p className="text-[10px] opacity-50 mt-1">
                              {new Date(message.createdAt).toLocaleTimeString('en-GB', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="p-4 border-t border-[#EBEBEB] flex items-center justify-between">
                      <div className="text-xs text-[#9B9B9B]">
                        {conversation.userEmail && (
                          <span>Contact: {conversation.userEmail}</span>
                        )}
                      </div>
                      {conversation.status !== 'resolved' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onResolve(conversation.id)
                          }}
                          className="px-4 py-2 bg-[#2E7D32] text-white text-sm font-medium rounded-lg hover:bg-[#1B5E20] transition-colors"
                        >
                          Mark Resolved
                        </button>
                      )}
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
