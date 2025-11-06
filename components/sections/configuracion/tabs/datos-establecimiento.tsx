"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useConfigNavigation } from "@/contexts/config-navigation-context"
import { HelpCircle, X } from "lucide-react"
import { PermissionWrapper } from "@/components/permission-wrapper"

interface EstablecimientoData {
  id: string
  nombre: string
  latitud: string
  longitud: string
}

export function DatosEstablecimiento() {
  const { toast } = useToast()
  const { state } = useConfigNavigation()

  const [formData, setFormData] = useState<EstablecimientoData>({
    id: "",
    nombre: "",
    latitud: "",
    longitud: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null)

  // Cargar datos del establecimiento cuando cambia la selección
  useEffect(() => {
    if (!state.selectedEstablecimientoId) {
      console.log("⚠️ No hay establecimiento seleccionado")
      return
    }

    const loadEstablecimientoData = async () => {
      try {
        setLoading(true)
        console.log("🏭 Cargando datos de establecimiento:", state.selectedEstablecimientoId)

        const response = await fetch(`/api/establecimientos/${state.selectedEstablecimientoId}`)

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Error al cargar datos")
        }

        const data = await response.json()
        console.log("✅ Datos de establecimiento cargados:", data)

        setFormData({
          id: data.id || state.selectedEstablecimientoId,
          nombre: data.nombre || "",
          latitud: data.latitud || "",
          longitud: data.longitud || "",
        })

        // Limpiar errores al cargar nuevos datos
        setErrors({})
      } catch (error) {
        console.error("❌ Error al cargar establecimiento:", error)
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Error al cargar datos del establecimiento",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadEstablecimientoData()
  }, [state.selectedEstablecimientoId, toast])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre es requerido"
    } else if (formData.nombre.trim().length < 3) {
      newErrors.nombre = "El nombre debe tener al menos 3 caracteres"
    }

    // Validar latitud si se proporciona
    if (formData.latitud.trim()) {
      const lat = Number.parseFloat(formData.latitud)
      if (Number.isNaN(lat)) {
        newErrors.latitud = "La latitud debe ser un número válido"
      } else if (lat < -90 || lat > 90) {
        newErrors.latitud = "La latitud debe estar entre -90 y 90"
      }
    }

    // Validar longitud si se proporciona
    if (formData.longitud.trim()) {
      const lng = Number.parseFloat(formData.longitud)
      if (Number.isNaN(lng)) {
        newErrors.longitud = "La longitud debe ser un número válido"
      } else if (lng < -180 || lng > 180) {
        newErrors.longitud = "La longitud debe estar entre -180 y 180"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast({
        title: "Errores de validación",
        description: "Por favor corrige los errores antes de continuar",
        variant: "destructive",
      })
      return
    }

    try {
      setSaving(true)
      console.log("💾 Guardando datos de establecimiento:", formData.id)

      const response = await fetch(`/api/establecimientos-update/${formData.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre: formData.nombre,
          latitud: formData.latitud.trim() || null,
          longitud: formData.longitud.trim() || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al guardar")
      }

      const result = await response.json()
      console.log("✅ Establecimiento guardado:", result)

      toast({
        title: "Guardado con éxito",
        description: "Los datos del establecimiento han sido actualizados.",
      })

      // Disparar evento para actualizar otros componentes
      const event = new CustomEvent("establishmentDataChanged", {
        detail: {
          establecimientoId: formData.id,
          updatedData: {
            nombre: formData.nombre,
            latitud: formData.latitud,
            longitud: formData.longitud,
          },
          timestamp: Date.now(),
        },
      })
      window.dispatchEvent(event)

      console.log("📡 Evento de actualización disparado para establecimiento:", formData.nombre)
    } catch (error) {
      console.error("❌ Error al guardar establecimiento:", error)
      toast({
        title: "Error al guardar",
        description: error instanceof Error ? error.message : "Error al actualizar los datos",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: keyof EstablecimientoData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const handleTooltipToggle = (tooltipId: string, event: React.MouseEvent) => {
    if (activeTooltip === tooltipId) {
      setActiveTooltip(null)
      setTooltipPosition(null)
    } else {
      const rect = event.currentTarget.getBoundingClientRect()
      setTooltipPosition({
        x: rect.left,
        y: rect.top - 10,
      })
      setActiveTooltip(tooltipId)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando datos del establecimiento...</p>
        </div>
      </div>
    )
  }

  if (!state.selectedEstablecimientoId) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-gray-600">Selecciona un establecimiento para ver sus datos</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>Datos Generales</CardTitle>
              <button
                type="button"
                className="text-gray-400 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full p-1 transition-colors relative"
                aria-label="Información sobre Datos Generales"
                onClick={(e) => handleTooltipToggle("datos-generales", e)}
              >
                <HelpCircle className="h-4 w-4" />
              </button>
            </div>
            <CardDescription>Información básica del establecimiento</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre del establecimiento *</Label>
              <PermissionWrapper
                requirePermission="canEditConfig"
                configType="establecimiento"
                fallback={<Input id="nombre" value={formData.nombre} disabled={true} className="bg-gray-50" />}
              >
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => handleInputChange("nombre", e.target.value)}
                  placeholder="Ej: Campo Norte"
                  className={errors.nombre ? "border-red-500" : ""}
                  disabled={saving}
                />
              </PermissionWrapper>
              {errors.nombre && <p className="text-sm text-red-500">{errors.nombre}</p>}
              <p className="text-sm text-gray-500">Mínimo 3 caracteres</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitud">Latitud</Label>
                <PermissionWrapper
                  requirePermission="canEditConfig"
                  configType="establecimiento"
                  fallback={<Input id="latitud" value={formData.latitud} disabled={true} className="bg-gray-50" />}
                >
                  <Input
                    id="latitud"
                    value={formData.latitud}
                    onChange={(e) => handleInputChange("latitud", e.target.value)}
                    placeholder="-25.2637"
                    className={errors.latitud ? "border-red-500" : ""}
                    disabled={saving}
                  />
                </PermissionWrapper>
                {errors.latitud && <p className="text-sm text-red-500">{errors.latitud}</p>}
                <p className="text-sm text-gray-500">Ej: -25.2637 (opcional)</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="longitud">Longitud</Label>
                <PermissionWrapper
                  requirePermission="canEditConfig"
                  configType="establecimiento"
                  fallback={<Input id="longitud" value={formData.longitud} disabled={true} className="bg-gray-50" />}
                >
                  <Input
                    id="longitud"
                    value={formData.longitud}
                    onChange={(e) => handleInputChange("longitud", e.target.value)}
                    placeholder="-57.5759"
                    className={errors.longitud ? "border-red-500" : ""}
                    disabled={saving}
                  />
                </PermissionWrapper>
                {errors.longitud && <p className="text-sm text-red-500">{errors.longitud}</p>}
                <p className="text-sm text-gray-500">Ej: -57.5759 (opcional)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botón Guardar - solo para usuarios que pueden editar */}
        <PermissionWrapper requirePermission="canEditConfig" configType="establecimiento">
          <div className="flex justify-end">
            <Button type="submit" className="bg-green-700 hover:bg-green-800" disabled={saving || loading}>
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </PermissionWrapper>
      </form>

      {/* Tooltip manual */}
      {activeTooltip === "datos-generales" && tooltipPosition && (
        <div
          className="fixed w-96 bg-white border border-gray-200 rounded-lg shadow-xl p-5 z-[9999]"
          style={{
            left: Math.max(10, Math.min(tooltipPosition.x - 200, window.innerWidth - 400)),
            top: Math.max(10, tooltipPosition.y - 200),
          }}
        >
          <div className="flex justify-between items-start mb-3">
            <h4 className="font-bold text-base text-gray-900 pr-2">Información básica del establecimiento</h4>
            <button
              onClick={() => setActiveTooltip(null)}
              className="text-gray-400 hover:text-gray-600 p-1 flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-gray-700 leading-relaxed">
              Registra los datos básicos de tu establecimiento agropecuario. El nombre es obligatorio y debe ser
              descriptivo para identificar fácilmente la ubicación.
            </p>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r">
              <p className="text-sm text-blue-800 font-medium mb-1">Coordenadas geográficas:</p>
              <p className="text-sm text-blue-700 leading-relaxed">
                Las coordenadas de latitud y longitud son opcionales pero recomendadas. Te permiten ubicar el
                establecimiento en mapas y realizar análisis geoespaciales. La latitud debe estar entre -90 y 90, y la
                longitud entre -180 y 180.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Overlay para cerrar tooltip al hacer clic fuera */}
      {activeTooltip && <div className="fixed inset-0 z-40" onClick={() => setActiveTooltip(null)} />}
    </div>
  )
}
