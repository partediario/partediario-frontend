"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import AppLayout from "@/components/app-layout"
import MovimientosView from "@/components/sections/movimientos/movimientos-view"
import { useEstablishment } from "@/contexts/establishment-context"

export default function MovimientosPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { establecimientoSeleccionado } = useEstablishment()

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
    <AppLayout activeSection="Movimientos">
      <MovimientosView establecimientoId={establecimientoSeleccionado} />
    </AppLayout>
  )
}
