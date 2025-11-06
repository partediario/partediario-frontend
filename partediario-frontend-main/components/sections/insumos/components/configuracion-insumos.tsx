"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ArrowLeft, Plus, Edit, Trash2, Search, HelpCircle, Package } from "lucide-react"
import { categoriasConfig } from "@/lib/data"

interface Insumo {
  id: string
  nombre: string
  clase: string
  tipoInsumo: string
  stockActual: number
  stockMinimo: number
  stockMaximo: number
  unidad: string
  precio?: number
  proveedor: string
  ubicacion: string
  estado: "normal" | "bajo" | "critico"
  icono: string
  categoria: string
  tipo: string
  contenido?: number
  unidadMedida?: string
  almacen?: string
}

interface ConfiguracionInsumosProps {
  onVolver: () => void
  insumos: Insumo[]
}

interface FormularioInsumoData {
  clase: string
  categoria: string
  tipo: string
  producto: string
  proveedor: string
  unidad: string
  costoUnidad: string
  contenido: string
  unidadMedida: string
  almacen: string
}

const initialFormData: FormularioInsumoData = {
  clase: "",
  categoria: "",
  tipo: "",
  producto: "",
  proveedor: "",
  unidad: "",
  costoUnidad: "",
  contenido: "",
  unidadMedida: "",
  almacen: "",
}

export function ConfiguracionInsumos({ onVolver, insumos }: ConfiguracionInsumosProps) {
  const [claseSeleccionada, setClaseSeleccionada] = useState<string>("todos")
  const [busqueda, setBusqueda] = useState("")
  const [dialogoAbierto, setDialogoAbierto] = useState(false)
  const [modoEdicion, setModoEdicion] = useState(false)
  const [insumoEditando, setInsumoEditando] = useState<Insumo | null>(null)
  const [formData, setFormData] = useState<FormularioInsumoData>(initialFormData)

  // Filtrar insumos
  const insumosFiltrados = useMemo(() => {
    let filtrados = insumos

    if (claseSeleccionada !== "todos") {
      filtrados = filtrados.filter((insumo) => insumo.clase === claseSeleccionada)
    }

    if (busqueda) {
      filtrados = filtrados.filter(
        (insumo) =>
          insumo.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
          insumo.proveedor.toLowerCase().includes(busqueda.toLowerCase()) ||
          insumo.tipoInsumo.toLowerCase().includes(busqueda.toLowerCase()),
      )
    }

    return filtrados
  }, [insumos, claseSeleccionada, busqueda])

  // Validar formulario
  const formularioValido = useMemo(() => {
    return (
      formData.clase &&
      formData.categoria &&
      formData.tipo &&
      formData.producto &&
      formData.proveedor &&
      formData.unidad &&
      formData.costoUnidad &&
      formData.contenido &&
      formData.unidadMedida &&
      formData.almacen &&
      !isNaN(Number(formData.costoUnidad)) &&
      !isNaN(Number(formData.contenido))
    )
  }, [formData])

  const handleInputChange = (field: keyof FormularioInsumoData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleNuevoInsumo = () => {
    setModoEdicion(false)
    setInsumoEditando(null)
    setFormData(initialFormData)
    setDialogoAbierto(true)
  }

  const handleEditarInsumo = (insumo: Insumo) => {
    setModoEdicion(true)
    setInsumoEditando(insumo)
    setFormData({
      clase: insumo.clase,
      categoria: insumo.categoria,
      tipo: insumo.tipoInsumo,
      producto: insumo.nombre,
      proveedor: insumo.proveedor,
      unidad: insumo.unidad,
      costoUnidad: (insumo.precio || 0).toString(),
      contenido: (insumo.contenido || 0).toString(),
      unidadMedida: insumo.unidadMedida || "",
      almacen: insumo.almacen || insumo.ubicacion,
    })
    setDialogoAbierto(true)
  }

  const handleGuardarInsumo = () => {
    if (!formularioValido) return

    // Aquí iría la lógica para guardar el insumo
    console.log("Guardando insumo:", formData)
    setDialogoAbierto(false)
    setFormData(initialFormData)
  }

  const handleEliminarInsumo = (insumo: Insumo) => {
    if (confirm(`¿Está seguro de eliminar el insumo "${insumo.nombre}"?`)) {
      // Aquí iría la lógica para eliminar el insumo
      console.log("Eliminando insumo:", insumo.id)
    }
  }

  const getCategoriaColor = (clase: string) => {
    switch (clase.toLowerCase()) {
      case "combustibles":
        return "bg-orange-100 text-orange-800"
      case "sales":
        return "bg-blue-100 text-blue-800"
      case "veterinarios":
        return "bg-red-100 text-red-800"
      case "agroquímicos":
        return "bg-emerald-100 text-emerald-800"
      case "materiales":
        return "bg-gray-100 text-gray-800"
      case "varios":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatearPrecio = (precio: number) => {
    return new Intl.NumberFormat("es-PY", {
      style: "currency",
      currency: "PYG",
      minimumFractionDigits: 0,
    }).format(precio)
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={onVolver} className="flex items-center gap-2 bg-transparent">
              <ArrowLeft className="w-4 h-4" />
              Volver
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Configuración de Insumos</h1>
              <p className="text-gray-600">Gestiona el catálogo de insumos por categorías</p>
            </div>
          </div>

          <Dialog open={dialogoAbierto} onOpenChange={setDialogoAbierto}>
            <DialogTrigger asChild>
              <Button onClick={handleNuevoInsumo} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Nuevo Insumo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{modoEdicion ? "Editar Insumo" : "Nuevo Insumo"}</DialogTitle>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Clase */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="clase">Clase</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="w-4 h-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Tipo general del insumo. Ayuda a agrupar por función o destino.</p>
                        <p className="text-xs text-gray-500 mt-1">Ejemplo: Sales, Balanceados y Forrajes</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Select value={formData.clase} onValueChange={(value) => handleInputChange("clase", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar clase" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoriasConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <span>{config.emoji}</span>
                            <span>{config.nombre}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Categoría */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="categoria">Categoría</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="w-4 h-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Subgrupo dentro de la clase que define la presentación general.</p>
                        <p className="text-xs text-gray-500 mt-1">Ejemplo: Balanceado</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id="categoria"
                    value={formData.categoria}
                    onChange={(e) => handleInputChange("categoria", e.target.value)}
                    placeholder="Ej: Balanceado, Combustible, Vacuna"
                  />
                </div>

                {/* Tipo */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="tipo">Tipo</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="w-4 h-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Característica técnica o funcional del producto.</p>
                        <p className="text-xs text-gray-500 mt-1">Ejemplo: Proteico, Energético, Mineral</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id="tipo"
                    value={formData.tipo}
                    onChange={(e) => handleInputChange("tipo", e.target.value)}
                    placeholder="Ej: Proteico, Premium, Común"
                  />
                </div>

                {/* Producto */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="producto">Producto</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="w-4 h-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Nombre comercial específico del insumo.</p>
                        <p className="text-xs text-gray-500 mt-1">Ejemplo: Indabal Desmamantes</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id="producto"
                    value={formData.producto}
                    onChange={(e) => handleInputChange("producto", e.target.value)}
                    placeholder="Nombre comercial del producto"
                  />
                </div>

                {/* Proveedor */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="proveedor">Proveedor / Origen</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="w-4 h-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Empresa o lugar que provee el producto.</p>
                        <p className="text-xs text-gray-500 mt-1">Ejemplo: Indabal</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id="proveedor"
                    value={formData.proveedor}
                    onChange={(e) => handleInputChange("proveedor", e.target.value)}
                    placeholder="Nombre del proveedor"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Unidad */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="unidad">Unidad</Label>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="w-4 h-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Forma de presentación del producto al comprarlo.</p>
                          <p className="text-xs text-gray-500 mt-1">Ejemplo: Bolsas, Bidones, Fardos</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input
                      id="unidad"
                      value={formData.unidad}
                      onChange={(e) => handleInputChange("unidad", e.target.value)}
                      placeholder="Ej: Bolsas, Litros, Fardos"
                    />
                  </div>

                  {/* Costo por unidad */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="costoUnidad">Costo por unidad</Label>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="w-4 h-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Precio por cada unidad en su presentación original.</p>
                          <p className="text-xs text-gray-500 mt-1">Ejemplo: 25.000 Gs por bolsa</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input
                      id="costoUnidad"
                      type="number"
                      value={formData.costoUnidad}
                      onChange={(e) => handleInputChange("costoUnidad", e.target.value)}
                      placeholder="Precio en guaraníes"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Contenido */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="contenido">Contenido</Label>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="w-4 h-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Cantidad contenida en una unidad (valor numérico).</p>
                          <p className="text-xs text-gray-500 mt-1">Ejemplo: 25</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input
                      id="contenido"
                      type="number"
                      value={formData.contenido}
                      onChange={(e) => handleInputChange("contenido", e.target.value)}
                      placeholder="Cantidad por unidad"
                    />
                  </div>

                  {/* Unidad de medida */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="unidadMedida">Unidad de medida</Label>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="w-4 h-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Unidad de peso o volumen que representa el contenido.</p>
                          <p className="text-xs text-gray-500 mt-1">Ejemplo: kg, litros, dosis</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input
                      id="unidadMedida"
                      value={formData.unidadMedida}
                      onChange={(e) => handleInputChange("unidadMedida", e.target.value)}
                      placeholder="kg, litros, dosis, etc."
                    />
                  </div>
                </div>

                {/* Almacén */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="almacen">Almacén</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="w-4 h-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Lugar físico donde se guarda el insumo.</p>
                        <p className="text-xs text-gray-500 mt-1">Ejemplo: Depósito 1, Galpón principal</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id="almacen"
                    value={formData.almacen}
                    onChange={(e) => handleInputChange("almacen", e.target.value)}
                    placeholder="Ubicación física del insumo"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setDialogoAbierto(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleGuardarInsumo} disabled={!formularioValido}>
                    {modoEdicion ? "Actualizar" : "Guardar"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar insumos..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={claseSeleccionada} onValueChange={setClaseSeleccionada}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas las clases</SelectItem>
                  {Object.entries(categoriasConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <span>{config.emoji}</span>
                        <span>{config.nombre}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de insumos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Insumos Registrados</span>
              <Badge variant="outline">{insumosFiltrados.length} insumos</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Clase</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {insumosFiltrados.map((insumo) => (
                    <TableRow key={insumo.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{insumo.icono}</span>
                          <div>
                            <p className="font-medium">{insumo.nombre}</p>
                            <p className="text-sm text-gray-500">{insumo.categoria}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getCategoriaColor(insumo.clase)}>{insumo.clase}</Badge>
                      </TableCell>
                      <TableCell>{insumo.tipoInsumo}</TableCell>
                      <TableCell>{insumo.proveedor}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="font-medium">
                            {insumo.stockActual.toLocaleString()} {insumo.unidad}
                          </p>
                          <p className="text-gray-500">Min: {insumo.stockMinimo.toLocaleString()}</p>
                        </div>
                      </TableCell>
                      <TableCell>{insumo.precio ? formatearPrecio(insumo.precio) : "N/A"}</TableCell>
                      <TableCell>{insumo.ubicacion}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            insumo.estado === "critico"
                              ? "destructive"
                              : insumo.estado === "bajo"
                                ? "secondary"
                                : "default"
                          }
                        >
                          {insumo.estado}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditarInsumo(insumo)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEliminarInsumo(insumo)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {insumosFiltrados.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No se encontraron insumos con los filtros aplicados</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
}
