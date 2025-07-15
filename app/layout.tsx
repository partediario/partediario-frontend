import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { UserProvider } from "@/contexts/user-context"
import { EstablishmentProvider } from "@/contexts/establishment-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Parte Diario PRO",
  description: "Sistema de gestión ganadera",
  generator: "v0.dev",
  icons: {
    icon: [
      {
        url: "/favicon.svg",
        type: "image/svg+xml",
      },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className={inter.className}>
        <UserProvider>
          <EstablishmentProvider>
            <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
              {children}
              <Toaster />
            </ThemeProvider>
          </EstablishmentProvider>
        </UserProvider>
      </body>
    </html>
  )
}
