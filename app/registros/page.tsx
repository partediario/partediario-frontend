"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import AppLayout from "@/components/app-layout"
import InformesView from "@/components/sections/informes/informes-view"
import { useEstablishment } from "@/contexts/establishment-context"

export default function RegistrosPage() {
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
    <AppLayout activeSection="Registros">
      <InformesView establecimientoId={establecimientoSeleccionado} />
    </AppLayout>
  )
}
