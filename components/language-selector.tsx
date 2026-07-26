'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/components/language-context'

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
]

type Props = {
  label?: string
  description?: string
}

export default function LanguageSelector({
  label = 'Preferred Language',
  description = 'Messages from other users will be translated to this language'
}: Props) {
  const { t } = useLanguage()
  const [selectedLanguage, setSelectedLanguage] = useState('en')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetchPreferences()
  }, [])

  const fetchPreferences = async () => {
    try {
      const res = await fetch('/api/user/preferences')
      const data = await res.json()
      setSelectedLanguage(data.preferredLanguage || 'en')
    } catch (error) {
      console.error('Error fetching preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLanguageChange = async (langCode: string) => {
    setSelectedLanguage(langCode)
    setSaving(true)
    setSaved(false)

    try {
      const res = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferredLanguage: langCode }),
      })

      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch (error) {
      console.error('Error updating language:', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-5 border border-[#EBEBEB]">
        <div className="animate-pulse">
          <div className="h-4 bg-[#F5F5F3] rounded w-1/3 mb-3"></div>
          <div className="h-10 bg-[#F5F5F3] rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-5 border border-[#EBEBEB]">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-medium text-[#1A1A1A]">{label}</h3>
        {saving && (
          <span className="text-xs text-[#9B9B9B]">{t('langSelector.saving')}</span>
        )}
        {saved && (
          <span className="text-xs text-[#2E7D32]">{t('langSelector.saved')}</span>
        )}
      </div>
      <p className="text-sm text-[#6B6B6B] mb-4">{description}</p>

      <div className="grid grid-cols-2 gap-2">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            disabled={saving}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all ${
              selectedLanguage === lang.code
                ? 'border-[#C4785A] bg-[#FFF8F5]'
                : 'border-[#EBEBEB] hover:border-[#DEDEDE]'
            } ${saving ? 'opacity-50' : ''}`}
          >
            <span className="text-lg">{lang.flag}</span>
            <span className={`text-sm ${
              selectedLanguage === lang.code
                ? 'text-[#C4785A] font-medium'
                : 'text-[#1A1A1A]'
            }`}>
              {lang.name}
            </span>
            {selectedLanguage === lang.code && (
              <span className="ml-auto text-[#C4785A]">✓</span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-[#EBEBEB]">
        <div className="flex items-start gap-2">
          <span className="text-lg">💡</span>
          <p className="text-xs text-[#6B6B6B]">
            {t('langSelector.autoTranslateNote').replace('{lang}', LANGUAGES.find(l => l.code === selectedLanguage)?.name || '')}
          </p>
        </div>
      </div>
    </div>
  )
}
