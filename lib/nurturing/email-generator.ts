import OpenAI from 'openai'
import { NurturingEmailType } from '@prisma/client'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Templates define the goal and tone for each email type
const EMAIL_TEMPLATES: Record<NurturingEmailType, {
  goal: string
  tone: string
  cta: string
  maxLength: number
}> = {
  WELCOME: {
    goal: 'Welcome the new owner and guide them to add their first property',
    tone: 'Warm, friendly, helpful, excited to have them',
    cta: 'Add your first property',
    maxLength: 150,
  },
  PROFILE_INCOMPLETE: {
    goal: 'Encourage owner to complete their profile and add a property so they can book cleanings',
    tone: 'Gentle nudge, helpful, not pushy',
    cta: 'Complete your profile',
    maxLength: 120,
  },
  FIRST_BOOKING_PROMPT: {
    goal: 'Encourage owner to book their first cleaning now that they have a property set up',
    tone: 'Helpful, emphasize convenience and trusted cleaners',
    cta: 'Book your first clean',
    maxLength: 130,
  },
  RE_ENGAGEMENT: {
    goal: 'Re-engage an inactive owner, remind them of the value and ease of using VillaCare',
    tone: 'Friendly check-in, not guilt-tripping, highlight what they might be missing',
    cta: 'See available cleaners',
    maxLength: 140,
  },
}

export interface OwnerContext {
  name: string | null
  email: string
  derivedName: string | null
  propertyCount: number
  bookingCount: number
  lastBookingDate: Date | null
  chatHistory: string | null // Summary of their chat conversations
  daysOnPlatform: number
  cleanerInterest?: string // Which cleaner they showed interest in
}

export interface GeneratedEmail {
  subject: string
  body: string
}

/**
 * Generate a personalized nurturing email using AI
 */
export async function generateNurturingEmail(
  emailType: NurturingEmailType,
  context: OwnerContext
): Promise<GeneratedEmail> {
  const template = EMAIL_TEMPLATES[emailType]
  const displayName = context.name || context.derivedName || 'there'

  const prompt = `Generate a personalized email for VillaCare (villa cleaning service in Alicante, Spain).

EMAIL TYPE: ${emailType}
GOAL: ${template.goal}
TONE: ${template.tone}
CTA BUTTON TEXT: "${template.cta}"
MAX BODY LENGTH: ${template.maxLength} words

OWNER CONTEXT:
- Name: ${displayName}
- Days on platform: ${context.daysOnPlatform}
- Properties added: ${context.propertyCount}
- Bookings made: ${context.bookingCount}
${context.lastBookingDate ? `- Last booking: ${context.lastBookingDate.toLocaleDateString()}` : ''}
${context.chatHistory ? `- Previous chat interest: ${context.chatHistory}` : ''}
${context.cleanerInterest ? `- Showed interest in cleaner: ${context.cleanerInterest}` : ''}

REQUIREMENTS:
1. Generate a compelling subject line (max 50 chars, no emojis)
2. Generate email body that's warm and personal
3. If they showed interest in a specific cleaner or topic, reference it naturally
4. End with encouragement to take action (the CTA button will be added automatically)
5. Sign off as "The VillaCare Team"
6. DO NOT include the CTA button in the body - it will be added automatically
7. DO NOT use placeholder text like [Name] - use the actual name provided
8. Keep it concise and scannable - busy villa owners don't have time for long emails

Return JSON: { "subject": "...", "body": "..." }`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    })

    const result = JSON.parse(response.choices[0]?.message?.content || '{}')

    return {
      subject: result.subject || getDefaultSubject(emailType, displayName),
      body: result.body || getDefaultBody(emailType, displayName),
    }
  } catch (error) {
    console.error('[Email Generator] AI error:', error)
    // Fallback to default templates
    return {
      subject: getDefaultSubject(emailType, displayName),
      body: getDefaultBody(emailType, displayName),
    }
  }
}

function getDefaultSubject(emailType: NurturingEmailType, name: string): string {
  switch (emailType) {
    case 'WELCOME':
      return `Welcome to VillaCare, ${name}!`
    case 'PROFILE_INCOMPLETE':
      return `${name}, complete your profile to get started`
    case 'FIRST_BOOKING_PROMPT':
      return `Ready to book your first clean, ${name}?`
    case 'RE_ENGAGEMENT':
      return `We miss you, ${name}! Your villa awaits`
    default:
      return `Hello from VillaCare`
  }
}

function getDefaultBody(emailType: NurturingEmailType, name: string): string {
  switch (emailType) {
    case 'WELCOME':
      return `Hi ${name},

Welcome to VillaCare! We're excited to help you keep your Alicante villa sparkling clean.

Our trusted local cleaners are ready to help with regular cleaning, deep cleans, and arrival prep for your guests.

Add your property details to get started and book your first clean in minutes.

The VillaCare Team`
    case 'PROFILE_INCOMPLETE':
      return `Hi ${name},

We noticed you haven't added your property details yet. Adding your villa takes just a minute and unlocks access to our trusted local cleaners.

Once your property is set up, booking a clean is quick and easy.

The VillaCare Team`
    case 'FIRST_BOOKING_PROMPT':
      return `Hi ${name},

Great news - your property is all set up! Now you're ready to book your first clean.

Our cleaners are experienced, trusted, and know the Alicante area well. Whether you need a regular clean or a deep clean before guests arrive, we've got you covered.

The VillaCare Team`
    case 'RE_ENGAGEMENT':
      return `Hi ${name},

It's been a while! We wanted to check in and remind you that VillaCare is here whenever you need cleaning support for your villa.

Book a clean anytime - our trusted cleaners are ready to help.

The VillaCare Team`
    default:
      return `Hi ${name},

Thanks for being part of VillaCare. We're here to help with all your villa cleaning needs in Alicante.

The VillaCare Team`
  }
}

/**
 * Get the CTA URL for each email type
 */
export function getCTAUrl(emailType: NurturingEmailType): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://alicantecleaners.com'
  switch (emailType) {
    case 'WELCOME':
      return `${baseUrl}/owner/dashboard?tab=properties&action=add`
    case 'PROFILE_INCOMPLETE':
      return `${baseUrl}/owner/dashboard?tab=account`
    case 'FIRST_BOOKING_PROMPT':
      return `${baseUrl}/`
    case 'RE_ENGAGEMENT':
      return `${baseUrl}/`
    default:
      return baseUrl
  }
}

/**
 * Get the CTA button text for each email type
 */
export function getCTAText(emailType: NurturingEmailType): string {
  return EMAIL_TEMPLATES[emailType]?.cta || 'Visit VillaCare'
}
