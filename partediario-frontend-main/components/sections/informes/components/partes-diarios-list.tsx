"use client"

import { useEffect, useState } from "react"
import RegistrosList from "./registros-list"

interface PartesDiariosListProps {
  establecimientoId?: string
}

export default function PartesDiariosList({ establecimientoId }: PartesDiariosListProps) {
  // Estado para almacenar el ID del establecimiento seleccionado en el sidebar
  const [selectedEstablecimientoId, setSelectedEstablecimientoId] = useState<string | undefined>(establecimientoId)

  // Escuchar cambios en el establecimiento seleccionado
  useEffect(() => {
    // Función para escuchar eventos del sidebar
    const handleEstablishmentChange = (event: CustomEvent) => {
      setSelectedEstablecimientoId(event.detail.establecimientoId)
    }

    // Registrar el listener para el evento personalizado
    window.addEventListener("establishmentChange" as any, handleEstablishmentChange as EventListener)

    // Limpiar el listener cuando el componente se desmonte
    return () => {
      window.removeEventListener("establishmentChange" as any, handleEstablishmentChange as EventListener)
    }
  }, [])

  return <RegistrosList establecimientoId={selectedEstablecimientoId} />
}
