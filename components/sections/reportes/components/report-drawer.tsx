"use client"

import { useState } from "react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CustomDatePicker } from "@/components/ui/custom-date-picker"
import { Filter, CloudRain, Users, Package, BarChart3, Loader2, X } from "lucide-react"
import { useUser } from "@/contexts/user-context"
import type { ReportTemplate } from "@/lib/reportes/types"
import { useToast } from "@/hooks/use-toast"

interface ReportDrawerProps {
  isOpen: boolean
  onClose: () => void
  template: ReportTemplate | null
}

export function ReportDrawer({ isOpen, onClose, template }: ReportDrawerProps) {
  const [periodo, setPeriodo] = useState("ultimo-mes")
  const [fechaDesde, setFechaDesde] = useState<Date | undefined>(undefined)
  const [fechaHasta, setFechaHasta] = useState<Date | undefined>(undefined)
  const [isGenerating, setIsGenerating] = useState(false)
  const { usuario } = useUser()
  const { toast } = useToast()

  if (!template) return null

  const getReportIcon = (module: string) => {
    switch (module) {
      case "LLUVIA":
        return <CloudRain className="h-5 w-5" />
      case "MOVIMIENTOS":
        return <Users className="h-5 w-5" />
      case "INSUMOS":
        return <Package className="h-5 w-5" />
      case "EJECUTIVO":
        return <BarChart3 className="h-5 w-5" />
      default:
        return <BarChart3 className="h-5 w-5" />
    }
  }

  const getReportType = (module: string): string => {
    switch (module) {
      case "LLUVIA":
        return "clima"
      case "MOVIMIENTOS":
        return "movimientos"
      case "INSUMOS":
        return "insumos"
      case "EJECUTIVO":
        return "general"
      default:
        return module.toLowerCase()
    }
  }

  const handleGenerateReport = async () => {
    // Validaciones
    if (periodo === "personalizado") {
      if (!fechaDesde || !fechaHasta) {
        toast({
          title: "Error",
          description: "Por favor selecciona ambas fechas para el periodo personalizado",
          variant: "destructive",
        })
        return
      }
      if (fechaDesde > fechaHasta) {
        toast({
          title: "Error",
          description: "La fecha desde no puede ser mayor que la fecha hasta",
          variant: "destructive",
        })
        return
      }
    }

    // Validar que haya un establecimiento seleccionado
    const selectedEstablishmentData = localStorage.getItem("selected_establishment")
    if (!selectedEstablishmentData) {
      toast({
        title: "Error",
        description: "No hay un establecimiento seleccionado",
        variant: "destructive",
      })
      return
    }

    const establishment = JSON.parse(selectedEstablishmentData)

    // Validar que haya un usuario
    if (!usuario) {
      toast({
        title: "Error",
        description: "No se pudo obtener la información del usuario",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)

    try {
      const response = await fetch("/api/reportes/generar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          establecimiento_id: establishment.id,
          establecimiento_nombre: establishment.nombre,
          usuario_nombre: usuario.nombreCompleto || `${usuario.nombres} ${usuario.apellidos}`,
          tipo_reporte: getReportType(template.module),
          periodo,
          fecha_desde: fechaDesde?.toISOString(),
          fecha_hasta: fechaHasta?.toISOString(),
        }),
      })

      const contentType = response.headers.get("content-type")

      if (contentType?.includes("application/pdf")) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `reporte_${getReportType(template.module)}_${new Date().toISOString().split("T")[0]}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast({
          title: "Reporte generado",
          description: `El reporte ${template.name} se ha descargado exitosamente`,
        })
        onClose()
      } else {
        const result = await response.json()
        toast({
          title: "Error al generar reporte",
          description: result.error || "Ocurrió un error al generar el reporte",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Error al generar reporte:", error)
      toast({
        title: "Error",
        description: "No se pudo conectar con el servidor de reportes",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Drawer open={isOpen} onOpenChange={onClose} direction="right">
      <DrawerContent className="ml-auto">
        <DrawerHeader className="flex items-center justify-between border-b pb-4">
          <DrawerTitle className="text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2">
            {getReportIcon(template.module)}
            {template.name}
          </DrawerTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Cerrar</span>
          </Button>
        </DrawerHeader>

        <div className="p-4 md:p-6 space-y-4 md:space-y-6">
          {/* Descripción del reporte */}
          <div>
            <p className="text-sm text-gray-600">{template.description}</p>
          </div>

          {/* Sección de Filtros */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-700" />
              <h3 className="text-sm md:text-base font-semibold text-gray-900">Filtros</h3>
            </div>

            {/* Selector de Periodo */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Periodo</label>
              <Select value={periodo} onValueChange={setPeriodo}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar periodo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ultima-semana">Última semana</SelectItem>
                  <SelectItem value="ultimo-mes">Último mes</SelectItem>
                  <SelectItem value="ultimos-3-meses">Últimos 3 meses</SelectItem>
                  <SelectItem value="ultimos-6-meses">Últimos 6 meses</SelectItem>
                  <SelectItem value="ultimo-ano">Último año</SelectItem>
                  <SelectItem value="ano-actual">Año actual</SelectItem>
                  <SelectItem value="personalizado">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {periodo === "personalizado" && (
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Fecha desde</label>
                  <CustomDatePicker
                    date={fechaDesde}
                    onDateChange={setFechaDesde}
                    placeholder="Seleccionar fecha desde"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Fecha hasta</label>
                  <CustomDatePicker
                    date={fechaHasta}
                    onDateChange={setFechaHasta}
                    placeholder="Seleccionar fecha hasta"
                  />
                </div>
              </div>
            )}

            {/* Aquí se pueden agregar más filtros según el tipo de reporte */}
          </div>

          <Button
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="w-full bg-black hover:bg-gray-800 text-white h-12"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generando...
              </>
            ) : (
              "Generar Reporte"
            )}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
