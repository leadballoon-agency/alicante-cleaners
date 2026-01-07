'use client'

import { useEffect, useRef } from 'react'
import { Screen } from './SmartWidget'

interface QuickActionMenuProps {
  isOpen: boolean
  onClose: () => void
  currentScreen: Screen
  onSelect: (action: string) => void
}

interface QuickAction {
  id: string
  icon: string
  label: string
}

// Context-aware quick actions based on current screen
const getQuickActions = (screen: Screen): QuickAction[] => {
  const actions: Record<Screen, QuickAction[]> = {
    home: [
      { id: 'navigate:bookings', icon: '📋', label: 'Mis Reservas' },
      { id: 'navigate:calendar', icon: '📅', label: 'Calendario' },
    ],
    bookings: [
      { id: 'navigate:calendar', icon: '📅', label: 'Ver Calendario' },
      { id: 'navigate:home', icon: '🏠', label: 'Inicio' },
    ],
    calendar: [
      { id: 'calendar:week', icon: '📆', label: 'Vista Semanal' },
      { id: 'calendar:day', icon: '📅', label: 'Vista Diaria' },
      { id: 'calendar:sync', icon: '🔄', label: 'Sincronizar' },
    ],
    messages: [
      { id: 'messages:new', icon: '✉️', label: 'Nuevo Mensaje' },
      { id: 'navigate:home', icon: '🏠', label: 'Inicio' },
    ],
    team: [
      { id: 'navigate:calendar', icon: '📅', label: 'Calendario' },
      { id: 'team:refer', icon: '👋', label: 'Referir Limpiador' },
    ],
    profile: [
      { id: 'profile:settings', icon: '⚙️', label: 'Ajustes' },
      { id: 'profile:calendar', icon: '📅', label: 'Sincronizar Calendario' },
    ],
  }
  return actions[screen] || []
}

export default function QuickActionMenu({
  isOpen,
  onClose,
  currentScreen,
  onSelect,
}: QuickActionMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const actions = getQuickActions(currentScreen)

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
