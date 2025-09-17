"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Plus, Package, MapPin, DollarSign, AlertTriangle, CheckCircle, ChevronDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { categoriasConfig } from "@/lib/data"

interface FormularioNuevoMovimientoProps {
  onMovimientoCreado: (movimiento: any) => void
}

// Datos de ejemplo
const insumosEjemplo = [
  {
    id: "gasoil-comun",
    nombre: "Gasoil Común",
    codigo: "GC001",
    clase: "combustibles",
    stockActual: 1200,
    precio: 850,
    unidad: "L",
    categoria: "Combustible",
  },
  {
    id: "gasoil-premium",
    nombre: "Gasoil Premium",
    codigo: "GP001",
    clase: "combustibles",
    stockActual: 800,
    precio: 920,
    unidad: "L",
    categoria: "Combustible",
  },
  {
    id: "vacuna-aftosa",
    nombre: "Vacuna Aftosa",
    codigo: "VA001",
    clase: "veterinarios",
    stockActual: 50,
    precio: 1200,
    unidad: "dosis",
    categoria: "Vacuna",
  },
  {
    id: "balanceado-terneros",
    nombre: "Balanceado Terneros",
    codigo: "BT001",
    clase: "balanceados",
    stockActual: 2000,
    precio: 450,
    unidad: "kg",
    categoria: "Alimento",
  },
]

const destinosEjemplo = [
  { id: "deposito-central", nombre: "Depósito Central", tipo: "deposito" },
  { id: "tractor-jd-6110", nombre: "Tractor JD 6110", tipo: "maquinaria" },
  { id: "cosechadora-case", nombre: "Cosechadora Case", tipo: "maquinaria" },
  { id: "pulverizadora-apache", nombre: "Pulverizadora Apache", tipo: "maquinaria" },
  { id: "lote-norte", nombre: "Lote Norte", tipo: "campo" },
  { id: "potrero-sur", nombre: "Potrero Sur", tipo: "campo" },
]

export function FormularioNuevoMovimiento({ onMovimientoCreado }: FormularioNuevoMovimientoProps) {
  const [open, setOpen] = useState(false)
  const [tipoMovimiento, setTipoMovimiento] = useState<"entrada" | "salida" | "">("")
  const [claseSeleccionada, setClaseSeleccionada] = useState("")
  const [insumoSeleccionado, setInsumoSeleccionado] = useState("")
  const [destinoSeleccionado, setDestinoSeleccionado] = useState("")
  const [cantidad, setCantidad] = useState("")
  const [precio, setPrecio] = useState("")
  const [observaciones, setObservaciones] = useState("")
  const [mostrarNuevoInsumo, setMostrarNuevoInsumo] = useState(false)
  const [nuevoInsumo, setNuevoInsumo] = useState({
    nombre: "",
    codigo: "",
    categoria: "",
    unidad: "",
    stockMinimo: "",
    stockMaximo: "",
  })
  const [openInsumoCombobox, setOpenInsumoCombobox] = useState(false)
  const [openDestinoCombobox, setOpenDestinoCombobox] = useState(false)
  const [busquedaInsumo, setBusquedaInsumo] = useState("")
  const [busquedaDestino, setBusquedaDestino] = useState("")

  // Filtrar insumos por clase seleccionada
  const insumosFiltrados = claseSeleccionada
    ? insumosEjemplo.filter((insumo) => insumo.clase === claseSeleccionada)
    : []

  // Filtrar insumos por búsqueda
  const insumosParaBusqueda = insumosFiltrados.filter(
    (insumo) =>
      insumo.nombre.toLowerCase().includes(busquedaInsumo.toLowerCase()) ||
      insumo.codigo.toLowerCase().includes(busquedaInsumo.toLowerCase()) ||
      insumo.categoria.toLowerCase().includes(busquedaInsumo.toLowerCase()),
  )

  // Filtrar destinos por búsqueda
  const destinosParaBusqueda = destinosEjemplo.filter(
    (destino) =>
      destino.nombre.toLowerCase().includes(busquedaDestino.toLowerCase()) ||
      destino.tipo.toLowerCase().includes(busquedaDestino.toLowerCase()),
  )

  const insumoActual = insumosEjemplo.find((i) => i.id === insumoSeleccionado)
  const destinoActual = destinosEjemplo.find((d) => d.id === destinoSeleccionado)

  const calcularStockResultante = () => {
    if (!insumoActual || !cantidad) return null
    const cantidadNum = Number.parseFloat(cantidad)
    if (tipoMovimiento === "entrada") {
      return insumoActual.stockActual + cantidadNum
    } else {
      return insumoActual.stockActual - cantidadNum
    }
  }

  const stockResultante = calcularStockResultante()
  const stockInsuficiente = stockResultante !== null && stockResultante < 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!tipoMovimiento || !insumoSeleccionado || !destinoSeleccionado || !cantidad) {
      return
    }

    const nuevoMovimiento = {
      id: Date.now(),
      fecha: new Date().toISOString().split("T")[0],
      tipo: tipoMovimiento === "entrada" ? "Entrada" : "Salida",
      cantidad: Number.parseFloat(cantidad),
      unidad: insumoActual?.unidad || "unidad",
      destino: destinoActual?.nombre || "",
      usuario: "Usuario Actual",
      precio: Number.parseFloat(precio) || insumoActual?.precio || 0,
      observaciones: observaciones || "",
      proveedor: "Proveedor",
      insumoId: insumoSeleccionado,
      insumoNombre: insumoActual?.nombre || "",
      clase: insumoActual?.clase || "",
    }

    onMovimientoCreado(nuevoMovimiento)

    // Resetear formulario
    setTipoMovimiento("")
    setClaseSeleccionada("")
    setInsumoSeleccionado("")
    setDestinoSeleccionado("")
    setCantidad("")
    setPrecio("")
    setObservaciones("")
    setMostrarNuevoInsumo(false)
    setOpen(false)
  }

  const resetForm = () => {
    setTipoMovimiento("")
    setClaseSeleccionada("")
    setInsumoSeleccionado("")
    setDestinoSeleccionado("")
    setCantidad("")
    setPrecio("")
    setObservaciones("")
    setMostrarNuevoInsumo(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="bg-[#227C63] hover:bg-[#1a5f4d]">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Movimiento
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[600px] sm:w-[700px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Registrar Nuevo Movimiento
          </SheetTitle>
          <SheetDescription>
            Complete los datos para registrar un movimiento de entrada o salida de insumos.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* Tipo de Movimiento */}
          <div className="space-y-2">
            <Label htmlFor="tipo-movimiento" className="text-sm font-medium">
              Tipo de Movimiento *
            </Label>
            <Select
              value={tipoMovimiento}
              onValueChange={(value: "entrada" | "salida") => {
                setTipoMovimiento(value)
                if (value === "salida" && insumoActual) {
                  setPrecio(insumoActual.precio.toString())
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entrada">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Entrada - Ingreso de insumos
                  </div>
                </SelectItem>
                <SelectItem value="salida">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    Salida - Consumo de insumos
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Clase de Insumo */}
          {tipoMovimiento && (
            <div className="space-y-2">
              <Label htmlFor="clase-insumo" className="text-sm font-medium">
                Clase de Insumo *
              </Label>
              <Select
                value={claseSeleccionada}
                onValueChange={(value) => {
                  setClaseSeleccionada(value)
                  setInsumoSeleccionado("")
                  setMostrarNuevoInsumo(false)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar clase..." />
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
          )}

          {/* Selección de Insumo */}
          {claseSeleccionada && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Insumo *</Label>
                {tipoMovimiento === "entrada" && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setMostrarNuevoInsumo(!mostrarNuevoInsumo)}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Crear Nuevo
                  </Button>
                )}
              </div>

              {!mostrarNuevoInsumo ? (
                <Popover open={openInsumoCombobox} onOpenChange={setOpenInsumoCombobox}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openInsumoCombobox}
                      className="w-full justify-between bg-transparent"
                    >
                      {insumoSeleccionado ? insumoActual?.nombre : "Buscar insumo..."}
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput
                        placeholder="Buscar por nombre, código o categoría..."
                        value={busquedaInsumo}
                        onValueChange={setBusquedaInsumo}
                      />
                      <CommandList>
                        <CommandEmpty>No se encontraron insumos.</CommandEmpty>
                        <CommandGroup>
                          {insumosParaBusqueda.map((insumo) => (
                            <CommandItem
                              key={insumo.id}
                              value={insumo.id}
                              onSelect={(currentValue) => {
                                setInsumoSeleccionado(currentValue === insumoSeleccionado ? "" : currentValue)
                                setOpenInsumoCombobox(false)
                                setBusquedaInsumo("")
                                if (tipoMovimiento === "salida") {
                                  const selectedInsumo = insumosEjemplo.find((i) => i.id === currentValue)
                                  if (selectedInsumo) {
                                    setPrecio(selectedInsumo.precio.toString())
                                  }
                                }
                              }}
                            >
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2">
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      insumoSeleccionado === insumo.id ? "opacity-100" : "opacity-0",
                                    )}
                                  />
                                  <div>
                                    <div className="font-medium">{insumo.nombre}</div>
                                    <div className="text-xs text-gray-500">
                                      {insumo.codigo} • {insumo.categoria}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right text-xs">
                                  <div className="font-medium">
                                    {insumo.stockActual} {insumo.unidad}
                                  </div>
                                  <div className="text-gray-500">${insumo.precio}</div>
                                </div>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Crear Nuevo Insumo</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Nombre *</Label>
                        <Input
                          value={nuevoInsumo.nombre}
                          onChange={(e) => setNuevoInsumo((prev) => ({ ...prev, nombre: e.target.value }))}
                          placeholder="Ej: Gasoil Especial"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Código *</Label>
                        <Input
                          value={nuevoInsumo.codigo}
                          onChange={(e) => setNuevoInsumo((prev) => ({ ...prev, codigo: e.target.value }))}
                          placeholder="Ej: GE001"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Categoría</Label>
                        <Input
                          value={nuevoInsumo.categoria}
                          onChange={(e) => setNuevoInsumo((prev) => ({ ...prev, categoria: e.target.value }))}
                          placeholder="Ej: Combustible"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Unidad *</Label>
                        <Input
                          value={nuevoInsumo.unidad}
                          onChange={(e) => setNuevoInsumo((prev) => ({ ...prev, unidad: e.target.value }))}
                          placeholder="Ej: L, kg, dosis"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Stock Mínimo</Label>
                        <Input
                          type="number"
                          value={nuevoInsumo.stockMinimo}
                          onChange={(e) => setNuevoInsumo((prev) => ({ ...prev, stockMinimo: e.target.value }))}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Stock Máximo</Label>
                        <Input
                          type="number"
                          value={nuevoInsumo.stockMaximo}
                          onChange={(e) => setNuevoInsumo((prev) => ({ ...prev, stockMaximo: e.target.value }))}
                          placeholder="1000"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Selección de Destino */}
          {(insumoSeleccionado || mostrarNuevoInsumo) && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {tipoMovimiento === "entrada" ? "Destino *" : "Origen/Destino *"}
              </Label>
              <Popover open={openDestinoCombobox} onOpenChange={setOpenDestinoCombobox}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openDestinoCombobox}
                    className="w-full justify-between bg-transparent"
                  >
                    {destinoSeleccionado ? destinoActual?.nombre : "Buscar destino..."}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput
                      placeholder="Buscar destino..."
                      value={busquedaDestino}
                      onValueChange={setBusquedaDestino}
                    />
                    <CommandList>
                      <CommandEmpty>No se encontraron destinos.</CommandEmpty>
                      <CommandGroup>
                        {destinosParaBusqueda.map((destino) => (
                          <CommandItem
                            key={destino.id}
                            value={destino.id}
                            onSelect={(currentValue) => {
                              setDestinoSeleccionado(currentValue === destinoSeleccionado ? "" : currentValue)
                              setOpenDestinoCombobox(false)
                              setBusquedaDestino("")
                            }}
                          >
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center gap-2">
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    destinoSeleccionado === destino.id ? "opacity-100" : "opacity-0",
                                  )}
                                />
                                <div>
                                  <div className="font-medium">{destino.nombre}</div>
                                  <div className="text-xs text-gray-500 capitalize">{destino.tipo}</div>
                                </div>
                              </div>
                              <MapPin className="w-4 h-4 text-gray-400" />
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Cantidad y Precio */}
          {destinoSeleccionado && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cantidad" className="text-sm font-medium">
                  Cantidad *
                </Label>
                <Input
                  id="cantidad"
                  type="number"
                  step="0.01"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  placeholder="0"
                />
                {insumoActual && <p className="text-xs text-gray-500">Unidad: {insumoActual.unidad}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="precio" className="text-sm font-medium">
                  Precio Unitario *
                </Label>
                <Input
                  id="precio"
                  type="number"
                  step="0.01"
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                  placeholder="0.00"
                  disabled={tipoMovimiento === "salida"}
                />
                {tipoMovimiento === "salida" && <p className="text-xs text-gray-500">Precio automático del stock</p>}
              </div>
            </div>
          )}

          {/* Validación de Stock */}
          {stockResultante !== null && (
            <Alert className={stockInsuficiente ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
              <div className="flex items-center gap-2">
                {stockInsuficiente ? (
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                )}
                <AlertDescription className={stockInsuficiente ? "text-red-800" : "text-green-800"}>
                  {stockInsuficiente ? (
                    <span>
                      <strong>Stock insuficiente:</strong> El stock resultante sería {stockResultante}{" "}
                      {insumoActual?.unidad}
                    </span>
                  ) : (
                    <span>
                      <strong>Stock resultante:</strong> {stockResultante} {insumoActual?.unidad}
                    </span>
                  )}
                </AlertDescription>
              </div>
            </Alert>
          )}

          {/* Observaciones */}
          {cantidad && precio && (
            <div className="space-y-2">
              <Label htmlFor="observaciones" className="text-sm font-medium">
                Observaciones
              </Label>
              <Textarea
                id="observaciones"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Detalles adicionales del movimiento..."
                rows={3}
              />
            </div>
          )}

          {/* Resumen */}
          {cantidad && precio && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Resumen del Movimiento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Tipo:</span>
                  <Badge variant={tipoMovimiento === "entrada" ? "default" : "destructive"}>
                    {tipoMovimiento === "entrada" ? "Entrada" : "Salida"}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Insumo:</span>
                  <span className="font-medium">{insumoActual?.nombre || "Nuevo insumo"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Cantidad:</span>
                  <span className="font-medium">
                    {cantidad} {insumoActual?.unidad || nuevoInsumo.unidad}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Precio unitario:</span>
                  <span className="font-medium">${Number.parseFloat(precio || "0").toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm font-bold">
                  <span>Valor total:</span>
                  <span>
                    ${(Number.parseFloat(cantidad || "0") * Number.parseFloat(precio || "0")).toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm()
                setOpen(false)
              }}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={
                !tipoMovimiento ||
                !destinoSeleccionado ||
                !cantidad ||
                !precio ||
                stockInsuficiente ||
                (!insumoSeleccionado && !mostrarNuevoInsumo) ||
                (mostrarNuevoInsumo && (!nuevoInsumo.nombre || !nuevoInsumo.codigo || !nuevoInsumo.unidad))
              }
              className="flex-1 bg-[#227C63] hover:bg-[#1a5f4d]"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Registrar Movimiento
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
