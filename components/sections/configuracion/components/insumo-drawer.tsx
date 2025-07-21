"use client"

import { useState, useEffect } from "react"
import { X, Package } from "lucide-react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CustomCombobox } from "@/components/ui/custom-combobox"
import { useCurrentEstablishment } from "@/hooks/use-current-establishment"
import { toast } from "sonner"

interface ClaseInsumo {
  id: number
  nombre: string
}

interface TipoInsumo {
  id: number
  clase_insumo_id: number
  nombre: string
}

interface SubtipoInsumo {
  id: number
  tipo_insumo_id: number
  nombre: string
}

interface UnidadMedida {
  id: number
  nombre: string
}

interface InsumoStock {
  id: number
  insumo_id: number
  cantidad: number
}

interface Insumo {
  id: number
  empresa_id: number
  establecimiento_id: number
  clase_insumo_id: number
  tipo_insumo_id: number
  subtipo_insumo_id: number
  nombre: string
  contenido: number
  unidad_medida_producto: number
  unidad_medida_uso: number
  stock?: InsumoStock
}

interface InsumoDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  insumo?: Insumo | null
  mode: "create" | "edit"
}

export function InsumoDrawer({ isOpen, onClose, onSuccess, insumo, mode }: InsumoDrawerProps) {
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  // Estados para los datos del formulario
  const [nombre, setNombre] = useState("")
  const [contenido, setContenido] = useState("")
  const [claseInsumoId, setClaseInsumoId] = useState<number | null>(null)
  const [tipoInsumoId, setTipoInsumoId] = useState<number | null>(null)
  const [subtipoInsumoId, setSubtipoInsumoId] = useState<number | null>(null)
  const [unidadMedidaProducto, setUnidadMedidaProducto] = useState<number | null>(null)
  const [unidadMedidaUso, setUnidadMedidaUso] = useState<number | null>(null)
  const [cantidadStock, setCantidadStock] = useState("")

  // Estados para los datos de los dropdowns
  const [clasesInsumos, setClasesInsumos] = useState<ClaseInsumo[]>([])
  const [tiposInsumos, setTiposInsumos] = useState<TipoInsumo[]>([])
  const [subtiposInsumos, setSubtiposInsumos] = useState<SubtipoInsumo[]>([])
  const [unidadesMedida, setUnidadesMedida] = useState<UnidadMedida[]>([])

  // Estados para los datos filtrados
  const [tiposFiltrados, setTiposFiltrados] = useState<TipoInsumo[]>([])
  const [subtiposFiltrados, setSubtiposFiltrados] = useState<SubtipoInsumo[]>([])

  const { currentEstablishment } = useCurrentEstablishment()

  // Cargar datos de los dropdowns al abrir el drawer
  useEffect(() => {
    if (isOpen) {
      loadDropdownData()
    }
  }, [isOpen])

  // Cargar datos del insumo cuando se abre en modo edición
  useEffect(() => {
    if (
      isOpen &&
      mode === "edit" &&
      insumo &&
      clasesInsumos.length > 0 &&
      tiposInsumos.length > 0 &&
      subtiposInsumos.length > 0 &&
      unidadesMedida.length > 0
    ) {
      setNombre(insumo.nombre)
      setContenido(insumo.contenido.toString())
      setClaseInsumoId(insumo.clase_insumo_id)
      setTipoInsumoId(insumo.tipo_insumo_id)
      setSubtipoInsumoId(insumo.subtipo_insumo_id)
      setUnidadMedidaProducto(insumo.unidad_medida_producto)
      setUnidadMedidaUso(insumo.unidad_medida_uso)
      setCantidadStock(insumo.stock?.cantidad?.toString() || "0")
    }
  }, [isOpen, mode, insumo, clasesInsumos, tiposInsumos, subtiposInsumos, unidadesMedida])

  // Filtrar tipos cuando cambia la clase
  useEffect(() => {
    if (claseInsumoId) {
      const tiposFiltrados = tiposInsumos.filter((tipo) => tipo.clase_insumo_id === claseInsumoId)
      setTiposFiltrados(tiposFiltrados)

      // Solo limpiar si no estamos en modo edición o si el tipo actual no pertenece a la nueva clase
      if (mode === "create" || (tipoInsumoId && !tiposFiltrados.find((t) => t.id === tipoInsumoId))) {
        setTipoInsumoId(null)
        setSubtipoInsumoId(null)
      }
    } else {
      setTiposFiltrados([])
      if (mode === "create") {
        setTipoInsumoId(null)
        setSubtipoInsumoId(null)
      }
    }
  }, [claseInsumoId, tiposInsumos, mode, tipoInsumoId])

  // Filtrar subtipos cuando cambia el tipo
  useEffect(() => {
    if (tipoInsumoId) {
      const subtiposFiltrados = subtiposInsumos.filter((subtipo) => subtipo.tipo_insumo_id === tipoInsumoId)
      setSubtiposFiltrados(subtiposFiltrados)

      // Solo limpiar si no estamos en modo edición o si el subtipo actual no pertenece al nuevo tipo
      if (mode === "create" || (subtipoInsumoId && !subtiposFiltrados.find((s) => s.id === subtipoInsumoId))) {
        setSubtipoInsumoId(null)
      }
    } else {
      setSubtiposFiltrados([])
      if (mode === "create") {
        setSubtipoInsumoId(null)
      }
    }
  }, [tipoInsumoId, subtiposInsumos, mode, subtipoInsumoId])

  const loadDropdownData = async () => {
    try {
      const [clasesRes, tiposRes, subtiposRes, unidadesRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clase-insumos`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tipos-insumo`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/subtipos-insumo`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/unidad-medida-insumos`),
      ])

      const [clasesData, tiposData, subtiposData, unidadesData] = await Promise.all([
        clasesRes.json(),
        tiposRes.json(),
        subtiposRes.json(),
        unidadesRes.json(),
      ])

      setClasesInsumos(clasesData.clases || [])
      setTiposInsumos(tiposData.tipos || [])
      setSubtiposInsumos(subtiposData.subtipos || [])
      setUnidadesMedida(unidadesData.unidades || [])
    } catch (error) {
      console.error("Error loading dropdown data:", error)
      toast.error("Error al cargar los datos")
    }
  }

  const resetForm = () => {
    setNombre("")
    setContenido("")
    setClaseInsumoId(null)
    setTipoInsumoId(null)
    setSubtipoInsumoId(null)
    setUnidadMedidaProducto(null)
    setUnidadMedidaUso(null)
    setCantidadStock("")
    setErrors([])
  }

  const validateForm = () => {
    const newErrors: string[] = []

    if (!nombre.trim() || nombre.trim().length < 3) {
      newErrors.push("El nombre debe tener al menos 3 caracteres")
    }

    if (!contenido || Number.parseInt(contenido) <= 0) {
      newErrors.push("El contenido debe ser mayor a 0")
    }

    if (!claseInsumoId) {
      newErrors.push("Debe seleccionar una clase de insumo")
    }

    if (!tipoInsumoId) {
      newErrors.push("Debe seleccionar un tipo de insumo")
    }

    if (!subtipoInsumoId) {
      newErrors.push("Debe seleccionar un subtipo de insumo")
    }

    if (!unidadMedidaProducto) {
      newErrors.push("Debe seleccionar una unidad de medida del producto")
    }

    if (!unidadMedidaUso) {
      newErrors.push("Debe seleccionar una unidad de medida de uso")
    }

    if (!cantidadStock || Number.parseInt(cantidadStock) <= 0) {
      newErrors.push("La cantidad en stock debe ser mayor a 0")
    }

    setErrors(newErrors)
    return newErrors.length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    if (!currentEstablishment) {
      toast.error("No hay establecimiento seleccionado")
      return
    }

    setLoading(true)

    try {
      const insumoData = {
        empresa_id: currentEstablishment.empresa_id,
        establecimiento_id: currentEstablishment.id,
        clase_insumo_id: claseInsumoId,
        tipo_insumo_id: tipoInsumoId,
        subtipo_insumo_id: subtipoInsumoId,
        nombre: nombre.trim(),
        contenido: Number.parseInt(contenido),
        unidad_medida_producto: unidadMedidaProducto,
        unidad_medida_uso: unidadMedidaUso,
        cantidad_stock: Number.parseInt(cantidadStock),
      }

      let response
      if (mode === "create") {
        response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/insumos-crud`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(insumoData),
        })
      } else {
        response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/insumos-crud/${insumo?.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(insumoData),
        })
      }

      if (!response.ok) {
        throw new Error(`Error ${response.status}`)
      }

      toast.success(mode === "create" ? "Insumo creado exitosamente" : "Insumo actualizado exitosamente")
      resetForm()
      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error saving insumo:", error)
      toast.error("Error al guardar el insumo")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Drawer open={isOpen} onOpenChange={handleClose} direction="right">
      <DrawerContent className="h-full w-96 ml-auto">
        <DrawerHeader className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-green-600" />
            <DrawerTitle className="text-xl font-bold text-gray-900">
              {mode === "create" ? "Nuevo Insumo" : "Editar Insumo"}
            </DrawerTitle>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </DrawerHeader>

        <div className="p-6 space-y-6 overflow-y-auto">
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertDescription>
                Se encontraron {errors.length} errores:
                <ul className="list-disc list-inside mt-2">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Datos del Insumo */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900">Datos del Insumo</h3>
              <Package className="h-4 w-4 text-gray-500" />
            </div>

            {/* Nombre y Contenido */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre del insumo *</Label>
                <Input
                  id="nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ingrese el nombre"
                />
                <p className="text-xs text-gray-500">Mínimo 3 caracteres</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contenido">Contenido *</Label>
                <Input
                  id="contenido"
                  type="number"
                  value={contenido}
                  onChange={(e) => setContenido(e.target.value)}
                  placeholder="0"
                  min="1"
                />
                <p className="text-xs text-gray-500">Debe ser mayor a 0</p>
              </div>
            </div>

            {/* Clase de insumo - fila completa */}
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label>Clase de insumo *</Label>
                <CustomCombobox
                  options={clasesInsumos.map((clase) => ({
                    value: clase.id.toString(),
                    label: clase.nombre,
                  }))}
                  value={claseInsumoId?.toString() || ""}
                  onValueChange={(value) => setClaseInsumoId(value ? Number.parseInt(value) : null)}
                  placeholder="Selecciona clase..."
                  searchPlaceholder="Buscar clase..."
                  emptyText="No se encontraron clases"
                />
              </div>
            </div>

            {/* Tipo y Subtipo */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de insumo *</Label>
                <CustomCombobox
                  options={tiposFiltrados.map((tipo) => ({
                    value: tipo.id.toString(),
                    label: tipo.nombre,
                  }))}
                  value={tipoInsumoId?.toString() || ""}
                  onValueChange={(value) => setTipoInsumoId(value ? Number.parseInt(value) : null)}
                  placeholder="Selecciona tipo..."
                  searchPlaceholder="Buscar tipo..."
                  emptyText="No se encontraron tipos"
                  disabled={!claseInsumoId}
                />
              </div>

              <div className="space-y-2">
                <Label>Subtipo de insumo *</Label>
                <CustomCombobox
                  options={subtiposFiltrados.map((subtipo) => ({
                    value: subtipo.id.toString(),
                    label: subtipo.nombre,
                  }))}
                  value={subtipoInsumoId?.toString() || ""}
                  onValueChange={(value) => setSubtipoInsumoId(value ? Number.parseInt(value) : null)}
                  placeholder="Selecciona subtipo..."
                  searchPlaceholder="Buscar subtipo..."
                  emptyText="No se encontraron subtipos"
                  disabled={!tipoInsumoId}
                />
              </div>
            </div>

            {/* Unidades de medida */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Unidad de medida del producto *</Label>
                <CustomCombobox
                  options={unidadesMedida.map((unidad) => ({
                    value: unidad.id.toString(),
                    label: unidad.nombre,
                  }))}
                  value={unidadMedidaProducto?.toString() || ""}
                  onValueChange={(value) => setUnidadMedidaProducto(value ? Number.parseInt(value) : null)}
                  placeholder="Selecciona unidad..."
                  searchPlaceholder="Buscar unidad..."
                  emptyText="No se encontraron unidades"
                />
              </div>

              <div className="space-y-2">
                <Label>Unidad de medida de uso *</Label>
                <CustomCombobox
                  options={unidadesMedida.map((unidad) => ({
                    value: unidad.id.toString(),
                    label: unidad.nombre,
                  }))}
                  value={unidadMedidaUso?.toString() || ""}
                  onValueChange={(value) => setUnidadMedidaUso(value ? Number.parseInt(value) : null)}
                  placeholder="Selecciona unidad..."
                  searchPlaceholder="Buscar unidad..."
                  emptyText="No se encontraron unidades"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Stock del Insumo */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900">Stock del Insumo</h3>
              <Package className="h-4 w-4 text-gray-500" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cantidadStock">Cantidad en stock *</Label>
              <Input
                id="cantidadStock"
                type="number"
                value={cantidadStock}
                onChange={(e) => setCantidadStock(e.target.value)}
                placeholder="0"
                min="1"
              />
              <p className="text-xs text-gray-500">Debe ser mayor a 0</p>
            </div>
          </div>

          {/* Información adicional */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Información sobre los insumos</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Los insumos son productos utilizados en las actividades agropecuarias</li>
              <li>• Cada insumo debe tener una clasificación completa (clase, tipo, subtipo)</li>
              <li>• El stock representa la cantidad disponible en el establecimiento</li>
            </ul>
          </div>
        </div>

        {/* Botones */}
        <div className="border-t p-4 flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Guardando..." : mode === "create" ? "Crear Insumo" : "Actualizar Insumo"}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
