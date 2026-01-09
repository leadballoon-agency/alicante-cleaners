'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import CompletionChecklistModal from './CompletionChecklistModal'

export interface BookingPeekData {
  id: string
  date: string
  time: string
  service: string
  hours: number
  price: number
  status: string
  propertyAddress: string
  memberName: string
  memberPhoto: string | null
  memberId: string
  // Extended data for peek
  ownerName?: string
  ownerPhone?: string
  ownerLanguage?: string // Owner's preferred language
  accessNotes?: string
  propertyName?: string
  bedrooms?: number
  bathrooms?: number
  keyHolderName?: string | null
  keyHolderPhone?: string | null
}

interface Props {
  booking: BookingPeekData | null
  isVisible: boolean
  isLocked: boolean
  lockProgress: number
  onClose: () => void
  onAccept?: (bookingId: string) => void
  onDecline?: (bookingId: string) => void
  onComplete?: (bookingId: string) => void
  onSendMessage?: (bookingId: string, message: string) => void
  cleanerName?: string // For personalized WhatsApp messages
  ownerLanguage?: string // Owner's preferred language for messages
}

// Supported languages for quick messages
type SupportedLang = 'en' | 'es' | 'de' | 'fr' | 'nl' | 'pt' | 'it'

// Quick message templates - personalized with booking context
type QuickMessageTemplate = {
  emoji: string
  labelKey: string
  getMessage: (cleanerName: string, ownerName: string, time: string, property: string) => string
}

// Message labels in different languages
const MESSAGE_LABELS: Record<SupportedLang, Record<string, string>> = {
  en: { runningLate: 'Running late', onMyWay: 'On my way', accessHelp: 'Access help', customMessage: 'Custom message' },
  es: { runningLate: 'Llegando tarde', onMyWay: 'En camino', accessHelp: 'Ayuda acceso', customMessage: 'Mensaje personalizado' },
  de: { runningLate: 'Verspätung', onMyWay: 'Unterwegs', accessHelp: 'Zugang Hilfe', customMessage: 'Eigene Nachricht' },
  fr: { runningLate: 'En retard', onMyWay: 'En route', accessHelp: 'Aide accès', customMessage: 'Message personnalisé' },
  nl: { runningLate: 'Ben laat', onMyWay: 'Onderweg', accessHelp: 'Toegang hulp', customMessage: 'Eigen bericht' },
  pt: { runningLate: 'Atrasado', onMyWay: 'A caminho', accessHelp: 'Ajuda acesso', customMessage: 'Mensagem personalizada' },
  it: { runningLate: 'In ritardo', onMyWay: 'In arrivo', accessHelp: 'Aiuto accesso', customMessage: 'Messaggio personalizzato' },
}

// Full message templates in different languages
const getMessageTemplates = (lang: SupportedLang): QuickMessageTemplate[] => {
  const templates: Record<SupportedLang, QuickMessageTemplate[]> = {
    en: [
      {
        emoji: '🏃',
        labelKey: 'runningLate',
        getMessage: (cleanerName, ownerName, time) =>
          `Hi ${ownerName}! 👋\n\nIt's ${cleanerName} from VillaCare. I'm running about 10 minutes late for your ${time} clean today.\n\nI'll be there shortly - sorry for any inconvenience!\n\n- ${cleanerName}`,
      },
      {
        emoji: '🚗',
        labelKey: 'onMyWay',
        getMessage: (cleanerName, ownerName, time, property) =>
          `Hi ${ownerName}! 👋\n\nIt's ${cleanerName} from VillaCare. Just letting you know I'm on my way to ${property} now for your ${time} clean.\n\nSee you soon! 🏠\n\n- ${cleanerName}`,
      },
      {
        emoji: '🔑',
        labelKey: 'accessHelp',
        getMessage: (cleanerName, ownerName, time, property) =>
          `Hi ${ownerName}! 👋\n\nIt's ${cleanerName} from VillaCare. I'm at ${property} for the ${time} clean but having trouble with access.\n\nCould you help me get in?\n\n- ${cleanerName}`,
      },
    ],
    es: [
      {
        emoji: '🏃',
        labelKey: 'runningLate',
        getMessage: (cleanerName, ownerName, time) =>
          `¡Hola ${ownerName}! 👋\n\nSoy ${cleanerName} de VillaCare. Voy a llegar unos 10 minutos tarde para la limpieza de las ${time} de hoy.\n\n¡Estaré ahí pronto - disculpa las molestias!\n\n- ${cleanerName}`,
      },
      {
        emoji: '🚗',
        labelKey: 'onMyWay',
        getMessage: (cleanerName, ownerName, time, property) =>
          `¡Hola ${ownerName}! 👋\n\nSoy ${cleanerName} de VillaCare. Te aviso que ya voy de camino a ${property} para la limpieza de las ${time}.\n\n¡Hasta pronto! 🏠\n\n- ${cleanerName}`,
      },
      {
        emoji: '🔑',
        labelKey: 'accessHelp',
        getMessage: (cleanerName, ownerName, time, property) =>
          `¡Hola ${ownerName}! 👋\n\nSoy ${cleanerName} de VillaCare. Estoy en ${property} para la limpieza de las ${time} pero tengo problemas para entrar.\n\n¿Podrías ayudarme?\n\n- ${cleanerName}`,
      },
    ],
    de: [
      {
        emoji: '🏃',
        labelKey: 'runningLate',
        getMessage: (cleanerName, ownerName, time) =>
          `Hallo ${ownerName}! 👋\n\nHier ist ${cleanerName} von VillaCare. Ich werde heute etwa 10 Minuten später zur Reinigung um ${time} kommen.\n\nIch bin gleich da - entschuldige die Unannehmlichkeiten!\n\n- ${cleanerName}`,
      },
      {
        emoji: '🚗',
        labelKey: 'onMyWay',
        getMessage: (cleanerName, ownerName, time, property) =>
          `Hallo ${ownerName}! 👋\n\nHier ist ${cleanerName} von VillaCare. Ich wollte dir sagen, dass ich jetzt auf dem Weg zu ${property} bin für die Reinigung um ${time}.\n\nBis gleich! 🏠\n\n- ${cleanerName}`,
      },
      {
        emoji: '🔑',
        labelKey: 'accessHelp',
        getMessage: (cleanerName, ownerName, time, property) =>
          `Hallo ${ownerName}! 👋\n\nHier ist ${cleanerName} von VillaCare. Ich bin bei ${property} für die Reinigung um ${time}, habe aber Probleme mit dem Zugang.\n\nKönntest du mir helfen reinzukommen?\n\n- ${cleanerName}`,
      },
    ],
    fr: [
      {
        emoji: '🏃',
        labelKey: 'runningLate',
        getMessage: (cleanerName, ownerName, time) =>
          `Bonjour ${ownerName} ! 👋\n\nC'est ${cleanerName} de VillaCare. Je vais avoir environ 10 minutes de retard pour le ménage de ${time} aujourd'hui.\n\nJ'arrive bientôt - désolé pour le désagrément !\n\n- ${cleanerName}`,
      },
      {
        emoji: '🚗',
        labelKey: 'onMyWay',
        getMessage: (cleanerName, ownerName, time, property) =>
          `Bonjour ${ownerName} ! 👋\n\nC'est ${cleanerName} de VillaCare. Je voulais te prévenir que je suis en route vers ${property} pour le ménage de ${time}.\n\nÀ tout de suite ! 🏠\n\n- ${cleanerName}`,
      },
      {
        emoji: '🔑',
        labelKey: 'accessHelp',
        getMessage: (cleanerName, ownerName, time, property) =>
          `Bonjour ${ownerName} ! 👋\n\nC'est ${cleanerName} de VillaCare. Je suis à ${property} pour le ménage de ${time} mais j'ai des difficultés pour entrer.\n\nPourrais-tu m'aider ?\n\n- ${cleanerName}`,
      },
    ],
    nl: [
      {
        emoji: '🏃',
        labelKey: 'runningLate',
        getMessage: (cleanerName, ownerName, time) =>
          `Hallo ${ownerName}! 👋\n\nDit is ${cleanerName} van VillaCare. Ik loop ongeveer 10 minuten vertraging op voor de schoonmaak van ${time} vandaag.\n\nIk ben er zo - sorry voor het ongemak!\n\n- ${cleanerName}`,
      },
      {
        emoji: '🚗',
        labelKey: 'onMyWay',
        getMessage: (cleanerName, ownerName, time, property) =>
          `Hallo ${ownerName}! 👋\n\nDit is ${cleanerName} van VillaCare. Even laten weten dat ik nu onderweg ben naar ${property} voor de schoonmaak van ${time}.\n\nTot zo! 🏠\n\n- ${cleanerName}`,
      },
      {
        emoji: '🔑',
        labelKey: 'accessHelp',
        getMessage: (cleanerName, ownerName, time, property) =>
          `Hallo ${ownerName}! 👋\n\nDit is ${cleanerName} van VillaCare. Ik ben bij ${property} voor de schoonmaak van ${time} maar heb moeite met toegang.\n\nKun je me helpen binnen te komen?\n\n- ${cleanerName}`,
      },
    ],
    pt: [
      {
        emoji: '🏃',
        labelKey: 'runningLate',
        getMessage: (cleanerName, ownerName, time) =>
          `Olá ${ownerName}! 👋\n\nAqui é ${cleanerName} da VillaCare. Vou chegar uns 10 minutos atrasado para a limpeza das ${time} hoje.\n\nChego em breve - desculpe o transtorno!\n\n- ${cleanerName}`,
      },
      {
        emoji: '🚗',
        labelKey: 'onMyWay',
        getMessage: (cleanerName, ownerName, time, property) =>
          `Olá ${ownerName}! 👋\n\nAqui é ${cleanerName} da VillaCare. Só para avisar que estou a caminho de ${property} para a limpeza das ${time}.\n\nAté já! 🏠\n\n- ${cleanerName}`,
      },
      {
        emoji: '🔑',
        labelKey: 'accessHelp',
        getMessage: (cleanerName, ownerName, time, property) =>
          `Olá ${ownerName}! 👋\n\nAqui é ${cleanerName} da VillaCare. Estou em ${property} para a limpeza das ${time} mas estou com dificuldade para entrar.\n\nPode me ajudar?\n\n- ${cleanerName}`,
      },
    ],
    it: [
      {
        emoji: '🏃',
        labelKey: 'runningLate',
        getMessage: (cleanerName, ownerName, time) =>
          `Ciao ${ownerName}! 👋\n\nSono ${cleanerName} di VillaCare. Arriverò circa 10 minuti in ritardo per la pulizia delle ${time} di oggi.\n\nArrivo subito - scusa per l'inconveniente!\n\n- ${cleanerName}`,
      },
      {
        emoji: '🚗',
        labelKey: 'onMyWay',
        getMessage: (cleanerName, ownerName, time, property) =>
          `Ciao ${ownerName}! 👋\n\nSono ${cleanerName} di VillaCare. Ti avviso che sto arrivando a ${property} per la pulizia delle ${time}.\n\nA presto! 🏠\n\n- ${cleanerName}`,
      },
      {
        emoji: '🔑',
        labelKey: 'accessHelp',
        getMessage: (cleanerName, ownerName, time, property) =>
          `Ciao ${ownerName}! 👋\n\nSono ${cleanerName} di VillaCare. Sono a ${property} per la pulizia delle ${time} ma ho problemi ad entrare.\n\nPuoi aiutarmi?\n\n- ${cleanerName}`,
      },
    ],
  }
  return templates[lang] || templates.en
}

// Generate WhatsApp link with pre-filled message
const generateWhatsAppLink = (phone: string, message: string): string => {
  // Clean phone number (remove spaces, ensure no whatsapp: prefix)
  const cleanPhone = phone.replace(/\s/g, '').replace('whatsapp:', '')
  // Ensure it starts with country code (no +)
  const phoneNumber = cleanPhone.startsWith('+') ? cleanPhone.slice(1) : cleanPhone
  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
}

// Format date nicely
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

// Check if booking is today (handles various date formats)
const isToday = (dateStr: string): boolean => {
  // Parse the date string - handle both ISO and other formats
  const date = new Date(dateStr)
  const today = new Date()

  // Compare year, month, and day to avoid timezone issues
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  )
}

// Status badge colors
const getStatusStyles = (status: string): { bg: string; text: string; label: string } => {
  switch (status.toLowerCase()) {
    case 'confirmed':
      return { bg: 'bg-[#E8F5E9]', text: 'text-[#2E7D32]', label: 'Confirmed' }
    case 'pending':
      return { bg: 'bg-[#FFF3E0]', text: 'text-[#E65100]', label: 'Pending' }
    case 'completed':
      return { bg: 'bg-[#E3F2FD]', text: 'text-[#1565C0]', label: 'Completed' }
    default:
      return { bg: 'bg-[#F5F5F5]', text: 'text-[#6B6B6B]', label: status }
  }
}

// Get initials from name
const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default function BookingPeekModal({
  booking,
  isVisible,
  isLocked,
  lockProgress,
  onClose,
  onAccept,
  onDecline,
  onComplete,
  onSendMessage,
  cleanerName = 'Your cleaner',
  ownerLanguage = 'en'
}: Props) {
  const [showCustomMessage, setShowCustomMessage] = useState(false)
  const [customMessage, setCustomMessage] = useState('')
  const [showCompletionChecklist, setShowCompletionChecklist] = useState(false)

  // Get language-appropriate templates - use prop or booking data
  const effectiveLang = ownerLanguage || booking?.ownerLanguage || 'en'
  const lang = effectiveLang as SupportedLang
  const validLang: SupportedLang = ['en', 'es', 'de', 'fr', 'nl', 'pt', 'it'].includes(lang) ? lang : 'en'
  const messageTemplates = getMessageTemplates(validLang)
  const labels = MESSAGE_LABELS[validLang] || MESSAGE_LABELS.en

  // Prevent scroll when modal is visible
  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      setShowCustomMessage(false)
      setCustomMessage('')
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isVisible])

  if (!booking || !isVisible) return null

  const statusStyles = getStatusStyles(booking.status)
  const isPending = booking.status.toLowerCase() === 'pending'
  const isConfirmed = booking.status.toLowerCase() === 'confirmed'
  const canComplete = isConfirmed && isToday(booking.date)

  // Map labelKey to event type
  const getEventType = (labelKey: string): string => {
    switch (labelKey) {
      case 'runningLate': return 'RUNNING_LATE'
      case 'onMyWay': return 'ON_MY_WAY'
      case 'accessHelp': return 'ACCESS_HELP'
      default: return 'CUSTOM_MESSAGE'
    }
  }

  // Log event to API
  const logQuickActionEvent = async (eventType: string) => {
    if (!booking?.id) return
    try {
      await fetch(`/api/dashboard/cleaner/bookings/${booking.id}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: eventType })
      })
    } catch (error) {
      console.error('Failed to log quick action event:', error)
    }
  }

  // Open WhatsApp with pre-filled message
  const handleWhatsAppMessage = async (template: QuickMessageTemplate) => {
    // Log the event
    await logQuickActionEvent(getEventType(template.labelKey))

    if (!booking?.ownerPhone) {
      // Fallback to internal messaging if no phone
      if (onSendMessage) {
        const message = template.getMessage(
          cleanerName,
          booking?.ownerName || 'there',
          booking?.time || '',
          booking?.propertyName || booking?.propertyAddress || 'the property'
        )
        onSendMessage(booking!.id, message)
      }
      onClose()
      return
    }

    const message = template.getMessage(
      cleanerName,
      booking.ownerName || 'there',
      booking.time,
      booking.propertyName || booking.propertyAddress.split(',')[0]
    )
    const whatsappUrl = generateWhatsAppLink(booking.ownerPhone, message)
    window.open(whatsappUrl, '_blank')
    onClose()
  }

  const handleCustomWhatsAppMessage = async () => {
    if (!customMessage.trim()) return

    // Log custom message event
    await logQuickActionEvent('CUSTOM_MESSAGE')

    if (!booking?.ownerPhone) {
      // Fallback to internal messaging
      if (onSendMessage) {
        onSendMessage(booking!.id, customMessage.trim())
      }
    } else {
      // Format custom message nicely
      const formattedMessage = `Hi ${booking.ownerName || 'there'}! 👋\n\n${customMessage.trim()}\n\n- ${cleanerName}`
      const whatsappUrl = generateWhatsAppLink(booking.ownerPhone, formattedMessage)
      window.open(whatsappUrl, '_blank')
    }

    setCustomMessage('')
    setShowCustomMessage(false)
    onClose()
  }


  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center transition-all duration-200 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={isLocked ? onClose : undefined}
    >
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Modal content - slides up from bottom */}
      <div
        className={`relative w-full max-w-lg bg-white rounded-t-3xl shadow-2xl transform transition-transform duration-200 ${
          isVisible ? 'translate-y-0' : 'translate-y-full'
        } ${isLocked ? 'ring-2 ring-[#C4785A] ring-offset-2' : ''}`}
        style={{ maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Lock progress indicator */}
        {!isLocked && lockProgress > 0 && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#EBEBEB] rounded-t-3xl overflow-hidden">
            <div
              className="h-full bg-[#C4785A] transition-all duration-100"
              style={{ width: `${lockProgress * 100}%` }}
            />
          </div>
        )}

        {/* Drag indicator / Lock indicator */}
        <div className="flex justify-center pt-3 pb-2">
          {isLocked ? (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-[#E8F5E9] rounded-full">
              <span className="text-xs">🔓</span>
              <span className="text-xs font-medium text-[#2E7D32]">Unlocked</span>
            </div>
          ) : (
            <div className="w-10 h-1 bg-[#DEDEDE] rounded-full" />
          )}
        </div>

        {/* Content */}
        <div className="px-5 pb-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 50px)' }}>
          {/* Header */}
          <div className="flex items-start gap-4 mb-4">
            {booking.memberPhoto ? (
              <div className="w-14 h-14 rounded-full overflow-hidden relative flex-shrink-0">
                <Image
                  src={booking.memberPhoto}
                  alt={booking.memberName}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="w-14 h-14 rounded-full bg-[#C4785A] text-white flex items-center justify-center text-lg font-medium flex-shrink-0">
                {getInitials(booking.memberName)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold text-[#1A1A1A]">{booking.service}</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles.bg} ${statusStyles.text}`}>
                  {statusStyles.label}
                </span>
              </div>
              <p className="text-sm text-[#6B6B6B]">{booking.memberName}</p>
            </div>
          </div>

          {/* Date & Time */}
          <div className="bg-[#F5F5F3] rounded-xl p-4 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <span className="text-lg">📅</span>
              </div>
              <div>
                <p className="font-medium text-[#1A1A1A]">{formatDate(booking.date)}</p>
                <p className="text-sm text-[#6B6B6B]">{booking.time} · {booking.hours} hours</p>
              </div>
            </div>
          </div>

          {/* Property */}
          <div className="bg-[#F5F5F3] rounded-xl p-4 mb-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-lg">🏠</span>
              </div>
              <div className="flex-1 min-w-0">
                {booking.propertyName && (
                  <p className="font-medium text-[#1A1A1A] mb-0.5">{booking.propertyName}</p>
                )}
                <p className="text-sm text-[#1A1A1A]">{booking.propertyAddress}</p>
                {(booking.bedrooms || booking.bathrooms) && (
                  <p className="text-xs text-[#6B6B6B] mt-1">
                    {booking.bedrooms && `${booking.bedrooms} bed`}
                    {booking.bedrooms && booking.bathrooms && ' · '}
                    {booking.bathrooms && `${booking.bathrooms} bath`}
                  </p>
                )}
              </div>
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(booking.propertyAddress)}`}
                className="flex items-center gap-1.5 px-3 py-2 bg-white rounded-lg text-[#C4785A] hover:bg-[#FFF8F5] transition-colors text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Maps
              </a>
            </div>
          </div>

          {/* Owner contact - only show if locked or has owner info */}
          {booking.ownerName && (
            <div className="bg-[#F5F5F3] rounded-xl p-4 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                  <span className="text-lg">👤</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-[#1A1A1A]">{booking.ownerName}</p>
                  <p className="text-xs text-[#6B6B6B]">Property Owner</p>
                </div>
                {booking.ownerPhone && isLocked && (
                  <a
                    href={`tel:${booking.ownerPhone}`}
                    className="flex items-center gap-2 px-3 py-2 bg-[#E8F5E9] text-[#2E7D32] rounded-lg font-medium text-sm"
                  >
                    <span>📞</span>
                    Call
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Key holder contact - only show when access notes are visible */}
          {booking.keyHolderName && booking.keyHolderPhone && (
            <div className="bg-[#E3F2FD] border border-[#90CAF9] rounded-xl p-4 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                  <span className="text-lg">🔑</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-[#1A1A1A]">{booking.keyHolderName}</p>
                  <p className="text-xs text-[#6B6B6B]">Key Holder</p>
                </div>
                {isLocked && (
                  <a
                    href={`tel:${booking.keyHolderPhone}`}
                    className="flex items-center gap-2 px-3 py-2 bg-[#1565C0] text-white rounded-lg font-medium text-sm"
                  >
                    <span>📞</span>
                    Call
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Access notes */}
          {booking.accessNotes && (
            <div className="bg-[#FFF8E1] border border-[#FFE082] rounded-xl p-4 mb-3">
              <div className="flex items-start gap-3">
                <span className="text-lg">🔑</span>
                <div>
                  <p className="font-medium text-[#1A1A1A] mb-1">Access Notes</p>
                  <p className="text-sm text-[#6B6B6B]">{booking.accessNotes}</p>
                </div>
              </div>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center justify-between py-3 border-t border-[#EBEBEB]">
            <span className="text-[#6B6B6B]">Total</span>
            <span className="text-2xl font-bold text-[#1A1A1A]">€{booking.price}</span>
          </div>

          {/* LOCKED MODE: Show all interactive elements */}
          {isLocked && (
            <>
              {/* Quick WhatsApp Messages */}
              {booking.ownerPhone && (
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    <p className="text-xs font-medium text-[#6B6B6B]">Message {booking.ownerName?.split(' ')[0] || 'owner'} on WhatsApp</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {messageTemplates.map((template, i) => (
                      <button
                        key={i}
                        onClick={() => handleWhatsAppMessage(template)}
                        className="flex items-center gap-2 p-3 bg-[#E7FAE7] border border-[#25D366]/20 rounded-xl text-sm text-[#1A1A1A] hover:bg-[#D4F5D4] transition-colors text-left"
                      >
                        <span>{template.emoji}</span>
                        <span className="truncate">{labels[template.labelKey as keyof typeof labels] || template.labelKey}</span>
                      </button>
                    ))}
                  </div>

                  {/* Custom message input */}
                  {showCustomMessage ? (
                    <div className="mt-2 flex gap-2">
                      <input
                        type="text"
                        value={customMessage}
                        onChange={(e) => setCustomMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-3 py-2 border border-[#25D366]/30 rounded-xl text-sm focus:outline-none focus:border-[#25D366]"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleCustomWhatsAppMessage()}
                      />
                      <button
                        onClick={handleCustomWhatsAppMessage}
                        disabled={!customMessage.trim()}
                        className="px-4 py-2 bg-[#25D366] text-white rounded-xl text-sm font-medium disabled:opacity-50 flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        Send
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowCustomMessage(true)}
                      className="mt-2 w-full p-3 border border-dashed border-[#25D366]/40 rounded-xl text-sm text-[#25D366] hover:bg-[#E7FAE7] transition-colors"
                    >
                      + {labels.customMessage || 'Custom message'}
                    </button>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="mt-4 space-y-2">
                {/* Pending: Accept/Decline */}
                {isPending && (onAccept || onDecline) && (
                  <div className="flex gap-2">
                    {onDecline && (
                      <button
                        onClick={() => {
                          onDecline(booking.id)
                          onClose()
                        }}
                        className="flex-1 py-3 px-4 border border-[#DEDEDE] rounded-xl font-medium text-[#6B6B6B] hover:bg-[#F5F5F3] transition-colors"
                      >
                        Decline
                      </button>
                    )}
                    {onAccept && (
                      <button
                        onClick={() => {
                          onAccept(booking.id)
                          onClose()
                        }}
                        className="flex-1 py-3 px-4 bg-[#2E7D32] text-white rounded-xl font-medium hover:bg-[#1B5E20] transition-colors"
                      >
                        Accept Job
                      </button>
                    )}
                  </div>
                )}

                {/* Confirmed + Today: Complete - shows checklist first */}
                {canComplete && onComplete && (
                  <button
                    onClick={() => setShowCompletionChecklist(true)}
                    className="w-full py-3 px-4 bg-[#1A1A1A] text-white rounded-xl font-medium hover:bg-[#333] transition-colors flex items-center justify-center gap-2"
                  >
                    <span>✓</span>
                    Mark as Complete
                  </button>
                )}

                {/* Close button */}
                <button
                  onClick={onClose}
                  className="w-full py-3 px-4 text-[#6B6B6B] font-medium hover:text-[#1A1A1A] transition-colors"
                >
                  Close
                </button>
              </div>
            </>
          )}

          {/* PEEK MODE: Show release hint */}
          {!isLocked && (
            <p className="text-center text-xs text-[#9B9B9B] mt-3">
              {lockProgress > 0.5 ? 'Keep holding to unlock...' : 'Release to close · Hold longer to unlock'}
            </p>
          )}
        </div>
      </div>

      {/* Completion Checklist Modal */}
      <CompletionChecklistModal
        isVisible={showCompletionChecklist}
        onClose={() => setShowCompletionChecklist(false)}
        onConfirm={() => {
          if (onComplete && booking) {
            onComplete(booking.id)
          }
          onClose()
        }}
        bookingId={booking?.id || ''}
        propertyAddress={booking?.propertyAddress || ''}
        propertyName={booking?.propertyName}
        accessNotes={booking?.accessNotes}
        keyHolderName={booking?.keyHolderName}
        ownerName={booking?.ownerName}
        ownerPhone={booking?.ownerPhone}
        ownerLanguage={ownerLanguage || booking?.ownerLanguage || 'en'}
        cleanerName={cleanerName}
      />
    </div>
  )
}
