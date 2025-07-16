"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, Filter, Download, FileText, FileSpreadsheet, Calendar } from "lucide-react"
import { useCurrentEstablishment } from "@/hooks/use-current-establishment"
import { toast } from "sonner"
import jsPDF from "jspdf"
import "jspdf-autotable"
import * as XLSX from "xlsx"

interface MovimientoReciente {
  id: number
  fecha: string
  categoria_animal: string
  tipo_movimiento: string
  movimiento: string
  cantidad: number
  peso_promedio: number
  peso_total: number
  usuario: string
}

// Función para formatear fechas de forma segura sin problemas de zona horaria
const formatDateSafe = (dateString: string): string => {
  if (!dateString) return ""

  // Si la fecha viene en formato YYYY-MM-DD, la tratamos como fecha local
  const parts = dateString.split("-")
  if (parts.length === 3) {
    const year = Number.parseInt(parts[0])
    const month = Number.parseInt(parts[1]) - 1 // Los meses en JS van de 0-11
    const day = Number.parseInt(parts[2])

    const date = new Date(year, month, day)
    return date.toLocaleDateString("es-ES")
  }

  // Para otros formatos, usar el método estándar
  return new Date(dateString).toLocaleDateString("es-ES")
}

export default function MovimientosRecientes() {
  const [movimientos, setMovimientos] = useState<MovimientoReciente[]>([])
  const [filteredMovimientos, setFilteredMovimientos] = useState<MovimientoReciente[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const { currentEstablishment } = useCurrentEstablishment()

  useEffect(() => {
    if (currentEstablishment?.id) {
      fetchMovimientos()
    }
  }, [currentEstablishment])

  useEffect(() => {
    filterMovimientos()
  }, [movimientos, searchTerm, filterType])

  const fetchMovimientos = async () => {
    if (!currentEstablishment?.id) return

    setLoading(true)
    try {
      const response = await fetch(`/api/movimientos-recientes?establecimiento_id=${currentEstablishment.id}`)
      if (!response.ok) throw new Error("Error al cargar movimientos")

      const data = await response.json()
      setMovimientos(data.movimientos || [])
    } catch (error) {
      console.error("Error fetching movimientos:", error)
      toast.error("Error al cargar movimientos recientes")
    } finally {
      setLoading(false)
    }
  }

  const filterMovimientos = () => {
    let filtered = movimientos

    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        (mov) =>
          mov.categoria_animal.toLowerCase().includes(searchTerm.toLowerCase()) ||
          mov.usuario.toLowerCase().includes(searchTerm.toLowerCase()) ||
          mov.tipo_movimiento.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filtrar por tipo
    if (filterType !== "all") {
      filtered = filtered.filter((mov) => mov.tipo_movimiento.toLowerCase() === filterType.toLowerCase())
    }

    setFilteredMovimientos(filtered)
  }

  const exportToPDF = async () => {
    try {
      const pdf = new jsPDF()

      // Título
      pdf.setFontSize(16)
      pdf.text("Movimientos Recientes", 20, 20)

      // Información del establecimiento
      pdf.setFontSize(10)
      pdf.text(`Establecimiento: ${currentEstablishment?.nombre || "N/A"}`, 20, 30)
      pdf.text(`Fecha de exportación: ${new Date().toLocaleDateString("es-ES")}`, 20, 35)

      // Preparar datos para la tabla
      const tableData = filteredMovimientos.map((mov) => [
        formatDateSafe(mov.fecha),
        mov.categoria_animal,
        mov.tipo_movimiento,
        mov.movimiento,
        mov.cantidad.toString(),
        `${mov.peso_promedio} kg`,
        `${mov.peso_total} kg`,
        mov.usuario,
      ])

      // Crear tabla
      ;(pdf as any).autoTable({
        head: [["Fecha", "Categoría", "Tipo", "Movimiento", "Cantidad", "Peso Prom.", "Peso Total", "Usuario"]],
        body: tableData,
        startY: 45,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] },
      })

      pdf.save(`movimientos-recientes-${new Date().toISOString().split("T")[0]}.pdf`)
      toast.success("PDF exportado exitosamente")
    } catch (error) {
      console.error("Error exporting PDF:", error)
      toast.error("Error al exportar PDF")
    }
  }

  const exportToExcel = () => {
    try {
      const excelData = filteredMovimientos.map((mov) => ({
        Fecha: formatDateSafe(mov.fecha),
        Categoría: mov.categoria_animal,
        Tipo: mov.tipo_movimiento,
        Movimiento: mov.movimiento,
        Cantidad: mov.cantidad,
        "Peso Promedio (kg)": mov.peso_promedio,
        "Peso Total (kg)": mov.peso_total,
        Usuario: mov.usuario,
      }))

      const ws = XLSX.utils.json_to_sheet(excelData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Movimientos Recientes")

      XLSX.writeFile(wb, `movimientos-recientes-${new Date().toISOString().split("T")[0]}.xlsx`)
      toast.success("Excel exportado exitosamente")
    } catch (error) {
      console.error("Error exporting Excel:", error)
      toast.error("Error al exportar Excel")
    }
  }

  const getMovementBadge = (tipo: string) => {
    const isEntrada =
      tipo.toLowerCase().includes("entrada") ||
      tipo.toLowerCase().includes("compra") ||
      tipo.toLowerCase().includes("nacimiento")
    return (
      <Badge variant={isEntrada ? "default" : "destructive"} className={isEntrada ? "bg-green-500" : "bg-red-500"}>
        {isEntrada ? "Entrada" : "Salida"}
      </Badge>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Movimientos Recientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">Cargando movimientos...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Movimientos Recientes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Controles de búsqueda y filtros */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por categoría, usuario o tipo de movimiento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                <Filter className="w-4 h-4" />
                Filtrar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setFilterType("all")}>Todos los movimientos</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType("entrada")}>Solo entradas</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType("salida")}>Solo salidas</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                <Download className="w-4 h-4" />
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={exportToPDF} className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Exportar PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportToExcel} className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4" />
                Exportar Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Tabla de movimientos */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Movimiento</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">Peso Prom.</TableHead>
                <TableHead className="text-right">Peso Total</TableHead>
                <TableHead>Usuario</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMovimientos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    No se encontraron movimientos
                  </TableCell>
                </TableRow>
              ) : (
                filteredMovimientos.map((mov) => (
                  <TableRow key={mov.id}>
                    <TableCell className="font-medium">{formatDateSafe(mov.fecha)}</TableCell>
                    <TableCell>{mov.categoria_animal}</TableCell>
                    <TableCell>{getMovementBadge(mov.tipo_movimiento)}</TableCell>
                    <TableCell>{mov.movimiento}</TableCell>
                    <TableCell className="text-right">{mov.cantidad}</TableCell>
                    <TableCell className="text-right">{mov.peso_promedio} kg</TableCell>
                    <TableCell className="text-right">{mov.peso_total} kg</TableCell>
                    <TableCell className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium">
                        {mov.usuario.charAt(0).toUpperCase()}
                      </div>
                      {mov.usuario}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Información adicional */}
        {filteredMovimientos.length > 0 && (
          <div className="mt-4 text-sm text-gray-500">
            Mostrando {filteredMovimientos.length} de {movimientos.length} movimientos
          </div>
        )}
      </CardContent>
    </Card>
  )
}
