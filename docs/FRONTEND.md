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

### Owner Guide Pages

| Route | File | Description |
|-------|------|-------------|
| `/guide` | `app/guide/page.tsx` | How to book a cleaner (English) |
| `/guide/booking` | `app/guide/booking/page.tsx` | How to book a cleaner (ES/EN) |

### Cleaner Guide Pages

| Route | File | Description |
|-------|------|-------------|
| `/join/guide` | `app/join/guide/page.tsx` | Getting started - onboarding walkthrough (ES/EN) |
| `/join/booking-guide` | `app/join/booking-guide/page.tsx` | Managing bookings - peek modal, accept/decline, complete (ES/EN) |
| `/join/team-leader-guide` | `app/join/team-leader-guide/page.tsx` | Team leaders - referral code, applicants, members (ES/EN) |
| `/join/team-guide` | `app/join/team-guide/page.tsx` | Join a team - browse, request, benefits (ES/EN) |
| `/join/profile-guide` | `app/join/profile-guide/page.tsx` | Profile optimization - photos, bio, SEO (ES/EN) |
| `/join/calendar-guide` | `app/join/calendar-guide/page.tsx` | Calendar sync - Google Calendar setup (ES/EN) |

### Guide Screenshot Assets

Screenshots for guide pages are stored in `/public/guides/` organized by flow:

```
/public/guides/
├── 01-cleaner-onboarding/    # Onboarding flow screenshots
│   ├── es/
│   └── en/
├── 02-cleaner-dashboard/     # Dashboard screenshots (8+ per language)
│   ├── es/
│   └── en/
├── 03-booking-management/    # Booking accept/complete flow
│   ├── es/
│   └── en/
├── 05-profile-management/    # Profile editing screenshots
│   ├── es/
│   └── en/
├── 08-team-leader/           # Team Leader Guide screenshots (16 ES, 8 EN)
│   ├── es/
│   │   ├── 01-team-overview.png
│   │   ├── 02-copy-code.png
│   │   ├── 02-referral-code.png
│   │   ├── 03-refer-form.png
│   │   ├── 04-refer-filled.png
│   │   ├── 05-refer-success.png
│   │   ├── 05-team-members.png
│   │   ├── 06-team-members.png
│   │   ├── 07-referral-join-page.png
│   │   ├── 08-new-applicant.png
│   │   ├── 09-applicant-actions.png
│   │   ├── 10-applicant-conversation.png
│   │   ├── 11-conversation-with-actions.png
│   │   └── 12-applicant-accepted.png
│   └── en/
│       ├── 01-team-overview.png
│       ├── 02-referral-code.png
│       ├── 03-refer-form.png
│       ├── 04-refer-filled.png
│       ├── 05-team-members.png
│       └── 07-referral-join-page.png
├── 09-team-member/           # Team Member Guide screenshots (1 per language)
│   ├── es/
│   │   └── 01-team-member-view.png
│   └── en/
│       └── 01-team-member-view.png
└── 12-public-profile/        # Public profile screenshots
    ├── es/
    └── en/
```

Screenshots are captured at iPhone 14 viewport (390×844) for mobile-first presentation.

**Guide Page Components:**
- Phone mockup frame with notch for displaying screenshots
- Language toggle (ES/EN) in header
- Step-by-step sections with alternating layout
- Tip boxes with 💡 icon
- FAQ accordion sections
- CTA button linking to dashboard

### Authentication Pages

| Route | File | Description |
|-------|------|-------------|
| `/login` | `app/login/page.tsx` | Magic link / phone OTP entry |
| `/login/verify` | `app/login/verify/page.tsx` | Check your email confirmation |
| `/signout` | `app/signout/page.tsx` | Sign out page |
| `/onboarding/cleaner` | `app/onboarding/cleaner/page.tsx` | Cleaner signup flow (phone OTP) |
| `/onboarding/cleaner/calendar-callback` | `app/onboarding/cleaner/calendar-callback/page.tsx` | Google Calendar OAuth callback |
| `/onboard/[token]` | `app/onboard/[token]/page.tsx` | Magic link onboarding for new owners |

### Dashboard Pages

| Route | File | Description | Role |
|-------|------|-------------|------|
| `/dashboard` | `app/dashboard/page.tsx` | Cleaner dashboard (tabbed) | CLEANER |
| `/dashboard/account` | `app/dashboard/account/page.tsx` | Cleaner account settings (pause/delete) | CLEANER |
| `/dashboard/availability` | `app/dashboard/availability/page.tsx` | Cleaner availability management | CLEANER |
| `/owner/dashboard` | `app/owner/dashboard/page.tsx` | Owner dashboard (tabbed) | OWNER |
| `/owner/dashboard/account` | `app/owner/dashboard/account/page.tsx` | Owner account settings (pause/delete) | OWNER |
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
1. **Home** - Calendar timeline with all jobs grouped by day, peek-to-lock booking cards
2. **Bookings** - All bookings with filters, assign to team members
3. **Promote** - Stats overview (weekly/monthly/all-time), shareable profile card, WhatsApp share, tips
4. **Messages** - Conversations with owners (auto-translated)
5. **Team** - Team management (Team Leaders only), applicant review
6. **Profile** - Edit profile, settings, Google Calendar sync
7. **Success** - AI Success Coach with profile health, stats, and personalized growth tips

**Navigation:**
- SmartWidget floating button (bottom-right) with context-aware icon
- Tap for quick actions (based on current screen)
- Long-press for full navigation menu
- Swipe-down to dismiss menu

**Peek-to-Lock Booking Cards:**
- Hold 300ms to peek at booking details (release to close)
- Hold 1500ms to lock modal open for interaction
- When locked, shows:
  - Property owner contact with Call button
  - Key holder contact with Call button (if configured)
  - Access notes (JIT - only within 24h of booking)
  - Maps link to property address
  - Quick message presets to owner
  - Accept/Decline (pending) or Mark Complete (confirmed + today)

**Team Tab Features (Team Leaders):**
- View/edit team name and referral code
- Manage team members (remove)
- Review PENDING cleaner applicants with AI-generated summaries
- Accept & activate or decline applicants
- Refer new cleaners to join the team

**Localization:**
- Team tab uses `useLanguage` hook from `language-context` for full i18n support
- Dashboard syncs `cleaner.preferredLanguage` to `LanguageProvider` on initial load
- All Team tab UI strings are translation-ready via the `t()` function

#### Team Tab (Team Leaders)

The Team tab appears for cleaners marked as `teamLeader: true`. Features include:

**Team Management:**
- View/edit team name
- Copy team referral code
- Remove team members
- Refer new cleaners with recommendation notes

**Localization:**
The Team tab is fully localized using the `useLanguage` hook:
```tsx
const { t } = useLanguage()
// Usage: t('team.referralCopied'), t('team.teamMembers'), etc.
```

**Dashboard Language Sync:**
On dashboard load, the cleaner's `preferredLanguage` is synced to the `LanguageProvider`:
```tsx
// Sync language context with cleaner's preferred language
if (cleanerData.cleaner?.preferredLanguage) {
  setLang(cleanerData.cleaner.preferredLanguage)
}
```

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

#### Success Tab (AI Success Coach)

The Success tab provides personalized coaching to help cleaners grow on the platform.

**Gamification States:**
- **Locked/Teaser Mode** (before first completed job):
  - Profile completion progress bar (0-100%)
  - Checklist showing what's missing (photo, bio, areas, etc.)
  - Locked preview: "Complete your first job to unlock your Success Coach!"
  - Each checklist item shows priority (high/medium/low)

- **Unlocked Mode** (after first completed job):
  - Stats overview: Profile score circle, weekly views, completed jobs
  - Personalized greeting from AI coach
  - Full chat interface with quick question buttons
  - Profile health breakdown with suggestions

**Stats Displayed:**
- Profile health score (0-100)
- Profile views this week (from PageView table)
- Total completed jobs
- Personalized improvement tips

**Quick Questions:**
- "How can I get more bookings?"
- "Help me improve my profile"
- "What areas are in demand?"

**File:** `app/dashboard/tabs/success.tsx`

```tsx
const [activeTab, setActiveTab] = useState('home')

return (
  <div className="min-h-screen bg-[#FAFAF8]">
    {/* Tab content */}
    {activeTab === 'home' && <JobsTimeline />}      {/* Calendar view */}
    {activeTab === 'bookings' && <BookingsTab />}
    {activeTab === 'promote' && <PromoteTab />}     {/* Stats & promo tools */}
    {activeTab === 'messages' && <MessagesTab />}
    {activeTab === 'team' && <TeamTab />}
    {activeTab === 'profile' && <ProfileTab />}
    {activeTab === 'success' && <SuccessTab />}     {/* AI Success Coach */}

    {/* SmartWidget navigation (floating button) */}
    <SmartWidget
      currentScreen={activeTab}
      onNavigate={setActiveTab}
      onQuickAction={handleQuickAction}
    />
  </div>
)
```

### Owner Dashboard (`/owner/dashboard`)

**Tabs:**
1. **Home** - Timeline view with JobCards, "I'm Coming Home" for remote owners, Getting Started checklist
2. **Bookings** - All bookings with timeline grouping and peek-to-lock interaction
3. **Messages** - Conversations with cleaners (auto-translated)
4. **Villas** - Property management
5. **Account** - Settings, language preference

**JobCard Features:**
- Same peek-to-lock gesture pattern as cleaner dashboard (300ms peek, 1500ms lock)
- Owner-specific quick actions in locked mode:
  - **Pending**: Message cleaner, Adjust time, Cancel request
  - **Confirmed**: Message cleaner, Adjust time, Add access notes, Cancel
  - **Completed**: Leave review, Book again with same cleaner
- Edit buttons on Access Notes and Special Instructions (opens AI chat with context)
- Skeleton "+" card at top of timeline to trigger new booking via AI

**"I'm Coming Home" Feature:**
- Only shown for REMOTE owners with at least one completed booking
- Allows remote owners to notify cleaner of arrival and request extras (fresh flowers, groceries, linens)
- Opens AI assistant pre-filled with arrival prep context

**Owner Type Detection:**
- New owners asked "One quick question" after first property/booking
- Options: "I visit from abroad" (REMOTE) or "I live here" (RESIDENT)
- Question disappears after answering to free up dashboard space
- Can be repurposed for future nudge-type questions

### Admin Dashboard (`/admin`)

**Mobile-First Unified Feed Design:**

The admin dashboard has been redesigned from a tab-based interface to a unified activity feed with:

- **Live Feed** - Chronological activity stream (bookings, cleaners, owners, reviews)
- **Hamburger Menu** - Drawer navigation to other sections (Cleaners, Owners, Bookings, Reviews, etc.)
- **AI Panel** - Slide-in AI assistant (button in header)
- **Deep Linking** - Share links to specific cards (`?card=booking-xxx`)
- **Search Filter** - Search across all feed items (`?search=elena`)
- **Urgent Filter** - Click "⚡ X need attention" to filter to actionable items

**Card Types in Feed:**
- Booking cards (pending, confirmed, completed)
- Cleaner cards (signup, login, profile updates)
- Owner cards (signup, new properties)
- Review cards (pending moderation)

**Card Interactions (Peek-to-Lock):**
- **300ms hold** - Peek modal with details
- **1500ms hold** - Lock modal open
- **Actions** - Approve, reject, message, login-as, cancel

**Menu Sections:**
1. Live Feed - Default view with unified activity
2. Cleaners - Management, approval, team verification
3. Owners - CRM with notes, booking history
4. Bookings - All bookings with filtering
5. Reviews - Moderation queue
6. Feedback - User feedback tracking
7. Support - AI support conversations
8. Audit Log - Admin action tracking
9. Settings - Platform configuration

**Admin Features:**
- **Impersonation** - Login as any user for support
- **Audit Logging** - All admin actions tracked with timestamps
- **GA4 Real-time** - Live visitor counts (optional integration)
- **Deep Link Sharing** - Copy link button in card modals
- **Search with URL State** - Shareable filtered views

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
| `SupportChatWidget` | `components/support-chat-widget.tsx` | Contextual AI support across platform |
| `OwnerChatWidget` | `components/ai/owner-chat-widget.tsx` | Owner dashboard AI assistant |
| `CleanerChatWidget` | `components/ai/cleaner-chat-widget.tsx` | Cleaner dashboard AI assistant |

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

### Navigation Components

| Component | File | Purpose |
|-----------|------|---------|
| `SmartWidget` | `components/smart-widget/SmartWidget.tsx` | Floating nav button with tap/long-press menus |
| `NavigationMenu` | `components/smart-widget/NavigationMenu.tsx` | Full-screen navigation (long-press) |
| `QuickActionMenu` | `components/smart-widget/QuickActionMenu.tsx` | Context-aware quick actions (tap) |

### Dashboard Tab Components (Cleaner)

| Component | File | Purpose |
|-----------|------|---------|
| `JobsTimeline` | `app/dashboard/components/team-calendar/JobsTimeline.tsx` | Calendar view grouped by day |
| `BookingCard` | `app/dashboard/components/team-calendar/BookingCard.tsx` | Booking card with peek-to-lock |
| `BookingPeekModal` | `app/dashboard/components/team-calendar/BookingPeekModal.tsx` | Quick actions modal (owner call, key holder call, access notes, quick messages) |
| `PromoteTab` | `app/dashboard/tabs/promote.tsx` | Stats and promotional tools |
| `BookingsTab` | `app/dashboard/tabs/bookings.tsx` | Booking list with filters |
| `MessagesTab` | `app/dashboard/tabs/messages.tsx` | Conversation threads with auto-translation and markdown formatting (bold, clickable links) |
| `TeamTab` | `app/dashboard/tabs/team.tsx` | Team management |
| `ProfileTab` | `app/dashboard/tabs/profile.tsx` | Profile editing |
| `SuccessTab` | `app/dashboard/tabs/success.tsx` | AI Success Coach with profile health and growth tips |

### Dashboard Tab Components (Owner)

| Component | File | Purpose |
|-----------|------|---------|
| `OwnerJobsTimeline` | `app/owner/dashboard/components/OwnerJobsTimeline.tsx` | Timeline view with date grouping and skeleton "+" card |
| `OwnerBookingCard` | `app/owner/dashboard/components/OwnerBookingCard.tsx` | JobCard with peek-to-lock gesture for owners |
| `OwnerBookingPeekModal` | `app/owner/dashboard/components/OwnerBookingPeekModal.tsx` | Peek modal with owner-specific actions |
| `NewBookingCard` | `app/owner/dashboard/components/NewBookingCard.tsx` | Skeleton card with "+" to trigger new booking |
| `HomeTab` | `app/owner/dashboard/tabs/home.tsx` | Timeline, "I'm Coming Home", Getting Started |
| `BookingsTab` | `app/owner/dashboard/tabs/bookings.tsx` | Full timeline with all bookings |
| `PropertiesTab` | `app/owner/dashboard/tabs/properties.tsx` | Villa management |
| `AccountTab` | `app/owner/dashboard/tabs/account.tsx` | Profile and settings |

### Universal JobCard Components

| Component | File | Purpose |
|-----------|------|---------|
| `JobCard` | `components/job-card/JobCard.tsx` | Context-aware booking card (owner/cleaner/admin) |
| `JobCardPeekModal` | `components/job-card/JobCardPeekModal.tsx` | Universal peek modal with context-based actions |

These universal components accept a `context` prop to render appropriate UI and actions:
- `context: 'owner'` - Shows cleaner info, edit buttons, cancel/reschedule
- `context: 'cleaner'` - Shows owner info, accept/decline, complete job
- `context: 'admin'` - Shows full details for both parties

### Development Components

| Component | File | Purpose |
|-----------|------|---------|
| `DevUserSwitcher` | `components/dev/DevUserSwitcher.tsx` | Dev-mode user switching toolbar (only in development) |

**DevUserSwitcher Features:**
- Fixed banner at top of screen (development mode only)
- Quick switch between test users (Owner, Clara, Maria, Admin)
- Uses `dev-login` NextAuth provider (bypasses OTP/magic link)
- Quick nav links to each dashboard type
- Shows current user role with colored badge

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
