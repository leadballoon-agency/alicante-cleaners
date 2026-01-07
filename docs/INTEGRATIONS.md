# External Integrations

## Executive Summary

VillaCare integrates with **5 external services** to deliver a complete platform experience:

| Service | Purpose | Cost Model |
|---------|---------|------------|
| **Twilio** | WhatsApp Business messaging | Per message (~$0.005) |
| **OpenAI** | Translation, AI chat | Per token (~$0.15/1M) |
| **Anthropic** | Admin AI assistant | Per token (~$0.25/1M) |
| **Resend** | Magic link emails | Free tier available |
| **Neon** | PostgreSQL database | Free tier available |

---

## Twilio WhatsApp Business

### Purpose

WhatsApp is the primary communication channel in Spain. We use it for:
- OTP codes during cleaner onboarding
- Booking notifications to cleaners
- Booking confirmations to owners
- Accepting/declining bookings via reply

### Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   VillaCare │───▶│   Twilio    │───▶│  WhatsApp   │
│   Server    │◀───│   API       │◀───│   Users     │
└─────────────┘    └─────────────┘    └─────────────┘
      │
      └── Webhook: /api/webhooks/twilio
```

### Configuration

**Environment Variables:**
```env
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_NUMBER=whatsapp:+your_number_here
```

**Webhook URL (configure in Twilio console):**
```
https://alicantecleaners.com/api/webhooks/twilio
```

### Content Templates

WhatsApp Business requires pre-approved templates for business-initiated messages:

| Template | Content SID | Purpose |
|----------|-------------|---------|
| OTP Code | `HX1bf4d7bc921048c623fa47605c777ce1` | Send verification code |
| New Booking | `HX471e05200d0c4dfd136550601d4dd703` | Notify cleaner of booking |

**Template Variables:**
```
OTP Template:
  {{1}} = 6-digit code

New Booking Template:
  {{1}} = Owner name
  {{2}} = Date
  {{3}} = Time
  {{4}} = Service - Price
  {{5}} = Address
```

### Code Reference (lib/whatsapp.ts)

**Send OTP:**
```typescript
export async function sendOTP(
  phone: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  const formattedTo = phone.startsWith('whatsapp:') ? phone : `whatsapp:${phone}`

  const message = await client.messages.create({
    from: whatsappNumber,
    to: formattedTo,
    contentSid: 'HX1bf4d7bc921048c623fa47605c777ce1',
    contentVariables: JSON.stringify({ '1': code }),
  })

  return { success: true }
}
```

**Send Booking Notification:**
```typescript
export async function notifyCleanerNewBooking(
  phone: string,
  details: {
    ownerName: string
    date: string
    time: string
    address: string
    service: string
    price: string
  }
): Promise<{ success: boolean; error?: string }> {
  const message = await client.messages.create({
    from: whatsappNumber,
    to: `whatsapp:${phone}`,
    contentSid: 'HX471e05200d0c4dfd136550601d4dd703',
    contentVariables: JSON.stringify({
      '1': details.ownerName,
      '2': details.date,
      '3': details.time,
      '4': `${details.service} - ${details.price}`,
      '5': details.address,
    }),
  })

  return { success: true }
}
```

### Webhook Handler (app/api/webhooks/twilio/route.ts)

Handles incoming WhatsApp messages:

```typescript
export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const from = formData.get('From') as string  // 'whatsapp:+447...'
  const body = formData.get('Body') as string

  // Parse phone and find cleaner
  const phone = from.replace('whatsapp:', '')
  const cleaner = await db.cleaner.findFirst({
    where: { user: { phone: { contains: phone.slice(-9) } } }
  })

  // Handle commands
  if (body.toUpperCase() === 'ACCEPT') {
    // Accept most recent pending booking
    await db.booking.update({
      where: { id: pendingBooking.id },
      data: { status: 'CONFIRMED' }
    })
    // Notify owner via WhatsApp
  }

  return new NextResponse('OK', { status: 200 })
}
```

### Supported Commands

| Command | Action |
|---------|--------|
| `ACCEPT`, `YES`, `SI` | Accept pending booking |
| `DECLINE`, `NO` | Decline pending booking |
| `HELP`, `AYUDA` | Show available commands |

---

## OpenAI (Translation & Chat)

### Purpose

OpenAI GPT-4o-mini handles:
- **Language detection** - Identify message language
- **Translation** - Convert between 7 supported languages
- **AI Chat** - Owner/cleaner assistant conversations

### Configuration

**Environment Variables:**
```env
OPENAI_API_KEY=sk-...
```

### Supported Languages

| Code | Language |
|------|----------|
| en | English |
| es | Spanish |
| de | German |
| fr | French |
| nl | Dutch |
| it | Italian |
| pt | Portuguese |

### Code Reference (lib/translate.ts)

**Detect Language:**
```typescript
export async function detectLanguage(text: string): Promise<LanguageCode> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'Respond with ONLY the ISO 639-1 language code (e.g., "en", "es").'
      },
      { role: 'user', content: text }
    ],
    max_tokens: 5,
    temperature: 0,
  })

  return response.choices[0]?.message?.content?.trim() as LanguageCode
}
```

**Translate Text:**
```typescript
export async function translateText(
  text: string,
  fromLang: LanguageCode,
  toLang: LanguageCode
): Promise<string> {
  if (fromLang === toLang) return text

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `Translate from ${fromLang} to ${toLang}.
                  Keep translations natural and conversational.
                  Preserve names and addresses exactly.`
      },
      { role: 'user', content: text }
    ],
    max_tokens: 1000,
    temperature: 0.3,
  })

  return response.choices[0]?.message?.content?.trim() || text
}
```

### Message Translation Flow

```
1. Owner sends message in English
2. detectLanguage() → "en"
3. Get recipient's preferredLanguage → "es"
4. translateText("Hello", "en", "es") → "Hola"
5. Store both versions in Message table
6. Cleaner sees Spanish, can toggle "Show original"
```

### Cost Estimation

- Detection: ~10 tokens per message
- Translation: ~50-100 tokens per message
- At GPT-4o-mini rates (~$0.15/1M input, $0.60/1M output)
- ~$0.0001 per message translated

---

## Anthropic Claude (Admin AI)

### Purpose

Claude handles sophisticated admin tasks requiring reasoning:
- Query platform statistics
- Manage cleaners and bookings
- Execute database operations via tool use
- Answer admin questions

### Configuration

**Environment Variables:**
```env
ANTHROPIC_API_KEY=sk-ant-...
```

### Model Selection

| Model | Use Case |
|-------|----------|
| claude-3-haiku | Fast queries, simple tasks |
| claude-3-sonnet | Complex reasoning (default) |

### Admin Agent (lib/ai/admin-agent.ts)

The admin agent has access to database tools:

```typescript
const tools = [
  {
    name: 'get_platform_stats',
    description: 'Get current platform statistics',
    input_schema: { type: 'object', properties: {} }
  },
  {
    name: 'list_cleaners',
    description: 'List cleaners with optional status filter',
    input_schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['ACTIVE', 'PENDING', 'SUSPENDED'] }
      }
    }
  },
  {
    name: 'update_cleaner_status',
    description: 'Approve or suspend a cleaner',
    input_schema: {
      type: 'object',
      properties: {
        cleanerId: { type: 'string' },
        status: { type: 'string', enum: ['ACTIVE', 'SUSPENDED'] }
      },
      required: ['cleanerId', 'status']
    }
  },
  // ... more tools
]
```

### Tool Execution Flow

```
1. Admin: "How many bookings this week?"
2. Claude analyzes request
3. Claude calls get_platform_stats tool
4. Tool returns: { bookingsThisWeek: 12, revenue: 648 }
5. Claude formats response: "12 bookings this week (€648)"
```

---

## Resend (Email)

### Purpose

Resend handles transactional email:
- Magic link authentication
- (Planned) Booking confirmations
- (Planned) Review requests

### Configuration

**Environment Variables:**
```env
RESEND_API_KEY=re_...
EMAIL_FROM=VillaCare <noreply@alicantecleaners.com>
```

**DNS Records (alicantecleaners.com):**
- SPF record configured
- DKIM record configured
- Domain verified

### Code Reference (lib/auth.ts)

**Magic Link Email:**
```typescript
EmailProvider({
  from: 'VillaCare <noreply@alicantecleaners.com>',
  sendVerificationRequest: async ({ identifier: email, url }) => {
    await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Sign in to VillaCare',
      html: `
        <div style="max-width: 400px; margin: 0 auto;">
          <h1>Sign in to VillaCare</h1>
          <p>Click the button below to sign in:</p>
          <a href="${url}" style="background: #1A1A1A; color: white; padding: 14px 24px;">
            Sign In
          </a>
        </div>
      `
    })
  }
})
```

---

## Neon PostgreSQL

### Purpose

Neon provides serverless PostgreSQL:
- Scales to zero (cost-effective)
- Connection pooling built-in
- Branching for development

### Configuration

**Environment Variables:**
```env
DATABASE_URL=postgresql://user:pass@ep-xxx.eu-central-1.aws.neon.tech/villacare?sslmode=require
```

### Connection Pooling

Neon automatically pools connections. The Prisma client uses a singleton pattern:

```typescript
// lib/db.ts
const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const db = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}
```

---

## Google Calendar (OAuth)

### Purpose

Optional calendar sync for cleaners:
- Read existing calendar events
- Show availability based on Google Calendar
- Sync bookings to Google Calendar (planned)

### Configuration

**Environment Variables:**
```env
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...
```

**OAuth Scopes:**
```
openid
email
profile
https://www.googleapis.com/auth/calendar.readonly
```

### Flow

```
1. Cleaner clicks "Connect Google Calendar"
2. Redirect to Google OAuth consent
3. User grants calendar.readonly access
4. Callback stores refresh_token in Account table
5. Cleaner.googleCalendarConnected = true
6. Availability API queries Google Calendar
```

---

## Vercel (Hosting & Cron)

### Purpose

Vercel provides:
- Edge network CDN
- Serverless function execution
- Cron job scheduling
- Auto-deploy from GitHub

### Cron Jobs

**vercel.json:**
```json
{
  "crons": [
    {
      "path": "/api/cron/booking-reminders",
      "schedule": "0 * * * *"
    }
  ]
}
```

**Booking Reminders Job:**
- Runs every hour
- Sends reminder at 1 hour
- Escalates to team at 2 hours
- Auto-declines at 6 hours

### Environment Variables (Vercel Dashboard)

All sensitive keys stored in Vercel environment settings:
- DATABASE_URL
- NEXTAUTH_SECRET
- TWILIO_*
- OPENAI_API_KEY
- ANTHROPIC_API_KEY
- RESEND_API_KEY

---

## Integration Health Checks

### Monitoring Endpoints (Planned)

```
GET /api/health/twilio    → Test WhatsApp connectivity
GET /api/health/openai    → Test translation API
GET /api/health/database  → Test Neon connection
```

### Error Handling

All integrations follow the same pattern:

```typescript
try {
  const result = await externalService.call()
  return { success: true, data: result }
} catch (error) {
  console.error('Service error:', error)
  return {
    success: false,
    error: error instanceof Error ? error.message : 'Unknown error'
  }
}
```

### Fallback Behavior

| Service | Fallback |
|---------|----------|
| Twilio | Log message, continue without notification |
| OpenAI | Return original text without translation |
| Resend | Throw error (critical for auth) |
| Neon | Service unavailable |

---

## Cost Summary (Estimated Monthly)

| Service | Free Tier | Usage | Est. Cost |
|---------|-----------|-------|-----------|
| Twilio | $15 credit | ~500 messages | $2.50 |
| OpenAI | - | ~10K translations | $1.50 |
| Anthropic | - | ~1K admin queries | $0.50 |
| Resend | 3K emails/mo | ~500 emails | Free |
| Neon | 10GB storage | ~100MB | Free |
| Vercel | Hobby tier | - | Free |

**Total estimated: ~$5/month at beta scale**

---

## Security Considerations

1. **API Keys** - All stored in Vercel environment variables, never in code
2. **Webhook Validation** - Twilio webhooks should be validated (TODO)
3. **Rate Limiting** - Rely on Vercel defaults (TODO: Add custom limits)
4. **Data Privacy** - Message content processed by OpenAI/Anthropic (documented in privacy policy)
