'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

type Lang = 'en' | 'es'

const translations = {
  en: {
    backToJoin: 'Back to Join',
    startNow: 'Start Now',
    badge: 'Takes 2 minutes',
    title: 'How to Join VillaCare',
    subtitle: 'Follow these simple steps to create your profile and start receiving booking requests from villa owners in Alicante.',
    readyTitle: 'Ready to get started?',
    readyText: "Join hundreds of cleaners already earning with VillaCare. It's free to join and takes just 2 minutes.",
    createProfile: 'Create My Profile',
    noFees: 'No fees · No commitment · Cancel anytime',
    faqTitle: 'Common Questions',
    contact: 'Questions? Contact us at hello@alicantecleaners.com',
    steps: [
      {
        title: 'Enter your phone number',
        description: 'We use your phone for verification and so villa owners can contact you about bookings. Your number stays private until you accept a job.',
        tip: 'Use the phone number you check regularly - this is how you\'ll receive booking requests!',
      },
      {
        title: 'Verify with SMS code',
        description: 'We\'ll send a 6-digit code to your phone. Enter it to verify your number. This keeps your account secure.',
        tip: 'Code not arriving? Check your SMS inbox or tap "Resend" after 30 seconds.',
      },
      {
        title: 'Add your name and photo',
        description: 'Tell villa owners who you are! Add your name, a professional photo, and a short bio about your experience.',
        tip: 'A friendly photo and short bio help you get more bookings. Owners love to know who\'s coming to their villa!',
      },
      {
        title: 'Select your service areas',
        description: 'Choose the areas in Alicante where you\'re available to work. You can select multiple areas to maximize your opportunities.',
        tip: 'Popular areas like San Juan and El Campello have high demand. Select all areas you can realistically travel to.',
      },
      {
        title: 'Set your hourly rate',
        description: 'Choose how much you charge per hour. We\'ll automatically calculate prices for Regular Clean (3h), Deep Clean (5h), and Arrival Prep (4h).',
        tip: 'Most cleaners in Alicante charge €15-20/hour. You can adjust your rate anytime from your dashboard.',
      },
      {
        title: 'Connect your calendar',
        description: 'Link your Google Calendar so we know when you\'re busy. We\'ll automatically block those times - no double bookings!',
        tip: 'This is optional but highly recommended. You can also skip and connect later from your dashboard.',
      },
      {
        title: 'You\'re all set!',
        description: 'Your booking page is now live! Share your personal link with villa owners or let them find you through the VillaCare directory.',
        tip: 'Share your link on WhatsApp, Facebook, or with property managers you already work with.',
      },
    ],
    faqs: [
      {
        q: 'How long does signup take?',
        a: 'Most cleaners complete signup in under 2 minutes. You just need your phone, a photo, and to choose your areas and rates.',
      },
      {
        q: 'Is there a fee to join?',
        a: 'No! VillaCare is completely free for cleaners. We make money from villa owners, not from you.',
      },
      {
        q: 'How do I receive bookings?',
        a: 'When a villa owner books you, you\'ll get a WhatsApp message with all the details. Simply reply "ACCEPT" or "DECLINE" - it\'s that easy!',
      },
      {
        q: 'Can I set my own prices?',
        a: 'Yes! You choose your hourly rate and we calculate service prices automatically. You keep 100% of what you earn.',
      },
    ],
  },
  es: {
    backToJoin: 'Volver',
    startNow: 'Empezar',
    badge: 'Solo 2 minutos',
    title: 'Cómo unirse a VillaCare',
    subtitle: 'Sigue estos sencillos pasos para crear tu perfil y empezar a recibir solicitudes de reserva de propietarios de villas en Alicante.',
    readyTitle: '¿Lista para empezar?',
    readyText: 'Únete a cientos de profesionales de limpieza que ya ganan con VillaCare. Es gratis unirse y solo toma 2 minutos.',
    createProfile: 'Crear mi perfil',
    noFees: 'Sin comisiones · Sin compromiso · Cancela cuando quieras',
    faqTitle: 'Preguntas frecuentes',
    contact: '¿Preguntas? Escríbenos a hello@alicantecleaners.com',
    steps: [
      {
        title: 'Introduce tu número de teléfono',
        description: 'Usamos tu teléfono para verificación y para que los propietarios puedan contactarte sobre reservas. Tu número permanece privado hasta que aceptes un trabajo.',
        tip: 'Usa el número de teléfono que revisas regularmente - ¡así recibirás las solicitudes de reserva!',
      },
      {
        title: 'Verifica con código SMS',
        description: 'Te enviaremos un código de 6 dígitos a tu teléfono. Introdúcelo para verificar tu número. Esto mantiene tu cuenta segura.',
        tip: '¿No llega el código? Revisa tu bandeja de SMS o pulsa "Reenviar" después de 30 segundos.',
      },
      {
        title: 'Añade tu nombre y foto',
        description: '¡Cuéntale a los propietarios quién eres! Añade tu nombre, una foto profesional y una breve descripción sobre tu experiencia.',
        tip: 'Una foto amigable y una breve descripción te ayudan a conseguir más reservas. ¡A los propietarios les gusta saber quién viene a su villa!',
      },
      {
        title: 'Selecciona tus zonas de servicio',
        description: 'Elige las zonas de Alicante donde estás disponible para trabajar. Puedes seleccionar varias zonas para maximizar tus oportunidades.',
        tip: 'Zonas populares como San Juan y El Campello tienen alta demanda. Selecciona todas las zonas a las que puedas desplazarte.',
      },
      {
        title: 'Establece tu tarifa por hora',
        description: 'Elige cuánto cobras por hora. Calcularemos automáticamente los precios para Limpieza Regular (3h), Limpieza Profunda (5h) y Preparación de Llegada (4h).',
        tip: 'La mayoría de profesionales en Alicante cobran €15-20/hora. Puedes ajustar tu tarifa en cualquier momento desde tu panel.',
      },
      {
        title: 'Conecta tu calendario',
        description: 'Vincula tu Google Calendar para que sepamos cuándo estás ocupada. ¡Bloquearemos automáticamente esos horarios - sin reservas dobles!',
        tip: 'Esto es opcional pero muy recomendable. También puedes saltarlo y conectarlo más tarde desde tu panel.',
      },
      {
        title: '¡Todo listo!',
        description: '¡Tu página de reservas ya está activa! Comparte tu enlace personal con propietarios de villas o deja que te encuentren en el directorio de VillaCare.',
        tip: 'Comparte tu enlace en WhatsApp, Facebook o con administradores de propiedades con los que ya trabajes.',
      },
    ],
    faqs: [
      {
        q: '¿Cuánto tiempo tarda el registro?',
        a: 'La mayoría completa el registro en menos de 2 minutos. Solo necesitas tu teléfono, una foto y elegir tus zonas y tarifas.',
      },
      {
        q: '¿Hay alguna cuota para unirse?',
        a: '¡No! VillaCare es completamente gratis para profesionales de limpieza. Ganamos dinero de los propietarios, no de ti.',
      },
      {
        q: '¿Cómo recibo las reservas?',
        a: 'Cuando un propietario te reserve, recibirás un mensaje de WhatsApp con todos los detalles. Simplemente responde "ACEPTAR" o "RECHAZAR" - ¡así de fácil!',
      },
      {
        q: '¿Puedo establecer mis propios precios?',
        a: 'Sí! Tú eliges tu tarifa por hora y calculamos los precios de los servicios automáticamente. Te quedas con el 100% de lo que ganas.',
      },
    ],
  },
}

const stepImages = [
  '/onboarding/02-phone-entry.png',
  '/onboarding/03-verify-code.png',
  '/onboarding/04-name-photo.png',
  '/onboarding/05-service-areas.png',
  '/onboarding/06-pricing.png',
  '/onboarding/08-calendar-sync.png',
  '/onboarding/09-success.png',
]

export default function OnboardingGuide() {
  const [lang, setLang] = useState<Lang>('es')
  const t = translations[lang]

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
              href="/onboarding/cleaner"
              className="bg-[#1A1A1A] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#333] transition-colors"
            >
              {t.startNow}
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
            href="/onboarding/cleaner"
            className="inline-block bg-[#1A1A1A] text-white px-8 py-4 rounded-xl font-medium text-lg hover:bg-[#333] transition-colors"
          >
            {t.createProfile}
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
