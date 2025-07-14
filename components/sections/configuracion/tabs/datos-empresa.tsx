"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useEstablishment } from "@/contexts/establishment-context"
import { HelpCircle, X } from "lucide-react"
import { PermissionWrapper } from "@/components/permission-wrapper"

interface EmpresaData {
  id: number
  nombre: string
  direccion: string
  razon_social: string
  ruc: string
  contacto_nombre: string
  email_contacto: string
  nro_tel_contac: number | null
}

export function DatosEmpresa() {
  const { toast } = useToast()
  const { empresaSeleccionada } = useEstablishment()

  const [formData, setFormData] = useState<EmpresaData>({
    id: 0,
    nombre: "",
    direccion: "",
    razon_social: "",
    ruc: "",
    contacto_nombre: "",
    email_contacto: "",
    nro_tel_contac: null,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null)

  // Cargar datos de la empresa cuando cambia la selección
  useEffect(() => {
    if (!empresaSeleccionada) {
      console.log("⚠️ No hay empresa seleccionada")
      return
    }

    const loadEmpresaData = async () => {
      try {
        setLoading(true)
        console.log("🏢 Cargando datos de empresa:", empresaSeleccionada)

        const response = await fetch(`/api/empresas/${empresaSeleccionada}`)

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Error al cargar datos")
        }

        const data = await response.json()
        console.log("✅ Datos de empresa cargados:", data.empresa)

        setFormData({
          id: data.empresa.id,
          nombre: data.empresa.nombre || "",
          direccion: data.empresa.direccion || "",
          razon_social: data.empresa.razon_social || "",
          ruc: data.empresa.ruc || "",
          contacto_nombre: data.empresa.contacto_nombre || "",
          email_contacto: data.empresa.email_contacto || "",
          nro_tel_contac: data.empresa.nro_tel_contac || null,
        })

        // Limpiar errores al cargar nuevos datos
        setErrors({})
      } catch (error) {
        console.error("❌ Error al cargar empresa:", error)
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Error al cargar datos de la empresa",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadEmpresaData()
  }, [empresaSeleccionada, toast])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.nombre.trim()) newErrors.nombre = "El nombre es requerido"
    if (!formData.ruc.trim()) newErrors.ruc = "El RUC es requerido"
    else if (!/^\d+-\d$/.test(formData.ruc)) newErrors.ruc = "Formato de RUC inválido (ej: 568-8, 5864897-8)"

    if (!formData.email_contacto.trim()) newErrors.email_contacto = "El email es requerido"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email_contacto)) {
      newErrors.email_contacto = "Formato de email inválido"
    }

    if (!formData.contacto_nombre.trim()) newErrors.contacto_nombre = "El nombre de contacto es requerido"

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
      console.log("💾 Guardando datos de empresa:", formData.id)

      const response = await fetch(`/api/empresas/${formData.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre: formData.nombre,
          direccion: formData.direccion,
          razon_social: formData.razon_social,
          ruc: formData.ruc,
          contacto_nombre: formData.contacto_nombre,
          email_contacto: formData.email_contacto,
          nro_tel_contac: formData.nro_tel_contac,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al guardar")
      }

      const result = await response.json()
      console.log("✅ Empresa guardada:", result.message)

      toast({
        title: "Guardado con éxito",
        description: "Los datos de la empresa han sido actualizados.",
      })

      // Disparar evento principal con todos los datos actualizados
      const event = new CustomEvent("companyDataChanged", {
        detail: {
          empresaId: formData.id.toString(),
          updatedData: {
            nombre: formData.nombre,
            direccion: formData.direccion,
            razon_social: formData.razon_social,
            ruc: formData.ruc,
            contacto_nombre: formData.contacto_nombre,
            email_contacto: formData.email_contacto,
            nro_tel_contac: formData.nro_tel_contac,
          },
          timestamp: Date.now(),
        },
      })
      window.dispatchEvent(event)

      // Disparar eventos adicionales para actualización inmediata de componentes específicos
      setTimeout(() => {
        // Evento para actualizar sidebar y selectores
        const sidebarEvent = new CustomEvent("updateCompanyName", {
          detail: {
            empresaId: formData.id.toString(),
            newName: formData.nombre,
          },
        })
        window.dispatchEvent(sidebarEvent)

        // Evento general para forzar re-render
        const forceUpdateEvent = new CustomEvent("forceComponentRefresh", {
          detail: {
            type: "company_data_updated",
            empresaId: formData.id.toString(),
            data: formData,
          },
        })
        window.dispatchEvent(forceUpdateEvent)
      }, 100)

      console.log("📡 Eventos de actualización disparados para empresa:", formData.nombre)
    } catch (error) {
      console.error("❌ Error al guardar empresa:", error)
      toast({
        title: "Error al guardar",
        description: error instanceof Error ? error.message : "Error al actualizar los datos",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: keyof EmpresaData, value: string | number | null) => {
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
          <p className="text-gray-600">Cargando datos de la empresa...</p>
        </div>
      </div>
    )
  }

  if (!empresaSeleccionada) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-gray-600">Selecciona una empresa para ver sus datos</p>
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
              <CardTitle>Datos Fiscales</CardTitle>
              <button
                type="button"
                className="text-gray-400 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full p-1 transition-colors relative"
                aria-label="Información sobre Datos Fiscales"
                onClick={(e) => handleTooltipToggle("datos-fiscales", e)}
              >
                <HelpCircle className="h-4 w-4" />
              </button>
            </div>
            <CardDescription>Información legal y fiscal de la empresa</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre *</Label>
                <PermissionWrapper
                  requirePermission="canEditConfig"
                  configType="empresa"
                  fallback={<Input id="nombre" value={formData.nombre} disabled={true} className="bg-gray-50" />}
                >
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => handleInputChange("nombre", e.target.value)}
                    className={errors.nombre ? "border-red-500" : ""}
                    disabled={saving}
                  />
                </PermissionWrapper>
                {errors.nombre && <p className="text-sm text-red-500">{errors.nombre}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="direccion">Dirección</Label>
                <PermissionWrapper
                  requirePermission="canEditConfig"
                  configType="empresa"
                  fallback={<Input id="direccion" value={formData.direccion} disabled={true} className="bg-gray-50" />}
                >
                  <Input
                    id="direccion"
                    value={formData.direccion}
                    onChange={(e) => handleInputChange("direccion", e.target.value)}
                    disabled={saving}
                  />
                </PermissionWrapper>
              </div>

              <div className="space-y-2">
                <Label htmlFor="razonSocial">Razón Social</Label>
                <PermissionWrapper
                  requirePermission="canEditConfig"
                  configType="empresa"
                  fallback={
                    <Input id="razonSocial" value={formData.razon_social} disabled={true} className="bg-gray-50" />
                  }
                >
                  <Input
                    id="razonSocial"
                    value={formData.razon_social}
                    onChange={(e) => handleInputChange("razon_social", e.target.value)}
                    disabled={saving}
                  />
                </PermissionWrapper>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ruc">RUC *</Label>
                <PermissionWrapper
                  requirePermission="canEditConfig"
                  configType="empresa"
                  fallback={<Input id="ruc" value={formData.ruc} disabled={true} className="bg-gray-50" />}
                >
                  <Input
                    id="ruc"
                    value={formData.ruc}
                    onChange={(e) => handleInputChange("ruc", e.target.value)}
                    placeholder="80000001-7"
                    className={errors.ruc ? "border-red-500" : ""}
                    disabled={saving}
                  />
                </PermissionWrapper>
                {errors.ruc && <p className="text-sm text-red-500">{errors.ruc}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>Contacto</CardTitle>
              <button
                type="button"
                className="text-gray-400 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full p-1 transition-colors relative"
                aria-label="Información sobre Contacto"
                onClick={(e) => handleTooltipToggle("contacto", e)}
              >
                <HelpCircle className="h-4 w-4" />
              </button>
            </div>
            <CardDescription>Información de contacto principal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactoNombre">Nombre de contacto *</Label>
                <PermissionWrapper
                  requirePermission="canEditConfig"
                  configType="empresa"
                  fallback={
                    <Input
                      id="contactoNombre"
                      value={formData.contacto_nombre}
                      disabled={true}
                      className="bg-gray-50"
                    />
                  }
                >
                  <Input
                    id="contactoNombre"
                    value={formData.contacto_nombre}
                    onChange={(e) => handleInputChange("contacto_nombre", e.target.value)}
                    className={errors.contacto_nombre ? "border-red-500" : ""}
                    disabled={saving}
                  />
                </PermissionWrapper>
                {errors.contacto_nombre && <p className="text-sm text-red-500">{errors.contacto_nombre}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="emailContacto">Email de contacto *</Label>
                <PermissionWrapper
                  requirePermission="canEditConfig"
                  configType="empresa"
                  fallback={
                    <Input
                      id="emailContacto"
                      type="email"
                      value={formData.email_contacto}
                      disabled={true}
                      className="bg-gray-50"
                    />
                  }
                >
                  <Input
                    id="emailContacto"
                    type="email"
                    value={formData.email_contacto}
                    onChange={(e) => handleInputChange("email_contacto", e.target.value)}
                    className={errors.email_contacto ? "border-red-500" : ""}
                    disabled={saving}
                  />
                </PermissionWrapper>
                {errors.email_contacto && <p className="text-sm text-red-500">{errors.email_contacto}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefonoContacto">Teléfono de contacto</Label>
                <PermissionWrapper
                  requirePermission="canEditConfig"
                  configType="empresa"
                  fallback={
                    <Input
                      id="telefonoContacto"
                      type="number"
                      value={formData.nro_tel_contac || ""}
                      disabled={true}
                      className="bg-gray-50"
                    />
                  }
                >
                  <Input
                    id="telefonoContacto"
                    type="number"
                    value={formData.nro_tel_contac || ""}
                    onChange={(e) =>
                      handleInputChange("nro_tel_contac", e.target.value ? Number.parseInt(e.target.value) : null)
                    }
                    disabled={saving}
                  />
                </PermissionWrapper>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botón Guardar - solo para usuarios que pueden editar */}
        <PermissionWrapper requirePermission="canEditConfig" configType="empresa">
          <div className="flex justify-end">
            <Button type="submit" className="bg-green-700 hover:bg-green-800" disabled={saving || loading}>
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </PermissionWrapper>
      </form>

      {/* Tooltips manuales */}
      {activeTooltip === "datos-fiscales" && tooltipPosition && (
        <div
          className="fixed w-96 bg-white border border-gray-200 rounded-lg shadow-xl p-5 z-[9999]"
          style={{
            left: Math.max(10, Math.min(tooltipPosition.x - 200, window.innerWidth - 400)),
            top: Math.max(10, tooltipPosition.y - 200),
          }}
        >
          <div className="flex justify-between items-start mb-3">
            <h4 className="font-bold text-base text-gray-900 pr-2">Información legal y fiscal de la empresa</h4>
            <button
              onClick={() => setActiveTooltip(null)}
              className="text-gray-400 hover:text-gray-600 p-1 flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-gray-700 leading-relaxed">
              Registra los datos oficiales de tu empresa que aparecerán en reportes y documentos legales. Esta
              información es fundamental para la identificación fiscal y legal de tu organización.
            </p>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r">
              <p className="text-sm text-blue-800 font-medium mb-1">Campos importantes:</p>
              <p className="text-sm text-blue-700 leading-relaxed">
                El RUC debe tener el formato correcto (ej: 80000001-7) y es obligatorio para operaciones fiscales. El
                nombre y RUC aparecerán en todos los reportes oficiales del sistema.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTooltip === "contacto" && tooltipPosition && (
        <div
          className="fixed w-96 bg-white border border-gray-200 rounded-lg shadow-xl p-5 z-[9999]"
          style={{
            left: Math.max(10, Math.min(tooltipPosition.x - 200, window.innerWidth - 400)),
            top: Math.max(10, tooltipPosition.y - 200),
          }}
        >
          <div className="flex justify-between items-start mb-3">
            <h4 className="font-bold text-base text-gray-900 pr-2">Información de contacto principal</h4>
            <button
              onClick={() => setActiveTooltip(null)}
              className="text-gray-400 hover:text-gray-600 p-1 flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-gray-700 leading-relaxed">
              Datos de la persona responsable de la empresa. Esta información se utilizará para comunicaciones
              oficiales, notificaciones del sistema y contacto en caso de soporte técnico.
            </p>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r">
              <p className="text-sm text-blue-800 font-medium mb-1">Uso de la información:</p>
              <p className="text-sm text-blue-700 leading-relaxed">
                El email será usado para notificaciones importantes del sistema, recuperación de contraseñas y
                comunicaciones oficiales. Asegúrate de que sea una dirección activa y monitoreada.
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
