'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

type Lang = 'en' | 'es'

const translations = {
  en: {
    backToJoin: 'Back to Join',
    goToDashboard: 'Go to Dashboard',
    badge: 'Team Members',
    title: 'How to Join a Team',
    subtitle: 'Joining a team gives you access to more opportunities and support from experienced cleaners. Learn how to find and join a team.',
    readyTitle: 'Ready to join a team?',
    readyText: 'Browse available teams in your area, or use a referral code from a team leader you know. Team leaders review all applications.',
    openDashboard: 'Open Dashboard',
    teamTab: 'Go to Team tab to find teams',
    faqTitle: 'Team Member FAQ',
    contact: 'Questions? Contact us at hello@alicantecleaners.com',
    steps: [
      {
        title: 'Check your Team tab',
        description: 'Open your dashboard and go to the Team tab. If you\'re not in a team yet, you\'ll see options to browse teams or enter a referral code.',
        tip: 'Team leaders in your service areas will be shown first.',
      },
      {
        title: 'Browse available teams',
        description: 'See a list of teams with openings in your area. Each team shows the leader\'s profile, their rating, and how many members they have.',
        tip: 'Look for teams whose service areas overlap with yours for the best opportunities.',
      },
      {
        title: 'Request to join',
        description: 'Found a team you like? Tap "Request to Join" to send your application. You can add a personal message to introduce yourself.',
        tip: 'Mention your experience and why you\'d be a good fit for the team.',
      },
      {
        title: 'Wait for approval',
        description: 'The team leader will review your profile and application. They can see your bio, service areas, and ratings.',
        tip: 'Keep your profile complete and professional - first impressions matter!',
      },
      {
        title: 'Welcome to the team!',
        description: 'Once accepted, you\'ll see your team on your dashboard. You can contact your team leader and other members.',
        tip: 'Your team appears on your public profile, giving owners confidence in your network.',
      },
    ],
    faqs: [
      {
        q: 'What are the benefits of joining a team?',
        a: 'Teams provide support, coverage options when you\'re unavailable, and a trusted network. Owners also feel more confident booking cleaners who are part of an established team.',
      },
      {
        q: 'Can I join without a referral code?',
        a: 'Yes! You can browse teams in your area and request to join directly. Having a referral code just speeds up the process.',
      },
      {
        q: 'What if my request is declined?',
        a: 'Don\'t worry - you can request to join other teams. Team leaders may decline if they don\'t have capacity or if your areas don\'t overlap enough.',
      },
      {
        q: 'Can I leave a team later?',
        a: 'Yes, you can leave a team anytime from the Team tab. You\'ll become an independent cleaner again but keep all your bookings and reviews.',
      },
    ],
  },
  es: {
    backToJoin: 'Volver',
    goToDashboard: 'Ir al Panel',
    badge: 'Miembros del Equipo',
    title: 'Cómo unirse a un equipo',
    subtitle: 'Unirte a un equipo te da acceso a más oportunidades y apoyo de profesionales con experiencia. Aprende cómo encontrar y unirte a un equipo.',
    readyTitle: 'Lista para unirte a un equipo?',
    readyText: 'Explora los equipos disponibles en tu zona, o usa un código de referido de un líder de equipo que conozcas. Los líderes revisan todas las solicitudes.',
    openDashboard: 'Abrir Panel',
    teamTab: 'Ve a la pestaña Equipo para encontrar equipos',
    faqTitle: 'Preguntas de Miembros',
    contact: 'Preguntas? Escríbenos a hello@alicantecleaners.com',
    steps: [
      {
        title: 'Revisa tu pestaña Equipo',
        description: 'Abre tu panel y ve a la pestaña Equipo. Si aún no estás en un equipo, verás opciones para explorar equipos o introducir un código de referido.',
        tip: 'Los líderes de equipo en tus zonas de servicio se mostrarán primero.',
      },
      {
        title: 'Explora equipos disponibles',
        description: 'Ve una lista de equipos con vacantes en tu zona. Cada equipo muestra el perfil del líder, su calificación y cuántos miembros tiene.',
        tip: 'Busca equipos cuyas zonas de servicio coincidan con las tuyas para mejores oportunidades.',
      },
      {
        title: 'Solicita unirte',
        description: 'Encontraste un equipo que te gusta? Toca "Solicitar Unirse" para enviar tu solicitud. Puedes añadir un mensaje personal para presentarte.',
        tip: 'Menciona tu experiencia y por qué serías una buena opción para el equipo.',
      },
      {
        title: 'Espera la aprobación',
        description: 'El líder del equipo revisará tu perfil y solicitud. Puede ver tu biografía, zonas de servicio y calificaciones.',
        tip: 'Mantén tu perfil completo y profesional - las primeras impresiones importan!',
      },
      {
        title: 'Bienvenida al equipo!',
        description: 'Una vez aceptada, verás tu equipo en tu panel. Puedes contactar a tu líder de equipo y otros miembros.',
        tip: 'Tu equipo aparece en tu perfil público, dando confianza a los propietarios en tu red.',
      },
    ],
    faqs: [
      {
        q: 'Cuáles son los beneficios de unirse a un equipo?',
        a: 'Los equipos proporcionan apoyo, opciones de cobertura cuando no estás disponible, y una red de confianza. Los propietarios también se sienten más seguros reservando a profesionales que son parte de un equipo establecido.',
      },
      {
        q: 'Puedo unirme sin código de referido?',
        a: 'Sí! Puedes explorar equipos en tu zona y solicitar unirte directamente. Tener un código de referido solo acelera el proceso.',
      },
      {
        q: 'Qué pasa si mi solicitud es rechazada?',
        a: 'No te preocupes - puedes solicitar unirte a otros equipos. Los líderes pueden rechazar si no tienen capacidad o si tus zonas no coinciden lo suficiente.',
      },
      {
        q: 'Puedo dejar un equipo después?',
        a: 'Sí, puedes dejar un equipo en cualquier momento desde la pestaña Equipo. Te convertirás en profesional independiente de nuevo pero mantendrás todas tus reservas y reseñas.',
      },
    ],
  },
}

// Screenshots from the guides folder - Spanish
// Note: Only step 1 screenshot exists currently. Others will show placeholder.
const stepImagesEs = [
  '/guides/09-team-member/es/01-team-member-view.png',  // Team tab view (exists)
  '/guides/09-team-member/es/02-browse-teams.png',      // Browse teams (placeholder)
  '/guides/09-team-member/es/03-request-join.png',      // Request to join (placeholder)
  '/guides/09-team-member/es/04-pending-request.png',   // Pending request (placeholder)
  '/guides/09-team-member/es/05-team-welcome.png',      // Welcome to team (placeholder)
]

// English screenshots
const stepImagesEn = [
  '/guides/09-team-member/en/01-team-member-view.png',  // Team tab view (exists)
  '/guides/09-team-member/en/02-browse-teams.png',      // Browse teams (placeholder)
  '/guides/09-team-member/en/03-request-join.png',      // Request to join (placeholder)
  '/guides/09-team-member/en/04-pending-request.png',   // Pending request (placeholder)
  '/guides/09-team-member/en/05-team-welcome.png',      // Welcome to team (placeholder)
]

export default function TeamMemberGuide() {
  const [lang, setLang] = useState<Lang>('es')
  const t = translations[lang]
  const images = lang === 'es' ? stepImagesEs : stepImagesEn

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
          <div className="inline-flex items-center gap-2 bg-[#E8F5E9] text-[#2E7D32] px-3 py-1 rounded-full text-sm font-medium mb-4">
            <span>👥</span>
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
                          // Fallback to a placeholder if image doesn't exist
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
            {t.teamTab}
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
