# Frontend Architecture

## Executive Summary

VillaCare's frontend is built with **Next.js 14 App Router** using **React Server Components** where possible. The UI is styled with **Tailwind CSS** and follows a mobile-first design philosophy.

**Key Characteristics:**
- Mobile-first responsive design
- Server components for SEO and performance
- Client components for interactivity
- Warm, Mediterranean color palette
- Password-free authentication

---

## Page Structure

### Public Pages

| Route | File | Description |
|-------|------|-------------|
| `/` | `app/page.tsx` | Owner landing page with cleaner directory |
| `/join` | `app/join/page.tsx` | Cleaner recruitment landing page |
| `/about` | `app/about/page.tsx` | Origin story and team |
| `/[slug]` | `app/[slug]/page.tsx` | Public cleaner profile |
| `/[slug]/booking` | `app/[slug]/booking/page.tsx` | 4-step booking flow |
| `/privacy` | `app/privacy/page.tsx` | Privacy policy |
| `/terms` | `app/terms/page.tsx` | Terms of service |

### Authentication Pages

| Route | File | Description |
|-------|------|-------------|
| `/login` | `app/login/page.tsx` | Magic link / phone OTP entry |
| `/login/verify` | `app/login/verify/page.tsx` | Check your email confirmation |
| `/onboarding/cleaner` | `app/onboarding/cleaner/page.tsx` | Cleaner signup flow (phone OTP) |
| `/onboard/[token]` | `app/onboard/[token]/page.tsx` | Magic link onboarding for new owners |

### Dashboard Pages

| Route | File | Description | Role |
|-------|------|-------------|------|
| `/dashboard` | `app/dashboard/page.tsx` | Cleaner dashboard (tabbed) | CLEANER |
| `/owner/dashboard` | `app/owner/dashboard/page.tsx` | Owner dashboard (tabbed) | OWNER |
| `/admin` | `app/admin/page.tsx` | Admin dashboard (tabbed) | ADMIN |

---

## Homepage (`/`)

### Structure

```
┌─────────────────────────────────────────────┐
│  Header (Logo, Language, Login/Dashboard)    │
├─────────────────────────────────────────────┤
│  Hero Section                                │
│  "Your villa, ready when you arrive"        │
├─────────────────────────────────────────────┤
│  Problem → Solution Grid                     │
│  (4 pain points with VillaCare solutions)   │
├─────────────────────────────────────────────┤
│  How It Works (3 steps)                     │
├─────────────────────────────────────────────┤
│  Cleaner Directory                          │
│  [Area Filter Tabs]                         │
│  [Cleaner Card] [Cleaner Card]...           │
├─────────────────────────────────────────────┤
│  Social Proof / Activity Feed               │
├─────────────────────────────────────────────┤
│  Trust Signals                              │
├─────────────────────────────────────────────┤
│  Footer (Links, Privacy, Terms)             │
└─────────────────────────────────────────────┘
```

### Cleaner Directory

Server-side rendered list with client-side filtering:

```tsx
// Fetch cleaners server-side
const { cleaners, areas } = await fetch('/api/cleaners').then(r => r.json())

// Client-side filter
const [selectedArea, setSelectedArea] = useState('all')
const filtered = selectedArea === 'all'
  ? cleaners
  : cleaners.filter(c => c.serviceAreas.includes(selectedArea))
```

### Activity Feed Component

Real-time social proof ticker showing recent platform activity:

```tsx
// components/activity-feed.tsx
const activities = [
  { type: 'booking_completed', area: 'San Juan', timeAgo: '2 hours ago' },
  { type: 'review_added', rating: 5, cleanerName: 'Clara', timeAgo: '4 hours ago' },
]

// Auto-rotates every 4 seconds with fade animation
```

---

## Cleaner Profile (`/[slug]`)

### Structure

```
┌─────────────────────────────────────────────┐
│  Back Arrow                                  │
├─────────────────────────────────────────────┤
│  Profile Header                              │
│  [Photo] Name  ★ 4.8 (12 reviews)           │
│  📍 Alicante City, San Juan                 │
├─────────────────────────────────────────────┤
│  Bio                                         │
│  "Professional cleaner with 5 years..."     │
├─────────────────────────────────────────────┤
│  Services & Pricing                          │
│  ┌─────────────────────────────────────────┐│
│  │ Regular Clean    3 hrs    €54          ││
│  │ Deep Clean       5 hrs    €90          ││
│  │ Arrival Prep     4 hrs    €72          ││
│  └─────────────────────────────────────────┘│
├─────────────────────────────────────────────┤
│  Reviews                                     │
│  [Review Card] [Review Card]...             │
├─────────────────────────────────────────────┤
│  [Book Now Button - Fixed Bottom]           │
└─────────────────────────────────────────────┘
```

### Dynamic SEO

```tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const { cleaner } = await fetch(`/api/cleaners/${params.slug}`)

  return {
    title: `${cleaner.name} - Professional Cleaner in ${cleaner.serviceAreas[0]}`,
    description: cleaner.bio.slice(0, 160),
    openGraph: {
      images: [cleaner.photo],
    },
  }
}
```

---

## Booking Flow (`/[slug]/booking`)

### 4-Step Wizard

```
Step 1: Service Selection
├── Regular Clean (3 hrs)
├── Deep Clean (5 hrs)
└── Arrival Prep (4 hrs)

Step 2: Date & Time
├── Calendar date picker
└── Time slot selection

Step 3: Property Details
├── Address input
├── Bedrooms count
└── Special instructions

Step 4: Contact & Confirm
├── Name, Email, Phone (guests)
└── Summary and confirm button
```

### State Management

```tsx
const [step, setStep] = useState(1)
const [booking, setBooking] = useState({
  service: null,
  date: null,
  time: null,
  property: { address: '', bedrooms: 2 },
  contact: { name: '', email: '', phone: '' }
})

// Navigate with validation
const nextStep = () => {
  if (validateCurrentStep()) {
    setStep(s => s + 1)
  }
}
```

---

## Dashboards

### Cleaner Dashboard (`/dashboard`)

**Tabs:**
1. **Home** - Stats overview, pending bookings
2. **Bookings** - All bookings with filters
3. **Messages** - Conversations with owners
4. **Team** - Team management (Team Leaders only)
5. **Profile** - Edit profile, settings

#### Team Tab (Team Leaders)

The Team tab appears for cleaners marked as `teamLeader: true`. Features include:

**Team Management:**
- View/edit team name
- Copy team referral code
- Remove team members

**Applicant Review:**
- View PENDING cleaners who chatted via profile page
- See AI-generated conversation summary
- Read full conversation history
- Contact applicant via WhatsApp
- Accept & Activate or Decline applicants

**Applicant Chat Flow:**
1. PENDING cleaner visits team leader's profile (`/[slug]?applicant={id}`)
2. AI chat widget appears for team application
3. AI gathers info: experience, transport, languages, availability, review links
4. Conversation stored with auto-generated summary (every 4 messages)
5. Team leader reviews in dashboard and decides

```tsx
const [activeTab, setActiveTab] = useState('home')

return (
  <div className="min-h-screen bg-[#FAFAF8]">
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t">
      {tabs.map(tab => (
        <button
          onClick={() => setActiveTab(tab.id)}
          className={activeTab === tab.id ? 'text-[#C4785A]' : 'text-gray-400'}
        >
          {tab.icon}
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>

    {activeTab === 'home' && <HomeTab />}
    {activeTab === 'bookings' && <BookingsTab />}
    {/* ... */}
  </div>
)
```

### Owner Dashboard (`/owner/dashboard`)

**Tabs:**
1. **Home** - Stats, upcoming bookings
2. **Bookings** - All bookings with status
3. **Messages** - Conversations with cleaners
4. **Villas** - Property management
5. **Account** - Settings, language preference

### Admin Dashboard (`/admin`)

**Tabs:**
1. **Overview** - Platform KPIs
2. **Cleaners** - Approval queue, management
3. **Reviews** - Moderation queue
4. **Feedback** - User feedback
5. **Support** - Support conversations
6. **AI Chat** - Admin AI assistant

---

## Components

### Global Components

| Component | File | Purpose |
|-----------|------|---------|
| `LanguageSelector` | `components/language-selector.tsx` | Choose preferred language |
| `LanguageSwitcher` | `components/language-switcher.tsx` | Quick language toggle |
| `FeedbackWidget` | `components/feedback-widget.tsx` | Submit feedback button |
| `Providers` | `components/providers.tsx` | NextAuth + React Query providers |

### AI Components

| Component | File | Purpose |
|-----------|------|---------|
| `ChatWidget` | `components/ai/chat-widget.tsx` | In-dashboard AI assistant |
| `PublicChatWidget` | `components/ai/public-chat-widget.tsx` | Pre-signup AI chat |
| `OnboardingChatWidget` | `components/ai/onboarding-chat-widget.tsx` | AI-guided booking |
| `ApplicantChatWidget` | `components/ai/applicant-chat-widget.tsx` | Team application chat for PENDING cleaners |

#### Applicant Chat Widget

Shown on team leader profile pages when `?applicant={id}` parameter is present:

```tsx
// Triggers on /[slug]?applicant=xyz
{applicantId && <ApplicantChatWidget teamLeaderSlug={slug} applicantId={applicantId} />}
```

**AI Conversation Goals:**
- Cleaning experience and property types
- Motivation for joining VillaCare
- Availability and schedule flexibility
- Transport availability
- Languages spoken
- Existing review links (Google, TripAdvisor, Airbnb)

**Auto-Summary:** Generated every 4 messages for team leader review.

### UI Components

| Component | File | Purpose |
|-----------|------|---------|
| `Toast` | `components/ui/toast.tsx` | Notification toasts |
| `PhoneMockup` | `components/ui/phone-mockup.tsx` | Phone frame for screenshots |
| `SchemaScript` | `components/seo/schema-script.tsx` | JSON-LD structured data |

---

## Design System

### Color Palette

```css
/* Primary Brand (Terracotta) */
--terracotta: #C4785A;
--terracotta-hover: #B56A4F;

/* Neutrals */
--text-primary: #1A1A1A;
--text-secondary: #6B6B6B;
--text-muted: #9B9B9B;
--border: #DEDEDE;
--border-light: #EBEBEB;
--bg-light: #F5F5F3;
--bg-page: #FAFAF8;

/* Status */
--success: #2E7D32;
--success-bg: #E8F5E9;
--warning: #E65100;
--warning-bg: #FFF3E0;
--error: #C75050;
--error-bg: #FFEBEE;

/* Accent */
--terracotta-tint: #FFF8F5;
```

### Typography

```css
/* System font stack */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

/* Sizes */
--text-xs: 12px;
--text-sm: 14px;
--text-base: 16px;  /* Minimum for mobile inputs */
--text-lg: 18px;
--text-xl: 20px;
--text-2xl: 24px;
--text-3xl: 30px;
```

### Component Patterns

**Primary Button:**
```tsx
<button className="
  w-full
  bg-[#1A1A1A]
  text-white
  py-3.5
  rounded-xl
  font-medium
  active:scale-[0.98]
  transition-all
">
  Book Now
</button>
```

**Terracotta Button:**
```tsx
<button className="
  bg-[#C4785A]
  text-white
  px-4 py-2
  rounded-lg
  text-sm font-medium
  hover:bg-[#B56A4F]
">
  Accept
</button>
```

**Card:**
```tsx
<div className="
  bg-white
  rounded-2xl
  p-4
  border border-[#EBEBEB]
">
  {/* Content */}
</div>
```

**Input Field:**
```tsx
<input className="
  w-full
  px-4 py-3.5
  rounded-xl
  border border-[#DEDEDE]
  focus:border-[#1A1A1A]
  focus:outline-none
  text-base  /* Prevents iOS zoom */
"/>
```

**Filter Pill:**
```tsx
<button className={`
  px-4 py-2
  rounded-full
  text-sm font-medium
  ${isActive
    ? 'bg-[#1A1A1A] text-white'
    : 'bg-[#F5F5F3] text-[#6B6B6B]'
  }
`}>
  San Juan
</button>
```

---

## Mobile Considerations

### Touch Targets

All interactive elements have minimum 44px touch target:

```tsx
<button className="min-h-[44px] min-w-[44px]">
```

### Safe Areas

iOS notch and home bar handling:

```tsx
<div className="pb-safe">  {/* Bottom navigation */}
  {/* Uses env(safe-area-inset-bottom) */}
</div>
```

### Viewport Width

Minimum supported width: **320px** (iPhone SE)

```css
@media (min-width: 320px) {
  /* Base styles */
}
```

### iOS Input Zoom Prevention

Inputs are minimum 16px to prevent auto-zoom:

```tsx
<input className="text-base" />  /* 16px */
```

---

## State Management

### Authentication State

Via NextAuth `useSession()`:

```tsx
const { data: session, status } = useSession()

if (status === 'loading') return <Skeleton />
if (!session) return <LoginPrompt />

return <Dashboard user={session.user} />
```

### Language State

Via React Context:

```tsx
// components/language-context.tsx
export const LanguageContext = createContext({
  language: 'en',
  setLanguage: (lang: string) => {},
})

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en')

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}
```

### Server State

Via React Query (planned) or simple fetch + useState:

```tsx
const [bookings, setBookings] = useState([])
const [loading, setLoading] = useState(true)

useEffect(() => {
  fetch('/api/dashboard/cleaner/bookings')
    .then(r => r.json())
    .then(data => {
      setBookings(data.bookings)
      setLoading(false)
    })
}, [])
```

---

## Performance

### Server Components

Non-interactive pages use Server Components:

```tsx
// app/[slug]/page.tsx - Server Component
export default async function CleanerProfile({ params }) {
  const cleaner = await db.cleaner.findUnique({
    where: { slug: params.slug }
  })

  return <CleanerProfileUI cleaner={cleaner} />
}
```

### Client Components

Interactive elements marked explicitly:

```tsx
'use client'

export function BookingWizard({ cleaner }) {
  const [step, setStep] = useState(1)
  // ...
}
```

### Image Optimization

Using Next.js Image component:

```tsx
import Image from 'next/image'

<Image
  src={cleaner.photo}
  alt={cleaner.name}
  width={80}
  height={80}
  className="rounded-full"
  priority={isAboveFold}
/>
```

---

## SEO

### Structured Data

```tsx
// components/seo/schema-script.tsx
export function CleanerSchema({ cleaner }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: cleaner.name,
    description: cleaner.bio,
    areaServed: cleaner.serviceAreas,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: cleaner.rating,
      reviewCount: cleaner.reviewCount,
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
```

### Meta Tags

```tsx
export const metadata: Metadata = {
  title: 'VillaCare - Villa Cleaning in Alicante',
  description: 'Find trusted cleaners for your villa in Alicante, Spain.',
  openGraph: {
    title: 'VillaCare',
    description: 'Villa cleaning made easy',
    images: ['/og-image.png'],
  },
}
```

---

## Accessibility

### Keyboard Navigation

All interactive elements are focusable:

```tsx
<button
  onClick={handleClick}
  onKeyDown={e => e.key === 'Enter' && handleClick()}
  tabIndex={0}
>
```

### ARIA Labels

```tsx
<button aria-label="Accept booking">
  <CheckIcon />
</button>
```

### Color Contrast

All text meets WCAG AA standards:
- Primary text (#1A1A1A) on white: 15.1:1
- Secondary text (#6B6B6B) on white: 5.3:1
- Terracotta (#C4785A) on white: 3.8:1 (decorative use only)

---

## Error Handling

### Error Boundaries

```tsx
'use client'

export function ErrorBoundary({ error, reset }) {
  return (
    <div className="text-center py-12">
      <h2>Something went wrong</h2>
      <button onClick={reset}>Try again</button>
    </div>
  )
}
```

### Loading States

```tsx
export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/2 mb-4" />
      <div className="h-4 bg-gray-200 rounded w-full mb-2" />
      <div className="h-4 bg-gray-200 rounded w-3/4" />
    </div>
  )
}
```

### Empty States

```tsx
{bookings.length === 0 && (
  <div className="text-center py-12">
    <CalendarIcon className="mx-auto h-12 w-12 text-gray-300" />
    <p className="mt-4 text-gray-500">No bookings yet</p>
    <Link href="/" className="mt-4 text-[#C4785A]">
      Browse cleaners
    </Link>
  </div>
)}
```
