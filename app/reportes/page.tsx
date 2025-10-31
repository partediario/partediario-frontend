"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import AppLayout from "@/components/app-layout"
import ReportesView from "@/components/sections/reportes/reportes-view"

export default function ReportesPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("supabase_token")

    if (!token) {
      router.push("/login")
    } else {
      setIsAuthenticated(true)
    }

    setIsLoading(false)
  }, [router])

  if (isLoading || !isAuthenticated) {
    return null
  }

  return (
    <AppLayout activeSection="Reportes">
      <ReportesView />
    </AppLayout>
  )
}
