import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasStaffAccess } from '@/lib/staff-access'
import { db } from '@/lib/db'
import { detectAndTranslate, SUPPORTED_LANGUAGES, type LanguageCode } from '@/lib/translate'
import { z } from 'zod'

const sendSchema = z.object({ text: z.string().min(1).max(5000) })

// GET /api/admin/messages/[id] — the thread, in the manager's language; marks cleaner msgs read
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || !hasStaffAccess(session.user.staffLevel, 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const me = session.user.id
    const { id } = await params

    const conversation = await db.conversation.findUnique({
      where: { id },
      include: { cleaner: { include: { user: { select: { name: true, image: true } } } } },
    })
    if (!conversation || conversation.adminId !== me) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const messages = await db.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: 'asc' },
      include: { reactions: true },
    })

    // Mark the cleaner's messages as read now the manager is viewing
    await db.message.updateMany({
      where: { conversationId: id, senderRole: 'CLEANER', isRead: false },
      data: { isRead: true },
    })

    return NextResponse.json({
      cleaner: {
        id: conversation.cleanerId,
        name: conversation.cleaner.user.name || 'Cleaner',
        image: conversation.cleaner.user.image,
        slug: conversation.cleaner.slug,
      },
      messages: messages.map((m) => ({
        id: m.id,
        // Manager view: my own messages show what I typed; the cleaner's show
        // the version translated into my language (falling back to original).
        text: m.senderRole === 'CLEANER' ? (m.translatedText || m.originalText) : m.originalText,
        mine: m.senderRole !== 'CLEANER',
        at: m.createdAt,
        reactions: m.reactions.map((r) => ({ emoji: r.emoji, mine: r.userId === me })),
      })),
    })
  } catch (error) {
    console.error('Error loading manager thread:', error)
    return NextResponse.json({ error: 'Failed to load' }, { status: 500 })
  }
}

// POST /api/admin/messages/[id] — send a message to the cleaner (translated to their language)
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || !hasStaffAccess(session.user.staffLevel, 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const me = session.user.id
    const { id } = await params

    const parsed = sendSchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: 'Invalid message' }, { status: 400 })
    const text = parsed.data.text.trim()

    const conversation = await db.conversation.findUnique({
      where: { id },
      include: { cleaner: { include: { user: { select: { preferredLanguage: true } } } } },
    })
    if (!conversation || conversation.adminId !== me) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Translate into the cleaner's preferred language
    const cl = conversation.cleaner.user.preferredLanguage
    const targetLang: LanguageCode = cl in SUPPORTED_LANGUAGES ? (cl as LanguageCode) : 'es'

    let originalLang: LanguageCode = 'en'
    let translatedText: string | null = null
    let translatedLang: LanguageCode | null = null
    try {
      const t = await detectAndTranslate(text, targetLang)
      originalLang = t.originalLang
      if (t.translatedText !== text) {
        translatedText = t.translatedText
        translatedLang = targetLang
      }
    } catch (e) {
      console.error('Translation failed, sending untranslated:', e)
    }

    // Always tag as ADMIN so the cleaner's inbox/unread treats it as a staff
    // message — regardless of the manager's base role (CLEANER for Ernesto).
    await db.message.create({
      data: {
        conversationId: id,
        senderId: me,
        senderRole: 'ADMIN',
        originalText: text,
        originalLang,
        translatedText,
        translatedLang,
      },
    })
    await db.conversation.update({ where: { id }, data: { updatedAt: new Date() } })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error sending manager message:', error)
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 })
  }
}
