import { readFileSync, existsSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

// Cache for knowledge base content
const knowledgeCache: Map<string, { content: string; loadedAt: number }> = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes - allows updates without restart

type KnowledgeType = 'cleaner' | 'owner' | 'admin'

/**
 * Load knowledge base content for a specific agent type
 * Reads from /knowledge/{type}.md with caching
 */
export function loadKnowledge(type: KnowledgeType): string {
  const cacheKey = type
  const cached = knowledgeCache.get(cacheKey)

  // Return cached if still valid
  if (cached && Date.now() - cached.loadedAt < CACHE_TTL) {
    return cached.content
  }

  try {
    // Try multiple possible paths (works in dev and production)
    const possiblePaths = [
      join(process.cwd(), 'knowledge', `${type}.md`),
      join(process.cwd(), '..', 'knowledge', `${type}.md`),
    ]

    let content = ''
    for (const filePath of possiblePaths) {
      if (existsSync(filePath)) {
        content = readFileSync(filePath, 'utf-8')
        break
      }
    }

    if (!content) {
      console.warn(`[Knowledge] No knowledge base found for: ${type}`)
      return ''
    }

    // Cache the content
    knowledgeCache.set(cacheKey, { content, loadedAt: Date.now() })

    console.log(`[Knowledge] Loaded ${type}.md (${content.length} chars)`)
    return content
  } catch (error) {
    console.error(`[Knowledge] Error loading ${type}:`, error)
    return ''
  }
}

/**
 * Get a compact summary of knowledge for token-efficient injection
 * Extracts key sections without full formatting
 */
export function getKnowledgeSummary(type: KnowledgeType, maxChars: number = 2000): string {
  const full = loadKnowledge(type)
  if (!full) return ''

  // If already short enough, return as-is
  if (full.length <= maxChars) return full

  // Extract headers and first paragraph of each section
  const lines = full.split('\n')
  const summary: string[] = []
  let charCount = 0
  let inSection = false

  for (const line of lines) {
    // Always include headers
    if (line.startsWith('#')) {
      if (charCount + line.length < maxChars) {
        summary.push(line)
        charCount += line.length
        inSection = true
      }
    }
    // Include first content line after header
    else if (inSection && line.trim() && !line.startsWith('|') && !line.startsWith('-')) {
      if (charCount + line.length < maxChars) {
        summary.push(line)
        charCount += line.length
      }
      inSection = false
    }
  }

  return summary.join('\n')
}

/**
 * Search knowledge base for relevant content
 * Returns sections that match the query
 */
export function searchKnowledge(type: KnowledgeType, query: string): string {
  const content = loadKnowledge(type)
  if (!content) return ''

  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2)
  const sections = content.split(/(?=^##?\s)/m)

  // Score each section by keyword matches
  const scored = sections.map(section => {
    const lowerSection = section.toLowerCase()
    const score = queryWords.reduce((acc, word) => {
      return acc + (lowerSection.includes(word) ? 1 : 0)
    }, 0)
    return { section, score }
  })

  // Return top matching sections
  const relevant = scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(s => s.section.trim())
    .join('\n\n')

  return relevant || ''
}

/**
 * Clear the knowledge cache (useful for testing)
 */
export function clearKnowledgeCache(): void {
  knowledgeCache.clear()
  console.log('[Knowledge] Cache cleared')
}

/**
 * Get last modified time for a knowledge file
 */
export function getKnowledgeLastModified(type: KnowledgeType): Date | null {
  try {
    const filePath = join(process.cwd(), 'knowledge', `${type}.md`)
    if (existsSync(filePath)) {
      const stats = statSync(filePath)
      return stats.mtime
    }
  } catch {
    return null
  }
  return null
}

/**
 * List all available knowledge bases
 */
export function listKnowledgeBases(): string[] {
  try {
    const dir = join(process.cwd(), 'knowledge')
    if (!existsSync(dir)) return []

    return readdirSync(dir)
      .filter(f => f.endsWith('.md'))
      .map(f => f.replace('.md', ''))
  } catch {
    return []
  }
}
