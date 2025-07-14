"use client"

import { useState, useEffect } from "react"
import KpisDinamicos from "./kpis-dinamicos"

interface KpisSectionProps {
  establecimientoId?: string
}

export default function KpisSection({ establecimientoId }: KpisSectionProps) {
  const [currentEstablecimientoId, setCurrentEstablecimientoId] = useState<string | null>(establecimientoId || null)

  // Escuchar cambios de establecimiento
  useEffect(() => {
    const handleEstablishmentChange = (event: CustomEvent) => {
      console.log("🏢 Cambio de establecimiento detectado en KPIs:", event.detail.establecimientoId)
      setCurrentEstablecimientoId(event.detail.establecimientoId)
    }

    window.addEventListener("establishmentChange", handleEstablishmentChange as EventListener)

    return () => {
      window.removeEventListener("establishmentChange", handleEstablishmentChange as EventListener)
    }
  }, [])

  // Actualizar cuando cambie el prop
  useEffect(() => {
    if (establecimientoId) {
      setCurrentEstablecimientoId(establecimientoId)
    }
  }, [establecimientoId])

  return <KpisDinamicos establecimientoId={currentEstablecimientoId} />
}
