import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/providers";
import FeedbackWidget from "@/components/feedback-widget";
import { SchemaScript } from "@/components/seo/schema-script";
import { generateOrganizationSchema, generateWebSiteSchema } from "@/lib/seo/schema";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "VillaCare | Trusted Villa Cleaning in Alicante",
  description: "Your villa, ready when you arrive. Trusted cleaners for villa owners in Alicante, Spain.",
  metadataBase: new URL("https://alicantecleaners.com"),
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
          {children}
          <FeedbackWidget />
        </Providers>
      </body>
    </html>
  );
}
