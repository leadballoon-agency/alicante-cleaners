'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { PhoneMockup } from '@/components/ui/phone-mockup'

type Lang = 'en' | 'es'

const translations = {
  en: {
    alreadyMember: 'Already a member? Sign in',
    guidesLink: 'Help & Guides',
    loading: 'Taking you to your dashboard...',
    betaBadge: 'Invitation Only',
    heroTitle1: 'Business infrastructure',
    heroTitle2: 'for cleaning professionals',
    heroSubtitle: 'Your AI handles enquiries. Calendar sync avoids clashes. Teams give you backup. Access notes appear automatically. Focus on cleaning - we handle the rest.',
    applyToJoin: 'Apply to Join',
    seeHowItWorks: 'See how it works',
    takes2min: 'Takes 2 minutes. Phone number only - no email needed.',

    whyJoinTitle: 'The tools professional cleaners need',
    whyJoinSubtitle: 'Built with Clara, a professional cleaner with 5 years experience. Everything she wished existed to run her business.',

    featureAiTitle: 'AI Sales Assistant',
    featureAiDesc: 'Your AI handles inquiries, checks your calendar, and books jobs - while you focus on cleaning. Never miss a lead again.',
    featureTranslationTitle: 'Auto-translation',
    featureTranslationDesc: 'Owners write in English, German, French - you read in Spanish. No more Google Translate screenshots. Just clear communication.',
    featureTeamTitle: 'Build Your Team',
    featureTeamDesc: 'Invite trusted colleagues to your team. Cover for each other when life happens. Never let a client down.',
    featureCalendarTitle: 'Calendar Sync',
    featureCalendarDesc: 'Bookings automatically sync to Google Calendar, Apple Calendar, or Outlook. Your schedule, always up to date.',
    howItWorksLink: 'How it works →',
    featureProfileTitle: 'Your Own Profile',
    featureProfileDesc: 'A professional page at villacare.app/yourname. Share your bio, services, reviews, and areas you cover.',
    featureFreeTitle: 'No Platform Fees',
    featureFreeDesc: 'Keep what you earn. No commission, no hidden charges. We grow when you grow.',

    aiPowered: 'AI-Powered',
    aiSectionTitle: 'Your AI handles sales while you clean',
    aiSectionDesc: "Never miss an inquiry again. Your personal AI assistant responds to potential clients instantly, answers questions about your services, checks your availability, and books jobs - all while you're focused on what you do best.",
    instantResponses: 'Instant responses',
    instantResponsesDesc: "Replies to inquiries 24/7, even when you're busy",
    knowsSchedule: 'Knows your schedule',
    knowsScheduleDesc: 'Checks your calendar and only offers available slots',
    growsBusiness: 'Grows your business',
    growsBusinessDesc: 'Converts more leads into bookings while you focus on cleaning',

    profileSectionTitle: 'Your own professional profile',
    profileSectionDesc: 'Get a beautiful booking page at',
    profileSectionDesc2: '. Share it with clients and let them book directly.',
    showcaseReviews: 'Showcase your reviews',
    showcaseReviewsDesc: 'Build trust with verified reviews from happy clients',
    setOwnPrices: 'Set your own prices',
    setOwnPricesDesc: 'Display your services with clear pricing - no surprises',
    personalAi: 'Personal AI assistant',
    personalAiDesc: 'Visitors chat with your AI, get answers, and book instantly',

    ratesSectionTitle: 'Set your rates, grow your business',
    ratesSectionDesc: "You're in control. Set your hourly rate and service prices. Accept the jobs that work for you.",
    setPrices: 'Set your own prices',
    setPricesDesc: 'Choose your hourly rate - we calculate service prices automatically',
    acceptBookings: 'Accept bookings your way',
    acceptBookingsDesc: "One tap to confirm. Decline if you're busy. You decide",
    trackEarnings: 'Track your earnings',
    trackEarningsDesc: "See this week, this month, and what's coming up",

    translationSectionTitle: 'No more language barriers',
    translationSectionDesc: 'Owners message in English, German, French - you read everything in Spanish. Reply in Spanish, they read it in their language.',
    autoTranslation: 'Auto-translation happens instantly. No more Google Translate screenshots.',

    calendarSectionTitle: 'Your schedule, always synced',
    calendarSectionDesc: 'Bookings automatically sync to your phone calendar. No more double-bookings or missed appointments.',
    worksWithEverything: 'Works with everything',
    worksWithEverythingDesc: 'Google Calendar, Apple Calendar, Outlook - all supported',
    realTimeUpdates: 'Real-time updates',
    realTimeUpdatesDesc: 'New bookings appear instantly. Changes sync automatically',
    seeHowToSetup: 'See how to set it up',

    dashboardSectionTitle: 'Everything at your fingertips',
    dashboardSectionDesc: 'Your cleaner dashboard shows all your bookings at a glance. Hold on any job to see full details - address, owner contact, key holder, and access notes.',
    peekToLock: 'Peek-to-lock',
    peekToLockDesc: 'Hold to preview, release to close. Lock open for full interaction',
    oneTouch: 'One-touch calling',
    oneTouchDesc: 'Call owners or key holders instantly from the booking details',
    secureAccess: 'Secure access notes',
    secureAccessDesc: 'Property codes and instructions appear 24h before the job - never earlier',

    howToJoinTitle: 'How to join',
    step1Title: 'Apply with your phone',
    step1Desc: 'Enter your mobile number and verify with a code. No email required.',
    step2Title: 'Complete your profile',
    step2Desc: 'Add your photo, bio, service areas, and set your rates.',
    step3Title: 'Start receiving bookings',
    step3Desc: 'Your AI assistant handles inquiries. You accept jobs that work for you.',

    claraQuote: '"I spent years juggling WhatsApp messages, Google Translate, and paper calendars. Now I have one place for everything, and my AI handles bookings while I\'m at a villa. It\'s what I always wished existed."',
    claraName: 'Clara Rodrigues, Co-founder & Team Leader',
    claraExp: '5 years experience · 25 five-star reviews',

    trustTitle: 'We grow through trust',
    trustDesc: 'VillaCare is invitation-only. We ask for a referral from an existing member, or we verify your professional reputation. This keeps quality high and protects everyone in the network.',
    trustNote: "Don't know anyone? No problem - apply anyway and tell us about your experience.",

    ctaTitle: 'Ready to grow your business?',
    ctaDesc: 'No fees, no commission. Help us build something great together.',

    footerStory: 'Our story',
    footerPrivacy: 'Privacy',
    footerTerms: 'Terms',

    guidesTitle: 'Guides & Help',
    guidesSubtitle: 'Learn how to get the most out of VillaCare',
    guideOnboarding: 'Getting Started',
    guideOnboardingDesc: 'How to create your profile',
    guideBookings: 'Managing Bookings',
    guideBookingsDesc: 'Accept jobs and contact owners',
    guideTeamLeader: 'Team Leaders',
    guideTeamLeaderDesc: 'How to grow your team',
    guideTeamMember: 'Join a Team',
    guideTeamMemberDesc: 'How to join an existing team',
    guideCalendar: 'Calendar Sync',
    guideCalendarDesc: 'Connect your calendar',
  },
  es: {
    alreadyMember: '¿Ya eres miembro? Inicia sesión',
    guidesLink: 'Ayuda y Guías',
    loading: 'Llevándote a tu panel...',
    betaBadge: 'Solo por Invitación',
    heroTitle1: 'Infraestructura de negocio',
    heroTitle2: 'para profesionales de limpieza',
    heroSubtitle: 'Tu IA gestiona consultas. El calendario evita conflictos. Los equipos te dan respaldo. Las notas de acceso aparecen automáticamente. Concéntrate en limpiar - nosotros nos encargamos del resto.',
    applyToJoin: 'Solicitar Unirse',
    seeHowItWorks: 'Ver cómo funciona',
    takes2min: 'Solo 2 minutos. Solo número de teléfono - no necesitas email.',

    whyJoinTitle: 'Las herramientas que los profesionales necesitan',
    whyJoinSubtitle: 'Construido con Clara, una profesional de limpieza con 5 años de experiencia. Todo lo que deseaba para gestionar su negocio.',

    featureAiTitle: 'Asistente IA de Ventas',
    featureAiDesc: 'Tu IA gestiona consultas, revisa tu calendario y reserva trabajos - mientras tú te concentras en limpiar. Nunca pierdas un cliente.',
    featureTranslationTitle: 'Traducción automática',
    featureTranslationDesc: 'Los propietarios escriben en inglés, alemán, francés - tú lees en español. Sin más capturas de Google Translate. Comunicación clara.',
    featureTeamTitle: 'Crea Tu Equipo',
    featureTeamDesc: 'Invita a colegas de confianza a tu equipo. Cubríos cuando surjan imprevistos. Nunca dejes a un cliente tirado.',
    featureCalendarTitle: 'Sincronización de Calendario',
    featureCalendarDesc: 'Las reservas se sincronizan automáticamente con Google Calendar, Apple Calendar u Outlook. Tu agenda, siempre actualizada.',
    howItWorksLink: 'Cómo funciona →',
    featureProfileTitle: 'Tu Propio Perfil',
    featureProfileDesc: 'Una página profesional en villacare.app/tunombre. Comparte tu biografía, servicios, reseñas y zonas que cubres.',
    featureFreeTitle: 'Sin Comisiones',
    featureFreeDesc: 'Quédate con lo que ganas. Sin comisiones, sin cargos ocultos. Crecemos cuando tú creces.',

    aiPowered: 'Con IA',
    aiSectionTitle: 'Tu IA vende mientras tú limpias',
    aiSectionDesc: 'Nunca pierdas una consulta. Tu asistente IA personal responde a clientes potenciales al instante, responde preguntas sobre tus servicios, verifica tu disponibilidad y reserva trabajos - todo mientras te concentras en lo que mejor haces.',
    instantResponses: 'Respuestas instantáneas',
    instantResponsesDesc: 'Responde consultas 24/7, incluso cuando estás ocupada',
    knowsSchedule: 'Conoce tu agenda',
    knowsScheduleDesc: 'Revisa tu calendario y solo ofrece horas disponibles',
    growsBusiness: 'Hace crecer tu negocio',
    growsBusinessDesc: 'Convierte más consultas en reservas mientras tú limpias',

    profileSectionTitle: 'Tu propio perfil profesional',
    profileSectionDesc: 'Obtén una página de reservas bonita en',
    profileSectionDesc2: '. Compártela con clientes y deja que reserven directamente.',
    showcaseReviews: 'Muestra tus reseñas',
    showcaseReviewsDesc: 'Genera confianza con reseñas verificadas de clientes satisfechos',
    setOwnPrices: 'Establece tus propios precios',
    setOwnPricesDesc: 'Muestra tus servicios con precios claros - sin sorpresas',
    personalAi: 'Asistente IA personal',
    personalAiDesc: 'Los visitantes chatean con tu IA, obtienen respuestas y reservan al instante',

    ratesSectionTitle: 'Establece tus tarifas, haz crecer tu negocio',
    ratesSectionDesc: 'Tú tienes el control. Establece tu tarifa por hora y precios de servicios. Acepta los trabajos que te convengan.',
    setPrices: 'Establece tus propios precios',
    setPricesDesc: 'Elige tu tarifa por hora - calculamos los precios automáticamente',
    acceptBookings: 'Acepta reservas a tu manera',
    acceptBookingsDesc: 'Un toque para confirmar. Rechaza si estás ocupada. Tú decides',
    trackEarnings: 'Controla tus ganancias',
    trackEarningsDesc: 'Ve esta semana, este mes y lo que viene',

    translationSectionTitle: 'Sin barreras de idioma',
    translationSectionDesc: 'Los propietarios escriben en inglés, alemán, francés - tú lees todo en español. Responde en español, ellos lo leen en su idioma.',
    autoTranslation: 'La traducción automática es instantánea. Sin más capturas de Google Translate.',

    calendarSectionTitle: 'Tu agenda, siempre sincronizada',
    calendarSectionDesc: 'Las reservas se sincronizan automáticamente con el calendario de tu móvil. Sin más reservas dobles ni citas perdidas.',
    worksWithEverything: 'Funciona con todo',
    worksWithEverythingDesc: 'Google Calendar, Apple Calendar, Outlook - todos soportados',
    realTimeUpdates: 'Actualizaciones en tiempo real',
    realTimeUpdatesDesc: 'Las nuevas reservas aparecen al instante. Los cambios se sincronizan automáticamente',
    seeHowToSetup: 'Ver cómo configurarlo',

    dashboardSectionTitle: 'Todo al alcance de tu mano',
    dashboardSectionDesc: 'Tu panel de control muestra todas tus reservas de un vistazo. Mantén pulsado cualquier trabajo para ver todos los detalles - dirección, contacto del propietario, contacto del vecino con llaves y notas de acceso.',
    peekToLock: 'Vistazo rápido',
    peekToLockDesc: 'Mantén pulsado para ver, suelta para cerrar. Bloquea abierto para interactuar',
    oneTouch: 'Llamada con un toque',
    oneTouchDesc: 'Llama a propietarios o vecinos con llaves instantáneamente desde los detalles de la reserva',
    secureAccess: 'Notas de acceso seguras',
    secureAccessDesc: 'Los códigos e instrucciones de la propiedad aparecen 24h antes del trabajo - nunca antes',

    howToJoinTitle: 'Cómo unirse',
    step1Title: 'Solicita con tu teléfono',
    step1Desc: 'Introduce tu número móvil y verifica con un código. No necesitas email.',
    step2Title: 'Completa tu perfil',
    step2Desc: 'Añade tu foto, biografía, zonas de servicio y establece tus tarifas.',
    step3Title: 'Empieza a recibir reservas',
    step3Desc: 'Tu asistente IA gestiona consultas. Tú aceptas los trabajos que te convengan.',

    claraQuote: '"Pasé años haciendo malabares con mensajes de WhatsApp, Google Translate y calendarios de papel. Ahora tengo un solo lugar para todo, y mi IA gestiona reservas mientras estoy en una villa. Es lo que siempre deseé que existiera."',
    claraName: 'Clara Rodrigues, Cofundadora y Líder de Equipo',
    claraExp: '5 años de experiencia · 25 reseñas de 5 estrellas',

    trustTitle: 'Crecemos con confianza',
    trustDesc: 'VillaCare es solo por invitación. Pedimos una referencia de un miembro existente, o verificamos tu reputación profesional. Esto mantiene la calidad alta y protege a todos en la red.',
    trustNote: '¿No conoces a nadie? No hay problema - solicita igualmente y cuéntanos tu experiencia.',

    ctaTitle: '¿Lista para hacer crecer tu negocio?',
    ctaDesc: 'Sin comisiones, sin cuotas. Ayúdanos a construir algo genial juntos.',

    footerStory: 'Nuestra historia',
    footerPrivacy: 'Privacidad',
    footerTerms: 'Términos',

    guidesTitle: 'Guías y Ayuda',
    guidesSubtitle: 'Aprende a sacar el máximo partido de VillaCare',
    guideOnboarding: 'Primeros Pasos',
    guideOnboardingDesc: 'Cómo crear tu perfil',
    guideBookings: 'Gestión de Reservas',
    guideBookingsDesc: 'Acepta trabajos y contacta propietarios',
    guideTeamLeader: 'Líderes de Equipo',
    guideTeamLeaderDesc: 'Cómo hacer crecer tu equipo',
    guideTeamMember: 'Unirse a un Equipo',
    guideTeamMemberDesc: 'Cómo unirte a un equipo existente',
    guideCalendar: 'Sincronizar Calendario',
    guideCalendarDesc: 'Conecta tu calendario',
  },
}

export default function JoinPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [lang, setLang] = useState<Lang>('es')
  const t = translations[lang]

  // Redirect cleaners to their dashboard - they're already on the platform
  useEffect(() => {
    if (session?.user?.role === 'CLEANER') {
      router.push('/dashboard')
    }
  }, [session, router])

  // Show loading while checking session for cleaners
  if (session?.user?.role === 'CLEANER') {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#C4785A] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#6B6B6B]">{t.loading}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Header */}
      <header className="bg-white border-b border-[#EBEBEB]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/villacare-horizontal-logo.png"
              alt="VillaCare"
              width={140}
              height={32}
              className="h-8 w-auto"
            />
          </Link>
          <div className="flex items-center gap-4">
            {/* Language Toggle */}
            <div className="flex items-center bg-[#F5F5F3] rounded-lg p-1">
              <button
                onClick={() => setLang('es')}
                className={`px-2 py-1 rounded-md text-sm font-medium transition-colors ${
                  lang === 'es' ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#6B6B6B]'
                }`}
              >
                🇪🇸
              </button>
              <button
                onClick={() => setLang('en')}
                className={`px-2 py-1 rounded-md text-sm font-medium transition-colors ${
                  lang === 'en' ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#6B6B6B]'
                }`}
              >
                🇬🇧
              </button>
            </div>
            <a
              href="#guides"
              className="text-sm text-[#6B6B6B] hover:text-[#1A1A1A]"
            >
              {t.guidesLink}
            </a>
            <Link
              href="/login"
              className="text-sm text-[#6B6B6B] hover:text-[#1A1A1A] hidden sm:block"
            >
              {t.alreadyMember}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 py-16 bg-gradient-to-b from-[#1A1A1A] to-[#2A2A2A] text-white">
        <div className="max-w-4xl mx-auto text-center">
          {/* Beta Badge */}
          <span className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-sm mb-6">
            <span className="w-2 h-2 bg-[#C4785A] rounded-full animate-pulse" />
            {t.betaBadge}
          </span>

          <h1 className="text-3xl sm:text-5xl font-bold mb-4">
            {t.heroTitle1}
            <span className="block text-[#C4785A]">{t.heroTitle2}</span>
          </h1>

          <p className="text-lg text-white/70 mb-8 max-w-2xl mx-auto">
            {t.heroSubtitle}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/onboarding/cleaner"
              className="inline-flex items-center gap-2 bg-[#C4785A] text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-[#B56A4F] transition-colors"
            >
              {t.applyToJoin}
              <span>→</span>
            </Link>
            <Link
              href="/join/guide"
              className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors"
            >
              {t.seeHowItWorks}
              <span>→</span>
            </Link>
          </div>

          <p className="text-sm text-white/50 mt-4">
            {t.takes2min}
          </p>
        </div>
      </section>

      {/* Why Join */}
      <section className="px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-semibold text-[#1A1A1A] text-center mb-4">
            {t.whyJoinTitle}
          </h2>
          <p className="text-[#6B6B6B] text-center mb-12 max-w-2xl mx-auto">
            {t.whyJoinSubtitle}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* AI Assistant */}
            <div className="bg-white rounded-2xl p-6 border border-[#EBEBEB]">
              <div className="w-12 h-12 bg-[#FFF8F5] rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="font-semibold text-[#1A1A1A] mb-2">{t.featureAiTitle}</h3>
              <p className="text-sm text-[#6B6B6B]">
                {t.featureAiDesc}
              </p>
            </div>

            {/* Auto-translation */}
            <div className="bg-white rounded-2xl p-6 border border-[#EBEBEB]">
              <div className="w-12 h-12 bg-[#FFF8F5] rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">🌍</span>
              </div>
              <h3 className="font-semibold text-[#1A1A1A] mb-2">{t.featureTranslationTitle}</h3>
              <p className="text-sm text-[#6B6B6B]">
                {t.featureTranslationDesc}
              </p>
            </div>

            {/* Team Tools */}
            <div className="bg-white rounded-2xl p-6 border border-[#EBEBEB]">
              <div className="w-12 h-12 bg-[#FFF8F5] rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">👥</span>
              </div>
              <h3 className="font-semibold text-[#1A1A1A] mb-2">{t.featureTeamTitle}</h3>
              <p className="text-sm text-[#6B6B6B]">
                {t.featureTeamDesc}
              </p>
            </div>

            {/* Calendar Sync */}
            <div className="bg-white rounded-2xl p-6 border border-[#EBEBEB]">
              <div className="w-12 h-12 bg-[#FFF8F5] rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">📅</span>
              </div>
              <h3 className="font-semibold text-[#1A1A1A] mb-2">{t.featureCalendarTitle}</h3>
              <p className="text-sm text-[#6B6B6B] mb-3">
                {t.featureCalendarDesc}
              </p>
              <Link
                href="/join/calendar-guide"
                className="text-sm text-[#C4785A] hover:text-[#B56A4F] font-medium"
              >
                {t.howItWorksLink}
              </Link>
            </div>

            {/* Your Profile */}
            <div className="bg-white rounded-2xl p-6 border border-[#EBEBEB]">
              <div className="w-12 h-12 bg-[#FFF8F5] rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">✨</span>
              </div>
              <h3 className="font-semibold text-[#1A1A1A] mb-2">{t.featureProfileTitle}</h3>
              <p className="text-sm text-[#6B6B6B]">
                {t.featureProfileDesc}
              </p>
            </div>

            {/* Free During Beta */}
            <div className="bg-[#FFF8F5] rounded-2xl p-6 border border-[#C4785A]">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">🎁</span>
              </div>
              <h3 className="font-semibold text-[#C4785A] mb-2">{t.featureFreeTitle}</h3>
              <p className="text-sm text-[#6B6B6B]">
                {t.featureFreeDesc}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* App Showcase - AI Sales Assistant */}
      <section className="px-6 py-16 bg-[#1A1A1A] overflow-hidden">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            {/* Content */}
            <div className="flex-1 order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-sm text-white/80 mb-4">
                <span className="w-2 h-2 bg-[#C4785A] rounded-full animate-pulse" />
                {t.aiPowered}
              </div>
              <h2 className="text-2xl sm:text-3xl font-semibold text-white mb-4">
                {t.aiSectionTitle}
              </h2>
              <p className="text-white/70 mb-6">
                {t.aiSectionDesc}
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span>💬</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-white">{t.instantResponses}</h4>
                    <p className="text-sm text-white/70">{t.instantResponsesDesc}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span>📅</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-white">{t.knowsSchedule}</h4>
                    <p className="text-sm text-white/70">{t.knowsScheduleDesc}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span>💰</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-white">{t.growsBusiness}</h4>
                    <p className="text-sm text-white/70">{t.growsBusinessDesc}</p>
                  </div>
                </div>
              </div>
            </div>
            {/* Phone Mockup */}
            <div className="flex-shrink-0 order-1 lg:order-2">
              <PhoneMockup
                src="/screenshots/villa-assistant-screenshot.png"
                alt="AI Sales Assistant chat"
              />
            </div>
          </div>
        </div>
      </section>

      {/* App Showcase - Your Profile Page */}
      <section className="px-6 py-16 bg-white border-t border-[#EBEBEB] overflow-hidden">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            {/* Phone Mockup */}
            <div className="flex-shrink-0 order-1 lg:order-1">
              <PhoneMockup
                src="/screenshots/cleaner-profile-full.png"
                alt="Your professional profile page"
              />
            </div>
            {/* Content */}
            <div className="flex-1 order-2 lg:order-2">
              <h2 className="text-2xl sm:text-3xl font-semibold text-[#1A1A1A] mb-4">
                {t.profileSectionTitle}
              </h2>
              <p className="text-[#6B6B6B] mb-6">
                {t.profileSectionDesc} <span className="font-medium text-[#1A1A1A]">villacare.app/yourname</span>{t.profileSectionDesc2}
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#FFF8F5] rounded-xl flex items-center justify-center flex-shrink-0">
                    <span>⭐</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-[#1A1A1A]">{t.showcaseReviews}</h4>
                    <p className="text-sm text-[#6B6B6B]">{t.showcaseReviewsDesc}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#FFF8F5] rounded-xl flex items-center justify-center flex-shrink-0">
                    <span>💰</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-[#1A1A1A]">{t.setOwnPrices}</h4>
                    <p className="text-sm text-[#6B6B6B]">{t.setOwnPricesDesc}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#FFF8F5] rounded-xl flex items-center justify-center flex-shrink-0">
                    <span>🤖</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-[#1A1A1A]">{t.personalAi}</h4>
                    <p className="text-sm text-[#6B6B6B]">{t.personalAiDesc}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* App Showcase - Dashboard */}
      <section className="px-6 py-16 bg-[#FAFAF8] overflow-hidden">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            {/* Content */}
            <div className="flex-1 order-2 lg:order-1">
              <h2 className="text-2xl sm:text-3xl font-semibold text-[#1A1A1A] mb-4">
                {t.ratesSectionTitle}
              </h2>
              <p className="text-[#6B6B6B] mb-6">
                {t.ratesSectionDesc}
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#FFF8F5] rounded-xl flex items-center justify-center flex-shrink-0">
                    <span>💰</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-[#1A1A1A]">{t.setPrices}</h4>
                    <p className="text-sm text-[#6B6B6B]">{t.setPricesDesc}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#FFF8F5] rounded-xl flex items-center justify-center flex-shrink-0">
                    <span>✅</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-[#1A1A1A]">{t.acceptBookings}</h4>
                    <p className="text-sm text-[#6B6B6B]">{t.acceptBookingsDesc}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#FFF8F5] rounded-xl flex items-center justify-center flex-shrink-0">
                    <span>📊</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-[#1A1A1A]">{t.trackEarnings}</h4>
                    <p className="text-sm text-[#6B6B6B]">{t.trackEarningsDesc}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-shrink-0 order-1 lg:order-2">
              <PhoneMockup
                src="/screenshots/cleaner-dashboard-home.png"
                alt="Cleaner dashboard with bookings"
              />
            </div>
          </div>
        </div>
      </section>

      {/* App Showcase - Translation */}
      <section className="px-6 py-16 bg-white border-t border-[#EBEBEB] overflow-hidden">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            {/* Content */}
            <div className="flex-1 order-2 lg:order-1">
              <h2 className="text-2xl sm:text-3xl font-semibold text-[#1A1A1A] mb-4">
                {t.translationSectionTitle}
              </h2>
              <p className="text-[#6B6B6B] mb-6">
                {t.translationSectionDesc}
              </p>
              <div className="flex flex-wrap gap-3 mb-6">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-[#EBEBEB] text-sm">
                  <span>🇬🇧</span> English
                </span>
                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-[#EBEBEB] text-sm">
                  <span>🇩🇪</span> Deutsch
                </span>
                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-[#EBEBEB] text-sm">
                  <span>🇫🇷</span> Français
                </span>
                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-[#EBEBEB] text-sm">
                  <span>🇳🇱</span> Nederlands
                </span>
              </div>
              <p className="text-sm text-[#9B9B9B]">
                {t.autoTranslation}
              </p>
            </div>
            {/* Phone Mockup */}
            <div className="flex-shrink-0 order-1 lg:order-2">
              <PhoneMockup
                src="/screenshots/messaging-translation.png"
                alt="Auto-translation messaging"
              />
            </div>
          </div>
        </div>
      </section>

      {/* App Showcase - Dashboard with Peek-to-Lock */}
      <section className="px-6 py-16 bg-[#1A1A1A] overflow-hidden">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            {/* Content */}
            <div className="flex-1 order-2 lg:order-1">
              <h2 className="text-2xl sm:text-3xl font-semibold text-white mb-4">
                {t.dashboardSectionTitle}
              </h2>
              <p className="text-white/70 mb-6">
                {t.dashboardSectionDesc}
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span>👆</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-white">{t.peekToLock}</h4>
                    <p className="text-sm text-white/70">{t.peekToLockDesc}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span>📞</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-white">{t.oneTouch}</h4>
                    <p className="text-sm text-white/70">{t.oneTouchDesc}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span>🔒</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-white">{t.secureAccess}</h4>
                    <p className="text-sm text-white/70">{t.secureAccessDesc}</p>
                  </div>
                </div>
              </div>
            </div>
            {/* Phone Mockup */}
            <div className="flex-shrink-0 order-1 lg:order-2">
              <PhoneMockup
                src="/screenshots/cleaner-peek-modal-with-call.png"
                alt="Booking details with Call buttons"
              />
            </div>
          </div>
        </div>
      </section>

      {/* App Showcase - Calendar */}
      <section className="px-6 py-16 bg-[#FAFAF8] overflow-hidden">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            {/* Phone Mockup */}
            <div className="flex-shrink-0 order-1 lg:order-1">
              <PhoneMockup
                src="/screenshots/cleaner-dashboard-jobs.png"
                alt="Jobs timeline synced to your calendar"
              />
            </div>
            {/* Content */}
            <div className="flex-1 order-2 lg:order-2">
              <h2 className="text-2xl sm:text-3xl font-semibold text-[#1A1A1A] mb-4">
                {t.calendarSectionTitle}
              </h2>
              <p className="text-[#6B6B6B] mb-6">
                {t.calendarSectionDesc}
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#FFF8F5] rounded-xl flex items-center justify-center flex-shrink-0">
                    <span>📅</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-[#1A1A1A]">{t.worksWithEverything}</h4>
                    <p className="text-sm text-[#6B6B6B]">{t.worksWithEverythingDesc}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#FFF8F5] rounded-xl flex items-center justify-center flex-shrink-0">
                    <span>🔄</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-[#1A1A1A]">{t.realTimeUpdates}</h4>
                    <p className="text-sm text-[#6B6B6B]">{t.realTimeUpdatesDesc}</p>
                  </div>
                </div>
              </div>
              <Link
                href="/join/calendar-guide"
                className="inline-flex items-center gap-2 text-[#C4785A] hover:text-[#B56A4F] font-medium mt-6"
              >
                {t.seeHowToSetup}
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-6 py-16 bg-[#FAFAF8]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold text-[#1A1A1A] text-center mb-12">
            {t.howToJoinTitle}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-14 h-14 bg-[#FFF8F5] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-[#C4785A] font-bold text-xl">1</span>
              </div>
              <h3 className="font-semibold text-[#1A1A1A] mb-2">{t.step1Title}</h3>
              <p className="text-sm text-[#6B6B6B]">
                {t.step1Desc}
              </p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 bg-[#FFF8F5] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-[#C4785A] font-bold text-xl">2</span>
              </div>
              <h3 className="font-semibold text-[#1A1A1A] mb-2">{t.step2Title}</h3>
              <p className="text-sm text-[#6B6B6B]">
                {t.step2Desc}
              </p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 bg-[#FFF8F5] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-[#C4785A] font-bold text-xl">3</span>
              </div>
              <h3 className="font-semibold text-[#1A1A1A] mb-2">{t.step3Title}</h3>
              <p className="text-sm text-[#6B6B6B]">
                {t.step3Desc}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Clara Quote */}
      <section className="px-6 py-16 bg-[#1A1A1A]">
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-24 h-24 rounded-full overflow-hidden flex-shrink-0 border-4 border-[#C4785A]">
              <Image
                src="/cleaners/Clara-Rodrigues.jpeg"
                alt="Clara"
                width={96}
                height={96}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="text-white text-lg italic mb-4">
                {t.claraQuote}
              </p>
              <p className="text-[#C4785A] font-medium">
                {t.claraName}
              </p>
              <p className="text-white/50 text-sm">
                {t.claraExp}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Guides Section */}
      <section id="guides" className="px-6 py-16 bg-[#F5F5F3] scroll-mt-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-semibold text-[#1A1A1A] mb-2">{t.guidesTitle}</h2>
            <p className="text-[#6B6B6B]">{t.guidesSubtitle}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <Link
              href="/join/guide"
              className="bg-white rounded-xl p-5 border border-[#EBEBEB] hover:border-[#C4785A] hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 bg-[#E8F5E9] rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <span className="text-xl">🚀</span>
              </div>
              <h3 className="font-medium text-[#1A1A1A] mb-1">{t.guideOnboarding}</h3>
              <p className="text-sm text-[#6B6B6B]">{t.guideOnboardingDesc}</p>
            </Link>
            <Link
              href="/join/booking-guide"
              className="bg-white rounded-xl p-5 border border-[#EBEBEB] hover:border-[#C4785A] hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 bg-[#E3F2FD] rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <span className="text-xl">📋</span>
              </div>
              <h3 className="font-medium text-[#1A1A1A] mb-1">{t.guideBookings}</h3>
              <p className="text-sm text-[#6B6B6B]">{t.guideBookingsDesc}</p>
            </Link>
            <Link
              href="/join/team-leader-guide"
              className="bg-white rounded-xl p-5 border border-[#EBEBEB] hover:border-[#C4785A] hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 bg-[#FFF3E0] rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <span className="text-xl">👑</span>
              </div>
              <h3 className="font-medium text-[#1A1A1A] mb-1">{t.guideTeamLeader}</h3>
              <p className="text-sm text-[#6B6B6B]">{t.guideTeamLeaderDesc}</p>
            </Link>
            <Link
              href="/join/team-guide"
              className="bg-white rounded-xl p-5 border border-[#EBEBEB] hover:border-[#C4785A] hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 bg-[#E8F5E9] rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <span className="text-xl">👥</span>
              </div>
              <h3 className="font-medium text-[#1A1A1A] mb-1">{t.guideTeamMember}</h3>
              <p className="text-sm text-[#6B6B6B]">{t.guideTeamMemberDesc}</p>
            </Link>
            <Link
              href="/join/calendar-guide"
              className="bg-white rounded-xl p-5 border border-[#EBEBEB] hover:border-[#C4785A] hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 bg-[#F3E5F5] rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <span className="text-xl">📅</span>
              </div>
              <h3 className="font-medium text-[#1A1A1A] mb-1">{t.guideCalendar}</h3>
              <p className="text-sm text-[#6B6B6B]">{t.guideCalendarDesc}</p>
            </Link>
          </div>
        </div>
      </section>

      {/* Trust & Referral */}
      <section className="px-6 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-16 h-16 bg-[#FFF8F5] rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">🤝</span>
          </div>
          <h2 className="text-2xl font-semibold text-[#1A1A1A] mb-4">
            {t.trustTitle}
          </h2>
          <p className="text-[#6B6B6B] mb-8 max-w-xl mx-auto">
            {t.trustDesc}
          </p>
          <p className="text-sm text-[#9B9B9B]">
            {t.trustNote}
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-16 bg-[#FFF8F5] border-t border-[#EBEBEB]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-semibold text-[#1A1A1A] mb-4">
            {t.ctaTitle}
          </h2>
          <p className="text-[#6B6B6B] mb-8">
            {t.ctaDesc}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/onboarding/cleaner"
              className="inline-flex items-center gap-2 bg-[#C4785A] text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-[#B56A4F] transition-colors"
            >
              {t.applyToJoin}
              <span>→</span>
            </Link>
            <Link
              href="/join/guide"
              className="inline-flex items-center gap-2 text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors"
            >
              {t.seeHowItWorks}
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-[#EBEBEB]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Image
                src="/villacare-horizontal-logo.png"
                alt="VillaCare"
                width={100}
                height={24}
                className="h-6 w-auto opacity-50"
              />
              <span className="text-[#9B9B9B] text-sm">· Alicante, Spain</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-[#9B9B9B]">
              <Link href="/about" className="hover:text-[#6B6B6B]">{t.footerStory}</Link>
              <span>·</span>
              <Link href="/privacy" className="hover:text-[#6B6B6B]">{t.footerPrivacy}</Link>
              <span>·</span>
              <Link href="/terms" className="hover:text-[#6B6B6B]">{t.footerTerms}</Link>
            </div>
          </div>
          {/* Powered by badge */}
          <div className="mt-4 pt-4 border-t border-[#EBEBEB] text-center">
            <a
              href="https://villacare.app"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-[#9B9B9B] hover:text-[#6B6B6B] transition-colors"
            >
              <span>Powered by</span>
              <span className="font-medium">villacare.app</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
