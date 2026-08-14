import React from "react"
import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import { MotionProvider } from '@/components/providers/motion-provider'
import { BrandingHead } from '@/components/branding-head'
import './globals.css'

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  icons: { icon: '/icon.svg', apple: '/icon.svg' },
  title: 'Quality Home Group | A Higher Quality of Living',
  description: 'Quality Home Group - Leading architectural and construction company offering premium apartments, villas, townhouses, and commercial properties. Discover a place you\'ll love to live.',
  keywords: ['construction', 'real estate', 'apartments', 'villas', 'commercial', 'property', 'Quality Home Group'],
  openGraph: {
    title: 'Quality Home Group | A Higher Quality of Living',
    description: 'Leading architectural and construction company offering premium apartments, villas, townhouses, and commercial properties.',
    type: 'website',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#1e3a5f',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${plusJakartaSans.variable} font-sans antialiased`}>
        <BrandingHead />
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  )
}
