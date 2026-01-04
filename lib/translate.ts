import OpenAI from 'openai'

// Lazy initialization to avoid build-time errors
let openai: OpenAI | null = null

function getOpenAI(): OpenAI {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return openai
}

// Supported languages
export const SUPPORTED_LANGUAGES = {
  en: 'English',
  es: 'Spanish',
  de: 'German',
  fr: 'French',
  nl: 'Dutch',
  it: 'Italian',
  pt: 'Portuguese',
} as const

export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES

// Detect the language of a text
export async function detectLanguage(text: string): Promise<LanguageCode> {
  try {
    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a language detector. Respond with ONLY the ISO 639-1 language code (e.g., "en", "es", "de", "fr", "nl", "it", "pt"). If unsure, respond with "en".`,
        },
        {
          role: 'user',
          content: text,
        },
      ],
      max_tokens: 5,
      temperature: 0,
    })

    const detected = response.choices[0]?.message?.content?.trim().toLowerCase() as LanguageCode

    // Validate it's a supported language
    if (detected && detected in SUPPORTED_LANGUAGES) {
      return detected
    }

    return 'en' // Default to English
  } catch (error) {
    console.error('Language detection error:', error)
    return 'en'
  }
}

// Translate text from one language to another
export async function translateText(
  text: string,
  fromLang: LanguageCode,
  toLang: LanguageCode
): Promise<string> {
  // Skip translation if same language
  if (fromLang === toLang) {
    return text
  }

  try {
    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a professional translator for a villa cleaning service in Spain. Translate the following message from ${SUPPORTED_LANGUAGES[fromLang]} to ${SUPPORTED_LANGUAGES[toLang]}.

Rules:
- Keep the translation natural and conversational
- Preserve any names, addresses, or specific details exactly
- Keep the same tone (friendly, professional)
- If there are any cleaning-related terms, use the appropriate local terminology
- Do not add any explanations, just provide the translation`,
        },
        {
          role: 'user',
          content: text,
        },
      ],
      max_tokens: 1000,
      temperature: 0.3,
    })

    return response.choices[0]?.message?.content?.trim() || text
  } catch (error) {
    console.error('Translation error:', error)
    return text // Return original if translation fails
  }
}

// Detect language and translate in one call
export async function detectAndTranslate(
  text: string,
  targetLang: LanguageCode
): Promise<{
  originalLang: LanguageCode
  translatedText: string
}> {
  const originalLang = await detectLanguage(text)

  if (originalLang === targetLang) {
    return {
      originalLang,
      translatedText: text, // No translation needed
    }
  }

  const translatedText = await translateText(text, originalLang, targetLang)

  return {
    originalLang,
    translatedText,
  }
}

// Get the preferred language for a user role
// Owners default to English, Cleaners default to Spanish
export function getDefaultLanguage(role: 'OWNER' | 'CLEANER'): LanguageCode {
  return role === 'CLEANER' ? 'es' : 'en'
}
