import type { ReportTemplate } from "./types"

export const mockReportTemplates: ReportTemplate[] = [
  {
    id: "lluvia-template",
    name: "Reporte de Lluvias",
    description: "Genera reportes de precipitaciones con análisis mensual y anual.",
    module: "LLUVIA",
    tags: ["Clima", "Precipitaciones"],
    defaultParams: {
      dataset: "LLUVIA",
      aggregation: "monthly",
    },
    layoutSchema: {
      columns: ["fecha", "pluviometro", "mm", "acumulado_mensual"],
      showChart: true,
    },
  },
  {
    id: "movimientos-template",
    name: "Reporte de Movimientos de Hacienda",
    description: "Incluye entradas, salidas, compras, ventas, nacimientos y mortandad.",
    module: "MOVIMIENTOS",
    tags: ["Ganadería", "Stock"],
    defaultParams: {
      dataset: "MOVIMIENTOS",
      types: ["Nacimiento", "Compra", "Venta", "Mortandad"],
    },
    layoutSchema: {
      columns: ["fecha", "tipo", "categoria", "cantidad", "kg_totales"],
      groupBy: "tipo",
    },
  },
  {
    id: "insumos-template",
    name: "Reporte de Stock y Uso de Insumos",
    description: "Muestra stock actual y consumos por período seleccionado.",
    module: "INSUMOS",
    tags: ["Insumos", "Inventario"],
    defaultParams: {
      dataset: "INSUMOS",
    },
    layoutSchema: {
      columns: ["insumo", "stock_actual", "consumo_periodo", "costo_total"],
    },
  },
  {
    id: "ejecutivo-template",
    name: "Reporte General / Ejecutivo",
    description: "Resumen consolidado de todos los módulos del establecimiento.",
    module: "EJECUTIVO",
    tags: ["Ejecutivo", "Resumen"],
    defaultParams: {},
    layoutSchema: {
      sections: ["movimientos", "clima", "insumos", "actividades"],
    },
  },
]

export const mockLluviaData = [
  { fecha: "2025-01-01", pluviometro: "Central", mm: 25, acumulado_mensual: 25 },
  { fecha: "2025-01-05", pluviometro: "Central", mm: 18, acumulado_mensual: 43 },
  { fecha: "2025-01-10", pluviometro: "Norte", mm: 32, acumulado_mensual: 32 },
]

export const mockMovimientosData = [
  {
    fecha: "2025-01-15",
    tipo: "Nacimiento",
    categoria: "Terneros",
    cantidad: 12,
    kg_totales: 480,
    establecimiento: "San Miguel",
  },
  {
    fecha: "2025-01-20",
    tipo: "Compra",
    categoria: "Vaquillas",
    cantidad: 25,
    kg_totales: 8750,
    establecimiento: "San Miguel",
  },
]
