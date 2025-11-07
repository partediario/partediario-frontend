import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { UserProvider } from "@/contexts/user-context"
import { EstablishmentProvider } from "@/contexts/establishment-context"
import { ConfigNavigationProvider } from "@/contexts/config-navigation-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Parte Diario PRO",
  description: "Sistema de gestión ganadera",
  generator: "v0.dev",
  icons: {
    icon: [
      {
        url: "/favicon.png",
        type: "image/png",
        sizes: "32x32",
      },
      {
        url: "/icon-192.png",
        type: "image/png",
        sizes: "192x192",
      },
      {
        url: "/icon-512.png",
        type: "image/png",
        sizes: "512x512",
      },
    ],
    apple: [
      {
        url: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
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
      <body className={inter.className}>
        <UserProvider>
          <EstablishmentProvider>
            <ConfigNavigationProvider>
              <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
                {children}
                <Toaster />
              </ThemeProvider>
            </ConfigNavigationProvider>
          </EstablishmentProvider>
        </UserProvider>
      </body>
    </html>
  )
}
