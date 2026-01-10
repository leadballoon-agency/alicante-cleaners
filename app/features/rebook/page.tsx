'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

type Lang = 'en' | 'es'

const translations = {
  en: {
    backToDashboard: 'Back to Dashboard',
    bookAClean: 'Book a Clean',
    badge: 'New Features',
    title: 'Rebook in Seconds',
    subtitle: 'Keep your villa spotless with our new quick-action features. One tap to rebook, or set up a recurring schedule that runs itself.',
    howToAccess: 'How to Access',
    step1: 'Go to your',
    step1Bold: 'Past bookings',
    step1End: 'tab',
    step2Bold: 'Hold',
    step2End: 'any completed booking card',
    step3: 'Tap',
    step3Bold1: 'Rebook',
    step3Mid: 'or',
    step3Bold2: 'Make Recurring',
    proTip: 'Pro tip:',
    proTipText: 'The buttons appear when you hold the card for about 1.5 seconds until you feel a vibration.',
    instantTitle: 'Instant Confirmation',
    instantText: 'Your new booking appears immediately in your Upcoming tab',
    booked: 'Booked!',
    faqTitle: 'Common Questions',
    readyTitle: 'Ready to try it?',
    readyText: 'Head to your dashboard and hold any past booking to get started.',
    goToDashboard: 'Go to Dashboard',
    contact: 'Questions? Contact us at hello@alicantecleaners.com',
    features: [
      {
        title: '1-Click Rebook',
        badge: 'Quick Action',
        description: 'Loved your last clean? Rebook the same cleaner with one tap. We automatically schedule for the same day next week.',
        benefits: [
          'Same cleaner who knows your villa',
          'Same service and duration',
          'Automatically picks next available slot',
          'Just tap and confirm',
        ],
      },
      {
        title: 'Make It Recurring',
        badge: 'Set & Forget',
        description: 'Turn any booking into a regular schedule. Weekly, fortnightly, or monthly - your villa stays spotless without lifting a finger.',
        benefits: [
          'Weekly, fortnightly, or monthly options',
          '4 bookings created automatically',
          'Same cleaner every time',
          'Cancel or modify anytime',
        ],
      },
    ],
    faqs: [
      {
        q: "What if my cleaner isn't available?",
        a: 'The booking is created as "Pending" and sent to your cleaner. If they can\'t make it, they\'ll decline and you can choose another time or cleaner.',
      },
      {
        q: 'Can I change the date after rebooking?',
        a: "Yes! You can modify or cancel any booking from your dashboard before it's confirmed.",
      },
      {
        q: 'How do recurring bookings work?',
        a: 'When you choose "Make Recurring", we create the next 4 bookings at your chosen frequency. Each booking is sent to your cleaner for confirmation.',
      },
      {
        q: 'Can I cancel recurring bookings?',
        a: 'Yes, you can cancel individual bookings or the entire recurring series from your dashboard.',
      },
    ],
  },
  es: {
    backToDashboard: 'Volver al Panel',
    bookAClean: 'Reservar Limpieza',
    badge: 'Nuevas Funciones',
    title: 'Reserva en Segundos',
    subtitle: 'Mantén tu villa impecable con nuestras nuevas funciones rápidas. Un toque para reservar de nuevo, o configura un horario recurrente que funciona solo.',
    howToAccess: 'Cómo Acceder',
    step1: 'Ve a la pestaña',
    step1Bold: 'Reservas pasadas',
    step1End: '',
    step2Bold: 'Mantén pulsada',
    step2End: 'cualquier tarjeta de reserva completada',
    step3: 'Toca',
    step3Bold1: 'Reservar de nuevo',
    step3Mid: 'o',
    step3Bold2: 'Hacer recurrente',
    proTip: 'Consejo:',
    proTipText: 'Los botones aparecen cuando mantienes pulsada la tarjeta durante 1.5 segundos hasta que sientas una vibración.',
    instantTitle: 'Confirmación Instantánea',
    instantText: 'Tu nueva reserva aparece inmediatamente en tu pestaña de Próximas',
    booked: '¡Reservado!',
    faqTitle: 'Preguntas Frecuentes',
    readyTitle: '¿Listo para probarlo?',
    readyText: 'Ve a tu panel y mantén pulsada cualquier reserva pasada para empezar.',
    goToDashboard: 'Ir al Panel',
    contact: '¿Preguntas? Escríbenos a hello@alicantecleaners.com',
    features: [
      {
        title: 'Reservar con 1 Clic',
        badge: 'Acción Rápida',
        description: '¿Te encantó tu última limpieza? Reserva el mismo limpiador con un toque. Programamos automáticamente para el mismo día de la próxima semana.',
        benefits: [
          'El mismo limpiador que conoce tu villa',
          'Mismo servicio y duración',
          'Selecciona automáticamente el próximo horario disponible',
          'Solo toca y confirma',
        ],
      },
      {
        title: 'Hacer Recurrente',
        badge: 'Configura y Olvida',
        description: 'Convierte cualquier reserva en un horario regular. Semanal, quincenal o mensual - tu villa se mantiene impecable sin mover un dedo.',
        benefits: [
          'Opciones semanal, quincenal o mensual',
          '4 reservas creadas automáticamente',
          'El mismo limpiador siempre',
          'Cancela o modifica en cualquier momento',
        ],
      },
    ],
    faqs: [
      {
        q: '¿Qué pasa si mi limpiador no está disponible?',
        a: 'La reserva se crea como "Pendiente" y se envía a tu limpiador. Si no puede asistir, la rechazará y podrás elegir otro horario o limpiador.',
      },
      {
        q: '¿Puedo cambiar la fecha después de reservar?',
        a: '¡Sí! Puedes modificar o cancelar cualquier reserva desde tu panel antes de que sea confirmada.',
      },
      {
        q: '¿Cómo funcionan las reservas recurrentes?',
        a: 'Cuando eliges "Hacer Recurrente", creamos las próximas 4 reservas con la frecuencia elegida. Cada reserva se envía a tu limpiador para confirmación.',
      },
      {
        q: '¿Puedo cancelar las reservas recurrentes?',
        a: 'Sí, puedes cancelar reservas individuales o toda la serie recurrente desde tu panel.',
      },
    ],
  },
}

const featureImages = [
  '/features/rebook-success.png',
  '/features/make-recurring-modal.png',
]

const featureBadgeColors = [
  'bg-[#E3F2FD] text-[#1565C0]',
  'bg-[#E8F5E9] text-[#2E7D32]',
]

const featureIcons = ['⚡', '🔄']

export default function RebookFeaturePage() {
  const [lang, setLang] = useState<Lang>('en')
  const t = translations[lang]

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Header */}
      <header className="bg-white border-b border-[#EBEBEB] sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/owner/dashboard" className="flex items-center gap-2 text-[#6B6B6B] hover:text-[#1A1A1A]">
            <span>←</span>
            <span>{t.backToDashboard}</span>
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
                🇬🇧 EN
              </button>
              <button
                onClick={() => setLang('es')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  lang === 'es' ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#6B6B6B]'
                }`}
              >
                🇪🇸 ES
              </button>
            </div>
            <Link
              href="/"
              className="bg-[#C4785A] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#B56A4F] transition-colors"
            >
              {t.bookAClean}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-white to-[#FAFAF8] py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-[#FFF3E0] text-[#E65100] px-3 py-1 rounded-full text-sm font-medium mb-4">
            <span>✨</span>
            <span>{t.badge}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-4">
            {t.title}
          </h1>
          <p className="text-[#6B6B6B] text-lg max-w-xl mx-auto">
            {t.subtitle}
          </p>
        </div>
      </section>

      {/* How to Access */}
      <section className="py-8 px-4 bg-white border-y border-[#EBEBEB]">
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="w-full md:w-1/2">
              <div className="relative max-w-[280px] mx-auto">
                {/* Phone frame */}
                <div className="w-[280px] h-[480px] bg-[#1A1A1A] rounded-[40px] p-3 shadow-2xl">
                  <div className="w-full h-full bg-white rounded-[32px] overflow-hidden relative">
                    {/* Notch */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-[#1A1A1A] rounded-b-2xl z-10" />
                    {/* Screenshot */}
                    <Image
                      src="/features/rebook-and-recurring-buttons.png"
                      alt="Rebook and recurring buttons"
                      fill
                      className="object-cover object-bottom"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="w-full md:w-1/2">
              <h2 className="text-xl font-semibold text-[#1A1A1A] mb-4">
                {t.howToAccess}
              </h2>
              <ol className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-[#C4785A] text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">1</span>
                  <span className="text-[#6B6B6B]">{t.step1} <strong className="text-[#1A1A1A]">{t.step1Bold}</strong> {t.step1End}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-[#C4785A] text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">2</span>
                  <span className="text-[#6B6B6B]"><strong className="text-[#1A1A1A]">{t.step2Bold}</strong> {t.step2End}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-[#C4785A] text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">3</span>
                  <span className="text-[#6B6B6B]">{t.step3} <strong className="text-[#1A1A1A]">{t.step3Bold1}</strong> {t.step3Mid} <strong className="text-[#1A1A1A]">{t.step3Bold2}</strong></span>
                </li>
              </ol>
              <div className="mt-4 bg-[#F5F5F3] rounded-xl p-4">
                <p className="text-sm text-[#6B6B6B]">
                  <span className="font-medium text-[#1A1A1A]">{t.proTip}</span> {t.proTipText}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 px-4">
        <div className="max-w-3xl mx-auto space-y-16">
          {t.features.map((feature, index) => (
            <div
              key={feature.title}
              className={`flex flex-col ${index % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row'} gap-8 items-center`}
            >
              {/* Phone mockup */}
              <div className="w-full md:w-1/2 flex justify-center">
                <div className="relative">
                  <div className="w-[280px] h-[480px] bg-[#1A1A1A] rounded-[40px] p-3 shadow-2xl">
                    <div className="w-full h-full bg-white rounded-[32px] overflow-hidden relative">
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-[#1A1A1A] rounded-b-2xl z-10" />
                      <Image
                        src={featureImages[index]}
                        alt={feature.title}
                        fill
                        className="object-cover object-top"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="w-full md:w-1/2">
                <div className={`inline-flex items-center gap-2 ${featureBadgeColors[index]} px-3 py-1 rounded-full text-sm font-medium mb-3`}>
                  {featureIcons[index]}
                  <span>{feature.badge}</span>
                </div>
                <h2 className="text-2xl font-semibold text-[#1A1A1A] mb-3">
                  {feature.title}
                </h2>
                <p className="text-[#6B6B6B] mb-4">
                  {feature.description}
                </p>
                <ul className="space-y-2">
                  {feature.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-center gap-2 text-[#6B6B6B]">
                      <svg className="w-5 h-5 text-[#2E7D32] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* New Booking Result */}
      <section className="py-12 px-4 bg-white border-y border-[#EBEBEB]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-[#1A1A1A] mb-2">
              {t.instantTitle}
            </h2>
            <p className="text-[#6B6B6B]">
              {t.instantText}
            </p>
          </div>
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-[280px] h-[480px] bg-[#1A1A1A] rounded-[40px] p-3 shadow-2xl">
                <div className="w-full h-full bg-white rounded-[32px] overflow-hidden relative">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-[#1A1A1A] rounded-b-2xl z-10" />
                  <Image
                    src="/features/rebook-new-booking-created.png"
                    alt="New booking created"
                    fill
                    className="object-cover object-top"
                  />
                </div>
              </div>
              {/* Success badge */}
              <div className="absolute -bottom-4 -right-4 bg-[#E8F5E9] text-[#2E7D32] px-4 py-2 rounded-full font-medium shadow-lg flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {t.booked}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
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

      {/* CTA */}
      <section className="py-12 px-4 bg-gradient-to-b from-[#FAFAF8] to-white">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4">
            {t.readyTitle}
          </h2>
          <p className="text-[#6B6B6B] mb-6">
            {t.readyText}
          </p>
          <Link
            href="/owner/dashboard"
            className="inline-block bg-[#1A1A1A] text-white px-8 py-4 rounded-xl font-medium text-lg hover:bg-[#333] transition-colors"
          >
            {t.goToDashboard}
          </Link>
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
