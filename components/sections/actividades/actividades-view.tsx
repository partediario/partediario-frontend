"use client"

import { useState, useEffect } from "react"
import { CalendarDays, Download, Search, TrendingUp, ChevronDown, FileText, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
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
  categoria_actividad_id?: number
  categoria_actividad_nombre?: string
  empresa_id: number
  empresa: string
  establecimiento_id: number
  establecimiento: string
  usuario_id: string
  usuario: string
}

// Nueva interface para categorías de actividades
interface CategoriaActividad {
  categoria_id: number
  categoria_nombre: string
  cantidad: number
}

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
    "Trabajo Reproductivo": "🐄",
    "Trabajo de Corral": "🏠",
    Recorrida: "🚶",
  }

  // Buscar por palabras clave en el nombre
  for (const [key, icon] of Object.entries(iconos)) {
    if (nombre.toLowerCase().includes(key.toLowerCase())) {
      return icon
    }
  }

  return "📋" // Icono por defecto
}

// Función para obtener colores para las categorías
const getCategoriaColor = (index: number) => {
  const colores = [
    "bg-purple-500",
    "bg-cyan-500",
    "bg-orange-500",
    "bg-green-500",
    "bg-amber-500",
    "bg-blue-500",
    "bg-red-500",
    "bg-indigo-500",
    "bg-pink-500",
    "bg-teal-500",
  ]
  return colores[index % colores.length]
}

// Función para obtener el texto del período
const getTextoPeriodo = (periodo: string) => {
  switch (periodo) {
    case "hoy":
      return "de hoy"
    case "semana":
      return "de los últimos 7 días"
    case "mes":
      return "de los últimos 30 días"
    default:
      return "del período seleccionado"
  }
}

export default function ActividadesView() {
  const [actividades, setActividades] = useState<Actividad[]>([])
  const [actividadesPorTipo, setActividadesPorTipo] = useState<CategoriaActividad[]>([])
  const [actividadesCategoriaSeleccionada, setActividadesCategoriaSeleccionada] = useState<Actividad[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingCategoria, setLoadingCategoria] = useState(false)
  const [ubicacionFiltro, setUbicacionFiltro] = useState<string>("todos")
  const [empleadoFiltro, setEmpleadoFiltro] = useState<string>("todos")
  const [busqueda, setBusqueda] = useState<string>("")
  const [rangoTiempo, setRangoTiempo] = useState<string>("semana") // Filtro de tiempo activo
  const [actividadSeleccionada, setActividadSeleccionada] = useState<Actividad | null>(null)
  const [vistaDetalle, setVistaDetalle] = useState(false)
  const [exportando, setExportando] = useState(false)
  const [establecimientoSeleccionado, setEstablecimientoSeleccionado] = useState<string>("")

  // Estados para los modales
  const [vistaGenerarInforme, setVistaGenerarInforme] = useState(false)
  const [tipoInforme, setTipoInforme] = useState<string>("semanal")
  const [formatoInforme, setFormatoInforme] = useState<string>("excel")
  const [generandoInforme, setGenerandoInforme] = useState(false)
  const [vistaGraficoTipos, setVistaGraficoTipos] = useState(false)
  const [vistaTotalActividades, setVistaTotalActividades] = useState(false)
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<CategoriaActividad | null>(null)

  const { toast } = useToast()
  const { establecimientoSeleccionado: contextEstablecimiento } = useEstablishment()

  // Obtener ubicaciones únicas para el filtro (formateadas)
  const ubicacionesUnicas = Array.from(
    new Set(actividades.map((act) => act.tipo_actividad_ubicacion_formateada).filter(Boolean)),
  )

  // Obtener empleados únicos para el filtro
  const empleadosUnicos = Array.from(new Set(actividades.map((act) => act.usuario).filter(Boolean)))

  // KPI dinámico - solo Total Actividades Registradas
  const totalActividades = actividades.length

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
      params.append("periodo", rangoTiempo) // Agregar filtro de período

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

      console.log("Cargando actividades con establecimiento:", establecimientoId, "período:", rangoTiempo)
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

  // Función para cargar actividades por categoría
  const cargarActividadesPorCategoria = async () => {
    try {
      const establecimientoId = obtenerEstablecimientoSeleccionado()

      if (!establecimientoId) {
        console.log("No hay establecimiento seleccionado para categorías")
        setActividadesPorTipo([])
        return
      }

      const params = new URLSearchParams()
      params.append("establecimiento_id", establecimientoId.toString())
      params.append("periodo", rangoTiempo) // Agregar filtro de período

      console.log(
        "Cargando actividades por categoría para establecimiento:",
        establecimientoId,
        "período:",
        rangoTiempo,
      )
      const response = await fetch(`/api/actividades-por-categoria?${params.toString()}`)

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success) {
        setActividadesPorTipo(data.categorias || [])
        console.log("Categorías cargadas:", data.categorias?.length || 0)
      } else {
        throw new Error(data.error || "Error desconocido")
      }
    } catch (error) {
      console.error("Error cargando actividades por categoría:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las categorías de actividades.",
        variant: "destructive",
      })
      setActividadesPorTipo([])
    }
  }

  // Función para cargar actividades de una categoría específica
  const cargarActividadesDeCategoria = async (categoriaId: number) => {
    try {
      setLoadingCategoria(true)
      const establecimientoId = obtenerEstablecimientoSeleccionado()

      if (!establecimientoId) {
        console.log("No hay establecimiento seleccionado")
        return
      }

      const params = new URLSearchParams()
      params.append("establecimiento_id", establecimientoId.toString())
      params.append("periodo", rangoTiempo) // Agregar filtro de período

      console.log("Cargando actividades de categoría:", categoriaId, "período:", rangoTiempo)
      const response = await fetch(`/api/actividades-por-categoria/${categoriaId}?${params.toString()}`)

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success) {
        setActividadesCategoriaSeleccionada(data.actividades || [])
        console.log("Actividades de categoría cargadas:", data.actividades?.length || 0)
      } else {
        throw new Error(data.error || "Error desconocido")
      }
    } catch (error) {
      console.error("Error cargando actividades de categoría:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las actividades de la categoría.",
        variant: "destructive",
      })
      setActividadesCategoriaSeleccionada([])
    } finally {
      setLoadingCategoria(false)
    }
  }

  // Escuchar cambios en el establecimiento seleccionado
  useEffect(() => {
    const handleEstablishmentChange = () => {
      const establecimientoId = obtenerEstablecimientoSeleccionado()
      setEstablecimientoSeleccionado(establecimientoId || "")
      cargarActividades()
      cargarActividadesPorCategoria()
    }

    // Cargar inicialmente
    handleEstablishmentChange()

    // Escuchar eventos de cambio de establecimiento
    window.addEventListener("establishmentChange", handleEstablishmentChange)

    return () => {
      window.removeEventListener("establishmentChange", handleEstablishmentChange)
    }
  }, [])

  // Cargar actividades cuando cambien los filtros (incluyendo rangoTiempo)
  useEffect(() => {
    if (establecimientoSeleccionado) {
      cargarActividades()
      cargarActividadesPorCategoria()
    }
  }, [ubicacionFiltro, empleadoFiltro, busqueda, rangoTiempo])

  // Función para generar informe real
  const handleGenerarInforme = async () => {
    try {
      setGenerandoInforme(true)

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

      // Determinar el período del informe
      const periodoInforme = tipoInforme === "semanal" ? "semana" : "mes"

      // Obtener actividades para el informe
      const establecimientoId = obtenerEstablecimientoSeleccionado()
      if (!establecimientoId) {
        throw new Error("No hay establecimiento seleccionado")
      }

      const params = new URLSearchParams()
      params.append("establecimiento_id", establecimientoId.toString())
      params.append("periodo", periodoInforme)

      const response = await fetch(`/api/actividades?${params.toString()}`)
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Error obteniendo datos")
      }

      const actividadesInforme = data.actividades || []

      // Preparar datos para exportar
      const dataToExport = actividadesInforme.map((act: Actividad) => ({
        Fecha: act.fecha_formateada,
        Hora: act.hora || "",
        "Tipo de Actividad": act.tipo_actividad_nombre,
        "Categoría de Actividad": act.categoria_actividad_nombre || "",
        Empleado: act.usuario,
        Ubicación: act.tipo_actividad_ubicacion_formateada,
        Empresa: act.empresa,
        Establecimiento: act.establecimiento,
        "Insumo Utilizado": act.insumo_nombre || "",
        "Cantidad Insumo": act.insumo_cantidad || "",
        "Categoría Animal": act.categoria_animal || "",
        "Cantidad Animal": act.animal_cantidad || "",
        "Peso Total Animales": act.peso_total_animales || "",
        "Peso Promedio Animales": act.peso_promedio_animales || "",
      }))

      if (formatoInforme === "excel") {
        // Generar Excel
        const XLSX = await import("xlsx")
        const ws = XLSX.utils.json_to_sheet(dataToExport)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Actividades")

        // Configurar anchos de columna
        const colWidths = [
          { wch: 12 }, // Fecha
          { wch: 10 }, // Hora
          { wch: 25 }, // Tipo de Actividad
          { wch: 25 }, // Categoría de Actividad
          { wch: 20 }, // Empleado
          { wch: 15 }, // Ubicación
          { wch: 15 }, // Empresa
          { wch: 20 }, // Establecimiento
          { wch: 20 }, // Insumo Utilizado
          { wch: 15 }, // Cantidad Insumo
          { wch: 20 }, // Categoría Animal
          { wch: 15 }, // Cantidad Animal
          { wch: 18 }, // Peso Total Animales
          { wch: 20 }, // Peso Promedio Animales
        ]
        ws["!cols"] = colWidths

        const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" })
        const blob = new Blob([wbout], { type: "application/octet-stream" })
        const link = document.createElement("a")
        const url = URL.createObjectURL(blob)
        link.setAttribute("href", url)
        link.setAttribute(
          "download",
          `informe_actividades_${tipoInforme}_${new Date().toISOString().split("T")[0]}.xlsx`,
        )
        link.style.visibility = "hidden"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        toast({
          title: "Informe generado",
          description: `Informe Excel ${tipoInforme} descargado correctamente`,
        })
      } else if (formatoInforme === "pdf") {
        // Generar PDF
        const { jsPDF } = await import("jspdf")
        const autoTable = (await import("jspdf-autotable")).default

        const doc = new jsPDF()
        const pageWidth = doc.internal.pageSize.width
        const pageHeight = doc.internal.pageSize.height

        // Color principal verde oliva
        const primaryColor = [140, 156, 120] // #8C9C78

        // Encabezado principal
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
        doc.rect(0, 0, pageWidth, 50, "F")

        // Título principal en blanco
        doc.setTextColor(255, 255, 255)
        doc.setFont("helvetica", "bold")
        doc.setFontSize(24)
        doc.text("INFORME DE ACTIVIDADES", 20, 25)

        doc.setFontSize(16)
        doc.text(`Período: ${tipoInforme.charAt(0).toUpperCase() + tipoInforme.slice(1)}`, 20, 35)

        // Información del establecimiento
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

        // Preparar datos para la tabla (solo campos principales)
        const tableData = dataToExport.map((item) => [
          item.Fecha,
          item["Tipo de Actividad"],
          item.Empleado,
          item.Ubicación,
          item["Insumo Utilizado"],
          item["Cantidad Insumo"].toString(),
          item["Categoría Animal"],
          item["Cantidad Animal"].toString(),
        ])

        // Crear tabla profesional
        autoTable(doc, {
          head: [["Fecha", "Actividad", "Empleado", "Ubicación", "Insumo", "Cant.", "Animal", "Cant."]],
          body: tableData,
          startY: 120,
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
          margin: { left: 15, right: 15 },
          didDrawPage: (data) => {
            const pageNumber = doc.internal.getCurrentPageInfo().pageNumber
            const totalPages = doc.internal.getNumberOfPages()

            doc.setFontSize(8)
            doc.setTextColor(128, 128, 128)
            doc.text(`Página ${pageNumber} de ${totalPages}`, pageWidth - 30, pageHeight - 10, { align: "right" })
            doc.text("Generado por Parte Diario", 20, pageHeight - 10)
          },
        })

        // Descargar el PDF
        const fileName = `informe_actividades_${tipoInforme}_${new Date().toISOString().split("T")[0]}.pdf`
        doc.save(fileName)

        toast({
          title: "Informe generado",
          description: `Informe PDF ${tipoInforme} descargado correctamente`,
        })
      }

      setVistaGenerarInforme(false)
    } catch (error) {
      console.error("Error generando informe:", error)
      toast({
        title: "Error",
        description: "No se pudo generar el informe. Intenta de nuevo.",
        variant: "destructive",
      })
    } finally {
      setGenerandoInforme(false)
    }
  }

  // Función de exportación rápida
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

      // Datos para exportar (actividades actuales filtradas)
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

        // Información del establecimiento
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
          startY: 120,
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
          margin: { left: 15, right: 15 },
          didDrawPage: (data) => {
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
          const XLSX = await import("xlsx")
          const ws = XLSX.utils.json_to_sheet(dataToExport)
          const wb = XLSX.utils.book_new()
          XLSX.utils.book_append_sheet(wb, ws, "Actividades")

          const colWidths = [
            { wch: 12 },
            { wch: 20 },
            { wch: 15 },
            { wch: 12 },
            { wch: 15 },
            { wch: 12 },
            { wch: 15 },
            { wch: 12 },
          ]
          ws["!cols"] = colWidths

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
          // Fallback a CSV
          const headers = Object.keys(dataToExport[0])
          const csvContent = [
            headers.join(","),
            ...dataToExport.map((row) =>
              headers
                .map((header) => {
                  const value = row[header as keyof typeof row]
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
          link.setAttribute("download", `actividades_${new Date().toISOString().split("T")[0]}.csv`)
          link.style.visibility = "hidden"
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
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

  const handleTipoClick = async (categoria: CategoriaActividad) => {
    setCategoriaSeleccionada(categoria)
    await cargarActividadesDeCategoria(categoria.categoria_id)
    setVistaGraficoTipos(true)
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

              <Button variant="outline" size="sm" onClick={() => setVistaGenerarInforme(true)}>
                <FileText className="w-4 h-4 mr-2" />
                Generar Informe
              </Button>

              {/* Botón "Nueva Actividad" eliminado */}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Panel de Resumen (KPI) - SOLO TOTAL ACTIVIDADES */}
        <div className="grid grid-cols-1 gap-6 mb-8">
          <Card
            className="hover:shadow-lg transition-all duration-200 border-0 shadow-md cursor-pointer hover:scale-105"
            onClick={() => setVistaTotalActividades(true)}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-2">Total Actividades Registradas</p>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{totalActividades}</p>
                  <p className="text-xs text-gray-500 mb-2">{getTextoPeriodo(rangoTiempo)}</p>
                  <p className="text-xs font-medium text-blue-600">Click para ver detalles</p>
                </div>
                <div className="p-4 rounded-xl bg-blue-50">
                  <CalendarDays className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico de actividades por tipo - DINÁMICO */}
        <div className="grid grid-cols-1 gap-6 mb-8">
          <Card className="shadow-md border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Actividades por Tipo
              </CardTitle>
            </CardHeader>
            <CardContent>
              {actividadesPorTipo.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {!establecimientoId
                    ? "Selecciona un establecimiento para ver las actividades por tipo."
                    : "No se encontraron categorías de actividades."}
                </div>
              ) : (
                <div className="space-y-6">
                  {actividadesPorTipo.map((categoria, index) => (
                    <div
                      key={categoria.categoria_id}
                      className="p-4 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors border border-gray-100"
                      onClick={() => handleTipoClick(categoria)}
                    >
                      {/* Header con nombre y cantidad */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getIconoActividad(categoria.categoria_nombre)}</span>
                          <h3 className="text-lg font-semibold text-gray-900">{categoria.categoria_nombre}</h3>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">{categoria.cantidad}</div>
                          <div className="text-sm text-gray-500">actividades</div>
                        </div>
                      </div>

                      {/* Barra de progreso separada */}
                      <div className="w-full bg-gray-200 rounded-full h-4 relative overflow-hidden">
                        <div
                          className={`${getCategoriaColor(index)} h-4 rounded-full transition-all duration-700 ease-out`}
                          style={{
                            width: `${actividadesPorTipo.length > 0 ? (categoria.cantidad / Math.max(...actividadesPorTipo.map((c) => c.cantidad))) * 100 : 0}%`,
                          }}
                        />
                        {/* Texto de porcentaje dentro de la barra */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-medium text-white drop-shadow-sm">
                            {actividadesPorTipo.length > 0
                              ? Math.round(
                                  (categoria.cantidad / Math.max(...actividadesPorTipo.map((c) => c.cantidad))) * 100,
                                )
                              : 0}
                            %
                          </span>
                        </div>
                      </div>

                      {/* Información adicional */}
                      <div className="mt-2 text-sm text-gray-600">Click para ver detalles de las actividades</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Lista de actividades con filtros integrados */}
        <Card className="shadow-md border-0">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Lista de Actividades</CardTitle>
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

        {/* Drawer de detalle de actividad */}
        <Drawer open={vistaDetalle} onOpenChange={setVistaDetalle} direction="right">
          <DrawerContent className="h-full w-[850px] ml-auto">
            <DrawerHeader className="flex items-center justify-between border-b pb-4">
              <DrawerTitle className="flex items-center gap-3">
                <span className="text-2xl">
                  {getIconoActividad(actividadSeleccionada?.tipo_actividad_nombre || "")}
                </span>
                {actividadSeleccionada?.tipo_actividad_nombre}
              </DrawerTitle>
              <button
                onClick={() => setVistaDetalle(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </DrawerHeader>
            <div className="max-h-[calc(100vh-80px)] overflow-y-auto p-6">
              {actividadSeleccionada && (
                <>
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
                      {actividadSeleccionada.categoria_actividad_nombre && (
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Categoría de Actividad</Label>
                          <p className="text-lg font-semibold">{actividadSeleccionada.categoria_actividad_nombre}</p>
                        </div>
                      )}
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
            </div>
          </DrawerContent>
        </Drawer>

        {/* Drawer de generar informe */}
        <Drawer open={vistaGenerarInforme} onOpenChange={setVistaGenerarInforme} direction="right">
          <DrawerContent className="h-full w-[500px] ml-auto">
            <DrawerHeader className="flex items-center justify-between border-b pb-4">
              <DrawerTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Generar Informe de Actividades
              </DrawerTitle>
              <button
                onClick={() => setVistaGenerarInforme(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </DrawerHeader>

            <div className="max-h-[calc(100vh-80px)] overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Período del informe */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">Período del informe</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant={tipoInforme === "semanal" ? "default" : "outline"}
                      onClick={() => setTipoInforme("semanal")}
                      className="flex flex-col items-center p-4 h-auto"
                    >
                      <CalendarDays className="w-5 h-5 mb-2" />
                      <span className="text-sm">Semanal</span>
                      <span className="text-xs text-gray-500">Últimos 7 días</span>
                    </Button>
                    <Button
                      variant={tipoInforme === "mensual" ? "default" : "outline"}
                      onClick={() => setTipoInforme("mensual")}
                      className="flex flex-col items-center p-4 h-auto"
                    >
                      <CalendarDays className="w-5 h-5 mb-2" />
                      <span className="text-sm">Mensual</span>
                      <span className="text-xs text-gray-500">Últimos 30 días</span>
                    </Button>
                  </div>
                </div>

                {/* Formato del informe */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">Formato del informe</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant={formatoInforme === "excel" ? "default" : "outline"}
                      onClick={() => setFormatoInforme("excel")}
                      className="flex flex-col items-center p-4 h-auto"
                    >
                      <Download className="w-5 h-5 mb-2" />
                      <span className="text-sm">Excel</span>
                      <span className="text-xs text-gray-500">Datos tabulares</span>
                    </Button>
                    <Button
                      variant={formatoInforme === "pdf" ? "default" : "outline"}
                      onClick={() => setFormatoInforme("pdf")}
                      className="flex flex-col items-center p-4 h-auto"
                    >
                      <FileText className="w-5 h-5 mb-2" />
                      <span className="text-sm">PDF</span>
                      <span className="text-xs text-gray-500">Presentación</span>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setVistaGenerarInforme(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button
                  onClick={handleGenerarInforme}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={generandoInforme}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {generandoInforme ? "Generando..." : `Generar ${formatoInforme.toUpperCase()}`}
                </Button>
              </div>
            </div>
          </DrawerContent>
        </Drawer>

        {/* Drawer de detalle por tipo de actividad */}
        <Drawer open={vistaGraficoTipos} onOpenChange={setVistaGraficoTipos} direction="right">
          <DrawerContent className="h-full w-[900px] ml-auto">
            <DrawerHeader className="flex items-center justify-between border-b pb-4">
              <DrawerTitle className="flex items-center gap-2">
                <span className="text-2xl">{getIconoActividad(categoriaSeleccionada?.categoria_nombre || "")}</span>
                Actividades de {categoriaSeleccionada?.categoria_nombre}
              </DrawerTitle>
              <button
                onClick={() => setVistaGraficoTipos(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </DrawerHeader>

            <div className="max-h-[calc(100vh-80px)] overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Estadísticas del tipo */}
                <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                  <Card className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{categoriaSeleccionada?.cantidad || 0}</p>
                      <p className="text-sm text-gray-600">Total de Actividades {getTextoPeriodo(rangoTiempo)}</p>
                    </div>
                  </Card>
                </div>

                {/* Lista de actividades del tipo */}
                <Card>
                  <CardHeader>
                    <CardTitle>Lista de Actividades</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingCategoria ? (
                      <div className="flex justify-center items-center py-8">
                        <div className="text-gray-500">Cargando actividades...</div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {actividadesCategoriaSeleccionada.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            No se encontraron actividades para esta categoría {getTextoPeriodo(rangoTiempo)}.
                          </div>
                        ) : (
                          actividadesCategoriaSeleccionada.map((actividad) => (
                            <div
                              key={actividad.actividad_id}
                              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-xl">{getIconoActividad(actividad.tipo_actividad_nombre)}</span>
                                <div>
                                  <h4 className="font-medium">{actividad.tipo_actividad_nombre}</h4>
                                  <p className="text-sm text-gray-600">
                                    {actividad.usuario} - {actividad.tipo_actividad_ubicacion_formateada} -{" "}
                                    {actividad.fecha_formateada}
                                  </p>
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
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setActividadSeleccionada(actividad)
                                    setVistaDetalle(true)
                                    setVistaGraficoTipos(false)
                                  }}
                                >
                                  Ver detalle
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </DrawerContent>
        </Drawer>

        {/* Drawer de total de actividades */}
        <Drawer open={vistaTotalActividades} onOpenChange={setVistaTotalActividades} direction="right">
          <DrawerContent className="h-full w-[1000px] ml-auto">
            <DrawerHeader className="flex items-center justify-between border-b pb-4">
              <DrawerTitle className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-blue-600" />
                Resumen Total de Actividades
              </DrawerTitle>
              <button
                onClick={() => setVistaTotalActividades(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </DrawerHeader>

            <div className="max-h-[calc(100vh-80px)] overflow-y-auto p-6">
              <div className="space-y-6">
                <p className="text-sm text-gray-600">
                  Vista completa de todas las actividades registradas {getTextoPeriodo(rangoTiempo)}
                </p>

                {/* Resumen por empleado */}
                <Card>
                  <CardHeader>
                    <CardTitle>Actividades por Empleado</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(
                        actividades.reduce(
                          (acc, act) => {
                            acc[act.usuario] = (acc[act.usuario] || 0) + 1
                            return acc
                          },
                          {} as Record<string, number>,
                        ),
                      )
                        .sort(([, a], [, b]) => b - a)
                        .map(([empleado, cantidad]) => (
                          <div key={empleado} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-blue-700">
                                  {empleado
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </span>
                              </div>
                              <span className="font-medium">{empleado}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-32 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-500 h-2 rounded-full"
                                  style={{
                                    width: `${
                                      (cantidad /
                                        Math.max(
                                          ...Object.values(
                                            actividades.reduce(
                                              (acc, act) => {
                                                acc[act.usuario] = (acc[act.usuario] || 0) + 1
                                                return acc
                                              },
                                              {} as Record<string, number>,
                                            ),
                                          ),
                                        )) *
                                      100
                                    }%`,
                                  }}
                                />
                              </div>
                              <span className="text-sm font-bold w-8">{cantidad}</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Resumen por tipo - USANDO DATOS REALES */}
                <Card>
                  <CardHeader>
                    <CardTitle>Actividades por Tipo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {actividadesPorTipo.map((categoria, index) => (
                        <div key={categoria.categoria_id} className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-xl">{getIconoActividad(categoria.categoria_nombre)}</span>
                            <h4 className="font-medium">{categoria.categoria_nombre}</h4>
                          </div>
                          <p className="text-2xl font-bold text-gray-900">{categoria.cantidad}</p>
                          <p className="text-sm text-gray-600">actividades registradas</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Botones de acción */}
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setVistaGenerarInforme(true)}>
                    <FileText className="w-4 h-4 mr-2" />
                    Generar Informe
                  </Button>
                  <Button onClick={() => handleExport("xlsx")}>
                    <Download className="w-4 h-4 mr-2" />
                    Exportar Datos
                  </Button>
                </div>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  )
}
