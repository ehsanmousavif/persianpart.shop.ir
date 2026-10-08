import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'PersianPart API Service (oRPC v2)',
  description: 'Typesafe API service for PersianPart 2.0 automotive platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fa" dir="rtl">
      <body style={{ margin: 0, background: '#ffffff', color: '#0f172a' }}>
        {children}
      </body>
    </html>
  )
}
