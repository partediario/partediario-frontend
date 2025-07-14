"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Heart, X, AlertCircle, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"

interface CategoriaAnimal {
  id: number
  nombre: string
  sexo: "HEMBRA" | "MACHO"
  edad: "JOVEN" | "ADULTO"
  empresa_id: number
}

interface CategoriaAnimalDrawerProps {
  categoria: CategoriaAnimal | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  mode: "create" | "edit"
  empresaId: string
}

export function CategoriaAnimalDrawer({
  categoria,
  isOpen,
  onClose,
  onSuccess,
  mode,
  empresaId,
}: CategoriaAnimalDrawerProps) {
  const { toast } = useToast()

  const [loading, setLoading] = useState(false)
  const [mostrarExito, setMostrarExito] = useState(false)
  const [formData, setFormData] = useState({
    nombre: "",
    sexo: "",
    edad: "",
  })
  const [errors, setErrors] = useState<string[]>([])

  // Cargar datos de la categoría cuando se abre el drawer
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && categoria) {
        setFormData({
          nombre: categoria.nombre || "",
          sexo: categoria.sexo || "",
          edad: categoria.edad || "",
        })
      } else if (mode === "create") {
        setFormData({
          nombre: "",
          sexo: "",
          edad: "",
        })
      }
      setErrors([])
      setMostrarExito(false)
    }
  }, [categoria, isOpen, mode])

  // Limpiar formulario cuando se cierra el drawer
  useEffect(() => {
    if (!isOpen) {
      setFormData({ nombre: "", sexo: "", edad: "" })
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

    if (!formData.sexo) {
      newErrors.push("El sexo es requerido")
    }

    if (!formData.edad) {
      newErrors.push("La edad es requerida")
    }

    if (!empresaId) {
      newErrors.push("No se ha seleccionado una empresa")
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
        response = await fetch("/api/categorias-animales-crud", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...formData,
            empresa_id: empresaId,
          }),
        })
      } else {
        response = await fetch(`/api/categorias-animales-crud/${categoria?.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        })
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Error al ${mode === "create" ? "crear" : "actualizar"} categoría`)
      }

      setMostrarExito(true)

      setTimeout(() => {
        toast({
          title: `✅ Categoría ${mode === "create" ? "creada" : "actualizada"}`,
          description: `Se ${mode === "create" ? "creó" : "actualizó"} la categoría "${formData.nombre}" correctamente`,
          duration: 4000,
        })
      }, 500)

      setTimeout(() => {
        onSuccess()
        onClose()
      }, 2000)
    } catch (error) {
      console.error(`Error ${mode === "create" ? "creating" : "updating"} categoria:`, error)
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : `Error al ${mode === "create" ? "crear" : "actualizar"} categoría`,
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
    <Drawer open={isOpen} onOpenChange={onClose} direction="right">
      <DrawerContent className="h-full w-[850px] ml-auto">
        <DrawerHeader className="flex items-center justify-between border-b pb-4">
          <DrawerTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Heart className="w-5 h-5 text-green-600" />
            {mode === "create" ? "Nueva Categoría Animal" : "Editar Categoría Animal"}
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
                  ¡Categoría {mode === "create" ? "creada" : "actualizada"} exitosamente!
                </div>
                <div className="text-sm text-green-700">
                  Se {mode === "create" ? "creó" : "actualizó"} la categoría "{formData.nombre}" correctamente.
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

          {/* Datos de la Categoría */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Datos de la Categoría</h3>

            <div>
              <Label htmlFor="nombre" className="text-sm font-medium text-gray-700">
                Nombre de la categoría *
              </Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData((prev) => ({ ...prev, nombre: e.target.value }))}
                placeholder="Ej: Vaquillas de recría"
                disabled={loading}
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">Mínimo 3 caracteres</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sexo" className="text-sm font-medium text-gray-700">
                  Sexo *
                </Label>
                <Select
                  value={formData.sexo}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, sexo: value }))}
                  disabled={loading}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Seleccionar sexo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HEMBRA">Hembra</SelectItem>
                    <SelectItem value="MACHO">Macho</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edad" className="text-sm font-medium text-gray-700">
                  Edad *
                </Label>
                <Select
                  value={formData.edad}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, edad: value }))}
                  disabled={loading}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Seleccionar edad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="JOVEN">Joven</SelectItem>
                    <SelectItem value="ADULTO">Adulto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Información adicional */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Información sobre las categorías</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Las categorías ayudan a organizar y agrupar los animales</li>
              <li>• Cada categoría pertenece a una empresa específica</li>
              <li>• El sexo puede ser Hembra o Macho</li>
              <li>• La edad puede ser Joven o Adulto</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-6 flex gap-3 justify-end">
          <Button onClick={cancelar} variant="outline">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-green-700 hover:bg-green-800">
            {loading ? "Guardando..." : mode === "create" ? "Crear Categoría" : "Actualizar"}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
