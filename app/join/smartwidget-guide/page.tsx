'use client'

import { useState } from 'react'
import Link from 'next/link'

type Lang = 'en' | 'es'

const translations = {
  en: {
    backToJoin: 'Back to Join',
    goToDashboard: 'Go to Dashboard',
    badge: 'Dashboard Navigation',
    title: 'How to Use the SmartWidget',
    subtitle: 'The floating button in the bottom-right corner of your dashboard gives you quick access to everything. Tap for shortcuts, hold for the full menu.',
    readyTitle: 'Ready to try it?',
    readyText: 'Open your dashboard and try tapping or holding the floating button in the bottom-right corner.',
    openDashboard: 'Open Dashboard',
    dashboardTip: 'Look for the terracotta circle in the bottom-right',
    faqTitle: 'SmartWidget FAQ',
    contact: 'Questions? Contact us at hello@alicantecleaners.com',
    steps: [
      {
        icon: '🔵',
        title: 'The floating button',
        description: 'The SmartWidget is the terracotta circle that floats in the bottom-right corner of every dashboard screen. It shows an icon matching your current tab - a calendar on Home, a clipboard on Bookings, and so on.',
        tip: 'The button gently pulses so you never lose it. If you have unread messages or pending items, a red badge appears on top.',
      },
      {
        icon: '👆',
        title: 'Tap for quick actions',
        description: 'A quick tap opens a small popup with 2-3 shortcuts relevant to the screen you\'re on. On Home, you\'ll see Week View, Day View, and Profile. On Bookings, you\'ll see Home and Promote. Each screen has its own set of shortcuts.',
        tip: 'Quick actions change depending on which tab you\'re viewing - they always show the most useful options for where you are.',
      },
      {
        icon: '✊',
        title: 'Long press for full menu',
        description: 'Hold the button for about half a second. A full-screen menu slides up from the bottom showing all your dashboard tabs, plus Settings, Support, Guide, and Feedback at the bottom.',
        tip: 'You can swipe the menu down to close it, or tap anywhere outside.',
      },
      {
        icon: '🧭',
        title: 'Navigate between tabs',
        description: 'The full menu shows all 7 dashboard tabs: Home (calendar), Bookings, Success Coach, Promote, Messages, Team, and Profile. The current tab is highlighted in terracotta. Tap any tab to switch.',
        tip: 'Your current tab has a terracotta dot next to it so you always know where you are.',
      },
      {
        icon: '🔴',
        title: 'Notification badges',
        description: 'When you have unread messages, pending team requests, or new bookings, a red badge with a number appears on the SmartWidget. The number shows the total count of items needing your attention.',
        tip: 'Badges also appear next to individual tabs in the full menu, so you can see exactly which tab has pending items.',
      },
    ],
    faqs: [
      {
        q: 'How do I edit my profile?',
        a: 'Tap the SmartWidget on the Home screen and select "Profile" from the quick actions. Or long press and tap "Profile" in the full menu.',
      },
      {
        q: 'How do I access messages?',
        a: 'Long press the SmartWidget to open the full menu, then tap "Messages". If you have unread messages, you\'ll see a red badge with the count.',
      },
      {
        q: 'What do the badges mean?',
        a: 'Red badges show unread messages. Orange badges show pending team requests. Blue badges show new bookings that need your response. The number on the SmartWidget is the total of all pending items.',
      },
      {
        q: 'Why do I see different options when I tap?',
        a: 'The SmartWidget is context-aware - it shows quick actions relevant to the screen you\'re currently on. This means you always get the most useful shortcuts without scrolling through a long list.',
      },
    ],
  },
  es: {
    backToJoin: 'Volver',
    goToDashboard: 'Ir al Panel',
    badge: 'Navegacion del Panel',
    title: 'Como Usar el SmartWidget',
    subtitle: 'El boton flotante en la esquina inferior derecha de tu panel te da acceso rapido a todo. Toca para atajos, manten pulsado para el menu completo.',
    readyTitle: 'Lista para probarlo?',
    readyText: 'Abre tu panel e intenta tocar o mantener pulsado el boton flotante en la esquina inferior derecha.',
    openDashboard: 'Abrir Panel',
    dashboardTip: 'Busca el circulo terracota en la esquina inferior derecha',
    faqTitle: 'Preguntas sobre SmartWidget',
    contact: 'Preguntas? Escribenos a hello@alicantecleaners.com',
    steps: [
      {
        icon: '🔵',
        title: 'El boton flotante',
        description: 'El SmartWidget es el circulo terracota que flota en la esquina inferior derecha de cada pantalla del panel. Muestra un icono que coincide con tu pestana actual - un calendario en Inicio, un portapapeles en Reservas, y asi sucesivamente.',
        tip: 'El boton pulsa suavemente para que nunca lo pierdas. Si tienes mensajes sin leer o elementos pendientes, aparece una insignia roja encima.',
      },
      {
        icon: '👆',
        title: 'Toca para acciones rapidas',
        description: 'Un toque rapido abre un menu pequeno con 2-3 atajos relevantes para la pantalla en la que estas. En Inicio, veras Vista Semanal, Vista Diaria y Perfil. En Reservas, veras Inicio y Promocionar. Cada pantalla tiene sus propios atajos.',
        tip: 'Las acciones rapidas cambian segun la pestana que estes viendo - siempre muestran las opciones mas utiles para donde estas.',
      },
      {
        icon: '✊',
        title: 'Manten pulsado para menu completo',
        description: 'Manten pulsado el boton durante medio segundo. Un menu de pantalla completa se desliza desde abajo mostrando todas las pestanas del panel, ademas de Ajustes, Soporte, Guia y Comentarios en la parte inferior.',
        tip: 'Puedes deslizar el menu hacia abajo para cerrarlo, o tocar en cualquier lugar fuera del menu.',
      },
      {
        icon: '🧭',
        title: 'Navega entre pestanas',
        description: 'El menu completo muestra las 7 pestanas del panel: Inicio (calendario), Reservas, Coach de Exito, Promocionar, Mensajes, Equipo y Perfil. La pestana actual esta resaltada en terracota. Toca cualquier pestana para cambiar.',
        tip: 'Tu pestana actual tiene un punto terracota a su lado para que siempre sepas donde estas.',
      },
      {
        icon: '🔴',
        title: 'Insignias de notificacion',
        description: 'Cuando tienes mensajes sin leer, solicitudes de equipo pendientes o nuevas reservas, aparece una insignia roja con un numero en el SmartWidget. El numero muestra el total de elementos que necesitan tu atencion.',
        tip: 'Las insignias tambien aparecen junto a las pestanas individuales en el menu completo, para que puedas ver exactamente que pestana tiene elementos pendientes.',
      },
    ],
    faqs: [
      {
        q: 'Como edito mi perfil?',
        a: 'Toca el SmartWidget en la pantalla de Inicio y selecciona "Perfil" de las acciones rapidas. O manten pulsado y toca "Perfil" en el menu completo.',
      },
      {
        q: 'Como accedo a los mensajes?',
        a: 'Manten pulsado el SmartWidget para abrir el menu completo, luego toca "Mensajes". Si tienes mensajes sin leer, veras una insignia roja con la cuenta.',
      },
      {
        q: 'Que significan las insignias?',
        a: 'Las insignias rojas muestran mensajes sin leer. Las naranjas muestran solicitudes de equipo pendientes. Las azules muestran nuevas reservas que necesitan tu respuesta. El numero en el SmartWidget es el total de todos los elementos pendientes.',
      },
      {
        q: 'Por que veo opciones diferentes al tocar?',
        a: 'El SmartWidget es consciente del contexto - muestra acciones rapidas relevantes para la pantalla en la que estas. Esto significa que siempre obtienes los atajos mas utiles sin desplazarte por una lista larga.',
      },
    ],
  },
}

export default function SmartWidgetGuide() {
  const [lang, setLang] = useState<Lang>('es')
  const t = translations[lang]

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Header */}
      <header className="bg-white border-b border-[#EBEBEB] sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/join" className="flex items-center gap-2 text-[#6B6B6B] hover:text-[#1A1A1A]">
            <span>&larr;</span>
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
          <div className="inline-flex items-center gap-2 bg-[#FFF8E1] text-[#F57C00] px-3 py-1 rounded-full text-sm font-medium mb-4">
            <span>📱</span>
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
              {/* Icon illustration */}
              <div className="w-full md:w-1/2 flex justify-center">
                <div className="relative">
                  <div className="w-[200px] h-[200px] bg-white rounded-3xl border border-[#EBEBEB] shadow-lg flex items-center justify-center">
                    <span className="text-7xl">{step.icon}</span>
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
                  <span className="text-[#9B9B9B] group-open:rotate-180 transition-transform">&#9660;</span>
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
