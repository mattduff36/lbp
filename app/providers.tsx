'use client'

import { ReactNode } from 'react'
import { AnimatePresence } from 'framer-motion'

interface ProvidersProps {
  children: ReactNode
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      {children}
    </AnimatePresence>
  )
} 