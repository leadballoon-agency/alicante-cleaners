'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

type Lang = 'en' | 'es'

const translations = {
  en: {
    backToJoin: 'Back to Join',
    goToDashboard: 'Go to Dashboard',
    badge: 'Managing Bookings',
    title: 'How to Handle Bookings',
    subtitle: 'Learn how to view booking details, contact owners, use quick WhatsApp messages, and mark jobs as complete.',
    readyTitle: 'Ready to manage your bookings?',
    readyText: 'Your dashboard shows all your upcoming and past bookings. Hold any booking card to see full details and take action.',
    openDashboard: 'Open Dashboard',
    dashboardTip: 'Go to your dashboard to see your bookings',
    faqTitle: 'Booking FAQ',
    contact: 'Questions? Contact us at hello@alicantecleaners.com',
    steps: [
      {
        title: 'View your bookings',
        description: 'Your dashboard shows all upcoming bookings organized by date. You can filter between "Upcoming" and "All Jobs" to see your complete history.',
        tip: 'Pending bookings (orange) need your response. Confirmed bookings (green) are ready to go!',
      },
      {
        title: 'Hold to see details',
        description: 'Press and hold any booking card for about 1.5 seconds. A detailed view slides up showing all the information you need for the job.',
        tip: 'Keep holding until you see "Unlocked" - then you can release and the details stay open.',
      },
      {
        title: 'Access all job information',
        description: 'The booking details show the service type, date, time, property address with Maps link, owner contact, and keyholder information if available.',
        tip: 'Tap "Maps" to open Google Maps navigation directly to the property.',
      },
      {
        title: 'Quick WhatsApp messages',
        description: 'At the bottom of the booking details, you\'ll find quick action buttons to message the owner via WhatsApp - "Running late", "On my way", or "Access help".',
        tip: 'Messages are automatically personalized with the owner\'s name and booking details. Tap once and WhatsApp opens ready to send!',
      },
      {
        title: 'Accept or decline bookings',
        description: 'For pending bookings, you\'ll see Accept and Decline buttons. Accept to confirm the job, or Decline if you can\'t make it.',
        tip: 'You can also reply directly to the WhatsApp booking notification with "ACCEPT" or "DECLINE".',
      },
      {
        title: 'Mark jobs as complete',
        description: 'For confirmed bookings on the day of the job, a "Mark as Complete" button appears. Tap it to confirm you\'ve finished the cleaning.',
        tip: 'Completing jobs helps build your profile and shows owners you\'re reliable.',
      },
    ],
    faqs: [
      {
        q: 'How do I know when I have a new booking?',
        a: 'You\'ll receive a WhatsApp message immediately when an owner books you. The message includes all the details and you can reply ACCEPT or DECLINE directly.',
      },
      {
        q: 'Can I change a booking after accepting?',
        a: 'Contact the owner directly via WhatsApp using the quick message buttons to discuss any changes. For cancellations, please give as much notice as possible.',
      },
      {
        q: 'What if I can\'t access the property?',
        a: 'Use the "Access help" quick message to alert the owner. You can also call the keyholder if one is listed in the booking details.',
      },
      {
        q: 'Where do I see past bookings?',
        a: 'Tap "All Jobs" in your dashboard to see your complete booking history, including completed and cancelled jobs.',
      },
    ],
  },
  es: {
    backToJoin: 'Volver',
    goToDashboard: 'Ir al Panel',
    badge: 'Gestión de Reservas',
    title: 'Cómo gestionar reservas',
    subtitle: 'Aprende a ver los detalles de las reservas, contactar propietarios, usar mensajes rápidos de WhatsApp y marcar trabajos como completados.',
    readyTitle: '¿Lista para gestionar tus reservas?',
    readyText: 'Tu panel muestra todas tus reservas próximas y pasadas. Mantén pulsada cualquier tarjeta de reserva para ver todos los detalles y tomar acción.',
    openDashboard: 'Abrir Panel',
    dashboardTip: 'Ve a tu panel para ver tus reservas',
    faqTitle: 'Preguntas sobre Reservas',
    contact: '¿Preguntas? Escríbenos a hello@alicantecleaners.com',
    steps: [
      {
        title: 'Ve tus reservas',
        description: 'Tu panel muestra todas las reservas próximas organizadas por fecha. Puedes filtrar entre "Próximos" y "Todos" para ver tu historial completo.',
        tip: 'Las reservas pendientes (naranja) necesitan tu respuesta. Las confirmadas (verde) ¡están listas!',
      },
      {
        title: 'Mantén pulsado para ver detalles',
        description: 'Mantén pulsada cualquier tarjeta de reserva durante aproximadamente 1.5 segundos. Una vista detallada aparece mostrando toda la información que necesitas para el trabajo.',
        tip: 'Sigue manteniendo pulsado hasta que veas "Desbloqueado" - entonces puedes soltar y los detalles permanecen abiertos.',
      },
      {
        title: 'Accede a toda la información',
        description: 'Los detalles de la reserva muestran el tipo de servicio, fecha, hora, dirección con enlace a Maps, contacto del propietario e información del encargado de llaves si está disponible.',
        tip: 'Toca "Maps" para abrir la navegación de Google Maps directamente a la propiedad.',
      },
      {
        title: 'Mensajes rápidos de WhatsApp',
        description: 'En la parte inferior de los detalles, encontrarás botones de acción rápida para enviar mensajes al propietario por WhatsApp - "Llegando tarde", "En camino" o "Ayuda acceso".',
        tip: 'Los mensajes se personalizan automáticamente con el nombre del propietario y los detalles de la reserva. ¡Toca una vez y WhatsApp se abre listo para enviar!',
      },
      {
        title: 'Acepta o rechaza reservas',
        description: 'Para reservas pendientes, verás botones de Aceptar y Rechazar. Acepta para confirmar el trabajo, o Rechaza si no puedes asistir.',
        tip: 'También puedes responder directamente a la notificación de WhatsApp con "ACEPTAR" o "RECHAZAR".',
      },
      {
        title: 'Marca trabajos como completados',
        description: 'Para reservas confirmadas el día del trabajo, aparece un botón "Marcar como Completado". Tócalo para confirmar que has terminado la limpieza.',
        tip: 'Completar trabajos ayuda a construir tu perfil y muestra a los propietarios que eres confiable.',
      },
    ],
    faqs: [
      {
        q: '¿Cómo sé cuando tengo una nueva reserva?',
        a: 'Recibirás un mensaje de WhatsApp inmediatamente cuando un propietario te reserve. El mensaje incluye todos los detalles y puedes responder ACEPTAR o RECHAZAR directamente.',
      },
      {
        q: '¿Puedo cambiar una reserva después de aceptar?',
        a: 'Contacta al propietario directamente por WhatsApp usando los botones de mensaje rápido para discutir cambios. Para cancelaciones, da el mayor aviso posible.',
      },
      {
        q: '¿Qué hago si no puedo acceder a la propiedad?',
        a: 'Usa el mensaje rápido "Ayuda acceso" para alertar al propietario. También puedes llamar al encargado de llaves si aparece en los detalles de la reserva.',
      },
      {
        q: '¿Dónde veo reservas pasadas?',
        a: 'Toca "Todos" en tu panel para ver tu historial completo de reservas, incluyendo trabajos completados y cancelados.',
      },
    ],
  },
}

// Screenshots showing the booking flow
const stepImages = [
  '/guides/03-booking-management/es/01-pending-booking-card.png',  // Dashboard with bookings
  '/guides/03-booking-management/es/02-peek-unlocked-top.png',     // Hold to peek
  '/guides/03-booking-management/es/02-peek-unlocked-top.png',     // Job info (same image)
  '/guides/03-booking-management/es/03-peek-unlocked-bottom.png',  // WhatsApp buttons
  '/guides/03-booking-management/es/03-peek-unlocked-bottom.png',  // Accept/decline
  '/guides/03-booking-management/es/03-peek-unlocked-bottom.png',  // Complete
]

const stepImagesEn = stepImages

export default function BookingGuide() {
  const [lang, setLang] = useState<Lang>('es')
  const t = translations[lang]
  const images = lang === 'es' ? stepImages : stepImagesEn

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Header */}
      <header className="bg-white border-b border-[#EBEBEB] sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/join" className="flex items-center gap-2 text-[#6B6B6B] hover:text-[#1A1A1A]">
            <span>←</span>
            <span>{t.backToJoin}</span>
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
              href="/dashboard"
              className="bg-[#1A1A1A] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#333] transition-colors"
            >
              {t.goToDashboard}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-white to-[#FAFAF8] py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-[#E3F2FD] text-[#1565C0] px-3 py-1 rounded-full text-sm font-medium mb-4">
            <span>📋</span>
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
                        src={images[index]}
                        alt={step.title}
                        fill
                        className="object-cover object-top"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = '/placeholder-screen.png'
                        }}
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
            href="/dashboard"
            className="inline-block bg-[#1A1A1A] text-white px-8 py-4 rounded-xl font-medium text-lg hover:bg-[#333] transition-colors"
          >
            {t.openDashboard}
          </Link>
          <p className="text-sm text-[#9B9B9B] mt-4">
            {t.dashboardTip}
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
