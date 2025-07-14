"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Edit, Plus, Loader2, HelpCircle, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useEstablishment } from "@/contexts/establishment-context"
import { CategoriaAnimalDrawer } from "../components/categoria-animal-drawer"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { usePermissions } from "@/hooks/use-permissions"

interface CategoriaAnimal {
  id: number
  nombre: string
  sexo: "HEMBRA" | "MACHO"
  edad: "JOVEN" | "ADULTO"
  empresa_id: number
}

export function CategoriaAnimales() {
  const { toast } = useToast()
  const { empresaSeleccionada } = useEstablishment()
  const permissions = usePermissions()

  const [categorias, setCategorias] = useState<CategoriaAnimal[]>([])
  const [categoriasPredeterminadas, setCategoriasPredeterminadas] = useState<CategoriaAnimal[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingPredeterminadas, setLoadingPredeterminadas] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create")
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<CategoriaAnimal | null>(null)
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null)

  // Cargar categorías cuando cambia la empresa
  useEffect(() => {
    if (empresaSeleccionada) {
      loadCategorias()
      loadCategoriasPredeterminadas()
    }
  }, [empresaSeleccionada])

  const loadCategorias = async () => {
    if (!empresaSeleccionada) return

    try {
      setLoading(true)
      const response = await fetch(`/api/categorias-animales-crud?empresa_id=${empresaSeleccionada}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al cargar categorías")
      }

      setCategorias(data.categorias || [])
    } catch (error) {
      console.error("Error loading categorias:", error)
      toast({
        title: "Error",
        description: "Error al cargar las categorías de animales",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadCategoriasPredeterminadas = async () => {
    try {
      setLoadingPredeterminadas(true)
      // Cargar categorías predeterminadas (empresa_id=1)
      const response = await fetch(`/api/categorias-animales-crud?empresa_id=1`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al cargar categorías predeterminadas")
      }

      setCategoriasPredeterminadas(data.categorias || [])
    } catch (error) {
      console.error("Error loading categorias predeterminadas:", error)
      toast({
        title: "Error",
        description: "Error al cargar las categorías predeterminadas",
        variant: "destructive",
      })
    } finally {
      setLoadingPredeterminadas(false)
    }
  }

  const handleNuevaCategoria = () => {
    setCategoriaSeleccionada(null)
    setDrawerMode("create")
    setDrawerOpen(true)
  }

  const handleEditarCategoria = (categoria: CategoriaAnimal) => {
    setCategoriaSeleccionada(categoria)
    setDrawerMode("edit")
    setDrawerOpen(true)
  }

  const handleDrawerSuccess = () => {
    loadCategorias()
  }

  const formatSexo = (sexo: string) => {
    return sexo === "HEMBRA" ? "Hembra" : "Macho"
  }

  const formatEdad = (edad: string) => {
    return edad === "JOVEN" ? "Joven" : "Adulto"
  }

  const handleTooltipToggle = (tooltipId: string, event: React.MouseEvent) => {
    if (activeTooltip === tooltipId) {
      setActiveTooltip(null)
      setTooltipPosition(null)
    } else {
      const rect = event.currentTarget.getBoundingClientRect()
      setTooltipPosition({
        x: rect.left,
        y: rect.top - 10,
      })
      setActiveTooltip(tooltipId)
    }
  }

  if (!empresaSeleccionada) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <p className="text-gray-500">Selecciona una empresa para ver las categorías de animales</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Categorías de Animales</h3>
          <p className="text-sm text-slate-600">Gestiona las categorías para agrupar indicadores productivos y stock</p>
        </div>
        {/* Solo mostrar botón Nueva Categoría si NO es consultor */}
        {!permissions.isConsultor && (
          <Button onClick={handleNuevaCategoria} className="bg-green-700 hover:bg-green-800">
            <Plus className="w-4 h-4 mr-2" />
            Nueva Categoría
          </Button>
        )}
      </div>

      {/* Categorías Predeterminadas en Accordion - ARRIBA */}
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="categorias-predeterminadas">
          <Card>
            <CardHeader className="p-0">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <CardTitle>Categorías Predeterminadas</CardTitle>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full p-1 transition-colors relative"
                    aria-label="Información sobre Categorías Predeterminadas"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleTooltipToggle("categorias-predeterminadas", e)
                    }}
                  >
                    <HelpCircle className="h-4 w-4" />
                  </button>
                </div>
              </AccordionTrigger>
            </CardHeader>
            <AccordionContent>
              <CardContent>
                {loadingPredeterminadas ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    <span>Cargando categorías predeterminadas...</span>
                  </div>
                ) : categoriasPredeterminadas.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No hay categorías predeterminadas disponibles</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Sexo</TableHead>
                        <TableHead>Edad</TableHead>
                        <TableHead className="w-20"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categoriasPredeterminadas.map((categoria) => (
                        <TableRow key={categoria.id}>
                          <TableCell className="font-medium">{categoria.nombre}</TableCell>
                          <TableCell>{formatSexo(categoria.sexo)}</TableCell>
                          <TableCell>{formatEdad(categoria.edad)}</TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </AccordionContent>
          </Card>
        </AccordionItem>
      </Accordion>

      {/* Categorías Registradas - ABAJO */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Categorías Registradas</CardTitle>
            <button
              type="button"
              className="text-gray-400 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full p-1 transition-colors relative"
              aria-label="Información sobre Categorías Registradas"
              onClick={(e) => handleTooltipToggle("categorias-registradas", e)}
            >
              <HelpCircle className="h-4 w-4" />
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Cargando categorías...</span>
            </div>
          ) : categorias.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No hay categorías registradas para esta empresa</p>
              {/* Solo mostrar botón si NO es consultor */}
              {!permissions.isConsultor && (
                <Button onClick={handleNuevaCategoria} className="bg-green-700 hover:bg-green-800">
                  <Plus className="w-4 h-4 mr-2" />
                  Crear primera categoría
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Sexo</TableHead>
                  <TableHead>Edad</TableHead>
                  <TableHead className="w-20">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categorias.map((categoria) => (
                  <TableRow key={categoria.id}>
                    <TableCell className="font-medium">{categoria.nombre}</TableCell>
                    <TableCell>{formatSexo(categoria.sexo)}</TableCell>
                    <TableCell>{formatEdad(categoria.edad)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {/* Solo mostrar botón editar si NO es consultor */}
                        {!permissions.isConsultor && (
                          <Button size="sm" variant="ghost" onClick={() => handleEditarCategoria(categoria)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Drawer para crear/editar categoría */}
      <CategoriaAnimalDrawer
        categoria={categoriaSeleccionada}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSuccess={handleDrawerSuccess}
        mode={drawerMode}
        empresaId={empresaSeleccionada}
      />

      {/* Tooltips manuales */}
      {activeTooltip === "categorias-predeterminadas" && tooltipPosition && (
        <div
          className="fixed w-96 bg-white border border-gray-200 rounded-lg shadow-xl p-5 z-[9999]"
          style={{
            left: Math.max(10, Math.min(tooltipPosition.x - 200, window.innerWidth - 400)),
            top: Math.max(10, tooltipPosition.y - 200),
          }}
        >
          <div className="flex justify-between items-start mb-3">
            <h4 className="font-bold text-base text-gray-900 pr-2">Categorías estándar del sistema</h4>
            <button
              onClick={() => setActiveTooltip(null)}
              className="text-gray-400 hover:text-gray-600 p-1 flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-gray-700 leading-relaxed">
              Estas son las categorías predefinidas en el sistema que puedes usar como referencia. Incluyen las
              clasificaciones más comunes en ganadería según sexo y edad de los animales.
            </p>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r">
              <p className="text-sm text-blue-800 font-medium mb-1">Categorías estándar:</p>
              <p className="text-sm text-blue-700 leading-relaxed">
                Estas categorías están basadas en las clasificaciones tradicionales de la ganadería y pueden servir como
                guía para crear tus propias categorías personalizadas.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTooltip === "categorias-registradas" && tooltipPosition && (
        <div
          className="fixed w-96 bg-white border border-gray-200 rounded-lg shadow-xl p-5 z-[9999]"
          style={{
            left: Math.max(10, Math.min(tooltipPosition.x - 200, window.innerWidth - 400)),
            top: Math.max(10, tooltipPosition.y - 200),
          }}
        >
          <div className="flex justify-between items-start mb-3">
            <h4 className="font-bold text-base text-gray-900 pr-2">Categorías personalizadas de tu empresa</h4>
            <button
              onClick={() => setActiveTooltip(null)}
              className="text-gray-400 hover:text-gray-600 p-1 flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-gray-700 leading-relaxed">
              Aquí se muestran las categorías de animales específicas de tu empresa. Estas categorías se utilizan para
              clasificar el ganado en movimientos, reportes y análisis de productividad.
            </p>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r">
              <p className="text-sm text-blue-800 font-medium mb-1">Uso en el sistema:</p>
              <p className="text-sm text-blue-700 leading-relaxed">
                Las categorías permiten agrupar animales por características similares, facilitando el análisis de
                indicadores productivos y la generación de reportes específicos por tipo de animal.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Overlay para cerrar tooltip al hacer clic fuera */}
      {activeTooltip && <div className="fixed inset-0 z-40" onClick={() => setActiveTooltip(null)} />}
    </div>
  )
}
