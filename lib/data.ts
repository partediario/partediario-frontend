// Configuración de categorías de insumos
export interface CategoriaConfig {
  nombre: string
  emoji: string
  descripcion: string
}

export const categoriasConfig: Record<string, CategoriaConfig> = {
  sales: {
    nombre: "Sales, Balanceados y Forrajes",
    emoji: "🧂",
    descripcion: "Sales minerales, balanceados y forrajes",
  },
  veterinarios: {
    nombre: "Insumos Veterinarios",
    emoji: "💉",
    descripcion: "Vacunas, medicamentos y productos veterinarios",
  },
  agricolas: {
    nombre: "Insumos Agrícolas",
    emoji: "🌿",
    descripcion: "Herbicidas, insecticidas, fungicidas y agroquímicos",
  },
  materiales: {
    nombre: "Materiales",
    emoji: "🏗️",
    descripcion: "Materiales de construcción y varios",
  },
  combustibles: {
    nombre: "Combustibles y Lubricantes",
    emoji: "⛽",
    descripcion: "Gasoil, nafta, aceites y lubricantes",
  },
  semillas: {
    nombre: "Semillas",
    emoji: "🌱",
    descripcion: "Semillas de cultivos y pasturas",
  },
}

// Tipos de datos
export interface Insumo {
  id: string
  nombre: string
  categoria: string
  clase: string
  tipoInsumo: string
  stockActual: number
  stockMinimo: number
  stockMaximo: number
  unidad: string
  unidadMedida: string
  precio?: number
  proveedor: string
  ubicacion: string
  estado: "normal" | "bajo" | "critico"
  icono: string
  tipo: string
  contenido?: number
  almacen?: string
}

export interface Movimiento {
  id: number
  fecha: string
  tipo: "Entrada" | "Salida"
  cantidad: number
  unidad: string
  destino: string
  usuario: string
  precio: number
  observaciones: string
  proveedor: string
  insumoId: string
  insumoNombre: string
  clase: string
  valorTotal: number
}

// Datos de ejemplo para movimientos
export const movimientosData: Movimiento[] = [
  {
    id: 1,
    fecha: "2024-01-15",
    tipo: "Entrada",
    cantidad: 500,
    unidad: "L",
    destino: "Depósito Central",
    usuario: "Juan Pérez",
    precio: 850,
    observaciones: "Compra mensual",
    proveedor: "YPF",
    insumoId: "gasoil-comun",
    insumoNombre: "Gasoil Común",
    clase: "combustibles",
    valorTotal: 425000,
  },
  {
    id: 2,
    fecha: "2024-01-18",
    tipo: "Salida",
    cantidad: 120,
    unidad: "L",
    destino: "Tractor JD 6110",
    usuario: "Carlos López",
    precio: 850,
    observaciones: "Carga de combustible para siembra",
    proveedor: "YPF",
    insumoId: "gasoil-comun",
    insumoNombre: "Gasoil Común",
    clase: "combustibles",
    valorTotal: 102000,
  },
]

// Datos de ejemplo para insumos organizados por categoría
export const insumosData: Record<string, Insumo[]> = {
  combustibles: [
    {
      id: "gasoil-comun",
      nombre: "Gasoil Común",
      categoria: "combustibles",
      clase: "combustibles",
      tipoInsumo: "Combustible",
      stockActual: 1200,
      stockMinimo: 500,
      stockMaximo: 3000,
      unidad: "L",
      unidadMedida: "L",
      precio: 850,
      proveedor: "YPF",
      ubicacion: "Depósito Central",
      estado: "normal",
      icono: "⛽",
      tipo: "Combustible",
    },
  ],
  veterinarios: [
    {
      id: "vacuna-aftosa",
      nombre: "Vacuna Aftosa",
      categoria: "veterinarios",
      clase: "veterinarios",
      tipoInsumo: "Vacuna",
      stockActual: 15,
      stockMinimo: 10,
      stockMaximo: 100,
      unidad: "dosis",
      unidadMedida: "dosis",
      precio: 1200,
      proveedor: "Biogénesis Bagó",
      ubicacion: "Heladera Veterinaria",
      estado: "critico",
      icono: "💉",
      tipo: "Vacuna",
    },
  ],
  agricolas: [
    {
      id: "glifosato",
      nombre: "Glifosato",
      categoria: "agricolas",
      clase: "agricolas",
      tipoInsumo: "Herbicida",
      stockActual: 200,
      stockMinimo: 50,
      stockMaximo: 500,
      unidad: "kg",
      unidadMedida: "kg",
      precio: 2500,
      proveedor: "Bayer",
      ubicacion: "Depósito Agroquímicos",
      estado: "normal",
      icono: "🌿",
      tipo: "Herbicida",
    },
  ],
  materiales: [
    // Placeholder for material data
  ],
  semillas: [
    // Placeholder for seed data
  ],
}

// Datos de ejemplo simples para compatibilidad
export const insumosEjemplo: Insumo[] = [
  {
    id: "gasoil-comun",
    nombre: "Gasoil Común",
    categoria: "combustibles",
    clase: "combustibles",
    tipoInsumo: "Combustible",
    stockActual: 1200,
    stockMinimo: 500,
    stockMaximo: 3000,
    unidad: "L",
    unidadMedida: "L",
    precio: 850,
    proveedor: "YPF",
    ubicacion: "Depósito Central",
    estado: "normal",
    icono: "⛽",
    tipo: "Combustible",
  },
  {
    id: "glifosato",
    nombre: "Glifosato",
    categoria: "agricolas",
    clase: "agricolas",
    tipoInsumo: "Herbicida",
    stockActual: 200,
    stockMinimo: 50,
    stockMaximo: 500,
    unidad: "kg",
    unidadMedida: "kg",
    precio: 2500,
    proveedor: "Bayer",
    ubicacion: "Depósito Agroquímicos",
    estado: "normal",
    icono: "🌿",
    tipo: "Herbicida",
  },
  {
    id: "vacuna-aftosa",
    nombre: "Vacuna Aftosa",
    categoria: "veterinarios",
    clase: "veterinarios",
    tipoInsumo: "Vacuna",
    stockActual: 15,
    stockMinimo: 10,
    stockMaximo: 100,
    unidad: "dosis",
    unidadMedida: "dosis",
    precio: 1200,
    proveedor: "Biogénesis Bagó",
    ubicacion: "Heladera Veterinaria",
    estado: "critico",
    icono: "💉",
    tipo: "Vacuna",
  },
]

// Constantes adicionales
export const tiposMovimiento = ["Entrada", "Salida"] as const
export const unidadesMedida = ["L", "kg", "dosis", "unidades", "m3", "ton"] as const
export const estadosInsumo = ["normal", "bajo", "critico"] as const
