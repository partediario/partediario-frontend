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
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
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
      setShowDeleteConfirm(false)
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

  const eliminarRegistro = async () => {
    console.log("[v0] eliminarRegistro iniciado")
    console.log("[v0] parte:", parte)
    console.log("[v0] usuario:", usuario)

    if (!parte?.pd_id || !usuario?.id) {
      console.log("[v0] Validación fallida - parte o usuario faltante")
      return
    }

    console.log("[v0] Iniciando eliminación...")
    setDeleting(true)
    try {
      console.log("[v0] Haciendo PATCH a:", `/api/clima/${parte.pd_id}`)
      const response = await fetch(`/api/clima/${parte.pd_id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_user_id: usuario.id,
        }),
      })

      console.log("[v0] Response status:", response.status)
      console.log("[v0] Response ok:", response.ok)

      if (!response.ok) {
        const errorData = await response.json()
        console.log("[v0] Error data:", errorData)
        throw new Error("Error al eliminar el registro")
      }

      console.log("[v0] Eliminación exitosa")
      toast({
        title: "Registro Eliminado",
        description: "El registro de lluvia ha sido eliminado correctamente",
      })

      console.log("[v0] Disparando evento reloadPartesDiarios")
      window.dispatchEvent(new CustomEvent("reloadPartesDiarios"))
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error("[v0] Error eliminando registro:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el registro",
        variant: "destructive",
      })
    } finally {
      console.log("[v0] Finalizando eliminación")
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const cancelar = () => {
    onClose()
    setShowDeleteConfirm(false)
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

          {/* Fecha field only */}
          <div>
            <Label className="text-sm font-medium text-gray-700">Fecha *</Label>
            <div className="mt-1">
              <CustomDatePicker date={fecha} onDateChange={setFecha} placeholder="Seleccionar fecha" />
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
        <div className="border-t p-6 flex gap-3 justify-between">
          <div>
            <Button onClick={() => setShowDeleteConfirm(true)} variant="destructive" disabled={deleting}>
              {deleting ? "Eliminando..." : "Eliminar"}
            </Button>
          </div>

          <div className="flex gap-3">
            <Button onClick={cancelar} variant="outline">
              Cancelar
            </Button>
            <Button onClick={actualizar} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading ? "Actualizando..." : "Actualizar"}
            </Button>
          </div>
        </div>

        {/* Delete confirmation modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Confirmar Eliminación</h3>
              <p className="text-gray-600 mb-6">¿Seguro que quiere eliminar este registro de lluvia?</p>
              <div className="flex gap-3 justify-end">
                <Button onClick={() => setShowDeleteConfirm(false)} variant="outline">
                  No
                </Button>
                <Button onClick={eliminarRegistro} variant="destructive" disabled={deleting}>
                  {deleting ? "Eliminando..." : "Sí"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  )
}
