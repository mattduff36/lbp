import './globals.css'
import type { Metadata } from 'next'
import { Great_Vibes, Marcellus, Montserrat } from 'next/font/google'
import ClientLayout from './components/ClientLayout'
import Providers from './providers'
import { Analytics } from "@vercel/analytics/react"
import Navbar from './components/layout/Navbar'

const greatVibes = Great_Vibes({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-great-vibes',
  display: 'swap',
})

const marcellus = Marcellus({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-marcellus',
  display: 'swap',
})

const montserrat = Montserrat({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Lee Barrowcliff Photography | Professional Photographer in East Midlands',
  description: 'Professional photography services in the East Midlands. Specializing in weddings, portraits, lifestyle, landscape, animals, and sports photography. Capturing life\'s precious moments with a natural, documentary style.',
  keywords: 'photography, wedding photographer, portrait photographer, East Midlands, professional photographer, lifestyle photography, landscape photography, sports photography, animal photography',
  authors: [{ name: 'Lee Barrowcliff' }],
  creator: 'Lee Barrowcliff',
  publisher: 'Lee Barrowcliff Photography',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://leebarrowcliffphotography.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Lee Barrowcliff Photography | Professional Photographer in East Midlands',
    description: 'Professional photography services in the East Midlands. Specializing in weddings, portraits, lifestyle, landscape, animals, and sports photography.',
    url: 'https://leebarrowcliffphotography.com',
    siteName: 'Lee Barrowcliff Photography',
    locale: 'en_GB',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${greatVibes.variable} ${marcellus.variable} ${montserrat.variable}`}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/png" href="/favicon.png" />
      </head>
      <body className="bg-off-white min-h-screen flex flex-col">
        <Providers>
          <Navbar key="navbar" />
          <ClientLayout key="client-layout">{children}</ClientLayout>
        </Providers>
        <Analytics />
      </body>
    </html>
  )
} 