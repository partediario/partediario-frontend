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
  categoria_animal_estandar_id?: number | null
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
  const [mostrarModalErrores, setMostrarModalErrores] = useState(false)
  const [formData, setFormData] = useState({
    nombre: "",
    sexo: "",
    edad: "",
    categoria_animal_estandar_id: "",
  })
  const [errors, setErrors] = useState<string[]>([])
  const [categoriasEstandar, setCategoriasEstandar] = useState<CategoriaAnimal[]>([])
  const [loadingEstandar, setLoadingEstandar] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadCategoriasEstandar()
    }
  }, [isOpen])

  const loadCategoriasEstandar = async () => {
    try {
      setLoadingEstandar(true)
      const response = await fetch("/api/categorias-animales-crud?empresa_id=1")
      const data = await response.json()

      if (response.ok) {
        setCategoriasEstandar(data.categorias || [])
      }
    } catch (error) {
      console.error("Error loading standard categories:", error)
    } finally {
      setLoadingEstandar(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && categoria) {
        setFormData({
          nombre: categoria.nombre || "",
          sexo: categoria.sexo || "",
          edad: categoria.edad || "",
          categoria_animal_estandar_id: categoria.categoria_animal_estandar_id?.toString() || "",
        })
      } else if (mode === "create") {
        setFormData({ nombre: "", sexo: "", edad: "", categoria_animal_estandar_id: "" })
      }
      setErrors([])
      setMostrarExito(false)
    }
  }, [categoria, isOpen, mode])

  useEffect(() => {
    if (!isOpen) {
      setFormData({ nombre: "", sexo: "", edad: "", categoria_animal_estandar_id: "" })
      setErrors([])
      setMostrarExito(false)
    }
  }, [isOpen])

  const handleCategoriaEstandarChange = (value: string) => {
    setFormData((prev) => ({ ...prev, categoria_animal_estandar_id: value }))

    const categoriaSeleccionada = categoriasEstandar.find((cat) => cat.id.toString() === value)
    if (categoriaSeleccionada) {
      setFormData((prev) => ({
        ...prev,
        categoria_animal_estandar_id: value,
        sexo: categoriaSeleccionada.sexo,
        edad: categoriaSeleccionada.edad,
      }))
    }
  }

  const validateForm = () => {
    const newErrors: string[] = []

    if (!formData.nombre.trim()) {
      newErrors.push("El nombre es requerido")
    } else if (formData.nombre.trim().length < 3) {
      newErrors.push("El nombre debe tener al menos 3 caracteres")
    }

    if (!formData.categoria_animal_estandar_id) {
      newErrors.push("La categoría estándar es requerida")
    }

    if (!empresaId) {
      newErrors.push("No se ha seleccionado una empresa")
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
      let response

      const submitData = {
        ...formData,
        categoria_animal_estandar_id: formData.categoria_animal_estandar_id
          ? Number.parseInt(formData.categoria_animal_estandar_id)
          : null,
      }

      if (mode === "create") {
        response = await fetch("/api/categorias-animales-crud", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...submitData,
            empresa_id: empresaId,
          }),
        })
      } else {
        response = await fetch(`/api/categorias-animales-crud/${categoria?.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(submitData),
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
      <DrawerContent className="ml-auto">
        <DrawerHeader className="flex items-center justify-between border-b pb-4">
          <DrawerTitle className="text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2">
            <Heart className="w-5 h-5 text-green-600" />
            {mode === "create" ? "Nueva Categoría Animal" : "Editar Categoría Animal"}
          </DrawerTitle>
          <button onClick={cancelar} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6">
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

          <div className="space-y-4">
            <h3 className="text-base md:text-lg font-semibold text-gray-900">Datos de la Categoría</h3>

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

            <div>
              <Label htmlFor="categoria-estandar" className="text-sm font-medium text-gray-700">
                Categoría estándar *
              </Label>
              <Select
                value={formData.categoria_animal_estandar_id}
                onValueChange={handleCategoriaEstandarChange}
                disabled={loading || loadingEstandar}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={loadingEstandar ? "Cargando..." : "Seleccionar categoría estándar"} />
                </SelectTrigger>
                <SelectContent>
                  {categoriasEstandar.map((categoria) => (
                    <SelectItem key={categoria.id} value={categoria.id.toString()}>
                      {categoria.nombre} ({categoria.sexo === "HEMBRA" ? "Hembra" : "Macho"} -{" "}
                      {categoria.edad === "JOVEN" ? "Joven" : "Adulto"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500 mt-1">
                El sexo y edad se cargarán automáticamente según la categoría seleccionada
              </p>
            </div>

            {formData.categoria_animal_estandar_id && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">Información de la categoría seleccionada</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700 font-medium">Sexo:</span>{" "}
                    <span className="text-blue-900">{formData.sexo === "HEMBRA" ? "Hembra" : "Macho"}</span>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Edad:</span>{" "}
                    <span className="text-blue-900">{formData.edad === "JOVEN" ? "Joven" : "Adulto"}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

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

        <div className="border-t p-4 md:p-6 flex gap-3 justify-end">
          <Button onClick={cancelar} variant="outline">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-green-700 hover:bg-green-800">
            {loading ? "Guardando..." : mode === "create" ? "Crear Categoría" : "Actualizar"}
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
