'use client'

import { Fragment, useEffect, useState, useCallback } from 'react'
import { formatMessageClock, formatDaySeparator, messageDayKey } from '@/lib/message-time'
import { REACTION_EMOJIS, groupReactions, type MessageReactionView } from '@/lib/message-reactions'

type Convo = {
  id: string
  cleaner: { id: string; name: string; image: string | null; slug: string }
  lastMessage: { text: string; at: string; fromCleaner: boolean } | null
  unread: number
}
// `reactions` optional: setThread(await r.json()) is untyped, so never
// assume the field exists — always default to [] before use.
type ThreadMsg = { id: string; text: string; mine: boolean; at: string; reactions?: MessageReactionView[] }
type Thread = { cleaner: { id: string; name: string; image: string | null }; messages: ThreadMsg[] }
type CleanerLite = { id: string; name: string; status: string }

export default function MessagesTab({ initialConversationId }: { initialConversationId?: string | null } = {}) {
  const [view, setView] = useState<'list' | 'new' | 'thread'>('list')
  const [convos, setConvos] = useState<Convo[]>([])
  const [loading, setLoading] = useState(true)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [thread, setThread] = useState<Thread | null>(null)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [cleaners, setCleaners] = useState<CleanerLite[]>([])
  const [search, setSearch] = useState('')
  const [autoOpenedConversation, setAutoOpenedConversation] = useState(false)
  const [openReactionPicker, setOpenReactionPicker] = useState<string | null>(null)

  const loadConvos = useCallback(() => {
    setLoading(true)
    fetch('/api/admin/messages').then((r) => r.json()).then((d) => setConvos(d.conversations || [])).catch(() => {}).finally(() => setLoading(false))
  }, [])

  useEffect(() => { loadConvos() }, [loadConvos])

  const openThread = useCallback((id: string) => {
    setActiveId(id); setView('thread'); setThread(null)
    fetch(`/api/admin/messages/${id}`).then((r) => r.json()).then(setThread).catch(() => {})
  }, [])

  // Deep-link support: /admin?tab=messages&conversation=<id> auto-opens that
  // thread once the conversation list has loaded — but only if it's actually
  // one of this admin's conversations (private per-admin threads). If not
  // found (e.g. it belongs to a different admin), fall back to the list.
  useEffect(() => {
    if (!initialConversationId || autoOpenedConversation) return
    if (convos.some((c) => c.id === initialConversationId)) {
      setAutoOpenedConversation(true)
      openThread(initialConversationId)
    }
  }, [convos, initialConversationId, autoOpenedConversation, openThread])

  const startNew = () => {
    setView('new')
    if (cleaners.length === 0) {
      fetch('/api/admin/cleaners').then((r) => r.json()).then((d) => setCleaners(d.cleaners || [])).catch(() => {})
    }
  }

  const createWith = async (cleanerId: string) => {
    const r = await fetch('/api/admin/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cleanerId }) })
    const d = await r.json()
    if (d.conversationId) { openThread(d.conversationId); loadConvos() }
  }

  const send = async () => {
    if (!input.trim() || !activeId || sending) return
    setSending(true)
    const text = input.trim()
    setInput('')
    // optimistic
    setThread((t) => t ? { ...t, messages: [...t.messages, { id: 'tmp', text, mine: true, at: new Date().toISOString(), reactions: [] }] } : t)
    try {
      await fetch(`/api/admin/messages/${activeId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) })
      const r = await fetch(`/api/admin/messages/${activeId}`); setThread(await r.json())
      loadConvos()
    } catch { /* leave optimistic msg */ }
    finally { setSending(false) }
  }

  const handleReact = async (messageId: string, emoji: (typeof REACTION_EMOJIS)[number]) => {
    setOpenReactionPicker(null)
    const target = thread?.messages.find((m) => m.id === messageId)
    if (!target) return
    const mine = (target.reactions ?? []).find((r) => r.mine)
    const removing = mine?.emoji === emoji
    const nextEmoji = removing ? null : emoji

    const prevThread = thread
    setThread((t) => t ? {
      ...t,
      messages: t.messages.map((m) => {
        if (m.id !== messageId) return m
        const others = (m.reactions ?? []).filter((r) => !r.mine)
        return { ...m, reactions: nextEmoji ? [...others, { emoji: nextEmoji, mine: true }] : others }
      }),
    } : t)

    try {
      const res = await fetch(`/api/messages/${messageId}/reaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji: nextEmoji }),
      })
      if (!res.ok) throw new Error('Failed to update reaction')
    } catch (error) {
      console.error('Error updating reaction:', error)
      setThread(prevThread)
    }
  }

  // ---------- THREAD ----------
  if (view === 'thread') {
    return (
      <div className="flex flex-col" style={{ height: 'calc(100vh - 160px)' }}>
        <button onClick={() => { setView('list'); loadConvos() }} className="text-[#7C7269] text-sm mb-3 self-start">‹ All messages</button>
        <div className="flex items-center gap-3 pb-3 border-b border-[#EFE8E1]">
          <div className="w-9 h-9 rounded-full bg-[#F3E4DC] flex items-center justify-center text-sm font-semibold text-[#B56A4F]">{thread?.cleaner.name?.[0] || '🧹'}</div>
          <div className="font-semibold text-[#1A1A1A]">{thread?.cleaner.name || '…'}</div>
        </div>
        <div
          className="flex-1 overflow-y-auto py-4 flex flex-col gap-2.5"
          onClick={() => setOpenReactionPicker(null)}
        >
          {!thread && <div className="text-center text-[#A89E95] text-sm py-8">Loading…</div>}
          {thread?.messages.length === 0 && <div className="text-center text-[#A89E95] text-sm py-8">No messages yet — say hello 👋</div>}
          {thread?.messages.map((m, i) => {
            const prev = thread.messages[i - 1]
            const showDateSeparator = !prev || messageDayKey(m.at) !== messageDayKey(prev.at)
            const reactions = m.reactions ?? []
            return (
              <Fragment key={m.id}>
                {showDateSeparator && (
                  <div className="self-center my-1">
                    <span className="text-[11px] text-[#A89E95] bg-[#FAF7F3] px-3 py-1 rounded-full">
                      {formatDaySeparator(m.at, 'en')}
                    </span>
                  </div>
                )}
                <div className={`relative max-w-[82%] ${m.mine ? 'self-end' : 'self-start'} ${reactions.length > 0 ? 'mb-3' : ''}`}>
                  <div
                    onClick={(e) => {
                      if (m.mine) return
                      e.stopPropagation()
                      setOpenReactionPicker((prevId) => (prevId === m.id ? null : m.id))
                    }}
                    className={`px-3.5 py-2.5 rounded-2xl text-[14.5px] leading-snug ${m.mine ? 'bg-[#C4785A] text-white rounded-br-md' : 'bg-white border border-[#EFE8E1] text-[#1A1A1A] rounded-bl-md'} ${!m.mine ? 'cursor-pointer active:scale-[0.99] transition-transform' : ''}`}
                  >
                    <div>{m.text}</div>
                    <div className={`text-[10px] mt-1 text-right ${m.mine ? 'text-white/60' : 'text-[#A89E95]'}`}>
                      {formatMessageClock(m.at, 'en')}
                    </div>
                  </div>

                  {/* Reaction picker - incoming (cleaner) messages only, one open at a time */}
                  {openReactionPicker === m.id && !m.mine && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute left-0 -bottom-9 flex items-center gap-0.5 bg-white border border-[#EFE8E1] rounded-full px-1.5 py-1 shadow-md z-20"
                    >
                      {REACTION_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleReact(m.id, emoji)}
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
                    <div className={`absolute -bottom-3 flex gap-1 ${m.mine ? 'right-2' : 'left-2'}`}>
                      {groupReactions(reactions).map(({ emoji, count, mine }) => (
                        <span
                          key={emoji}
                          className={`inline-flex items-center gap-0.5 bg-white border rounded-full px-1.5 py-0.5 text-[11px] leading-none shadow-sm ${
                            mine ? 'border-[#C4785A]' : 'border-[#EFE8E1]'
                          }`}
                        >
                          <span>{emoji}</span>
                          {count > 1 && <span className="text-[#A89E95]">{count}</span>}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Fragment>
            )
          })}
        </div>
        <div className="pt-2 border-t border-[#EFE8E1]">
          <div className="text-[11px] text-[#A89E95] mb-1.5">Write in your own language — it’s auto-translated for {thread?.cleaner.name || 'them'}.</div>
          <div className="flex items-center gap-2">
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Type a message…" className="flex-1 px-4 py-3 rounded-xl border border-[#EFE8E1] text-[14.5px] focus:border-[#C4785A] outline-none" />
            <button onClick={send} disabled={sending || !input.trim()} className="w-11 h-11 rounded-xl bg-[#C4785A] text-white text-lg disabled:opacity-40">↑</button>
          </div>
        </div>
      </div>
    )
  }

  // ---------- NEW (cleaner picker) ----------
  if (view === 'new') {
    const filtered = cleaners.filter((c) => c.status === 'active' && c.name.toLowerCase().includes(search.toLowerCase()))
    return (
      <div>
        <button onClick={() => setView('list')} className="text-[#7C7269] text-sm mb-3">‹ Back</button>
        <h2 className="text-lg font-semibold text-[#1A1A1A] mb-3">Message a cleaner</h2>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search cleaners…" className="w-full px-4 py-3 rounded-xl border border-[#EFE8E1] mb-3 outline-none focus:border-[#C4785A]" />
        {filtered.map((c) => (
          <button key={c.id} onClick={() => createWith(c.id)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[#FAF7F3] text-left border border-transparent hover:border-[#EFE8E1]">
            <div className="w-9 h-9 rounded-full bg-[#F3E4DC] flex items-center justify-center text-sm font-semibold text-[#B56A4F]">{c.name[0]}</div>
            <span className="font-medium text-[#1A1A1A]">{c.name}</span>
          </button>
        ))}
      </div>
    )
  }

  // ---------- LIST ----------
  return (
    <div className="pb-24">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Messages</h1>
        <button onClick={startNew} className="bg-[#C4785A] text-white rounded-xl px-4 py-2 text-sm font-semibold">＋ New</button>
      </div>
      <p className="text-[13px] text-[#7C7269] mb-4">Two-way chat with your cleaners — every message auto-translated and recorded.</p>
      {loading ? (
        <div className="text-center text-[#A89E95] py-12">Loading…</div>
      ) : convos.length === 0 ? (
        <div className="text-center text-[#7C7269] py-12">
          <div className="text-3xl mb-2">💬</div>
          No conversations yet. Tap <b>＋ New</b> to message a cleaner.
        </div>
      ) : (
        convos.map((c) => (
          <button key={c.id} onClick={() => openThread(c.id)} className="w-full flex items-center gap-3 p-3.5 mb-2 bg-white border border-[#EFE8E1] rounded-2xl text-left shadow-sm active:scale-[0.99] transition-transform">
            <div className="w-11 h-11 rounded-full bg-[#F3E4DC] flex items-center justify-center font-semibold text-[#B56A4F] shrink-0">{c.cleaner.name[0]}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#1A1A1A] truncate">{c.cleaner.name}</span>
                {c.unread > 0 && <span className="ml-auto bg-[#C4785A] text-white text-[11px] font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center">{c.unread}</span>}
              </div>
              <div className="text-[13px] text-[#7C7269] truncate">{c.lastMessage ? (c.lastMessage.fromCleaner ? '' : 'You: ') + c.lastMessage.text : 'No messages yet'}</div>
            </div>
          </button>
        ))
      )}
    </div>
  )
}
