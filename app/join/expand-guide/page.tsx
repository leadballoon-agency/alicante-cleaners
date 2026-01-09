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
    title: 'Expand Your Business',
    subtitle: 'Turn your cleaning team into a full Villa Services business. Recruit specialists, add custom services, and offer everything villa owners need in one place.',

    // Vision section
    visionTitle: 'The Opportunity',
    visionText: 'Villa owners need more than just cleaning. Pool maintenance, gardening, laundry, window cleaning... By recruiting specialists to your team, you become their one-stop-shop for all villa services.',

    readyTitle: 'Ready to expand?',
    readyText: 'Start by inviting a specialist you know - a pool cleaner, gardener, or handyman. Then add their service to your team offerings.',
    openDashboard: 'Open Dashboard',
    teamTab: 'Go to Team tab to invite, Profile tab for services',
    faqTitle: 'Expansion FAQ',
    contact: 'Questions? Contact us at hello@alicantecleaners.com',

    // Specialist types
    specialistTitle: 'Who Can Join Your Team?',
    specialists: [
      { icon: '🏊', name: 'Pool Cleaners', desc: 'Maintenance & chemicals' },
      { icon: '🌿', name: 'Gardeners', desc: 'Landscaping & lawn care' },
      { icon: '👔', name: 'Laundry Services', desc: 'Wash, dry & fold' },
      { icon: '🪟', name: 'Window Cleaners', desc: 'Interior & exterior' },
      { icon: '🔧', name: 'Handymen', desc: 'Minor repairs & fixes' },
      { icon: '✨', name: 'And More...', desc: 'Any villa service!' },
    ],

    steps: [
      {
        title: 'Find a specialist',
        description: 'Think about what services your villa owner clients ask for. Do they need pool cleaning? Gardening? Find someone who provides that service and would like more clients.',
        tip: 'Start with specialists you already know and trust - perhaps someone a client has used before, or a professional you\'ve worked alongside.',
      },
      {
        title: 'Invite them to your team',
        description: 'Share your referral code with the specialist. When they sign up at VillaCare, they\'ll be connected to your team. You can also use "Refer Someone" to send a WhatsApp invite.',
        tip: 'Explain the benefits: access to villa owner clients, professional booking system, and being part of a trusted team.',
      },
      {
        title: 'Accept their application',
        description: 'Once they complete signup, they\'ll appear in your "New Applicants" section. Review their profile - make sure they\'ve added their specialty in their bio and have appropriate experience.',
        tip: 'Ask them to mention their specialty clearly (e.g., "Pool maintenance technician with 5 years experience") so owners know what they do.',
      },
      {
        title: 'Create their service',
        description: 'Go to your Profile tab and scroll to "Team Services". Tap "+" to add a new custom service like "Pool Cleaning" or "Garden Maintenance". Set the pricing and submit for approval.',
        tip: 'Use descriptive names and set fair prices. Services need admin approval before going live - usually within 24 hours.',
      },
      {
        title: 'Start taking bookings!',
        description: 'Once approved, the new service appears on your public profile. Villa owners can book it just like any other service. Assign bookings to your specialist team member.',
        tip: 'Promote your new services to existing clients! "We now offer pool cleaning through our team" is a great message to send.',
      },
    ],
    faqs: [
      {
        q: 'Do specialists need to be cleaners?',
        a: 'No! VillaCare is for all villa service providers. Pool technicians, gardeners, laundry services, handymen - anyone who provides services to villas can join.',
      },
      {
        q: 'How does pricing work for specialist services?',
        a: 'You set the pricing when creating the service. It can be hourly (based on estimated hours × rate) or fixed price. Your team member fulfils the booking and earns accordingly.',
      },
      {
        q: 'Can specialists also do cleaning?',
        a: 'Yes! If they\'re willing and able, they can take on regular cleaning bookings too. They just need to set an hourly rate in their profile.',
      },
      {
        q: 'What if a specialist wants to be independent?',
        a: 'They can create their own team and become a Team Leader themselves. But joining your team first gives them instant access to clients.',
      },
      {
        q: 'Do I earn from my team\'s bookings?',
        a: 'Currently team members handle their own earnings. Future updates will include team commission features and booking assignment tools.',
      },
    ],
  },
  es: {
    backToJoin: 'Volver',
    goToDashboard: 'Ir al Panel',
    badge: 'Líderes de Equipo',
    title: 'Expande Tu Negocio',
    subtitle: 'Convierte tu equipo de limpieza en un negocio completo de Servicios para Villas. Recluta especialistas, añade servicios personalizados y ofrece todo lo que los propietarios necesitan en un solo lugar.',

    // Vision section
    visionTitle: 'La Oportunidad',
    visionText: 'Los propietarios de villas necesitan más que solo limpieza. Mantenimiento de piscinas, jardinería, lavandería, limpieza de ventanas... Al reclutar especialistas para tu equipo, te conviertes en su solución completa para todos los servicios de villa.',

    readyTitle: '¿Lista para expandir?',
    readyText: 'Empieza invitando a un especialista que conozcas - un limpiador de piscinas, jardinero o manitas. Luego añade su servicio a las ofertas de tu equipo.',
    openDashboard: 'Abrir Panel',
    teamTab: 'Ve a Equipo para invitar, Perfil para servicios',
    faqTitle: 'Preguntas sobre Expansión',
    contact: '¿Preguntas? Escríbenos a hello@alicantecleaners.com',

    // Specialist types
    specialistTitle: '¿Quién Puede Unirse a Tu Equipo?',
    specialists: [
      { icon: '🏊', name: 'Limpiadores de Piscina', desc: 'Mantenimiento y químicos' },
      { icon: '🌿', name: 'Jardineros', desc: 'Paisajismo y césped' },
      { icon: '👔', name: 'Servicios de Lavandería', desc: 'Lavar, secar y doblar' },
      { icon: '🪟', name: 'Limpiadores de Ventanas', desc: 'Interior y exterior' },
      { icon: '🔧', name: 'Manitas', desc: 'Reparaciones menores' },
      { icon: '✨', name: 'Y Más...', desc: '¡Cualquier servicio de villa!' },
    ],

    steps: [
      {
        title: 'Encuentra un especialista',
        description: 'Piensa en qué servicios piden tus clientes propietarios de villas. ¿Necesitan limpieza de piscina? ¿Jardinería? Encuentra a alguien que proporcione ese servicio y quiera más clientes.',
        tip: 'Empieza con especialistas que ya conoces y en quienes confías - quizás alguien que un cliente haya usado antes, o un profesional con quien hayas trabajado.',
      },
      {
        title: 'Invítalos a tu equipo',
        description: 'Comparte tu código de referido con el especialista. Cuando se registren en VillaCare, estarán conectados a tu equipo. También puedes usar "Recomendar a Alguien" para enviar una invitación por WhatsApp.',
        tip: 'Explica los beneficios: acceso a clientes propietarios de villas, sistema de reservas profesional y ser parte de un equipo de confianza.',
      },
      {
        title: 'Acepta su solicitud',
        description: 'Una vez que completen el registro, aparecerán en tu sección "Nuevos Solicitantes". Revisa su perfil - asegúrate de que hayan añadido su especialidad en su bio y tengan experiencia apropiada.',
        tip: 'Pídeles que mencionen su especialidad claramente (ej., "Técnico de mantenimiento de piscinas con 5 años de experiencia") para que los propietarios sepan qué hacen.',
      },
      {
        title: 'Crea su servicio',
        description: 'Ve a tu pestaña Perfil y desplázate hasta "Servicios del Equipo". Toca "+" para añadir un nuevo servicio personalizado como "Limpieza de Piscina" o "Mantenimiento de Jardín". Establece el precio y envía para aprobación.',
        tip: 'Usa nombres descriptivos y establece precios justos. Los servicios necesitan aprobación del administrador antes de publicarse - normalmente en 24 horas.',
      },
      {
        title: '¡Empieza a recibir reservas!',
        description: 'Una vez aprobado, el nuevo servicio aparece en tu perfil público. Los propietarios de villas pueden reservarlo como cualquier otro servicio. Asigna reservas a tu miembro del equipo especialista.',
        tip: '¡Promociona tus nuevos servicios a clientes existentes! "Ahora ofrecemos limpieza de piscina a través de nuestro equipo" es un gran mensaje para enviar.',
      },
    ],
    faqs: [
      {
        q: '¿Los especialistas necesitan ser limpiadores?',
        a: '¡No! VillaCare es para todos los proveedores de servicios de villa. Técnicos de piscina, jardineros, servicios de lavandería, manitas - cualquiera que proporcione servicios a villas puede unirse.',
      },
      {
        q: '¿Cómo funciona el precio para servicios de especialistas?',
        a: 'Tú estableces el precio al crear el servicio. Puede ser por hora (basado en horas estimadas × tarifa) o precio fijo. Tu miembro del equipo cumple la reserva y gana en consecuencia.',
      },
      {
        q: '¿Pueden los especialistas también hacer limpieza?',
        a: '¡Sí! Si están dispuestos y son capaces, pueden aceptar reservas de limpieza regulares también. Solo necesitan establecer una tarifa por hora en su perfil.',
      },
      {
        q: '¿Qué pasa si un especialista quiere ser independiente?',
        a: 'Pueden crear su propio equipo y convertirse en Líder de Equipo ellos mismos. Pero unirse a tu equipo primero les da acceso instantáneo a clientes.',
      },
      {
        q: '¿Gano de las reservas de mi equipo?',
        a: 'Actualmente los miembros del equipo gestionan sus propias ganancias. Futuras actualizaciones incluirán funciones de comisión de equipo y herramientas de asignación de reservas.',
      },
    ],
  },
}

// Screenshots - reusing existing guide images
const stepImagesEn = [
  '/guides/08-team-leader/en/01-team-overview.png',      // Team overview with code
  '/guides/08-team-leader/en/04-refer-filled.png',       // Refer form filled
  '/guides/08-team-leader/es/10-applicant-conversation.png', // Review applicant
  '/guides/services/services-02-add-modal.png',          // Add service modal
  '/guides/services/services-04-pending.png',            // Pending approval
]

const stepImagesEs = [
  '/guides/08-team-leader/es/01-team-overview.png',      // Team overview with code
  '/guides/08-team-leader/es/04-refer-filled.png',       // Refer form filled
  '/guides/08-team-leader/es/10-applicant-conversation.png', // Review applicant
  '/guides/services/services-02-add-modal.png',          // Add service modal
  '/guides/services/services-04-pending.png',            // Pending approval
]

export default function ExpandGuide() {
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
            <span>🚀</span>
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

      {/* Vision Section */}
      <section className="py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-gradient-to-br from-[#1A1A1A] to-[#333] rounded-2xl p-6 md:p-8 text-white">
            <h2 className="text-xl md:text-2xl font-bold mb-3">{t.visionTitle}</h2>
            <p className="text-white/80 leading-relaxed">{t.visionText}</p>
          </div>
        </div>
      </section>

      {/* Specialist Types Grid */}
      <section className="py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-[#1A1A1A] mb-6 text-center">{t.specialistTitle}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {t.specialists.map((spec, index) => (
              <div key={index} className="bg-white rounded-xl p-4 border border-[#EBEBEB] text-center">
                <span className="text-2xl mb-2 block">{spec.icon}</span>
                <h3 className="font-medium text-[#1A1A1A] text-sm">{spec.name}</h3>
                <p className="text-xs text-[#6B6B6B] mt-1">{spec.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Steps with Phone Mockups */}
      <section className="py-8 px-4">
        <div className="max-w-3xl mx-auto space-y-12">
          {t.steps.map((step, index) => (
            <div
              key={index}
              className={`flex flex-col ${index % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row'} gap-6 md:gap-10 items-center`}
            >
              {/* Phone mockup - responsive sizes */}
              <div className="w-full md:w-1/2 flex justify-center">
                <div className="relative">
                  {/* Phone frame */}
                  <div className="w-[220px] h-[440px] sm:w-[280px] sm:h-[560px] bg-[#1A1A1A] rounded-[32px] sm:rounded-[40px] p-2 sm:p-3 shadow-2xl">
                    <div className="w-full h-full bg-white rounded-[26px] sm:rounded-[32px] overflow-hidden relative">
                      {/* Notch */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 sm:w-24 h-5 sm:h-6 bg-[#1A1A1A] rounded-b-xl sm:rounded-b-2xl z-10" />
                      {/* Screenshot */}
                      <Image
                        src={images[index]}
                        alt={step.title}
                        fill
                        className="object-cover object-top"
                      />
                    </div>
                  </div>
                  {/* Step number badge */}
                  <div className="absolute -top-2 -left-2 sm:-top-3 sm:-left-3 w-8 h-8 sm:w-10 sm:h-10 bg-[#C4785A] text-white rounded-full flex items-center justify-center font-bold text-base sm:text-lg shadow-lg">
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

      {/* Related Guides */}
      <section className="py-8 px-4 bg-[#F5F5F3]">
        <div className="max-w-xl mx-auto">
          <h3 className="text-lg font-semibold text-[#1A1A1A] mb-4 text-center">
            {lang === 'es' ? 'Guías Relacionadas' : 'Related Guides'}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/join/team-leader-guide"
              className="bg-white rounded-xl p-4 border border-[#EBEBEB] hover:border-[#C4785A] transition-colors"
            >
              <span className="text-xl mb-2 block">👑</span>
              <h4 className="font-medium text-[#1A1A1A] text-sm">
                {lang === 'es' ? 'Guía de Equipo' : 'Team Guide'}
              </h4>
              <p className="text-xs text-[#6B6B6B] mt-1">
                {lang === 'es' ? 'Cómo gestionar tu equipo' : 'How to manage your team'}
              </p>
            </Link>
            <Link
              href="/join/services-guide"
              className="bg-white rounded-xl p-4 border border-[#EBEBEB] hover:border-[#C4785A] transition-colors"
            >
              <span className="text-xl mb-2 block">🛠️</span>
              <h4 className="font-medium text-[#1A1A1A] text-sm">
                {lang === 'es' ? 'Guía de Servicios' : 'Services Guide'}
              </h4>
              <p className="text-xs text-[#6B6B6B] mt-1">
                {lang === 'es' ? 'Añadir servicios personalizados' : 'Add custom services'}
              </p>
            </Link>
          </div>
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
