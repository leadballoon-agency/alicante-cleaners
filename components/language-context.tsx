'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Language, translations, LANGUAGES } from '@/lib/i18n'

type LanguageContextType = {
  lang: Language
  setLang: (lang: Language) => void
  t: (key: string) => string
  languages: typeof LANGUAGES
}

const LanguageContext = createContext<LanguageContextType | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>('en')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Load saved language from localStorage
    const saved = localStorage.getItem('villacare-lang') as Language | null
    if (saved && translations[saved]) {
      setLangState(saved)
    } else {
      // Detect browser language
      const browserLang = navigator.language.split('-')[0] as Language
      if (translations[browserLang]) {
        setLangState(browserLang)
      }
    }
    setMounted(true)
  }, [])

  const setLang = (newLang: Language) => {
    setLangState(newLang)
    localStorage.setItem('villacare-lang', newLang)
  }

  const t = (key: string): string => {
    return translations[lang][key] || translations.en[key] || key
  }

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <LanguageContext.Provider value={{ lang: 'en', setLang, t: (key) => translations.en[key] || key, languages: LANGUAGES }}>
        {children}
      </LanguageContext.Provider>
    )
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, languages: LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
