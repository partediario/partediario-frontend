"use client"

import { useState, useEffect } from "react"
import { X, AlertCircle } from "lucide-react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CustomDatePicker } from "@/components/ui/custom-date-picker"
import { useUser } from "@/contexts/user-context"
import { toast } from "sonner"
import { useEstablishment } from "@/contexts/establishment-context"

interface LluviaDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function LluviaDrawer({ isOpen, onClose, onSuccess }: LluviaDrawerProps) {
  const { usuario } = useUser()
  const [loading, setLoading] = useState(false)
  const [mostrarModalErrores, setMostrarModalErrores] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const { establecimientoSeleccionado } = useEstablishment()

  const [medida, setMedida] = useState("")
  const [fecha, setFecha] = useState<Date>(new Date())
  const [hora, setHora] = useState<string>("")
  const [nota, setNota] = useState("")

  useEffect(() => {
    if (isOpen) {
      const now = new Date()
      const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`
      setHora(currentTime)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      setMedida("")
      setFecha(new Date())
      setHora("")
      setNota("")
      setErrors([])
      setMostrarModalErrores(false)
    }
  }, [isOpen])

  const validateForm = (): boolean => {
    const newErrors: string[] = []

    if (!usuario?.id) {
      newErrors.push("Error del sistema: No se pudo obtener el ID del usuario")
    }

    if (!establecimientoSeleccionado) {
      newErrors.push("Error del sistema: No se pudo obtener el establecimiento")
    }

    if (!medida.trim()) {
      newErrors.push("La medida de lluvia es requerida")
    } else {
      const medidaNum = Number.parseInt(medida)
      if (isNaN(medidaNum) || medidaNum < 0 || !Number.isInteger(Number.parseFloat(medida))) {
        newErrors.push("La medida debe ser un número entero mayor o igual a 0")
      }
    }

    if (!fecha) {
      newErrors.push("La fecha es requerida")
    }

    if (!hora) {
      newErrors.push("La hora es requerida")
    }

    setErrors(newErrors)
    return newErrors.length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      setMostrarModalErrores(true)
      return
    }

    setLoading(true)

    try {
      console.log("🌧️ Enviando datos de lluvia...")

      const climaData = {
        establecimiento_id: Number.parseInt(establecimientoSeleccionado!),
        medida: medida.trim(),
        fecha: fecha.toISOString().split("T")[0],
        hora,
        nota: nota.trim() || null,
        user_id: usuario?.id,
      }

      console.log("📊 Datos a enviar:", climaData)

      const response = await fetch("/api/clima", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(climaData),
      })

      const result = await response.json()

      if (!response.ok) {
        console.error("❌ Error del servidor:", result)
        throw new Error(result.error || `Error HTTP ${response.status}`)
      }

      console.log("✅ Datos de lluvia guardados:", result)

      console.log("🔄 Disparando evento reloadPartesDiarios desde lluvia drawer")
      window.dispatchEvent(new CustomEvent("reloadPartesDiarios"))

      toast.success("Datos de lluvia registrados exitosamente", {
        description: `${medida} mm registrados para el ${fecha.toLocaleDateString()}`,
      })

      onSuccess?.()
      onClose()
    } catch (error) {
      console.error("💥 Error guardando datos de lluvia:", error)
      const errorMessage = error instanceof Error ? error.message : "Error desconocido"
      toast.error("Error al guardar los datos de lluvia", {
        description: errorMessage,
      })
      setErrors([errorMessage])
    } finally {
      setLoading(false)
    }
  }

  return (
    <Drawer open={isOpen} onOpenChange={onClose} direction="right">
      <DrawerContent className="h-full w-[850px] ml-auto">
        <DrawerHeader className="flex items-center justify-between border-b pb-4">
          <DrawerTitle className="text-xl font-bold text-gray-900">Registrar Lluvia</DrawerTitle>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {fecha && (
            <div>
              <Label className="text-sm font-medium text-gray-700">Fecha *</Label>
              <div className="mt-1">
                <CustomDatePicker
                  date={fecha}
                  onDateChange={(newDate) => setFecha(newDate || new Date())}
                  placeholder="Seleccionar fecha"
                />
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Medición</h3>

            <div>
              <Label htmlFor="medida" className="text-sm font-medium text-gray-700">
                Cantidad de lluvia (mm) *
              </Label>
              <div className="relative mt-1">
                <Input
                  id="medida"
                  type="number"
                  step="1"
                  min="0"
                  placeholder="Ej: 200"
                  value={medida}
                  onChange={(e) => setMedida(e.target.value)}
                  className="pr-12"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="text-gray-500 text-sm">mm</span>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-1">Ingrese la cantidad de lluvia registrada en milímetros</p>
            </div>
          </div>

          <div>
            <Label htmlFor="nota" className="text-sm font-medium text-gray-700">
              Nota
            </Label>
            <Textarea
              id="nota"
              placeholder="Notas adicionales sobre la precipitación..."
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              className="mt-1 min-h-[100px]"
            />
          </div>
        </div>

        <div className="border-t p-6 flex gap-3 justify-end">
          <Button onClick={onClose} variant="outline" disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-green-600 hover:bg-green-700">
            {loading ? "Guardando..." : "Guardar"}
          </Button>
        </div>

        {mostrarModalErrores && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
              <div className="flex items-start gap-3 mb-4">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-red-600 mb-3">Se encontraron {errors.length} errores:</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    {errors.map((error, index) => (
                      <li key={index} className="text-sm">
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <Button onClick={() => setMostrarModalErrores(false)} className="bg-red-600 hover:bg-red-700">
                  Aceptar
                </Button>
              </div>
            </div>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  )
}
