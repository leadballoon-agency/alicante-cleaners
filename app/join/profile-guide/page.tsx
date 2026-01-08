'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

type Lang = 'en' | 'es'

const translations = {
  en: {
    backToJoin: 'Back to Join',
    updateProfile: 'Update Profile',
    badge: 'Get More Bookings',
    title: 'Build a Profile That Stands Out',
    subtitle: 'Your profile is your business card. Learn how to create a profile that attracts villa owners and ranks well on Google.',

    // Why it matters
    whyTitle: 'Why Your Profile Matters',
    whyStats: [
      { stat: '3x', label: 'More bookings with a complete profile' },
      { stat: 'Top', label: 'Google ranking with rich profile data' },
      { stat: '85%', label: 'Of owners check reviews before booking' },
    ],

    // SEO section
    seoTitle: 'Your Profile Powers Your Google Presence',
    seoSubtitle: 'Every detail you add helps villa owners find you on Google',
    seoItems: [
      {
        icon: '📍',
        title: 'Service Areas',
        description: 'The areas you select appear in Google searches like "villa cleaner San Juan"',
      },
      {
        icon: '💶',
        title: 'Hourly Rate',
        description: 'Your pricing shows in search results, helping owners compare options',
      },
      {
        icon: '📝',
        title: 'Your Bio',
        description: 'Your description becomes your Google preview - make it count!',
      },
      {
        icon: '📸',
        title: 'Profile Photo',
        description: 'Professional photos appear in Google image searches and social shares',
      },
      {
        icon: '⭐',
        title: 'Reviews & Rating',
        description: 'Star ratings show directly in Google results - more reviews = more trust',
      },
      {
        icon: '🗣️',
        title: 'Languages',
        description: 'Owners search for cleaners who speak their language',
      },
    ],

    // Profile tips
    tipsTitle: 'Tips for a Great Profile',
    tips: [
      {
        title: 'Professional Photo',
        description: 'Use a clear, friendly headshot. Good lighting makes a big difference. Avoid group photos or selfies with sunglasses.',
        image: '/profile-guide/01-profile-hero.png',
      },
      {
        title: 'Compelling Bio',
        description: 'Share your experience, what makes you special, and your commitment to quality. Keep it personal and authentic.',
        image: '/profile-guide/01-profile-hero.png',
      },
      {
        title: 'Competitive Pricing',
        description: 'Set rates that reflect your experience. Most cleaners charge €15-20/hr. Your services are auto-calculated from your hourly rate.',
        image: '/profile-guide/02-services.png',
      },
      {
        title: 'Build Your Reviews',
        description: 'After each job, ask happy clients to leave a review. Reviews build trust and improve your search ranking.',
        image: '/profile-guide/03-reviews.png',
      },
    ],

    // Share section
    shareTitle: 'Share Your Profile Everywhere',
    shareSubtitle: 'Your profile link works beautifully on social media',
    sharePlatforms: [
      { name: 'WhatsApp', icon: '💬', tip: 'Send to property managers and past clients' },
      { name: 'Facebook', icon: '📘', tip: 'Share on local expat groups' },
      { name: 'Instagram', icon: '📷', tip: 'Add to your bio link' },
      { name: 'Email', icon: '✉️', tip: 'Include in your email signature' },
    ],

    // Demo section
    demoTitle: 'See It In Action',
    demoSubtitle: 'Here\'s how Clara\'s profile looks when shared',
    demoLink: 'www.alicantecleaners.com/clara',
    copyLink: 'Copy Link',
    copied: 'Copied!',
    viewProfile: 'View Clara\'s Profile',

    // CTA
    ctaTitle: 'Ready to improve your profile?',
    ctaText: 'Log in to your dashboard and update your profile to start getting more bookings.',
    ctaButton: 'Update My Profile',

    // FAQ
    faqTitle: 'Common Questions',
    faqs: [
      {
        q: 'How do I update my profile?',
        a: 'Log in to your dashboard and go to the Account tab. You can update your photo, bio, areas, and pricing anytime.',
      },
      {
        q: 'How do reviews help my ranking?',
        a: 'More reviews and higher ratings improve your visibility in search results. Google also shows your star rating directly in search results.',
      },
      {
        q: 'Can I change my service areas?',
        a: 'Yes! Update your areas anytime from the Account tab. Adding more areas means more potential bookings.',
      },
      {
        q: 'What\'s the best way to get reviews?',
        a: 'After completing a job, politely ask happy clients to leave a review. We send them a direct link that makes it easy.',
      },
    ],
    contact: 'Questions? Contact us at hello@alicantecleaners.com',
  },
  es: {
    backToJoin: 'Volver',
    updateProfile: 'Actualizar Perfil',
    badge: 'Consigue Más Reservas',
    title: 'Crea un Perfil que Destaque',
    subtitle: 'Tu perfil es tu tarjeta de visita. Aprende a crear un perfil que atraiga a propietarios y posicione bien en Google.',

    // Why it matters
    whyTitle: 'Por Qué Tu Perfil Importa',
    whyStats: [
      { stat: '3x', label: 'Más reservas con un perfil completo' },
      { stat: 'Top', label: 'Posición en Google con datos completos' },
      { stat: '85%', label: 'De propietarios revisan las reseñas antes de reservar' },
    ],

    // SEO section
    seoTitle: 'Tu Perfil Potencia Tu Presencia en Google',
    seoSubtitle: 'Cada detalle que añades ayuda a que te encuentren en Google',
    seoItems: [
      {
        icon: '📍',
        title: 'Zonas de Servicio',
        description: 'Las zonas que seleccionas aparecen en búsquedas como "limpiadora villas San Juan"',
      },
      {
        icon: '💶',
        title: 'Tarifa por Hora',
        description: 'Tu precio aparece en los resultados de búsqueda, ayudando a comparar opciones',
      },
      {
        icon: '📝',
        title: 'Tu Biografía',
        description: 'Tu descripción se convierte en la vista previa de Google - ¡hazla contar!',
      },
      {
        icon: '📸',
        title: 'Foto de Perfil',
        description: 'Las fotos profesionales aparecen en búsquedas de imágenes y redes sociales',
      },
      {
        icon: '⭐',
        title: 'Reseñas y Valoración',
        description: 'Las estrellas aparecen directamente en Google - más reseñas = más confianza',
      },
      {
        icon: '🗣️',
        title: 'Idiomas',
        description: 'Los propietarios buscan profesionales que hablen su idioma',
      },
    ],

    // Profile tips
    tipsTitle: 'Consejos para un Gran Perfil',
    tips: [
      {
        title: 'Foto Profesional',
        description: 'Usa una foto clara y amigable. La buena iluminación marca la diferencia. Evita fotos de grupo o selfies con gafas de sol.',
        image: '/profile-guide/01-profile-hero.png',
      },
      {
        title: 'Biografía Atractiva',
        description: 'Comparte tu experiencia, qué te hace especial y tu compromiso con la calidad. Sé personal y auténtica.',
        image: '/profile-guide/01-profile-hero.png',
      },
      {
        title: 'Precios Competitivos',
        description: 'Establece tarifas que reflejen tu experiencia. La mayoría cobra €15-20/hr. Los servicios se calculan automáticamente.',
        image: '/profile-guide/02-services.png',
      },
      {
        title: 'Construye tus Reseñas',
        description: 'Después de cada trabajo, pide a los clientes satisfechos que dejen una reseña. Las reseñas generan confianza.',
        image: '/profile-guide/03-reviews.png',
      },
    ],

    // Share section
    shareTitle: 'Comparte Tu Perfil en Todas Partes',
    shareSubtitle: 'Tu enlace de perfil se ve genial en redes sociales',
    sharePlatforms: [
      { name: 'WhatsApp', icon: '💬', tip: 'Envía a gestores de propiedades y clientes anteriores' },
      { name: 'Facebook', icon: '📘', tip: 'Comparte en grupos de expatriados locales' },
      { name: 'Instagram', icon: '📷', tip: 'Añade a tu enlace de biografía' },
      { name: 'Email', icon: '✉️', tip: 'Incluye en tu firma de correo' },
    ],

    // Demo section
    demoTitle: 'Míralo en Acción',
    demoSubtitle: 'Así se ve el perfil de Clara cuando se comparte',
    demoLink: 'www.alicantecleaners.com/clara',
    copyLink: 'Copiar Enlace',
    copied: '¡Copiado!',
    viewProfile: 'Ver Perfil de Clara',

    // CTA
    ctaTitle: '¿Lista para mejorar tu perfil?',
    ctaText: 'Inicia sesión en tu panel y actualiza tu perfil para empezar a recibir más reservas.',
    ctaButton: 'Actualizar Mi Perfil',

    // FAQ
    faqTitle: 'Preguntas Frecuentes',
    faqs: [
      {
        q: '¿Cómo actualizo mi perfil?',
        a: 'Inicia sesión en tu panel y ve a la pestaña Cuenta. Puedes actualizar tu foto, bio, zonas y precios cuando quieras.',
      },
      {
        q: '¿Cómo ayudan las reseñas a mi posicionamiento?',
        a: 'Más reseñas y mejores valoraciones mejoran tu visibilidad en los resultados de búsqueda. Google también muestra tu valoración directamente.',
      },
      {
        q: '¿Puedo cambiar mis zonas de servicio?',
        a: '¡Sí! Actualiza tus zonas cuando quieras desde la pestaña Cuenta. Añadir más zonas significa más reservas potenciales.',
      },
      {
        q: '¿Cuál es la mejor forma de conseguir reseñas?',
        a: 'Después de completar un trabajo, pide amablemente a los clientes satisfechos que dejen una reseña. Les enviamos un enlace directo.',
      },
    ],
    contact: '¿Preguntas? Escríbenos a hello@alicantecleaners.com',
  },
}

export default function ProfileGuide() {
  const [lang, setLang] = useState<Lang>('es')
  const [copied, setCopied] = useState(false)
  const t = translations[lang]

  const handleCopyLink = () => {
    navigator.clipboard.writeText('https://www.alicantecleaners.com/clara')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

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
              href="/dashboard/account"
              className="bg-[#1A1A1A] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#333] transition-colors"
            >
              {t.updateProfile}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-white to-[#FAFAF8] py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-[#FFF8F5] text-[#C4785A] px-3 py-1 rounded-full text-sm font-medium mb-4">
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

      {/* Why It Matters - Stats */}
      <section className="py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-bold text-[#1A1A1A] text-center mb-8">
            {t.whyTitle}
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {t.whyStats.map((item, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-[#C4785A] mb-1">
                  {item.stat}
                </div>
                <div className="text-xs md:text-sm text-[#6B6B6B]">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SEO Schema Section */}
      <section className="py-12 px-4 bg-white border-y border-[#EBEBEB]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-[#E3F2FD] text-[#1565C0] px-3 py-1 rounded-full text-sm font-medium mb-4">
              <span>🔍</span>
              <span>SEO</span>
            </div>
            <h2 className="text-2xl font-bold text-[#1A1A1A] mb-3">
              {t.seoTitle}
            </h2>
            <p className="text-[#6B6B6B]">
              {t.seoSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {t.seoItems.map((item, index) => (
              <div key={index} className="bg-[#FAFAF8] rounded-xl p-4 border border-[#EBEBEB]">
                <div className="text-2xl mb-2">{item.icon}</div>
                <h3 className="font-semibold text-[#1A1A1A] mb-1">{item.title}</h3>
                <p className="text-sm text-[#6B6B6B]">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Profile Tips with Phone Mockups */}
      <section className="py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-[#1A1A1A] text-center mb-12">
            {t.tipsTitle}
          </h2>

          <div className="space-y-16">
            {t.tips.map((tip, index) => (
              <div
                key={index}
                className={`flex flex-col ${index % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row'} gap-6 md:gap-10 items-center`}
              >
                {/* Phone mockup */}
                <div className="w-full md:w-1/2 flex justify-center">
                  <div className="relative">
                    {/* Phone frame */}
                    <div className="w-[240px] h-[480px] bg-[#1A1A1A] rounded-[36px] p-2.5 shadow-2xl">
                      <div className="w-full h-full bg-white rounded-[28px] overflow-hidden relative">
                        {/* Notch */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-[#1A1A1A] rounded-b-xl z-10" />
                        {/* Screenshot */}
                        <Image
                          src={tip.image}
                          alt={tip.title}
                          fill
                          className="object-cover object-top"
                        />
                      </div>
                    </div>
                    {/* Step number badge */}
                    <div className="absolute -top-2 -left-2 w-8 h-8 bg-[#C4785A] text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg">
                      {index + 1}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="w-full md:w-1/2 text-center md:text-left">
                  <h3 className="text-xl font-semibold text-[#1A1A1A] mb-3">
                    {tip.title}
                  </h3>
                  <p className="text-[#6B6B6B]">
                    {tip.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Share Your Profile */}
      <section className="py-12 px-4 bg-gradient-to-b from-[#FFF8F5] to-[#FAFAF8]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-[#1A1A1A] mb-3">
              {t.shareTitle}
            </h2>
            <p className="text-[#6B6B6B]">
              {t.shareSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {t.sharePlatforms.map((platform, index) => (
              <div key={index} className="bg-white rounded-xl p-4 border border-[#EBEBEB] text-center">
                <div className="text-3xl mb-2">{platform.icon}</div>
                <h3 className="font-medium text-[#1A1A1A] mb-1">{platform.name}</h3>
                <p className="text-xs text-[#6B6B6B]">{platform.tip}</p>
              </div>
            ))}
          </div>

          {/* Demo - Clara's profile preview */}
          <div className="bg-white rounded-2xl p-6 border border-[#EBEBEB] shadow-sm">
            <h3 className="font-semibold text-[#1A1A1A] text-center mb-2">
              {t.demoTitle}
            </h3>
            <p className="text-sm text-[#6B6B6B] text-center mb-6">
              {t.demoSubtitle}
            </p>

            {/* Social preview card */}
            <div className="max-w-md mx-auto mb-6">
              <div className="rounded-xl overflow-hidden border border-[#EBEBEB] shadow-sm">
                <Image
                  src="/profile-guide/04-social-preview.png"
                  alt="Social preview"
                  width={600}
                  height={315}
                  className="w-full"
                />
              </div>
            </div>

            {/* Link copy box */}
            <div className="flex items-center gap-2 max-w-md mx-auto">
              <div className="flex-1 bg-[#F5F5F3] rounded-lg px-4 py-3 text-sm text-[#6B6B6B] truncate">
                {t.demoLink}
              </div>
              <button
                onClick={handleCopyLink}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  copied
                    ? 'bg-[#E8F5E9] text-[#2E7D32]'
                    : 'bg-[#1A1A1A] text-white hover:bg-[#333]'
                }`}
              >
                {copied ? t.copied : t.copyLink}
              </button>
            </div>

            <div className="text-center mt-4">
              <Link
                href="/clara"
                className="text-[#C4785A] hover:text-[#B56A4F] text-sm font-medium"
              >
                {t.viewProfile} →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 px-4 bg-white border-t border-[#EBEBEB]">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4">
            {t.ctaTitle}
          </h2>
          <p className="text-[#6B6B6B] mb-6">
            {t.ctaText}
          </p>
          <Link
            href="/dashboard/account"
            className="inline-block bg-[#C4785A] text-white px-8 py-4 rounded-xl font-medium text-lg hover:bg-[#B56A4F] transition-colors"
          >
            {t.ctaButton}
          </Link>
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
