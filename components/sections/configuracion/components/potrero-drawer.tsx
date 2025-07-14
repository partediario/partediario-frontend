"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { MapPin, X, AlertCircle, CheckCircle, HelpCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { useEstablishment } from "@/contexts/establishment-context"

interface Potrero {
  id: number
  nombre: string
  superficie_total: number
  superfice_util: number | null
  recurso_forrajero: string | null
  receptividad: number | null
  receptividad_unidad: string | null
  establecimiento_id: number
}

interface PotreroDrawerProps {
  potrero: Potrero | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  mode: "create" | "edit"
  establecimientoId: string
}

export function PotreroDrawer({ potrero, isOpen, onClose, onSuccess, mode, establecimientoId }: PotreroDrawerProps) {
  const { toast } = useToast()
  const { empresaSeleccionada } = useEstablishment()

  const [loading, setLoading] = useState(false)
  const [mostrarExito, setMostrarExito] = useState(false)
  const [formData, setFormData] = useState({
    nombre: "",
    superficie_total: "",
    superfice_util: "",
    recurso_forrajero: "",
    receptividad: "",
    receptividad_unidad: "",
  })
  const [errors, setErrors] = useState<string[]>([])

  const unidadesReceptividad = ["UG", "KILOS"]

  // Cargar datos del potrero cuando se abre el drawer
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && potrero) {
        setFormData({
          nombre: potrero.nombre || "",
          superficie_total: potrero.superficie_total?.toString() || "",
          superfice_util: potrero.superfice_util?.toString() || "",
          recurso_forrajero: potrero.recurso_forrajero || "",
          receptividad: potrero.receptividad?.toString() || "",
          receptividad_unidad: potrero.receptividad_unidad || "",
        })
      } else if (mode === "create") {
        setFormData({
          nombre: "",
          superficie_total: "",
          superfice_util: "",
          recurso_forrajero: "",
          receptividad: "",
          receptividad_unidad: "",
        })
      }
      setErrors([])
      setMostrarExito(false)
    }
  }, [potrero, isOpen, mode])

  // Limpiar formulario cuando se cierra el drawer
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        nombre: "",
        superficie_total: "",
        superfice_util: "",
        recurso_forrajero: "",
        receptividad: "",
        receptividad_unidad: "",
      })
      setErrors([])
      setMostrarExito(false)
    }
  }, [isOpen])

  const validateForm = () => {
    const newErrors: string[] = []

    if (!formData.nombre.trim()) {
      newErrors.push("El nombre es requerido")
    } else if (formData.nombre.trim().length < 3) {
      newErrors.push("El nombre debe tener al menos 3 caracteres")
    }

    if (!formData.superficie_total.trim()) {
      newErrors.push("La superficie total es requerida")
    } else {
      const superficie = Number.parseFloat(formData.superficie_total)
      if (isNaN(superficie) || superficie <= 0) {
        newErrors.push("La superficie total debe ser un número mayor a 0")
      }
    }

    if (formData.superfice_util.trim()) {
      const superficieUtil = Number.parseFloat(formData.superfice_util)
      const superficieTotal = Number.parseFloat(formData.superficie_total)
      if (isNaN(superficieUtil) || superficieUtil <= 0) {
        newErrors.push("La superficie útil debe ser un número mayor a 0")
      } else if (!isNaN(superficieTotal) && superficieUtil > superficieTotal) {
        newErrors.push("La superficie útil no puede ser mayor a la superficie total")
      }
    }

    if (formData.receptividad.trim()) {
      const receptividad = Number.parseInt(formData.receptividad)
      if (isNaN(receptividad) || receptividad <= 0) {
        newErrors.push("La receptividad debe ser un número entero mayor a 0")
      }
    }

    if (!establecimientoId) {
      newErrors.push("No se ha seleccionado un establecimiento")
    }

    setErrors(newErrors)
    return newErrors.length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      let response

      if (mode === "create") {
        response = await fetch("/api/potreros-crud", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...formData,
            establecimiento_id: establecimientoId,
            empresa_id: empresaSeleccionada,
          }),
        })
      } else {
        response = await fetch(`/api/potreros-crud/${potrero?.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        })
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Error al ${mode === "create" ? "crear" : "actualizar"} potrero`)
      }

      setMostrarExito(true)

      setTimeout(() => {
        toast({
          title: `✅ Potrero ${mode === "create" ? "creado" : "actualizado"}`,
          description: `Se ${mode === "create" ? "creó" : "actualizó"} el potrero "${formData.nombre}" correctamente`,
          duration: 4000,
        })
      }, 500)

      setTimeout(() => {
        onSuccess()
        onClose()
      }, 2000)
    } catch (error) {
      console.error(`Error ${mode === "create" ? "creating" : "updating"} potrero:`, error)
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : `Error al ${mode === "create" ? "crear" : "actualizar"} potrero`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const cancelar = () => {
    onClose()
  }

  return (
    <TooltipProvider>
      <Drawer open={isOpen} onOpenChange={onClose} direction="right">
        <DrawerContent className="h-full w-[850px] ml-auto">
          <DrawerHeader className="flex items-center justify-between border-b pb-4">
            <DrawerTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-green-600" />
              {mode === "create" ? "Nuevo Potrero" : "Editar Potrero"}
            </DrawerTitle>
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
                  <div className="font-medium text-green-800 mb-2">
                    ¡Potrero {mode === "create" ? "creado" : "actualizado"} exitosamente!
                  </div>
                  <div className="text-sm text-green-700">
                    Se {mode === "create" ? "creó" : "actualizó"} el potrero "{formData.nombre}" correctamente.
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

            {/* Datos del Potrero */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Datos del Potrero</h3>

              <div>
                <Label htmlFor="nombre" className="text-sm font-medium text-gray-700">
                  Nombre del potrero *
                </Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData((prev) => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Ej: Potrero Norte"
                  disabled={loading}
                  className="mt-1"
                />
                <p className="text-sm text-gray-500 mt-1">Mínimo 3 caracteres</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="superficie_total" className="text-sm font-medium text-gray-700">
                      Superficie total (ha) *
                    </Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="w-4 h-4 text-slate-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Superficie total del potrero incluyendo áreas no pastoreables</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id="superficie_total"
                    type="number"
                    step="0.1"
                    value={formData.superficie_total}
                    onChange={(e) => setFormData((prev) => ({ ...prev, superficie_total: e.target.value }))}
                    placeholder="50"
                    disabled={loading}
                    className="mt-1"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="superfice_util" className="text-sm font-medium text-gray-700">
                      Superficie útil (ha)
                    </Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="w-4 h-4 text-slate-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Superficie efectivamente pastoreable</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id="superfice_util"
                    type="number"
                    step="0.1"
                    value={formData.superfice_util}
                    onChange={(e) => setFormData((prev) => ({ ...prev, superfice_util: e.target.value }))}
                    placeholder="45"
                    disabled={loading}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="recurso_forrajero" className="text-sm font-medium text-gray-700">
                  Recurso forrajero
                </Label>
                <Input
                  id="recurso_forrajero"
                  value={formData.recurso_forrajero}
                  onChange={(e) => setFormData((prev) => ({ ...prev, recurso_forrajero: e.target.value }))}
                  placeholder="Ej: Pasto natural, Gatton Panic, etc."
                  disabled={loading}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="receptividad" className="text-sm font-medium text-gray-700">
                      Receptividad
                    </Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="w-4 h-4 text-slate-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Capacidad de carga del potrero (número entero)</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id="receptividad"
                    type="number"
                    step="1"
                    value={formData.receptividad}
                    onChange={(e) => setFormData((prev) => ({ ...prev, receptividad: e.target.value }))}
                    placeholder="100"
                    disabled={loading}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="receptividad_unidad" className="text-sm font-medium text-gray-700">
                    Unidad
                  </Label>
                  <Select
                    value={formData.receptividad_unidad}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, receptividad_unidad: value }))}
                    disabled={loading}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Seleccionar unidad" />
                    </SelectTrigger>
                    <SelectContent>
                      {unidadesReceptividad.map((unidad) => (
                        <SelectItem key={unidad} value={unidad}>
                          {unidad}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Información adicional */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Información sobre los potreros</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Los potreros son las divisiones de pastoreo de tu establecimiento</li>
                <li>• La superficie útil debe ser menor o igual a la superficie total</li>
                <li>• La receptividad indica la capacidad de carga animal</li>
                <li>• El recurso forrajero ayuda a planificar el manejo</li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t p-6 flex gap-3 justify-end">
            <Button onClick={cancelar} variant="outline">
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={loading} className="bg-green-700 hover:bg-green-800">
              {loading ? "Guardando..." : mode === "create" ? "Crear Potrero" : "Actualizar"}
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </TooltipProvider>
  )
}
