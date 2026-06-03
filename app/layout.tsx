import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Vigilante Ciudadano // Bolivia',
  description: 'Sistema descentralizado de auditoría policial, seguridad ciudadana y reporte anónimo zero-knowledge.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="antialiased min-h-screen bg-[#0a0a0a] text-slate-100">
        {children}
      </body>
    </html>
  )
}
