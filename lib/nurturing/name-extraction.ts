import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * Extract a proper name from an email address
 * Examples:
 * - "alanleckey1@gmail.com" => "Alan Leckey"
 * - "john.smith.london@yahoo.co.uk" => "John Smith"
 * - "jsmith@company.com" => "J Smith" or null
 * - "info@company.com" => null
 */
export async function parseNameFromEmail(email: string): Promise<string | null> {
  if (!email) return null

  const localPart = email.split('@')[0]
  if (!localPart || localPart.length < 2) return null

  // Quick regex patterns for common formats

  // firstname.lastname
  const dotMatch = localPart.match(/^([a-z]+)\.([a-z]+)/i)
  if (dotMatch) {
    return capitalize(dotMatch[1]) + ' ' + capitalize(dotMatch[2])
  }

  // firstname_lastname
  const underscoreMatch = localPart.match(/^([a-z]+)_([a-z]+)/i)
  if (underscoreMatch) {
    return capitalize(underscoreMatch[1]) + ' ' + capitalize(underscoreMatch[2])
  }

  // firstnamelastname with numbers stripped
  const stripped = localPart.replace(/[0-9_\-.]/g, '')
  if (stripped.length < 3) return null

  // Skip obvious non-names
  const nonNames = [
    'info', 'contact', 'admin', 'hello', 'hi', 'support', 'sales',
    'office', 'help', 'mail', 'email', 'noreply', 'test', 'user',
    'enquiry', 'booking', 'reservations', 'enquiries'
  ]
  if (nonNames.includes(stripped.toLowerCase())) return null

  // Use AI for ambiguous cases like "alanleckey1"
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0,
      max_tokens: 50,
      messages: [{
        role: 'user',
        content: `Extract a person's name from this email username: "${stripped}"

Rules:
- If it looks like a name (firstnamelastname, first initial + lastname, etc.), return "FirstName LastName" properly capitalized
- If it's clearly not a name (generic words, company names), return "null"
- Common patterns: johnsmith -> John Smith, jsmith -> J Smith, alanleckey -> Alan Leckey

Return ONLY the name or "null", nothing else.`
      }],
    })

    const result = response.choices[0]?.message?.content?.trim()
    if (!result || result.toLowerCase() === 'null') return null

    return result
  } catch (error) {
    console.error('[Name Extraction] AI error:', error)
    return null
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

/**
 * Get the best available name for an owner
 * Priority: user.name > owner.derivedName > parsed from email
 */
export async function getOwnerDisplayName(
  userName: string | null,
  derivedName: string | null,
  email: string | null
): Promise<string> {
  if (userName) return userName
  if (derivedName) return derivedName
  if (email) {
    const parsed = await parseNameFromEmail(email)
    if (parsed) return parsed
  }
  return 'there' // Fallback for "Hi there"
}
