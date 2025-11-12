"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Truck, X, AlertCircle, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"

interface Maquinaria {
  id: number
  nombre: string
  categoria: string | null
  marca: string | null
  modelo: string | null
  empresa_id: number
}

interface MaquinariaDrawerProps {
  maquinaria: Maquinaria | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  mode: "create" | "edit"
  empresaId: string
}

export function MaquinariaDrawer({ maquinaria, isOpen, onClose, onSuccess, mode, empresaId }: MaquinariaDrawerProps) {
  const { toast } = useToast()

  const [loading, setLoading] = useState(false)
  const [mostrarExito, setMostrarExito] = useState(false)
  const [formData, setFormData] = useState({
    nombre: "",
    categoria: "",
    marca: "",
    modelo: "",
  })
  const [errors, setErrors] = useState<string[]>([])

  // Cargar datos de la maquinaria cuando se abre el drawer
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && maquinaria) {
        setFormData({
          nombre: maquinaria.nombre || "",
          categoria: maquinaria.categoria || "",
          marca: maquinaria.marca || "",
          modelo: maquinaria.modelo || "",
        })
      } else if (mode === "create") {
        setFormData({
          nombre: "",
          categoria: "",
          marca: "",
          modelo: "",
        })
      }
      setErrors([])
      setMostrarExito(false)
    }
  }, [maquinaria, isOpen, mode])

  // Limpiar formulario cuando se cierra el drawer
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        nombre: "",
        categoria: "",
        marca: "",
        modelo: "",
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

    if (!empresaId) {
      newErrors.push("No se ha seleccionado una empresa")
    }

    setErrors(newErrors)
    return newErrors.length === 0
  }

  const crearMaquinaria = async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      const response = await fetch("/api/maquinarias-crud", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          empresa_id: empresaId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al crear maquinaria")
      }

      setMostrarExito(true)

      setTimeout(() => {
        toast({
          title: "✅ Maquinaria creada",
          description: `Se creó la maquinaria "${formData.nombre}" correctamente`,
          duration: 4000,
        })
      }, 500)

      setTimeout(() => {
        onSuccess()
        onClose()
      }, 2000)
    } catch (error) {
      console.error("Error creating maquinaria:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al crear maquinaria",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const actualizarMaquinaria = async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      const response = await fetch(`/api/maquinarias-crud/${maquinaria?.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al actualizar maquinaria")
      }

      setMostrarExito(true)

      setTimeout(() => {
        toast({
          title: "✅ Maquinaria actualizada",
          description: `Se actualizó la maquinaria "${formData.nombre}" correctamente`,
          duration: 4000,
        })
      }, 500)

      setTimeout(() => {
        onSuccess()
        onClose()
      }, 2000)
    } catch (error) {
      console.error("Error updating maquinaria:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al actualizar maquinaria",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (mode === "create") {
      await crearMaquinaria()
    } else {
      await actualizarMaquinaria()
    }
  }

  const cancelar = () => {
    onClose()
  }

  return (
    <Drawer open={isOpen} onOpenChange={onClose} direction="right">
      <DrawerContent className="ml-auto">
        <DrawerHeader className="flex items-center justify-between border-b pb-4">
          <DrawerTitle className="text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2">
            <Truck className="w-5 h-5 text-green-600" />
            {mode === "create" ? "Nueva Maquinaria" : "Editar Maquinaria"}
          </DrawerTitle>
          <button onClick={cancelar} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6">
          {/* Mostrar mensaje de éxito */}
          {mostrarExito && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <div className="font-medium text-green-800 mb-2">
                  ¡Maquinaria {mode === "create" ? "creada" : "actualizada"} exitosamente!
                </div>
                <div className="text-sm text-green-700">
                  Se {mode === "create" ? "creó" : "actualizó"} la maquinaria "{formData.nombre}" correctamente.
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

          {/* Datos de la Maquinaria */}
          <div className="space-y-4">
            <h3 className="text-base md:text-lg font-semibold text-gray-900">Datos de la Maquinaria</h3>

            <div>
              <Label htmlFor="nombre" className="text-sm font-medium text-gray-700">
                Nombre *
              </Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData((prev) => ({ ...prev, nombre: e.target.value }))}
                placeholder="Ej: Tractor John Deere 2024"
                disabled={loading}
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">Mínimo 3 caracteres</p>
            </div>

            <div>
              <Label htmlFor="categoria" className="text-sm font-medium text-gray-700">
                Categoría
              </Label>
              <Input
                id="categoria"
                value={formData.categoria}
                onChange={(e) => setFormData((prev) => ({ ...prev, categoria: e.target.value }))}
                placeholder="Ej: Tractor, Cosechadora, Implemento"
                disabled={loading}
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">Opcional</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="marca" className="text-sm font-medium text-gray-700">
                  Marca
                </Label>
                <Input
                  id="marca"
                  value={formData.marca}
                  onChange={(e) => setFormData((prev) => ({ ...prev, marca: e.target.value }))}
                  placeholder="Ej: John Deere"
                  disabled={loading}
                  className="mt-1"
                />
                <p className="text-sm text-gray-500 mt-1">Opcional</p>
              </div>

              <div>
                <Label htmlFor="modelo" className="text-sm font-medium text-gray-700">
                  Modelo
                </Label>
                <Input
                  id="modelo"
                  value={formData.modelo}
                  onChange={(e) => setFormData((prev) => ({ ...prev, modelo: e.target.value }))}
                  placeholder="Ej: 6110J"
                  disabled={loading}
                  className="mt-1"
                />
                <p className="text-sm text-gray-500 mt-1">Opcional</p>
              </div>
            </div>
          </div>

          {/* Información adicional */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Información sobre las maquinarias</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Las maquinarias son los equipos utilizados en las operaciones de la empresa</li>
              <li>• El nombre debe ser descriptivo y único por empresa</li>
              <li>• La categoría ayuda a clasificar el tipo de maquinaria (Tractor, Cosechadora, etc.)</li>
              <li>• Marca y modelo son opcionales pero ayudan a identificar mejor el equipo</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4 md:p-6 flex gap-3 justify-end">
          <Button onClick={cancelar} variant="outline">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-green-700 hover:bg-green-800">
            {loading ? "Guardando..." : mode === "create" ? "Crear Maquinaria" : "Actualizar"}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
