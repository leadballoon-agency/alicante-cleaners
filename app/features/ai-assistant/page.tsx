'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

type Lang = 'en' | 'es'

const translations = {
  en: {
    backToHome: 'Back to Home',
    tryCta: 'Join Now',
    badge: 'AI-Powered',
    title: 'Your AI Sales Assistant',
    subtitle: 'Your profile includes an AI assistant that answers client questions, handles pricing inquiries, and helps them book - while you focus on cleaning.',
    readyTitle: 'Get more bookings automatically',
    readyText: 'Join Alicante Cleaners and your profile will have its own AI assistant. It works 24/7, speaks 7 languages, and never misses an inquiry.',
    joinNow: 'Join as a Cleaner',
    features: 'Works while you sleep · Speaks 7 languages · Handles bookings',
    faqTitle: 'How It Works For You',
    contact: 'Questions? Contact us at hello@alicantecleaners.com',
    capabilities: [
      {
        title: 'Answers pricing questions',
        description: 'Clients ask "How much for a 3-bedroom villa?" and your assistant gives them instant, accurate quotes based on your rates.',
        tip: 'You set your hourly rate once. The AI calculates quotes automatically for regular, deep, and arrival prep cleans.',
      },
      {
        title: 'Checks your calendar',
        description: 'When clients ask about availability, your assistant checks your real calendar and suggests times that work.',
        tip: 'Sync with Google Calendar and your AI always knows when you\'re free.',
      },
      {
        title: 'Speaks their language',
        description: 'British, German, Dutch, French clients - your assistant responds in their language automatically. No translation needed.',
        tip: 'This example shows a Spanish conversation - but it works just as well in English, German, French, Dutch, Italian, or Portuguese.',
      },
      {
        title: 'Knows your service areas',
        description: 'If someone asks about an area you don\'t cover, your assistant politely lets them know and suggests alternatives.',
        tip: 'This German visitor asked about El Campello - the assistant correctly identified it\'s outside this cleaner\'s service area.',
      },
      {
        title: 'Gives honest answers',
        description: 'Your assistant won\'t promise things you don\'t offer. It gives clear, accurate information based on your profile.',
        tip: 'Questions about laundry, supplies, or special requests get clear, truthful responses.',
      },
      {
        title: 'Guides them to book',
        description: 'When clients are ready, your assistant collects all the details needed - date, property info, contact details.',
        tip: 'No back-and-forth messaging needed. The AI gathers everything in one conversation.',
      },
      {
        title: 'Creates the booking',
        description: 'Once details are collected, your assistant sends them a magic link. They complete the booking, you get notified via WhatsApp.',
        tip: 'You receive a WhatsApp with all the booking details. Just reply ACCEPT to confirm.',
      },
    ],
    faqs: [
      {
        q: 'Do I need to monitor the chat?',
        a: 'No! The AI handles everything. You only get notified when there\'s an actual booking request ready for you to accept.',
      },
      {
        q: 'What if the AI gets something wrong?',
        a: 'The AI only uses information from your profile - your rates, areas, and availability. It won\'t make things up or promise things you don\'t offer.',
      },
      {
        q: 'How do bookings come through?',
        a: 'You get a WhatsApp message with all the details. Reply ACCEPT or DECLINE. The owner gets notified automatically.',
      },
      {
        q: 'Does this cost extra?',
        a: 'No. The AI assistant is included with your Alicante Cleaners profile at no additional cost.',
      },
    ],
  },
  es: {
    backToHome: 'Volver',
    tryCta: 'Únete',
    badge: 'Con IA',
    title: 'Tu Asistente de Ventas IA',
    subtitle: 'Tu perfil incluye un asistente IA que responde preguntas de clientes, gestiona consultas de precios y les ayuda a reservar - mientras tú te concentras en limpiar.',
    readyTitle: 'Consigue más reservas automáticamente',
    readyText: 'Únete a Alicante Cleaners y tu perfil tendrá su propio asistente IA. Funciona 24/7, habla 7 idiomas y nunca pierde una consulta.',
    joinNow: 'Únete como Limpiador/a',
    features: 'Funciona mientras duermes · Habla 7 idiomas · Gestiona reservas',
    faqTitle: 'Cómo Funciona Para Ti',
    contact: '¿Preguntas? Escríbenos a hello@alicantecleaners.com',
    capabilities: [
      {
        title: 'Responde preguntas de precios',
        description: 'Los clientes preguntan "¿Cuánto cuesta una villa de 3 dormitorios?" y tu asistente les da presupuestos instantáneos y precisos basados en tus tarifas.',
        tip: 'Tú estableces tu tarifa por hora una vez. La IA calcula presupuestos automáticamente para limpiezas regulares, profundas y de llegada.',
      },
      {
        title: 'Consulta tu calendario',
        description: 'Cuando los clientes preguntan por disponibilidad, tu asistente consulta tu calendario real y sugiere horarios que te vienen bien.',
        tip: 'Sincroniza con Google Calendar y tu IA siempre sabe cuándo estás libre.',
      },
      {
        title: 'Habla su idioma',
        description: 'Clientes británicos, alemanes, holandeses, franceses - tu asistente responde en su idioma automáticamente. Sin necesidad de traducción.',
        tip: 'Este ejemplo muestra una conversación en español - pero funciona igual de bien en inglés, alemán, francés, holandés, italiano o portugués.',
      },
      {
        title: 'Conoce tus zonas de servicio',
        description: 'Si alguien pregunta por una zona que no cubres, tu asistente se lo comunica amablemente y sugiere alternativas.',
        tip: 'Este visitante alemán preguntó sobre El Campello - el asistente identificó correctamente que está fuera de la zona de servicio de esta limpiadora.',
      },
      {
        title: 'Da respuestas honestas',
        description: 'Tu asistente no prometerá cosas que no ofreces. Da información clara y precisa basada en tu perfil.',
        tip: 'Preguntas sobre lavandería, suministros o solicitudes especiales obtienen respuestas claras y veraces.',
      },
      {
        title: 'Les guía para reservar',
        description: 'Cuando los clientes están listos, tu asistente recoge todos los detalles necesarios - fecha, información de la propiedad, datos de contacto.',
        tip: 'Sin necesidad de intercambiar mensajes. La IA recopila todo en una conversación.',
      },
      {
        title: 'Crea la reserva',
        description: 'Una vez recogidos los detalles, tu asistente les envía un enlace mágico. Ellos completan la reserva, tú recibes notificación por WhatsApp.',
        tip: 'Recibes un WhatsApp con todos los detalles de la reserva. Solo responde ACEPTAR para confirmar.',
      },
    ],
    faqs: [
      {
        q: '¿Tengo que vigilar el chat?',
        a: '¡No! La IA lo gestiona todo. Solo recibes notificación cuando hay una solicitud de reserva real lista para que la aceptes.',
      },
      {
        q: '¿Y si la IA se equivoca?',
        a: 'La IA solo usa información de tu perfil - tus tarifas, zonas y disponibilidad. No inventará cosas ni prometerá lo que no ofreces.',
      },
      {
        q: '¿Cómo llegan las reservas?',
        a: 'Recibes un mensaje de WhatsApp con todos los detalles. Responde ACEPTAR o RECHAZAR. El propietario recibe notificación automáticamente.',
      },
      {
        q: '¿Esto cuesta extra?',
        a: 'No. El asistente IA está incluido con tu perfil de Alicante Cleaners sin coste adicional.',
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
  const [lang, setLang] = useState<Lang>('es')
  const t = translations[lang]

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Header */}
      <header className="bg-white border-b border-[#EBEBEB] sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/join" className="flex items-center gap-2 text-[#6B6B6B] hover:text-[#1A1A1A]">
            <span>←</span>
            <span>{t.backToHome}</span>
          </Link>
          <div className="flex items-center gap-3">
            {/* Language Toggle */}
            <div className="flex items-center bg-[#F5F5F3] rounded-lg p-1">
              <button
                onClick={() => setLang('es')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  lang === 'es' ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#6B6B6B]'
                }`}
              >
                🇪🇸 ES
              </button>
              <button
                onClick={() => setLang('en')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  lang === 'en' ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#6B6B6B]'
                }`}
              >
                🇬🇧 EN
              </button>
            </div>
            <Link
              href="/join"
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
            href="/join"
            className="inline-block bg-[#C4785A] text-white px-8 py-4 rounded-xl font-medium text-lg hover:bg-[#B56A4F] transition-colors"
          >
            {t.joinNow}
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
