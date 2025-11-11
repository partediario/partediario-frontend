"use client"

import type React from "react"
import type { JSX } from "react" // Import JSX to fix the lint error
import { useState, useEffect, useRef } from "react"
import { X, RefreshCw, Save, Loader2, Search, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { CustomDatePicker } from "@/components/ui/custom-date-picker"
import { CustomCombobox } from "@/components/ui/custom-combobox"
import { useEstablishment } from "@/contexts/establishment-context"
import { useUser } from "@/contexts/user-context"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface LoteStock {
  lote_id: number
  lote_nombre: string
  inactivo: boolean
  pd_detalles: Array<{
    categoria_animal_id: number
    categoria_animal_nombre: string
    cantidad: number
    peso_promedio: number
    cantidad_trasladar: number
    seleccionada: boolean
    lote_destino_id?: number
    lote_origen_id: number
  }>
}

interface LoteDestino {
  id: number
  nombre: string
  inactivo: boolean
}

interface ReloteoDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  tipoActividadId?: number
}

export default function ReloteoDrawer({ isOpen, onClose, onSuccess, tipoActividadId }: ReloteoDrawerProps) {
  const [loading, setLoading] = useState(false)
  const [lotes, setLotes] = useState<LoteStock[]>([])
  const [todosLotes, setTodosLotes] = useState<LoteDestino[]>([]) // Para los selectores de destino
  const [fecha, setFecha] = useState<Date>(new Date())
  const [hora, setHora] = useState<string>(new Date().toTimeString().slice(0, 5))
  const [nota, setNota] = useState("")
  const [searchCategoria, setSearchCategoria] = useState("")
  const [lotesSeleccionados, setLotesSeleccionados] = useState<string[]>([])
  const [filtroLoteAbierto, setFiltroLoteAbierto] = useState(false)
  const filtroLoteRef = useRef<HTMLDivElement>(null)
  const [searchLote, setSearchLote] = useState("")

  // Usar el contexto de establecimiento
  const { establecimientoSeleccionado, empresaSeleccionada } = useEstablishment()
  const { usuario } = useUser()

  // Obtener nombre completo del usuario
  const nombreCompleto = usuario ? `${usuario.nombres} ${usuario.apellidos}`.trim() : "Cargando..."

  // Efecto para cerrar el dropdown al hacer clic afuera
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
    if (isOpen && establecimientoSeleccionado && empresaSeleccionada) {
      loadLotes()
      loadTodosLotes()
    }
  }, [isOpen, establecimientoSeleccionado, empresaSeleccionada])

  // Limpiar formulario al abrir
  useEffect(() => {
    if (isOpen) {
      setFecha(new Date())
      setHora(new Date().toTimeString().slice(0, 5))
      setNota("")
      setLotes([])
      setTodosLotes([])
      setSearchCategoria("")
      setLotesSeleccionados([])
      setFiltroLoteAbierto(false)
      setSearchLote("")
    }
  }, [isOpen])

  const loadLotes = async () => {
    if (!establecimientoSeleccionado) {
      console.error("No hay establecimiento seleccionado")
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/lotes-stock?establecimiento_id=${establecimientoSeleccionado}`)

      if (!response.ok) {
        throw new Error("Error al cargar lotes")
      }

      const lotesData: LoteStock[] = await response.json()

      // Initialize cada categoria con valores por defecto
      // Note: The API now already filters out inactive lots, so no need to filter here
      const lotesWithDefaults = lotesData.map((lote) => ({
        ...lote,
        pd_detalles: lote.pd_detalles
          .sort((a, b) => a.categoria_animal_id - b.categoria_animal_id)
          .map((detalle) => ({
            ...detalle,
            cantidad_trasladar: 0,
            seleccionada: false,
            lote_destino_id: undefined,
            lote_origen_id: lote.lote_id,
          })),
      }))

      setLotes(lotesWithDefaults.sort((a, b) => a.lote_id - b.lote_id))
    } catch (error) {
      console.error("Error loading lotes:", error)
      toast({
        title: "Error",
        description: "Error al cargar lotes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadTodosLotes = async () => {
    if (!establecimientoSeleccionado) {
      console.error("No hay establecimiento seleccionado")
      return
    }

    try {
      const response = await fetch(`/api/lotes-todos?establecimiento_id=${establecimientoSeleccionado}`)

      if (!response.ok) {
        throw new Error("Error al cargar todos los lotes")
      }

      const todosLotesData: LoteDestino[] = await response.json()
      setTodosLotes(todosLotesData.sort((a, b) => a.id - b.id))
    } catch (error) {
      console.error("Error loading todos los lotes:", error)
      toast({
        title: "Error",
        description: "Error al cargar lotes de destino",
        variant: "destructive",
      })
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
              cantidad_trasladar: checked ? detalle.cantidad : 0,
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
                  cantidad_trasladar: checked ? detalle.cantidad : 0,
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
                    cantidad_trasladar: 0,
                    // Don't uncheck when deleting quantity
                  }
                }

                // Parse the number and validate range
                const cantidad = Number.parseInt(value, 10)
                if (isNaN(cantidad)) {
                  return detalle // Keep current value if invalid
                }

                const cantidadValida = Math.min(Math.max(0, cantidad), detalle.cantidad)
                return {
                  ...detalle,
                  cantidad_trasladar: cantidadValida,
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

  const handleLoteDestinoChange = (loteId: number, categoriaId: number, loteDestinoId: number) => {
    setLotes((prevLotes) =>
      prevLotes.map((lote) => {
        if (lote.lote_id === loteId) {
          return {
            ...lote,
            pd_detalles: lote.pd_detalles.map((detalle) => {
              if (detalle.categoria_animal_id === categoriaId) {
                return {
                  ...detalle,
                  lote_destino_id: loteDestinoId,
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

  const getOpcionesLoteDestino = (loteOrigenId: number) => {
    // Use todosLotes (includes active and inactive) and exclude only the origin lot
    return todosLotes
      .filter((lote) => lote.id !== loteOrigenId)
      .sort((a, b) => a.id - b.id)
      .map((lote) => ({
        value: lote.id.toString(),
        label: lote.inactivo ? `${lote.nombre} (Vacío)` : lote.nombre,
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

  const getResumenReloteo = () => {
    const movimientos: Array<{
      loteOrigen: string
      loteDestino: string
      categoria: string
      cantidad: number
    }> = []

    lotes.forEach((lote) => {
      lote.pd_detalles.forEach((detalle) => {
        if (detalle.seleccionada && detalle.cantidad_trasladar > 0 && detalle.lote_destino_id) {
          const loteDestino = todosLotes.find((l) => l.id === detalle.lote_destino_id)
          if (loteDestino) {
            movimientos.push({
              loteOrigen: lote.lote_nombre,
              loteDestino: loteDestino.nombre,
              categoria: detalle.categoria_animal_nombre,
              cantidad: detalle.cantidad_trasladar,
            })
          }
        }
      })
    })

    return movimientos
  }

  const filteredLotes = lotes
    .filter((lote) => {
      // Filtrar por lotes seleccionados si hay alguno
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

  // Crear filas para la tabla unificada
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
      lote.pd_detalles.forEach((detalle, index) => {
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
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  min="0"
                  max={detalle.cantidad}
                  value={detalle.cantidad_trasladar === 0 ? "" : detalle.cantidad_trasladar.toString()}
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
                options={getOpcionesLoteDestino(lote.lote_id)}
                value={detalle.lote_destino_id?.toString() || ""}
                onValueChange={(value) =>
                  handleLoteDestinoChange(lote.lote_id, detalle.categoria_animal_id, Number.parseInt(value))
                }
                placeholder="Seleccionar lote..."
                searchPlaceholder="Buscar lote..."
                emptyMessage="No hay lotes disponibles."
                disabled={!detalle.seleccionada}
              />
            </TableCell>
          </TableRow>,
        )
      })
    })

    return rows
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const todasLasCategorias = lotes.flatMap((lote) => lote.pd_detalles)
      const categoriasSeleccionadas = todasLasCategorias.filter((detalle) => detalle.seleccionada)

      if (categoriasSeleccionadas.length === 0) {
        toast({
          title: "Error",
          description: "Debe seleccionar al menos una categoría para relotear",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      const categoriasConCantidadCero = categoriasSeleccionadas.filter(
        (detalle) => !detalle.cantidad_trasladar || detalle.cantidad_trasladar === 0,
      )

      if (categoriasConCantidadCero.length > 0) {
        toast({
          title: "Error",
          description: "Las categorías seleccionadas deben tener una cantidad válida mayor a 0",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      const categoriasConCantidadValida = categoriasSeleccionadas.filter((detalle) => detalle.cantidad_trasladar > 0)

      const categoriasSinDestino = categoriasConCantidadValida.filter((detalle) => !detalle.lote_destino_id)

      if (categoriasSinDestino.length > 0) {
        toast({
          title: "Error",
          description: "Todas las categorías seleccionadas deben tener un lote destino",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      // Now get the movements summary (should have valid data at this point)
      const movimientos = getResumenReloteo()

      // Procesar movimientos por lote origen
      const movimientosPorLote = new Map<
        number,
        Array<{
          categoria_animal_id: number
          cantidad_a_mover: number
          peso_promedio_a_mover: number
          lote_destino_id: number
        }>
      >()

      lotes.forEach((lote) => {
        lote.pd_detalles.forEach((detalle) => {
          if (detalle.seleccionada && detalle.cantidad_trasladar > 0 && detalle.lote_destino_id) {
            if (!movimientosPorLote.has(lote.lote_id)) {
              movimientosPorLote.set(lote.lote_id, [])
            }

            const movimientosLote = movimientosPorLote.get(lote.lote_id)!
            const movimientoExistente = movimientosLote.find((m) => m.lote_destino_id === detalle.lote_destino_id)

            if (movimientoExistente) {
              // Si ya existe un movimiento al mismo lote destino, agregar esta categoría
              movimientosLote.push({
                categoria_animal_id: detalle.categoria_animal_id,
                cantidad_a_mover: detalle.cantidad_trasladar,
                peso_promedio_a_mover: detalle.peso_promedio,
                lote_destino_id: detalle.lote_destino_id,
              })
            } else {
              movimientosLote.push({
                categoria_animal_id: detalle.categoria_animal_id,
                cantidad_a_mover: detalle.cantidad_trasladar,
                peso_promedio_a_mover: detalle.peso_promedio,
                lote_destino_id: detalle.lote_destino_id,
              })
            }
          }
        })
      })

      // Agrupar movimientos por lote origen y destino
      const movimientosAgrupados = new Map<
        string,
        {
          lote_origen_id: number
          lote_destino_id: number
          movimientos: Array<{
            categoria_animal_id: number
            cantidad_a_mover: number
            peso_promedio_a_mover: number
          }>
        }
      >()

      movimientosPorLote.forEach((movimientos, loteOrigenId) => {
        movimientos.forEach((mov) => {
          const key = `${loteOrigenId}-${mov.lote_destino_id}`

          if (!movimientosAgrupados.has(key)) {
            movimientosAgrupados.set(key, {
              lote_origen_id: loteOrigenId,
              lote_destino_id: mov.lote_destino_id,
              movimientos: [],
            })
          }

          movimientosAgrupados.get(key)!.movimientos.push({
            categoria_animal_id: mov.categoria_animal_id,
            cantidad_a_mover: mov.cantidad_a_mover,
            peso_promedio_a_mover: mov.peso_promedio_a_mover,
          })
        })
      })

      // Ejecutar cada movimiento agrupado
      for (const [key, grupo] of movimientosAgrupados) {
        const response = await fetch("/api/mover-stock-entre-lotes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            p_lote_origen_id: grupo.lote_origen_id,
            p_lote_destino_id: grupo.lote_destino_id,
            p_movimientos: grupo.movimientos,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData?.error || `Error en movimiento ${key}`)
        }
      }

      // Guardar actividad si se proporciona tipoActividadId
      if (tipoActividadId && usuario?.id) {
        try {
          const reloteosParaActividad = categoriasSeleccionadas.map((detalle) => {
            return {
              categoria_animal_id: detalle.categoria_animal_id,
              cantidad: detalle.cantidad_trasladar,
              peso_promedio: detalle.peso_promedio,
              tipo_peso: "PROMEDIO",
              lote_origen_id: detalle.lote_origen_id,
              lote_destino_id: detalle.lote_destino_id,
            }
          })

          const actividadResponse = await fetch("/api/guardar-reloteo-actividad", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              establecimiento_id: establecimientoSeleccionado,
              tipo_actividad_id: tipoActividadId,
              fecha: fecha.toISOString().split("T")[0],
              hora: hora,
              nota: nota.trim() || null,
              user_id: usuario.id,
              reloteos: reloteosParaActividad,
            }),
          })

          if (!actividadResponse.ok) {
            console.error("Error saving activity record, but reloteo was successful")
          } else {
            console.log("Activity record saved successfully")
            // Dispatch event to reload activities
            window.dispatchEvent(new Event("reloadPartesDiarios"))
          }
        } catch (activityError) {
          console.error("Error saving activity record:", activityError)
          // Don't fail the main operation if activity logging fails
        }
      }

      toast({
        title: "✅ Reloteo Completado",
        description: "El reloteo ha sido procesado exitosamente",
        duration: 4000,
      })

      handleClose()
      onSuccess()
    } catch (error) {
      console.error("Error processing reloteo:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al procesar el reloteo",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    onClose()
    // Reset form
    setFecha(new Date())
    setHora(new Date().toTimeString().slice(0, 5))
    setNota("")
    setLotes([])
    setTodosLotes([])
    setSearchCategoria("")
    setLotesSeleccionados([])
    setFiltroLoteAbierto(false)
    setSearchLote("")
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

  return (
    <Drawer open={isOpen} onOpenChange={onClose} direction="right">
      <DrawerContent className="h-full w-[900px] ml-auto">
        <DrawerHeader className="flex items-center justify-between border-b pb-4">
          <DrawerTitle className="text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2">
            <RefreshCw className="w-6 h-6 text-blue-600" />
            Reloteo
          </DrawerTitle>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Fecha */}
          <div className="space-y-4">
            <div>
              <Label>Fecha *</Label>
              <CustomDatePicker date={fecha} onDateChange={setFecha} placeholder="Seleccionar fecha" />
            </div>

            {/* Filtros */}
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

            {/* Animales a Relotear - Tabla Unificada con Agrupación */}
            <div>
              <h3 className="text-base md:text-lg font-semibold mb-3">Animales a Relotear *</h3>
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
                        <TableHead className="py-2">Cantidad a Relotear</TableHead>
                        <TableHead className="py-2">Lote Destino</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>{createTableRows()}</TableBody>
                  </Table>
                </div>
              )}
            </div>

            {/* Resumen del Reloteo */}
            {getResumenReloteo().length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">📋 Resumen del Reloteo</h4>
                <div className="space-y-1">
                  {getResumenReloteo().map((movimiento, index) => (
                    <div key={index} className="text-sm text-gray-700">
                      <span className="font-medium">{movimiento.cantidad}</span> {movimiento.categoria} del lote{" "}
                      <span className="font-medium">"{movimiento.loteOrigen}"</span> → lote{" "}
                      <span className="font-medium">"{movimiento.loteDestino}"</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
          <Button onClick={handleSubmit} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Guardar Reloteo
              </>
            )}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
