'use client'

import { useState, useRef, useEffect } from 'react'
import { useLanguage } from './language-context'

export default function LanguageSwitcher() {
  const { lang, setLang, languages } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const currentLang = languages.find(l => l.code === lang)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-sm text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors px-2 py-1 rounded-lg hover:bg-[#F5F5F3]"
        aria-label="Select language"
      >
        <span className="text-base">{currentLang?.flag}</span>
        <span className="hidden sm:inline">{currentLang?.code.toUpperCase()}</span>
        <svg
          className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 bg-white rounded-xl border border-[#EBEBEB] shadow-lg py-1 min-w-[140px] z-50">
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => {
                setLang(language.code)
                setIsOpen(false)
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[#F5F5F3] transition-colors ${
                lang === language.code ? 'text-[#C4785A] font-medium' : 'text-[#1A1A1A]'
              }`}
            >
              <span>{language.flag}</span>
              <span>{language.name}</span>
              {lang === language.code && (
                <span className="ml-auto text-[#C4785A]">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
