import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../styles/globals.scss'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'KRD System - Sistema PDV Completo',
  description: 'Sistema PDV completo com controle de estoque, emissão de NFe/NFCe, portal na nuvem e muito mais. 6 anos de experiência, centenas de clientes satisfeitos.',
  keywords: 'PDV, sistema, estoque, NFe, NFCe, controle, vendas, gestão',
  authors: [{ name: 'KRD System' }],
  openGraph: {
    title: 'KRD System - Sistema PDV Completo',
    description: 'Sistema PDV completo com controle de estoque, emissão de NFe/NFCe, portal na nuvem e muito mais.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>{children}</body>
    </html>
  )
}