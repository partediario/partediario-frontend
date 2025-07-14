"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useEstablishment } from "@/contexts/establishment-context"
import { User, Mail, Lock, Shield, Loader2, Eye, EyeOff, Phone, KeyRound } from "lucide-react"

interface Usuario {
  id: string
  nombres: string
  apellidos: string
  telefono: string
  email: string
  empresa_id: number
  establecimiento_id?: number
  rol: string
  rol_id: number
  is_owner?: boolean
  created_at: string
}

interface Rol {
  id: number
  nombre: string
}

interface UsuarioDrawerProps {
  usuario: Usuario | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  mode: "create" | "edit"
  empresaId: string
  usuarioCreadorId: string
}

export function UsuarioDrawer({
  usuario,
  isOpen,
  onClose,
  onSuccess,
  mode,
  empresaId,
  usuarioCreadorId,
}: UsuarioDrawerProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [roles, setRoles] = useState<Rol[]>([])
  const [loadingRoles, setLoadingRoles] = useState(false)
  const { establecimientoSeleccionado } = useEstablishment()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    nombres: "",
    apellidos: "",
    email: "",
    telefono: "",
    password: "",
    confirmPassword: "",
    rolId: "",
  })

  const [loadingPassword, setLoadingPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false)
  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmNewPassword: "",
  })

  // Cargar roles
  const fetchRoles = async () => {
    try {
      setLoadingRoles(true)
      const response = await fetch("/api/roles")
      const data = await response.json()

      if (response.ok && data.success) {
        setRoles(data.roles || [])
      } else {
        console.error("Error fetching roles:", data.error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los roles",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching roles:", error)
      toast({
        title: "Error",
        description: "Error al conectar con el servidor para obtener roles",
        variant: "destructive",
      })
    } finally {
      setLoadingRoles(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchRoles()
    }
  }, [isOpen])

  // Resetear formulario cuando cambia el usuario o modo
  useEffect(() => {
    if (mode === "edit" && usuario) {
      setFormData({
        nombres: usuario.nombres || "",
        apellidos: usuario.apellidos || "",
        email: usuario.email || "",
        telefono: usuario.telefono || "",
        password: "",
        confirmPassword: "",
        rolId: usuario.rol_id?.toString() || "",
      })
    } else {
      setFormData({
        nombres: "",
        apellidos: "",
        email: "",
        telefono: "",
        password: "",
        confirmPassword: "",
        rolId: "",
      })
    }

    // Resetear datos de contraseña
    setPasswordData({
      newPassword: "",
      confirmNewPassword: "",
    })
  }, [usuario, mode, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nombres.trim() || !formData.apellidos.trim()) {
      toast({
        title: "Error",
        description: "Nombres y apellidos son requeridos",
        variant: "destructive",
      })
      return
    }

    if (mode === "create") {
      if (!formData.email.trim()) {
        toast({
          title: "Error",
          description: "El email es requerido para crear un usuario",
          variant: "destructive",
        })
        return
      }

      if (!formData.telefono.trim()) {
        toast({
          title: "Error",
          description: "El teléfono es requerido para crear un usuario",
          variant: "destructive",
        })
        return
      }

      if (!formData.password.trim()) {
        toast({
          title: "Error",
          description: "La contraseña es requerida",
          variant: "destructive",
        })
        return
      }

      if (formData.password !== formData.confirmPassword) {
        toast({
          title: "Error",
          description: "Las contraseñas no coinciden",
          variant: "destructive",
        })
        return
      }

      if (formData.password.length < 6) {
        toast({
          title: "Error",
          description: "La contraseña debe tener al menos 6 caracteres",
          variant: "destructive",
        })
        return
      }

      if (!formData.rolId) {
        toast({
          title: "Error",
          description: "Debe seleccionar un rol",
          variant: "destructive",
        })
        return
      }

      // Verificar que hay un establecimiento seleccionado
      if (!establecimientoSeleccionado) {
        toast({
          title: "Error",
          description: "Debe seleccionar un establecimiento antes de crear un usuario",
          variant: "destructive",
        })
        return
      }
    } else {
      // En modo edición, validar que se seleccione un rol (solo si no es owner)
      if (!usuario?.is_owner && !formData.rolId) {
        toast({
          title: "Error",
          description: "Debe seleccionar un rol",
          variant: "destructive",
        })
        return
      }
    }

    try {
      setLoading(true)

      if (mode === "create") {
        console.log("🔄 Creando usuario con datos:", {
          nombres: formData.nombres.trim(),
          apellidos: formData.apellidos.trim(),
          email: formData.email.trim(),
          telefono: formData.telefono.trim(),
          rolId: formData.rolId,
          empresaId,
          usuarioCreadorId,
          establecimientoId: establecimientoSeleccionado,
        })

        // Crear nuevo usuario
        const response = await fetch("/api/crear-usuario-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: formData.email.trim(),
            password: formData.password,
            nombres: formData.nombres.trim(),
            apellidos: formData.apellidos.trim(),
            telefono: formData.telefono.trim(),
            rolId: formData.rolId,
            empresaId,
            usuarioCreadorId,
            establecimientoId: establecimientoSeleccionado,
          }),
        })

        const data = await response.json()

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Error al crear usuario")
        }

        toast({
          title: "Usuario creado exitosamente",
          description: `${formData.nombres} ${formData.apellidos} ha sido creado. Revise el email ${formData.email} para validar su cuenta.`,
        })
      } else {
        // Editar usuario existente
        if (!usuario) return

        const updateData: any = {
          nombres: formData.nombres.trim(),
          apellidos: formData.apellidos.trim(),
        }

        // Solo incluir rolId si el usuario NO es owner
        if (!usuario.is_owner) {
          updateData.rolId = formData.rolId
        }

        const response = await fetch(`/api/editar-usuario/${usuario.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        })

        const data = await response.json()

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Error al actualizar usuario")
        }

        toast({
          title: "Usuario actualizado",
          description: `Los datos de ${formData.nombres} ${formData.apellidos} han sido actualizados`,
        })
      }

      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error saving user:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const formatPhoneForDisplay = (phone: string) => {
    if (!phone) return "Sin teléfono"

    // Limpiar el número de espacios, guiones y otros caracteres
    const cleanPhone = phone.replace(/[\s\-$$$$]/g, "")

    // Si empieza con +595
    if (cleanPhone.startsWith("+595")) {
      const number = cleanPhone.substring(4)
      if (number.length >= 9) {
        return `+595 ${number.substring(0, 3)}-${number.substring(3, 6)}-${number.substring(6)}`
      }
    }

    // Si empieza con 595 sin el +
    if (cleanPhone.startsWith("595") && cleanPhone.length >= 12) {
      const number = cleanPhone.substring(3)
      return `+595 ${number.substring(0, 3)}-${number.substring(3, 6)}-${number.substring(6)}`
    }

    // Si es un número local que empieza con 09
    if (cleanPhone.startsWith("09") && cleanPhone.length === 10) {
      const number = cleanPhone.substring(1) // Quitar el 0
      return `+595 ${number.substring(0, 3)}-${number.substring(3, 6)}-${number.substring(6)}`
    }

    return phone
  }

  const handlePasswordChange = async () => {
    if (!usuario) {
      toast({
        title: "Error",
        description: "No hay usuario seleccionado",
        variant: "destructive",
      })
      return
    }

    if (!passwordData.newPassword.trim()) {
      toast({
        title: "Error",
        description: "La nueva contraseña es requerida",
        variant: "destructive",
      })
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 6 caracteres",
        variant: "destructive",
      })
      return
    }

    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive",
      })
      return
    }

    try {
      setLoadingPassword(true)

      console.log("🔄 [CLIENT] Iniciando cambio de contraseña...")
      console.log("📧 [CLIENT] Email:", usuario.email)
      console.log("🔑 [CLIENT] Nueva contraseña:", passwordData.newPassword ? "***" : "vacía")

      const response = await fetch("/api/cambiar-contrasena", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          p_email: usuario.email,
          p_nueva_contrasena: passwordData.newPassword,
        }),
      })

      console.log("📡 [CLIENT] Response status:", response.status)
      console.log("📡 [CLIENT] Response ok:", response.ok)

      const data = await response.json()
      console.log("📡 [CLIENT] Response data:", data)

      if (!response.ok || !data.success) {
        console.error("❌ [CLIENT] Error response:", data)
        throw new Error(data.error || "Error al cambiar la contraseña")
      }

      toast({
        title: "Contraseña actualizada",
        description: `La contraseña para ${usuario.email} ha sido cambiada exitosamente`,
      })

      // Resetear campos de contraseña
      setPasswordData({
        newPassword: "",
        confirmNewPassword: "",
      })
    } catch (error) {
      console.error("❌ [CLIENT] Error changing password:", error)
      toast({
        title: "Error al cambiar contraseña",
        description: error instanceof Error ? error.message : "Error desconocido al cambiar la contraseña",
        variant: "destructive",
      })
    } finally {
      setLoadingPassword(false)
    }
  }

  // Si no hay usuario en modo edición, no renderizar nada
  if (mode === "edit" && !usuario) {
    return null
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-green-600" />
            {mode === "create" ? "Nuevo Usuario" : "Editar Usuario"}
          </SheetTitle>
          <SheetDescription>
            {mode === "create"
              ? "Crea un nuevo usuario con acceso por email y contraseña"
              : "Modifica los datos del usuario (email y teléfono no se pueden cambiar)"}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* Datos Personales */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <User className="w-4 h-4" />
              Datos Personales
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombres">Nombres *</Label>
                <Input
                  id="nombres"
                  value={formData.nombres}
                  onChange={(e) => setFormData((prev) => ({ ...prev, nombres: e.target.value }))}
                  placeholder="Ej: Juan Carlos"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="apellidos">Apellidos *</Label>
                <Input
                  id="apellidos"
                  value={formData.apellidos}
                  onChange={(e) => setFormData((prev) => ({ ...prev, apellidos: e.target.value }))}
                  placeholder="Ej: González Pérez"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Información de Contacto */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Información de Contacto
            </h4>

            <div className="space-y-2">
              <Label htmlFor="email">Email {mode === "create" ? "*" : "(no se puede modificar)"}</Label>
              {mode === "create" ? (
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="usuario@ejemplo.com"
                  disabled={loading}
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-md border">
                  <span className="text-gray-700">{formData.email}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono {mode === "create" ? "*" : "(no se puede modificar)"}</Label>
              {mode === "create" ? (
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) => setFormData((prev) => ({ ...prev, telefono: e.target.value }))}
                  placeholder="0987123456 o +595987123456"
                  disabled={loading}
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-md border flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700">{formatPhoneForDisplay(formData.telefono)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Cambiar Contraseña (solo para editar) */}
          {mode === "edit" && usuario && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <KeyRound className="w-4 h-4" />
                Cambiar Contraseña
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nueva Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))}
                      placeholder="Mínimo 6 caracteres"
                      disabled={loadingPassword}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      disabled={loadingPassword}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmNewPassword">Confirmar Nueva Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="confirmNewPassword"
                      type={showConfirmNewPassword ? "text" : "password"}
                      value={passwordData.confirmNewPassword}
                      onChange={(e) => setPasswordData((prev) => ({ ...prev, confirmNewPassword: e.target.value }))}
                      placeholder="Repita la nueva contraseña"
                      disabled={loadingPassword}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                      disabled={loadingPassword}
                    >
                      {showConfirmNewPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handlePasswordChange}
                disabled={loadingPassword || !passwordData.newPassword || !passwordData.confirmNewPassword}
                className="w-full bg-transparent"
              >
                {loadingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Cambiando contraseña...
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4 mr-2" />
                    Cambiar Contraseña
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Contraseña (solo para crear) */}
          {mode === "create" && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Credenciales de Acceso
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                      placeholder="Mínimo 6 caracteres"
                      disabled={loading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Repita su contraseña"
                      disabled={loading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={loading}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Rol */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Shield className={`w-4 h-4 ${usuario?.is_owner ? "text-amber-500" : "text-blue-500"}`} />
              Permisos y Rol
            </h4>

            <div className="space-y-2">
              <Label htmlFor="rol">Rol *</Label>
              {usuario?.is_owner && (
                <div className="mb-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
                  <p className="text-sm text-amber-800 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-amber-600" />
                    Este es el usuario administrador principal del sistema. Su rol no puede ser modificado.
                  </p>
                </div>
              )}
              <Select
                value={formData.rolId}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, rolId: value }))}
                disabled={loading || loadingRoles || usuario?.is_owner}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingRoles ? "Cargando roles..." : "Seleccionar rol"} />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((rol) => (
                    <SelectItem key={rol.id} value={rol.id.toString()}>
                      {rol.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={loading || (mode === "create" && !establecimientoSeleccionado)}
              className="flex-1 bg-green-700 hover:bg-green-800"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {mode === "create" ? "Creando..." : "Guardando..."}
                </>
              ) : (
                <>{mode === "create" ? "Crear Usuario" : "Guardar Cambios"}</>
              )}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
