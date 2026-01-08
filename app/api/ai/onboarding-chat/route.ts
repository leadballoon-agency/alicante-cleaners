/**
 * Cleaner Onboarding AI Chat Endpoint
 *
 * POST /api/ai/onboarding-chat
 *
 * Helps cleaners signing up understand the onboarding process.
 * Responds in whatever language they write in (Portuguese, Spanish, English, etc.)
 */

import { NextResponse } from 'next/server'
import { getOpenAI } from '@/lib/ai/agents'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(request: Request) {
  try {
    const { message, history = [], currentStep = 1 } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: 'Missing message' },
        { status: 400 }
      )
    }

    const stepDescriptions: Record<number, string> = {
      1: 'Phone number entry - They need to enter their Spanish phone number to receive a verification code',
      2: 'Verification code - They need to enter the 6-digit code sent to their phone (for testing: use 123456)',
      3: 'Profile setup - Name, photo (optional), bio about their experience, and a link to existing reviews (Google/Facebook)',
      4: 'Service areas - Select which areas of Alicante they can work in',
      5: 'Pricing - Set their hourly rate (€15-25 typical)',
      6: 'Calendar sync - Connect Google Calendar to auto-sync bookings (optional but recommended)',
      7: 'Success! - Profile is live, they can start receiving bookings',
    }

    const systemPrompt = `You are a friendly onboarding assistant for VillaCare, a platform connecting villa cleaners with property owners in Alicante, Spain.

YOUR ROLE:
- Help cleaners complete their sign-up process
- Answer questions in WHATEVER LANGUAGE they write in (Portuguese, Spanish, English, German, French, etc.)
- Explain each step clearly and simply
- Be encouraging and supportive

THE SIGNUP PROCESS HAS 6 STEPS:
1. PHONE NUMBER - Enter Spanish mobile number (starts with +34)
2. VERIFY CODE - Enter 6-digit SMS code (test code: 123456)
3. YOUR PROFILE - Name, optional photo, bio about experience, link to existing reviews
4. SERVICE AREAS - Choose areas: Alicante City, San Juan, Playa de San Juan, El Campello, Mutxamel, San Vicente, Jijona
5. SET YOUR RATE - Hourly rate (€15-25 is typical, you earn 100% minus small platform fee)
6. CALENDAR SYNC - Optional but recommended - connects Google/Apple Calendar

The visitor is currently on step ${currentStep}: ${stepDescriptions[currentStep] || 'Unknown step'}

KEY INFORMATION:
- VillaCare is FREE to join
- Cleaners keep most of their earnings (small booking fee only)
- Platform handles payments, scheduling, and translation with villa owners
- Auto-translation means cleaners can work with English/German/Dutch owners easily
- Photo proof system builds trust with owners
- Calendar sync prevents double-bookings

HELPFUL GUIDES:
- Profile Guide: /join/profile-guide - How to build a profile that gets more bookings (photo tips, bio writing, SEO benefits, social sharing)
- Onboarding Guide: /join/guide - Step-by-step signup walkthrough
- Calendar Guide: /join/calendar-guide - How to sync your calendar

When cleaners ask about getting more bookings, improving their profile, or sharing on social media, direct them to the Profile Guide at /join/profile-guide

IMPORTANT RULES:
- ALWAYS respond in the same language the user writes in
- If they write in Portuguese, reply in Portuguese
- If they write in Spanish, reply in Spanish
- Keep responses short and helpful (2-3 sentences max)
- Be warm and welcoming
- Don't make up features that don't exist`

    const openai = getOpenAI()

    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-6).map((m: ChatMessage) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: message },
    ]

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      max_tokens: 300,
      messages,
    })

    const assistantMessage = response.choices[0]?.message?.content ||
      'Sorry, I had trouble responding. Please try again.'

    return NextResponse.json({
      response: assistantMessage,
    })
  } catch (error) {
    console.error('Onboarding chat error:', error)
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    )
  }
}
