'use client'

import { useEffect, useRef } from 'react'
import { Screen } from './SmartWidget'

interface QuickActionMenuProps {
  isOpen: boolean
  onClose: () => void
  currentScreen: Screen
  onSelect: (action: string) => void
  language?: string
}

interface QuickAction {
  id: string
  icon: string
  labelKey: string
}

const translations = {
  en: {
    myBookings: 'My Bookings',
    calendar: 'Calendar',
    viewCalendar: 'View Calendar',
    home: 'Home',
    weekView: 'Week View',
    dayView: 'Day View',
    sync: 'Sync',
    newMessage: 'New Message',
    referCleaner: 'Refer Cleaner',
    settings: 'Settings',
    syncCalendar: 'Sync Calendar',
  },
  es: {
    myBookings: 'Mis Reservas',
    calendar: 'Calendario',
    viewCalendar: 'Ver Calendario',
    home: 'Inicio',
    weekView: 'Vista Semanal',
    dayView: 'Vista Diaria',
    sync: 'Sincronizar',
    newMessage: 'Nuevo Mensaje',
    referCleaner: 'Referir Limpiador',
    settings: 'Ajustes',
    syncCalendar: 'Sincronizar Calendario',
  },
}

// Context-aware quick actions based on current screen
const getQuickActions = (screen: Screen): QuickAction[] => {
  const actions: Record<Screen, QuickAction[]> = {
    home: [
      { id: 'navigate:bookings', icon: '📋', labelKey: 'myBookings' },
      { id: 'navigate:calendar', icon: '📅', labelKey: 'calendar' },
    ],
    bookings: [
      { id: 'navigate:calendar', icon: '📅', labelKey: 'viewCalendar' },
      { id: 'navigate:home', icon: '🏠', labelKey: 'home' },
    ],
    calendar: [
      { id: 'calendar:week', icon: '📆', labelKey: 'weekView' },
      { id: 'calendar:day', icon: '📅', labelKey: 'dayView' },
      { id: 'calendar:sync', icon: '🔄', labelKey: 'sync' },
    ],
    messages: [
      { id: 'messages:new', icon: '✉️', labelKey: 'newMessage' },
      { id: 'navigate:home', icon: '🏠', labelKey: 'home' },
    ],
    team: [
      { id: 'navigate:calendar', icon: '📅', labelKey: 'calendar' },
      { id: 'team:refer', icon: '👋', labelKey: 'referCleaner' },
    ],
    profile: [
      { id: 'profile:settings', icon: '⚙️', labelKey: 'settings' },
      { id: 'profile:calendar', icon: '📅', labelKey: 'syncCalendar' },
    ],
  }
  return actions[screen] || []
}

export default function QuickActionMenu({
  isOpen,
  onClose,
  currentScreen,
  onSelect,
  language = 'en',
}: QuickActionMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const actionDefs = getQuickActions(currentScreen)
  const t = translations[language as keyof typeof translations] || translations.en
  const actions = actionDefs.map(action => ({
    ...action,
    label: t[action.labelKey as keyof typeof t] || action.labelKey,
  }))

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      // Small delay to prevent immediate close from the tap that opened it
      setTimeout(() => {
        document.addEventListener('click', handleClickOutside)
      }, 100)
    }

    return () => document.removeEventListener('click', handleClickOutside)
  }, [isOpen, onClose])

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <>
      {/* Subtle backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Quick action popup */}
      <div
        ref={menuRef}
        className={`fixed bottom-24 right-6 z-50 bg-white rounded-2xl shadow-2xl border border-[#EBEBEB] overflow-hidden transition-all duration-200 ${
          isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2'
        }`}
        style={{ minWidth: '180px' }}
      >
        {actions.map((action, index) => (
          <button
            key={action.id}
            onClick={() => onSelect(action.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#F5F5F3] active:bg-[#EBEBEB] transition-colors ${
              index !== actions.length - 1 ? 'border-b border-[#EBEBEB]' : ''
            }`}
          >
            <span className="text-lg">{action.icon}</span>
            <span className="text-sm font-medium text-[#1A1A1A]">{action.label}</span>
          </button>
        ))}

        {/* Pointer arrow */}
        <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white border-r border-b border-[#EBEBEB] transform rotate-45" />
      </div>
    </>
  )
}
