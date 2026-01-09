# Team Job Assignment System

> Design for handling bookings that involve multiple cleaners from a team. AI suggests team help for large jobs, but the team leader makes the final call.

---

## Overview

When a booking is too large for a single cleaner, the platform supports team coordination. This document outlines the design principles, roles, and flows for multi-cleaner job assignments.

**Key Insight:** The booking always has ONE accountable cleaner (whose profile was booked), but the actual work may involve multiple team members with different roles.

---

## Design Principles

1. **AI suggests, cleaner decides** - AI flags large jobs and suggests team help, but team leader makes the call
2. **On-site lead = completion authority** - Whoever is physically there handles the checklist (keys, locks, alarms, etc.)
3. **Team leader stays accountable** - Owner's relationship is with the team leader, even if they delegate
4. **Existing flow preserved** - Booking summary -> Review -> Message/Accept pattern stays the same
5. **Support network, not just hierarchy** - Help flows both ways (top-down assignment AND bottom-up requests)

---

## Roles on a Job

| Role | Description | Can Mark Complete? |
|------|-------------|-------------------|
| **Accountable** | Business relationship with owner, gets paid, reputation at stake | No (unless also on-site) |
| **On-Site Lead** | Physically present, handles keys/checklist/completion | Yes |
| **Helper** | Additional team member, follows lead | No |

### Role Combinations

In practice, these roles combine in different ways:

| Scenario | Accountable | On-Site Lead | Helpers |
|----------|-------------|--------------|---------|
| Solo job | Cleaner | Cleaner | None |
| Leader delegates | Leader | Team member | Other members |
| Leader joins team | Leader | Leader | Team members |
| Member gets help | Member | Member | Leader + others |

---

## Booking Flow Scenarios

### Scenario 1: Team Leader Gets Big Job (Top-Down)

```
1. Clara (team leader) gets booking on her profile
              ↓
2. AI flags it as large job, suggests team help
              ↓
3. Clara accepts and assigns team members
              ↓
4. Clara designates on-site lead (herself or a team member)
              ↓
5. On-site lead has completion authority
```

### Scenario 2: Team Member Gets Big Job (Bottom-Up)

```
1. Maria (team member) gets booking on her profile
              ↓
2. AI flags it as large job, suggests requesting help
              ↓
3. Maria requests help from her team leader (Clara)
              ↓
4. Clara assigns herself and/or other team members
              ↓
5. Maria stays accountable (her booking), Clara coordinates support
```

### Scenario 3: Independent Cleaner Gets Big Job

```
1. Independent cleaner gets booking
              ↓
2. AI flags it as large job
              ↓
3. Cleaner can request help from any team leader (marketplace/browse)
              ↓
4. Team leader provides support as helper
```

---

## Booking Summary Actions

When cleaner receives booking notification:

**For Team Leaders:**
- Accept Solo
- Accept + Assign Team
- Message Owner
- Decline

**For Team Members / Independents:**
- Accept Solo
- Request Team Help
- Message Owner
- Decline

---

## Calendar Display

| Viewer | What They See |
|--------|---------------|
| On-Site Lead | Full job card with completion access |
| Helper | Job card with "Helping [Lead Name]" badge, no completion |
| Accountable (not on-site) | Oversight view: "Assigned to [Names]" |

### Calendar Visual Indicators

```
┌────────────────────────────────────────┐
│ On-Site Lead View                      │
├────────────────────────────────────────┤
│  10:00 - Deep Clean @ Villa Rosa       │
│  [Complete Job] button visible         │
│  Team: + Maria, + Pedro                │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ Helper View                            │
├────────────────────────────────────────┤
│  10:00 - Deep Clean @ Villa Rosa       │
│  Helping Clara (On-Site Lead)          │
│  No completion button                  │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ Accountable (Remote) View              │
├────────────────────────────────────────┤
│  10:00 - Deep Clean @ Villa Rosa       │
│  Assigned to: Clara (lead), Maria      │
│  Status: In Progress                   │
└────────────────────────────────────────┘
```

---

## Database Model

### BookingAssignment

```prisma
model BookingAssignment {
  id           String   @id @default(cuid())
  bookingId    String
  cleanerId    String
  role         BookingRole  // ACCOUNTABLE, ON_SITE_LEAD, HELPER
  assignedById String?      // Team leader who coordinated
  assignedAt   DateTime @default(now())

  booking      Booking  @relation(fields: [bookingId], references: [id])
  cleaner      Cleaner  @relation(fields: [cleanerId], references: [id])
  assignedBy   Cleaner? @relation("AssignedBy", fields: [assignedById], references: [id])

  @@unique([bookingId, cleanerId])
  @@index([bookingId])
  @@index([cleanerId])
}

enum BookingRole {
  ACCOUNTABLE    // Business owner of the booking
  ON_SITE_LEAD   // Physically present, can complete
  HELPER         // Supporting role
}
```

### Business Rules

| Rule | Enforcement |
|------|-------------|
| Exactly ONE `ACCOUNTABLE` per booking | Application logic (the cleaner whose profile was booked) |
| Exactly ONE `ON_SITE_LEAD` per booking | Database constraint + validation |
| Zero or more `HELPER`s | No constraint |
| Only `ON_SITE_LEAD` can mark completion | API route guard |
| `ACCOUNTABLE` auto-assigned on booking create | Trigger/application logic |

---

## Completion Flow

```
1. On-site lead sees completion checklist
   ├── Keys returned/secured
   ├── Doors/windows locked
   ├── Alarm set (if applicable)
   ├── Any issues noted
              ↓
2. On-site lead marks each item and submits
              ↓
3. Booking status → COMPLETED
              ↓
4. Accountable cleaner gets notified
              ↓
5. Owner gets completion email with review link
```

### Completion Checklist Items

```typescript
interface CompletionChecklist {
  keysSecured: boolean
  doorsLocked: boolean
  windowsClosed: boolean
  alarmSet: boolean | null  // null if no alarm
  issuesNoted: string | null
  photos: string[]  // Before/after (future)
}
```

---

## AI Behavior at Point of Sale

The AI chat assistant on cleaner profiles should:

| Behavior | Description |
|----------|-------------|
| **Assess job size** | Bedrooms, service type, estimated hours |
| **Know team context** | Is this cleaner a leader? Member? Independent? |
| **Flag large jobs** | Jobs that may need help (e.g., 5+ bedrooms, deep clean) |
| **NOT commit to team** | Don't promise team help in chat |
| **Gather info only** | Collect details for booking summary |
| **Defer to cleaner** | Team involvement decided when reviewing booking |

### AI Prompt Guidelines

```
When assessing job size:
- Regular clean for 5+ bedrooms → suggest may need team
- Deep clean for 4+ bedrooms → suggest may need team
- Multiple service areas (pool, garden, etc.) → mention complexity

When flagging large jobs:
- "This looks like a larger job - [Cleaner] will review and
   may coordinate with their team to ensure great coverage."

Do NOT say:
- "We'll send a team"
- "Multiple cleaners will handle this"
- Any commitment about team involvement
```

---

## Notifications

### WhatsApp Templates Needed

| Template | Recipient | Content |
|----------|-----------|---------|
| Team Assignment | Helper | "You've been assigned to help with [Job] on [Date]" |
| Help Request | Team Leader | "[Member] is requesting help with [Job] on [Date]" |
| Job Completed | Accountable | "[Lead] has completed [Job] at [Property]" |

### In-App Notifications

```typescript
// New notification types
enum NotificationType {
  // ... existing types
  TEAM_ASSIGNMENT      // You've been assigned to a job
  HELP_REQUESTED       // Team member requesting help
  HELP_APPROVED        // Your help request was approved
  JOB_COMPLETED_TEAM   // Team job completed by on-site lead
}
```

---

## API Endpoints

### Assignment Management

```
POST   /api/bookings/[id]/assignments
       Create assignment (team leader only)
       Body: { cleanerId, role }

DELETE /api/bookings/[id]/assignments/[cleanerId]
       Remove assignment (team leader only)

PATCH  /api/bookings/[id]/assignments/[cleanerId]
       Update role (e.g., promote helper to on-site lead)
       Body: { role }
```

### Completion

```
POST   /api/bookings/[id]/complete
       Mark job as complete (on-site lead only)
       Body: { checklist: CompletionChecklist }
```

### Help Requests

```
POST   /api/bookings/[id]/request-help
       Request help from team leader
       Body: { message?: string }

POST   /api/bookings/[id]/respond-help
       Approve or decline help request
       Body: { approved: boolean, assignees?: string[] }
```

---

## Migration Path

### Phase 1: Data Model
1. Add `BookingAssignment` model to Prisma schema
2. Add `BookingRole` enum
3. Run migration

### Phase 2: Auto-Assignment
1. On booking create, auto-create `ACCOUNTABLE` assignment
2. For solo jobs, also set as `ON_SITE_LEAD`

### Phase 3: Team Assignment UI
1. Add "Assign Team" option to booking acceptance flow
2. Team leader can select members and designate on-site lead

### Phase 4: Calendar Integration
1. Show assigned jobs on helper calendars
2. Visual indicators for role
3. Completion restricted to on-site lead

### Phase 5: Help Request Flow
1. "Request Help" option for team members
2. Team leader approval flow
3. Notifications for all parties

---

## Related Documentation

- [Database Schema](./DATABASE.md) - Team and Cleaner models
- [Architecture](./ARCHITECTURE.md) - System design overview
- [API Reference](./API.md) - Full endpoint documentation
- [AI Sales Assistant](./AI-SALES-ASSISTANT.md) - Public chat behavior
