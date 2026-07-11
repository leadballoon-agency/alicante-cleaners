/**
 * Shared helpers for the message-reaction UI (cleaner/owner/admin Messages
 * tabs). One reaction per user per message; the server enforces the
 * toggle/replace semantics, this just groups the flat per-user reaction
 * list into per-emoji chips for rendering.
 */

export const REACTION_EMOJIS = ['👍', '❤️', '✅'] as const

export type ReactionEmoji = (typeof REACTION_EMOJIS)[number]

export type MessageReactionView = {
  emoji: string
  mine: boolean
}

export type GroupedReaction = {
  emoji: string
  count: number
  mine: boolean
}

/** Groups a flat per-user reaction list into one entry per distinct emoji. */
export function groupReactions(reactions: MessageReactionView[]): GroupedReaction[] {
  const grouped = new Map<string, GroupedReaction>()
  for (const r of reactions) {
    const existing = grouped.get(r.emoji)
    if (existing) {
      existing.count += 1
      if (r.mine) existing.mine = true
    } else {
      grouped.set(r.emoji, { emoji: r.emoji, count: 1, mine: r.mine })
    }
  }
  return Array.from(grouped.values())
}
