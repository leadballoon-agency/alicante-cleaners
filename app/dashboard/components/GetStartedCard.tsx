'use client'

import { useEffect, useState } from 'react'
import { useLanguage } from '@/components/language-context'

interface ProfileHealth {
  score: number
  photo: { has: boolean }
  bio: { length: number; quality: 'poor' | 'ok' | 'good' }
  areas: { count: number }
  rate: { value: number }
  calendar: { synced: boolean }
}

type StepKey = 'photo' | 'bio' | 'areas' | 'rate' | 'calendar'

interface Step {
  key: StepKey
  icon: string
  href: string
  done: boolean
}

// Steps are considered "fully done" here using the same real field data
// getProfileHealth returns - not score-threshold guessing - so the checklist
// always matches what's actually saved on the cleaner's profile.
function buildSteps(health: ProfileHealth): Step[] {
  return [
    { key: 'photo', icon: '\u{1F4F7}', href: '/dashboard?tab=profile', done: health.photo.has },
    { key: 'bio', icon: '\u{1F4DD}', href: '/dashboard?tab=profile', done: health.bio.quality === 'good' },
    { key: 'areas', icon: '\u{1F4CD}', href: '/dashboard?tab=profile', done: health.areas.count >= 3 },
    { key: 'rate', icon: '\u{1F4B6}', href: '/dashboard?tab=profile', done: health.rate.value > 0 },
    { key: 'calendar', icon: '\u{1F4C5}', href: '/dashboard/availability', done: health.calendar.synced },
  ]
}

export default function GetStartedCard({ variant = 'active' }: { variant?: 'active' | 'pending' }) {
  const { t } = useLanguage()
  const [health, setHealth] = useState<ProfileHealth | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch('/api/dashboard/cleaner/profile-health')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.health) {
          setHealth(data.health)
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-5 border border-[#EBEBEB] animate-pulse mb-6">
        <div className="h-4 w-1/3 bg-[#F5F5F3] rounded mb-4" />
        <div className="h-2 w-full bg-[#F5F5F3] rounded-full mb-5" />
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-10 bg-[#F5F5F3] rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!health) return null

  const steps = buildSteps(health)
  const allStepsDone = steps.every((s) => s.done)

  // Hide once every actionable field is done, or the overall score is high
  // enough that the card no longer earns its place on the screen.
  if (allStepsDone || health.score >= 90) {
    return null
  }

  return (
    <div className="bg-white rounded-2xl p-5 border border-[#EBEBEB] mb-6">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-semibold text-[#1A1A1A]">{t('getStarted.title')}</h3>
        <span className="text-sm font-medium text-[#C4785A]">{health.score}/100</span>
      </div>
      <p className="text-xs text-[#6B6B6B] mb-3">
        {variant === 'pending' ? t('getStarted.subtitlePending') : t('getStarted.subtitle')}
      </p>

      {/* Progress bar */}
      <div className="h-2 w-full bg-[#F5F5F3] rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-[#C4785A] rounded-full transition-all"
          style={{ width: `${Math.min(100, Math.max(0, health.score))}%` }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {steps.map((step) => (
          <a
            key={step.key}
            href={step.href}
            className={`flex items-center gap-3 rounded-xl p-3 transition-colors ${
              step.done
                ? 'bg-[#FAFAF8] opacity-60'
                : 'bg-[#FFF8F5] border border-[#F5E6E0] hover:border-[#C4785A]'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm ${
                step.done ? 'bg-[#E8F5E9]' : 'bg-white border border-[#EBEBEB]'
              }`}
            >
              {step.done ? '✅' : step.icon}
            </div>
            <div className="min-w-0 flex-1">
              <p
                className={`text-sm font-medium ${
                  step.done ? 'text-[#9B9B9B] line-through' : 'text-[#1A1A1A]'
                }`}
              >
                {t(`getStarted.step.${step.key}`)}
              </p>
              {!step.done && (
                <p className="text-xs text-[#6B6B6B] mt-0.5">{t(`getStarted.step.${step.key}Desc`)}</p>
              )}
            </div>
            {!step.done && <span className="text-[#C4785A] text-lg flex-shrink-0">&rsaquo;</span>}
          </a>
        ))}
      </div>

      {/* Guides row */}
      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[#EBEBEB]">
        <span className="text-xs text-[#9B9B9B] mr-1">{t('getStarted.guides')}:</span>
        <a
          href="/join/guide"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-[#C4785A] hover:underline"
        >
          {t('getStarted.guide.getStarted')}
        </a>
        <span className="text-[#DEDEDE]">&middot;</span>
        <a
          href="/join/profile-guide"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-[#C4785A] hover:underline"
        >
          {t('getStarted.guide.profile')}
        </a>
      </div>
    </div>
  )
}
