import OpenAI from 'openai'
import { NurturingEmailType, CleanerNurturingEmailType } from '@prisma/client'

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
    goal: 'Encourage owner to add their name to personalize their experience',
    tone: 'Gentle nudge, helpful, emphasize the personal touch',
    cta: 'Complete your profile',
    maxLength: 120,
  },
  ADD_PROPERTY_NUDGE: {
    goal: 'Encourage owner to add their villa details so they can book cleanings',
    tone: 'Helpful, emphasize how quick and easy it is',
    cta: 'Add your villa',
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
  POST_REVIEW_REBOOK: {
    goal: 'Thank owner for their review and introduce the new 1-click rebook and recurring booking features',
    tone: 'Grateful, excited about new features, emphasize convenience of rebooking same cleaner',
    cta: 'Rebook your cleaner',
    maxLength: 150,
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
      return `${name}, add your name for a personal touch`
    case 'ADD_PROPERTY_NUDGE':
      return `${name}, add your villa to get started`
    case 'FIRST_BOOKING_PROMPT':
      return `Ready to book your first clean, ${name}?`
    case 'RE_ENGAGEMENT':
      return `We miss you, ${name}! Your villa awaits`
    case 'POST_REVIEW_REBOOK':
      return `Thanks for your review! Here's an easier way to rebook`
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

Adding your name helps us personalize your experience and makes it easier for cleaners to greet you.

Just a quick update to your profile and you're all set!

The VillaCare Team`
    case 'ADD_PROPERTY_NUDGE':
      return `Hi ${name},

You're one step away from booking your first clean! Add your villa details - it only takes a minute.

Once your property is set up, you can browse our trusted cleaners and book in just a few clicks.

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
    case 'POST_REVIEW_REBOOK':
      return `Hi ${name},

Thank you for leaving a review - it means a lot to us and helps other villa owners find great cleaners.

We've just added some new features to make rebooking even easier:

⚡ 1-Click Rebook - Book the same cleaner for next week with one tap
🔄 Make it Recurring - Set up weekly, fortnightly, or monthly cleans automatically

Just hold any past booking in your dashboard to try these features.

Happy cleaning!

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
    case 'ADD_PROPERTY_NUDGE':
      return `${baseUrl}/owner/dashboard?tab=properties&action=add`
    case 'FIRST_BOOKING_PROMPT':
      return `${baseUrl}/`
    case 'RE_ENGAGEMENT':
      return `${baseUrl}/`
    case 'POST_REVIEW_REBOOK':
      return `${baseUrl}/features/rebook`
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

// ============================================
// CLEANER EDUCATION EMAIL TEMPLATES
// ============================================

const CLEANER_EMAIL_TEMPLATES: Record<CleanerNurturingEmailType, {
  goal: string
  tone: string
  cta: string
  maxLength: number
}> = {
  CLEANER_WELCOME: {
    goal: 'Welcome the new cleaner, explain the platform features, and get them excited about earning with VillaCare',
    tone: 'Warm, professional, encouraging, excited to have them join the team',
    cta: 'View your dashboard',
    maxLength: 180,
  },
  PROFILE_TIPS: {
    goal: 'Guide cleaner to complete their profile with a great photo, compelling bio, and service areas for more bookings',
    tone: 'Helpful, coaching, emphasize that complete profiles get 3x more bookings',
    cta: 'Complete your profile',
    maxLength: 150,
  },
  CALENDAR_SYNC_GUIDE: {
    goal: 'Explain how to connect Google Calendar to automatically show availability and avoid double bookings',
    tone: 'Practical, step-by-step guidance, emphasize the time-saving benefit',
    cta: 'Connect your calendar',
    maxLength: 160,
  },
  FIRST_BOOKING_GUIDE: {
    goal: 'Explain how to manage bookings: peek-to-lock gesture, accepting/declining via app or WhatsApp, completing jobs',
    tone: 'Practical, reassuring for first-timers, emphasize how easy the system is',
    cta: 'View your bookings',
    maxLength: 170,
  },
  SUCCESS_COACH_INTRO: {
    goal: 'Introduce the AI Success Coach feature now unlocked, explain how it helps grow their business with personalized tips',
    tone: 'Exciting, celebratory for completing first job, motivating to continue growing',
    cta: 'Meet your Success Coach',
    maxLength: 150,
  },
  BOOKING_MANAGEMENT_TIPS: {
    goal: 'Advanced tips: assign bookings to team members, use quick message presets, manage recurring customers',
    tone: 'Helpful, insider tips, position them as a growing professional',
    cta: 'Explore advanced features',
    maxLength: 160,
  },
  TEAM_OPPORTUNITY: {
    goal: 'Explain team benefits: overflow bookings, shared calendar, team referral bonuses, path to team leadership',
    tone: 'Opportunity-focused, show growth potential, emphasize community aspect',
    cta: 'Learn about teams',
    maxLength: 170,
  },
  PROMOTE_PROFILE_TIPS: {
    goal: 'Tips to promote their profile: share link on social media, WhatsApp share button, ask happy clients for reviews',
    tone: 'Marketing-savvy, encouraging, emphasize word-of-mouth power',
    cta: 'Share your profile',
    maxLength: 150,
  },
  CLEANER_REACTIVATION: {
    goal: 'Re-engage inactive cleaner, remind them of potential earnings and platform improvements',
    tone: 'Friendly check-in, not guilt-tripping, highlight what they might be missing out on',
    cta: 'Check your dashboard',
    maxLength: 140,
  },
}

export interface CleanerContext {
  name: string | null
  email: string | null
  phone: string | null
  slug: string
  bio: string | null
  photoUrl: string | null
  serviceAreaCount: number
  languageCount: number
  bookingCount: number
  completedBookingCount: number
  rating: number | null
  reviewCount: number
  googleCalendarConnected: boolean
  teamLeader: boolean
  teamId: string | null
  daysOnPlatform: number
}

/**
 * Generate a personalized education email for cleaners using AI
 */
export async function generateCleanerNurturingEmail(
  emailType: CleanerNurturingEmailType,
  context: CleanerContext
): Promise<GeneratedEmail> {
  const template = CLEANER_EMAIL_TEMPLATES[emailType]
  const displayName = context.name || 'there'

  const prompt = `Generate a personalized email for a VillaCare cleaner (villa cleaning platform in Alicante, Spain).

EMAIL TYPE: ${emailType}
GOAL: ${template.goal}
TONE: ${template.tone}
CTA BUTTON TEXT: "${template.cta}"
MAX BODY LENGTH: ${template.maxLength} words

CLEANER CONTEXT:
- Name: ${displayName}
- Days on platform: ${context.daysOnPlatform}
- Profile slug: ${context.slug}
- Has photo: ${context.photoUrl ? 'Yes' : 'No'}
- Bio length: ${context.bio ? context.bio.length : 0} characters
- Service areas: ${context.serviceAreaCount}
- Languages: ${context.languageCount}
- Total bookings: ${context.bookingCount}
- Completed bookings: ${context.completedBookingCount}
- Rating: ${context.rating || 'Not yet rated'}
- Reviews: ${context.reviewCount}
- Google Calendar connected: ${context.googleCalendarConnected ? 'Yes' : 'No'}
- Team leader: ${context.teamLeader ? 'Yes' : 'No'}
- On a team: ${context.teamId ? 'Yes' : 'No'}

REQUIREMENTS:
1. Generate a compelling subject line (max 50 chars, no emojis)
2. Generate email body that's warm and professional
3. Reference their specific situation (e.g., if no photo, mention it benefits them)
4. End with encouragement to take action (the CTA button will be added automatically)
5. Sign off as "The VillaCare Team"
6. DO NOT include the CTA button in the body - it will be added automatically
7. DO NOT use placeholder text like [Name] - use the actual name provided
8. Keep it concise - busy cleaners appreciate quick reads
9. Use Spanish greetings where appropriate (they may prefer Spanish)

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
      subject: result.subject || getDefaultCleanerSubject(emailType, displayName),
      body: result.body || getDefaultCleanerBody(emailType, displayName, context),
    }
  } catch (error) {
    console.error('[Cleaner Email Generator] AI error:', error)
    return {
      subject: getDefaultCleanerSubject(emailType, displayName),
      body: getDefaultCleanerBody(emailType, displayName, context),
    }
  }
}

function getDefaultCleanerSubject(emailType: CleanerNurturingEmailType, name: string): string {
  switch (emailType) {
    case 'CLEANER_WELCOME':
      return `Welcome to VillaCare, ${name}!`
    case 'PROFILE_TIPS':
      return `${name}, boost your profile to get more bookings`
    case 'CALENDAR_SYNC_GUIDE':
      return `${name}, connect your calendar for easier scheduling`
    case 'FIRST_BOOKING_GUIDE':
      return `Your first booking - here's how it works`
    case 'SUCCESS_COACH_INTRO':
      return `Congrats ${name}! Your Success Coach is unlocked`
    case 'BOOKING_MANAGEMENT_TIPS':
      return `Pro tips: manage bookings like a pro`
    case 'TEAM_OPPORTUNITY':
      return `${name}, discover team benefits at VillaCare`
    case 'PROMOTE_PROFILE_TIPS':
      return `Get more clients: share your VillaCare profile`
    case 'CLEANER_REACTIVATION':
      return `We miss you, ${name}! Villa owners need you`
    default:
      return `Hello from VillaCare`
  }
}

function getDefaultCleanerBody(emailType: CleanerNurturingEmailType, name: string, context: CleanerContext): string {
  switch (emailType) {
    case 'CLEANER_WELCOME':
      return `Hi ${name},

Welcome to VillaCare! We're thrilled to have you join our network of trusted villa cleaners in Alicante.

Here's what you can do on the platform:

📱 **Your Dashboard** - View bookings, messages, and manage your calendar
⭐ **Your Profile** - Villa owners can see your bio, ratings, and reviews at alicantecleaners.com/${context.slug}
📅 **Calendar Sync** - Connect Google Calendar to manage availability automatically
💬 **WhatsApp Alerts** - Get booking notifications and respond with ACCEPT or DECLINE

Villa owners are looking for reliable cleaners like you. Complete your profile to start receiving bookings!

The VillaCare Team`

    case 'PROFILE_TIPS':
      return `Hi ${name},

Cleaners with complete profiles get up to 3x more booking requests. Here are some quick wins:

${!context.photoUrl ? '📷 **Add a professional photo** - Owners want to see who they\'re welcoming into their home\n' : ''}${!context.bio || context.bio.length < 100 ? '✍️ **Write a compelling bio** - Share your experience, what you love about cleaning, and why owners should choose you\n' : ''}${context.serviceAreaCount < 3 ? '📍 **Add more service areas** - The more areas you cover, the more booking opportunities\n' : ''}${context.languageCount < 2 ? '🌍 **Add languages you speak** - Many villa owners are international\n' : ''}
A strong profile builds trust before you even meet. Take 5 minutes to polish yours!

The VillaCare Team`

    case 'CALENDAR_SYNC_GUIDE':
      return `Hi ${name},

Connecting your Google Calendar makes scheduling effortless:

✅ **Auto-availability** - We'll only show villa owners when you're free
✅ **No double bookings** - Your existing appointments are respected
✅ **Synced both ways** - VillaCare bookings appear in your calendar automatically

It takes just 2 minutes to connect. Here's how:

1. Go to your Dashboard → Profile tab
2. Click "Connect Google Calendar"
3. Sign in with your Google account
4. That's it! Your availability syncs automatically

Your calendar, your control.

The VillaCare Team`

    case 'FIRST_BOOKING_GUIDE':
      return `Hi ${name},

Congratulations on your first booking! Here's how the VillaCare system works:

📱 **Peek-to-Lock** - Hold any booking card for a quick preview. Hold longer to lock it open and see full details.

✅ **Accepting Bookings**
- In the app: Open the booking and tap "Accept"
- Via WhatsApp: Reply "ACCEPT" or "SI" to the notification

❌ **Declining** - If you can't make it, decline promptly so the owner can find another cleaner

✔️ **Completing Jobs** - After the clean, mark it complete in your dashboard. The owner can then leave you a review!

📍 **Access Notes** - Property access details (codes, key locations) only appear within 24 hours of the booking for security.

You've got this! Your first happy customer awaits.

The VillaCare Team`

    case 'SUCCESS_COACH_INTRO':
      return `Hi ${name},

🎉 Amazing work completing your first job! You've unlocked your personal **Success Coach**.

Your Success Coach is an AI assistant that helps you:
- Analyze your profile and suggest improvements
- Track your bookings and earnings
- Get personalized tips to grow your business
- Answer questions about the platform

Find your Success Coach in the dashboard menu. Ask it anything - like "How can I get more bookings?" or "What's my profile score?"

The more you use VillaCare, the smarter your coach becomes. Here's to your success!

The VillaCare Team`

    case 'BOOKING_MANAGEMENT_TIPS':
      return `Hi ${name},

You're getting the hang of VillaCare! Here are some pro tips:

⚡ **Quick Messages** - In the peek modal, use preset messages to quickly communicate with owners (e.g., "On my way!", "Running 10 mins late")

👥 **Team Assignments** - If you're on a team, you can assign overflow bookings to team members when you're too busy

🔄 **Repeat Customers** - Owners who love your work often book again. Keep up the great service and watch your reviews grow!

📊 **Track Your Stats** - Your Promote tab shows profile views, bookings, and earnings. Use it to track your growth.

The best cleaners on VillaCare treat it like a business. You're building something great!

The VillaCare Team`

    case 'TEAM_OPPORTUNITY':
      return `Hi ${name},

Have you considered joining a VillaCare team? Here's why cleaners love teams:

🤝 **Overflow Bookings** - When you're busy, team members can cover. When they're busy, you get their overflow.

📅 **Shared Calendar** - See your whole team's availability at a glance

💰 **Referral Bonuses** - Team leaders earn bonuses when their team members complete bookings

🚀 **Path to Leadership** - Build experience and eventually start your own team

${context.teamId ? 'You\'re already on a team - great choice! Check with your team leader about coverage opportunities.' : 'Browse available teams in your dashboard or ask a team leader for their referral code.'}

Growing together is better than growing alone.

The VillaCare Team`

    case 'PROMOTE_PROFILE_TIPS':
      return `Hi ${name},

Want more bookings? Let's get your profile in front of more villa owners:

📲 **Share on WhatsApp** - Your dashboard has a "Share Profile" button. Send it to your contacts!

📱 **Social Media** - Post your profile link: alicantecleaners.com/${context.slug}

⭐ **Ask for Reviews** - After a great clean, politely ask owners to leave a review. Reviews = trust = more bookings.

🗣️ **Word of Mouth** - Happy owners tell their friends. Exceptional service is your best marketing.

Your profile is your digital business card. The more people see it, the more opportunities come your way!

The VillaCare Team`

    case 'CLEANER_REACTIVATION':
      return `Hi ${name},

It's been a while since we've seen you on VillaCare! We wanted to check in.

Villa owners in ${context.serviceAreaCount > 0 ? 'your service areas are' : 'Alicante are'} actively looking for cleaners right now. Your profile is still live at alicantecleaners.com/${context.slug}

Whether you took a break or life got busy, we're here when you're ready. No pressure - just wanted you to know the opportunity is always open.

Drop by your dashboard anytime to check for booking requests.

Hope to see you soon!

The VillaCare Team`

    default:
      return `Hi ${name},

Thanks for being part of VillaCare. We're here to help you succeed as a villa cleaner in Alicante.

The VillaCare Team`
  }
}

/**
 * Get the CTA URL for each cleaner email type
 */
export function getCleanerCTAUrl(emailType: CleanerNurturingEmailType): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://alicantecleaners.com'
  switch (emailType) {
    case 'CLEANER_WELCOME':
      return `${baseUrl}/dashboard`
    case 'PROFILE_TIPS':
      return `${baseUrl}/dashboard?tab=profile`
    case 'CALENDAR_SYNC_GUIDE':
      return `${baseUrl}/dashboard?tab=profile`
    case 'FIRST_BOOKING_GUIDE':
      return `${baseUrl}/dashboard?tab=bookings`
    case 'SUCCESS_COACH_INTRO':
      return `${baseUrl}/dashboard?tab=success`
    case 'BOOKING_MANAGEMENT_TIPS':
      return `${baseUrl}/dashboard?tab=bookings`
    case 'TEAM_OPPORTUNITY':
      return `${baseUrl}/dashboard?tab=team`
    case 'PROMOTE_PROFILE_TIPS':
      return `${baseUrl}/dashboard?tab=promote`
    case 'CLEANER_REACTIVATION':
      return `${baseUrl}/dashboard`
    default:
      return `${baseUrl}/dashboard`
  }
}

/**
 * Get the CTA button text for each cleaner email type
 */
export function getCleanerCTAText(emailType: CleanerNurturingEmailType): string {
  return CLEANER_EMAIL_TEMPLATES[emailType]?.cta || 'View Dashboard'
}
