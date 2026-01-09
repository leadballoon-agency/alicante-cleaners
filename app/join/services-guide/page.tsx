'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

type Lang = 'en' | 'es'

// Screenshots - same images work for both languages
const stepImages = [
  '/guides/services/services-01-profile.png',
  '/guides/services/services-02-add-modal.png',
  '/guides/services/services-03-filled-form.png',
  '/guides/services/services-03-filled-form.png',
  '/guides/services/services-04-pending.png',
]

const translations = {
  en: {
    backToJoin: 'Back to Join',
    goToDashboard: 'Go to Dashboard',
    badge: 'Team Leaders',
    title: 'How to Add Custom Services',
    subtitle: 'As a team leader, you can add custom services and add-ons to your profile. Once approved, these services become available to all your team members.',
    readyTitle: 'Ready to add services?',
    readyText: 'Go to your Profile tab and scroll down to the Services section. You can add pool cleaning, laundry, and any other services your team offers.',
    openDashboard: 'Open Dashboard',
    profileTab: 'Go to Profile tab to get started',
    faqTitle: 'Services FAQ',
    contact: 'Questions? Contact us at hello@alicantecleaners.com',
    steps: [
      {
        title: 'Go to Profile tab',
        description: 'Open your dashboard and navigate to the Profile tab. Scroll down to find the "Team Services" section below your quick stats.',
        tip: 'Only team leaders can add new services. If you don\'t see the "+" button, you may need to create a team first.',
      },
      {
        title: 'Tap "+" to create a service',
        description: 'Click the "+" button to open the service creation form. You\'ll be able to define the service name, type, and pricing.',
        tip: 'Think about what additional services your clients often ask for - pool cleaning, ironing, laundry service are popular choices.',
      },
      {
        title: 'Choose service type',
        description: 'Select whether this is a Custom Service (standalone booking) or an Add-on (extra that attaches to existing bookings like +€20 ironing).',
        tip: 'Add-ons are great for small extras like fridge cleaning or folding laundry. Custom services are for bigger jobs like pool maintenance.',
      },
      {
        title: 'Set your pricing',
        description: 'Choose hourly pricing (hours × your rate) or fixed pricing (set amount). For hourly, enter the estimated hours. For fixed, enter the total price.',
        tip: 'Hourly pricing automatically calculates based on your hourly rate, so if you change your rate, service prices update too.',
      },
      {
        title: 'Submit for approval',
        description: 'All new services require admin approval before going live. Click "Submit for Approval" and wait for review. You\'ll see "Pending" status until approved.',
        tip: 'Approval usually takes less than 24 hours. Once approved, the service appears on your public profile and is available to all team members.',
      },
    ],
    faqs: [
      {
        q: 'Who can add services?',
        a: 'Only team leaders can add custom services. Once approved, these services become available to all members of the team.',
      },
      {
        q: 'Why do services need approval?',
        a: 'We review services to ensure quality and appropriate pricing. This protects both cleaners and villa owners.',
      },
      {
        q: 'What\'s the difference between Custom and Add-on?',
        a: 'Custom services are standalone bookings (like Pool Cleaning). Add-ons are extras that can be added to any booking (like +€20 for ironing).',
      },
      {
        q: 'Can I edit a service after approval?',
        a: 'Yes, but significant changes (name, price) will require re-approval. Minor edits like description updates may not.',
      },
      {
        q: 'How is hourly pricing calculated?',
        a: 'Hourly services multiply the estimated hours by each cleaner\'s hourly rate. So a 2-hour service at €18/hour = €36.',
      },
    ],
  },
  es: {
    backToJoin: 'Volver',
    goToDashboard: 'Ir al Panel',
    badge: 'Líderes de Equipo',
    title: 'Cómo Añadir Servicios Personalizados',
    subtitle: 'Como líder de equipo, puedes añadir servicios personalizados y extras a tu perfil. Una vez aprobados, estos servicios estarán disponibles para todos los miembros de tu equipo.',
    readyTitle: '¿Lista para añadir servicios?',
    readyText: 'Ve a tu pestaña Perfil y desplázate hasta la sección de Servicios. Puedes añadir limpieza de piscina, lavandería y cualquier otro servicio que ofrezca tu equipo.',
    openDashboard: 'Abrir Panel',
    profileTab: 'Ve a la pestaña Perfil para empezar',
    faqTitle: 'Preguntas sobre Servicios',
    contact: '¿Preguntas? Escríbenos a hello@alicantecleaners.com',
    steps: [
      {
        title: 'Ve a la pestaña Perfil',
        description: 'Abre tu panel y navega a la pestaña Perfil. Desplázate hacia abajo para encontrar la sección "Servicios del Equipo" debajo de tus estadísticas rápidas.',
        tip: 'Solo los líderes de equipo pueden añadir nuevos servicios. Si no ves el botón "+", puede que necesites crear un equipo primero.',
      },
      {
        title: 'Toca "+" para crear un servicio',
        description: 'Haz clic en el botón "+" para abrir el formulario de creación de servicios. Podrás definir el nombre del servicio, tipo y precio.',
        tip: 'Piensa en qué servicios adicionales piden frecuentemente tus clientes - limpieza de piscina, planchado, lavandería son opciones populares.',
      },
      {
        title: 'Elige el tipo de servicio',
        description: 'Selecciona si es un Servicio Personalizado (reserva independiente) o un Extra (añadido a reservas existentes como +€20 planchado).',
        tip: 'Los extras son geniales para pequeños añadidos como limpiar la nevera o doblar ropa. Los servicios personalizados son para trabajos más grandes como mantenimiento de piscina.',
      },
      {
        title: 'Establece tu precio',
        description: 'Elige precio por hora (horas × tu tarifa) o precio fijo (cantidad establecida). Para por hora, introduce las horas estimadas. Para fijo, introduce el precio total.',
        tip: 'El precio por hora se calcula automáticamente basándose en tu tarifa horaria, así que si cambias tu tarifa, los precios de los servicios también se actualizan.',
      },
      {
        title: 'Enviar para aprobación',
        description: 'Todos los servicios nuevos requieren aprobación del administrador antes de publicarse. Haz clic en "Enviar para Aprobación" y espera la revisión. Verás estado "Pendiente" hasta que se apruebe.',
        tip: 'La aprobación normalmente tarda menos de 24 horas. Una vez aprobado, el servicio aparece en tu perfil público y está disponible para todos los miembros del equipo.',
      },
    ],
    faqs: [
      {
        q: '¿Quién puede añadir servicios?',
        a: 'Solo los líderes de equipo pueden añadir servicios personalizados. Una vez aprobados, estos servicios están disponibles para todos los miembros del equipo.',
      },
      {
        q: '¿Por qué necesitan aprobación los servicios?',
        a: 'Revisamos los servicios para asegurar calidad y precios apropiados. Esto protege tanto a los profesionales como a los propietarios de villas.',
      },
      {
        q: '¿Cuál es la diferencia entre Personalizado y Extra?',
        a: 'Los servicios personalizados son reservas independientes (como Limpieza de Piscina). Los extras son añadidos que se pueden agregar a cualquier reserva (como +€20 por planchado).',
      },
      {
        q: '¿Puedo editar un servicio después de aprobarlo?',
        a: 'Sí, pero cambios significativos (nombre, precio) requerirán re-aprobación. Ediciones menores como actualizaciones de descripción pueden no requerirla.',
      },
      {
        q: '¿Cómo se calcula el precio por hora?',
        a: 'Los servicios por hora multiplican las horas estimadas por la tarifa horaria de cada profesional. Así que un servicio de 2 horas a €18/hora = €36.',
      },
    ],
  },
}

export default function ServicesGuide() {
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
            <span>🛠️</span>
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

      {/* Steps with Phone Mockups */}
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
            href="/dashboard"
            className="inline-block bg-[#1A1A1A] text-white px-8 py-4 rounded-xl font-medium text-lg hover:bg-[#333] transition-colors"
          >
            {t.openDashboard}
          </Link>
          <p className="text-sm text-[#9B9B9B] mt-4">
            {t.profileTab}
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
