"use client"

import type React from "react"
import type { JSX } from "react"
import { useState, useEffect, useRef } from "react"
import { X, Calendar, Save, Loader2, Search, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { CustomDatePicker } from "@/components/ui/custom-date-picker"
import { CustomCombobox } from "@/components/ui/custom-combobox" // Import CustomCombobox
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
    cantidad_destetar: number
    seleccionada: boolean
    meses_destete: number
    categoria_destino_id?: number
  }>
}

interface CategoriaAnimal {
  id: number
  nombre: string
  sexo: string
  edad: string
  empresa_id: number
  categoria_animal_estandar_id?: number
}

interface DesteteDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  tipoActividadId?: number
}

export default function DesteteDrawer({ isOpen, onClose, onSuccess, tipoActividadId }: DesteteDrawerProps) {
  const [loading, setLoading] = useState(false)
  const [lotes, setLotes] = useState<LoteStock[]>([])
  const [categoriasDestino, setCategoriasDestino] = useState<CategoriaAnimal[]>([])
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
      loadCategoriasDestino()
    }
  }, [isOpen, establecimientoSeleccionado, empresaSeleccionada])

  // Limpiar formulario al abrir
  useEffect(() => {
    if (isOpen) {
      setFecha(new Date())
      setHora(new Date().toTimeString().slice(0, 5))
      setNota("")
      setLotes([])
      setCategoriasDestino([])
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

      const lotesConTerneros = lotesData
        .map((lote) => ({
          ...lote,
          pd_detalles: lote.pd_detalles
            .filter((detalle) => detalle.categoria_animal_id === 21 || detalle.categoria_animal_id === 22)
            .sort((a, b) => a.categoria_animal_id - b.categoria_animal_id)
            .map((detalle) => ({
              ...detalle,
              cantidad_destetar: 0,
              seleccionada: false,
              meses_destete: 1,
              categoria_destino_id: undefined,
              peso_promedio: 0,
            })),
        }))
        .filter((lote) => lote.pd_detalles.length > 0) // Solo lotes que tengan terneros

      setLotes(lotesConTerneros.sort((a, b) => a.lote_id - b.lote_id))
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

  const loadCategoriasDestino = async () => {
    if (!empresaSeleccionada) {
      console.error("No hay empresa seleccionada")
      return
    }

    try {
      const response = await fetch(
        `/api/categorias-destino?empresa_id=${empresaSeleccionada}&categoria_origen_ids=21,22`,
      )

      if (!response.ok) {
        throw new Error("Error al cargar categorías de destino")
      }

      const data = await response.json()

      const categorias = Array.isArray(data.categorias) ? data.categorias : Array.isArray(data) ? data : []
      setCategoriasDestino(categorias)
    } catch (error) {
      console.error("Error loading categorías destino:", error)
      setCategoriasDestino([])
      toast({
        title: "Error",
        description: "Error al cargar categorías de destino",
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
              cantidad_destetar: checked ? detalle.cantidad : 0,
            })),
          }
        }
        return lote
      }),
    )
  }

  const handleCategoriaSeleccionada = (loteId: number, categoriaId: number, seleccionada: boolean) => {
    setLotes((prevLotes) =>
      prevLotes.map((lote) => {
        if (lote.lote_id === loteId) {
          return {
            ...lote,
            pd_detalles: lote.pd_detalles.map((detalle) => {
              if (detalle.categoria_animal_id === categoriaId) {
                return {
                  ...detalle,
                  seleccionada,
                  categoria_destino_id: seleccionada ? detalle.categoria_destino_id : undefined,
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
                    cantidad_destetar: 0,
                  }
                }

                const cantidad = Number.parseInt(value, 10)
                if (isNaN(cantidad)) {
                  return detalle
                }

                const cantidadValida = Math.min(Math.max(0, cantidad), detalle.cantidad)
                return {
                  ...detalle,
                  cantidad_destetar: cantidadValida,
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

  const handleMesesDesteteChange = (loteId: number, categoriaId: number, meses: number) => {
    setLotes((prevLotes) =>
      prevLotes.map((lote) => {
        if (lote.lote_id === loteId) {
          return {
            ...lote,
            pd_detalles: lote.pd_detalles.map((detalle) => {
              if (detalle.categoria_animal_id === categoriaId) {
                return {
                  ...detalle,
                  meses_destete: meses,
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

  const handlePesoPromedioChange = (loteId: number, categoriaId: number, value: string) => {
    setLotes((prevLotes) =>
      prevLotes.map((lote) => {
        if (lote.lote_id === loteId) {
          return {
            ...lote,
            pd_detalles: lote.pd_detalles.map((detalle) => {
              if (detalle.categoria_animal_id === categoriaId) {
                const peso = value === "" ? 0 : Number.parseInt(value, 10)
                if (isNaN(peso)) {
                  return detalle
                }
                return {
                  ...detalle,
                  peso_promedio: Math.max(0, peso),
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

  const handleCategoriaDestinoChange = (loteId: number, categoriaId: number, destinoId: string) => {
    setLotes((prevLotes) =>
      prevLotes.map((lote) => {
        if (lote.lote_id === loteId) {
          return {
            ...lote,
            pd_detalles: lote.pd_detalles.map((det) => {
              if (det.categoria_animal_id === categoriaId) {
                return { ...det, categoria_destino_id: destinoId ? Number.parseInt(destinoId) : undefined }
              }
              return det
            }),
          }
        }
        return lote
      }),
    )
  }

  const getOpcionesMesesDestete = () => {
    return Array.from({ length: 10 }, (_, i) => ({
      value: (i + 1).toString(),
      label: `${i + 1} ${i + 1 === 1 ? "mes" : "meses"}`,
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

  const getResumenDestete = () => {
    const destetes: Array<{
      lote: string
      categoria: string
      cantidad: number
      meses: number
      categoriaDestino: string
    }> = []

    lotes.forEach((lote) => {
      lote.pd_detalles.forEach((detalle) => {
        if (detalle.seleccionada && detalle.cantidad_destetar > 0 && detalle.categoria_destino_id) {
          const categoriaDestino = categoriasDestino.find((c) => c.id === detalle.categoria_destino_id)
          if (categoriaDestino) {
            destetes.push({
              lote: lote.lote_nombre,
              categoria: detalle.categoria_animal_nombre,
              cantidad: detalle.cantidad_destetar,
              meses: detalle.meses_destete,
              categoriaDestino: categoriaDestino.nombre,
            })
          }
        }
      })
    })

    return destetes
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

  // Crear filas para la tabla unificada
  const createTableRows = () => {
    const rows: JSX.Element[] = []

    filteredLotes.forEach((lote) => {
      // Fila de header del lote
      rows.push(
        <TableRow key={`header-${lote.lote_id}`} className="bg-blue-50 border-t-2 border-blue-200">
          <TableCell colSpan={6} className="py-2">
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
        rows.push(
          <TableRow key={`${lote.lote_id}-${detalle.categoria_animal_id}`} className="hover:bg-gray-50">
            <TableCell className="py-2 pl-8">
              <Checkbox
                checked={detalle.seleccionada}
                onCheckedChange={(checked) =>
                  handleCategoriaSeleccionada(lote.lote_id, detalle.categoria_animal_id, checked as boolean)
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
                  value={detalle.cantidad_destetar === 0 ? "" : detalle.cantidad_destetar.toString()}
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
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  min="0"
                  value={detalle.peso_promedio === 0 ? "" : detalle.peso_promedio.toString()}
                  onChange={(e) => {
                    handlePesoPromedioChange(lote.lote_id, detalle.categoria_animal_id, e.target.value)
                  }}
                  className="w-16 h-8 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  disabled={!detalle.seleccionada}
                  placeholder="0"
                  onFocus={(e) => e.target.select()}
                />
                <span className="text-gray-500 text-sm">kg</span>
              </div>
            </TableCell>
            <TableCell className="py-2">
              <div className="flex items-center space-x-2">
                <CustomCombobox
                  options={getOpcionesMesesDestete()}
                  value={detalle.meses_destete.toString()}
                  onValueChange={(value) =>
                    handleMesesDesteteChange(lote.lote_id, detalle.categoria_animal_id, Number.parseInt(value))
                  }
                  placeholder="Seleccionar meses..."
                  searchPlaceholder="Buscar meses..."
                  emptyMessage="No hay opciones disponibles."
                  disabled={!detalle.seleccionada}
                  className="w-32"
                />
              </div>
            </TableCell>
            <TableCell className="p-2">
              <div className="w-48">
                <CustomCombobox
                  value={detalle.categoria_destino_id?.toString() || ""}
                  onValueChange={(value) => {
                    handleCategoriaDestinoChange(lote.lote_id, detalle.categoria_animal_id, value)
                  }}
                  options={getCategoriasDestinoFiltradas(detalle.categoria_animal_id)}
                  placeholder="Seleccionar destino"
                  searchPlaceholder="Buscar categoría..."
                  emptyMessage="No hay categorías disponibles."
                  disabled={!detalle.seleccionada}
                  className="w-56"
                />
              </div>
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
      const categoriasSeleccionadas = lotes.flatMap((lote) =>
        lote.pd_detalles
          .filter((detalle) => detalle.seleccionada)
          .map((detalle) => ({ ...detalle, lote_id: lote.lote_id })),
      )

      if (categoriasSeleccionadas.length === 0) {
        toast({
          title: "Error",
          description: "Debe seleccionar al menos una categoría para destetar",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      const categoriasConCantidadCero = categoriasSeleccionadas.filter(
        (detalle) => !detalle.cantidad_destetar || detalle.cantidad_destetar === 0,
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

      const categoriasSinDestino = categoriasSeleccionadas.filter((detalle) => !detalle.categoria_destino_id)

      if (categoriasSinDestino.length > 0) {
        toast({
          title: "Error",
          description: "Todas las categorías seleccionadas deben tener una categoría destino",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      const categoriasSinPeso = categoriasSeleccionadas.filter(
        (detalle) => !detalle.peso_promedio || detalle.peso_promedio <= 0,
      )

      if (categoriasSinPeso.length > 0) {
        toast({
          title: "Error",
          description: "El peso promedio es obligatorio y debe ser mayor a 0 para todas las categorías seleccionadas",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      // Validar datos generales obligatorios
      if (!establecimientoSeleccionado) {
        toast({
          title: "Error",
          description: "Debe seleccionar un establecimiento",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      if (!tipoActividadId) {
        toast({
          title: "Error",
          description: "Tipo de actividad es requerido",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      if (!usuario?.id) {
        toast({
          title: "Error",
          description: "Usuario no identificado",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      for (const lote of lotes) {
        for (const detalle of lote.pd_detalles) {
          if (detalle.seleccionada && detalle.cantidad_destetar > 0 && detalle.categoria_destino_id) {
            const reclasificarData = {
              p_lote_id: lote.lote_id,
              p_categoria_origen_id: detalle.categoria_animal_id,
              p_categoria_destino_id: detalle.categoria_destino_id,
              p_cantidad_a_mover: detalle.cantidad_destetar,
              p_peso_promedio_animal: detalle.peso_promedio,
            }

            if (!reclasificarData.p_lote_id) {
              throw new Error(`Lote ID faltante para el lote ${lote.lote_nombre}`)
            }
            if (!reclasificarData.p_categoria_origen_id) {
              throw new Error(`Categoría origen faltante para el lote ${lote.lote_nombre}`)
            }
            if (!reclasificarData.p_categoria_destino_id) {
              throw new Error(`Categoría destino faltante para el lote ${lote.lote_nombre}`)
            }
            if (!reclasificarData.p_cantidad_a_mover || reclasificarData.p_cantidad_a_mover <= 0) {
              throw new Error(`Cantidad a mover inválida para el lote ${lote.lote_nombre}`)
            }
            if (!reclasificarData.p_peso_promedio_animal || reclasificarData.p_peso_promedio_animal <= 0) {
              throw new Error(`Peso promedio es obligatorio y debe ser mayor a 0 para el lote ${lote.lote_nombre}`)
            }

            const response = await fetch("/api/reclasificar-lote-animales", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(reclasificarData),
            })

            if (!response.ok) {
              const errorData = await response.json()
              console.error("[v0] API Error:", errorData)
              throw new Error(errorData?.error || `Error en reclasificación del lote ${lote.lote_nombre}`)
            }

            const result = await response.json()
          }
        }
      }

      if (tipoActividadId && usuario?.id) {
        try {
          const destetesParaActividad = categoriasSeleccionadas.map((detalle) => {
            return {
              categoria_animal_id: detalle.categoria_destino_id,
              cantidad: detalle.cantidad_destetar,
              peso: detalle.peso_promedio,
              tipo_peso: "PROMEDIO",
              lote_id: detalle.lote_id,
              categoria_animal_id_anterior: detalle.categoria_animal_id,
              meses_destete: detalle.meses_destete.toString(),
            }
          })

          const actividadResponse = await fetch("/api/guardar-destete-actividad", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              establecimiento_id: establecimientoSeleccionado,
              tipo_actividad_id: tipoActividadId,
              fecha: fecha.toISOString().split("T")[0],
              hora: hora,
              nota: nota.trim() || null,
              user_id: usuario.id,
              destetes: destetesParaActividad,
            }),
          })

          if (!actividadResponse.ok) {
            const activityError = await actividadResponse.json()
            console.error("[v0] Activity save error:", activityError)
            console.error("Error saving activity record, but destete was successful")
          } else {
            window.dispatchEvent(new Event("reloadPartesDiarios"))
          }
        } catch (activityError) {
          console.error("[v0] Error saving activity record:", activityError)
        }
      }

      toast({
        title: "✅ Destete Completado",
        description: "El destete ha sido procesado exitosamente",
        duration: 4000,
      })

      handleClose()
      onSuccess()
    } catch (error) {
      console.error("[v0] Error processing destete:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al procesar el destete",
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
    setCategoriasDestino([])
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

  const getCategoriasDestinoFiltradas = (categoriaOrigenId: number) => {
    const targetId = categoriaOrigenId === 21 ? 19 : categoriaOrigenId === 22 ? 20 : null

    if (!targetId) return []

    const filtered = categoriasDestino
      .filter((cat) => cat.id === targetId || cat.categoria_animal_estandar_id === targetId)
      .sort((a, b) => a.id - b.id)
      .map((cat) => ({
        value: cat.id.toString(),
        label: cat.nombre,
      }))

    return filtered
  }

  return (
    <Drawer open={isOpen} onOpenChange={onClose} direction="right">
      <DrawerContent className="h-full w-[1000px] ml-auto">
        <DrawerHeader className="flex items-center justify-between border-b pb-4">
          <DrawerTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-green-600" />
            Destete - Marcación
          </DrawerTitle>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Datos Generales */}
          <div className="space-y-4">
            <div>
              <Label>Fecha *</Label>
              <CustomDatePicker date={fecha} onDateChange={setFecha} placeholder="Seleccionar fecha" />
            </div>

            {/* Filtros */}
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

            {/* Animales a Destetar - Tabla Unificada con Agrupación */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Animales a Destetar *</h3>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="ml-2">Cargando lotes...</span>
                </div>
              ) : filteredLotes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No se encontraron lotes con terneros para destetar</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="w-12 py-2"></TableHead>
                        <TableHead className="py-2">Categoría</TableHead>
                        <TableHead className="py-2">Animales a Destetar</TableHead>
                        <TableHead className="py-2">Peso Promedio</TableHead>
                        <TableHead className="py-2">Mes de Destete</TableHead>
                        <TableHead className="py-2">Categoría Animal Destino</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>{createTableRows()}</TableBody>
                  </Table>
                </div>
              )}
            </div>

            {/* Resumen del Destete */}
            {getResumenDestete().length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">🍼 Resumen del Destete</h4>
                <div className="space-y-1">
                  {getResumenDestete().map((destete, index) => (
                    <div key={index} className="text-sm text-gray-700">
                      <span className="font-medium">{destete.cantidad}</span> {destete.categoria} del lote{" "}
                      <span className="font-medium">"{destete.lote}"</span> → {destete.categoriaDestino} (
                      {destete.meses} {destete.meses === 1 ? "mes" : "meses"} de destete)
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
          <Button onClick={handleSubmit} disabled={loading} className="bg-green-600 hover:bg-green-700">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Guardar Destete
              </>
            )}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
