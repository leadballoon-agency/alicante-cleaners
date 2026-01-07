import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/providers";
import FeedbackWidget from "@/components/feedback-widget";
import ImpersonationBanner from "@/components/impersonation-banner";
import { SchemaScript } from "@/components/seo/schema-script";
import { generateOrganizationSchema, generateWebSiteSchema } from "@/lib/seo/schema";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "VillaCare | Trusted Villa Cleaning in Alicante",
  description: "Your villa, ready when you are. Vetted cleaners, photo proof, auto-translation. No passwords, no apps, no hassle.",
  metadataBase: new URL("https://alicantecleaners.com"),
  openGraph: {
    title: "VillaCare | Trusted Villa Cleaning in Alicante",
    description: "Your villa, ready when you are. Vetted cleaners, photo proof, auto-translation. No passwords, no apps, no hassle.",
    url: "https://alicantecleaners.com",
    siteName: "VillaCare",
    images: [
      {
        url: "/api/og",
        width: 1200,
        height: 630,
        alt: "VillaCare - Trusted Villa Cleaning in Alicante",
      },
    ],
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VillaCare | Trusted Villa Cleaning in Alicante",
    description: "Your villa, ready when you are. Vetted cleaners, photo proof, auto-translation.",
    images: ["/api/og"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <SchemaScript schema={[generateOrganizationSchema(), generateWebSiteSchema()]} />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          <ImpersonationBanner />
          {children}
          <FeedbackWidget />
        </Providers>
      </body>
    </html>
  );
}
