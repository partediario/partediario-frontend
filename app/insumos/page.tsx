"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import AppLayout from "@/components/app-layout"
import InsumosView from "@/components/sections/insumos/insumos-view"

export default function InsumosPage() {
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
    <AppLayout activeSection="Insumos">
      <InsumosView />
    </AppLayout>
  )
}
