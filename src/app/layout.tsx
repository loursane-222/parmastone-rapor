import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Slab CRM — Bölge Satış Yönetimi',
  description: 'Porselen ve büyük format slab sektörü satış yönetim sistemi',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={inter.variable}>
      <body className="bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  )
}
