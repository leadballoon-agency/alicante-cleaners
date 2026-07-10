// Client-side helper for pushing GTM dataLayer events.
//
// GTM (GTM-K2DZZTR6) is injected by `components/analytics/script-loader.tsx`
// only after `/api/scripts` resolves and the visitor's browser runs the GTM
// bootstrap snippet, which is what actually creates `window.dataLayer`. That
// means `window.dataLayer` may not exist yet (or ever, if GTM is disabled/
// blocked) when product code wants to record a conversion moment. This
// helper is a safe, no-op-if-missing wrapper so call sites never need to
// guard against that themselves.
//
// GTM tags/triggers/Meta Pixel event mapping are configured in the GTM
// dashboard, not here - this file only pushes plain events onto the
// dataLayer for GTM to pick up.

declare global {
  interface Window {
    dataLayer?: unknown[]
  }
}

/**
 * Push a conversion/engagement event onto window.dataLayer for GTM to relay
 * to Meta Pixel / GA4 / etc. Safe to call anywhere on the client - it is a
 * no-op (and never throws) if `window` or `window.dataLayer` isn't
 * available yet (SSR, GTM not loaded, ad blockers, etc.).
 *
 * Params should be flat, snake_case, and free of PII (no names, emails,
 * or phone numbers) - only IDs/slugs, amounts, and category-style strings.
 */
export function pushDataLayerEvent(event: string, params?: Record<string, unknown>): void {
  try {
    if (typeof window === 'undefined') return
    if (!Array.isArray(window.dataLayer)) return

    window.dataLayer.push({
      event,
      ...params,
    })
  } catch {
    // Never let analytics break the app.
  }
}
