import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SEO Automation Dashboard',
  description: 'Real-time SEO metrics & alerts',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <nav style={{ background: '#1a1a1a', color: 'white', padding: '1rem' }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>🔍 SEO Dashboard</h1>
        </nav>
        {children}
      </body>
    </html>
  )
}
