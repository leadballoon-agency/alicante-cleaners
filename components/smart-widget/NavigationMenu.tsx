'use client'

import { useEffect, useRef } from 'react'
import { Screen } from './SmartWidget'

interface NavigationMenuProps {
  isOpen: boolean
  onClose: () => void
  currentScreen: Screen
  onNavigate: (screen: Screen) => void
  onAction: (action: string) => void
  badges?: {
    messages?: number
    team?: number
    bookings?: number
  }
  language?: string
}

interface MenuItem {
  id: string
  icon: string
  label: string
  badge?: string
  badgeCount?: number
  isScreen?: boolean
  divider?: boolean
}

const translations = {
  en: {
    home: 'Home',
    bookings: 'Bookings',
    promote: 'Promote',
    messages: 'Messages',
    team: 'Team',
    profile: 'Profile',
    success: 'Success',
    settings: 'Settings',
    support: 'Support',
    feedback: 'Feedback',
  },
  es: {
    home: 'Inicio',
    bookings: 'Reservas',
    promote: 'Promocionar',
    messages: 'Mensajes',
    team: 'Equipo',
    profile: 'Perfil',
    success: 'Éxito',
    settings: 'Ajustes',
    support: 'Soporte',
    feedback: 'Comentarios',
  },
}

export default function NavigationMenu({
  isOpen,
  onClose,
  currentScreen,
  onNavigate,
  onAction,
  badges,
  language = 'en',
}: NavigationMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const startY = useRef<number>(0)
  const currentY = useRef<number>(0)

  const t = translations[language as keyof typeof translations] || translations.en

  const menuItems: MenuItem[] = [
    { id: 'home', icon: '🏠', label: t.home, isScreen: true },
    { id: 'bookings', icon: '📋', label: t.bookings, badgeCount: badges?.bookings, isScreen: true },
    { id: 'success', icon: '🎯', label: t.success, isScreen: true },
    { id: 'promote', icon: '📈', label: t.promote, isScreen: true },
    { id: 'messages', icon: '💬', label: t.messages, badgeCount: badges?.messages, isScreen: true },
    { id: 'team', icon: '👥', label: t.team, badgeCount: badges?.team, isScreen: true },
    { id: 'profile', icon: '👤', label: t.profile, isScreen: true },
    { id: 'divider', divider: true, icon: '', label: '' },
    { id: 'settings', icon: '⚙️', label: t.settings },
    { id: 'support', icon: '💬', label: t.support },
    { id: 'feedback', icon: '📝', label: t.feedback },
  ]

  // Handle swipe down to close
  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    currentY.current = e.touches[0].clientY
    const diff = currentY.current - startY.current

    if (diff > 0 && menuRef.current) {
      menuRef.current.style.transform = `translateY(${diff}px)`
    }
  }

  const handleTouchEnd = () => {
    const diff = currentY.current - startY.current

    if (diff > 100) {
      onClose()
    }

    if (menuRef.current) {
      menuRef.current.style.transform = ''
    }
  }

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

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleItemClick = (item: MenuItem) => {
    if (item.divider) return

    if (item.isScreen) {
      onNavigate(item.id as Screen)
    } else {
      onAction(item.id)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-200 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Menu */}
      <div
        ref={menuRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`fixed bottom-0 left-0 right-0 z-50 bg-[#FAFAF8] rounded-t-3xl shadow-2xl transition-transform duration-200 ease-out ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: '70vh' }}
      >
        {/* Handle bar */}
        <div className="flex justify-center py-3">
          <div className="w-10 h-1 bg-[#DEDEDE] rounded-full" />
        </div>

        {/* Menu items */}
        <div className="px-4 pb-8 overflow-y-auto" style={{ maxHeight: 'calc(70vh - 40px)' }}>
          {menuItems.map((item) => {
            if (item.divider) {
              return (
                <div key={item.id} className="my-3 border-t border-[#EBEBEB]" />
              )
            }

            const isActive = item.isScreen && item.id === currentScreen

            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all active:scale-[0.98] ${
                  isActive
                    ? 'bg-[#FFF8F5] text-[#C4785A]'
                    : 'hover:bg-[#F5F5F3] text-[#1A1A1A]'
                }`}
              >
                <span className="text-2xl w-8 text-center">{item.icon}</span>
                <span className="flex-1 text-left font-medium">{item.label}</span>

                {/* Badge */}
                {item.badge && (
                  <span className="px-2 py-0.5 text-xs font-bold bg-[#C4785A] text-white rounded-full">
                    {item.badge}
                  </span>
                )}

                {/* Badge count */}
                {item.badgeCount && item.badgeCount > 0 && (
                  <span className="min-w-6 h-6 px-1.5 text-sm font-bold bg-red-500 text-white rounded-full flex items-center justify-center">
                    {item.badgeCount > 9 ? '9+' : item.badgeCount}
                  </span>
                )}

                {/* Active indicator */}
                {isActive && (
                  <span className="w-2 h-2 rounded-full bg-[#C4785A]" />
                )}
              </button>
            )
          })}
        </div>

        {/* Safe area padding for devices with home indicator */}
        <div className="h-safe" />
      </div>
    </>
  )
}
