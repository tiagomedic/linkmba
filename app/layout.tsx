import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MBA LINK T3',
  description: 'Assistente IA do MBA LINK T3',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-gray-950 text-white antialiased">{children}</body>
    </html>
  )
}
