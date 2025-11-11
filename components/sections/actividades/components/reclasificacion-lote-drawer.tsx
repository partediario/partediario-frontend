"use client"
import type { JSX } from "react"
import { useState, useEffect, useRef } from "react"
import { X, Users, Save, Loader2, Search, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { CustomDatePicker } from "@/components/ui/custom-date-picker"
import { CustomCombobox } from "@/components/ui/custom-combobox"
import { useEstablishment } from "@/contexts/establishment-context"
import { useUser } from "@/contexts/user-context"
import { toast } from "@/hooks/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

interface LoteConStock {
  lote_id: number
  lote_nombre: string
  establecimiento_id: number
  inactivo: boolean
  pd_detalles: DetalleCategoria[]
}

interface DetalleCategoria {
  categoria_animal_id: number
  categoria_animal_nombre: string
  cantidad: number
  peso_total: number
  peso_promedio: number
  cantidad_recategorizar: number
  seleccionada: boolean
  categoria_destino_id?: number
  lote_origen_id: number
}

interface CategoriaDisponible {
  id: number
  nombre: string
  sexo: string
  edad: string
  empresa_id: number
}

interface ReclasificacionDetalle {
  categoria_animal_id: number
  categoria_animal_nombre: string
  cantidad_disponible: number
  cantidad_recategorizar: number
  peso_promedio: number
  lote_origen_id: number
  categoria_destino_id: number | null
  sexo: string
}

interface ReclasificacionLoteDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function ReclasificacionLoteDrawer({ isOpen, onClose, onSuccess }: ReclasificacionLoteDrawerProps) {
  const [loading, setLoading] = useState(false)
  const [lotes, setLotes] = useState<LoteConStock[]>([])
  const [categoriasDisponibles, setCategoriasDisponibles] = useState<CategoriaDisponible[]>([])
  const [fecha, setFecha] = useState<Date>(new Date())
  const [hora, setHora] = useState<string>(new Date().toTimeString().slice(0, 5))
  const [nota, setNota] = useState("")

  const [searchCategoria, setSearchCategoria] = useState("")
  const [lotesSeleccionados, setLotesSeleccionados] = useState<string[]>([])
  const [filtroLoteAbierto, setFiltroLoteAbierto] = useState(false)
  const filtroLoteRef = useRef<HTMLDivElement>(null)
  const [searchLote, setSearchLote] = useState("")

  const { establecimientoSeleccionado, empresaSeleccionada } = useEstablishment()
  const { usuario } = useUser()

  const nombreCompleto = usuario ? `${usuario.nombres} ${usuario.apellidos}`.trim() : "Cargando..."

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filtroLoteRef.current && !filtroLoteRef.current.contains(event.target as Node)) {
        setFiltroLoteAbierto(false)
        setSearchLote("")
      }
    }

    if (filtroLoteAbierto) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [filtroLoteAbierto])

  useEffect(() => {
    if (isOpen) {
      setFecha(new Date())
      setHora(new Date().toTimeString().slice(0, 5))
      setNota("")
      setLotes([])
      setCategoriasDisponibles([])
      setSearchCategoria("")
      setLotesSeleccionados([])
      setFiltroLoteAbierto(false)
      setSearchLote("")
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen && establecimientoSeleccionado && empresaSeleccionada) {
      loadData()
    }
  }, [isOpen, establecimientoSeleccionado, empresaSeleccionada])

  const loadData = async () => {
    setLoading(true)

    try {
      const lotesUrl = `/api/lotes-stock-view?establecimiento_id=${establecimientoSeleccionado}`
      const lotesResponse = await fetch(lotesUrl)

      if (lotesResponse.ok) {
        const lotesData = await lotesResponse.json()

        if (lotesData.lotes && lotesData.lotes.length > 0) {
          const lotesConStock = lotesData.lotes
            .filter((lote: LoteConStock) => !lote.inactivo && lote.pd_detalles && lote.pd_detalles.length > 0)
            .map((lote: LoteConStock) => ({
              ...lote,
              pd_detalles: lote.pd_detalles
                .sort((a, b) => a.categoria_animal_id - b.categoria_animal_id)
                .map((detalle) => ({
                  ...detalle,
                  cantidad_recategorizar: 0,
                  seleccionada: false,
                  categoria_destino_id: undefined,
                  lote_origen_id: lote.lote_id,
                })),
            }))

          setLotes(lotesConStock.sort((a, b) => a.lote_id - b.lote_id))
        } else {
          toast({
            title: "Información",
            description: "No se encontraron lotes con stock disponible",
            variant: "default",
          })
        }
      } else {
        toast({
          title: "Error",
          description: "Error al cargar lotes",
          variant: "destructive",
        })
      }

      const disponiblesUrl = `/api/categorias-animales-empresa?empresa_id=${empresaSeleccionada}`
      const disponiblesResponse = await fetch(disponiblesUrl)

      if (disponiblesResponse.ok) {
        const disponiblesData = await disponiblesResponse.json()

        if (disponiblesData.categorias) {
          setCategoriasDisponibles(disponiblesData.categorias)
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al cargar los datos: " + (error instanceof Error ? error.message : "Error desconocido"),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLoteSelectionChange = (loteId: number, checked: boolean) => {
    setLotes((prevLotes) =>
      prevLotes.map((lote) => {
        if (lote.lote_id === loteId) {
          return {
            ...lote,
            pd_detalles: lote.pd_detalles.map((detalle) => ({
              ...detalle,
              seleccionada: checked,
              cantidad_recategorizar: checked ? detalle.cantidad : 0,
            })),
          }
        }
        return lote
      }),
    )
  }

  const handleCategoriaSelectionChange = (loteId: number, categoriaId: number, checked: boolean) => {
    setLotes((prevLotes) =>
      prevLotes.map((lote) => {
        if (lote.lote_id === loteId) {
          return {
            ...lote,
            pd_detalles: lote.pd_detalles.map((detalle) => {
              if (detalle.categoria_animal_id === categoriaId) {
                return {
                  ...detalle,
                  seleccionada: checked,
                  cantidad_recategorizar: checked ? detalle.cantidad : 0,
                }
              }
              return detalle
            }),
          }
        }
        return lote
      }),
    )
  }

  const handleCantidadChange = (loteId: number, categoriaId: number, value: string) => {
    setLotes((prevLotes) =>
      prevLotes.map((lote) => {
        if (lote.lote_id === loteId) {
          return {
            ...lote,
            pd_detalles: lote.pd_detalles.map((detalle) => {
              if (detalle.categoria_animal_id === categoriaId) {
                if (value === "" || value === "0") {
                  return {
                    ...detalle,
                    cantidad_recategorizar: 0,
                  }
                }

                const cantidad = Number.parseInt(value, 10)
                if (isNaN(cantidad)) {
                  return detalle
                }

                const cantidadValida = Math.min(Math.max(0, cantidad), detalle.cantidad)
                return {
                  ...detalle,
                  cantidad_recategorizar: cantidadValida,
                }
              }
              return detalle
            }),
          }
        }
        return lote
      }),
    )
  }

  const handleCategoriaDestinoChange = (loteId: number, categoriaId: number, categoriaDestinoId: number) => {
    setLotes((prevLotes) =>
      prevLotes.map((lote) => {
        if (lote.lote_id === loteId) {
          return {
            ...lote,
            pd_detalles: lote.pd_detalles.map((detalle) => {
              if (detalle.categoria_animal_id === categoriaId) {
                return {
                  ...detalle,
                  categoria_destino_id: categoriaDestinoId,
                }
              }
              return detalle
            }),
          }
        }
        return lote
      }),
    )
  }

  const getCategoriasDisponiblesPorSexo = (categoriaActualId: number) => {
    const categoriaActual = categoriasDisponibles.find((cat) => cat.id === categoriaActualId)
    if (!categoriaActual) return []

    return categoriasDisponibles
      .filter((cat) => cat.sexo === categoriaActual.sexo && cat.id !== categoriaActualId)
      .map((cat) => ({
        value: cat.id.toString(),
        label: cat.nombre,
      }))
  }

  const opcionesLote = lotes
    .sort((a, b) => a.lote_id - b.lote_id)
    .map((lote) => ({
      value: lote.lote_id.toString(),
      label: lote.lote_nombre,
    }))

  const handleLoteFilterChange = (loteId: string) => {
    setLotesSeleccionados((prev) => {
      if (prev.includes(loteId)) {
        return prev.filter((id) => id !== loteId)
      } else {
        return [...prev, loteId]
      }
    })
  }

  const filteredLotes = lotes
    .filter((lote) => {
      if (lotesSeleccionados.length > 0) {
        return lotesSeleccionados.includes(lote.lote_id.toString())
      }
      return true
    })
    .map((lote) => ({
      ...lote,
      pd_detalles: lote.pd_detalles
        .filter(
          (detalle) =>
            searchCategoria === "" ||
            detalle.categoria_animal_nombre.toLowerCase().includes(searchCategoria.toLowerCase()),
        )
        .sort((a, b) => a.categoria_animal_id - b.categoria_animal_id),
    }))
    .filter((lote) => lote.pd_detalles.length > 0)

  const createTableRows = () => {
    const rows: JSX.Element[] = []

    filteredLotes.forEach((lote) => {
      // Fila de header del lote
      rows.push(
        <TableRow key={`header-${lote.lote_id}`} className="bg-blue-50 border-t-2 border-blue-200">
          <TableCell colSpan={4} className="py-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id={`lote-${lote.lote_id}`}
                checked={lote.pd_detalles.every((detalle) => detalle.seleccionada)}
                onCheckedChange={(checked) => handleLoteSelectionChange(lote.lote_id, checked as boolean)}
              />
              <Label htmlFor={`lote-${lote.lote_id}`} className="font-semibold text-blue-900">
                {lote.lote_nombre} - Lote Completo
              </Label>
            </div>
          </TableCell>
        </TableRow>,
      )

      // Filas de categorías
      lote.pd_detalles.forEach((detalle) => {
        const opcionesCategorias = getCategoriasDisponiblesPorSexo(detalle.categoria_animal_id)

        rows.push(
          <TableRow key={`${lote.lote_id}-${detalle.categoria_animal_id}`} className="hover:bg-gray-50">
            <TableCell className="py-2 pl-8">
              <Checkbox
                checked={detalle.seleccionada}
                onCheckedChange={(checked) =>
                  handleCategoriaSelectionChange(lote.lote_id, detalle.categoria_animal_id, checked as boolean)
                }
              />
            </TableCell>
            <TableCell className="py-2">
              <div className="font-medium">{detalle.categoria_animal_nombre}</div>
            </TableCell>
            <TableCell className="py-2">
              <div className="flex items-center justify-center space-x-2">
                <Input
                  type="number"
                  min="0"
                  max={detalle.cantidad}
                  value={detalle.cantidad_recategorizar === 0 ? "" : detalle.cantidad_recategorizar.toString()}
                  onChange={(e) => {
                    handleCantidadChange(lote.lote_id, detalle.categoria_animal_id, e.target.value)
                  }}
                  className="w-16 h-8 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  disabled={!detalle.seleccionada}
                  placeholder="0"
                  onFocus={(e) => e.target.select()}
                />
                <span className="text-gray-500 text-sm">/ {detalle.cantidad}</span>
              </div>
            </TableCell>
            <TableCell className="py-2">
              <CustomCombobox
                options={opcionesCategorias}
                value={detalle.categoria_destino_id?.toString() || ""}
                onValueChange={(value) =>
                  handleCategoriaDestinoChange(lote.lote_id, detalle.categoria_animal_id, Number.parseInt(value))
                }
                placeholder="Seleccionar categoría..."
                searchPlaceholder="Buscar categoría..."
                emptyMessage="No hay categorías disponibles."
                disabled={!detalle.seleccionada}
              />
            </TableCell>
          </TableRow>,
        )
      })
    })

    return rows
  }

  const getLotesSeleccionadosText = () => {
    if (lotesSeleccionados.length === 0) {
      return "Todos los lotes"
    }
    if (lotesSeleccionados.length === 1) {
      const lote = lotes.find((l) => l.lote_id.toString() === lotesSeleccionados[0])
      return lote?.lote_nombre || "Lote seleccionado"
    }
    return `${lotesSeleccionados.length} lotes seleccionados`
  }

  const handleSubmit = async () => {
    if (!usuario || !usuario.id) {
      toast({
        title: "Error",
        description: "Usuario no identificado. Por favor, recarga la página.",
        variant: "destructive",
      })
      return
    }

    const categoriasConCheckbox = lotes.flatMap((lote) => lote.pd_detalles.filter((detalle) => detalle.seleccionada))

    if (categoriasConCheckbox.length === 0) {
      toast({
        title: "Error",
        description: "Debe seleccionar al menos una categoría para recategorizar",
        variant: "destructive",
      })
      return
    }

    const categoriasSinCantidad = categoriasConCheckbox.filter((detalle) => detalle.cantidad_recategorizar === 0)

    if (categoriasSinCantidad.length > 0) {
      toast({
        title: "Error",
        description: "Las categorías seleccionadas deben tener una cantidad válida mayor a 0",
        variant: "destructive",
      })
      return
    }

    const categoriasSeleccionadas = categoriasConCheckbox.filter((detalle) => detalle.cantidad_recategorizar > 0)

    const categoriasSinDestino = categoriasSeleccionadas.filter((detalle) => !detalle.categoria_destino_id)

    if (categoriasSinDestino.length > 0) {
      toast({
        title: "Error",
        description: "Todas las categorías seleccionadas deben tener una categoría destino",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const datosEnvio = {
        establecimiento_id: establecimientoSeleccionado,
        user_id: usuario.id,
        fecha: fecha.toISOString().split("T")[0],
        hora: hora,
        nota: nota.trim() || "",
        reclasificaciones: categoriasSeleccionadas.map((detalle) => ({
          lote_origen_id: detalle.lote_origen_id,
          categoria_animal_id: detalle.categoria_animal_id,
          categoria_destino_id: detalle.categoria_destino_id,
          cantidad: detalle.cantidad_recategorizar,
          peso_promedio: detalle.peso_promedio,
        })),
      }

      const response = await fetch("/api/guardar-reclasificacion-lote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(datosEnvio),
      })

      if (response.ok) {
        toast({
          title: "✅ Reclasificación Guardada",
          description: `Se procesaron ${categoriasSeleccionadas.length} reclasificaciones`,
          duration: 4000,
        })

        window.dispatchEvent(new Event("reloadActividades"))
        window.dispatchEvent(new Event("reloadPartesDiarios"))

        handleClose()
        onSuccess()
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.message || errorData.error || "Error al procesar la reclasificación",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          "Error al procesar la reclasificación: " + (error instanceof Error ? error.message : "Error desconocido"),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    onClose()
    setFecha(new Date())
    setHora(new Date().toTimeString().slice(0, 5))
    setNota("")
    setLotes([])
    setCategoriasDisponibles([])
    setSearchCategoria("")
    setLotesSeleccionados([])
    setFiltroLoteAbierto(false)
    setSearchLote("")
  }

  return (
    <Drawer open={isOpen} onOpenChange={onClose} direction="right">
      <DrawerContent className="h-full w-[900px] ml-auto">
        <DrawerHeader className="flex items-center justify-between border-b pb-4">
          <DrawerTitle className="text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-orange-600" />
            Reclasificación de Animales por Lote
          </DrawerTitle>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {/* Fecha */}
            <div>
              <Label>Fecha *</Label>
              <CustomDatePicker date={fecha} onDateChange={setFecha} placeholder="Seleccionar fecha" />
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Filtros</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="filtro-lote">Filtrar por Lote</Label>
                  <div className="relative" ref={filtroLoteRef}>
                    <Button
                      variant="outline"
                      className="w-full justify-between bg-transparent"
                      onClick={() => setFiltroLoteAbierto(!filtroLoteAbierto)}
                      type="button"
                    >
                      <span className="truncate text-left">{getLotesSeleccionadosText()}</span>
                      <ChevronDown
                        className={cn("ml-2 h-4 w-4 shrink-0 transition-transform", filtroLoteAbierto && "rotate-180")}
                      />
                    </Button>

                    {filtroLoteAbierto && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-hidden">
                        <div className="p-2 border-b">
                          <div className="relative">
                            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              placeholder="Buscar lote..."
                              value={searchLote}
                              onChange={(e) => setSearchLote(e.target.value)}
                              className="pl-8 h-8"
                              autoFocus
                            />
                          </div>
                        </div>
                        <div className="max-h-48 overflow-auto">
                          <div
                            className={cn(
                              "flex items-center px-3 py-2 text-sm cursor-pointer hover:bg-gray-100",
                              lotesSeleccionados.length === 0 && "bg-blue-50",
                            )}
                            onClick={() => {
                              setLotesSeleccionados([])
                            }}
                          >
                            <Checkbox checked={lotesSeleccionados.length === 0} className="mr-2" readOnly />
                            <span
                              className={cn("truncate", lotesSeleccionados.length === 0 && "text-blue-600 font-medium")}
                            >
                              Todos los lotes
                            </span>
                          </div>
                          {opcionesLote
                            .filter(
                              (lote) =>
                                searchLote === "" || lote.label.toLowerCase().includes(searchLote.toLowerCase()),
                            )
                            .map((lote) => (
                              <div
                                key={lote.value}
                                className={cn(
                                  "flex items-center px-3 py-2 text-sm cursor-pointer hover:bg-gray-100",
                                  lotesSeleccionados.includes(lote.value) && "bg-blue-50",
                                )}
                                onClick={() => handleLoteFilterChange(lote.value)}
                              >
                                <Checkbox checked={lotesSeleccionados.includes(lote.value)} className="mr-2" readOnly />
                                <span
                                  className={cn(
                                    "truncate",
                                    lotesSeleccionados.includes(lote.value) && "text-blue-600 font-medium",
                                  )}
                                >
                                  {lote.label}
                                </span>
                              </div>
                            ))}
                          {opcionesLote.filter(
                            (lote) => searchLote === "" || lote.label.toLowerCase().includes(searchLote.toLowerCase()),
                          ).length === 0 &&
                            searchLote !== "" && (
                              <div className="py-4 text-center text-sm text-gray-500">No se encontraron lotes.</div>
                            )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <Label htmlFor="search-categoria">Buscar Categoría</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="search-categoria"
                      value={searchCategoria}
                      onChange={(e) => setSearchCategoria(e.target.value)}
                      placeholder="Buscar por nombre de categoría..."
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-base md:text-lg font-semibold mb-3">Animales a Recategorizar *</h3>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="ml-2">Cargando lotes...</span>
                </div>
              ) : filteredLotes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No se encontraron lotes con animales</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="w-12 py-2"></TableHead>
                        <TableHead className="py-2">Categoría</TableHead>
                        <TableHead className="py-2">Cantidad a Recategorizar</TableHead>
                        <TableHead className="py-2">Categoría Destino</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>{createTableRows()}</TableBody>
                  </Table>
                </div>
              )}
            </div>

            {/* Nota */}
            <div>
              <Label htmlFor="nota">Nota</Label>
              <Textarea
                id="nota"
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                placeholder="Observaciones adicionales..."
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !usuario} className="bg-orange-600 hover:bg-orange-700">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Guardar Reclasificación
              </>
            )}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
