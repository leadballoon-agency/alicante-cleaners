/**
 * Shared helper for running "fire and forget" side effects (emails, WhatsApp
 * messages, web push notifications, etc.) safely on Vercel's serverless
 * runtime.
 *
 * Why this exists:
 * On Vercel, a serverless function's execution is frozen the instant the
 * response is sent back to the client. Any promise that was started but not
 * awaited (e.g. `sendEmail(...).catch(console.error)` followed immediately by
 * `return NextResponse.json(...)`) never gets a chance to finish running —
 * the underlying HTTP request/notification/push call silently never
 * completes. This caused real production bugs (e.g. owners never receiving
 * "booking confirmed" emails/WhatsApp messages).
 *
 * The fix: await every side effect via `Promise.allSettled` BEFORE returning
 * the response, so the function stays alive long enough for all of them to
 * finish. A rejected side effect never rejects the route handler or changes
 * the HTTP response — it is only logged.
 *
 * These side effects are all sub-second operations (transactional email API
 * calls, WhatsApp API calls, web push sends), so the added latency to the
 * response is small and acceptable in exchange for correctness.
 */

export interface SideEffect {
  /** Short label identifying the side effect for logging, e.g. "whatsapp:booking-confirmed" */
  label: string;
  promise: Promise<unknown>;
}

/**
 * Runs all provided side-effect promises to completion and logs (but does
 * not throw) any that fail. Always await this call before returning a
 * response from a route handler.
 */
export async function runSideEffects(effects: SideEffect[]): Promise<void> {
  if (effects.length === 0) return;

  const results = await Promise.allSettled(effects.map((e) => e.promise));

  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      console.error(`[side-effect:${effects[i].label}] failed:`, result.reason);
    }
  });
}
