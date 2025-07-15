"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Package, X, AlertCircle, CheckCircle, Plus, Edit, Trash2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { useEstablishment } from "@/contexts/establishment-context"
import { CustomCombobox } from "@/components/ui/custom-combobox"

interface Lote {
  id: number
  nombre: string
  potrero_id: number
  empresa_id: number
  establecimiento_id: number
  pd_potreros?: {
    nombre: string
  }
}

interface LoteStock {
  id: number
  lote_id: number
  categoria_animal_id: number
  cantidad: number
  peso_total: number | null
  pd_categoria_animales?: {
    nombre: string
  }
}

interface CategoriaAnimal {
  id: number
  nombre: string
}

interface Potrero {
  id: number
  nombre: string
}

interface LoteDrawerProps {
  lote: Lote | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  mode: "create" | "edit"
  establecimientoId: string
}

export function LoteDrawer({ lote, isOpen, onClose, onSuccess, mode, establecimientoId }: LoteDrawerProps) {
  const { toast } = useToast()
  const { empresaSeleccionada } = useEstablishment()

  const [loading, setLoading] = useState(false)
  const [loadingPotreros, setLoadingPotreros] = useState(false)
  const [mostrarExito, setMostrarExito] = useState(false)
  const [potreros, setPotreros] = useState<Potrero[]>([])
  const [formData, setFormData] = useState({
    nombre: "",
    potrero_id: "",
  })
  const [errors, setErrors] = useState<string[]>([])

  const [stock, setStock] = useState<LoteStock[]>([])
  const [stockOriginal, setStockOriginal] = useState<LoteStock[]>([]) // Para modo editar
  const [categorias, setCategorias] = useState<CategoriaAnimal[]>([])
  const [loadingStock, setLoadingStock] = useState(false)
  const [loadingCategorias, setLoadingCategorias] = useState(false)
  const [mostrandoFormularioStock, setMostrandoFormularioStock] = useState(false)
  const [editandoStock, setEditandoStock] = useState<LoteStock | null>(null)
  const [stockForm, setStockForm] = useState({
    categoria_animal_id: "",
    cantidad: "",
    peso: "",
    tipo_peso: "", // Cambiado para que inicie vacío
  })
  const [stockErrors, setStockErrors] = useState<string[]>([])

  // Cargar potreros cuando se abre el drawer
  useEffect(() => {
    if (isOpen && establecimientoId) {
      fetchPotreros()
    }
  }, [isOpen, establecimientoId])

  // Cargar datos del lote cuando se abre el drawer
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && lote) {
        setFormData({
          nombre: lote.nombre || "",
          potrero_id: lote.potrero_id?.toString() || "",
        })
        // Cargar stock del lote
        fetchStock(lote.id)
      } else if (mode === "create") {
        setFormData({
          nombre: "",
          potrero_id: "",
        })
        setStock([])
        setStockOriginal([])
      }
      setErrors([])
      setStockErrors([])
      setMostrarExito(false)
      // Cargar categorías
      fetchCategorias()
    }
  }, [lote, isOpen, mode, establecimientoId, empresaSeleccionada])

  // Limpiar formulario cuando se cierra el drawer
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        nombre: "",
        potrero_id: "",
      })
      setErrors([])
      setStockErrors([])
      setMostrarExito(false)
      setPotreros([])
      setStock([])
      setStockOriginal([])
      setCategorias([])
      setMostrandoFormularioStock(false)
      setEditandoStock(null)
    }
  }, [isOpen])

  const fetchPotreros = async () => {
    setLoadingPotreros(true)
    try {
      const response = await fetch(`/api/potreros-crud?establecimiento_id=${establecimientoId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al cargar potreros")
      }

      setPotreros(data.potreros || [])
    } catch (error) {
      console.error("Error fetching potreros:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los potreros",
        variant: "destructive",
      })
    } finally {
      setLoadingPotreros(false)
    }
  }

  const validateForm = () => {
    const newErrors: string[] = []

    if (!formData.nombre.trim()) {
      newErrors.push("El nombre es requerido")
    } else if (formData.nombre.trim().length < 3) {
      newErrors.push("El nombre debe tener al menos 3 caracteres")
    }

    if (!formData.potrero_id) {
      newErrors.push("Debe seleccionar un potrero")
    }

    if (!establecimientoId) {
      newErrors.push("No se ha seleccionado un establecimiento")
    }

    setErrors(newErrors)
    return newErrors.length === 0
  }

  const fetchStock = async (loteId: number) => {
    setLoadingStock(true)
    try {
      const response = await fetch(`/api/lote-stock?lote_id=${loteId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al cargar stock")
      }

      const stockData = data.stock || []
      setStock(stockData)
      setStockOriginal(stockData) // Guardar copia original
    } catch (error) {
      console.error("Error fetching stock:", error)
      toast({
        title: "Error",
        description: "No se pudo cargar el stock del lote",
        variant: "destructive",
      })
    } finally {
      setLoadingStock(false)
    }
  }

  const fetchCategorias = async () => {
    setLoadingCategorias(true)
    try {
      // Modificado para usar el ID de la empresa seleccionada
      const response = await fetch(`/api/categorias-animales-empresa?empresa_id=${empresaSeleccionada}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al cargar categorías")
      }

      setCategorias(data.categorias || [])
    } catch (error) {
      console.error("Error fetching categorias:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las categorías de animales",
        variant: "destructive",
      })
    } finally {
      setLoadingCategorias(false)
    }
  }

  const agregarStock = () => {
    setMostrandoFormularioStock(true)
    setEditandoStock(null)
    setStockForm({
      categoria_animal_id: "",
      cantidad: "",
      peso: "",
      tipo_peso: "", // Vacío por defecto
    })
    setStockErrors([])
  }

  const editarStock = (stockItem: LoteStock) => {
    setEditandoStock(stockItem)
    setMostrandoFormularioStock(true)

    // Al editar, siempre por defecto "total" pero permite cambiar
    setStockForm({
      categoria_animal_id: stockItem.categoria_animal_id.toString(),
      cantidad: stockItem.cantidad.toString(),
      peso: stockItem.peso_total?.toString() || "",
      tipo_peso: "total", // Por defecto "total" al editar
    })
    setStockErrors([])
  }

  const cancelarStock = () => {
    setMostrandoFormularioStock(false)
    setEditandoStock(null)
    setStockForm({
      categoria_animal_id: "",
      cantidad: "",
      peso: "",
      tipo_peso: "",
    })
    setStockErrors([])
  }

  const validateStockForm = () => {
    const newErrors: string[] = []

    if (!stockForm.categoria_animal_id) {
      newErrors.push("Debe seleccionar una categoría animal")
    }

    if (!stockForm.cantidad) {
      newErrors.push("La cantidad es requerida")
    } else if (Number.parseInt(stockForm.cantidad) <= 0) {
      newErrors.push("La cantidad debe ser mayor a 0")
    }

    // Peso ahora es requerido y debe ser mayor a 0
    if (!stockForm.peso) {
      newErrors.push("El peso es requerido")
    } else if (Number.parseInt(stockForm.peso) <= 0) {
      newErrors.push("El peso debe ser mayor a 0")
    }

    // Tipo de peso ahora es requerido
    if (!stockForm.tipo_peso) {
      newErrors.push("Debe seleccionar el tipo de peso")
    }

    setStockErrors(newErrors)
    return newErrors.length === 0
  }

  const calcularPesoTotal = () => {
    if (!stockForm.peso || !stockForm.cantidad) return null

    const peso = Number.parseInt(stockForm.peso)
    const cantidad = Number.parseInt(stockForm.cantidad)

    if (stockForm.tipo_peso === "promedio") {
      return peso * cantidad
    } else {
      return peso
    }
  }

  const guardarStock = () => {
    if (!validateStockForm()) return

    const nuevaCategoria = categorias.find((c) => c.id.toString() === stockForm.categoria_animal_id)
    const pesoTotal = calcularPesoTotal()

    const nuevoStock: LoteStock = {
      id: editandoStock ? editandoStock.id : Date.now(), // ID temporal para nuevos
      lote_id: lote?.id || 0,
      categoria_animal_id: Number.parseInt(stockForm.categoria_animal_id),
      cantidad: Number.parseInt(stockForm.cantidad),
      peso_total: pesoTotal,
      pd_categoria_animales: { nombre: nuevaCategoria?.nombre || "" },
    }

    if (editandoStock) {
      setStock((prev) => prev.map((s) => (s.id === editandoStock.id ? nuevoStock : s)))
    } else {
      setStock((prev) => [...prev, nuevoStock])
    }

    cancelarStock()
  }

  const eliminarStock = (stockId: number) => {
    setStock((prev) => prev.filter((s) => s.id !== stockId))
  }

  const aplicarCambiosStock = async (loteId: number) => {
    try {
      // Obtener stock actual de la base de datos
      const stockActual = stockOriginal

      // Identificar cambios
      const stockParaEliminar = stockActual.filter((original) => !stock.find((actual) => actual.id === original.id))
      const stockParaAgregar = stock.filter((actual) => !stockActual.find((original) => original.id === actual.id))
      const stockParaActualizar = stock.filter((actual) => {
        const original = stockActual.find((o) => o.id === actual.id)
        return (
          original &&
          (original.categoria_animal_id !== actual.categoria_animal_id ||
            original.cantidad !== actual.cantidad ||
            original.peso_total !== actual.peso_total)
        )
      })

      // Eliminar stock
      for (const stockItem of stockParaEliminar) {
        await fetch(`/api/lote-stock/${stockItem.id}`, {
          method: "DELETE",
        })
      }

      // Agregar nuevo stock
      for (const stockItem of stockParaAgregar) {
        await fetch("/api/lote-stock", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            lote_id: loteId,
            categoria_animal_id: stockItem.categoria_animal_id,
            cantidad: stockItem.cantidad,
            peso_total: stockItem.peso_total,
          }),
        })
      }

      // Actualizar stock existente
      for (const stockItem of stockParaActualizar) {
        await fetch(`/api/lote-stock/${stockItem.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            categoria_animal_id: stockItem.categoria_animal_id,
            cantidad: stockItem.cantidad,
            peso_total: stockItem.peso_total,
          }),
        })
      }
    } catch (error) {
      console.error("Error aplicando cambios de stock:", error)
      throw error
    }
  }

  const crearLoteConStock = async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      // Crear el lote primero
      const response = await fetch("/api/lotes-crud", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          establecimiento_id: establecimientoId,
          empresa_id: empresaSeleccionada,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al crear lote")
      }

      const nuevoLoteId = data.lote.id

      // Crear stock si existe
      if (stock.length > 0) {
        for (const stockItem of stock) {
          await fetch("/api/lote-stock", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              lote_id: nuevoLoteId,
              categoria_animal_id: stockItem.categoria_animal_id,
              cantidad: stockItem.cantidad,
              peso_total: stockItem.peso_total,
            }),
          })
        }
      }

      setMostrarExito(true)

      setTimeout(() => {
        toast({
          title: "✅ Lote creado",
          description: `Se creó el lote "${formData.nombre}" correctamente${stock.length > 0 ? ` con ${stock.length} registros de stock` : ""}`,
          duration: 4000,
        })
      }, 500)

      setTimeout(() => {
        onSuccess()
        onClose()
      }, 2000)
    } catch (error) {
      console.error("Error creating lote:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al crear lote",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const actualizarLote = async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      // Actualizar datos básicos del lote
      const response = await fetch(`/api/lotes-crud/${lote?.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al actualizar lote")
      }

      // Aplicar cambios de stock
      if (lote?.id) {
        await aplicarCambiosStock(lote.id)
      }

      setMostrarExito(true)

      setTimeout(() => {
        toast({
          title: "✅ Lote actualizado",
          description: `Se actualizó el lote "${formData.nombre}" correctamente`,
          duration: 4000,
        })
      }, 500)

      setTimeout(() => {
        onSuccess()
        onClose()
      }, 2000)
    } catch (error) {
      console.error("Error updating lote:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al actualizar lote",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (mode === "create") {
      await crearLoteConStock()
    } else {
      await actualizarLote()
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
            <Package className="w-5 h-5 text-green-600" />
            {mode === "create" ? "Nuevo Lote" : "Editar Lote"}
          </DrawerTitle>
          <button onClick={cancelar} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Mostrar mensaje de éxito */}
          {mostrarExito && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <div className="font-medium text-green-800 mb-2">
                  ¡Lote {mode === "create" ? "creado" : "actualizado"} exitosamente!
                </div>
                <div className="text-sm text-green-700">
                  Se {mode === "create" ? "creó" : "actualizó"} el lote "{formData.nombre}" correctamente.
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Mostrar errores de validación */}
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

          {/* Datos del Lote */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Datos del Lote</h3>

            <div>
              <Label htmlFor="nombre" className="text-sm font-medium text-gray-700">
                Nombre del lote *
              </Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData((prev) => ({ ...prev, nombre: e.target.value }))}
                placeholder="Ej: Lote Vaquillas 2024"
                disabled={loading}
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">Mínimo 3 caracteres</p>
            </div>

            <div>
              <Label htmlFor="potrero_id" className="text-sm font-medium text-gray-700">
                Potrero *
              </Label>
              <Select
                value={formData.potrero_id}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, potrero_id: value }))}
                disabled={loading || loadingPotreros}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={loadingPotreros ? "Cargando potreros..." : "Seleccionar potrero"} />
                </SelectTrigger>
                <SelectContent>
                  {potreros.map((potrero) => (
                    <SelectItem key={potrero.id} value={potrero.id.toString()}>
                      {potrero.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {potreros.length === 0 && !loadingPotreros && (
                <p className="text-sm text-amber-600 mt-1">
                  No hay potreros disponibles. Crea potreros primero en la pestaña Potreros.
                </p>
              )}
            </div>
          </div>

          {/* Stock del Lote */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Stock del Lote</h3>
              <Button onClick={agregarStock} size="sm" className="bg-green-700 hover:bg-green-800" disabled={loading}>
                <Plus className="w-4 h-4 mr-2" />
                Agregar Stock
              </Button>
            </div>

            {/* Formulario de stock */}
            {mostrandoFormularioStock && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                <h4 className="font-medium text-gray-900">{editandoStock ? "Editar Stock" : "Nuevo Stock"}</h4>

                {/* Errores de stock */}
                {stockErrors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="font-medium mb-2">Se encontraron {stockErrors.length} errores:</div>
                      <ul className="list-disc list-inside space-y-1">
                        {stockErrors.map((error, index) => (
                          <li key={index} className="text-sm">
                            {error}
                          </li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Layout reorganizado: Categoría y Tipo de peso en columna izquierda, Cantidad y Peso en columnas derechas */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Primera columna: Categoría Animal y Tipo de peso */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="categoria_animal_id" className="text-sm font-medium text-gray-700">
                        Categoría Animal *
                      </Label>
                      <div className="mt-1">
                        <CustomCombobox
                          options={categorias.map((categoria) => ({
                            value: categoria.id.toString(),
                            label: categoria.nombre,
                          }))}
                          value={stockForm.categoria_animal_id}
                          onValueChange={(value) => setStockForm((prev) => ({ ...prev, categoria_animal_id: value }))}
                          placeholder="Selecciona categoría..."
                          searchPlaceholder="Buscar categoría..."
                          emptyMessage="No se encontraron categorías."
                          loading={loadingCategorias}
                          disabled={loadingCategorias}
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700">Tipo de peso *</Label>
                      <Select
                        value={stockForm.tipo_peso}
                        onValueChange={(value) => setStockForm((prev) => ({ ...prev, tipo_peso: value }))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Selecciona" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="promedio">Promedio</SelectItem>
                          <SelectItem value="total">Total</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Segunda columna: Cantidad */}
                  <div>
                    <Label htmlFor="cantidad" className="text-sm font-medium text-gray-700">
                      Cantidad *
                    </Label>
                    <Input
                      id="cantidad"
                      type="number"
                      value={stockForm.cantidad}
                      onChange={(e) => setStockForm((prev) => ({ ...prev, cantidad: e.target.value }))}
                      placeholder="Ej: 50"
                      className="mt-1"
                      min="1"
                    />
                  </div>

                  {/* Tercera columna: Peso */}
                  <div>
                    <Label htmlFor="peso" className="text-sm font-medium text-gray-700">
                      Peso (kg) *
                    </Label>
                    <Input
                      id="peso"
                      type="number"
                      value={stockForm.peso}
                      onChange={(e) => setStockForm((prev) => ({ ...prev, peso: e.target.value }))}
                      placeholder="Ej: 400"
                      className="mt-1"
                      min="1"
                      step="1"
                    />
                  </div>
                </div>

                {/* Información del cálculo */}
                {stockForm.tipo_peso === "promedio" && stockForm.peso && stockForm.cantidad && (
                  <p className="text-xs text-blue-600 mt-1">
                    Peso total calculado:{" "}
                    {(Number.parseInt(stockForm.peso) * Number.parseInt(stockForm.cantidad)).toFixed(0)} kg
                  </p>
                )}

                <div className="flex gap-2 justify-end">
                  <Button onClick={cancelarStock} variant="outline" size="sm">
                    Cancelar
                  </Button>
                  <Button onClick={guardarStock} size="sm" className="bg-green-700 hover:bg-green-800">
                    {editandoStock ? "Actualizar" : "Agregar"}
                  </Button>
                </div>
              </div>
            )}

            {/* Tabla de stock */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Categoría Animal</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Cantidad</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Peso Total</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loadingStock ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                        Cargando stock...
                      </td>
                    </tr>
                  ) : stock.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                        No hay stock agregado
                      </td>
                    </tr>
                  ) : (
                    stock
                      .sort((a, b) => a.id - b.id)
                      .map((stockItem) => (
                        <tr key={stockItem.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {stockItem.pd_categoria_animales?.nombre || "Sin categoría"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{stockItem.cantidad}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {stockItem.peso_total ? `${stockItem.peso_total} kg` : "No especificado"}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex gap-2">
                              <button
                                onClick={() => editarStock(stockItem)}
                                className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                                title="Editar stock"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => eliminarStock(stockItem.id)}
                                className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                                title="Eliminar stock"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Información adicional */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Información sobre los lotes</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Los lotes son grupos de animales ubicados en un potrero específico</li>
              <li>• Cada lote debe estar asignado a un potrero del establecimiento</li>
              <li>• El nombre del lote debe ser descriptivo y único</li>
              <li>
                • <strong>Peso Total:</strong> Se guarda el peso tal como se ingresa
              </li>
              <li>
                • <strong>Peso Promedio:</strong> Se multiplica por la cantidad para obtener el peso total
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-6 flex gap-3 justify-end">
          <Button onClick={cancelar} variant="outline">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-green-700 hover:bg-green-800">
            {loading ? "Guardando..." : mode === "create" ? "Crear Lote" : "Actualizar"}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
