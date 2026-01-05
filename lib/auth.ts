import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import EmailProvider from 'next-auth/providers/email'
import GoogleProvider from 'next-auth/providers/google'
import { Resend } from 'resend'
import { cookies } from 'next/headers'
import { db } from './db'

// Lazy initialize Resend only when needed (avoids build-time errors if API key missing)
let resendClient: Resend | null = null
const getResend = () => {
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY || 'dummy_key_for_build')
  }
  return resendClient
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db) as NextAuthOptions['adapter'],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
    verifyRequest: '/login/verify',
    error: '/login',
  },
  providers: [
    // Magic Link for Owners
    EmailProvider({
      from: process.env.EMAIL_FROM || 'VillaCare <noreply@alicantecleaners.com>',
      sendVerificationRequest: async ({ identifier: email, url }) => {
        try {
          await getResend().emails.send({
            from: process.env.EMAIL_FROM || 'VillaCare <noreply@alicantecleaners.com>',
            to: email,
            subject: 'Sign in to VillaCare',
            html: `
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px 20px; background-color: #FAFAF8;">
                  <div style="max-width: 400px; margin: 0 auto; background: white; border-radius: 16px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                    <div style="text-align: center; margin-bottom: 24px;">
                      <div style="display: inline-block; width: 48px; height: 48px; background: linear-gradient(135deg, #C4785A, #A66347); border-radius: 12px; line-height: 48px; color: white; font-weight: bold; font-size: 20px;">V</div>
                    </div>
                    <h1 style="font-size: 24px; font-weight: 600; color: #1A1A1A; text-align: center; margin: 0 0 8px 0;">Sign in to VillaCare</h1>
                    <p style="color: #6B6B6B; text-align: center; margin: 0 0 24px 0;">Click the button below to sign in to your account.</p>
                    <a href="${url}" style="display: block; background: #1A1A1A; color: white; text-decoration: none; padding: 14px 24px; border-radius: 12px; text-align: center; font-weight: 500;">Sign In</a>
                    <p style="color: #9B9B9B; font-size: 12px; text-align: center; margin: 24px 0 0 0;">If you didn't request this email, you can safely ignore it.</p>
                  </div>
                </body>
              </html>
            `,
          })
        } catch (error) {
          console.error('Failed to send verification email:', error)
          throw new Error('Failed to send verification email')
        }
      },
    }),

    // Phone OTP for Owners
    CredentialsProvider({
      id: 'owner-phone-login',
      name: 'Owner Phone Login',
      credentials: {
        phone: { label: 'Phone', type: 'tel' },
        code: { label: 'Verification Code', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.code) {
          return null
        }

        // TODO: Verify OTP code from SMS service (Twilio, etc.)
        // For now, accept code "123456" for testing
        if (credentials.code !== '123456') {
          return null
        }

        // Find or create user
        let user = await db.user.findUnique({
          where: { phone: credentials.phone },
          include: { owner: true },
        })

        if (!user) {
          // Create new owner user
          user = await db.user.create({
            data: {
              phone: credentials.phone,
              role: 'OWNER',
              phoneVerified: new Date(),
              owner: {
                create: {
                  referralCode: generateOwnerReferralCode(),
                  trusted: false,
                },
              },
            },
            include: { owner: true },
          })
        } else if (user.role !== 'OWNER' && user.role !== 'ADMIN') {
          // Phone belongs to a cleaner, not an owner
          return null
        }

        return {
          id: user.id,
          email: user.email ?? undefined,
          name: user.name ?? undefined,
          phone: user.phone ?? undefined,
          image: user.image ?? undefined,
          role: user.role,
        }
      },
    }),

    // Phone OTP for Cleaners
    CredentialsProvider({
      id: 'cleaner-login',
      name: 'Cleaner Login',
      credentials: {
        phone: { label: 'Phone', type: 'tel' },
        code: { label: 'Verification Code', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.code) {
          return null
        }

        // TODO: Verify OTP code from SMS service (Twilio, etc.)
        // For now, accept code "123456" for testing
        if (credentials.code !== '123456') {
          return null
        }

        const user = await db.user.findUnique({
          where: { phone: credentials.phone },
          include: { cleaner: true },
        })

        if (!user || user.role !== 'CLEANER') {
          return null
        }

        return {
          id: user.id,
          email: user.email ?? undefined,
          name: user.name ?? undefined,
          phone: user.phone ?? undefined,
          image: user.image ?? undefined,
          role: user.role,
        }
      },
    }),

    // Google OAuth (for Calendar Sync - cleaners connect during onboarding)
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            authorization: {
              params: {
                scope: 'openid email profile https://www.googleapis.com/auth/calendar.readonly',
                access_type: 'offline',
                prompt: 'consent',
              },
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // For email magic link, ensure user has OWNER role and Owner profile
      if (account?.provider === 'email' && user.id) {
        const dbUser = await db.user.findUnique({
          where: { id: user.id },
          include: { owner: true },
        })

        if (dbUser) {
          // Set role to OWNER if not already set (for new users via magic link)
          if (!dbUser.role) {
            await db.user.update({
              where: { id: user.id },
              data: { role: 'OWNER' },
            })
          }

          // Create Owner profile if doesn't exist
          if (!dbUser.owner && dbUser.role !== 'ADMIN' && dbUser.role !== 'CLEANER') {
            const referralCode = generateReferralCode(dbUser.name || dbUser.email || 'USER')
            await db.owner.create({
              data: {
                userId: user.id,
                referralCode,
                trusted: false,
              },
            })
          }
        }
      }

      // For Google OAuth (calendar linking), store tokens in Account table
      // The PrismaAdapter handles this automatically, but we need to update
      // the cleaner's googleCalendarConnected status
      if (account?.provider === 'google' && user.id) {
        // Find the cleaner associated with this user
        const cleaner = await db.cleaner.findUnique({
          where: { userId: user.id },
        })

        if (cleaner && account.access_token) {
          // Mark the cleaner as having connected their Google Calendar
          await db.cleaner.update({
            where: { id: cleaner.id },
            data: {
              googleCalendarConnected: true,
              googleCalendarSyncedAt: new Date(),
            },
          })
        }
      }

      return true
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id
        // Fetch role from database for magic link users
        const dbUser = await db.user.findUnique({
          where: { id: user.id },
          select: { role: true },
        })
        token.role = dbUser?.role || 'OWNER'
      }
      // Refresh role on session update
      if (trigger === 'update' && token.id) {
        const dbUser = await db.user.findUnique({
          where: { id: token.id as string },
          select: { role: true },
        })
        token.role = dbUser?.role || token.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }

      // Check for impersonation
      try {
        const cookieStore = await cookies()
        const impersonatingUserId = cookieStore.get('impersonating_user_id')?.value
        const adminUserId = cookieStore.get('admin_user_id')?.value

        if (impersonatingUserId && adminUserId && session.user) {
          // Verify the admin is still valid
          const admin = await db.user.findUnique({
            where: { id: adminUserId },
            select: { role: true },
          })

          if (admin?.role === 'ADMIN') {
            // Get the impersonated user's info
            const impersonatedUser = await db.user.findUnique({
              where: { id: impersonatingUserId },
              select: { id: true, name: true, email: true, image: true, role: true },
            })

            if (impersonatedUser) {
              session.user.id = impersonatedUser.id
              session.user.name = impersonatedUser.name
              session.user.email = impersonatedUser.email
              session.user.image = impersonatedUser.image
              session.user.role = impersonatedUser.role || 'CLEANER'
              session.user.isImpersonating = true
              session.user.adminId = adminUserId
            }
          }
        }
      } catch {
        // Cookies not available in this context, continue normally
      }

      return session
    },
  },
}

function generateReferralCode(name: string): string {
  const cleanName = name.split(' ')[0].toUpperCase().slice(0, 4).replace(/[^A-Z]/g, 'X')
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `${cleanName}${year}${random}`
}

function generateOwnerReferralCode(): string {
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `OWN${year}${random}`
}
