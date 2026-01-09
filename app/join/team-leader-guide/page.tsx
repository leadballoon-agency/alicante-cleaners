'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

type Lang = 'en' | 'es'

const translations = {
  en: {
    backToJoin: 'Back to Join',
    goToDashboard: 'Go to Dashboard',
    badge: 'Team Leaders',
    title: 'How to Grow Your Team',
    subtitle: 'As a team leader, you can invite other cleaners to join your team. When you\'re unavailable, your teammates can cover bookings - giving owners peace of mind.',
    readyTitle: 'Ready to grow your team?',
    readyText: 'Share your referral code or manually invite cleaners you trust. Your team appears on your public profile, giving owners confidence in coverage.',
    openDashboard: 'Open Dashboard',
    teamTab: 'Go to Team tab to get started',
    faqTitle: 'Team Leader FAQ',
    contact: 'Questions? Contact us at hello@alicantecleaners.com',
    steps: [
      {
        title: 'Find your referral code',
        description: 'Go to the Team tab in your dashboard. You\'ll see your unique referral code at the top. This code lets cleaners join your team directly during signup.',
        tip: 'Tap the code to copy it. Share via WhatsApp, text, or in person with cleaners you want to invite.',
      },
      {
        title: 'Share with trusted cleaners',
        description: 'Send your referral code to cleaners you trust. When they sign up using your code, they\'ll automatically be connected to your team.',
        tip: 'Only invite cleaners you\'d trust to work in your clients\' villas. Your reputation is on the line!',
      },
      {
        title: 'Or refer someone manually',
        description: 'Know a great cleaner? Use "Refer Someone" to enter their phone number. They\'ll receive a WhatsApp invitation to join VillaCare and your team.',
        tip: 'This is perfect for cleaners who don\'t have the app yet. They\'ll get a personal invitation from you.',
      },
      {
        title: 'Review new applicants',
        description: 'When someone uses your code or you refer them, they\'ll appear in your "New Applicants" section. Review their profile and accept them to activate their account.',
        tip: 'You can view their onboarding chat to see how they answered questions about experience and availability.',
      },
      {
        title: 'Manage your team',
        description: 'Your active team members appear in the "Team Members" section. You can see their profiles and remove members if needed.',
        tip: 'Your team is shown on your public profile page. Owners can see who might cover if you\'re unavailable.',
      },
    ],
    faqs: [
      {
        q: 'How do I become a team leader?',
        a: 'You need to complete 200 hours of cleaning work and maintain a 4.5+ star rating. Once eligible, you can create your team from the Team tab in your dashboard.',
      },
      {
        q: 'What happens when I\'m unavailable?',
        a: 'Owners who book you can see your team members on your profile. They can contact your teammates directly for coverage, or you can assign bookings to them.',
      },
      {
        q: 'Do I earn anything from my team?',
        a: 'Currently, team members handle their own bookings and payments. In the future, we\'ll add referral bonuses and team booking features.',
      },
      {
        q: 'Can I remove someone from my team?',
        a: 'Yes, you can remove team members anytime from the Team tab. They\'ll become independent cleaners but keep their profile and bookings.',
      },
    ],
  },
  es: {
    backToJoin: 'Volver',
    goToDashboard: 'Ir al Panel',
    badge: 'Líderes de Equipo',
    title: 'Cómo hacer crecer tu equipo',
    subtitle: 'Como líder de equipo, puedes invitar a otros profesionales a unirse a tu equipo. Cuando no estés disponible, tus compañeros pueden cubrir las reservas - dando tranquilidad a los propietarios.',
    readyTitle: '¿Lista para hacer crecer tu equipo?',
    readyText: 'Comparte tu código de referido o invita manualmente a profesionales de confianza. Tu equipo aparece en tu perfil público, dando confianza a los propietarios.',
    openDashboard: 'Abrir Panel',
    teamTab: 'Ve a la pestaña Equipo para empezar',
    faqTitle: 'Preguntas de Líderes',
    contact: '¿Preguntas? Escríbenos a hello@alicantecleaners.com',
    steps: [
      {
        title: 'Encuentra tu código de referido',
        description: 'Ve a la pestaña Equipo en tu panel. Verás tu código único de referido arriba. Este código permite que otros profesionales se unan a tu equipo directamente al registrarse.',
        tip: 'Toca el código para copiarlo. Compártelo por WhatsApp, mensaje o en persona con profesionales que quieras invitar.',
      },
      {
        title: 'Comparte con profesionales de confianza',
        description: 'Envía tu código de referido a profesionales de tu confianza. Cuando se registren usando tu código, se conectarán automáticamente a tu equipo.',
        tip: 'Solo invita a profesionales en quienes confiarías para trabajar en las villas de tus clientes. ¡Tu reputación está en juego!',
      },
      {
        title: 'O refiere a alguien manualmente',
        description: '¿Conoces a un gran profesional? Usa "Recomendar a Alguien" para introducir su número de teléfono. Recibirán una invitación por WhatsApp para unirse a VillaCare y a tu equipo.',
        tip: 'Esto es perfecto para profesionales que aún no tienen la app. Recibirán una invitación personal tuya.',
      },
      {
        title: 'Revisa nuevos solicitantes',
        description: 'Cuando alguien use tu código o los refieras, aparecerán en tu sección "Nuevos Solicitantes". Revisa su perfil y acéptalos para activar su cuenta.',
        tip: 'Puedes ver su conversación de registro para ver cómo respondieron preguntas sobre experiencia y disponibilidad.',
      },
      {
        title: 'Gestiona tu equipo',
        description: 'Tus miembros activos del equipo aparecen en la sección "Miembros del Equipo". Puedes ver sus perfiles y eliminar miembros si es necesario.',
        tip: 'Tu equipo se muestra en tu página de perfil público. Los propietarios pueden ver quién podría cubrir si no estás disponible.',
      },
    ],
    faqs: [
      {
        q: '¿Cómo me convierto en líder de equipo?',
        a: 'Necesitas completar 200 horas de trabajo de limpieza y mantener una calificación de 4.5+ estrellas. Una vez elegible, puedes crear tu equipo desde la pestaña Equipo en tu panel.',
      },
      {
        q: '¿Qué pasa cuando no estoy disponible?',
        a: 'Los propietarios que te reservan pueden ver a los miembros de tu equipo en tu perfil. Pueden contactar a tus compañeros directamente para cobertura, o puedes asignarles reservas.',
      },
      {
        q: '¿Gano algo de mi equipo?',
        a: 'Actualmente, los miembros del equipo gestionan sus propias reservas y pagos. En el futuro, añadiremos bonos por referido y funciones de reserva de equipo.',
      },
      {
        q: '¿Puedo eliminar a alguien de mi equipo?',
        a: 'Sí, puedes eliminar miembros del equipo en cualquier momento desde la pestaña Equipo. Se convertirán en profesionales independientes pero mantendrán su perfil y reservas.',
      },
    ],
  },
}

// Screenshots from the guides folder - Spanish
const stepImagesEs = [
  '/guides/08-team-leader/es/01-team-overview.png',      // Referral code at top
  '/guides/08-team-leader/es/02-copy-code.png',          // Share code (copy action)
  '/guides/08-team-leader/es/04-refer-filled.png',       // Manual refer form filled
  '/guides/08-team-leader/es/10-applicant-conversation.png', // Review applicant chat
  '/guides/08-team-leader/es/06-team-members.png',       // Team members
]

// English screenshots
const stepImagesEn = [
  '/guides/08-team-leader/en/01-team-overview.png',      // Referral code at top
  '/guides/08-team-leader/en/02-referral-code.png',      // Share code
  '/guides/08-team-leader/en/04-refer-filled.png',       // Manual refer form filled
  '/guides/08-team-leader/es/10-applicant-conversation.png', // Review applicant (ES fallback)
  '/guides/08-team-leader/en/05-team-members.png',       // Team members
]

export default function TeamLeaderGuide() {
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
          <div className="inline-flex items-center gap-2 bg-[#FFF3E0] text-[#E65100] px-3 py-1 rounded-full text-sm font-medium mb-4">
            <span>👑</span>
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
