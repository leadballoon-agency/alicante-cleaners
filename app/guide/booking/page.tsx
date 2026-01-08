'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

type Lang = 'en' | 'es'

const translations = {
  en: {
    backToHome: 'Back to Home',
    bookNow: 'Find a Cleaner',
    badge: 'Takes 2 minutes',
    title: 'How to Book a Clean',
    subtitle: 'Follow these simple steps to find a trusted cleaner and book your first villa cleaning in Alicante.',
    readyTitle: 'Ready to book?',
    readyText: 'Find trusted, vetted cleaners in your area. Book in under 2 minutes and get a confirmation straight to your phone.',
    findCleaner: 'Find a Cleaner',
    noFees: 'No hidden fees · Cancel anytime · Pay the cleaner directly',
    faqTitle: 'Common Questions',
    contact: 'Questions? Contact us at hello@alicantecleaners.com',
    steps: [
      {
        title: 'Browse our cleaners',
        description: 'Visit our homepage and browse trusted cleaners in your area. Each cleaner has a profile with their photo, reviews, service areas, and pricing.',
        tip: 'Use the area filter to find cleaners who work in your specific location - San Juan, El Campello, Alicante City, and more.',
      },
      {
        title: 'View their profile',
        description: 'Click on a cleaner to see their full profile. Check their ratings, read reviews from other villa owners, and see their availability.',
        tip: 'Look for cleaners with high ratings and reviews that mention reliability and attention to detail.',
      },
      {
        title: 'Choose your date',
        description: 'Select the date you need cleaning. The calendar shows available dates in green. Pick the day that works best for your schedule.',
        tip: 'Book a few days in advance for the best availability, especially during busy summer months.',
      },
      {
        title: 'Select your time',
        description: 'Choose a time slot for your cleaning. Morning slots are popular, but afternoon slots often have better availability.',
        tip: 'Consider your arrival time if booking an arrival prep - give the cleaner enough time to finish before you arrive!',
      },
      {
        title: 'Add property details',
        description: 'Tell us about your property - the address, number of bedrooms and bathrooms. This helps the cleaner prepare and ensures accurate pricing.',
        tip: 'Include any special instructions like pool areas, outdoor terraces, or specific cleaning requests.',
      },
      {
        title: 'Confirm your booking',
        description: 'Review your booking details and confirm. Your cleaner will receive a notification and accept your booking. You\'ll get a WhatsApp confirmation.',
        tip: 'You\'ll receive booking confirmations via WhatsApp - make sure your phone number is correct!',
      },
    ],
    faqs: [
      {
        q: 'How do I pay?',
        a: 'You pay the cleaner directly after the job is done. Most cleaners accept cash or bank transfer. The price shown is the full price - no hidden fees.',
      },
      {
        q: 'Can I cancel or reschedule?',
        a: 'Yes! You can cancel or reschedule through your dashboard. We ask for at least 24 hours notice as a courtesy to your cleaner.',
      },
      {
        q: 'What services are included?',
        a: 'Regular Clean (3h) covers standard cleaning. Deep Clean (5h) includes thorough cleaning of hard-to-reach areas. Arrival Prep (4h) prepares your villa for guests.',
      },
      {
        q: 'Are the cleaners vetted?',
        a: 'Yes! All VillaCare cleaners are vetted, referenced, and join by referral only. We prioritize quality and trust over quantity.',
      },
    ],
  },
  es: {
    backToHome: 'Volver',
    bookNow: 'Buscar limpiador',
    badge: 'Solo 2 minutos',
    title: 'Cómo reservar una limpieza',
    subtitle: 'Sigue estos sencillos pasos para encontrar un limpiador de confianza y reservar tu primera limpieza de villa en Alicante.',
    readyTitle: '¿Listo para reservar?',
    readyText: 'Encuentra profesionales de limpieza verificados en tu zona. Reserva en menos de 2 minutos y recibe confirmación en tu teléfono.',
    findCleaner: 'Buscar limpiador',
    noFees: 'Sin comisiones ocultas · Cancela cuando quieras · Paga directamente al limpiador',
    faqTitle: 'Preguntas frecuentes',
    contact: '¿Preguntas? Escríbenos a hello@alicantecleaners.com',
    steps: [
      {
        title: 'Explora nuestros limpiadores',
        description: 'Visita nuestra página principal y explora profesionales de limpieza de confianza en tu zona. Cada uno tiene un perfil con foto, reseñas, zonas de servicio y precios.',
        tip: 'Usa el filtro de zona para encontrar limpiadores que trabajen en tu ubicación específica - San Juan, El Campello, Alicante Ciudad, y más.',
      },
      {
        title: 'Mira su perfil',
        description: 'Haz clic en un limpiador para ver su perfil completo. Revisa sus valoraciones, lee reseñas de otros propietarios y consulta su disponibilidad.',
        tip: 'Busca limpiadores con altas valoraciones y reseñas que mencionen fiabilidad y atención al detalle.',
      },
      {
        title: 'Elige tu fecha',
        description: 'Selecciona la fecha que necesitas limpieza. El calendario muestra las fechas disponibles en verde. Elige el día que mejor se adapte a tu horario.',
        tip: 'Reserva con unos días de antelación para mejor disponibilidad, especialmente durante los meses de verano.',
      },
      {
        title: 'Selecciona tu hora',
        description: 'Elige un horario para tu limpieza. Las mañanas son populares, pero las tardes suelen tener mejor disponibilidad.',
        tip: 'Considera tu hora de llegada si reservas preparación de llegada - ¡dale tiempo suficiente al limpiador para terminar antes de que llegues!',
      },
      {
        title: 'Añade detalles de la propiedad',
        description: 'Cuéntanos sobre tu propiedad - dirección, número de dormitorios y baños. Esto ayuda al limpiador a prepararse y asegura un precio exacto.',
        tip: 'Incluye instrucciones especiales como zonas de piscina, terrazas exteriores o solicitudes específicas de limpieza.',
      },
      {
        title: 'Confirma tu reserva',
        description: 'Revisa los detalles de tu reserva y confirma. Tu limpiador recibirá una notificación y aceptará tu reserva. Recibirás confirmación por WhatsApp.',
        tip: '¡Recibirás confirmaciones de reserva por WhatsApp - asegúrate de que tu número de teléfono sea correcto!',
      },
    ],
    faqs: [
      {
        q: '¿Cómo pago?',
        a: 'Pagas directamente al limpiador después del trabajo. La mayoría acepta efectivo o transferencia bancaria. El precio mostrado es el precio final - sin comisiones ocultas.',
      },
      {
        q: '¿Puedo cancelar o reprogramar?',
        a: '¡Sí! Puedes cancelar o reprogramar desde tu panel. Pedimos al menos 24 horas de aviso como cortesía hacia tu limpiador.',
      },
      {
        q: '¿Qué servicios están incluidos?',
        a: 'Limpieza Regular (3h) cubre limpieza estándar. Limpieza Profunda (5h) incluye limpieza minuciosa de zonas difíciles. Preparación de Llegada (4h) prepara tu villa para invitados.',
      },
      {
        q: '¿Los limpiadores están verificados?',
        a: '¡Sí! Todos los limpiadores de VillaCare están verificados, con referencias, y se unen solo por recomendación. Priorizamos calidad y confianza sobre cantidad.',
      },
    ],
  },
}

const stepImages = [
  '/guide/booking/01-homepage.png',
  '/guide/booking/02-cleaner-profile.png',
  '/guide/booking/03-select-date.png',
  '/guide/booking/04-select-time.png',
  '/guide/booking/05-property-details.png',
  '/guide/booking/06-confirm-booking.png',
]

export default function BookingGuide() {
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
              {t.bookNow}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-white to-[#FAFAF8] py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-[#E8F5E9] text-[#2E7D32] px-3 py-1 rounded-full text-sm font-medium mb-4">
            <span>⏱</span>
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

      {/* Steps */}
      <section className="py-8 px-4">
        <div className="max-w-3xl mx-auto space-y-12">
          {t.steps.map((step, index) => (
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
                        src={stepImages[index]}
                        alt={step.title}
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
                  {step.title}
                </h2>
                <p className="text-[#6B6B6B] mb-4">
                  {step.description}
                </p>
                {step.tip && (
                  <div className="bg-[#FFF8E1] border border-[#FFE082] rounded-xl p-4 text-left">
                    <div className="flex items-start gap-2">
                      <span className="text-lg">💡</span>
                      <p className="text-sm text-[#F57C00]">{step.tip}</p>
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
            {t.noFees}
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
