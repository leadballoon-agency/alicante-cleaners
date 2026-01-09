'use client'

import { useState, useEffect, useMemo } from 'react'

// Checklist item type
interface ChecklistItem {
  id: string
  label: string
  emoji: string
  checked: boolean
  required?: boolean // Required items must be checked
}

// Supported languages
type SupportedLang = 'en' | 'es' | 'de' | 'fr' | 'nl' | 'pt' | 'it'

interface Props {
  isVisible: boolean
  onClose: () => void
  onConfirm: () => void // Called after WhatsApp opens
  // Booking data
  bookingId: string
  propertyAddress: string
  propertyName?: string
  accessNotes?: string
  keyHolderName?: string | null
  // Owner data for WhatsApp
  ownerName?: string
  ownerPhone?: string
  ownerLanguage?: string
  // Cleaner name for personalization
  cleanerName?: string
}

// Multi-language labels for checklist items
const CHECKLIST_LABELS: Record<SupportedLang, {
  title: string
  subtitle: string
  keysReturned: (name: string) => string
  doorsLocked: string
  windowsClosed: string
  lightsOff: string
  poolPumpOn: string
  acOff: string
  binsOut: string
  alarmSet: string
  confirm: string
  cancel: string
  sendingTo: string
}> = {
  en: {
    title: 'Completion Checklist',
    subtitle: 'Please confirm before marking complete',
    keysReturned: (name) => `Keys returned to ${name}`,
    doorsLocked: 'All doors locked',
    windowsClosed: 'Windows closed',
    lightsOff: 'Lights turned off',
    poolPumpOn: 'Pool pump on',
    acOff: 'AC / heating off',
    binsOut: 'Bins taken out',
    alarmSet: 'Alarm set',
    confirm: 'Send Completion Message',
    cancel: 'Cancel',
    sendingTo: 'Sending to',
  },
  es: {
    title: 'Lista de Verificación',
    subtitle: 'Por favor confirma antes de completar',
    keysReturned: (name) => `Llaves entregadas a ${name}`,
    doorsLocked: 'Todas las puertas cerradas',
    windowsClosed: 'Ventanas cerradas',
    lightsOff: 'Luces apagadas',
    poolPumpOn: 'Bomba de piscina encendida',
    acOff: 'Aire/calefacción apagado',
    binsOut: 'Basura sacada',
    alarmSet: 'Alarma activada',
    confirm: 'Enviar Mensaje',
    cancel: 'Cancelar',
    sendingTo: 'Enviando a',
  },
  de: {
    title: 'Checkliste',
    subtitle: 'Bitte bestätigen Sie vor Abschluss',
    keysReturned: (name) => `Schlüssel an ${name} zurückgegeben`,
    doorsLocked: 'Alle Türen abgeschlossen',
    windowsClosed: 'Fenster geschlossen',
    lightsOff: 'Lichter ausgeschaltet',
    poolPumpOn: 'Poolpumpe an',
    acOff: 'Klimaanlage / Heizung aus',
    binsOut: 'Müll rausgebracht',
    alarmSet: 'Alarm aktiviert',
    confirm: 'Nachricht senden',
    cancel: 'Abbrechen',
    sendingTo: 'Senden an',
  },
  fr: {
    title: 'Liste de Vérification',
    subtitle: 'Veuillez confirmer avant de terminer',
    keysReturned: (name) => `Clés rendues à ${name}`,
    doorsLocked: 'Toutes les portes verrouillées',
    windowsClosed: 'Fenêtres fermées',
    lightsOff: 'Lumières éteintes',
    poolPumpOn: 'Pompe de piscine allumée',
    acOff: 'Climatisation / chauffage éteint',
    binsOut: 'Poubelles sorties',
    alarmSet: 'Alarme activée',
    confirm: 'Envoyer le message',
    cancel: 'Annuler',
    sendingTo: 'Envoi à',
  },
  nl: {
    title: 'Checklist',
    subtitle: 'Bevestig voordat u afrondt',
    keysReturned: (name) => `Sleutels teruggegeven aan ${name}`,
    doorsLocked: 'Alle deuren op slot',
    windowsClosed: 'Ramen gesloten',
    lightsOff: 'Lichten uit',
    poolPumpOn: 'Zwembadpomp aan',
    acOff: 'Airco / verwarming uit',
    binsOut: 'Afval buiten gezet',
    alarmSet: 'Alarm ingesteld',
    confirm: 'Bericht versturen',
    cancel: 'Annuleren',
    sendingTo: 'Versturen naar',
  },
  pt: {
    title: 'Lista de Verificação',
    subtitle: 'Por favor confirme antes de concluir',
    keysReturned: (name) => `Chaves devolvidas a ${name}`,
    doorsLocked: 'Todas as portas trancadas',
    windowsClosed: 'Janelas fechadas',
    lightsOff: 'Luzes apagadas',
    poolPumpOn: 'Bomba da piscina ligada',
    acOff: 'Ar condicionado / aquecimento desligado',
    binsOut: 'Lixo retirado',
    alarmSet: 'Alarme ativado',
    confirm: 'Enviar mensagem',
    cancel: 'Cancelar',
    sendingTo: 'Enviando para',
  },
  it: {
    title: 'Checklist',
    subtitle: 'Per favore conferma prima di completare',
    keysReturned: (name) => `Chiavi restituite a ${name}`,
    doorsLocked: 'Tutte le porte chiuse',
    windowsClosed: 'Finestre chiuse',
    lightsOff: 'Luci spente',
    poolPumpOn: 'Pompa piscina accesa',
    acOff: 'Aria condizionata / riscaldamento spento',
    binsOut: 'Spazzatura portata fuori',
    alarmSet: 'Allarme attivato',
    confirm: 'Invia messaggio',
    cancel: 'Annulla',
    sendingTo: 'Invio a',
  },
}

// Completion message templates in different languages
const COMPLETION_MESSAGES: Record<SupportedLang, {
  greeting: (ownerName: string) => string
  intro: (cleanerName: string, property: string) => string
  checklistHeader: string
  ready: string
  signoff: (cleanerName: string) => string
}> = {
  en: {
    greeting: (ownerName) => `Hi ${ownerName}! ✨`,
    intro: (cleanerName, property) => `It's ${cleanerName} from VillaCare. I've just finished cleaning ${property} - everything is sparkling!`,
    checklistHeader: 'Completion checklist:',
    ready: 'Everything is ready for you! Let me know if you have any questions.',
    signoff: (cleanerName) => `- ${cleanerName}`,
  },
  es: {
    greeting: (ownerName) => `¡Hola ${ownerName}! ✨`,
    intro: (cleanerName, property) => `Soy ${cleanerName} de VillaCare. Acabo de terminar la limpieza de ${property} - ¡todo está impecable!`,
    checklistHeader: 'Lista de verificación:',
    ready: '¡Todo está listo para ti! Avísame si tienes alguna pregunta.',
    signoff: (cleanerName) => `- ${cleanerName}`,
  },
  de: {
    greeting: (ownerName) => `Hallo ${ownerName}! ✨`,
    intro: (cleanerName, property) => `Hier ist ${cleanerName} von VillaCare. Ich habe die Reinigung von ${property} abgeschlossen - alles glänzt!`,
    checklistHeader: 'Checkliste:',
    ready: 'Alles ist bereit für dich! Melde dich bei Fragen.',
    signoff: (cleanerName) => `- ${cleanerName}`,
  },
  fr: {
    greeting: (ownerName) => `Bonjour ${ownerName} ! ✨`,
    intro: (cleanerName, property) => `C'est ${cleanerName} de VillaCare. Je viens de terminer le ménage de ${property} - tout est impeccable !`,
    checklistHeader: 'Liste de vérification :',
    ready: 'Tout est prêt pour vous ! N\'hésitez pas si vous avez des questions.',
    signoff: (cleanerName) => `- ${cleanerName}`,
  },
  nl: {
    greeting: (ownerName) => `Hallo ${ownerName}! ✨`,
    intro: (cleanerName, property) => `Dit is ${cleanerName} van VillaCare. Ik heb net ${property} schoongemaakt - alles blinkt!`,
    checklistHeader: 'Checklist:',
    ready: 'Alles is klaar voor je! Laat het weten als je vragen hebt.',
    signoff: (cleanerName) => `- ${cleanerName}`,
  },
  pt: {
    greeting: (ownerName) => `Olá ${ownerName}! ✨`,
    intro: (cleanerName, property) => `Aqui é ${cleanerName} da VillaCare. Acabei de terminar a limpeza de ${property} - está tudo impecável!`,
    checklistHeader: 'Lista de verificação:',
    ready: 'Tudo está pronto para você! Me avise se tiver alguma dúvida.',
    signoff: (cleanerName) => `- ${cleanerName}`,
  },
  it: {
    greeting: (ownerName) => `Ciao ${ownerName}! ✨`,
    intro: (cleanerName, property) => `Sono ${cleanerName} di VillaCare. Ho appena finito di pulire ${property} - tutto splende!`,
    checklistHeader: 'Checklist:',
    ready: 'Tutto è pronto per te! Fammi sapere se hai domande.',
    signoff: (cleanerName) => `- ${cleanerName}`,
  },
}

// Keywords to detect in access notes
const KEYWORDS = {
  pool: ['pool', 'piscina', 'schwimmbad', 'piscine', 'zwembad'],
  alarm: ['alarm', 'alarma', 'allarme', 'alarme'],
  bins: ['bin', 'trash', 'garbage', 'basura', 'müll', 'poubelle', 'afval', 'lixo', 'spazzatura'],
  ac: ['ac', 'air con', 'heating', 'calefaccion', 'heizung', 'chauffage', 'verwarming', 'aquecimento', 'riscaldamento', 'aire'],
}

// Check if text contains any keywords
const containsKeyword = (text: string, keywords: string[]): boolean => {
  const lowerText = text.toLowerCase()
  return keywords.some(keyword => lowerText.includes(keyword))
}

// Generate WhatsApp link
const generateWhatsAppLink = (phone: string, message: string): string => {
  const cleanPhone = phone.replace(/\s/g, '').replace('whatsapp:', '')
  const phoneNumber = cleanPhone.startsWith('+') ? cleanPhone.slice(1) : cleanPhone
  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
}

export default function CompletionChecklistModal({
  isVisible,
  onClose,
  onConfirm,
  bookingId,
  propertyAddress,
  propertyName,
  accessNotes,
  keyHolderName,
  ownerName,
  ownerPhone,
  ownerLanguage = 'en',
  cleanerName = 'Your cleaner',
}: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  // Validate language
  const lang: SupportedLang = ['en', 'es', 'de', 'fr', 'nl', 'pt', 'it'].includes(ownerLanguage)
    ? ownerLanguage as SupportedLang
    : 'en'

  const labels = CHECKLIST_LABELS[lang]
  const messages = COMPLETION_MESSAGES[lang]

  // Generate checklist items based on property data
  const initialItems = useMemo(() => {
    const items: ChecklistItem[] = []
    const notes = accessNotes || ''

    // Always add doors locked (standard)
    items.push({
      id: 'doors',
      label: labels.doorsLocked,
      emoji: '🚪',
      checked: false,
      required: true,
    })

    // Always add windows closed
    items.push({
      id: 'windows',
      label: labels.windowsClosed,
      emoji: '🪟',
      checked: false,
    })

    // Add key holder item if exists
    if (keyHolderName) {
      items.unshift({
        id: 'keys',
        label: labels.keysReturned(keyHolderName),
        emoji: '🔑',
        checked: false,
        required: true,
      })
    }

    // Check for pool mention
    if (containsKeyword(notes, KEYWORDS.pool)) {
      items.push({
        id: 'pool',
        label: labels.poolPumpOn,
        emoji: '🏊',
        checked: false,
      })
    }

    // Check for alarm mention
    if (containsKeyword(notes, KEYWORDS.alarm)) {
      items.push({
        id: 'alarm',
        label: labels.alarmSet,
        emoji: '🚨',
        checked: false,
      })
    }

    // Check for AC/heating mention
    if (containsKeyword(notes, KEYWORDS.ac)) {
      items.push({
        id: 'ac',
        label: labels.acOff,
        emoji: '❄️',
        checked: false,
      })
    }

    // Check for bins mention
    if (containsKeyword(notes, KEYWORDS.bins)) {
      items.push({
        id: 'bins',
        label: labels.binsOut,
        emoji: '🗑️',
        checked: false,
      })
    }

    // Always add lights off
    items.push({
      id: 'lights',
      label: labels.lightsOff,
      emoji: '💡',
      checked: false,
    })

    return items
  }, [accessNotes, keyHolderName, labels])

  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>(initialItems)

  // Reset checklist when modal opens
  useEffect(() => {
    if (isVisible) {
      setChecklistItems(initialItems)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isVisible, initialItems])

  // Toggle item
  const toggleItem = (id: string) => {
    setChecklistItems(items =>
      items.map(item =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    )
  }

  // Check if all required items are checked
  const allRequiredChecked = checklistItems
    .filter(item => item.required)
    .every(item => item.checked)

  // Generate completion message with checklist
  const generateCompletionMessage = (): string => {
    const property = propertyName || propertyAddress.split(',')[0]
    const checkedItems = checklistItems.filter(item => item.checked)

    let message = messages.greeting(ownerName || 'there')
    message += '\n\n'
    message += messages.intro(cleanerName, property)
    message += '\n\n'
    message += messages.checklistHeader
    message += '\n'

    checkedItems.forEach(item => {
      message += `✅ ${item.label}\n`
    })

    message += '\n'
    message += messages.ready
    message += '\n\n'
    message += messages.signoff(cleanerName)

    return message
  }

  // Handle confirm - log event, open WhatsApp with completion message
  const handleConfirm = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)

    try {
      // Build checklist data for API
      const checklistData: Record<string, boolean> = {}
      checklistItems.forEach(item => {
        checklistData[item.id] = item.checked
      })

      // Log the completion event (also sends email)
      await fetch(`/api/dashboard/cleaner/bookings/${bookingId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'COMPLETED',
          data: {
            checklist: checklistData,
            message: generateCompletionMessage()
          }
        })
      })
    } catch (error) {
      console.error('Failed to log completion event:', error)
      // Continue anyway - don't block the completion flow
    }

    // Open WhatsApp if phone available
    if (ownerPhone) {
      const message = generateCompletionMessage()
      const whatsappUrl = generateWhatsAppLink(ownerPhone, message)
      window.open(whatsappUrl, '_blank')
    }

    setIsSubmitting(false)
    onConfirm()
    onClose()
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#2E7D32] to-[#43A047] px-5 py-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>✓</span>
            {labels.title}
          </h2>
          <p className="text-white/80 text-sm mt-0.5">{labels.subtitle}</p>
        </div>

        {/* Checklist */}
        <div className="p-5 max-h-[50vh] overflow-y-auto">
          <div className="space-y-2">
            {checklistItems.map(item => (
              <button
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                  item.checked
                    ? 'bg-[#E8F5E9] border-[#4CAF50]'
                    : 'bg-white border-[#EBEBEB] hover:border-[#C4785A]'
                }`}
              >
                {/* Checkbox */}
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                  item.checked
                    ? 'bg-[#4CAF50] text-white'
                    : 'bg-[#F5F5F3] text-transparent'
                }`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>

                {/* Emoji and label */}
                <span className="text-lg">{item.emoji}</span>
                <span className={`flex-1 text-left text-sm ${
                  item.checked ? 'text-[#2E7D32] font-medium' : 'text-[#1A1A1A]'
                }`}>
                  {item.label}
                </span>

                {/* Required indicator */}
                {item.required && !item.checked && (
                  <span className="text-xs text-[#E65100] font-medium">Required</span>
                )}
              </button>
            ))}
          </div>

          {/* Preview of message recipient */}
          {ownerPhone && ownerName && (
            <div className="mt-4 p-3 bg-[#E7FAE7] rounded-xl border border-[#25D366]/20">
              <div className="flex items-center gap-2 text-sm text-[#1A1A1A]">
                <svg className="w-5 h-5 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <span>{labels.sendingTo} <strong>{ownerName}</strong></span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 space-y-2">
          <button
            onClick={handleConfirm}
            disabled={!allRequiredChecked || isSubmitting}
            className={`w-full py-3.5 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
              allRequiredChecked && !isSubmitting
                ? 'bg-[#25D366] text-white hover:bg-[#1da851]'
                : 'bg-[#EBEBEB] text-[#9B9B9B] cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                {labels.confirm}
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="w-full py-3 text-[#6B6B6B] font-medium hover:text-[#1A1A1A] transition-colors"
          >
            {labels.cancel}
          </button>
        </div>
      </div>
    </div>
  )
}
