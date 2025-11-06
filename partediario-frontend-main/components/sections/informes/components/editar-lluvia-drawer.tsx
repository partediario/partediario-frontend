"use client"

import { useState, useEffect } from "react"
import { X, AlertCircle, CheckCircle } from "lucide-react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CustomDatePicker } from "@/components/ui/custom-date-picker"
import { CustomTimePicker } from "@/components/ui/custom-time-picker"
import { useUser } from "@/contexts/user-context"
import { toast } from "@/hooks/use-toast"
import type { ParteDiario } from "@/lib/types"
import { useEstablishment } from "@/contexts/establishment-context"

interface EditarLluviaDrawerProps {
  isOpen: boolean
  onClose: () => void
  parte: ParteDiario | null
  onSuccess?: () => void
}

export default function EditarLluviaDrawer({ isOpen, onClose, parte, onSuccess }: EditarLluviaDrawerProps) {
  const { usuario, loading: loadingUsuario } = useUser()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [mostrarExito, setMostrarExito] = useState(false)
  const { establecimientoSeleccionado } = useEstablishment()

  // Estados del formulario
  const [medida, setMedida] = useState("")
  const [fecha, setFecha] = useState<Date | undefined>(undefined)
  const [hora, setHora] = useState<string>("")
  const [nota, setNota] = useState("")

  // Cargar datos del parte diario cuando se abre el drawer
  useEffect(() => {
    if (isOpen && parte && parte.pd_tipo === "CLIMA") {
      console.log("🔄 Cargando datos del parte diario de lluvia para edición:", parte)
      cargarDatosParteDiario()
    }
  }, [isOpen, parte])

  // Limpiar formulario cuando se cierra el drawer
  useEffect(() => {
    if (!isOpen) {
      setMedida("")
      setFecha(undefined)
      setHora("")
      setNota("")
      setErrors([])
      setMostrarExito(false)
    }
  }, [isOpen])

  const cargarDatosParteDiario = () => {
    if (!parte) return

    console.log("📋 Cargando datos del parte diario de lluvia:", parte)

    // Cargar fecha y hora
    try {
      const fechaParte = new Date(parte.pd_fecha + "T00:00:00")
      setFecha(fechaParte)
    } catch {
      setFecha(new Date())
    }

    setHora(parte.pd_hora?.slice(0, 5) || "")
    setNota(parte.pd_nota || "")

    // Parsear detalles para obtener la medida
    const parseDetalles = () => {
      try {
        if (typeof parte.pd_detalles === "string") {
          return JSON.parse(parte.pd_detalles)
        }
        return parte.pd_detalles || {}
      } catch {
        return {}
      }
    }

    const detalles = parseDetalles()
    console.log("📋 Detalles de lluvia:", detalles)

    // Obtener la medida de lluvia - revisar diferentes estructuras posibles
    if (detalles.medida) {
      setMedida(detalles.medida.toString())
    } else if (detalles.cantidad) {
      setMedida(detalles.cantidad.toString())
    } else if (detalles.lluvia) {
      setMedida(detalles.lluvia.toString())
    } else {
      // Si no hay detalles, intentar extraer de la descripción
      const descripcion = parte.pd_descripcion || ""
      const match = descripcion.match(/(\d+)\s*mm/)
      if (match) {
        setMedida(match[1])
      }
    }
  }

  const validateForm = (): boolean => {
    const newErrors: string[] = []

    if (!usuario?.id) {
      newErrors.push("Error del sistema: No se pudo obtener el ID del usuario")
    }

    if (!establecimientoSeleccionado) {
      newErrors.push("Error del sistema: No se pudo obtener el establecimiento")
    }

    if (!parte?.pd_id) {
      newErrors.push("Error del sistema: No se pudo obtener el ID del parte diario")
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

  const actualizar = async () => {
    if (!parte) return

    console.log("🔄 INICIANDO ACTUALIZACIÓN DE REGISTRO DE LLUVIA...")

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      console.log("📦 Preparando datos para actualizar...")

      const fechaString = fecha?.toISOString().split("T")[0] || ""

      const datosActualizacion = {
        id: parte.pd_id,
        establecimiento_id: Number.parseInt(establecimientoSeleccionado!),
        medida: medida.trim(),
        fecha: fechaString,
        hora: hora,
        nota: nota.trim() || null,
        user_id: usuario!.id,
      }

      console.log("📤 Datos de actualización:", datosActualizacion)

      const response = await fetch("/api/clima", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(datosActualizacion),
      })

      if (!response.ok) {
        let errorMessage = `Error HTTP: ${response.status}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.details || errorMessage
        } catch {
          // Si no se puede parsear como JSON, usar el status
          errorMessage = `Error HTTP: ${response.status} - ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()
      console.log("🎉 REGISTRO DE LLUVIA ACTUALIZADO EXITOSAMENTE:", result)

      setMostrarExito(true)

      setTimeout(() => {
        toast({
          title: "✅ Registro de Lluvia Actualizado",
          description: `Se actualizó el registro de ${medida} mm para el ${fecha?.toLocaleDateString()}`,
          duration: 4000,
        })
      }, 500)

      // Disparar evento para recargar partes diarios
      console.log("🔄 Disparando evento reloadPartesDiarios...")
      window.dispatchEvent(new CustomEvent("reloadPartesDiarios"))

      setTimeout(() => {
        onSuccess?.()
        onClose()
      }, 2000)
    } catch (error) {
      console.error("💥 ERROR ACTUALIZANDO REGISTRO DE LLUVIA:", error)
      toast({
        title: "Error",
        description: `No se pudo actualizar el registro de lluvia: ${error instanceof Error ? error.message : "Error desconocido"}`,
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setLoading(false)
    }
  }

  const cancelar = () => {
    onClose()
  }

  // Solo mostrar el drawer para tipos CLIMA
  if (!parte || parte.pd_tipo !== "CLIMA") {
    return null
  }

  const nombreCompleto = usuario ? `${usuario.nombres} ${usuario.apellidos}`.trim() : "Cargando..."

  return (
    <Drawer open={isOpen} onOpenChange={onClose} direction="right">
      <DrawerContent className="h-full w-[850px] ml-auto">
        <DrawerHeader className="flex items-center justify-between border-b pb-4">
          <DrawerTitle className="text-xl font-bold text-gray-900">Editar Registro de Lluvia</DrawerTitle>
          <button onClick={cancelar} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Mostrar mensaje de éxito */}
          {mostrarExito && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <div className="font-medium text-green-800 mb-2">¡Registro de lluvia actualizado exitosamente!</div>
                <div className="text-sm text-green-700">
                  Se actualizó el registro de {medida} mm para el {fecha?.toLocaleDateString()}. Los cambios se han
                  guardado.
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Mostrar errores de validación */}
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium mb-2">Se encontraron {errors.length} errores:</div>
                <ul className="list-disc list-inside space-y-1">
                  {errors.map((error, index) => (
                    <li key={index} className="text-sm">
                      {error}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Datos Generales */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Datos Generales</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Tipo</Label>
                <div className="mt-1 px-3 py-2 bg-gray-50 border rounded-md text-sm font-medium text-gray-900">
                  Lluvia
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">Usuario</Label>
                <div className="mt-1 px-3 py-2 bg-gray-50 border rounded-md text-sm text-gray-900">
                  {loadingUsuario ? "Cargando..." : nombreCompleto}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Fecha *</Label>
                <div className="mt-1">
                  <CustomDatePicker date={fecha} onDateChange={setFecha} placeholder="Seleccionar fecha" />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">Hora *</Label>
                <div className="mt-1">
                  <CustomTimePicker time={hora} onTimeChange={setHora} placeholder="Seleccionar hora" />
                </div>
              </div>
            </div>
          </div>

          {/* Medición */}
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

          {/* Nota */}
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

        {/* Footer */}
        <div className="border-t p-6 flex gap-3 justify-end">
          <Button onClick={cancelar} variant="outline">
            Cancelar
          </Button>
          <Button onClick={actualizar} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
            {loading ? "Actualizando..." : "Actualizar"}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
