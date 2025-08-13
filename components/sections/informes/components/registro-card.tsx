"use client"

import { Eye, Edit, Trash2, MapPin, User, Calendar, Weight } from "lucide-react"

interface Registro {
  id: string
  tipo: string
  categoria: string
  cantidad: number
  peso?: number
  usuario: string
  fecha: string
  descripcion: string
  ubicacion?: string
  lluvia_mm?: number
  proveedor?: string
  intensidad?: string
}

interface RegistroCardProps {
  registro: Registro
}

// Función para obtener el badge según el tipo
const getBadgeForType = (tipo: string) => {
  switch (tipo.toUpperCase()) {
    case "ENTRADA":
      return {
        icon: "🐮",
        label: "Entrada",
        bgColor: "bg-green-100",
        textColor: "text-green-800",
        borderColor: "border-green-200",
      }
    case "SALIDA":
      return {
        icon: "🚚",
        label: "Salida",
        bgColor: "bg-red-100",
        textColor: "text-red-800",
        borderColor: "border-red-200",
      }
    case "TRASLADO":
      return {
        icon: "🔄",
        label: "Traslado",
        bgColor: "bg-orange-100",
        textColor: "text-orange-800",
        borderColor: "border-orange-200",
      }
    case "CLIMA":
      return {
        icon: "🌧️",
        label: "Clima",
        bgColor: "bg-blue-100",
        textColor: "text-blue-800",
        borderColor: "border-blue-200",
      }
    case "NACIMIENTO":
      return {
        icon: "🐄",
        label: "Nacimiento",
        bgColor: "bg-amber-100",
        textColor: "text-amber-800",
        borderColor: "border-amber-200",
      }
    case "MORTANDAD":
      return {
        icon: "☠️",
        label: "Mortandad",
        bgColor: "bg-gray-100",
        textColor: "text-gray-800",
        borderColor: "border-gray-200",
      }
    case "SANIDAD":
      return {
        icon: "💉",
        label: "Sanidad",
        bgColor: "bg-purple-100",
        textColor: "text-purple-800",
        borderColor: "border-purple-200",
      }
    case "ALIMENTACIÓN":
      return {
        icon: "🌾",
        label: "ALIMENTACIÓN",
        bgColor: "bg-yellow-100",
        textColor: "text-yellow-800",
        borderColor: "border-yellow-200",
      }
    default:
      return {
        icon: "📝",
        label: tipo.toUpperCase(),
        bgColor: "bg-gray-100",
        textColor: "text-gray-800",
        borderColor: "border-gray-200",
      }
  }
}

// Función para generar descripción natural
const getDescripcionNatural = (registro: Registro) => {
  switch (registro.tipo.toUpperCase()) {
    case "ENTRADA":
      return `${registro.categoria} • ${registro.cantidad} cabezas${
        registro.peso ? ` • ${Math.round(registro.peso / registro.cantidad)} kg promedio` : ""
      }`
    case "SALIDA":
      return `${registro.categoria} • ${registro.cantidad} cabezas${
        registro.proveedor ? ` • ${registro.proveedor}` : ""
      }`
    case "TRASLADO":
      return `${registro.categoria} • ${registro.cantidad} unidades${
        registro.ubicacion ? ` • ${registro.ubicacion}` : ""
      }`
    case "CLIMA":
      return `${registro.descripcion}${registro.lluvia_mm ? ` • ${registro.lluvia_mm} mm` : ""}${
        registro.intensidad ? ` • ${registro.intensidad}` : ""
      }`
    case "NACIMIENTO":
      return `${registro.categoria} • ${registro.cantidad} nuevos nacimientos${
        registro.peso ? ` • ${Math.round(registro.peso / registro.cantidad)} kg promedio` : ""
      }`
    case "MORTANDAD":
      return `${registro.categoria} • ${registro.cantidad} animales${
        registro.descripcion ? ` • ${registro.descripcion}` : ""
      }`
    default:
      return `${registro.categoria} • ${registro.cantidad} unidades`
  }
}

export default function RegistroCard({ registro }: RegistroCardProps) {
  const badge = getBadgeForType(registro.tipo)
  const descripcionNatural = getDescripcionNatural(registro)

  const handleVer = () => {
    console.log("Ver registro:", registro.id)
  }

  const handleEditar = () => {
    console.log("Editar registro:", registro.id)
  }

  const handleEliminar = () => {
    console.log("Eliminar registro:", registro.id)
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-3 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        {/* Contenido principal */}
        <div className="flex-1">
          {/* Badge y fecha */}
          <div className="flex items-center gap-3 mb-2">
            <span
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${badge.bgColor} ${badge.textColor} ${badge.borderColor}`}
            >
              <span className="text-sm">{badge.icon}</span>
              {badge.label}
            </span>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Calendar className="h-3 w-3" />
              {registro.fecha}
            </div>
          </div>

          {/* Descripción natural */}
          <div className="mb-2">
            <p className="text-sm font-medium text-gray-900">{descripcionNatural}</p>
          </div>

          {/* Metadatos */}
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {registro.usuario}
            </div>
            {registro.ubicacion && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {registro.ubicacion}
              </div>
            )}
            {registro.peso && (
              <div className="flex items-center gap-1">
                <Weight className="h-3 w-3" />
                {registro.peso} kg total
              </div>
            )}
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex items-center gap-1 ml-4">
          <button
            onClick={handleVer}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors duration-200"
            title="Ver detalles"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={handleEditar}
            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors duration-200"
            title="Editar"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={handleEliminar}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
            title="Eliminar"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
