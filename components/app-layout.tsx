"use client"

import type React from "react"

import Sidebar from "./sidebar"

interface AppLayoutProps {
  children: React.ReactNode
  activeSection: string
}

export default function AppLayout({ children, activeSection }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar activeSection={activeSection} />
      <main className="flex-1 ml-64">{children}</main>
    </div>
  )
}
