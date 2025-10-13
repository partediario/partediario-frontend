"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { X, Scale, Save, Loader2, Info, Search, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { CustomDatePicker } from "@/components/ui/custom-date-picker"
import { CustomTimePicker } from "@/components/ui/custom-time-picker"
import { CustomCombobox } from "@/components/ui/custom-combobox"
import { useEstablishment } from "@/contexts/establishment-context"
import { useUser } from "@/contexts/user-context"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import type { JSX } from "react/jsx-runtime"

interface LoteStock {
  lote_id: number
  lote_nombre: string
  inactivo: boolean
  pd_detalles: Array<{
    categoria_animal_id: number
    categoria_animal_nombre: string
    cantidad: number
    peso_total: number
    peso_promedio: number
    peso_nuevo: number
    tipo_peso_nuevo: "PROMEDIO" | "TOTAL"
    seleccionada: boolean
  }>
}

interface PesajeDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  tipoActividadId?: number
}

export default function PesajeDrawer({ isOpen, onClose, onSuccess, tipoActividadId }: PesajeDrawerProps) {
  const [loading, setLoading] = useState(false)
  const [lotes, setLotes] = useState<LoteStock[]>([])
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
    if (isOpen && establecimientoSeleccionado && empresaSeleccionada) {
      loadLotes()
    }
  }, [isOpen, establecimientoSeleccionado, empresaSeleccionada])

  useEffect(() => {
    if (isOpen) {
      setFecha(new Date())
      setHora(new Date().toTimeString().slice(0, 5))
      setNota("")
      setLotes([])
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
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ""}/api/lotes-stock?establecimiento_id=${establecimientoSeleccionado}`,
      )

      if (!response.ok) {
        throw new Error("Error al cargar lotes")
      }

      const lotesData: LoteStock[] = await response.json()

      const lotesWithDefaults = lotesData.map((lote) => ({
        ...lote,
        pd_detalles: lote.pd_detalles
          .sort((a, b) => a.categoria_animal_id - b.categoria_animal_id)
          .map((detalle) => ({
            ...detalle,
            peso_nuevo: 0,
            tipo_peso_nuevo: "PROMEDIO" as "PROMEDIO" | "TOTAL",
            seleccionada: false,
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

  const handleLoteSelectionChange = (loteId: number, checked: boolean) => {
    setLotes((prevLotes) =>
      prevLotes.map((lote) => {
        if (lote.lote_id === loteId) {
          return {
            ...lote,
            pd_detalles: lote.pd_detalles.map((detalle) => ({
              ...detalle,
              seleccionada: checked,
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

  const handlePesoChange = (loteId: number, categoriaId: number, value: string) => {
    setLotes((prevLotes) =>
      prevLotes.map((lote) => {
        if (lote.lote_id === loteId) {
          return {
            ...lote,
            pd_detalles: lote.pd_detalles.map((detalle) => {
              if (detalle.categoria_animal_id === categoriaId) {
                const peso = value === "" ? 0 : Number.parseInt(value, 10)
                return {
                  ...detalle,
                  peso_nuevo: isNaN(peso) ? 0 : Math.max(0, peso),
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

  const handleTipoPesoChange = (loteId: number, categoriaId: number, tipo: "PROMEDIO" | "TOTAL") => {
    setLotes((prevLotes) =>
      prevLotes.map((lote) => {
        if (lote.lote_id === loteId) {
          return {
            ...lote,
            pd_detalles: lote.pd_detalles.map((detalle) => {
              if (detalle.categoria_animal_id === categoriaId) {
                return {
                  ...detalle,
                  tipo_peso_nuevo: tipo,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const categoriasSeleccionadas = lotes.flatMap((lote) =>
        lote.pd_detalles
          .filter((detalle) => detalle.seleccionada)
          .map((detalle) => ({
            ...detalle,
            lote_id: lote.lote_id,
          })),
      )

      if (categoriasSeleccionadas.length === 0) {
        toast({
          title: "Error",
          description: "Debe seleccionar al menos una categoría para pesar",
          variant: "destructive",
        })
        return
      }

      const categoriasSinPeso = categoriasSeleccionadas.filter((detalle) => detalle.peso_nuevo <= 0)

      if (categoriasSinPeso.length > 0) {
        toast({
          title: "Error",
          description: "Todas las categorías seleccionadas deben tener un peso mayor a 0",
          variant: "destructive",
        })
        return
      }

      if (tipoActividadId && usuario?.id) {
        const pesajesParaActividad = categoriasSeleccionadas.map((detalle) => ({
          categoria_animal_id: detalle.categoria_animal_id,
          cantidad: detalle.cantidad,
          peso: detalle.peso_nuevo,
          tipo_peso: detalle.tipo_peso_nuevo,
          peso_anterior: detalle.tipo_peso_nuevo === "PROMEDIO" ? detalle.peso_promedio : detalle.peso_total,
          tipo_peso_anterior: detalle.tipo_peso_nuevo,
          lote_id: detalle.lote_id,
        }))

        const actividadResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/guardar-pesaje-actividad`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            establecimiento_id: establecimientoSeleccionado,
            tipo_actividad_id: tipoActividadId,
            fecha: fecha.toISOString().split("T")[0],
            hora: hora,
            nota: nota.trim() || null,
            user_id: usuario.id,
            pesajes: pesajesParaActividad,
          }),
        })

        if (!actividadResponse.ok) {
          const errorData = await actividadResponse.json()
          throw new Error(errorData?.error || "Error al guardar el pesaje")
        }

        console.log("Pesaje guardado exitosamente")
        window.dispatchEvent(new Event("reloadPartesDiarios"))
      }

      toast({
        title: "✅ Pesaje Completado",
        description: "El pesaje ha sido registrado exitosamente",
        duration: 4000,
      })

      handleClose()
      onSuccess()
    } catch (error) {
      console.error("Error processing pesaje:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al procesar el pesaje",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLoteFilterChange = (loteId: string) => {
    setLotesSeleccionados((prev) => {
      if (prev.includes(loteId)) {
        return prev.filter((id) => id !== loteId)
      } else {
        return [...prev, loteId]
      }
    })
  }

  const opcionesLote = lotes
    .sort((a, b) => a.lote_id - b.lote_id)
    .map((lote) => ({
      value: lote.lote_id.toString(),
      label: lote.lote_nombre,
    }))

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
      rows.push(
        <TableRow key={`header-${lote.lote_id}`} className="bg-blue-50 border-t-2 border-blue-200">
          <TableCell colSpan={5} className="py-2">
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

      lote.pd_detalles.forEach((detalle) => {
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
              <div className="text-xs text-gray-500">Cantidad: {detalle.cantidad}</div>
            </TableCell>
            <TableCell className="py-2">
              <div className="text-sm">
                <div className="flex items-center gap-1">
                  <Info className="w-3 h-3 text-blue-500" />
                  <span className="text-gray-600">Total: {detalle.peso_total} kg</span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <Info className="w-3 h-3 text-blue-500" />
                  <span className="text-gray-600">Promedio: {Math.round(detalle.peso_promedio)} kg</span>
                </div>
              </div>
            </TableCell>
            <TableCell className="py-2">
              <Input
                type="number"
                min="0"
                value={detalle.peso_nuevo === 0 ? "" : detalle.peso_nuevo.toString()}
                onChange={(e) => {
                  handlePesoChange(lote.lote_id, detalle.categoria_animal_id, e.target.value)
                }}
                className="w-24 h-8 text-sm"
                disabled={!detalle.seleccionada}
                placeholder="0"
                onFocus={(e) => e.target.select()}
              />
            </TableCell>
            <TableCell className="py-2">
              <CustomCombobox
                options={[
                  { value: "PROMEDIO", label: "Promedio" },
                  { value: "TOTAL", label: "Total" },
                ]}
                value={detalle.tipo_peso_nuevo}
                onValueChange={(value) =>
                  handleTipoPesoChange(lote.lote_id, detalle.categoria_animal_id, value as "PROMEDIO" | "TOTAL")
                }
                placeholder="Tipo..."
                searchPlaceholder="Buscar tipo..."
                emptyMessage="No hay opciones."
                disabled={!detalle.seleccionada}
              />
            </TableCell>
          </TableRow>,
        )
      })
    })

    return rows
  }

  const handleClose = () => {
    onClose()
    setFecha(new Date())
    setHora(new Date().toTimeString().slice(0, 5))
    setNota("")
    setLotes([])
    setSearchCategoria("")
    setLotesSeleccionados([])
    setFiltroLoteAbierto(false)
    setSearchLote("")
  }

  return (
    <Drawer open={isOpen} onOpenChange={onClose} direction="right">
      <DrawerContent className="h-full w-[900px] ml-auto">
        <DrawerHeader className="flex items-center justify-between border-b pb-4">
          <DrawerTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Scale className="w-6 h-6 text-purple-600" />
            Pesaje
          </DrawerTitle>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-3">Datos Generales</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Tipo</Label>
                    <div className="mt-1 px-3 py-2 bg-gray-50 border rounded-md text-sm font-medium text-gray-900">
                      Pesaje
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">Usuario</Label>
                    <div className="mt-1 px-3 py-2 bg-gray-50 border rounded-md text-sm text-gray-900">
                      {nombreCompleto}
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="tipo-actividad">Tipo de Actividad *</Label>
                  <Input value="Pesaje" disabled className="bg-gray-50" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Fecha *</Label>
                    <CustomDatePicker date={fecha} onDateChange={setFecha} placeholder="Seleccionar fecha" />
                  </div>
                  <div>
                    <Label>Hora *</Label>
                    <CustomTimePicker time={hora} onTimeChange={setHora} placeholder="Seleccionar hora" />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Filtros</h4>
              <div className="grid grid-cols-2 gap-4">
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
              <h3 className="text-lg font-semibold mb-3">Animales a Pesar *</h3>
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
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="w-12 py-2"></TableHead>
                        <TableHead className="py-2">Categoría</TableHead>
                        <TableHead className="py-2">Peso Actual</TableHead>
                        <TableHead className="py-2">Peso Nuevo (kg)</TableHead>
                        <TableHead className="py-2">Tipo de Peso</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>{createTableRows()}</TableBody>
                  </Table>
                </div>
              )}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-600" />
                Información sobre el pesaje
              </h4>
              <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                <li>Se pesa la totalidad del stock de cada categoría seleccionada</li>
                <li>
                  <strong>Promedio:</strong> El peso ingresado representa el peso promedio por animal
                </li>
                <li>
                  <strong>Total:</strong> El peso ingresado representa el peso total de todos los animales
                </li>
                <li>El sistema guardará el peso anterior para mantener el historial</li>
              </ul>
            </div>

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

        <div className="border-t p-4 flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-purple-600 hover:bg-purple-700">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Guardar Pesaje
              </>
            )}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
