export const metadata = {
  title: 'Davenport Closet',
  description: 'Internal wardrobe collection manager',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: '#0a0a0c' }}>{children}</body>
    </html>
  )
}
