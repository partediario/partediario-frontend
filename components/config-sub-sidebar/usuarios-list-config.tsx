"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, UsersIcon, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/contexts/user-context"

interface Usuario {
  id: string
  nombres: string
  apellidos: string
  email: string
  telefono: string
  rol: string
  establecimientos: string[]
  fecha_creacion: string
}

export function UsuariosListConfig() {
  const { toast } = useToast()
  const { usuario } = useUser()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUsuarios()
  }, [usuario?.id])

  const loadUsuarios = async () => {
    if (!usuario?.id) return

    setLoading(true)
    try {
      // Aquí deberías implementar la API para obtener usuarios del sistema
      // Por ahora, mostramos un placeholder
      setUsuarios([])
    } catch (error) {
      console.error("Error loading usuarios:", error)
      toast({
        title: "Error",
        description: "Error al cargar usuarios",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Cargando usuarios...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Gestión de Usuarios</h2>
          <p className="text-sm text-slate-600">Administra los usuarios del sistema y sus permisos de acceso</p>
        </div>
        <Button className="bg-green-700 hover:bg-green-800">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          {usuarios.length === 0 ? (
            <div className="text-center py-8">
              <UsersIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No hay usuarios</h3>
              <p className="text-slate-600">Agrega usuarios para gestionar el acceso al sistema.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-6 gap-4 pb-3 border-b font-semibold text-sm text-slate-700">
                <div>Usuario</div>
                <div>Email</div>
                <div>Teléfono</div>
                <div>Rol</div>
                <div>Establecimientos</div>
                <div className="text-right">Acciones</div>
              </div>
              {usuarios.map((usuario) => (
                <div
                  key={usuario.id}
                  className="grid grid-cols-6 gap-4 py-3 border-b last:border-0 items-center hover:bg-slate-50 rounded px-2"
                >
                  <div className="font-medium text-slate-900">
                    {usuario.nombres} {usuario.apellidos}
                  </div>
                  <div className="text-sm text-slate-600">{usuario.email}</div>
                  <div className="text-sm text-slate-600">{usuario.telefono}</div>
                  <div className="text-sm text-slate-600">{usuario.rol}</div>
                  <div className="text-sm text-slate-600">{usuario.establecimientos.join(", ")}</div>
                  <div className="flex justify-end">
                    <Button variant="outline" size="sm" className="hover:bg-slate-100 bg-transparent">
                      Editar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
