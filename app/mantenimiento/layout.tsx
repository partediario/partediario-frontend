import type React from "react"
export default function MantenimientoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <title>Sistema en Mantenimiento - Parte Diario PRO</title>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body>{children}</body>
    </html>
  )
}
