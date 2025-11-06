"use client"

import { useState, useEffect } from "react"
import { X, Wrench, Package, Plus, Trash2, Edit, AlertCircle } from "lucide-react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { CustomCombobox } from "@/components/ui/custom-combobox"
import { CustomDatePicker } from "@/components/ui/custom-date-picker"
import { useUser } from "@/contexts/user-context"
import type { ParteDiario } from "@/lib/types"

interface EditarCaneriasBebederosDrawerProps {
  isOpen: boolean
  onClose: () => void
  parte: ParteDiario | null
  onSuccess?: () => void
}

interface DetallePotrero {
  id?: number
  potrero_id: number
  potrero_nombre?: string
  tipo_trabajo: "Reparación" | "Instalación"
  observaciones: string
}

interface DetalleInsumo {
  id?: number
  insumo_id: number
  insumo_nombre?: string
  cantidad: number
  unidad_medida?: string
  cantidad_disponible?: number
  es_original: boolean // Para distinguir detalles originales de nuevos
  cantidad_original?: number // Cantidad original para detalles que fueron editados
}

interface Potrero {
  id: number
  nombre: string
}

interface InsumoExistente {
  insumo_id: string
  nombre_insumo: string
  cantidad_disponible: number
  unidad_medida: string
  unidad_medida_uso_id: number
}

export default function EditarCaneriasBebederosDrawer({
  isOpen,
  onClose,
  parte,
  onSuccess,
}: EditarCaneriasBebederosDrawerProps) {
  const [fecha, setFecha] = useState<Date>(new Date())
  const [hora, setHora] = useState<string>(new Date().toTimeString().slice(0, 5))
  const [nota, setNota] = useState("")
  const [activeTab, setActiveTab] = useState<"potreros" | "insumos">("potreros")

  // Estados para potreros
  const [detallesPotreros, setDetallesPotreros] = useState<DetallePotrero[]>([])
  const [potreros, setPotreros] = useState<Potrero[]>([])
  const [showAddPotreroForm, setShowAddPotreroForm] = useState(false)
  const [editandoDetallePotrero, setEditandoDetallePotrero] = useState<number | null>(null)
  const [newPotrero, setNewPotrero] = useState<DetallePotrero>({
    potrero_id: 0,
    tipo_trabajo: "Reparación",
    observaciones: "",
  })

  // Estados para insumos
  const [detallesInsumos, setDetallesInsumos] = useState<DetalleInsumo[]>([])
  const [insumosExistentes, setInsumosExistentes] = useState<InsumoExistente[]>([])
  const [showAddInsumoForm, setShowAddInsumoForm] = useState(false)
  const [editandoDetalleInsumo, setEditandoDetalleInsumo] = useState<number | null>(null)
  const [newInsumo, setNewInsumo] = useState<DetalleInsumo>({
    insumo_id: 0,
    cantidad: 0,
  })

  // Estados de carga y errores
  const [loading, setLoading] = useState(false)
  const [loadingPotreros, setLoadingPotreros] = useState(false)
  const [loadingInsumos, setLoadingInsumos] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [errores, setErrores] = useState<string[]>([])
  const [mostrarModalErrores, setMostrarModalErrores] = useState(false)
  const [erroresDetallePotreros, setErroresDetallePotreros] = useState<string[]>([])
  const [erroresDetalleInsumos, setErroresDetalleInsumos] = useState<string[]>([])

  const { usuario } = useUser()

  useEffect(() => {
    if (isOpen && parte) {
      cargarDatosIniciales()
      cargarPotreros()
      cargarInsumos()
    }
  }, [isOpen, parte])

  const cargarDatosIniciales = () => {
    if (!parte) return

    if (parte.pd_fecha) {
      setFecha(new Date(parte.pd_fecha))
    }
    setHora(parte.pd_hora || new Date().toTimeString().slice(0, 5))
    setNota(parte.pd_nota || "")

    // Cargar detalles existentes
    try {
      let detalles
      if (typeof parte.pd_detalles === "string") {
        detalles = JSON.parse(parte.pd_detalles)
      } else {
        detalles = parte.pd_detalles
      }

      const potrerosConObservaciones = (detalles?.detalles_potreros || []).map((potrero: any) => ({
        ...potrero,
        potrero_id: potrero.potrero_id || 0,
        tipo_trabajo: potrero.tipo_trabajo || "Reparación",
        observaciones: potrero.incidente_detalle || potrero.observaciones || "",
      }))

      const insumosValidados = (detalles?.detalles_insumos || []).map((insumo: any) => ({
        ...insumo,
        insumo_id: insumo.insumo_id || 0,
        cantidad: insumo.cantidad || 0,
        insumo_nombre: insumo.insumo || `Insumo ${insumo.insumo_id}`, // Usar el campo correcto del nombre
        unidad_medida: insumo.unidad_medida || "",
        es_original: true, // Marcar como detalle original
        cantidad_original: insumo.cantidad || 0, // Guardar cantidad original
        cantidad_disponible: 0, // Se actualizará después de cargar insumos existentes
      }))

      setDetallesPotreros(potrerosConObservaciones)
      setDetallesInsumos(insumosValidados)
    } catch (error) {
      console.error("Error parsing detalles:", error)
      setDetallesPotreros([])
      setDetallesInsumos([])
    }
  }

  const cargarPotreros = async () => {
    setLoadingPotreros(true)
    try {
      const establecimientoId = parte?.pd_establecimiento_id || 1
      const response = await fetch(`/api/potreros-crud?establecimiento_id=${establecimientoId}`)
      if (response.ok) {
        const data = await response.json()
        setPotreros(data.potreros || [])
      } else {
        console.error("Error al cargar potreros:", response.status)
        toast({
          title: "Error",
          description: "No se pudieron cargar los potreros",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching potreros:", error)
      toast({
        title: "Error",
        description: "Error al cargar potreros",
        variant: "destructive",
      })
    } finally {
      setLoadingPotreros(false)
    }
  }

  const cargarInsumos = async () => {
    setLoadingInsumos(true)
    try {
      const establecimientoId = parte?.pd_establecimiento_id || 1
      const response = await fetch(`/api/insumos-existentes?establecimiento_id=${establecimientoId}&clase_insumo_id=4`)
      if (response.ok) {
        const data = await response.json()
        setInsumosExistentes(data.insumos || [])

        setDetallesInsumos((prevDetalles) =>
          prevDetalles.map((detalle) => {
            const insumoExistente = data.insumos?.find(
              (i: InsumoExistente) => i.insumo_id === detalle.insumo_id.toString(),
            )
            return {
              ...detalle,
              cantidad_disponible: insumoExistente ? insumoExistente.cantidad_disponible : 0,
              // Actualizar nombre del insumo si no lo tiene
              insumo_nombre: detalle.insumo_nombre || insumoExistente?.nombre_insumo || `Insumo ${detalle.insumo_id}`,
              unidad_medida: detalle.unidad_medida || insumoExistente?.unidad_medida || "",
            }
          }),
        )
      } else {
        console.error("Error al cargar insumos:", response.status)
        toast({
          title: "Error",
          description: "No se pudieron cargar los insumos",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching insumos:", error)
      toast({
        title: "Error",
        description: "Error al cargar insumos",
        variant: "destructive",
      })
    } finally {
      setLoadingInsumos(false)
    }
  }

  const validarFormularioPrincipal = (): string[] => {
    const errores: string[] = []

    if (!fecha) errores.push("La fecha es requerida")
    if (!hora) errores.push("La hora es requerida")
    if (detallesPotreros.length === 0) {
      errores.push("Debe agregar al menos un detalle de potrero")
    }

    return errores
  }

  const validarDetallePotreros = (): string[] => {
    const errores: string[] = []

    if (newPotrero.potrero_id === 0) errores.push("Debe seleccionar un potrero")
    if (!newPotrero.tipo_trabajo) errores.push("Debe seleccionar un tipo de trabajo")

    // Verificar que el potrero no esté ya agregado (excluyendo el que se está editando)
    const potreroYaAgregado = detallesPotreros.some(
      (d, index) => d.potrero_id === newPotrero.potrero_id && index !== editandoDetallePotrero,
    )

    if (potreroYaAgregado) {
      errores.push("Este potrero ya está agregado a la lista")
    }

    return errores
  }

  const calcularStockDisponible = (insumoIdSeleccionado: string, indexEditando: number | null): number => {
    const insumoSeleccionado = insumosExistentes.find((i) => i.insumo_id === insumoIdSeleccionado)
    if (!insumoSeleccionado) return 0

    const stockBase = insumoSeleccionado.cantidad_disponible

    // Si estamos editando una línea original, devolver stock base + cantidad original de esa línea
    if (indexEditando !== null && detallesInsumos[indexEditando]?.es_original) {
      const detalleEditado = detallesInsumos[indexEditando]
      if (detalleEditado.insumo_id.toString() === insumoIdSeleccionado) {
        const cantidadOriginal = detalleEditado.cantidad_original || detalleEditado.cantidad
        const stockDisponible = stockBase + cantidadOriginal

        console.log(`📊 Editando línea original - insumo ${insumoIdSeleccionado}:`, {
          stockBase,
          cantidadOriginal,
          stockDisponible,
        })

        return Math.max(0, stockDisponible)
      }
    }

    // Para agregar nueva línea o editar línea nueva: calcular stock considerando uso actual
    // Obtener detalles originales iniciales desde parte.pd_detalles
    const detallesOriginalesIniciales = parte?.pd_detalles?.detalles_insumos || []

    // Calcular cantidad total descontada originalmente para este insumo
    const cantidadDescontadaOriginalmente = detallesOriginalesIniciales
      .filter((detalle: any) => detalle.insumo_id?.toString() === insumoIdSeleccionado)
      .reduce((total: number, detalle: any) => total + (detalle.cantidad || 0), 0)

    // Calcular cantidad original aún presente en detalles actuales
    const cantidadOriginalPresente = detallesInsumos
      .filter(
        (detalle, index) =>
          detalle.es_original && detalle.insumo_id.toString() === insumoIdSeleccionado && index !== indexEditando,
      )
      .reduce((total, detalle) => total + (detalle.cantidad_original || detalle.cantidad), 0)

    // Calcular cantidad liberada (descontada originalmente - aún presente)
    const cantidadLiberada = cantidadDescontadaOriginalmente - cantidadOriginalPresente

    // Calcular cantidad usada por líneas nuevas (no originales)
    const cantidadNuevosUsada = detallesInsumos
      .filter(
        (detalle, index) =>
          !detalle.es_original && detalle.insumo_id.toString() === insumoIdSeleccionado && index !== indexEditando,
      )
      .reduce((total, detalle) => total + detalle.cantidad, 0)

    // Stock disponible = stock base + cantidad liberada - cantidad usada por nuevos
    const stockDisponible = stockBase + cantidadLiberada - cantidadNuevosUsada

    console.log(`📊 Cálculo para nueva línea - insumo ${insumoIdSeleccionado}:`, {
      stockBase,
      cantidadDescontadaOriginalmente,
      cantidadOriginalPresente,
      cantidadLiberada,
      cantidadNuevosUsada,
      stockDisponible,
    })

    return Math.max(0, stockDisponible)
  }

  const validarDetalleInsumos = (): string[] => {
    const errores: string[] = []

    if (newInsumo.insumo_id === 0) errores.push("Debe seleccionar un insumo")
    if (!newInsumo.cantidad || newInsumo.cantidad <= 0) errores.push("La cantidad debe ser mayor a 0")

    // Validar cantidad ingresada contra stock disponible calculado
    const cantidadNumerica = newInsumo.cantidad || 0
    const stockDisponibleCalculado = calcularStockDisponible(newInsumo.insumo_id.toString(), editandoDetalleInsumo)

    if (cantidadNumerica > stockDisponibleCalculado) {
      errores.push(`La cantidad no puede ser mayor al stock disponible (${stockDisponibleCalculado})`)
    }

    return errores
  }

  const handleAddPotrero = () => {
    const erroresValidacion = validarDetallePotreros()
    if (erroresValidacion.length > 0) {
      setErroresDetallePotreros(erroresValidacion)
      return
    }

    const potreroSeleccionado = potreros.find((p) => p.id === newPotrero.potrero_id)
    const nuevoPotrero: DetallePotrero = {
      ...newPotrero,
      potrero_nombre: potreroSeleccionado?.nombre,
    }

    if (editandoDetallePotrero !== null) {
      const nuevosDetalles = [...detallesPotreros]
      nuevosDetalles[editandoDetallePotrero] = nuevoPotrero
      setDetallesPotreros(nuevosDetalles)
      setEditandoDetallePotrero(null)
    } else {
      setDetallesPotreros([...detallesPotreros, nuevoPotrero])
    }

    limpiarFormularioDetallePotreros()
  }

  const handleAddInsumo = () => {
    const erroresValidacion = validarDetalleInsumos()
    if (erroresValidacion.length > 0) {
      setErroresDetalleInsumos(erroresValidacion)
      return
    }

    const insumoSeleccionado = insumosExistentes.find((i) => i.insumo_id === newInsumo.insumo_id.toString())
    const nuevoInsumo: DetalleInsumo = {
      ...newInsumo,
      insumo_nombre: insumoSeleccionado?.nombre_insumo || `Insumo ${newInsumo.insumo_id}`,
      unidad_medida: insumoSeleccionado?.unidad_medida || "",
      cantidad_disponible: insumoSeleccionado?.cantidad_disponible || 0,
      es_original: false, // Los nuevos detalles no son originales
    }

    if (editandoDetalleInsumo !== null) {
      const nuevosDetalles = [...detallesInsumos]
      const detalleAnterior = nuevosDetalles[editandoDetalleInsumo]

      // Si estamos editando un detalle original, mantener la cantidad original
      if (detalleAnterior.es_original) {
        nuevoInsumo.es_original = true
        nuevoInsumo.cantidad_original = detalleAnterior.cantidad_original
      }

      nuevosDetalles[editandoDetalleInsumo] = nuevoInsumo
      setDetallesInsumos(nuevosDetalles)
      setEditandoDetalleInsumo(null)
    } else {
      setDetallesInsumos([...detallesInsumos, nuevoInsumo])
    }

    limpiarFormularioDetalleInsumos()
  }

  const editarDetallePotrero = (index: number) => {
    const detalle = detallesPotreros[index]
    setNewPotrero({
      potrero_id: detalle.potrero_id,
      tipo_trabajo: detalle.tipo_trabajo,
      observaciones: detalle.observaciones,
    })
    setEditandoDetallePotrero(index)
    setShowAddPotreroForm(true)
    setErroresDetallePotreros([])
    setActiveTab("potreros")
  }

  const editarDetalleInsumo = (index: number) => {
    const detalle = detallesInsumos[index]
    setNewInsumo({
      insumo_id: detalle.insumo_id,
      cantidad: detalle.cantidad,
    })
    setEditandoDetalleInsumo(index)
    setShowAddInsumoForm(true)
    setErroresDetalleInsumos([])
    setActiveTab("insumos")
  }

  const handleRemovePotrero = (index: number) => {
    setDetallesPotreros(detallesPotreros.filter((_, i) => i !== index))
  }

  const handleRemoveInsumo = (index: number) => {
    setDetallesInsumos(detallesInsumos.filter((_, i) => i !== index))
  }

  const limpiarFormularioDetallePotreros = () => {
    setNewPotrero({
      potrero_id: 0,
      tipo_trabajo: "Reparación",
      observaciones: "",
    })
    setShowAddPotreroForm(false)
    setEditandoDetallePotrero(null)
    setErroresDetallePotreros([])
  }

  const limpiarFormularioDetalleInsumos = () => {
    setNewInsumo({
      insumo_id: 0,
      cantidad: 0,
    })
    setShowAddInsumoForm(false)
    setEditandoDetalleInsumo(null)
    setErroresDetalleInsumos([])
  }

  const handleSubmit = async () => {
    console.log("[v0] Iniciando handleSubmit")
    const erroresValidacion = validarFormularioPrincipal()
    if (erroresValidacion.length > 0) {
      console.log("[v0] Errores de validación:", erroresValidacion)
      setErrores(erroresValidacion)
      setMostrarModalErrores(true)
      return
    }

    setLoading(true)
    try {
      const payload = {
        id: parte?.pd_id,
        fecha: fecha.toISOString().split("T")[0],
        hora,
        nota,
        detalles_potreros: detallesPotreros.map((d) => ({
          ...d,
          incidente_detalle: d.observaciones,
        })),
        detalles_insumos: detallesInsumos,
        establecimiento_id: parte?.pd_establecimiento_id,
        user_id: parte?.pd_usuario_id,
      }

      console.log("[v0] Enviando payload:", payload)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/actividades-mixtas/${parte?.pd_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      console.log("[v0] Response status:", response.status)
      console.log("[v0] Response ok:", response.ok)

      if (response.ok) {
        console.log("[v0] Respuesta exitosa, mostrando toast")
        const cantidadPotreros = detallesPotreros.length
        const cantidadInsumos = detallesInsumos.length

        let descripcion = ""
        if (cantidadPotreros > 0 && cantidadInsumos > 0) {
          descripcion = `Se actualizaron ${cantidadPotreros} potrero${cantidadPotreros > 1 ? "s" : ""} y ${cantidadInsumos} insumo${cantidadInsumos > 1 ? "s" : ""}`
        } else if (cantidadPotreros > 0) {
          descripcion = `Se actualizaron ${cantidadPotreros} potrero${cantidadPotreros > 1 ? "s" : ""}`
        } else if (cantidadInsumos > 0) {
          descripcion = `Se actualizaron ${cantidadInsumos} insumo${cantidadInsumos > 1 ? "s" : ""}`
        } else {
          descripcion = "Actividad actualizada correctamente"
        }

        console.log("[v0] Ejecutando toast con descripción:", descripcion)

        toast({
          title: "✅ Cañerías y Bebederos actualizada",
          description: descripcion,
          duration: 4000,
        })

        console.log("[v0] Toast ejecutado, disparando evento")

        window.dispatchEvent(new CustomEvent("reloadPartesDiarios"))

        onClose?.()
        onSuccess?.()
      } else {
        const errorData = await response.json()
        console.log("[v0] Error en respuesta:", errorData)
        throw new Error(errorData.error || "Error al actualizar la actividad")
      }
    } catch (error) {
      console.error("[v0] Error en handleSubmit:", error)
      toast({
        title: "❌ Error",
        description: error instanceof Error ? error.message : "Error al actualizar la actividad",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const eliminarActividad = async () => {
    if (!parte?.pd_id || !usuario?.id) {
      toast({
        title: "❌ Error",
        description: "No se pudo identificar la actividad o el usuario",
        variant: "destructive",
      })
      return
    }

    setDeleting(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/actividades-mixtas/${parte.pd_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_user_id: usuario.id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al eliminar cañerías y bebederos")
      }

      toast({
        title: "✅ Cañerías y Bebederos Eliminada",
        description: "La actividad ha sido eliminada correctamente",
        duration: 4000,
      })

      window.dispatchEvent(new Event("reloadPartesDiarios"))

      handleClose()
      onSuccess?.()
    } catch (error) {
      console.error("Error deleting cañerías y bebederos:", error)
      toast({
        title: "❌ Error",
        description: error instanceof Error ? error.message : "Error al eliminar cañerías y bebederos",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleClose = () => {
    onClose()
    // Reset form
    setFecha(new Date())
    setHora(new Date().toTimeString().slice(0, 5))
    setNota("")
    setDetallesPotreros([])
    setDetallesInsumos([])
    limpiarFormularioDetallePotreros()
    limpiarFormularioDetalleInsumos()
    setErrores([])
    setMostrarModalErrores(false) // Reset modal state on close
  }

  const getUserDisplayName = () => {
    if (parte?.pd_usuario_nombres && parte?.pd_usuario_apellidos) {
      return `${parte.pd_usuario_nombres} ${parte.pd_usuario_apellidos}`
    }
    if (parte?.pd_usuario_nombres) {
      return parte.pd_usuario_nombres
    }
    if (parte?.pd_usuario) {
      return parte.pd_usuario
    }
    return "Usuario desconocido"
  }

  const puedeEliminar = () => {
    if (!parte) return false

    try {
      let detalles
      if (typeof parte.pd_detalles === "string") {
        detalles = JSON.parse(parte.pd_detalles)
      } else {
        detalles = parte.pd_detalles
      }

      return detalles?.detalle_deleteable === true
    } catch {
      return false
    }
  }

  // Filtrar potreros que ya están agregados
  const potrerosDisponibles = potreros.filter((potrero) => {
    // Si estamos editando, permitir el potrero actual
    if (editandoDetallePotrero !== null) {
      const detalleEditando = detallesPotreros[editandoDetallePotrero]
      if (detalleEditando && detalleEditando.potrero_id === potrero.id) {
        return true
      }
    }
    // Excluir potreros ya agregados
    return !detallesPotreros.some((d) => d.potrero_id === potrero.id)
  })

  const opcionesPotreros = potrerosDisponibles
    .filter((potrero) => potrero && potrero.id && potrero.nombre)
    .map((potrero) => ({
      value: potrero.id.toString(),
      label: potrero.nombre,
    }))

  const opcionesInsumos = insumosExistentes
    .filter((insumo) => insumo && insumo.insumo_id && insumo.nombre_insumo)
    .map((insumo) => ({
      value: insumo.insumo_id,
      label: insumo.nombre_insumo,
    }))

  const opcionesTipoTrabajo = [
    { value: "Reparación", label: "Reparación" },
    { value: "Instalación", label: "Instalación" },
  ]

  if (!parte) return null

  return (
    <Drawer open={isOpen} onOpenChange={onClose} direction="right">
      <DrawerContent className="h-full w-[850px] ml-auto">
        <DrawerHeader className="flex items-center justify-between border-b pb-4">
          <DrawerTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Wrench className="w-6 h-6 text-orange-600" />
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            Editar Cañerías y Bebederos
          </DrawerTitle>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div>
              <div className="space-y-4">
                <div>
                  <Label>Fecha *</Label>
                  <CustomDatePicker date={fecha} onDateChange={setFecha} placeholder="Seleccionar fecha" />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Detalles *</h3>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="potreros" className="flex items-center gap-2">
                    <Wrench className="w-4 h-4" />
                    Potreros ({detallesPotreros.length})
                  </TabsTrigger>
                  <TabsTrigger value="insumos" className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Insumos ({detallesInsumos.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="potreros" className="space-y-4">
                  <div className="flex justify-end">
                    <Button
                      onClick={() => setShowAddPotreroForm(true)}
                      disabled={potrerosDisponibles.length === 0}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar línea
                    </Button>
                  </div>

                  {/* Formulario de detalle potreros */}
                  {showAddPotreroForm && (
                    <div className="bg-gray-50 border rounded-lg p-6">
                      {/* Errores de detalle potreros */}
                      {erroresDetallePotreros.length > 0 && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                          <div className="flex items-center gap-2 text-red-800 font-medium mb-1">
                            <AlertCircle className="w-4 h-4" />
                            Errores encontrados:
                          </div>
                          <ul className="list-disc list-inside text-red-700 text-sm space-y-1">
                            {erroresDetallePotreros.map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <h4 className="font-medium mb-4">
                        {editandoDetallePotrero !== null ? "Editar Detalle Potrero" : "Nuevo Detalle Potrero"}
                      </h4>

                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Potrero *</Label>
                            <CustomCombobox
                              options={opcionesPotreros}
                              value={
                                newPotrero.potrero_id && newPotrero.potrero_id > 0
                                  ? newPotrero.potrero_id.toString()
                                  : ""
                              }
                              onValueChange={(value) =>
                                setNewPotrero({ ...newPotrero, potrero_id: Number.parseInt(value) || 0 })
                              }
                              placeholder="Selecciona potrero..."
                              searchPlaceholder="Buscar potrero..."
                              emptyMessage="No se encontraron potreros disponibles."
                              loading={loadingPotreros}
                            />
                          </div>

                          <div>
                            <Label>Tipo de Trabajo *</Label>
                            <CustomCombobox
                              options={opcionesTipoTrabajo}
                              value={newPotrero.tipo_trabajo}
                              onValueChange={(value) =>
                                setNewPotrero({ ...newPotrero, tipo_trabajo: value as "Reparación" | "Instalación" })
                              }
                              placeholder="Selecciona tipo de trabajo..."
                              searchPlaceholder="Buscar tipo de trabajo..."
                              emptyMessage="No se encontraron opciones."
                            />
                          </div>
                        </div>

                        <div>
                          <Label>Observaciones</Label>
                          <Textarea
                            value={newPotrero.observaciones}
                            onChange={(e) => setNewPotrero({ ...newPotrero, observaciones: e.target.value })}
                            placeholder="Detalles del trabajo realizado..."
                            rows={3}
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 mt-6">
                        <Button onClick={handleAddPotrero} className="bg-green-600 hover:bg-green-700">
                          {editandoDetallePotrero !== null ? "Actualizar" : "Agregar"}
                        </Button>
                        <Button variant="outline" onClick={limpiarFormularioDetallePotreros}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Tabla de detalles potreros */}
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 border-b">
                      <div className="grid grid-cols-12 gap-2 p-3 text-sm font-medium text-gray-700">
                        <div className="col-span-3">Potrero</div>
                        <div className="col-span-2 text-center">Tipo Trabajo</div>
                        <div className="col-span-5">Observaciones</div>
                        <div className="col-span-2 text-center">Acciones</div>
                      </div>
                    </div>

                    <div className="min-h-[100px]">
                      {detallesPotreros.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">No hay detalles de potreros agregados</div>
                      ) : (
                        <div className="divide-y">
                          {detallesPotreros.map((detalle, index) => (
                            <div
                              key={index}
                              className="grid grid-cols-12 gap-2 p-3 text-sm hover:bg-gray-50 items-center"
                            >
                              <div className="col-span-3 font-medium truncate">
                                {detalle.potrero_nombre || `Potrero ${detalle.potrero_id}`}
                              </div>
                              <div className="col-span-2 text-center">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    detalle.tipo_trabajo === "Reparación"
                                      ? "bg-orange-100 text-orange-800"
                                      : "bg-green-100 text-green-800"
                                  }`}
                                >
                                  {detalle.tipo_trabajo}
                                </span>
                              </div>
                              <div className="col-span-5 truncate text-gray-600">{detalle.observaciones || "-"}</div>
                              <div className="col-span-2 flex justify-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => editarDetallePotrero(index)}
                                  className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemovePotrero(index)}
                                  className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="insumos" className="space-y-4">
                  <div className="flex justify-end">
                    <Button onClick={() => setShowAddInsumoForm(true)} className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar línea
                    </Button>
                  </div>

                  {/* Formulario de detalle insumos */}
                  {showAddInsumoForm && (
                    <div className="bg-gray-50 border rounded-lg p-6">
                      {/* Errores de detalle insumos */}
                      {erroresDetalleInsumos.length > 0 && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                          <div className="flex items-center gap-2 text-red-800 font-medium mb-1">
                            <AlertCircle className="w-4 h-4" />
                            Errores encontrados:
                          </div>
                          <ul className="list-disc list-inside text-red-700 text-sm space-y-1">
                            {erroresDetalleInsumos.map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <h4 className="font-medium mb-4">
                        {editandoDetalleInsumo !== null ? "Editar Detalle Insumo" : "Nuevo Detalle Insumo"}
                      </h4>

                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Insumo *</Label>
                            <CustomCombobox
                              options={opcionesInsumos}
                              value={
                                newInsumo.insumo_id && newInsumo.insumo_id > 0 ? newInsumo.insumo_id.toString() : ""
                              }
                              onValueChange={(value) =>
                                setNewInsumo({ ...newInsumo, insumo_id: Number.parseInt(value) || 0 })
                              }
                              placeholder="Selecciona insumo..."
                              searchPlaceholder="Buscar insumo..."
                              emptyMessage="No se encontraron insumos disponibles."
                              loading={loadingInsumos}
                            />
                          </div>

                          <div>
                            <Label>
                              Cantidad *{" "}
                              {newInsumo.insumo_id > 0 &&
                                (() => {
                                  const stockDisponibleReal = calcularStockDisponible(
                                    newInsumo.insumo_id.toString(),
                                    editandoDetalleInsumo,
                                  )
                                  return `(Disponible: ${stockDisponibleReal})`
                                })()}
                            </Label>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min="1"
                                value={newInsumo.cantidad || ""}
                                onChange={(e) => {
                                  const valor = e.target.value
                                  setNewInsumo({
                                    ...newInsumo,
                                    cantidad: valor === "" ? 0 : Number.parseInt(valor) || 0,
                                  })
                                }}
                                placeholder="Ej: 5"
                                className="flex-1"
                              />
                              {newInsumo.insumo_id > 0 &&
                                (() => {
                                  const insumoSeleccionado = insumosExistentes.find(
                                    (i) => i.insumo_id === newInsumo.insumo_id.toString(),
                                  )
                                  return insumoSeleccionado?.unidad_medida ? (
                                    <span className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-2 rounded border min-w-[80px] text-center">
                                      {insumoSeleccionado.unidad_medida}
                                    </span>
                                  ) : null
                                })()}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-6">
                        <Button onClick={handleAddInsumo} className="bg-blue-600 hover:bg-blue-700">
                          {editandoDetalleInsumo !== null ? "Actualizar" : "Agregar"}
                        </Button>
                        <Button variant="outline" onClick={limpiarFormularioDetalleInsumos}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}

                  {/*Tabla de detalles insumos */}
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 border-b">
                      <div className="grid grid-cols-10 gap-4 p-4 text-sm font-medium text-gray-700">
                        <div className="col-span-4">Insumo</div>
                        <div className="col-span-2">Cantidad</div>
                        <div className="col-span-2">Unidad Medida</div>
                        <div className="col-span-2 text-center">Acciones</div>
                      </div>
                    </div>

                    <div className="min-h-[100px]">
                      {detallesInsumos.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">No hay detalles de insumos agregados</div>
                      ) : (
                        <div className="divide-y">
                          {detallesInsumos.map((detalle, index) => (
                            <div key={index} className="grid grid-cols-10 gap-4 p-4 text-sm hover:bg-gray-50">
                              <div className="col-span-4 font-medium">{detalle.insumo_nombre}</div>
                              <div className="col-span-2">{detalle.cantidad}</div>
                              <div className="col-span-2 text-gray-600">{detalle.unidad_medida || "-"}</div>
                              <div className="col-span-2 flex justify-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => editarDetalleInsumo(index)}
                                  className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveInsumo(index)}
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Nota */}
            <div>
              <Label htmlFor="nota" className="text-sm font-medium text-gray-700">
                Nota
              </Label>
              <Textarea
                id="nota"
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                placeholder="Observaciones adicionales..."
                className="mt-1"
                rows={4}
              />
            </div>
          </div>
        </div>

        {/* Diálogo de confirmación de eliminación */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Confirmar Eliminación</h3>
              <p className="text-gray-600 mb-6">
                ¿Está seguro que desea eliminar esta cañerías y bebederos? Esta acción no se puede deshacer.
              </p>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} disabled={deleting}>
                  Cancelar
                </Button>
                <Button variant="destructive" onClick={eliminarActividad} disabled={deleting}>
                  {deleting ? "Eliminando..." : "Eliminar"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {mostrarModalErrores && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
              <div className="flex items-start gap-3 mb-4">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-red-600 mb-3">Se encontraron {errores.length} errores:</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    {errores.map((error, index) => (
                      <li key={index} className="text-sm">
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <Button onClick={() => setMostrarModalErrores(false)} className="bg-red-600 hover:bg-red-700">
                  Aceptar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t p-4 flex justify-between">
          {puedeEliminar() ? (
            <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)} disabled={loading || deleting}>
              {deleting ? "Eliminando..." : "Eliminar"}
            </Button>
          ) : (
            <div className="flex flex-col">
              <Button variant="outline" disabled className="text-gray-400 cursor-not-allowed bg-transparent">
                Eliminar
              </Button>
              <span className="text-xs text-gray-500 mt-1">Esta actividad no puede ser eliminada</span>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={handleClose} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={loading} className="bg-green-600 hover:bg-green-700">
              {loading ? "Actualizando..." : "Actualizar Actividad"}
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
