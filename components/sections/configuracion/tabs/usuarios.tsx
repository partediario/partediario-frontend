"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Users, Plus, Edit, Phone, Calendar, Building, HelpCircle, X, Mail, Shield, Trash2 } from "lucide-react"
import { UsuarioDrawer } from "../components/usuario-drawer"
import { useEstablishment } from "@/contexts/establishment-context"
import { useUser } from "@/contexts/user-context"
import { usePermissions } from "@/hooks/use-permissions"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Usuario {
  id: string
  nombres: string
  apellidos: string
  telefono: string
  email: string
  empresa_id: number
  establecimientos: Array<{
    id: number
    nombre: string
  }>
  rol: string
  rol_id: number
  is_owner?: boolean
  created_at: string
  last_sign_in?: string
}

export function Usuarios() {
  const { toast } = useToast()
  const { empresaSeleccionada } = useEstablishment()
  const { usuario } = useUser()
  const permissions = usePermissions()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create")
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null)
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [usuarioToDelete, setUsuarioToDelete] = useState<Usuario | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchUsuarios = async () => {
    if (!empresaSeleccionada) {
      console.log("⚠️ No empresa seleccionada")
      setUsuarios([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      console.log("🔍 Fetching usuarios for empresa:", empresaSeleccionada)

      const response = await fetch(`/api/usuarios-empresa?empresaId=${empresaSeleccionada}`)
      const data = await response.json()

      console.log("📡 API Response:", data)

      if (response.ok && data.success) {
        console.log("✅ Usuarios loaded:", data.usuarios?.length || 0)
        console.log("📊 Raw usuarios data:", data.usuarios)

        const usuariosProcesados = (data.usuarios || []).map((usuario: any) => ({
          id: usuario.id,
          nombres: usuario.nombres,
          apellidos: usuario.apellidos,
          telefono: usuario.telefono,
          email: usuario.email,
          empresa_id: usuario.empresa_id,
          establecimientos: usuario.establecimientos || [],
          rol: usuario.rol,
          rol_id: usuario.rol_id,
          is_owner: usuario.is_owner || false,
          created_at: usuario.created_at,
          last_sign_in: usuario.last_sign_in,
        }))

        const usuariosOrdenados = usuariosProcesados.sort((a, b) => {
          const fechaA = new Date(a.created_at)
          const fechaB = new Date(b.created_at)
          return fechaA.getTime() - fechaB.getTime()
        })

        console.log(
          "📊 Usuarios procesados con is_owner:",
          usuariosOrdenados.map((u) => ({
            nombre: `${u.nombres} ${u.apellidos}`,
            is_owner: u.is_owner,
            created_at: u.created_at,
            rol: u.rol,
            establecimientos: u.establecimientos.length,
          })),
        )

        setUsuarios(usuariosOrdenados)
      } else {
        console.error("❌ Error fetching usuarios:", data.error)
        toast({
          title: "Error",
          description: data.error || "No se pudieron cargar los usuarios",
          variant: "destructive",
        })
        setUsuarios([])
      }
    } catch (error) {
      console.error("❌ Error fetching usuarios:", error)
      toast({
        title: "Error",
        description: "Error al conectar con el servidor",
        variant: "destructive",
      })
      setUsuarios([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    console.log("🔄 Empresa seleccionada changed:", empresaSeleccionada)
    fetchUsuarios()
  }, [empresaSeleccionada])

  const handleCreateUsuario = () => {
    setSelectedUsuario(null)
    setDrawerMode("create")
    setDrawerOpen(true)
  }

  const handleEditUsuario = (usuario: Usuario) => {
    setSelectedUsuario(usuario)
    setDrawerMode("edit")
    setDrawerOpen(true)
  }

  const handleDeleteUsuario = (usuario: Usuario) => {
    setUsuarioToDelete(usuario)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteUsuario = async () => {
    if (!usuarioToDelete || !empresaSeleccionada || !usuario?.id) return

    setDeleting(true)

    try {
      const response = await fetch("/api/eliminar-usuario", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usuarioId: usuarioToDelete.id,
          empresaId: empresaSeleccionada,
          usuarioEliminadorId: usuario.id,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast({
          title: "Usuario eliminado",
          description: data.message,
          variant: "default",
        })
        fetchUsuarios()
      } else {
        toast({
          title: "Error",
          description: data.error || "No se pudo eliminar el usuario",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("❌ Error al eliminar usuario:", error)
      toast({
        title: "Error",
        description: "Error al conectar con el servidor",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
      setUsuarioToDelete(null)
    }
  }

  const handleDrawerSuccess = () => {
    fetchUsuarios()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-PY", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const formatPhone = (phone: string) => {
    if (!phone || phone === "Sin teléfono" || phone === null) return "Sin teléfono"

    const cleanPhone = phone.replace(/[\s\-$$$$]/g, "")

    if (cleanPhone.startsWith("+595")) {
      const number = cleanPhone.substring(4)
      if (number.length >= 9) {
        return `+595 ${number.substring(0, 3)}-${number.substring(3, 6)}-${number.substring(6)}`
      }
    }

    if (cleanPhone.startsWith("595") && cleanPhone.length >= 12) {
      const number = cleanPhone.substring(3)
      return `+595 ${number.substring(0, 3)}-${number.substring(3, 6)}-${number.substring(6)}`
    }

    if (cleanPhone.startsWith("09") && cleanPhone.length === 10) {
      const number = cleanPhone.substring(1)
      return `+595 ${number.substring(0, 3)}-${number.substring(3, 6)}-${number.substring(6)}`
    }

    return phone
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

  console.log("🏢 Empresa seleccionada:", empresaSeleccionada)
  console.log("👥 Usuarios count:", usuarios.length)

  if (!empresaSeleccionada) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Building className="w-16 h-16 text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Selecciona una empresa</h3>
        <p className="text-gray-500 text-center max-w-md">Debes seleccionar una empresa para gestionar sus usuarios</p>
      </div>
    )
  }

  return (
    <div className="relative space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h2>
          <p className="text-gray-600">Administra los usuarios del sistema y sus permisos de acceso</p>
        </div>
        {!permissions.isConsultor && (
          <Button onClick={handleCreateUsuario} className="bg-green-700 hover:bg-green-800">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Usuario
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Usuarios Registrados
            </CardTitle>
            <button
              type="button"
              className="text-gray-400 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full p-1 transition-colors relative"
              aria-label="Información sobre Usuarios Registrados"
              onClick={(e) => handleTooltipToggle("usuarios-registrados", e)}
            >
              <HelpCircle className="h-4 w-4" />
            </button>
          </div>
          <CardDescription>Lista de usuarios únicos de la empresa seleccionada</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              <span className="ml-2 text-gray-600">Cargando usuarios...</span>
            </div>
          ) : usuarios.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay usuarios registrados</h3>
              <p className="text-gray-500 mb-4">Comienza creando el primer usuario de la empresa</p>
              {!permissions.isConsultor && (
                <Button onClick={handleCreateUsuario} className="bg-green-700 hover:bg-green-800">
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Primer Usuario
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Usuario</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Teléfono</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Rol</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Establecimientos</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Fecha Creación</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((usuario, index) => (
                    <tr key={`usuario-${usuario.id}-${index}`} className="border-b hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">
                              {usuario.nombres} {usuario.apellidos}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700">{usuario.email}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span>{formatPhone(usuario.telefono)}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Shield className={`w-4 h-4 ${usuario.is_owner ? "text-amber-500" : "text-blue-500"}`} />
                          <Badge variant="secondary" className="text-xs">
                            {usuario.rol}
                          </Badge>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1">
                          {usuario.establecimientos && usuario.establecimientos.length > 0 ? (
                            usuario.establecimientos.map((establecimiento) => (
                              <Badge key={establecimiento.id} variant="outline" className="text-xs">
                                {establecimiento.nombre}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-gray-400 text-sm">Sin asignar</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>{formatDate(usuario.created_at)}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          {!permissions.isConsultor && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditUsuario(usuario)}
                                className="text-gray-600 hover:text-gray-900"
                                title="Editar usuario"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteUsuario(usuario)}
                                className="text-red-600 hover:text-red-900 hover:bg-red-50"
                                title="Eliminar usuario"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <UsuarioDrawer
        usuario={selectedUsuario}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSuccess={handleDrawerSuccess}
        mode={drawerMode}
        empresaId={empresaSeleccionada?.toString() || ""}
        usuarioCreadorId={usuario?.id || "current-user-id"}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de eliminar este usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              {usuarioToDelete && (
                <div className="space-y-3 mt-4">
                  <div className="text-gray-700">
                    Estás a punto de eliminar al usuario:{" "}
                    <span className="font-semibold">
                      {usuarioToDelete.nombres} {usuarioToDelete.apellidos}
                    </span>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <div className="text-sm text-amber-800">
                      <strong>Importante:</strong> Si este usuario solo pertenece a esta empresa, se eliminará
                      completamente del sistema. Si pertenece a otras empresas, solo se eliminará su acceso a esta
                      empresa.
                    </div>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteUsuario}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? "Eliminando..." : "Eliminar Usuario"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {activeTooltip === "usuarios-registrados" && tooltipPosition && (
        <div
          className="fixed w-96 bg-white border border-gray-200 rounded-lg shadow-xl p-5 z-[9999]"
          style={{
            left: Math.max(10, Math.min(tooltipPosition.x - 200, window.innerWidth - 400)),
            top: Math.max(10, tooltipPosition.y - 200),
          }}
        >
          <div className="flex justify-between items-start mb-3">
            <h4 className="font-bold text-base text-gray-900 pr-2">Lista de usuarios de la empresa</h4>
            <button
              onClick={() => setActiveTooltip(null)}
              className="text-gray-400 hover:text-gray-600 p-1 flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-gray-700 leading-relaxed">
              Aquí se muestran todos los usuarios registrados en esta empresa. Cada usuario puede tener acceso a uno o
              varios establecimientos según sus responsabilidades y rol asignado.
            </p>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r">
              <p className="text-sm text-blue-800 font-medium mb-1">Funciones de los usuarios:</p>
              <p className="text-sm text-blue-700 leading-relaxed">
                Los usuarios pueden registrar partes diarios, consultar reportes y gestionar información según sus
                permisos asignados por rol. Cada usuario debe estar asignado a al menos un establecimiento para poder
                trabajar en el sistema.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTooltip && <div className="fixed inset-0 z-40" onClick={() => setActiveTooltip(null)} />}
    </div>
  )
}
