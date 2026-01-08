'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'

type ScriptSettings = {
  googleTagManagerId?: string
  facebookPixelId?: string
  googleAnalyticsId?: string
  convertBoxScriptId?: string
  customHeadScripts?: { id: string; src?: string; content?: string }[]
  customBodyScripts?: { id: string; src?: string; content?: string }[]
}

export function ScriptLoader() {
  const [settings, setSettings] = useState<ScriptSettings | null>(null)

  useEffect(() => {
    async function fetchScripts() {
      try {
        const res = await fetch('/api/scripts')
        if (res.ok) {
          const data = await res.json()
          setSettings(data)
        }
      } catch (error) {
        console.debug('Failed to load scripts:', error)
      }
    }
    fetchScripts()
  }, [])

  if (!settings) return null

  return (
    <>
      {/* Google Tag Manager - RECOMMENDED (manages all other tags) */}
      {settings.googleTagManagerId && (
        <>
          <Script
            id="gtm"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                })(window,document,'script','dataLayer','${settings.googleTagManagerId}');
              `,
            }}
          />
        </>
      )}

      {/* Facebook Pixel (only if not using GTM) */}
      {settings.facebookPixelId && !settings.googleTagManagerId && (
        <>
          <Script
            id="fb-pixel"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${settings.facebookPixelId}');
                fbq('track', 'PageView');
              `,
            }}
          />
          <noscript>
            <img
              height="1"
              width="1"
              style={{ display: 'none' }}
              src={`https://www.facebook.com/tr?id=${settings.facebookPixelId}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        </>
      )}

      {/* Google Analytics 4 (only if not using GTM) */}
      {settings.googleAnalyticsId && !settings.googleTagManagerId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${settings.googleAnalyticsId}`}
            strategy="afterInteractive"
          />
          <Script
            id="ga4"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${settings.googleAnalyticsId}');
              `,
            }}
          />
        </>
      )}

      {/* ConvertBox */}
      {settings.convertBoxScriptId && (
        <Script
          id="convertbox"
          src={`https://cdn.convertbox.com/convertbox/js/embed.js`}
          data-uuid={settings.convertBoxScriptId}
          strategy="afterInteractive"
        />
      )}

      {/* Custom Head Scripts */}
      {settings.customHeadScripts?.map((script) => (
        <Script
          key={script.id}
          id={script.id}
          src={script.src}
          strategy="afterInteractive"
          dangerouslySetInnerHTML={
            script.content ? { __html: script.content } : undefined
          }
        />
      ))}

      {/* Custom Body Scripts */}
      {settings.customBodyScripts?.map((script) => (
        <Script
          key={script.id}
          id={script.id}
          src={script.src}
          strategy="lazyOnload"
          dangerouslySetInnerHTML={
            script.content ? { __html: script.content } : undefined
          }
        />
      ))}
    </>
  )
}
