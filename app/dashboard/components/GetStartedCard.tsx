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

// res.json() is untyped - the API can add/omit fields without a compile
// error here, so every field is optional and consumers must default
// gracefully (see incident notes: a missing-field assumption here has
// previously caused a production crash).
interface ApprovalInfo {
  whatsApp?: string | null
  cleanerName?: string
  status?: string
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

// The four profile steps that matter for a human approval decision.
// Calendar sync is deliberately excluded - it's a Google OAuth step and must
// not gate a PENDING cleaner from asking a staff member to approve her.
function isProfileReady(health: ProfileHealth): boolean {
  return (
    health.photo.has &&
    health.bio.quality === 'good' &&
    health.areas.count >= 3 &&
    health.rate.value > 0
  )
}

function buildApprovalWhatsAppUrl(whatsApp: string, cleanerName: string): string {
  const digits = whatsApp.replace(/\D/g, '')
  const adminLink = `https://alicantecleaners.com/admin?tab=cleaners&search=${encodeURIComponent(cleanerName)}`
  const message = `¡Hola! Soy ${cleanerName} \u{1F44B} He completado mi perfil en VillaCare y quiero solicitar la aprobación de mi cuenta: ${adminLink}`
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

export default function GetStartedCard({ variant = 'active' }: { variant?: 'active' | 'pending' }) {
  const { t } = useLanguage()
  const [health, setHealth] = useState<ProfileHealth | null>(null)
  const [approval, setApproval] = useState<ApprovalInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch('/api/dashboard/cleaner/profile-health')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.health) {
          setHealth(data.health)
          // approval is optional/untyped from the API response - default to
          // an empty object so downstream reads (?.whatsApp etc) are safe.
          setApproval(data.approval ?? null)
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
  const calendarStep = steps.find((s) => s.key === 'calendar')

  // PENDING-only: once the four profile-quality steps are done (calendar
  // sync excluded - a Google OAuth step must never gate a human approval
  // request), and staff have configured an approval WhatsApp number, offer
  // the one-tap request instead of the checklist.
  const showApprovalCta =
    variant === 'pending' &&
    isProfileReady(health) &&
    !!approval?.whatsApp &&
    approval?.status === 'PENDING'

  // Hide once every actionable field is done, or the overall score is high
  // enough that the card no longer earns its place on the screen.
  if (!showApprovalCta && (allStepsDone || health.score >= 90)) {
    return null
  }

  if (showApprovalCta && approval?.whatsApp) {
    const waUrl = buildApprovalWhatsAppUrl(approval.whatsApp, approval.cleanerName || 'Cleaner')
    return (
      <div className="bg-white rounded-2xl p-5 border border-[#EBEBEB] mb-6">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-[#1A1A1A]">{t('getStarted.approval.title')}</h3>
          <span className="text-sm font-medium text-[#C4785A]">{health.score}/100</span>
        </div>
        <p className="text-xs text-[#6B6B6B] mb-4">{t('getStarted.approval.subtitle')}</p>

        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full bg-[#25D366] text-white py-3.5 rounded-xl font-medium active:scale-[0.98] transition-all"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          {t('getStarted.approval.button')}
        </a>

        {calendarStep && !calendarStep.done && (
          <div className="mt-4 pt-4 border-t border-[#EBEBEB]">
            <a
              href={calendarStep.href}
              className="flex items-center gap-3 rounded-xl p-3 bg-[#FFF8F5] border border-[#F5E6E0] hover:border-[#C4785A] transition-colors"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm bg-white border border-[#EBEBEB]">
                {calendarStep.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[#1A1A1A]">{t('getStarted.step.calendar')}</p>
                <p className="text-xs text-[#6B6B6B] mt-0.5">{t('getStarted.step.calendarDesc')}</p>
              </div>
              <span className="text-[#C4785A] text-lg flex-shrink-0">&rsaquo;</span>
            </a>
          </div>
        )}
      </div>
    )
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
