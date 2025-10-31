"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Package, X, AlertCircle, CheckCircle, Edit } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { useEstablishment } from "@/contexts/establishment-context"
import { CustomCombobox } from "@/components/ui/custom-combobox"

interface Insumo {
  id: number
  nombre: string
  contenido: number
  empresa_id: number
  establecimiento_id: number
  clase_insumo_id: number
  tipo_insumo_id: number
  subtipo_insumo_id: number
  unidad_medida_producto: number
  unidad_medida_uso: number
  stock?: {
    id: number
    cantidad: number
  }
}

interface ClaseInsumo {
  id: number
  nombre: string
}

interface TipoInsumo {
  id: number
  nombre: string
  clase_insumo_id: number
}

interface SubtipoInsumo {
  id: number
  nombre: string
  tipo_insumo_id: number
}

interface UnidadMedida {
  id: number
  nombre: string
}

interface InsumoDrawerProps {
  insumo: Insumo | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  mode: "create" | "edit"
  establecimientoId: string
}

export function InsumoDrawer({ insumo, isOpen, onClose, onSuccess, mode, establecimientoId }: InsumoDrawerProps) {
  const { toast } = useToast()
  const { empresaSeleccionada } = useEstablishment()

  const [loading, setLoading] = useState(false)
  const [mostrarExito, setMostrarExito] = useState(false)
  const [mostrarModalErrores, setMostrarModalErrores] = useState(false)

  const [clases, setClases] = useState<ClaseInsumo[]>([])
  const [tipos, setTipos] = useState<TipoInsumo[]>([])
  const [subtipos, setSubtipos] = useState<SubtipoInsumo[]>([])
  const [unidadesMedida, setUnidadesMedida] = useState<UnidadMedida[]>([])
  const [loadingDropdowns, setLoadingDropdowns] = useState(false)

  const [formData, setFormData] = useState({
    nombre: "",
    contenido: "",
    clase_insumo_id: "",
    tipo_insumo_id: "",
    subtipo_insumo_id: "",
    unidad_medida_producto: "",
    unidad_medida_uso: "",
  })

  const [stockData, setStockData] = useState({
    cantidad: "",
  })

  const [errors, setErrors] = useState<string[]>([])

  useEffect(() => {
    if (isOpen) {
      fetchDropdownData().then(() => {
        if (mode === "edit" && insumo) {
          setFormData({
            nombre: insumo.nombre || "",
            contenido: insumo.contenido?.toString() || "",
            clase_insumo_id: insumo.clase_insumo_id?.toString() || "",
            tipo_insumo_id: insumo.tipo_insumo_id?.toString() || "",
            subtipo_insumo_id: insumo.subtipo_insumo_id?.toString() || "",
            unidad_medida_producto: insumo.unidad_medida_producto?.toString() || "",
            unidad_medida_uso: insumo.unidad_medida_uso?.toString() || "",
          })
          setStockData({
            cantidad: insumo.stock?.cantidad?.toString() || "",
          })
        } else if (mode === "create") {
          setFormData({
            nombre: "",
            contenido: "",
            clase_insumo_id: "",
            tipo_insumo_id: "",
            subtipo_insumo_id: "",
            unidad_medida_producto: "",
            unidad_medida_uso: "",
          })
          setStockData({
            cantidad: "",
          })
        }
      })
      setErrors([])
      setMostrarExito(false)
    }
  }, [insumo, isOpen, mode])

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        nombre: "",
        contenido: "",
        clase_insumo_id: "",
        tipo_insumo_id: "",
        subtipo_insumo_id: "",
        unidad_medida_producto: "",
        unidad_medida_uso: "",
      })
      setStockData({
        cantidad: "",
      })
      setErrors([])
      setMostrarExito(false)
      setClases([])
      setTipos([])
      setSubtipos([])
      setUnidadesMedida([])
    }
  }, [isOpen])

  useEffect(() => {
    if (formData.clase_insumo_id && tipos.length > 0) {
      const tiposFiltrados = tipos.filter((tipo) => tipo.clase_insumo_id.toString() === formData.clase_insumo_id)
      if (formData.tipo_insumo_id && !tiposFiltrados.find((t) => t.id.toString() === formData.tipo_insumo_id)) {
        if (mode !== "edit" || !insumo) {
          setFormData((prev) => ({ ...prev, tipo_insumo_id: "", subtipo_insumo_id: "" }))
        }
      }
    } else if (!formData.clase_insumo_id) {
      if (mode !== "edit" || !insumo) {
        setFormData((prev) => ({ ...prev, tipo_insumo_id: "", subtipo_insumo_id: "" }))
      }
    }
  }, [formData.clase_insumo_id, tipos, mode, insumo])

  useEffect(() => {
    if (formData.tipo_insumo_id && subtipos.length > 0) {
      const subtiposFiltrados = subtipos.filter(
        (subtipo) => subtipo.tipo_insumo_id.toString() === formData.tipo_insumo_id,
      )
      if (
        formData.subtipo_insumo_id &&
        !subtiposFiltrados.find((s) => s.id.toString() === formData.subtipo_insumo_id)
      ) {
        if (mode !== "edit" || !insumo) {
          setFormData((prev) => ({ ...prev, subtipo_insumo_id: "" }))
        }
      }
    } else if (!formData.tipo_insumo_id) {
      if (mode !== "edit" || !insumo) {
        setFormData((prev) => ({ ...prev, subtipo_insumo_id: "" }))
      }
    }
  }, [formData.tipo_insumo_id, subtipos, mode, insumo])

  const fetchDropdownData = async () => {
    setLoadingDropdowns(true)
    try {
      const [clasesRes, tiposRes, subtiposRes, unidadesRes] = await Promise.all([
        fetch("/api/clase-insumos"),
        fetch("/api/tipos-insumo"),
        fetch("/api/subtipos-insumo"),
        fetch("/api/unidad-medida-insumos"),
      ])

      const [clasesData, tiposData, subtiposData, unidadesData] = await Promise.all([
        clasesRes.json(),
        tiposRes.json(),
        subtiposRes.json(),
        unidadesRes.json(),
      ])

      setClases(clasesData.clases || [])
      setTipos(tiposData.tipos || [])
      setSubtipos(subtiposData.subtipos || [])
      setUnidadesMedida(unidadesData.unidades || [])

      return Promise.resolve()
    } catch (error) {
      console.error("Error fetching dropdown data:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las opciones",
        variant: "destructive",
      })
      return Promise.reject(error)
    } finally {
      setLoadingDropdowns(false)
    }
  }

  const validateForm = () => {
    const newErrors: string[] = []

    if (!formData.nombre.trim()) {
      newErrors.push("El nombre es requerido")
    } else if (formData.nombre.trim().length < 3) {
      newErrors.push("El nombre debe tener al menos 3 caracteres")
    }

    if (!formData.contenido) {
      newErrors.push("El contenido es requerido")
    } else if (Number.parseInt(formData.contenido) <= 0) {
      newErrors.push("El contenido debe ser mayor a 0")
    }

    if (!formData.clase_insumo_id) {
      newErrors.push("Debe seleccionar una clase de insumo")
    }

    if (!formData.tipo_insumo_id) {
      newErrors.push("Debe seleccionar un tipo de insumo")
    }

    if (!formData.subtipo_insumo_id) {
      newErrors.push("Debe seleccionar un subtipo de insumo")
    }

    if (!formData.unidad_medida_producto) {
      newErrors.push("Debe seleccionar la unidad de medida del producto")
    }

    if (!formData.unidad_medida_uso) {
      newErrors.push("Debe seleccionar la unidad de medida de uso")
    }

    if (stockData.cantidad && Number.parseInt(stockData.cantidad) < 0) {
      newErrors.push("La cantidad de stock no puede ser negativa")
    }

    if (!establecimientoId) {
      newErrors.push("No se ha seleccionado un establecimiento")
    }

    setErrors(newErrors)
    return newErrors.length === 0
  }

  const crearInsumoConStock = async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      const response = await fetch("/api/insumos-crud", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          contenido: Number.parseInt(formData.contenido),
          establecimiento_id: establecimientoId,
          empresa_id: empresaSeleccionada,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al crear insumo")
      }

      const nuevoInsumoId = data.insumo.id

      if (stockData.cantidad && Number.parseInt(stockData.cantidad) > 0) {
        await fetch("/api/insumos-stock", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            insumo_id: nuevoInsumoId,
            cantidad: Number.parseInt(stockData.cantidad),
          }),
        })
      }

      setMostrarExito(true)

      setTimeout(() => {
        const stockMessage =
          stockData.cantidad && Number.parseInt(stockData.cantidad) > 0
            ? ` con stock inicial de ${stockData.cantidad}`
            : " sin stock inicial"

        toast({
          title: "✅ Insumo creado",
          description: `Se creó el insumo "${formData.nombre}" correctamente${stockMessage}`,
          duration: 4000,
        })
      }, 500)

      setTimeout(() => {
        onSuccess()
        onClose()
      }, 2000)
    } catch (error) {
      console.error("Error creating insumo:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al crear insumo",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const actualizarInsumoYStock = async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      const response = await fetch(`/api/insumos-crud/${insumo?.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          contenido: Number.parseInt(formData.contenido),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al actualizar insumo")
      }

      if (stockData.cantidad && Number.parseInt(stockData.cantidad) >= 0) {
        if (insumo?.stock?.id) {
          await fetch(`/api/insumos-stock/${insumo.stock.id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              cantidad: Number.parseInt(stockData.cantidad),
            }),
          })
        } else {
          await fetch("/api/insumos-stock", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              insumo_id: insumo?.id,
              cantidad: Number.parseInt(stockData.cantidad),
            }),
          })
        }
      }

      setMostrarExito(true)

      setTimeout(() => {
        toast({
          title: "✅ Insumo actualizado",
          description: `Se actualizó el insumo "${formData.nombre}" correctamente`,
          duration: 4000,
        })
      }, 500)

      setTimeout(() => {
        onSuccess()
        onClose()
      }, 2000)
    } catch (error) {
      console.error("Error updating insumo:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al actualizar insumo",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      setMostrarModalErrores(true)
      return
    }

    if (mode === "create") {
      await crearInsumoConStock()
    } else {
      await actualizarInsumoYStock()
    }
  }

  const cancelar = () => {
    onClose()
  }

  const tiposFiltrados = tipos.filter((tipo) => tipo.clase_insumo_id.toString() === formData.clase_insumo_id)
  const subtiposFiltrados = subtipos.filter((subtipo) => subtipo.tipo_insumo_id.toString() === formData.tipo_insumo_id)

  return (
    <Drawer open={isOpen} onOpenChange={onClose} direction="right">
      <DrawerContent className="h-full w-[850px] ml-auto">
        <DrawerHeader className="flex items-center justify-between border-b pb-4">
          <DrawerTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-green-600" />
            {mode === "create" ? "Nuevo Insumo" : "Editar Insumo"}
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
                <div className="font-medium text-green-800 mb-2">
                  ¡{mode === "create" ? "Insumo creado" : "Insumo actualizado"} exitosamente!
                </div>
                <div className="text-sm text-green-700">
                  {mode === "create"
                    ? `Se creó el insumo "${formData.nombre}" correctamente.`
                    : `Se actualizó el insumo "${formData.nombre}" correctamente.`}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Datos del Insumo */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900">Datos del Insumo</h3>
              <Edit className="w-4 h-4 text-gray-500" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nombre" className="text-sm font-medium text-gray-700">
                  Nombre del insumo *
                </Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData((prev) => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Ej: Fertilizante NPK"
                  disabled={loading}
                  className="mt-1"
                />
                <p className="text-sm text-gray-500 mt-1">Mínimo 3 caracteres</p>
              </div>

              <div>
                <Label htmlFor="clase_insumo_id" className="text-sm font-medium text-gray-700">
                  Clase de insumo *
                </Label>
                <div className="mt-1">
                  <CustomCombobox
                    options={clases.map((clase) => ({
                      value: clase.id.toString(),
                      label: clase.nombre,
                    }))}
                    value={formData.clase_insumo_id}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, clase_insumo_id: value }))}
                    placeholder="Selecciona clase..."
                    searchPlaceholder="Buscar clase..."
                    emptyMessage="No se encontraron clases."
                    loading={loadingDropdowns}
                    disabled={loadingDropdowns || loading}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tipo_insumo_id" className="text-sm font-medium text-gray-700">
                  Tipo de insumo *
                </Label>
                <div className="mt-1">
                  <CustomCombobox
                    options={tiposFiltrados.map((tipo) => ({
                      value: tipo.id.toString(),
                      label: tipo.nombre,
                    }))}
                    value={formData.tipo_insumo_id}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, tipo_insumo_id: value }))}
                    placeholder="Selecciona tipo..."
                    searchPlaceholder="Buscar tipo..."
                    emptyMessage="No se encontraron tipos."
                    loading={loadingDropdowns}
                    disabled={loadingDropdowns || loading || !formData.clase_insumo_id}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="subtipo_insumo_id" className="text-sm font-medium text-gray-700">
                  Subtipo de insumo *
                </Label>
                <div className="mt-1">
                  <CustomCombobox
                    options={subtiposFiltrados.map((subtipo) => ({
                      value: subtipo.id.toString(),
                      label: subtipo.nombre,
                    }))}
                    value={formData.subtipo_insumo_id}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, subtipo_insumo_id: value }))}
                    placeholder="Selecciona subtipo..."
                    searchPlaceholder="Buscar subtipo..."
                    emptyMessage="No se encontraron subtipos."
                    loading={loadingDropdowns}
                    disabled={loadingDropdowns || loading || !formData.tipo_insumo_id}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contenido" className="text-sm font-medium text-gray-700">
                  Contenido *
                </Label>
                <Input
                  id="contenido"
                  type="number"
                  value={formData.contenido}
                  onChange={(e) => setFormData((prev) => ({ ...prev, contenido: e.target.value }))}
                  placeholder="Ej: 50"
                  disabled={loading}
                  className="mt-1"
                  min="1"
                />
                <p className="text-sm text-gray-500 mt-1">Debe ser mayor a 0</p>
              </div>

              <div>
                <Label htmlFor="unidad_medida_producto" className="text-sm font-medium text-gray-700">
                  Unidad de medida del producto *
                </Label>
                <div className="mt-1">
                  <CustomCombobox
                    options={unidadesMedida.map((unidad) => ({
                      value: unidad.id.toString(),
                      label: unidad.nombre,
                    }))}
                    value={formData.unidad_medida_producto}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, unidad_medida_producto: value }))}
                    placeholder="Selecciona unidad..."
                    searchPlaceholder="Buscar unidad..."
                    emptyMessage="No se encontraron unidades."
                    loading={loadingDropdowns}
                    disabled={loadingDropdowns || loading}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Stock del Insumo */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900">Stock del Insumo</h3>
              <Edit className="w-4 h-4 text-gray-500" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cantidad" className="text-sm font-medium text-gray-700">
                  Cantidad en stock
                </Label>
                <Input
                  id="cantidad"
                  type="number"
                  value={stockData.cantidad}
                  onChange={(e) => setStockData((prev) => ({ ...prev, cantidad: e.target.value }))}
                  placeholder="Ej: 100 (opcional)"
                  disabled={loading}
                  className="mt-1"
                  min="0"
                />
                <p className="text-sm text-gray-500 mt-1">Opcional - Deja vacío para crear sin stock inicial</p>
              </div>

              <div>
                <Label htmlFor="unidad_medida_uso" className="text-sm font-medium text-gray-700">
                  Unidad de medida de uso *
                </Label>
                <div className="mt-1">
                  <CustomCombobox
                    options={unidadesMedida.map((unidad) => ({
                      value: unidad.id.toString(),
                      label: unidad.nombre,
                    }))}
                    value={formData.unidad_medida_uso}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, unidad_medida_uso: value }))}
                    placeholder="Selecciona unidad..."
                    searchPlaceholder="Buscar unidad..."
                    emptyMessage="No se encontraron unidades."
                    loading={loadingDropdowns}
                    disabled={loadingDropdowns || loading}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Información adicional */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Información sobre los insumos</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Los insumos son productos utilizados en las actividades agropecuarias</li>
              <li>• Cada insumo debe tener una clasificación completa (clase, tipo, subtipo)</li>
              <li>• El contenido indica la cantidad por unidad del producto</li>
              <li>• El stock se puede actualizar independientemente de los datos del insumo</li>
              <li>• Las unidades de medida definen cómo se mide el producto y su uso</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-6 flex gap-3 justify-end">
          <Button onClick={cancelar} variant="outline">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-green-700 hover:bg-green-800">
            {loading ? "Guardando..." : mode === "create" ? "Crear Insumo" : "Actualizar Insumo"}
          </Button>
        </div>

        {/* Modal de errores */}
        {mostrarModalErrores && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
              <div className="flex items-start gap-3 mb-4">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-red-600 mb-3">Se encontraron {errors.length} errores:</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    {errors.map((error, index) => (
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
      </DrawerContent>
    </Drawer>
  )
}
