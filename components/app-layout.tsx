"use client"

import type React from "react"
import { Menu } from "lucide-react"
import { Button } from "./ui/button"
import Sidebar from "./sidebar"
import { useMobileSidebar } from "@/hooks/use-mobile-sidebar"

interface AppLayoutProps {
  children: React.ReactNode
  activeSection: string
}

export default function AppLayout({ children, activeSection }: AppLayoutProps) {
  const { isOpen, open, close } = useMobileSidebar()

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Hamburger button - visible only on mobile */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden bg-white shadow-md hover:bg-gray-100"
        onClick={open}
        aria-label="Abrir menú"
      >
        <Menu className="h-6 w-6" />
      </Button>

      <Sidebar activeSection={activeSection} isOpen={isOpen} onClose={close} />
      
      {/* Main content with responsive margin and mobile top offset */}
      <main className="flex-1 w-full pt-16 md:pt-0 md:ml-64">{children}</main>
    </div>
  )
}
