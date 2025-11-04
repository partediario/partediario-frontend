"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Building2, X, AlertCircle, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/contexts/user-context"

interface AgregarEmpresaDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AgregarEmpresaDrawer({ isOpen, onClose, onSuccess }: AgregarEmpresaDrawerProps) {
  const { toast } = useToast()
  const { usuario } = useUser()

  const [loading, setLoading] = useState(false)
  const [mostrarExito, setMostrarExito] = useState(false)
  const [formData, setFormData] = useState({
    nombre: "",
    razon_social: "",
    ruc: "",
    direccion: "",
    contacto_nombre: "",
    email_contacto: "",
    nro_tel_contac: "",
  })
  const [errors, setErrors] = useState<string[]>([])

  useEffect(() => {
    if (isOpen) {
      setFormData({
        nombre: "",
        razon_social: "",
        ruc: "",
        direccion: "",
        contacto_nombre: "",
        email_contacto: "",
        nro_tel_contac: "",
      })
      setErrors([])
      setMostrarExito(false)
    }
  }, [isOpen])

  const validateForm = () => {
    const newErrors: string[] = []

    if (!formData.nombre.trim()) {
      newErrors.push("El nombre de la empresa es requerido")
    } else if (formData.nombre.trim().length < 3) {
      newErrors.push("El nombre debe tener al menos 3 caracteres")
    }

    if (!usuario?.id) {
      newErrors.push("No hay usuario logueado")
    }

    setErrors(newErrors)
    return newErrors.length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      const response = await fetch("/api/empresas-create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          usuario_id: usuario?.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al crear empresa")
      }

      setMostrarExito(true)

      setTimeout(() => {
        toast({
          title: "✅ Empresa creada",
          description: `Se creó la empresa "${formData.nombre}" correctamente con un establecimiento por defecto`,
          duration: 4000,
        })
      }, 500)

      setTimeout(() => {
        onSuccess()
        onClose()
      }, 2000)
    } catch (error) {
      console.error("Error creating empresa:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al crear empresa",
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
            <Building2 className="w-5 h-5 text-green-600" />
            Nueva Empresa
          </DrawerTitle>
          <button onClick={cancelar} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {mostrarExito && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <div className="font-medium text-green-800 mb-2">¡Empresa creada exitosamente!</div>
                <div className="text-sm text-green-700">
                  Se creó la empresa "{formData.nombre}" con un establecimiento por defecto y se asignó al usuario como
                  propietario.
                </div>
              </AlertDescription>
            </Alert>
          )}

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

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Datos Fiscales</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nombre" className="text-sm font-medium text-gray-700">
                  Nombre *
                </Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData((prev) => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Nombre de la empresa"
                  disabled={loading}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="direccion" className="text-sm font-medium text-gray-700">
                  Dirección
                </Label>
                <Input
                  id="direccion"
                  value={formData.direccion}
                  onChange={(e) => setFormData((prev) => ({ ...prev, direccion: e.target.value }))}
                  placeholder="Dirección"
                  disabled={loading}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="razon_social" className="text-sm font-medium text-gray-700">
                  Razón Social
                </Label>
                <Input
                  id="razon_social"
                  value={formData.razon_social}
                  onChange={(e) => setFormData((prev) => ({ ...prev, razon_social: e.target.value }))}
                  placeholder="Razón Social"
                  disabled={loading}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="ruc" className="text-sm font-medium text-gray-700">
                  RUC
                </Label>
                <Input
                  id="ruc"
                  value={formData.ruc}
                  onChange={(e) => setFormData((prev) => ({ ...prev, ruc: e.target.value }))}
                  placeholder="RUC"
                  disabled={loading}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Contacto</h3>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="contacto_nombre" className="text-sm font-medium text-gray-700">
                  Nombre de contacto
                </Label>
                <Input
                  id="contacto_nombre"
                  value={formData.contacto_nombre}
                  onChange={(e) => setFormData((prev) => ({ ...prev, contacto_nombre: e.target.value }))}
                  placeholder="Nombre"
                  disabled={loading}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="email_contacto" className="text-sm font-medium text-gray-700">
                  Email de contacto
                </Label>
                <Input
                  id="email_contacto"
                  type="email"
                  value={formData.email_contacto}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email_contacto: e.target.value }))}
                  placeholder="email@ejemplo.com"
                  disabled={loading}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="nro_tel_contac" className="text-sm font-medium text-gray-700">
                  Teléfono de contacto
                </Label>
                <Input
                  id="nro_tel_contac"
                  value={formData.nro_tel_contac}
                  onChange={(e) => setFormData((prev) => ({ ...prev, nro_tel_contac: e.target.value }))}
                  placeholder="Teléfono"
                  disabled={loading}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t p-6 flex gap-3 justify-end">
          <Button onClick={cancelar} variant="outline">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-red-600 hover:bg-red-700">
            {loading ? "Creando..." : "Crear Empresa"}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
