'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

type Lang = 'en' | 'es'

const translations = {
  en: {
    backToHome: 'Back to Home',
    tryCta: 'Try It Now',
    badge: 'AI-Powered',
    title: 'Meet Your Villa Assistant',
    subtitle: 'Every cleaner profile has an AI assistant that speaks your language, answers your questions, and helps you book instantly.',
    readyTitle: 'Ready to try it?',
    readyText: 'Visit any cleaner profile and click "Chat with [Name]" to start a conversation. The assistant responds instantly in your language.',
    findCleaner: 'Find a Cleaner',
    features: 'No app needed · Speaks 7 languages · Books for you',
    faqTitle: 'How It Works',
    contact: 'Questions? Contact us at hello@alicantecleaners.com',
    capabilities: [
      {
        title: 'Ask about pricing',
        description: 'Get instant, accurate quotes for any service. The assistant knows exact prices based on the cleaner\'s hourly rate.',
        tip: 'Ask "How much for a deep clean of my 3-bedroom villa?" and get a precise answer.',
      },
      {
        title: 'Check availability',
        description: 'Find out which dates and times work. The assistant has real-time access to the cleaner\'s calendar.',
        tip: 'Try "Are you free this Saturday morning?" - it checks the actual calendar.',
      },
      {
        title: 'Speak any language',
        description: 'Ask in English, Spanish, German, French, Dutch, Italian, or Portuguese. The assistant responds in your language automatically.',
        tip: 'This example shows a Spanish conversation - the assistant detected the language and responded fluently.',
      },
      {
        title: 'Check service areas',
        description: 'Verify if your location is covered before booking. The assistant knows exactly which areas each cleaner serves.',
        tip: 'This German visitor asked about El Campello - the assistant correctly identified it\'s outside Clara\'s service area.',
      },
      {
        title: 'Get accurate info',
        description: 'Ask about what\'s included (or not). The assistant won\'t make things up - it gives honest, accurate answers.',
        tip: 'Questions about laundry, supplies, or special requests get clear, truthful responses.',
      },
      {
        title: 'Book step by step',
        description: 'When you\'re ready, the assistant guides you through providing all the details needed for a booking.',
        tip: 'Just say "I\'d like to book" and the assistant walks you through dates, property details, and contact info.',
      },
      {
        title: 'Complete your booking',
        description: 'Once you provide all details, the assistant creates a magic link and sends it to your phone via SMS.',
        tip: 'You receive a pre-filled booking page - just add your email and property name to confirm.',
      },
    ],
    faqs: [
      {
        q: 'Is my conversation private?',
        a: 'Yes. Conversations are only between you and the cleaner\'s profile. We don\'t share your messages or personal information.',
      },
      {
        q: 'How does it know the cleaner\'s info?',
        a: 'The assistant has access to the cleaner\'s profile: their rates, service areas, availability, and reviews. It gives accurate, personalized answers.',
      },
      {
        q: 'Can I book directly through chat?',
        a: 'Yes! Provide your details (date, property info, phone) and the assistant sends you a magic link to complete the booking securely.',
      },
      {
        q: 'What languages are supported?',
        a: 'English, Spanish, German, French, Dutch, Italian, and Portuguese. The assistant auto-detects your language and responds accordingly.',
      },
    ],
  },
  es: {
    backToHome: 'Volver',
    tryCta: 'Pruébalo',
    badge: 'Con IA',
    title: 'Tu Asistente de Villa',
    subtitle: 'Cada perfil de limpiador tiene un asistente IA que habla tu idioma, responde tus preguntas y te ayuda a reservar al instante.',
    readyTitle: '¿Listo para probarlo?',
    readyText: 'Visita cualquier perfil de limpiador y haz clic en "Chatear con [Nombre]" para iniciar una conversación. El asistente responde instantáneamente en tu idioma.',
    findCleaner: 'Buscar limpiador',
    features: 'Sin app · Habla 7 idiomas · Reserva por ti',
    faqTitle: 'Cómo Funciona',
    contact: '¿Preguntas? Escríbenos a hello@alicantecleaners.com',
    capabilities: [
      {
        title: 'Pregunta por precios',
        description: 'Obtén presupuestos instantáneos y precisos para cualquier servicio. El asistente conoce los precios exactos según la tarifa del limpiador.',
        tip: 'Pregunta "¿Cuánto cuesta una limpieza profunda de mi villa de 3 dormitorios?" y obtén una respuesta precisa.',
      },
      {
        title: 'Consulta disponibilidad',
        description: 'Descubre qué fechas y horarios funcionan. El asistente tiene acceso en tiempo real al calendario del limpiador.',
        tip: 'Prueba "¿Estás libre este sábado por la mañana?" - consulta el calendario real.',
      },
      {
        title: 'Habla cualquier idioma',
        description: 'Pregunta en inglés, español, alemán, francés, holandés, italiano o portugués. El asistente responde en tu idioma automáticamente.',
        tip: 'Este ejemplo muestra una conversación en español - el asistente detectó el idioma y respondió con fluidez.',
      },
      {
        title: 'Verifica zonas de servicio',
        description: 'Confirma si tu ubicación está cubierta antes de reservar. El asistente sabe exactamente qué zonas cubre cada limpiador.',
        tip: 'Este visitante alemán preguntó sobre El Campello - el asistente identificó correctamente que está fuera de la zona de Clara.',
      },
      {
        title: 'Información precisa',
        description: 'Pregunta qué está incluido (o no). El asistente no inventa - da respuestas honestas y precisas.',
        tip: 'Preguntas sobre lavandería, suministros o solicitudes especiales obtienen respuestas claras y veraces.',
      },
      {
        title: 'Reserva paso a paso',
        description: 'Cuando estés listo, el asistente te guía para proporcionar todos los detalles necesarios para una reserva.',
        tip: 'Solo di "Me gustaría reservar" y el asistente te guía con fechas, detalles de la propiedad e información de contacto.',
      },
      {
        title: 'Completa tu reserva',
        description: 'Una vez que proporcionas todos los detalles, el asistente crea un enlace mágico y lo envía a tu teléfono por SMS.',
        tip: 'Recibes una página de reserva pre-rellenada - solo añade tu email y nombre de propiedad para confirmar.',
      },
    ],
    faqs: [
      {
        q: '¿Mi conversación es privada?',
        a: 'Sí. Las conversaciones son solo entre tú y el perfil del limpiador. No compartimos tus mensajes ni información personal.',
      },
      {
        q: '¿Cómo conoce la información del limpiador?',
        a: 'El asistente tiene acceso al perfil del limpiador: sus tarifas, zonas de servicio, disponibilidad y reseñas. Da respuestas precisas y personalizadas.',
      },
      {
        q: '¿Puedo reservar directamente por chat?',
        a: '¡Sí! Proporciona tus detalles (fecha, información de propiedad, teléfono) y el asistente te envía un enlace mágico para completar la reserva de forma segura.',
      },
      {
        q: '¿Qué idiomas están soportados?',
        a: 'Inglés, español, alemán, francés, holandés, italiano y portugués. El asistente auto-detecta tu idioma y responde acordemente.',
      },
    ],
  },
}

const capabilityImages = [
  '/features/ai-assistant/test1-pricing.png',
  '/features/ai-assistant/test2-availability.png',
  '/features/ai-assistant/test3-spanish.png',
  '/features/ai-assistant/test4-german-service-area.png',
  '/features/ai-assistant/test5-edge-case-services.png',
  '/features/ai-assistant/test6-booking-guidance.png',
  '/features/ai-assistant/test7-booking-complete-magic-link.png',
]

const languageFlags = [
  { code: 'en', flag: '🇬🇧', name: 'English' },
  { code: 'es', flag: '🇪🇸', name: 'Español' },
  { code: 'de', flag: '🇩🇪', name: 'Deutsch' },
  { code: 'fr', flag: '🇫🇷', name: 'Français' },
  { code: 'nl', flag: '🇳🇱', name: 'Nederlands' },
  { code: 'it', flag: '🇮🇹', name: 'Italiano' },
  { code: 'pt', flag: '🇵🇹', name: 'Português' },
]

export default function AIAssistantFeature() {
  const [lang, setLang] = useState<Lang>('en')
  const t = translations[lang]

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Header */}
      <header className="bg-white border-b border-[#EBEBEB] sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-[#6B6B6B] hover:text-[#1A1A1A]">
            <span>←</span>
            <span>{t.backToHome}</span>
          </Link>
          <div className="flex items-center gap-3">
            {/* Language Toggle */}
            <div className="flex items-center bg-[#F5F5F3] rounded-lg p-1">
              <button
                onClick={() => setLang('en')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  lang === 'en' ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#6B6B6B]'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLang('es')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  lang === 'es' ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#6B6B6B]'
                }`}
              >
                ES
              </button>
            </div>
            <Link
              href="/#cleaners"
              className="bg-[#C4785A] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#B56A4F] transition-colors"
            >
              {t.tryCta}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-white to-[#FAFAF8] py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-[#E8F5E9] text-[#2E7D32] px-3 py-1 rounded-full text-sm font-medium mb-4">
            <span>🤖</span>
            <span>{t.badge}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-4">
            {t.title}
          </h1>
          <p className="text-[#6B6B6B] text-lg max-w-xl mx-auto mb-6">
            {t.subtitle}
          </p>

          {/* Language flags */}
          <div className="flex justify-center gap-2 flex-wrap">
            {languageFlags.map((l) => (
              <div
                key={l.code}
                className="flex items-center gap-1 px-3 py-1.5 bg-white border border-[#EBEBEB] rounded-full text-sm"
              >
                <span>{l.flag}</span>
                <span className="text-[#6B6B6B]">{l.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="py-8 px-4">
        <div className="max-w-3xl mx-auto space-y-12">
          {t.capabilities.map((capability, index) => (
            <div
              key={index}
              className={`flex flex-col ${index % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row'} gap-6 md:gap-10 items-center`}
            >
              {/* Phone mockup */}
              <div className="w-full md:w-1/2 flex justify-center">
                <div className="relative">
                  {/* Phone frame */}
                  <div className="w-[280px] h-[560px] bg-[#1A1A1A] rounded-[40px] p-3 shadow-2xl">
                    <div className="w-full h-full bg-white rounded-[32px] overflow-hidden relative">
                      {/* Notch */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-[#1A1A1A] rounded-b-2xl z-10" />
                      {/* Screenshot */}
                      <Image
                        src={capabilityImages[index]}
                        alt={capability.title}
                        fill
                        className="object-cover object-top"
                      />
                    </div>
                  </div>
                  {/* Step number badge */}
                  <div className="absolute -top-3 -left-3 w-10 h-10 bg-[#C4785A] text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                    {index + 1}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="w-full md:w-1/2 text-center md:text-left">
                <h2 className="text-xl md:text-2xl font-semibold text-[#1A1A1A] mb-3">
                  {capability.title}
                </h2>
                <p className="text-[#6B6B6B] mb-4">
                  {capability.description}
                </p>
                {capability.tip && (
                  <div className="bg-[#FFF8E1] border border-[#FFE082] rounded-xl p-4 text-left">
                    <div className="flex items-start gap-2">
                      <span className="text-lg">💡</span>
                      <p className="text-sm text-[#F57C00]">{capability.tip}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 px-4 bg-white border-t border-[#EBEBEB]">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4">
            {t.readyTitle}
          </h2>
          <p className="text-[#6B6B6B] mb-6">
            {t.readyText}
          </p>
          <Link
            href="/#cleaners"
            className="inline-block bg-[#C4785A] text-white px-8 py-4 rounded-xl font-medium text-lg hover:bg-[#B56A4F] transition-colors"
          >
            {t.findCleaner}
          </Link>
          <p className="text-sm text-[#9B9B9B] mt-4">
            {t.features}
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 px-4">
        <div className="max-w-xl mx-auto">
          <h2 className="text-xl font-bold text-[#1A1A1A] mb-6 text-center">
            {t.faqTitle}
          </h2>
          <div className="space-y-4">
            {t.faqs.map((faq, index) => (
              <details key={index} className="bg-white rounded-xl p-4 border border-[#EBEBEB] group">
                <summary className="font-medium text-[#1A1A1A] cursor-pointer list-none flex justify-between items-center">
                  {faq.q}
                  <span className="text-[#9B9B9B] group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="text-[#6B6B6B] mt-3 text-sm">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-4 border-t border-[#EBEBEB]">
        <div className="max-w-xl mx-auto text-center text-sm text-[#9B9B9B]">
          <p>{t.contact}</p>
        </div>
      </footer>
    </div>
  )
}
