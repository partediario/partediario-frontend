import { useEstablishment } from "@/contexts/establishment-context"

export function useCurrentEstablishment() {
  const { empresaSeleccionada, establecimientoSeleccionado, loading } = useEstablishment()

  return {
    empresa: empresaSeleccionada,
    establecimiento: establecimientoSeleccionado,
    loading,
    hasEstablishment: !!establecimientoSeleccionado,
  }
}
