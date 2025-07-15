"use client"

import { useState, useEffect } from "react"
import { CalendarDays, Clock, MapPin, Download, Search, Plus, TrendingUp, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { useEstablishment } from "@/contexts/establishment-context"

// Interfaces para los datos de la API
interface Actividad {
  actividad_id: number
  fecha: string
  fecha_formateada: string
  hora: string
  insumo_id?: number
  insumo_nombre?: string
  insumo_cantidad?: number
  categoria_animal_id?: number
  categoria_animal?: string
  animal_cantidad?: number
  peso_total_animales?: number
  peso_promedio_animales?: number
  tipo_actividad_id: number
  tipo_actividad_ubicacion: string
  tipo_actividad_ubicacion_formateada: string
  tipo_actividad_nombre: string
  empresa_id: number
  empresa: string
  establecimiento_id: number
  establecimiento: string
  usuario_id: string
  usuario: string
}

// Datos de ejemplo para KPIs (mantenemos los estáticos por ahora)
const kpiData = [
  {
    title: "Total Actividades Registradas",
    value: "24",
    icon: CalendarDays,
    description: "en el período",
    trend: "+8 vs período anterior",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    clickable: true,
  },
  {
    title: "Pendientes",
    value: "3",
    icon: Clock,
    description: "requieren atención",
    trend: "-2 vs ayer",
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    clickable: true,
  },
  {
    title: "Lugar Más Trabajado",
    value: "Potrero 3",
    icon: MapPin,
    description: "8 actividades",
    trend: "Líder del período",
    color: "text-green-600",
    bgColor: "bg-green-50",
    clickable: true,
  },
]

const actividadesPorTipo = [
  { tipo: "Sanidad", cantidad: 8, color: "bg-purple-500" },
  { tipo: "Riego", cantidad: 6, color: "bg-cyan-500" },
  { tipo: "Mantenimiento", cantidad: 4, color: "bg-orange-500" },
  { tipo: "Siembra", cantidad: 3, color: "bg-green-500" },
  { tipo: "Cosecha", cantidad: 3, color: "bg-amber-500" },
]

const getIconoActividad = (nombre: string) => {
  const iconos: { [key: string]: string } = {
    Vacunación: "💉",
    Riego: "💧",
    Mantenimiento: "🔧",
    Siembra: "🌱",
    Cosecha: "🌾",
    Sanidad: "💉",
    Alimentación: "🌾",
    Limpieza: "🧹",
    Reparación: "🔧",
    Pesaje: "⚖️",
    Recepción: "📦",
    Reclasificación: "🔄",
  }

  // Buscar por palabras clave en el nombre
  for (const [key, icon] of Object.entries(iconos)) {
    if (nombre.toLowerCase().includes(key.toLowerCase())) {
      return icon
    }
  }

  return "📋" // Icono por defecto
}

export default function ActividadesView() {
  const [actividades, setActividades] = useState<Actividad[]>([])
  const [loading, setLoading] = useState(true)
  const [ubicacionFiltro, setUbicacionFiltro] = useState<string>("todos")
  const [empleadoFiltro, setEmpleadoFiltro] = useState<string>("todos")
  const [busqueda, setBusqueda] = useState<string>("")
  const [rangoTiempo, setRangoTiempo] = useState<string>("semana")
  const [actividadSeleccionada, setActividadSeleccionada] = useState<Actividad | null>(null)
  const [vistaDetalle, setVistaDetalle] = useState(false)
  const [exportando, setExportando] = useState(false)
  const [establecimientoSeleccionado, setEstablecimientoSeleccionado] = useState<string>("")
  const { toast } = useToast()
  const { establecimientoSeleccionado: contextEstablecimiento } = useEstablishment()

  // Obtener ubicaciones únicas para el filtro (formateadas)
  const ubicacionesUnicas = Array.from(
    new Set(actividades.map((act) => act.tipo_actividad_ubicacion_formateada).filter(Boolean)),
  )

  // Obtener empleados únicos para el filtro
  const empleadosUnicos = Array.from(new Set(actividades.map((act) => act.usuario).filter(Boolean)))

  // Función para obtener el establecimiento seleccionado
  const obtenerEstablecimientoSeleccionado = () => {
    // Primero intentar desde el contexto
    if (contextEstablecimiento) {
      return contextEstablecimiento
    }

    // Si no, intentar desde localStorage
    try {
      const selectedEstablishment = localStorage.getItem("selected_establishment")
      if (selectedEstablishment) {
        const parsed = JSON.parse(selectedEstablishment)
        return parsed.id
      }
    } catch (error) {
      console.error("Error parsing selected establishment from localStorage:", error)
    }

    return null
  }

  // Función para cargar actividades desde la API
  const cargarActividades = async () => {
    try {
      setLoading(true)

      const establecimientoId = obtenerEstablecimientoSeleccionado()

      if (!establecimientoId) {
        console.log("No hay establecimiento seleccionado")
        setActividades([])
        return
      }

      const params = new URLSearchParams()
      params.append("establecimiento_id", establecimientoId.toString())

      if (ubicacionFiltro && ubicacionFiltro !== "todos") {
        // Convertir de vuelta a mayúsculas para la consulta
        params.append("ubicacion", ubicacionFiltro.toUpperCase())
      }
      if (empleadoFiltro && empleadoFiltro !== "todos") {
        params.append("empleado", empleadoFiltro)
      }
      if (busqueda.trim()) {
        params.append("busqueda", busqueda.trim())
      }

      console.log("Cargando actividades con establecimiento:", establecimientoId)
      const response = await fetch(`/api/actividades?${params.toString()}`)

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success) {
        setActividades(data.actividades || [])
        console.log("Actividades cargadas:", data.actividades?.length || 0)
      } else {
        throw new Error(data.error || "Error desconocido")
      }
    } catch (error) {
      console.error("Error cargando actividades:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las actividades. Por favor, intenta de nuevo.",
        variant: "destructive",
      })
      setActividades([])
    } finally {
      setLoading(false)
    }
  }

  // Escuchar cambios en el establecimiento seleccionado
  useEffect(() => {
    const handleEstablishmentChange = () => {
      const establecimientoId = obtenerEstablecimientoSeleccionado()
      setEstablecimientoSeleccionado(establecimientoId || "")
      cargarActividades()
    }

    // Cargar inicialmente
    handleEstablishmentChange()

    // Escuchar eventos de cambio de establecimiento
    window.addEventListener("establishmentChange", handleEstablishmentChange)

    return () => {
      window.removeEventListener("establishmentChange", handleEstablishmentChange)
    }
  }, [])

  // Cargar actividades cuando cambien los filtros
  useEffect(() => {
    if (establecimientoSeleccionado) {
      cargarActividades()
    }
  }, [ubicacionFiltro, empleadoFiltro, busqueda])

  // Función para descargar archivo Excel manualmente (igual que movimientos recientes)
  const downloadExcelFile = (data: any[], filename: string) => {
    // Crear CSV como alternativa más simple
    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header]
            // Escapar comillas y envolver en comillas si contiene comas
            if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`
            }
            return value
          })
          .join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", filename.replace(".xlsx", ".csv"))
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Función de exportación exactamente igual que movimientos recientes
  const handleExport = async (format: "pdf" | "xlsx") => {
    try {
      setExportando(true)

      toast({
        title: "Generando archivo",
        description: `Preparando archivo ${format.toUpperCase()}...`,
      })

      // Obtener nombre del establecimiento
      let establecimientoNombre = "Establecimiento"
      try {
        const selectedEstablishment = localStorage.getItem("selected_establishment")
        if (selectedEstablishment) {
          const parsed = JSON.parse(selectedEstablishment)
          establecimientoNombre = parsed.nombre || "Establecimiento"
        }
      } catch (error) {
        console.error("Error getting establishment name:", error)
      }

      const filters = {
        establecimiento: establecimientoNombre,
        ubicacion: ubicacionFiltro !== "todos" ? ubicacionFiltro : "Todas",
        empleado: empleadoFiltro !== "todos" ? empleadoFiltro : "Todos",
        busqueda: busqueda.trim() || "Sin filtro",
      }

      // Datos para exportar
      const dataToExport = actividades.map((act) => ({
        Fecha: act.fecha_formateada,
        Actividad: act.tipo_actividad_nombre,
        Empleado: act.usuario,
        Ubicación: act.tipo_actividad_ubicacion_formateada,
        Insumo: act.insumo_nombre || "",
        "Cantidad Insumo": act.insumo_cantidad || "",
        Animal: act.categoria_animal || "",
        "Cantidad Animal": act.animal_cantidad || "",
      }))

      if (format === "pdf") {
        // Importar jsPDF dinámicamente
        const { jsPDF } = await import("jspdf")
        const autoTable = (await import("jspdf-autotable")).default

        const doc = new jsPDF()
        const pageWidth = doc.internal.pageSize.width
        const pageHeight = doc.internal.pageSize.height

        // Color principal verde oliva
        const primaryColor = [140, 156, 120] // #8C9C78

        // Cargar y agregar logo
        try {
          const logoImg = new Image()
          logoImg.crossOrigin = "anonymous"
          logoImg.src = "/logo-parte-diario.png"

          await new Promise((resolve, reject) => {
            logoImg.onload = resolve
            logoImg.onerror = () => {
              console.log("Logo no encontrado, continuando sin logo")
              resolve(null)
            }
            setTimeout(reject, 3000) // Timeout después de 3 segundos
          })

          // Agregar logo en la esquina superior derecha
          doc.addImage(logoImg, "PNG", pageWidth - 40, 10, 30, 30)
        } catch (logoError) {
          console.log("No se pudo cargar el logo:", logoError)
        }

        // Encabezado principal con color verde oliva
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
        doc.rect(0, 0, pageWidth, 50, "F")

        // Título principal en blanco
        doc.setTextColor(255, 255, 255)
        doc.setFont("helvetica", "bold")
        doc.setFontSize(24)
        doc.text("REPORTE DE ACTIVIDADES", 20, 25)

        doc.setFontSize(16)
        doc.text("Actividades del Personal", 20, 35)

        // Línea decorativa
        doc.setDrawColor(200, 200, 200)
        doc.setLineWidth(0.5)
        doc.line(20, 55, pageWidth - 20, 55)

        // Información del establecimiento con estilo
        doc.setTextColor(60, 60, 60)
        doc.setFont("helvetica", "normal")
        doc.setFontSize(12)

        const fechaGeneracion = new Date().toLocaleDateString("es-ES", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })

        // Caja de información
        doc.setFillColor(248, 249, 250)
        doc.rect(20, 65, pageWidth - 40, 45, "F")
        doc.setDrawColor(220, 220, 220)
        doc.rect(20, 65, pageWidth - 40, 45, "S")

        // Establecimiento
        doc.setFont("helvetica", "bold")
        doc.text("Establecimiento:", 25, 75)
        doc.setFont("helvetica", "normal")
        doc.text(establecimientoNombre, 25, 85)

        // Fecha de generación
        doc.setFont("helvetica", "bold")
        doc.text("Fecha de generación:", 25, 95)
        doc.setFont("helvetica", "normal")
        doc.text(fechaGeneracion, 25, 105)

        // Filtros aplicados con estilo
        let yPosition = 120
        if (ubicacionFiltro !== "todos" || empleadoFiltro !== "todos" || busqueda) {
          doc.setFillColor(233, 246, 255)
          doc.rect(20, yPosition, pageWidth - 40, 30, "F")
          doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2])
          doc.rect(20, yPosition, pageWidth - 40, 30, "S")

          doc.setFont("helvetica", "bold")
          doc.setFontSize(11)
          doc.text("Filtros aplicados:", 25, yPosition + 10)

          doc.setFont("helvetica", "normal")
          doc.setFontSize(10)
          let filterY = yPosition + 18
          if (ubicacionFiltro !== "todos") {
            doc.text(`• Ubicación: ${ubicacionFiltro}`, 25, filterY)
            filterY += 8
          }
          if (empleadoFiltro !== "todos") {
            doc.text(`• Empleado: ${empleadoFiltro}`, 25, filterY)
            filterY += 8
          }
          if (busqueda) {
            doc.text(`• Búsqueda: ${busqueda}`, 25, filterY)
          }
          yPosition += 40
        }

        // Preparar datos para la tabla
        const tableData = dataToExport.map((item) => [
          item.Fecha,
          item.Actividad,
          item.Empleado,
          item.Ubicación,
          item.Insumo,
          item["Cantidad Insumo"].toString(),
          item.Animal,
          item["Cantidad Animal"].toString(),
        ])

        // Crear tabla profesional
        autoTable(doc, {
          head: [["Fecha", "Actividad", "Empleado", "Ubicación", "Insumo", "Cant.", "Animal", "Cant."]],
          body: tableData,
          startY: yPosition + 10,
          styles: {
            fontSize: 8,
            cellPadding: 3,
            lineColor: [220, 220, 220],
            lineWidth: 0.1,
            halign: "center",
            valign: "middle",
          },
          headStyles: {
            fillColor: primaryColor,
            textColor: [255, 255, 255],
            fontStyle: "bold",
            fontSize: 9,
            cellPadding: 4,
            halign: "center",
          },
          alternateRowStyles: {
            fillColor: [248, 249, 250],
          },
          columnStyles: {
            0: { cellWidth: 22, halign: "center" }, // Fecha
            1: { cellWidth: 30, halign: "center" }, // Actividad
            2: { cellWidth: 25, halign: "center" }, // Empleado
            3: { cellWidth: 20, halign: "center" }, // Ubicación
            4: { cellWidth: 20, halign: "center" }, // Insumo
            5: { cellWidth: 15, halign: "center" }, // Cant. Insumo
            6: { cellWidth: 20, halign: "center" }, // Animal
            7: { cellWidth: 15, halign: "center" }, // Cant. Animal
          },
          margin: { left: 15, right: 15 },
          tableWidth: "auto",
          didDrawPage: (data) => {
            // Pie de página profesional
            const pageNumber = doc.internal.getCurrentPageInfo().pageNumber
            const totalPages = doc.internal.getNumberOfPages()

            doc.setFontSize(8)
            doc.setTextColor(128, 128, 128)
            doc.text(`Página ${pageNumber} de ${totalPages}`, pageWidth - 30, pageHeight - 10, { align: "right" })

            doc.text("Generado por Parte Diario", 20, pageHeight - 10)
          },
        })

        // Descargar el PDF
        const fileName = `reporte_actividades_${new Date().toISOString().split("T")[0]}.pdf`
        doc.save(fileName)
      } else if (format === "xlsx") {
        try {
          // Intentar usar XLSX primero
          const XLSX = await import("xlsx")

          // Crear hoja de cálculo
          const ws = XLSX.utils.json_to_sheet(dataToExport)

          // Crear libro
          const wb = XLSX.utils.book_new()
          XLSX.utils.book_append_sheet(wb, ws, "Actividades")

          // Configurar ancho de columnas
          const colWidths = [
            { wch: 12 }, // Fecha
            { wch: 20 }, // Actividad
            { wch: 15 }, // Empleado
            { wch: 12 }, // Ubicación
            { wch: 15 }, // Insumo
            { wch: 12 }, // Cant. Insumo
            { wch: 15 }, // Animal
            { wch: 12 }, // Cant. Animal
          ]
          ws["!cols"] = colWidths

          // Crear buffer y descargar manualmente
          const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" })
          const blob = new Blob([wbout], { type: "application/octet-stream" })
          const link = document.createElement("a")
          const url = URL.createObjectURL(blob)
          link.setAttribute("href", url)
          link.setAttribute("download", `actividades_${new Date().toISOString().split("T")[0]}.xlsx`)
          link.style.visibility = "hidden"
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
        } catch (xlsxError) {
          console.log("XLSX failed, using CSV fallback:", xlsxError)
          // Fallback a CSV si XLSX falla
          const fileName = `actividades_${new Date().toISOString().split("T")[0]}.xlsx`
          downloadExcelFile(dataToExport, fileName)
        }
      }

      toast({
        title: "Éxito",
        description: `Archivo ${format.toUpperCase()} descargado correctamente`,
      })
    } catch (error) {
      console.error("Error exporting:", error)
      toast({
        title: "Error",
        description: `No se pudo exportar el archivo ${format.toUpperCase()}. Intenta de nuevo.`,
        variant: "destructive",
      })
    } finally {
      setExportando(false)
    }
  }

  const establecimientoId = obtenerEstablecimientoSeleccionado()

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header mejorado */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center py-6 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Actividades del Personal</h1>
              <p className="text-sm text-gray-600 mt-1">Gestión completa de actividades de campo</p>
            </div>

            {/* Controles de tiempo y acciones */}
            <div className="flex flex-wrap gap-3">
              {/* Toggle de rango de tiempo */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                {["hoy", "semana", "mes"].map((rango) => (
                  <button
                    key={rango}
                    onClick={() => setRangoTiempo(rango)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      rangoTiempo === rango ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {rango.charAt(0).toUpperCase() + rango.slice(1)}
                  </button>
                ))}
              </div>

              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Nueva Actividad
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Panel de Resumen (KPIs) mejorado */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {kpiData.map((kpi, index) => {
            const IconComponent = kpi.icon
            return (
              <Card
                key={index}
                className={`hover:shadow-lg transition-all duration-200 border-0 shadow-md ${
                  kpi.clickable ? "cursor-pointer hover:scale-105" : ""
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 mb-2">{kpi.title}</p>
                      <p className="text-3xl font-bold text-gray-900 mb-1">{kpi.value}</p>
                      <p className="text-xs text-gray-500 mb-2">{kpi.description}</p>
                      <p className={`text-xs font-medium ${kpi.color}`}>{kpi.trend}</p>
                    </div>
                    <div className={`p-4 rounded-xl ${kpi.bgColor}`}>
                      <IconComponent className={`w-8 h-8 ${kpi.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Gráfico de actividades por tipo */}
        <div className="grid grid-cols-1 gap-6 mb-8">
          <Card className="shadow-md border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Actividades por Tipo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {actividadesPorTipo.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="w-20 text-sm font-medium text-gray-700">{item.tipo}</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-3 relative">
                      <div
                        className={`${item.color} h-3 rounded-full transition-all duration-500`}
                        style={{ width: `${(item.cantidad / 8) * 100}%` }}
                      />
                    </div>
                    <div className="w-8 text-sm font-bold text-gray-900">{item.cantidad}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de actividades con filtros integrados */}
        <Card className="shadow-md border-0">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Lista de Actividades</CardTitle>
            {/* Selector de exportar igual que en Movimientos Recientes */}
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={exportando}>
                    <Download className="w-4 h-4 mr-2" />
                    {exportando ? "Exportando..." : "Exportar"}
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleExport("xlsx")}>
                    <span>📊</span>
                    <span className="ml-2">Excel</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport("pdf")}>
                    <span>📄</span>
                    <span className="ml-2">PDF</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          {/* Filtros integrados */}
          <CardContent className="p-6 pt-0">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar actividades, empleados o lugares..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="pl-10 h-11"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Select value={empleadoFiltro} onValueChange={setEmpleadoFiltro}>
                  <SelectTrigger className="w-[200px] h-11">
                    <SelectValue placeholder="Todos los empleados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los empleados</SelectItem>
                    {empleadosUnicos.map((empleado) => (
                      <SelectItem key={empleado} value={empleado}>
                        {empleado}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={ubicacionFiltro} onValueChange={setUbicacionFiltro}>
                  <SelectTrigger className="w-[200px] h-11">
                    <SelectValue placeholder="Todas las ubicaciones" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas las ubicaciones</SelectItem>
                    {ubicacionesUnicas.map((ubicacion) => (
                      <SelectItem key={ubicacion} value={ubicacion}>
                        {ubicacion}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
          <CardContent className="p-6 pt-0">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="text-gray-500">Cargando actividades...</div>
              </div>
            ) : (
              <ScrollArea className="h-[600px]">
                <div className="overflow-x-auto">
                  <Table className="min-w-full">
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>Actividad</TableHead>
                        <TableHead>Empleado</TableHead>
                        <TableHead>Ubicación</TableHead>
                        <TableHead>Fecha</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {actividades.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                            {!establecimientoId
                              ? "Selecciona un establecimiento para ver las actividades."
                              : "No se encontraron actividades con los filtros aplicados."}
                          </TableCell>
                        </TableRow>
                      ) : (
                        actividades.map((actividad) => (
                          <TableRow
                            key={`${actividad.actividad_id}-${actividad.fecha}-${actividad.hora}`}
                            className="hover:bg-gray-50 cursor-pointer"
                            onClick={() => {
                              setActividadSeleccionada(actividad)
                              setVistaDetalle(true)
                            }}
                          >
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <span className="text-xl">{getIconoActividad(actividad.tipo_actividad_nombre)}</span>
                                <div>
                                  <p className="font-medium text-gray-900">{actividad.tipo_actividad_nombre}</p>
                                  {actividad.insumo_nombre && (
                                    <p className="text-sm text-gray-500">
                                      Insumo: {actividad.insumo_nombre} ({actividad.insumo_cantidad})
                                    </p>
                                  )}
                                  {actividad.categoria_animal && (
                                    <p className="text-sm text-gray-500">
                                      Animal: {actividad.categoria_animal} ({actividad.animal_cantidad})
                                    </p>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{actividad.usuario}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                {actividad.tipo_actividad_ubicacion_formateada}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm font-medium">{actividad.fecha_formateada}</div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Modal de detalle de actividad */}
        <Dialog open={vistaDetalle} onOpenChange={setVistaDetalle}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            {actividadSeleccionada && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <span className="text-2xl">{getIconoActividad(actividadSeleccionada.tipo_actividad_nombre)}</span>
                    {actividadSeleccionada.tipo_actividad_nombre}
                  </DialogTitle>
                  <DialogDescription>Detalle completo de la actividad</DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Información principal */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Empleado Responsable</Label>
                      <p className="text-lg font-semibold">{actividadSeleccionada.usuario}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Ubicación</Label>
                      <p className="text-lg font-semibold">
                        {actividadSeleccionada.tipo_actividad_ubicacion_formateada}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Fecha</Label>
                      <p className="text-lg font-semibold">{actividadSeleccionada.fecha_formateada}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Hora</Label>
                      <p className="text-lg font-semibold">{actividadSeleccionada.hora}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Empresa</Label>
                      <p className="text-lg font-semibold">{actividadSeleccionada.empresa}</p>
                    </div>
                  </div>

                  {/* Información de insumos */}
                  {actividadSeleccionada.insumo_nombre && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Insumos Utilizados</Label>
                      <p className="text-gray-900 mt-1">
                        {actividadSeleccionada.insumo_nombre} - Cantidad: {actividadSeleccionada.insumo_cantidad}
                      </p>
                    </div>
                  )}

                  {/* Información de animales */}
                  {actividadSeleccionada.categoria_animal && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Animales Involucrados</Label>
                      <div className="mt-1 space-y-1">
                        <p className="text-gray-900">
                          Categoría: {actividadSeleccionada.categoria_animal} - Cantidad:{" "}
                          {actividadSeleccionada.animal_cantidad}
                        </p>
                        {actividadSeleccionada.peso_total_animales && (
                          <p className="text-gray-900">Peso Total: {actividadSeleccionada.peso_total_animales} kg</p>
                        )}
                        {actividadSeleccionada.peso_promedio_animales && (
                          <p className="text-gray-900">
                            Peso Promedio: {actividadSeleccionada.peso_promedio_animales} kg
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Botón flotante para móvil */}
      <div className="fixed bottom-6 right-6 md:hidden">
        <Button size="lg" className="rounded-full h-14 w-14 bg-green-600 hover:bg-green-700 shadow-lg">
          <Plus className="w-6 h-6" />
        </Button>
      </div>
    </div>
  )
}
