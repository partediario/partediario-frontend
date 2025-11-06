"use client"

import {
  Dialog,
  DialogContent as DialogContentComponent,
  DialogHeader as DialogHeaderComponent,
  DialogFooter as DialogFooterComponent,
  DialogTitle as DialogTitleComponent,
  DialogDescription as DialogDescriptionComponent,
} from "@/components/ui/dialog"
import type React from "react"
import { useState, useEffect, useRef } from "react" // Import useRef
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useEstablishment } from "@/contexts/establishment-context"
import {
  User,
  Mail,
  Lock,
  Shield,
  Loader2,
  Eye,
  EyeOff,
  Phone,
  KeyRound,
  AlertTriangle,
  Search,
  Plus,
  Trash2,
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

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

// Interfaces para Empresas, Establecimientos y Asignaciones
type Asignacion = {
  id: string
  empresaId: string
  establecimientoId: string
  rolId: string
  empresaNombre?: string
  establecimientoNombre?: string
  rolNombre?: string
  isOwner?: boolean
}

interface Empresa {
  id: number
  nombre: string
}

interface Establecimiento {
  id: number
  nombre: string
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
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false)
  const [loadingPassword, setLoadingPassword] = useState(false)

  const [activeTab, setActiveTab] = useState<"nuevo" | "existente">("nuevo")
  const [searchTerm, setSearchTerm] = useState("")
  const [searchLoading, setSearchLoading] = useState(false)
  const [usuarioBuscado, setUsuarioBuscado] = useState<{
    id: string
    nombres: string
    apellidos: string
    email: string
    telefono: string
  } | null>(null)

  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [establecimientos, setEstablecimientos] = useState<Record<string, Establecimiento[]>>({})
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([
    {
      id: crypto.randomUUID(),
      empresaId: "",
      establecimientoId: "",
      rolId: "",
    },
  ])

  const [asignacionesOriginales, setAsignacionesOriginales] = useState<Asignacion[]>([])

  const [formData, setFormData] = useState({
    nombres: "",
    apellidos: "",
    email: "",
    telefono: "",
    password: "",
    confirmPassword: "",
    rolId: "",
  })

  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmNewPassword: "",
  })

  const [showEmailConfirmDialog, setShowEmailConfirmDialog] = useState(false)
  const [usuarioExistente, setUsuarioExistente] = useState<{
    id: string
    nombres: string
    apellidos: string
    email: string
    telefono: string
  } | null>(null)

  const [esUsuarioPropietario, setEsUsuarioPropietario] = useState(false)

  const asignacionesCargadasRef = useRef(false)
  const empresasCargadasRef = useRef(false)

  const resetearFormulario = () => {
    setActiveTab("nuevo")
    setSearchTerm("")
    setUsuarioBuscado(null)
    setUsuarioExistente(null)
    setShowEmailConfirmDialog(false)
    setEsUsuarioPropietario(false) // Resetear estado de propietario

    setFormData({
      nombres: "",
      apellidos: "",
      email: "",
      telefono: "",
      password: "",
      confirmPassword: "",
      rolId: "",
    })

    setPasswordData({
      newPassword: "",
      confirmNewPassword: "",
    })

    setAsignaciones([
      {
        id: crypto.randomUUID(),
        empresaId: "",
        establecimientoId: "",
        rolId: "",
      },
    ])

    setEstablecimientos({})
    setShowPassword(false)
    setShowConfirmPassword(false)
    setShowNewPassword(false)
    setShowConfirmNewPassword(false)
    setAsignacionesOriginales([]) // Resetear asignaciones originales
  }

  const handleClose = () => {
    resetearFormulario()
    onClose()
  }

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
      if (!empresasCargadasRef.current) {
        fetchRoles()
        fetchEmpresas()
        empresasCargadasRef.current = true
      }

      if (mode === "edit" && usuario && empresas.length > 0 && !asignacionesCargadasRef.current) {
        fetchAsignacionesUsuario() // Llamada modificada
        asignacionesCargadasRef.current = true
      }
    } else {
      asignacionesCargadasRef.current = false
      empresasCargadasRef.current = false
    }
  }, [isOpen, mode, usuario, empresas.length])

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

    setPasswordData({
      newPassword: "",
      confirmNewPassword: "",
    })
  }, [usuario, mode, isOpen])

  const fetchAsignacionesUsuario = async () => {
    // Modificado para no recibir usuarioId como parámetro
    if (!usuario?.id) return
    if (empresas.length === 0) {
      console.log("[v0] No hay empresas disponibles, esperando...")
      return
    }

    if (asignacionesCargadasRef.current) {
      console.log("[v0] Asignaciones ya cargadas, saltando...")
      return
    }

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

        const tieneAsignacionPropietario = data.asignaciones.some((asig: Asignacion) => asig.isOwner === true)
        setEsUsuarioPropietario(tieneAsignacionPropietario)
        console.log("[v0] Usuario es propietario:", tieneAsignacionPropietario)

        const asignacionesConNombres = data.asignaciones.map((asig: any) => ({
          id: asig.id?.toString() || crypto.randomUUID(),
          empresaId: asig.empresaId || "",
          establecimientoId: asig.establecimientoId || "",
          rolId: asig.rolId || "",
          empresaNombre: asig.empresaNombre || "",
          establecimientoNombre: asig.establecimientoNombre || "",
          rolNombre: asig.rolNombre || "",
          isOwner: asig.isOwner || false,
        }))

        setAsignaciones(asignacionesConNombres)
        setAsignacionesOriginales(asignacionesConNombres)

        const empresasUnicas = [...new Set(asignacionesConNombres.map((a: Asignacion) => a.empresaId))]
        for (const empresaId of empresasUnicas) {
          if (!establecimientos[empresaId]) {
            await fetchEstablecimientosPorEmpresa(empresaId)
          }
        }
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
    }
  }

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
        console.log("[v0] Empresas loaded:", data.empresas?.length || 0)
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

  const fetchEstablecimientosPorEmpresa = async (empresaId: string) => {
    try {
      console.log("[v0] Fetching establecimientos for empresa:", empresaId)
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
      const response = await fetch(`/api/establecimientos?usuario_id=${user.id}&empresa_id=${empresaId}`)
      const data = await response.json()

      if (response.ok && data.establecimientos) {
        console.log("[v0] Establecimientos loaded:", data.establecimientos?.length || 0)
        const establecimientosFormateadas = data.establecimientos.map((est: any) => ({
          id: Number.parseInt(est.establecimiento_id),
          nombre: est.nombre,
        }))
        setEstablecimientos((prev) => ({
          ...prev,
          [empresaId]: establecimientosFormateadas,
        }))
      } else {
        console.error("[v0] Error fetching establecimientos:", data.error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los establecimientos",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Error fetching establecimientos:", error)
      toast({
        title: "Error",
        description: "Error al conectar con el servidor para obtener establecimientos",
        variant: "destructive",
      })
    }
  }

  const buscarUsuarioExistente = async () => {
    if (!searchTerm.trim()) {
      toast({
        title: "Error",
        description: "Debe ingresar un email o teléfono para buscar",
        variant: "destructive",
      })
      return
    }

    try {
      setSearchLoading(true)

      const isEmail = searchTerm.includes("@")
      const response = await fetch("/api/validar-usuario-existente", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: isEmail ? searchTerm.trim() : "",
          telefono: !isEmail ? searchTerm.trim() : "",
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Error al buscar usuario")
      }

      if (data.existe) {
        setUsuarioBuscado(data.usuario)
        toast({
          title: "Usuario encontrado",
          description: `${data.usuario.nombres} ${data.usuario.apellidos}`,
        })
      } else {
        setUsuarioBuscado(null)
        toast({
          title: "Usuario no encontrado",
          description: "No se encontró ningún usuario con ese email o teléfono",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error searching user:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      })
    } finally {
      setSearchLoading(false)
    }
  }

  const agregarAsignacion = () => {
    setAsignaciones([
      ...asignaciones,
      {
        id: crypto.randomUUID(),
        empresaId: "",
        establecimientoId: "",
        rolId: "",
      },
    ])
  }

  const eliminarAsignacion = (id: string) => {
    if (asignaciones.length === 1) {
      toast({
        title: "Error",
        description: "Debe tener al menos una asignación",
        variant: "destructive",
      })
      return
    }
    setAsignaciones(asignaciones.filter((a) => a.id !== id))
  }

  const actualizarAsignacion = (id: string, campo: keyof Asignacion, valor: string) => {
    setAsignaciones(
      asignaciones.map((a) => {
        if (a.id === id) {
          const nuevaAsignacion = { ...a, [campo]: valor }

          if (campo === "empresaId") {
            const establecimientoActual = a.establecimientoId

            // Cargar establecimientos de la nueva empresa
            if (valor) {
              fetchEstablecimientosPorEmpresa(valor).then(() => {
                // Verificar si el establecimiento actual existe en la nueva empresa
                const establecimientosNuevaEmpresa = establecimientos[valor] || []
                const establecimientoExiste = establecimientosNuevaEmpresa.some(
                  (est) => est.id.toString() === establecimientoActual,
                )

                if (!establecimientoExiste) {
                  // Si no existe, limpiar el establecimiento
                  console.log("[v0] Establecimiento no existe en la nueva empresa, limpiando...")
                  setAsignaciones((prev) =>
                    prev.map((asig) => (asig.id === id ? { ...asig, establecimientoId: "" } : asig)),
                  )
                } else {
                  console.log("[v0] Establecimiento existe en la nueva empresa, manteniéndolo")
                }
              })
            } else {
              // Si no hay empresa, limpiar establecimiento
              nuevaAsignacion.establecimientoId = ""
            }
          }

          return nuevaAsignacion
        }
        return a
      }),
    )
  }

  const getEstablecimientosDisponibles = (empresaId: string, asignacionActualId: string) => {
    const todosLosEstablecimientos = establecimientos[empresaId] || []

    // Obtener los IDs de establecimientos ya asignados en otras líneas de la misma empresa
    const establecimientosAsignados = asignaciones
      .filter((a) => a.id !== asignacionActualId && a.empresaId === empresaId && a.establecimientoId)
      .map((a) => a.establecimientoId)

    // Filtrar los establecimientos que no han sido asignados
    return todosLosEstablecimientos.filter((est) => !establecimientosAsignados.includes(est.id.toString()))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const asignacionesIncompletas = asignaciones.filter((a) => !a.empresaId || !a.establecimientoId || !a.rolId)

    if (asignacionesIncompletas.length > 0) {
      toast({
        title: "Error",
        description:
          "Todas las asignaciones deben tener empresa, establecimiento y rol seleccionados. Complete o elimine las filas vacías.",
        variant: "destructive",
      })
      return
    }

    if (activeTab === "nuevo") {
      await crearNuevoUsuarioConAsignaciones()
    } else {
      await asignarUsuarioExistenteConAsignaciones()
    }
  }

  const crearNuevoUsuarioConAsignaciones = async () => {
    try {
      setLoading(true)

      // Validaciones
      if (!formData.nombres.trim() || !formData.apellidos.trim()) {
        toast({
          title: "Error",
          description: "Nombres y apellidos son requeridos",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      if (!formData.email.trim()) {
        toast({
          title: "Error",
          description: "El email es requerido",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      if (!formData.telefono.trim()) {
        toast({
          title: "Error",
          description: "El teléfono es requerido",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      if (!formData.password.trim()) {
        toast({
          title: "Error",
          description: "La contraseña es requerida",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      if (formData.password !== formData.confirmPassword) {
        toast({
          title: "Error",
          description: "Las contraseñas no coinciden",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      if (formData.password.length < 6) {
        toast({
          title: "Error",
          description: "La contraseña debe tener al menos 6 caracteres",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      const asignacionesValidas = asignaciones.filter((a) => a.empresaId && a.establecimientoId && a.rolId)

      if (asignacionesValidas.length === 0) {
        toast({
          title: "Error",
          description: "Debe agregar al menos una asignación completa (empresa, establecimiento y rol)",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      if (asignacionesValidas.length !== asignaciones.length) {
        toast({
          title: "Error",
          description: "Todas las asignaciones deben estar completas. Complete o elimine las filas vacías.",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      // Validar que el usuario no exista
      const validacionResponse = await fetch("/api/validar-usuario-existente", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email.trim(),
          telefono: formData.telefono.trim(),
        }),
      })

      const validacionData = await validacionResponse.json()

      if (validacionData.existe) {
        // Cambiar a la pestaña de usuario existente y cargar los datos
        setUsuarioBuscado(validacionData.usuario)
        setActiveTab("existente")
        toast({
          title: "Usuario existente",
          description: "El usuario ya existe. Puede asignarlo desde la pestaña 'Usuario Existente'",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      // Crear el usuario
      const crearResponse = await fetch("/api/crear-usuario-email", {
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
          rolId: asignacionesValidas[0].rolId,
          empresaId: asignacionesValidas[0].empresaId,
          usuarioCreadorId,
          establecimientoId: asignacionesValidas[0].establecimientoId,
        }),
      })

      const crearData = await crearResponse.json()

      if (!crearResponse.ok || !crearData.success) {
        throw new Error(crearData.error || "Error al crear usuario")
      }

      // Si hay más de una asignación, crear las adicionales
      if (asignacionesValidas.length > 1) {
        const asignacionesAdicionales = asignacionesValidas.slice(1)

        const asignarResponse = await fetch("/api/asignar-usuario-multiple", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            usuarioId: crearData.usuarioId,
            asignaciones: asignacionesAdicionales,
          }),
        })

        const asignarData = await asignarResponse.json()

        if (!asignarResponse.ok || !asignarData.success) {
          console.error("Error asignando establecimientos adicionales:", asignarData.error)
          // No fallar completamente, solo mostrar advertencia
          toast({
            title: "Advertencia",
            description: "Usuario creado pero algunas asignaciones fallaron",
            variant: "destructive",
          })
        }
      }

      toast({
        title: "Usuario creado exitosamente",
        description: `${formData.nombres} ${formData.apellidos} ha sido creado con ${asignacionesValidas.length} asignación(es).`,
      })

      resetearFormulario()
      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error creating user:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const asignarUsuarioExistenteConAsignaciones = async () => {
    if (!usuarioBuscado) {
      toast({
        title: "Error",
        description: "Debe buscar un usuario primero",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

      const asignacionesValidas = asignaciones.filter((a) => a.empresaId && a.establecimientoId && a.rolId)

      if (asignacionesValidas.length === 0) {
        toast({
          title: "Error",
          description: "Debe agregar al menos una asignación completa (empresa, establecimiento y rol)",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      if (asignacionesValidas.length !== asignaciones.length) {
        toast({
          title: "Error",
          description: "Todas las asignaciones deben estar completas. Complete o elimine las filas vacías.",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      const response = await fetch("/api/asignar-usuario-multiple", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usuarioId: usuarioBuscado.id,
          asignaciones: asignacionesValidas,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Error al asignar usuario")
      }

      toast({
        title: "Usuario asignado exitosamente",
        description: `${usuarioBuscado.nombres} ${usuarioBuscado.apellidos} ha sido asignado a ${asignacionesValidas.length} establecimiento(s).`,
      })

      resetearFormulario()
      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error assigning user:", error)
      toast({
        title: "Error al asignar usuario",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const validarYCrearUsuario = async () => {
    try {
      setLoading(true)

      console.log("🔍 [VALIDAR] Validando usuario existente...")

      const validacionResponse = await fetch("/api/validar-usuario-existente", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email.trim(),
          telefono: formData.telefono.trim(),
        }),
      })

      const validacionData = await validacionResponse.json()

      if (!validacionResponse.ok || !validacionData.success) {
        throw new Error(validacionData.error || "Error al validar usuario")
      }

      if (validacionData.existe) {
        console.log("⚠️ [VALIDAR] Usuario existente encontrado:", validacionData.usuario)
        setUsuarioExistente(validacionData.usuario)
        setShowEmailConfirmDialog(true)
        setLoading(false)
        return
      }

      if (!formData.nombres.trim() || !formData.apellidos.trim()) {
        toast({
          title: "Error",
          description: "Para crear un nuevo usuario, debe completar nombres y apellidos",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      if (!formData.email.trim()) {
        toast({
          title: "Error",
          description: "Para crear un nuevo usuario, el email es requerido",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      if (!formData.telefono.trim()) {
        toast({
          title: "Error",
          description: "Para crear un nuevo usuario, el teléfono es requerido",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      if (!formData.password.trim()) {
        toast({
          title: "Error",
          description: "Para crear un nuevo usuario, la contraseña es requerida",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      if (formData.password !== formData.confirmPassword) {
        toast({
          title: "Error",
          description: "Las contraseñas no coinciden",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      if (formData.password.length < 6) {
        toast({
          title: "Error",
          description: "La contraseña debe tener al menos 6 caracteres",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      await crearNuevoUsuario()
    } catch (error) {
      console.error("Error validating user:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  const crearNuevoUsuario = async () => {
    try {
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

      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error creating user:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const asignarUsuarioExistente = async () => {
    if (!usuarioExistente) return

    try {
      setLoading(true)
      setShowEmailConfirmDialog(false)

      console.log("🔄 Asignando usuario existente:", {
        usuarioId: usuarioExistente.id,
        empresaId,
        establecimientoId: establecimientoSeleccionado,
        rolId: formData.rolId,
      })

      const response = await fetch("/api/asignar-usuario-existente", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usuarioId: usuarioExistente.id,
          empresaId,
          establecimientoId: establecimientoSeleccionado,
          rolId: formData.rolId,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Error al asignar usuario")
      }

      toast({
        title: "Usuario asignado exitosamente",
        description: `${usuarioExistente.nombres} ${usuarioExistente.apellidos} ha sido asignado a la empresa y establecimiento.`,
      })

      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error assigning user:", error)
      toast({
        title: "Error al asignar usuario",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setUsuarioExistente(null)
    }
  }

  const actualizarUsuario = async () => {
    if (!usuario) return

    try {
      setLoading(true)

      // Validar asignaciones
      const asignacionesIncompletas = asignaciones.filter((a) => !a.empresaId || !a.establecimientoId || !a.rolId)

      if (asignacionesIncompletas.length > 0) {
        toast({
          title: "Error",
          description:
            "Todas las asignaciones deben tener empresa, establecimiento y rol seleccionados. Complete o elimine las filas vacías.",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      if (asignaciones.length === 0) {
        toast({
          title: "Error",
          description: "El usuario debe tener al menos una asignación",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      // Actualizar datos personales
      const updateData: any = {
        nombres: formData.nombres.trim(),
        apellidos: formData.apellidos.trim(),
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

      // Actualizar asignaciones
      const responseAsignaciones = await fetch("/api/actualizar-asignaciones-usuario", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usuarioId: usuario.id,
          asignaciones: asignaciones,
          empresasIds: empresas.map((e) => e.id),
        }),
      })

      const dataAsignaciones = await responseAsignaciones.json()

      if (!responseAsignaciones.ok || !dataAsignaciones.success) {
        throw new Error(dataAsignaciones.error || "Error al actualizar asignaciones")
      }

      toast({
        title: "Usuario actualizado",
        description: `Los datos y asignaciones de ${formData.nombres} ${formData.apellidos} han sido actualizados`,
      })

      resetearFormulario()
      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error updating user:", error)
      toast({
        title: "Error al actualizar usuario",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const formatPhoneForDisplay = (phone: string) => {
    if (!phone) return "Sin teléfono"

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

  if (mode === "edit" && !usuario) {
    return null
  }

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-green-600" />
              {mode === "create" ? "Gestión de Usuarios" : "Editar Usuario"}
            </SheetTitle>
            <SheetDescription>
              {mode === "create"
                ? "Crea un nuevo usuario o asigna uno existente a establecimientos"
                : "Modifica los datos del usuario (email y teléfono no se pueden cambiar)"}
            </SheetDescription>
          </SheetHeader>

          {/* Usar Tabs para "Nuevo Usuario" y "Usuario Existente" */}
          {mode === "create" ? (
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "nuevo" | "existente")} className="mt-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="nuevo">Nuevo Usuario</TabsTrigger>
                <TabsTrigger value="existente">Usuario Existente</TabsTrigger>
              </TabsList>

              <TabsContent value="nuevo" className="space-y-6 mt-6">
                <form onSubmit={handleSubmit} className="space-y-6">
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
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                        placeholder="usuario@ejemplo.com"
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="telefono">Teléfono *</Label>
                      <Input
                        id="telefono"
                        value={formData.telefono}
                        onChange={(e) => setFormData((prev) => ({ ...prev, telefono: e.target.value }))}
                        placeholder="0987123456 o +595987123456"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Credenciales de Acceso */}
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

                  {/* Permisos y Rol - Tabla de Asignaciones */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-blue-500" />
                        Permisos y Rol
                      </h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={agregarAsignacion}
                        disabled={loading}
                        className="flex items-center gap-2 bg-transparent"
                      >
                        <Plus className="w-4 h-4" />
                        Agregar Asignación
                      </Button>
                    </div>

                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Empresa</TableHead>
                            <TableHead>Establecimiento</TableHead>
                            <TableHead>Rol</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {asignaciones.map((asignacion) => (
                            <TableRow key={asignacion.id}>
                              <TableCell>
                                <Select
                                  value={asignacion.empresaId}
                                  onValueChange={(value) => actualizarAsignacion(asignacion.id, "empresaId", value)}
                                  disabled={loading}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar empresa" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {empresas.map((empresa) => (
                                      <SelectItem key={empresa.id} value={empresa.id.toString()}>
                                        {empresa.nombre}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={asignacion.establecimientoId}
                                  onValueChange={(value) =>
                                    actualizarAsignacion(asignacion.id, "establecimientoId", value)
                                  }
                                  disabled={loading || !asignacion.empresaId}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar establecimiento" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {getEstablecimientosDisponibles(asignacion.empresaId, asignacion.id).map(
                                      (establecimiento) => (
                                        <SelectItem key={establecimiento.id} value={establecimiento.id.toString()}>
                                          {establecimiento.nombre}
                                        </SelectItem>
                                      ),
                                    )}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={asignacion.rolId}
                                  onValueChange={(value) => actualizarAsignacion(asignacion.id, "rolId", value)}
                                  disabled={loading || loadingRoles}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar rol" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {roles.map((rol) => (
                                      <SelectItem key={rol.id} value={rol.id.toString()}>
                                        {rol.nombre}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => eliminarAsignacion(asignacion.id)}
                                  disabled={loading || asignaciones.length === 1 || esUsuarioPropietario}
                                  className={asignaciones.length === 1 ? "cursor-not-allowed opacity-50" : ""}
                                  title={
                                    asignaciones.length === 1
                                      ? "No se puede eliminar la última asignación"
                                      : "Eliminar asignación"
                                  }
                                >
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button type="submit" disabled={loading} className="flex-1 bg-green-700 hover:bg-green-800">
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creando...
                        </>
                      ) : (
                        "Crear Usuario"
                      )}
                    </Button>
                    <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
                      Cancelar
                    </Button>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="existente" className="space-y-6 mt-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Búsqueda de Usuario */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <Search className="w-4 h-4" />
                      Buscar Usuario
                    </h4>

                    <div className="flex gap-2">
                      <Input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar por email o teléfono"
                        disabled={searchLoading}
                      />
                      <Button
                        type="button"
                        onClick={buscarUsuarioExistente}
                        disabled={searchLoading}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {searchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                      </Button>
                    </div>

                    {usuarioBuscado && (
                      <div className="p-4 bg-gray-50 rounded-lg border space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="font-semibold text-gray-900">
                            {usuarioBuscado.nombres} {usuarioBuscado.apellidos}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700">{usuarioBuscado.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700">{formatPhoneForDisplay(usuarioBuscado.telefono)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Permisos y Rol - Tabla de Asignaciones */}
                  {usuarioBuscado && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                          <Shield className="w-4 h-4 text-blue-500" />
                          Asignar a Establecimientos
                        </h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={agregarAsignacion}
                          disabled={loading}
                          className="flex items-center gap-2 bg-transparent"
                        >
                          <Plus className="w-4 h-4" />
                          Agregar Asignación
                        </Button>
                      </div>

                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Empresa</TableHead>
                              <TableHead>Establecimiento</TableHead>
                              <TableHead>Rol</TableHead>
                              <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {asignaciones.map((asignacion) => (
                              <TableRow key={asignacion.id}>
                                <TableCell>
                                  <Select
                                    value={asignacion.empresaId}
                                    onValueChange={(value) => actualizarAsignacion(asignacion.id, "empresaId", value)}
                                    disabled={loading}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Seleccionar empresa" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {empresas.map((empresa) => (
                                        <SelectItem key={empresa.id} value={empresa.id.toString()}>
                                          {empresa.nombre}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell>
                                  <Select
                                    value={asignacion.establecimientoId}
                                    onValueChange={(value) =>
                                      actualizarAsignacion(asignacion.id, "establecimientoId", value)
                                    }
                                    disabled={loading || !asignacion.empresaId}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Seleccionar establecimiento" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {getEstablecimientosDisponibles(asignacion.empresaId, asignacion.id).map(
                                        (establecimiento) => (
                                          <SelectItem key={establecimiento.id} value={establecimiento.id.toString()}>
                                            {establecimiento.nombre}
                                          </SelectItem>
                                        ),
                                      )}
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell>
                                  <Select
                                    value={asignacion.rolId}
                                    onValueChange={(value) => actualizarAsignacion(asignacion.id, "rolId", value)}
                                    disabled={loading || loadingRoles}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Seleccionar rol" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {roles.map((rol) => (
                                        <SelectItem key={rol.id} value={rol.id.toString()}>
                                          {rol.nombre}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => eliminarAsignacion(asignacion.id)}
                                    disabled={loading || asignaciones.length === 1 || esUsuarioPropietario}
                                    className={asignaciones.length === 1 ? "cursor-not-allowed opacity-50" : ""}
                                    title={
                                      asignaciones.length === 1
                                        ? "No se puede eliminar la última asignación"
                                        : "Eliminar asignación"
                                    }
                                  >
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="submit"
                      disabled={loading || !usuarioBuscado}
                      className="flex-1 bg-green-700 hover:bg-green-800"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Asignando...
                        </>
                      ) : (
                        "Asignar Usuario"
                      )}
                    </Button>
                    <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
                      Cancelar
                    </Button>
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          ) : (
            // Modo edición - mantener el formulario original
            <form
              onSubmit={(e) => {
                e.preventDefault()
                actualizarUsuario()
              }}
              className="space-y-6 mt-6"
            >
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

              {/* Modo edición - ahora incluye tabla de asignaciones */}
              <div className="space-y-4">
                {esUsuarioPropietario && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                    <Shield className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-amber-800">
                      Este usuario es propietario de una o más empresas. Los permisos y asignaciones de propietarios no
                      pueden ser modificados.
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-500" />
                    Permisos y Asignaciones
                  </h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={agregarAsignacion}
                    disabled={loading || esUsuarioPropietario}
                    className="flex items-center gap-2 bg-transparent"
                  >
                    <Plus className="w-4 h-4" />
                    Agregar Asignación
                  </Button>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Empresa</TableHead>
                        <TableHead>Establecimiento</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {asignaciones.map((asignacion) => (
                        <TableRow key={asignacion.id}>
                          <TableCell>
                            <Select
                              value={asignacion.empresaId}
                              onValueChange={(value) => actualizarAsignacion(asignacion.id, "empresaId", value)}
                              disabled={loading || esUsuarioPropietario}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar empresa" />
                              </SelectTrigger>
                              <SelectContent>
                                {empresas.map((empresa) => (
                                  <SelectItem key={empresa.id} value={empresa.id.toString()}>
                                    {empresa.nombre}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={asignacion.establecimientoId}
                              onValueChange={(value) => actualizarAsignacion(asignacion.id, "establecimientoId", value)}
                              disabled={loading || !asignacion.empresaId || esUsuarioPropietario}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar establecimiento" />
                              </SelectTrigger>
                              <SelectContent>
                                {getEstablecimientosDisponibles(asignacion.empresaId, asignacion.id).map(
                                  (establecimiento) => (
                                    <SelectItem key={establecimiento.id} value={establecimiento.id.toString()}>
                                      {establecimiento.nombre}
                                    </SelectItem>
                                  ),
                                )}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={asignacion.rolId}
                              onValueChange={(value) => actualizarAsignacion(asignacion.id, "rolId", value)}
                              disabled={loading || loadingRoles || esUsuarioPropietario}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar rol" />
                              </SelectTrigger>
                              <SelectContent>
                                {roles.map((rol) => (
                                  <SelectItem key={rol.id} value={rol.id.toString()}>
                                    {rol.nombre}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => eliminarAsignacion(asignacion.id)}
                              disabled={loading || asignaciones.length === 1 || esUsuarioPropietario}
                              className={asignaciones.length === 1 ? "cursor-not-allowed opacity-50" : ""}
                              title={
                                asignaciones.length === 1
                                  ? "No se puede eliminar la última asignación"
                                  : "Eliminar asignación"
                              }
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

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
                <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
                  Cancelar
                </Button>
              </div>
            </form>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={showEmailConfirmDialog} onOpenChange={setShowEmailConfirmDialog}>
        <DialogContentComponent className="sm:max-w-md">
          <DialogHeaderComponent>
            <DialogTitleComponent className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Usuario Existente
            </DialogTitleComponent>
            <DialogDescriptionComponent>
              Se encontró un usuario existente con el email o teléfono proporcionado. ¿Desea asignarlo a esta empresa?
            </DialogDescriptionComponent>
          </DialogHeaderComponent>

          {usuarioExistente && (
            <div className="space-y-3 py-4">
              <div className="p-4 bg-gray-50 rounded-lg border space-y-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="font-semibold text-gray-900">
                    {usuarioExistente.nombres} {usuarioExistente.apellidos}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">{usuarioExistente.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">{formatPhoneForDisplay(usuarioExistente.telefono)}</span>
                </div>
              </div>

              <p className="text-sm text-gray-600">
                Si continúa, este usuario será asignado a su empresa y establecimiento con el rol seleccionado.
              </p>
            </div>
          )}

          <DialogFooterComponent className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowEmailConfirmDialog(false)
                setUsuarioExistente(null)
                setLoading(false)
              }}
            >
              No
            </Button>
            <Button type="button" onClick={asignarUsuarioExistente} className="bg-green-700 hover:bg-green-800">
              Sí, agregar
            </Button>
          </DialogFooterComponent>
        </DialogContentComponent>
      </Dialog>
    </>
  )
}
