'use client'

import { useState } from 'react'
import Link from 'next/link'

type Lang = 'en' | 'es'

const translations = {
  en: {
    back: 'Back',
    joinCta: 'Join VillaCare',
    badge: 'For Cleaners',
    title: 'Calendar Sync Guide',
    subtitle: 'Connect your Google Calendar to automatically show your availability. Never worry about double-bookings again.',
    privacyTitle: 'Your privacy is protected',
    privacyText: 'We <strong>only see when you\'re busy</strong> - not what you\'re doing. Event titles, descriptions, locations, and attendees are completely private. We use read-only access and can never add, edit, or delete your events.',
    compareTitle: 'What We See vs. What Stays Private',
    whatWeSee: 'What we see',
    whatStaysPrivate: 'What stays private',
    seeItem1: '"Busy from 10:00 to 12:00"',
    seeItem2: 'Which days have events',
    seeItem3: 'When you\'re free for bookings',
    privateItem1: '"Doctor appointment" - hidden',
    privateItem2: 'Locations - hidden',
    privateItem3: 'Who you\'re meeting - hidden',
    privateItem4: 'Event notes - hidden',
    stepsTitle: 'How to Set It Up',
    steps: [
      {
        title: 'Connect your Google Calendar',
        description: 'Go to Dashboard → Availability and click "Connect Google Calendar". Sign in to your Google account when prompted and grant permission to read your calendar.',
        tip: 'You only need to do this once. VillaCare will remember your connection.',
      },
      {
        title: 'Keep using your calendar normally',
        description: 'Add your personal appointments, family events, and time off to your regular Google Calendar. VillaCare reads from your primary calendar - no need to create a new one.',
        tip: 'Include travel time in your events! If you need 30 mins to get to a villa, block that time too.',
      },
      {
        title: 'We only see when you\'re busy',
        description: 'VillaCare uses Google\'s "Free/Busy" feature. We can only see time blocks - never your event titles, descriptions, locations, or who you\'re meeting.',
        tip: 'Your "Doctor appointment" just shows as "Busy 10:00-11:00" to us. Complete privacy.',
      },
      {
        title: 'Owners see your availability',
        description: 'When villa owners try to book you, they only see times when you\'re free. If you have something in your Google Calendar, that slot won\'t be available.',
        tip: 'Block out early mornings or late evenings with recurring events if you don\'t want bookings then.',
      },
    ],
    tipsTitle: 'Tips for Best Results',
    tips: [
      {
        icon: '📅',
        title: 'Use your main calendar',
        text: 'We read your <strong>primary Google Calendar</strong> - the one you see when you open Google Calendar. Make sure important events are there, not in a separate calendar.',
      },
      {
        icon: '🚗',
        title: 'Include travel time',
        text: 'Need 30 minutes to get to a villa? Add that to your events. Block 9:30-10:00 for travel if your cleaning starts at 10:00.',
      },
      {
        icon: '🌅',
        title: 'Block personal time',
        text: 'Don\'t want bookings before 9am or after 6pm? Create recurring events for those times. They\'ll automatically be blocked every day.',
      },
      {
        icon: '🏖️',
        title: 'Block holidays',
        text: 'Going on vacation? Add an all-day event in Google Calendar. The entire day will be blocked for bookings.',
      },
      {
        icon: '🔄',
        title: 'Automatic sync',
        text: 'VillaCare syncs your calendar every night. Changes usually appear within 24 hours. You can also manually sync from your Availability settings.',
      },
    ],
    faqTitle: 'Common Questions',
    faqs: [
      {
        q: 'Do I need to create a new calendar?',
        a: 'No! Just use your existing Google Calendar. We read from your primary calendar - the one you already use. No need to set up anything new.',
      },
      {
        q: 'Can VillaCare add events to my calendar?',
        a: 'No. We have <strong>read-only</strong> access. We can never add, edit, or delete your events. When you accept a booking, we use a separate calendar feed (ICS) that you can subscribe to.',
      },
      {
        q: 'What if I use Apple Calendar or Outlook?',
        a: 'Currently we sync with Google Calendar only. You can still export your VillaCare bookings to Apple/Outlook using our ICS feed. For availability, you\'d need a Google Calendar.',
      },
      {
        q: 'How do I disconnect my calendar?',
        a: 'Go to Dashboard → Availability and click "Disconnect". You can also revoke access from your Google Account at myaccount.google.com → Security → Third-party apps.',
      },
      {
        q: 'Is my calendar data stored?',
        a: 'We only store time blocks when you\'re busy (e.g., "busy 10am-12pm on Tuesday"). We never store event titles, descriptions, locations, or any personal details.',
      },
    ],
    ctaTitle: 'Ready to join VillaCare?',
    ctaText: 'You\'ll connect your calendar during the sign-up process. Takes just 2 minutes.',
    ctaButton: 'Apply to Join',
    ctaFooter: 'Read-only access · We never see your event details · Disconnect anytime',
    footerContact: 'Questions? Contact us at hello@alicantecleaners.com',
  },
  es: {
    back: 'Volver',
    joinCta: 'Unirse a VillaCare',
    badge: 'Para Limpiadores',
    title: 'Guía de Sincronización de Calendario',
    subtitle: 'Conecta tu Google Calendar para mostrar automáticamente tu disponibilidad. Nunca más te preocupes por reservas dobles.',
    privacyTitle: 'Tu privacidad está protegida',
    privacyText: '<strong>Solo vemos cuándo estás ocupado/a</strong> - no qué estás haciendo. Los títulos de eventos, descripciones, ubicaciones y asistentes son completamente privados. Usamos acceso de solo lectura y nunca podemos añadir, editar o eliminar tus eventos.',
    compareTitle: 'Qué Vemos vs. Qué Queda Privado',
    whatWeSee: 'Lo que vemos',
    whatStaysPrivate: 'Lo que queda privado',
    seeItem1: '"Ocupado de 10:00 a 12:00"',
    seeItem2: 'Qué días tienen eventos',
    seeItem3: 'Cuándo estás libre para reservas',
    privateItem1: '"Cita médica" - oculto',
    privateItem2: 'Ubicaciones - oculto',
    privateItem3: 'Con quién te reúnes - oculto',
    privateItem4: 'Notas del evento - oculto',
    stepsTitle: 'Cómo Configurarlo',
    steps: [
      {
        title: 'Conecta tu Google Calendar',
        description: 'Ve a Panel → Disponibilidad y haz clic en "Conectar Google Calendar". Inicia sesión en tu cuenta de Google cuando se solicite y otorga permiso para leer tu calendario.',
        tip: 'Solo necesitas hacer esto una vez. VillaCare recordará tu conexión.',
      },
      {
        title: 'Sigue usando tu calendario normalmente',
        description: 'Añade tus citas personales, eventos familiares y días libres a tu Google Calendar habitual. VillaCare lee de tu calendario principal - no necesitas crear uno nuevo.',
        tip: '¡Incluye el tiempo de desplazamiento en tus eventos! Si necesitas 30 minutos para llegar a una villa, bloquea ese tiempo también.',
      },
      {
        title: 'Solo vemos cuándo estás ocupado/a',
        description: 'VillaCare usa la función "Libre/Ocupado" de Google. Solo podemos ver bloques de tiempo - nunca tus títulos de eventos, descripciones, ubicaciones o con quién te reúnes.',
        tip: 'Tu "Cita médica" solo aparece como "Ocupado 10:00-11:00" para nosotros. Privacidad completa.',
      },
      {
        title: 'Los propietarios ven tu disponibilidad',
        description: 'Cuando los propietarios de villas intentan reservarte, solo ven los horarios en que estás libre. Si tienes algo en tu Google Calendar, ese horario no estará disponible.',
        tip: 'Bloquea las primeras horas de la mañana o las tardes con eventos recurrentes si no quieres reservas en esos horarios.',
      },
    ],
    tipsTitle: 'Consejos para Mejores Resultados',
    tips: [
      {
        icon: '📅',
        title: 'Usa tu calendario principal',
        text: 'Leemos tu <strong>Google Calendar principal</strong> - el que ves cuando abres Google Calendar. Asegúrate de que los eventos importantes estén ahí, no en un calendario separado.',
      },
      {
        icon: '🚗',
        title: 'Incluye tiempo de desplazamiento',
        text: '¿Necesitas 30 minutos para llegar a una villa? Añádelo a tus eventos. Bloquea 9:30-10:00 para el viaje si tu limpieza empieza a las 10:00.',
      },
      {
        icon: '🌅',
        title: 'Bloquea tiempo personal',
        text: '¿No quieres reservas antes de las 9am o después de las 6pm? Crea eventos recurrentes para esos horarios. Se bloquearán automáticamente cada día.',
      },
      {
        icon: '🏖️',
        title: 'Bloquea vacaciones',
        text: '¿Te vas de vacaciones? Añade un evento de todo el día en Google Calendar. El día entero quedará bloqueado para reservas.',
      },
      {
        icon: '🔄',
        title: 'Sincronización automática',
        text: 'VillaCare sincroniza tu calendario cada noche. Los cambios suelen aparecer en 24 horas. También puedes sincronizar manualmente desde tu configuración de Disponibilidad.',
      },
    ],
    faqTitle: 'Preguntas Frecuentes',
    faqs: [
      {
        q: '¿Necesito crear un calendario nuevo?',
        a: '¡No! Solo usa tu Google Calendar existente. Leemos de tu calendario principal - el que ya usas. No necesitas configurar nada nuevo.',
      },
      {
        q: '¿Puede VillaCare añadir eventos a mi calendario?',
        a: 'No. Tenemos acceso de <strong>solo lectura</strong>. Nunca podemos añadir, editar o eliminar tus eventos. Cuando aceptas una reserva, usamos un feed de calendario separado (ICS) al que puedes suscribirte.',
      },
      {
        q: '¿Qué pasa si uso Apple Calendar o Outlook?',
        a: 'Actualmente solo sincronizamos con Google Calendar. Puedes exportar tus reservas de VillaCare a Apple/Outlook usando nuestro feed ICS. Para disponibilidad, necesitarías un Google Calendar.',
      },
      {
        q: '¿Cómo desconecto mi calendario?',
        a: 'Ve a Panel → Disponibilidad y haz clic en "Desconectar". También puedes revocar el acceso desde tu Cuenta de Google en myaccount.google.com → Seguridad → Aplicaciones de terceros.',
      },
      {
        q: '¿Se almacenan mis datos del calendario?',
        a: 'Solo almacenamos bloques de tiempo cuando estás ocupado/a (ej., "ocupado 10am-12pm el martes"). Nunca almacenamos títulos de eventos, descripciones, ubicaciones ni detalles personales.',
      },
    ],
    ctaTitle: '¿Listo/a para unirte a VillaCare?',
    ctaText: 'Conectarás tu calendario durante el proceso de registro. Solo toma 2 minutos.',
    ctaButton: 'Solicitar Unirse',
    ctaFooter: 'Acceso de solo lectura · Nunca vemos los detalles de tus eventos · Desconecta cuando quieras',
    footerContact: '¿Preguntas? Contáctanos en hello@alicantecleaners.com',
  },
}

export default function CalendarGuidePage() {
  const [lang, setLang] = useState<Lang>('es')
  const t = translations[lang]

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Header */}
      <header className="bg-white border-b border-[#EBEBEB] sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/join" className="flex items-center gap-2 text-[#6B6B6B] hover:text-[#1A1A1A]">
            <span>←</span>
            <span>{t.back}</span>
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
                ES
              </button>
              <button
                onClick={() => setLang('en')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  lang === 'en' ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#6B6B6B]'
                }`}
              >
                EN
              </button>
            </div>
            <Link
              href="/onboarding/cleaner"
              className="bg-[#1A1A1A] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#333] transition-colors"
            >
              {t.joinCta}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-[#1A1A1A] to-[#2A2A2A] py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white px-3 py-1 rounded-full text-sm font-medium mb-4">
            <span>📅</span>
            <span>{t.badge}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {t.title}
          </h1>
          <p className="text-white/70 text-lg max-w-xl mx-auto">
            {t.subtitle}
          </p>
        </div>
      </section>

      {/* Privacy Promise */}
      <section className="py-8 px-4 bg-[#E8F5E9] border-b border-[#C8E6C9]">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="text-2xl">🔒</span>
            </div>
            <div>
              <h2 className="font-semibold text-[#1B5E20] mb-1">{t.privacyTitle}</h2>
              <p
                className="text-[#2E7D32]"
                dangerouslySetInnerHTML={{ __html: t.privacyText }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* What We See vs Don't See */}
      <section className="py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-bold text-[#1A1A1A] mb-6 text-center">
            {t.compareTitle}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* What We See */}
            <div className="bg-white rounded-2xl p-6 border border-[#EBEBEB]">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-[#E8F5E9] rounded-full flex items-center justify-center">
                  <span className="text-sm">✓</span>
                </div>
                <h3 className="font-semibold text-[#1A1A1A]">{t.whatWeSee}</h3>
              </div>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-3">
                  <span className="text-[#6B6B6B]">⏰</span>
                  <span className="text-[#1A1A1A]">{t.seeItem1}</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-[#6B6B6B]">📆</span>
                  <span className="text-[#1A1A1A]">{t.seeItem2}</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-[#6B6B6B]">✅</span>
                  <span className="text-[#1A1A1A]">{t.seeItem3}</span>
                </li>
              </ul>
            </div>

            {/* What We Don't See */}
            <div className="bg-white rounded-2xl p-6 border border-[#EBEBEB]">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-[#FFEBEE] rounded-full flex items-center justify-center">
                  <span className="text-sm">✕</span>
                </div>
                <h3 className="font-semibold text-[#1A1A1A]">{t.whatStaysPrivate}</h3>
              </div>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-3">
                  <span className="text-[#6B6B6B]">📝</span>
                  <span className="text-[#1A1A1A]">{t.privateItem1}</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-[#6B6B6B]">📍</span>
                  <span className="text-[#1A1A1A]">{t.privateItem2}</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-[#6B6B6B]">👥</span>
                  <span className="text-[#1A1A1A]">{t.privateItem3}</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-[#6B6B6B]">📄</span>
                  <span className="text-[#1A1A1A]">{t.privateItem4}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-8 px-4 bg-white border-t border-[#EBEBEB]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-bold text-[#1A1A1A] mb-8 text-center">
            {t.stepsTitle}
          </h2>

          <div className="space-y-12">
            {t.steps.map((step, index) => (
              <div
                key={index}
                className="flex flex-col md:flex-row gap-6 items-start"
              >
                {/* Step number and content */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-[#C4785A] text-white rounded-full flex items-center justify-center font-bold text-lg">
                      {index + 1}
                    </div>
                    <h3 className="text-lg font-semibold text-[#1A1A1A]">
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-[#6B6B6B] mb-4 ml-[52px]">
                    {step.description}
                  </p>
                  {step.tip && (
                    <div className="bg-[#FFF8E1] border border-[#FFE082] rounded-xl p-4 ml-[52px]">
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
        </div>
      </section>

      {/* Tips Section */}
      <section className="py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-bold text-[#1A1A1A] mb-6 text-center">
            {t.tipsTitle}
          </h2>

          <div className="space-y-4">
            {t.tips.map((tip, index) => (
              <div key={index} className="bg-white rounded-xl p-4 border border-[#EBEBEB] flex items-start gap-4">
                <div className="w-10 h-10 bg-[#FFF8F5] rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">{tip.icon}</span>
                </div>
                <div>
                  <h3 className="font-medium text-[#1A1A1A] mb-1">{tip.title}</h3>
                  <p
                    className="text-sm text-[#6B6B6B]"
                    dangerouslySetInnerHTML={{ __html: tip.text }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 px-4 bg-white border-t border-[#EBEBEB]">
        <div className="max-w-xl mx-auto">
          <h2 className="text-xl font-bold text-[#1A1A1A] mb-6 text-center">
            {t.faqTitle}
          </h2>
          <div className="space-y-4">
            {t.faqs.map((faq, index) => (
              <details key={index} className="bg-[#FAFAF8] rounded-xl p-4 border border-[#EBEBEB] group">
                <summary className="font-medium text-[#1A1A1A] cursor-pointer list-none flex justify-between items-center">
                  {faq.q}
                  <span className="text-[#9B9B9B] group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p
                  className="text-[#6B6B6B] mt-3 text-sm"
                  dangerouslySetInnerHTML={{ __html: faq.a }}
                />
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 px-4 bg-[#FFF8F5] border-t border-[#EBEBEB]">
        <div className="max-w-xl mx-auto text-center">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <span className="text-3xl">📅</span>
          </div>
          <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4">
            {t.ctaTitle}
          </h2>
          <p className="text-[#6B6B6B] mb-6">
            {t.ctaText}
          </p>
          <Link
            href="/onboarding/cleaner"
            className="inline-block bg-[#C4785A] text-white px-8 py-4 rounded-xl font-medium text-lg hover:bg-[#B56A4F] transition-colors"
          >
            {t.ctaButton}
          </Link>
          <p className="text-sm text-[#9B9B9B] mt-4">
            {t.ctaFooter}
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-4 border-t border-[#EBEBEB]">
        <div className="max-w-xl mx-auto text-center text-sm text-[#9B9B9B]">
          <p>{t.footerContact}</p>
        </div>
      </footer>
    </div>
  )
}
