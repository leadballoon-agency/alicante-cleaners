/**
 * Shared helper for turning a list of service areas into a natural-language
 * sentence, e.g. ["Alicante City", "San Juan", "Jijona"] -> "Alicante City,
 * San Juan and Jijona". Used to keep the visible "which areas do you cover?"
 * FAQ answer and its JSON-LD schema counterpart in sync.
 */
export function formatAreasSentence(areas: string[], conjunction: string = 'and'): string {
  if (areas.length === 0) return ''
  if (areas.length === 1) return areas[0]
  return `${areas.slice(0, -1).join(', ')} ${conjunction} ${areas[areas.length - 1]}`
}
