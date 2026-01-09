# Screenshot Documentation Notes

## Captured Screenshots (Spanish)

### Flow 3: Booking Management (`03-booking-management/es/`)
- [x] `01-pending-booking-card.png` - Dashboard with pending booking visible
- [x] `02-peek-unlocked-top.png` - Peek modal top (service, date, address, Maps link)
- [x] `03-peek-unlocked-bottom.png` - Peek modal bottom (owner, keyholder, access notes, WhatsApp actions)

### Flow 5: Profile Management (`05-profile-management/es/`)
- [x] `01-profile-overview.png` - Profile tab main view
- [x] `02-profile-settings.png` - Settings options scrolled view
- [x] `03-edit-profile-modal.png` - Edit name/bio modal
- [x] `04-edit-pricing.png` - Update hourly rate modal
- [x] `05-edit-areas.png` - Service areas selection modal

### Flow 11: Account Settings (`11-account-settings/es/`)
- [x] `01-account-overview.png` - Journey stats, pause/delete options

### Flow 12: Public Profile (`12-public-profile/es/`)
- [x] `01-profile-hero.png` - Top section with photo, name, badges
- [x] `02-services-section.png` - Services with pricing
- [x] `03-reviews-section.png` - Customer reviews
- [x] `04-ai-chat-widget.png` - AI assistant chat open

---

## UI Notes

### Complete Button Location
The "Mark as Complete" button appears in the peek modal, but ONLY when:
1. Booking status is **Confirmed** (not pending)
2. Booking date is **TODAY**

This is defined in `BookingPeekModal.tsx:314`:
```typescript
const canComplete = isConfirmed && isToday(booking.date)
```

If testing, you need to have a confirmed booking for today's date to see the Complete button.

---

## Still Needed

### Flow 9: Team Member Guide (requires login as Maria)
Need to logout Clara and login as Maria (+34623456789) to capture:
- Independent cleaner view (before joining team)
- Browse teams interface
- Request to join flow
- Team member view (after joining)

### Translation Issues Found
The following strings are still in English and need Spanish translations:
- "Your booking page"
- "View page" / "Share link"
- "Preferred Language"
- "Messages from owners will be translated to this language"
- "Edit profile" / "Update phone" / "Update pricing" etc.
- "Hold for details" on booking cards
- Service names (Regular Clean, Deep Clean, Arrival Prep)

---

## How to Capture Long-Press Screenshots

To capture the peek modal screenshots manually:

1. Open dashboard as Clara: http://localhost:3000/dashboard
2. Find a pending booking card (orange "Pending" badge)
3. Press and HOLD on the card for ~1.5 seconds
4. The peek modal will appear with a progress ring
5. Keep holding until the ring completes (locks the modal open)
6. Take screenshot, then release

The modal shows:
- Booking details (service, time, price)
- Owner contact info (phone number)
- Keyholder info (if property has one)
- Quick action buttons (WhatsApp messages)
- Accept/Decline buttons (for pending bookings)
- Mark Complete button (for confirmed bookings)
