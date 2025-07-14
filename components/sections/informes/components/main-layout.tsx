"use client"

import type React from "react"
import DashboardHeader from "./dashboard-header"
import KpiSection from "./kpi-section"
import RegistrosHeader from "./registros-header"

interface MainLayoutProps {
  children: React.ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex flex-col h-full bg-gray-50">
      <DashboardHeader />
      <KpiSection />
      <div className="flex-1 p-4 overflow-auto">
        <RegistrosHeader />
        {children}
      </div>
    </div>
  )
}
