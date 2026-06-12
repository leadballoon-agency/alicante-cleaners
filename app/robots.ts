import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/api/',
          '/dashboard',
          '/owner/',
          '/onboard/',
          '/onboarding/',
          '/login',
          '/signout',
        ],
      },
    ],
    sitemap: 'https://www.alicantecleaners.com/sitemap.xml',
  }
}
