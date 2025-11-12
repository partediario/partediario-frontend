"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { MapPin, X, AlertCircle, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { useEstablishment } from "@/contexts/establishment-context"
import { useUser } from "@/contexts/user-context"

interface Establecimiento {
  id: number
  nombre: string
  latitud: string
  longitud: string
  empresa_id: number
}

interface EditarEstablecimientoDrawerProps {
  establecimiento: Establecimiento | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  mode: "create" | "edit"
  empresaId?: number
  usuarioId?: string
}

export function EditarEstablecimientoDrawer({
  establecimiento,
  isOpen,
  onClose,
  onSuccess,
  mode,
  empresaId,
  usuarioId,
}: EditarEstablecimientoDrawerProps) {
  const { toast } = useToast()
  const { empresaSeleccionada, establecimientoSeleccionado } = useEstablishment()
  const { usuario } = useUser()

  const [loading, setLoading] = useState(false)
  const [mostrarExito, setMostrarExito] = useState(false)
  const [formData, setFormData] = useState({
    nombre: "",
    latitud: "",
    longitud: "",
  })
  const [errors, setErrors] = useState<string[]>([])

  // Obtener empresa y usuario de los contextos
  const empresaIdFinal = empresaId || empresaSeleccionada
  const usuarioIdFinal = usuarioId || usuario?.id

  const obtenerRolUsuario = (): number => {
    // Si el usuario tiene establecimientos con roles, obtener el rol del establecimiento actual
    if (usuario?.establecimientos && usuario.establecimientos.length > 0) {
      // Buscar el establecimiento seleccionado
      const establecimientoActual = usuario.establecimientos.find(
        (est: any) => est.id?.toString() === establecimientoSeleccionado,
      )

      // Si encontramos el establecimiento y tiene roles, usar el primer rol
      if (establecimientoActual?.roles && establecimientoActual.roles.length > 0) {
        const rolId = establecimientoActual.roles[0].id
        console.log("🔑 [DRAWER] Usando rol del establecimiento actual:", rolId)
        return rolId
      }

      // Si no hay establecimiento seleccionado pero hay establecimientos, usar el rol del primero
      if (usuario.establecimientos[0]?.roles && usuario.establecimientos[0].roles.length > 0) {
        const rolId = usuario.establecimientos[0].roles[0].id
        console.log("🔑 [DRAWER] Usando rol del primer establecimiento:", rolId)
        return rolId
      }
    }

    // Por defecto, usar rol ADMINISTRADOR (4) si no se encuentra ningún rol
    console.log("🔑 [DRAWER] Usando rol por defecto: ADMINISTRADOR (4)")
    return 4
  }

  // Cargar datos del establecimiento cuando se abre el drawer
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && establecimiento) {
        setFormData({
          nombre: establecimiento.nombre || "",
          latitud: establecimiento.latitud || "",
          longitud: establecimiento.longitud || "",
        })
      } else if (mode === "create") {
        setFormData({
          nombre: "",
          latitud: "",
          longitud: "",
        })
      }
      setErrors([])
      setMostrarExito(false)
    }
  }, [establecimiento, isOpen, mode])

  // Limpiar formulario cuando se cierra el drawer
  useEffect(() => {
    if (!isOpen) {
      setFormData({ nombre: "", latitud: "", longitud: "" })
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

    // Validar latitud solo si se proporciona
    if (formData.latitud.trim()) {
      const lat = Number(formData.latitud)
      if (isNaN(lat)) {
        newErrors.push("La latitud debe ser un número válido")
      } else if (lat < -90 || lat > 90) {
        newErrors.push("La latitud debe estar entre -90 y 90")
      }
    }

    // Validar longitud solo si se proporciona
    if (formData.longitud.trim()) {
      const lng = Number(formData.longitud)
      if (isNaN(lng)) {
        newErrors.push("La longitud debe ser un número válido")
      } else if (lng < -180 || lng > 180) {
        newErrors.push("La longitud debe estar entre -180 y 180")
      }
    }

    // Validar empresa y usuario
    if (mode === "create") {
      if (!empresaIdFinal) {
        newErrors.push("No se ha seleccionado una empresa")
      }
      if (!usuarioIdFinal) {
        newErrors.push("No hay usuario logueado")
      }
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
        const rolId = obtenerRolUsuario()

        response = await fetch("/api/establecimientos-create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...formData,
            empresa_id: empresaIdFinal,
            usuario_id: usuarioIdFinal,
            rol_id: rolId, // Incluir rol_id en el request
          }),
        })
      } else {
        response = await fetch(`/api/establecimientos-update/${establecimiento?.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        })
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Error al ${mode === "create" ? "crear" : "actualizar"} establecimiento`)
      }

      setMostrarExito(true)

      setTimeout(() => {
        toast({
          title: `✅ Establecimiento ${mode === "create" ? "creado" : "actualizado"}`,
          description: `Se ${mode === "create" ? "creó" : "actualizó"} el establecimiento "${formData.nombre}" correctamente`,
          duration: 4000,
        })
      }, 500)

      // Disparar evento para recargar establecimientos
      window.dispatchEvent(new CustomEvent("reloadEstablecimientos"))

      setTimeout(() => {
        onSuccess()
        onClose()
      }, 2000)
    } catch (error) {
      console.error(`Error ${mode === "create" ? "creating" : "updating"} establecimiento:`, error)
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : `Error al ${mode === "create" ? "crear" : "actualizar"} establecimiento`,
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
            <MapPin className="w-5 h-5 text-green-600" />
            {mode === "create" ? "Nuevo Establecimiento" : "Editar Establecimiento"}
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
                  ¡Establecimiento {mode === "create" ? "creado" : "actualizado"} exitosamente!
                </div>
                <div className="text-sm text-green-700">
                  Se {mode === "create" ? "creó" : "actualizó"} el establecimiento "{formData.nombre}" correctamente.
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
            <h3 className="text-base md:text-lg font-semibold text-gray-900">Datos Generales</h3>

            <div>
              <Label htmlFor="nombre" className="text-sm font-medium text-gray-700">
                Nombre del establecimiento *
              </Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData((prev) => ({ ...prev, nombre: e.target.value }))}
                placeholder="Ej: Campo Norte"
                disabled={loading}
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">Mínimo 3 caracteres</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="latitud" className="text-sm font-medium text-gray-700">
                  Latitud
                </Label>
                <Input
                  id="latitud"
                  type="number"
                  step="any"
                  value={formData.latitud}
                  onChange={(e) => setFormData((prev) => ({ ...prev, latitud: e.target.value }))}
                  placeholder="-25.2637"
                  disabled={loading}
                  className="mt-1"
                />
                <p className="text-sm text-gray-500 mt-1">Ej: -25.2637 (opcional)</p>
              </div>

              <div>
                <Label htmlFor="longitud" className="text-sm font-medium text-gray-700">
                  Longitud
                </Label>
                <Input
                  id="longitud"
                  type="number"
                  step="any"
                  value={formData.longitud}
                  onChange={(e) => setFormData((prev) => ({ ...prev, longitud: e.target.value }))}
                  placeholder="-57.5759"
                  disabled={loading}
                  className="mt-1"
                />
                <p className="text-sm text-gray-500 mt-1">Ej: -57.5759 (opcional)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4 md:p-6 flex gap-3 justify-end">
          <Button onClick={cancelar} variant="outline">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-red-600 hover:bg-red-700">
            {loading ? "Guardando..." : mode === "create" ? "Crear Establecimiento" : "Actualizar"}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
