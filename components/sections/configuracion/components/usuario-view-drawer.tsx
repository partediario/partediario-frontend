"use client"

import { useState, useEffect, useRef } from "react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Phone, Calendar, Building, Shield } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Usuario {
  id: string
  nombres: string
  apellidos: string
  telefono: string
  email: string
  created_at: string
}

interface UsuarioViewDrawerProps {
  usuario: Usuario | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface Asignacion {
  id: string
  empresa_nombre: string
  establecimiento_nombre: string
  rol_nombre: string
  is_owner: boolean
}

interface Empresa {
  id: number
  nombre: string
}

export function UsuarioViewDrawer({ usuario, open, onOpenChange }: UsuarioViewDrawerProps) {
  const { toast } = useToast()
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([])
  const [loading, setLoading] = useState(false)
  const asignacionesCargadasRef = useRef(false)
  const empresasCargadasRef = useRef(false)

  useEffect(() => {
    if (!open) {
      asignacionesCargadasRef.current = false
      empresasCargadasRef.current = false
      setAsignaciones([])
    }
  }, [open])

  useEffect(() => {
    if (open) {
      if (!empresasCargadasRef.current) {
        fetchEmpresas()
        empresasCargadasRef.current = true
      }

      if (usuario && empresas.length > 0 && !asignacionesCargadasRef.current) {
        fetchAsignacionesUsuario()
        asignacionesCargadasRef.current = true
      }
    } else {
      asignacionesCargadasRef.current = false
      empresasCargadasRef.current = false
    }
  }, [open, usuario, empresas.length])

  const fetchEmpresas = async () => {
    try {
      console.log("[v0] Fetching empresas...")
      const userData = localStorage.getItem("user_data")
      if (!userData) {
        toast({
          title: "Error",
          description: "No se pudo obtener el usuario actual",
          variant: "destructive",
        })
        return
      }

      const user = JSON.parse(userData)
      const response = await fetch(`/api/empresas?usuario_id=${user.id}`)
      const data = await response.json()

      if (response.ok && data.empresas) {
        console.log("[v0] Empresas cargadas:", data.empresas)
        const empresasFormateadas = data.empresas.map((emp: any) => ({
          id: Number.parseInt(emp.id),
          nombre: emp.nombre,
        }))
        setEmpresas(empresasFormateadas)
      } else {
        console.error("[v0] Error fetching empresas:", data.error)
        toast({
          title: "Error",
          description: "No se pudieron cargar las empresas",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Error fetching empresas:", error)
      toast({
        title: "Error",
        description: "Error al conectar con el servidor para obtener empresas",
        variant: "destructive",
      })
    }
  }

  const fetchAsignacionesUsuario = async () => {
    if (!usuario?.id) return
    if (empresas.length === 0) {
      console.log("[v0] No hay empresas disponibles, esperando...")
      return
    }

    if (asignacionesCargadasRef.current) {
      console.log("[v0] Asignaciones ya cargadas, saltando...")
      return
    }

    setLoading(true)
    try {
      console.log("[v0] Fetching asignaciones for usuario:", usuario.id)
      const empresasIds = empresas.map((e) => e.id).join(",")
      console.log("[v0] Filtering by admin empresas:", empresasIds)

      const response = await fetch(
        `/api/obtener-asignaciones-usuario?usuario_id=${usuario.id}&empresas_ids=${empresasIds}`,
      )

      if (!response.ok) {
        throw new Error("Error al obtener asignaciones")
      }

      const data = await response.json()

      if (data.success && data.asignaciones) {
        console.log("[v0] Asignaciones obtenidas:", data.asignaciones)

        const asignacionesFormateadas = data.asignaciones.map((asig: any) => ({
          id: asig.id?.toString() || crypto.randomUUID(),
          empresa_nombre: asig.empresaNombre || "",
          establecimiento_nombre: asig.establecimientoNombre || "",
          rol_nombre: asig.rolNombre || "",
          is_owner: asig.isOwner || false,
        }))

        setAsignaciones(asignacionesFormateadas)
      } else {
        console.error("[v0] Error fetching asignaciones:", data.error)
        toast({
          title: "Error",
          description: "No se pudieron cargar las asignaciones del usuario",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Error fetching asignaciones:", error)
      toast({
        title: "Error",
        description: "Error al conectar con el servidor para obtener asignaciones",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
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

    const cleanPhone = phone.replace(/[\s\-()]/g, "")

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

  if (!usuario) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Detalles del Usuario
          </SheetTitle>
          <SheetDescription>Información completa del usuario y sus asignaciones</SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Datos Personales */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <User className="w-4 h-4" />
              Datos Personales
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Nombres</label>
                <div className="p-3 bg-gray-50 rounded-md text-gray-900">{usuario.nombres}</div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Apellidos</label>
                <div className="p-3 bg-gray-50 rounded-md text-gray-900">{usuario.apellidos}</div>
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
              <label className="text-sm font-medium text-gray-700">Email</label>
              <div className="p-3 bg-gray-50 rounded-md text-gray-900 flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                {usuario.email}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Teléfono</label>
              <div className="p-3 bg-gray-50 rounded-md text-gray-900 flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                {formatPhone(usuario.telefono)}
              </div>
            </div>
          </div>

          {/* Fecha de Creación */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Información del Sistema
            </h4>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Fecha de Creación</label>
              <div className="p-3 bg-gray-50 rounded-md text-gray-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                {formatDate(usuario.created_at)}
              </div>
            </div>
          </div>

          {/* Permisos y Asignaciones */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Building className="w-4 h-4" />
              Permisos y Asignaciones
            </h4>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Cargando asignaciones...</span>
              </div>
            ) : asignaciones.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No hay asignaciones disponibles</div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Empresa</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Establecimiento</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Rol</th>
                    </tr>
                  </thead>
                  <tbody>
                    {asignaciones.map((asignacion, index) => (
                      <tr key={asignacion.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="py-3 px-4 text-sm text-gray-900">{asignacion.empresa_nombre}</td>
                        <td className="py-3 px-4 text-sm text-gray-900">{asignacion.establecimiento_nombre}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Shield className={`w-4 h-4 ${asignacion.is_owner ? "text-amber-500" : "text-blue-500"}`} />
                            <Badge variant="secondary" className="text-xs">
                              {asignacion.rol_nombre}
                            </Badge>
                            {asignacion.is_owner && (
                              <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                                Propietario
                              </Badge>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default UsuarioViewDrawer
