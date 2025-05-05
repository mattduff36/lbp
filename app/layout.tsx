import './globals.css'
import type { Metadata } from 'next'
import { Great_Vibes, Marcellus, Montserrat } from 'next/font/google'
import ClientLayout from './components/ClientLayout'
import Providers from './providers'

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
  title: 'Lee Barrowcliff Photography',
  description: 'Professional photography portfolio showcasing Lee Barrowcliff&apos;s work',
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
      </head>
      <body className="bg-off-white min-h-screen">
        <Providers>
          <ClientLayout>{children}</ClientLayout>
        </Providers>
      </body>
    </html>
  )
} 