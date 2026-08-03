# WhatsApp / Twilio Recovery Runbook

> **Status as of 3 Aug 2026:** WhatsApp sender `+447414265007` is **OFFLINE** — disabled by Meta. Booking notifications have been failing silently since ~12 Jun 2026. Logins are unaffected. An **SMS fallback is now live** (see §1). This runbook covers the immediate mitigation and the two paths to restore WhatsApp.

---

## The diagnosis (verified against the live Twilio account)

| Thing | Status | Detail |
|-------|--------|--------|
| Twilio account `AC6fbc…` | ✅ Active, Full (paid) | Not a trial |
| WhatsApp sender `whatsapp:+447414265007` | ❌ **OFFLINE** | Display name "VillaCare - Alicante", WABA `810954628588086`, sender SID `XE894817963d61b8ee0fc775c183355ea3` |
| — offline reason **63112** | | *"The Meta and/or WhatsApp Business Accounts connected to this Sender were disabled by Meta"* |
| — offline reason **410** | | *"Something went wrong. Please create a support ticket"* |
| WhatsApp sends | ❌ 100% failing | Every message errors **63002** since at least 12 Jun 2026 |
| Login / OTP (Twilio **Verify** `VA7f30…`, SMS) | ✅ Working | Independent of the WABA — nobody was locked out |
| 4× UK numbers on account | ✅ All SMS-capable | Incl. `+447414265007` itself |

**Root cause:** Meta disabled the WABA (error **63112**) — a business-verification lapse, policy strike, or billing issue on the Meta side. It is **not** a phone/app conflict: `+447414265007` is a pure Twilio virtual number and is not registered in any WhatsApp app. (Mark separately runs a **different SIM/number** on the WhatsApp Business _app_ as a manual stopgap while this is down — that number is unrelated to the Twilio sender.) Fix is in Meta Business Manager + a Twilio ticket (see §3).

---

## 1. Immediate mitigation — SMS fallback (DONE in code)

Implemented in `lib/whatsapp.ts`:

- **`WHATSAPP_ENABLED`** env flag (default `true`). When `false`, all booking notifications skip WhatsApp and go straight to **SMS**. This is deterministic — it doesn't rely on catching WhatsApp's *asynchronous* failures (Meta accepts the message, then drops it, so a `try/catch` alone can't see it).
- **`sendSMS()`** helper + automatic SMS fallback on hard WhatsApp errors.
- **`TWILIO_SMS_NUMBER`** env (optional) — SMS sender; defaults to the WhatsApp number (`+447414265007`), which is SMS-capable.
- `notifyCleanerNewBooking` sends a plain-text SMS version (WhatsApp templates can't go over SMS) including the `ACCEPT/DECLINE #code` instruction.

### To activate in production (REQUIRED — code alone doesn't do it)

1. In **Vercel → Project → Settings → Environment Variables**, add:
   ```
   WHATSAPP_ENABLED = false
   ```
   (Production, and Preview if you test there.)
2. **Redeploy** (env changes need a new deployment).
3. Local `.env.local` already has `WHATSAPP_ENABLED=false`.

> SMS from `+447414265007` works via Twilio even though the number is on the phone app — inbound SMS to a Twilio number lands at Twilio, not the phone's SIM.

**Cost note:** UK→Spain SMS is ~€0.07–0.09 per segment; booking messages are 2–3 segments. Negligible at current volume.

### Inbound SMS webhook (DONE — required for ACCEPT/DECLINE over SMS)

The webhook code (`/api/webhooks/twilio`) already handles SMS replies — `normalizePhone()` treats bare `+34…` and `whatsapp:+34…` identically, and replies route back over SMS when `WHATSAPP_ENABLED=false`. **But** SMS inbound uses the *phone number's* `SmsUrl`, not the WhatsApp sender's callback. `+447414265007` was pointing at Twilio's demo URL; fixed on 3 Aug 2026 to:

```
SmsUrl: https://alicantecleaners.com/api/webhooks/twilio  (POST)   [PN SID PNe6541cc285380e7edb0fa414d205bcf7]
```

To re-check or re-apply:
```bash
SID=$(grep '^TWILIO_ACCOUNT_SID=' .env.local | cut -d= -f2 | tr -d '"')
TOK=$(grep '^TWILIO_AUTH_TOKEN=' .env.local | cut -d= -f2 | tr -d '"')
curl -s -X POST "https://api.twilio.com/2010-04-01/Accounts/$SID/IncomingPhoneNumbers/PNe6541cc285380e7edb0fa414d205bcf7.json" \
  -u "$SID:$TOK" \
  --data-urlencode "SmsUrl=https://alicantecleaners.com/api/webhooks/twilio" \
  --data-urlencode "SmsMethod=POST" | python3 -c "import sys,json;d=json.load(sys.stdin);print(d['phone_number'],'->',d['sms_url'])"
```

### To roll back once WhatsApp is restored
Set `WHATSAPP_ENABLED=true` in Vercel and redeploy. No code change needed.

---

## 2. Confirm the SMS fallback is working

After deploying with `WHATSAPP_ENABLED=false`, make a test booking (or use `/api/admin/test-whatsapp`) and check the Twilio message log:

```bash
# From the repo root (creds read from .env.local)
SID=$(grep '^TWILIO_ACCOUNT_SID=' .env.local | cut -d= -f2 | tr -d '"')
TOK=$(grep '^TWILIO_AUTH_TOKEN=' .env.local | cut -d= -f2 | tr -d '"')
curl -s -u "$SID:$TOK" \
  "https://api.twilio.com/2010-04-01/Accounts/$SID/Messages.json?PageSize=5" \
  | python3 -c "import sys,json;[print(m['date_created'],'|',m['from'],'->',m['to'],'|',m['status'],'|',m.get('error_code')) for m in json.load(sys.stdin)['messages']]"
```
A healthy SMS shows `from +447414265007` (no `whatsapp:` prefix), `status: sent`/`delivered`, `error_code: None`.

---

## 3. Restore WhatsApp (when ready)

`+447414265007` is a free Twilio virtual number — nothing to unhook from a phone. Restoring is purely about clearing the Meta-side disable, then re-verifying the Twilio sender.

1. In **Meta Business Manager → WhatsApp Manager**, open WABA `810954628588086`:
   - Check the **account status / quality banner** for the disable reason.
   - Complete **Business Verification** if it's pending/failed (this ties into the Spanish-entity plan — an unverified WABA gets restricted past a messaging cap). See `entity-strategy-spanish-autonomo` memory.
   - Resolve any **policy strike** or **payment/billing** issue flagged.
2. In **Twilio Console → Messaging → Senders → WhatsApp senders**, re-register / re-verify `+447414265007`. Because offline reason **410** also appears, **open a Twilio support ticket** referencing sender SID `XE894817963d61b8ee0fc775c183355ea3` and errors 63112/410.
3. Wait for sender **status → ONLINE**, then set `WHATSAPP_ENABLED=true` in Vercel and redeploy.

> **Meanwhile:** keep `WHATSAPP_ENABLED=false` — automated alerts flow via SMS + email, and the separate-SIM phone covers manual WhatsApp chats. No rush to restore; do it alongside the Meta Business Verification for the Spanish entity.

### Verify the sender is back online
```bash
SID=$(grep '^TWILIO_ACCOUNT_SID=' .env.local | cut -d= -f2 | tr -d '"')
TOK=$(grep '^TWILIO_AUTH_TOKEN=' .env.local | cut -d= -f2 | tr -d '"')
curl -s -u "$SID:$TOK" "https://messaging.twilio.com/v2/Channels/Senders?Channel=whatsapp" \
  | python3 -c "import sys,json;[print(s['sender_id'],'->',s['status'],'|',[r['code'] for r in (s.get('offline_reasons') or [])]) for s in json.load(sys.stdin)['senders']]"
```
Target: `whatsapp:+447414265007 -> ONLINE | []`.

---

## Recommendation

1. **Now:** set `WHATSAPP_ENABLED=false` in Vercel + redeploy → alerts flow via SMS today. Confirm with §2.
2. **Short term:** live on SMS + email for automated notifications; the separate-SIM phone covers manual WhatsApp chats. No bureaucracy, bookings unblocked immediately.
3. **When the Spanish entity + Meta Business Verification are sorted** (§3), restore the Twilio WhatsApp sender for branded, template-based automation and flip `WHATSAPP_ENABLED=true`.

---

## Reference — error codes

| Code | Meaning |
|------|---------|
| **63112** | Meta/WhatsApp Business Account connected to the sender was disabled by Meta |
| **63002** | Message failed — WhatsApp channel sender not available/authenticated (downstream of 63112) |
| **410** | Generic Twilio sender error — open a support ticket |
