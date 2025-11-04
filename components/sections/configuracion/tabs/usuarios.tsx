"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Users, Plus, Edit, Building, HelpCircle, X, Mail, Shield, Trash2, Eye } from "lucide-react"
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
import { UsuarioViewDrawer } from "../components/usuario-view-drawer"

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
  const { empresas, empresaSeleccionada } = useEstablishment()
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
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false)
  const [viewUsuario, setViewUsuario] = useState<Usuario | null>(null)

  const fetchUsuarios = async () => {
    if (!empresas || empresas.length === 0) {
      console.log("⚠️ No hay empresas disponibles")
      setUsuarios([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const empresasIds = empresas.map((e) => e.empresa_id).join(",")
      console.log("🔍 Fetching usuarios for empresas:", empresasIds)

      const response = await fetch(`/api/usuarios-empresa?empresasIds=${empresasIds}`)
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
    console.log("🔄 Empresas disponibles changed:", empresas?.length)
    fetchUsuarios()
  }, [empresas])

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
    if (!usuarioToDelete || !empresas || empresas.length === 0 || !usuario?.id) return

    setDeleting(true)

    try {
      // Obtener IDs de todas las empresas del administrador
      const empresasIds = empresas.map((e) => e.empresa_id)

      const response = await fetch("/api/eliminar-usuario-completo", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usuarioId: usuarioToDelete.id,
          empresasIds: empresasIds,
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

  const handleViewUsuario = (usuario: Usuario) => {
    setViewUsuario(usuario)
    setViewDrawerOpen(true)
  }

  const canDeleteUsuario = (usuarioAEliminar: Usuario): boolean => {
    if (usuario?.id === usuarioAEliminar.id) {
      return false
    }

    if (usuarioAEliminar.is_owner) {
      return false
    }

    return true
  }

  console.log("🏢 Empresas disponibles:", empresas?.length)
  console.log("👥 Usuarios count:", usuarios.length)

  if (!empresas || empresas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Building className="w-16 h-16 text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay empresas disponibles</h3>
        <p className="text-gray-500 text-center max-w-md">No tienes acceso a ninguna empresa en el sistema</p>
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
          <CardDescription>Lista de usuarios de todas tus empresas</CardDescription>
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
                            <button
                              onClick={() => handleViewUsuario(usuario)}
                              className="font-semibold text-gray-900 hover:text-blue-600 transition-colors text-left"
                            >
                              {usuario.nombres} {usuario.apellidos}
                            </button>
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
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewUsuario(usuario)}
                            className="text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                            title="Ver detalles del usuario"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
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
                              {canDeleteUsuario(usuario) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteUsuario(usuario)}
                                  className="text-red-600 hover:text-red-900 hover:bg-red-50"
                                  title="Eliminar usuario"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
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
        empresaId={empresaSeleccionada?.toString() || (empresas.length > 0 ? empresas[0].empresa_id : "")}
        usuarioCreadorId={usuario?.id || "current-user-id"}
      />

      <UsuarioViewDrawer usuario={viewUsuario} isOpen={viewDrawerOpen} onClose={() => setViewDrawerOpen(false)} />

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
                      <strong>Importante:</strong> Se eliminarán todas las asignaciones de este usuario en todas tus
                      empresas. Si el usuario tiene asignaciones en otras empresas a las que no tienes acceso, mantendrá
                      su acceso a esas empresas.
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

      {activeTooltip === "roles-info" && tooltipPosition && (
        <div
          className="fixed w-[500px] max-h-[600px] overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-xl p-5 z-[9999]"
          style={{
            left: Math.max(10, Math.min(tooltipPosition.x - 250, window.innerWidth - 520)),
            top: Math.max(10, tooltipPosition.y - 100),
          }}
        >
          <div className="flex justify-between items-start mb-3">
            <h4 className="font-bold text-base text-gray-900 pr-2">Roles de Usuario</h4>
            <button
              onClick={() => setActiveTooltip(null)}
              className="text-gray-400 hover:text-gray-600 p-1 flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="text-sm text-gray-700 leading-relaxed mb-4">
            Cada rol tiene diferentes niveles de acceso y permisos en el sistema. Seleccione el rol apropiado según las
            responsabilidades del usuario.
          </p>

          <div className="space-y-4">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <h5 className="font-bold text-blue-900">Administrador</h5>
              </div>
              <p className="text-sm text-blue-800 mb-2">Control total del sistema y gestión de usuarios.</p>
              <div className="text-sm text-blue-700 space-y-1">
                <p className="font-medium">Permisos:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Acceso completo a todos los módulos</li>
                  <li>Crear, editar y eliminar usuarios</li>
                  <li>Gestionar configuración de empresa y establecimientos</li>
                  <li>Ver y editar todos los dashboards (Partes Diarios, Movimientos, Clima, Insumos)</li>
                  <li>Agregar y editar todos los tipos de registros</li>
                  <li>Generar y exportar todos los reportes</li>
                </ul>
              </div>
            </div>

            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-green-600" />
                <h5 className="font-bold text-green-900">Gerente</h5>
              </div>
              <p className="text-sm text-green-800 mb-2">
                Gestión operativa completa sin acceso a administración de usuarios.
              </p>
              <div className="text-sm text-green-700 space-y-1">
                <p className="font-medium">Permisos:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Ver y editar todos los dashboards (Partes Diarios, Movimientos, Clima, Insumos)</li>
                  <li>Ver configuración (empresa, establecimientos)</li>
                  <li>NO puede ver ni editar usuarios</li>
                  <li>Agregar y editar todos los tipos de registros (movimientos, actividades, clima, insumos)</li>
                  <li>Generar y exportar reportes</li>
                </ul>
              </div>
            </div>

            <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-r">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-purple-600" />
                <h5 className="font-bold text-purple-900">Consultor</h5>
              </div>
              <p className="text-sm text-purple-800 mb-2">Solo lectura y generación de reportes.</p>
              <div className="text-sm text-purple-700 space-y-1">
                <p className="font-medium">Permisos:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Ver dashboards de Movimientos, Clima e Insumos</li>
                  <li>NO puede ver Partes Diarios ni Configuración</li>
                  <li>NO puede agregar ni editar registros</li>
                  <li>Acceso limitado a reportes (solo visualización)</li>
                </ul>
              </div>
            </div>

            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-amber-600" />
                <h5 className="font-bold text-amber-900">Operativo</h5>
              </div>
              <p className="text-sm text-amber-800 mb-2">Acceso limitado para operaciones diarias específicas.</p>
              <div className="text-sm text-amber-700 space-y-1">
                <p className="font-medium">Permisos:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Ver dashboards de Movimientos, Clima e Insumos</li>
                  <li>NO puede ver Partes Diarios ni Configuración</li>
                  <li>Agregar registros según privilegios asignados (movimientos, actividades, clima, insumos)</li>
                  <li>NO puede editar configuración ni ver usuarios</li>
                  <li>Acceso limitado a reportes</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTooltip && <div className="fixed inset-0 z-40" onClick={() => setActiveTooltip(null)} />}
    </div>
  )
}
