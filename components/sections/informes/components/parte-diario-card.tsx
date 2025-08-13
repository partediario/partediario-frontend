"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { User, Eye, Edit } from "lucide-react"
import type { ParteDiario } from "@/lib/types"
import { useState } from "react"
import ViewParteDrawer from "./view-parte-drawer"
import EditParteDrawer from "./editar-entrada-animales-drawer"
import { toast } from "@/components/ui/use-toast"
import EditSalidaDrawer from "./editar-salida-animales-drawer"
import EditLluviaDrawer from "./editar-lluvia-drawer"
import VerLluviaDrawer from "./ver-lluvia-drawer"
import VerActividadDrawer from "./ver-actividad-drawer"
import EditarActividadDrawer from "./editar-actividad-drawer"
import VerActividadInsumosDrawer from "./ver-actividad-insumos-drawer"
import EditarActividadInsumosDrawer from "./editar-actividad-insumos-drawer"
import VerActividadMixtaDrawer from "./ver-actividad-mixta-drawer"
import EditarActividadMixtaDrawer from "./editar-actividad-mixta-drawer"
import VerReclasificacionDrawer from "./ver-reclasificacion-drawer"
import VerTrasladoDrawer from "./ver-traslado-drawer"
import VerReloteoDrawer from "./ver-reloteo-drawer"
import VerEntradaInsumosDrawer from "./ver-entrada-insumos-drawer"
import VerSalidaInsumosDrawer from "./ver-salida-insumos-drawer"
import EditarEntradaInsumosDrawer from "./editar-entrada-insumos-drawer"
import EditarSalidaInsumosDrawer from "./editar-salida-insumos-drawer"
import { PermissionWrapper } from "@/components/permission-wrapper"

interface ParteDiarioCardProps {
  parte: ParteDiario
}

export default function ParteDiarioCard({ parte }: ParteDiarioCardProps) {
  const [isViewDrawerOpen, setIsViewDrawerOpen] = useState(false)
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false)
  const [isEditSalidaDrawerOpen, setIsEditSalidaDrawerOpen] = useState(false)
  const [isEditLluviaDrawerOpen, setIsEditLluviaDrawerOpen] = useState(false)
  const [isVerLluviaDrawerOpen, setIsVerLluviaDrawerOpen] = useState(false)
  const [isVerActividadDrawerOpen, setIsVerActividadDrawerOpen] = useState(false)
  const [isEditarActividadDrawerOpen, setIsEditarActividadDrawerOpen] = useState(false)
  const [isVerActividadInsumosDrawerOpen, setIsVerActividadInsumosDrawerOpen] = useState(false)
  const [isEditarActividadInsumosDrawerOpen, setIsEditarActividadInsumosDrawerOpen] = useState(false)
  const [isVerActividadMixtaDrawerOpen, setIsVerActividadMixtaDrawerOpen] = useState(false)
  const [isEditarActividadMixtaDrawerOpen, setIsEditarActividadMixtaDrawerOpen] = useState(false)
  const [isVerReclasificacionDrawerOpen, setIsVerReclasificacionDrawerOpen] = useState(false)
  const [isVerTrasladoDrawerOpen, setIsVerTrasladoDrawerOpen] = useState(false)
  const [isVerReloteoDrawerOpen, setIsVerReloteoDrawerOpen] = useState(false)

  // Nuevos estados para drawers de insumos
  const [isVerEntradaInsumosDrawerOpen, setIsVerEntradaInsumosDrawerOpen] = useState(false)
  const [isEditarEntradaInsumosDrawerOpen, setIsEditarEntradaInsumosDrawerOpen] = useState(false)
  const [isVerSalidaInsumosDrawerOpen, setIsVerSalidaInsumosDrawerOpen] = useState(false)
  const [isEditarSalidaInsumosDrawerOpen, setIsEditarSalidaInsumosDrawerOpen] = useState(false)

  const [tipoActividad, setTipoActividad] = useState<{ animales: string; insumos: string } | null>(null)

  const formatDate = (dateStr: string) => {
    try {
      // Si la fecha viene en formato YYYY-MM-DD, la parseamos directamente
      // sin crear un objeto Date que pueda cambiar por zona horaria
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateStr.split("-")
        return `${day}/${month}/${year}`
      }

      // Para otros formatos, usamos Date pero forzamos la interpretación local
      const date = new Date(dateStr + "T00:00:00")
      return date.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    } catch {
      return dateStr
    }
  }

  const formatTime = (timeStr: string) => {
    try {
      return timeStr.slice(0, 5) // HH:MM format
    } catch {
      return timeStr || ""
    }
  }

  const getBadgeColor = (tipo: string) => {
    switch (tipo?.toUpperCase()) {
      case "ENTRADA":
        return "bg-green-100 text-green-800 hover:bg-green-200 border-green-200"
      case "SALIDA":
        return "bg-red-100 text-red-800 hover:bg-red-200 border-red-200"
      case "CLIMA":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200"
      case "ACTIVIDAD":
        return "bg-purple-100 text-purple-800 hover:bg-purple-200 border-purple-200"
      case "RECLASIFICACION":
        return "bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-200"
      case "INSUMOS":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200"
      case "TRASLADO":
        return "bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-200"
      case "RELOTEO":
        return "bg-teal-100 text-teal-800 hover:bg-teal-200 border-teal-200"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200"
    }
  }

  const formatTipoDisplay = (tipo: string) => {
    if (!tipo) return "Sin tipo"

    switch (tipo.toUpperCase()) {
      case "ENTRADA":
        return "Entrada"
      case "SALIDA":
        return "Salida"
      case "CLIMA":
        return "Clima"
      case "ACTIVIDAD":
        return "Actividad"
      case "RECLASIFICACION":
        return "Reclasificación"
      case "INSUMOS":
        return "Insumos"
      case "TRASLADO":
        return "Traslado"
      case "RELOTEO":
        return "Reloteo"
      default:
        return tipo
    }
  }

  // Get user display name with proper fallbacks
  const getUserDisplayName = () => {
    if (parte.pd_usuario_nombres && parte.pd_usuario_apellidos) {
      return `${parte.pd_usuario_nombres} ${parte.pd_usuario_apellidos}`
    }
    if (parte.pd_usuario_nombres) {
      return parte.pd_usuario_nombres
    }
    if (parte.pd_usuario) {
      return parte.pd_usuario
    }
    return "Usuario desconocido"
  }

  const fetchTipoActividad = async (detalleId: number) => {
    try {
      const response = await fetch(`/api/tipos-actividades/${detalleId}`)
      if (response.ok) {
        const data = await response.json()
        setTipoActividad(data)
        return data
      }
    } catch (error) {
      console.error("Error al obtener tipo de actividad:", error)
    }
    return null
  }

  const handleView = async (parte: ParteDiario) => {
    console.log("Ver parte diario:", parte)

    if (parte.pd_tipo === "CLIMA") {
      setIsVerLluviaDrawerOpen(true)
    } else if (parte.pd_tipo === "INSUMOS") {
      // Determinar si es entrada o salida basándose en detalle_direccion
      const direccion = parte.pd_detalles?.detalle_direccion
      if (direccion === "ENTRADA") {
        setIsVerEntradaInsumosDrawerOpen(true)
      } else if (direccion === "SALIDA") {
        setIsVerSalidaInsumosDrawerOpen(true)
      } else {
        // Fallback: usar el primer drawer de entrada si no hay dirección
        setIsVerEntradaInsumosDrawerOpen(true)
      }
    } else if (parte.pd_tipo === "ACTIVIDAD" && parte.pd_detalles?.detalle_tipo_id) {
      const tipo = await fetchTipoActividad(parte.pd_detalles.detalle_tipo_id)
      if (tipo) {
        // Actividad mixta: ambos animales e insumos son OBLIGATORIO o OPCIONAL
        if (
          (tipo.animales === "OBLIGATORIO" || tipo.animales === "OPCIONAL") &&
          (tipo.insumos === "OBLIGATORIO" || tipo.insumos === "OPCIONAL")
        ) {
          setIsVerActividadMixtaDrawerOpen(true)
        }
        // Solo animales
        else if ((tipo.animales === "OBLIGATORIO" || tipo.animales === "OPCIONAL") && tipo.insumos === "NO APLICA") {
          setIsVerActividadDrawerOpen(true)
        }
        // Solo insumos
        else if (tipo.animales === "NO APLICA" && (tipo.insumos === "OBLIGATORIO" || tipo.insumos === "OPCIONAL")) {
          setIsVerActividadInsumosDrawerOpen(true)
        } else {
          setIsVerActividadDrawerOpen(true) // fallback
        }
      } else {
        setIsVerActividadDrawerOpen(true) // fallback
      }
    } else if (parte.pd_tipo === "RECLASIFICACION") {
      setIsVerReclasificacionDrawerOpen(true)
    } else if (parte.pd_tipo === "TRASLADO") {
      setIsVerTrasladoDrawerOpen(true)
    } else if (parte.pd_tipo === "RELOTEO") {
      setIsVerReloteoDrawerOpen(true)
    } else {
      setIsViewDrawerOpen(true)
    }
  }

  const handleEdit = async (parte: ParteDiario) => {
    if (
      parte.pd_tipo !== "ENTRADA" &&
      parte.pd_tipo !== "SALIDA" &&
      parte.pd_tipo !== "CLIMA" &&
      parte.pd_tipo !== "ACTIVIDAD" &&
      parte.pd_tipo !== "INSUMOS"
    ) {
      toast({
        title: "Función no disponible",
        description:
          "La edición solo está disponible para partes diarios de tipo ENTRADA, SALIDA, CLIMA, ACTIVIDAD e INSUMOS",
        variant: "destructive",
      })
      return
    }

    console.log("Editar parte diario:", parte)

    if (parte.pd_tipo === "ENTRADA") {
      setIsEditDrawerOpen(true)
    } else if (parte.pd_tipo === "SALIDA") {
      setIsEditSalidaDrawerOpen(true)
    } else if (parte.pd_tipo === "CLIMA") {
      setIsEditLluviaDrawerOpen(true)
    } else if (parte.pd_tipo === "INSUMOS") {
      // Determinar si es entrada o salida basándose en detalle_direccion
      const direccion = parte.pd_detalles?.detalle_direccion
      if (direccion === "ENTRADA") {
        setIsEditarEntradaInsumosDrawerOpen(true)
      } else if (direccion === "SALIDA") {
        setIsEditarSalidaInsumosDrawerOpen(true)
      } else {
        toast({
          title: "Error",
          description: "No se pudo determinar el tipo de movimiento de insumo",
          variant: "destructive",
        })
      }
    } else if (parte.pd_tipo === "ACTIVIDAD" && parte.pd_detalles?.detalle_tipo_id) {
      const tipo = await fetchTipoActividad(parte.pd_detalles.detalle_tipo_id)
      if (tipo) {
        // Actividad mixta: ambos animales e insumos son OBLIGATORIO o OPCIONAL
        if (
          (tipo.animales === "OBLIGATORIO" || tipo.animales === "OPCIONAL") &&
          (tipo.insumos === "OBLIGATORIO" || tipo.insumos === "OPCIONAL")
        ) {
          setIsEditarActividadMixtaDrawerOpen(true)
        }
        // Solo animales
        else if ((tipo.animales === "OBLIGATORIO" || tipo.animales === "OPCIONAL") && tipo.insumos === "NO APLICA") {
          setIsEditarActividadDrawerOpen(true)
        }
        // Solo insumos
        else if (tipo.animales === "NO APLICA" && (tipo.insumos === "OBLIGATORIO" || tipo.insumos === "OPCIONAL")) {
          setIsEditarActividadInsumosDrawerOpen(true)
        } else {
          setIsEditarActividadDrawerOpen(true) // fallback
        }
      } else {
        setIsEditarActividadDrawerOpen(true) // fallback
      }
    }
  }

  return (
    <Card className="mb-4 hover:shadow-sm transition-shadow border border-gray-200">
      <CardContent className="p-4">
        {/* Header with badge, date/time and action buttons */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className={`${getBadgeColor(parte.pd_tipo || "")} font-medium text-xs px-2 py-1`}>
              {formatTipoDisplay(parte.pd_tipo || "")}
            </Badge>
            <span className="text-sm text-gray-600 font-medium">
              {formatDate(parte.pd_fecha)} {formatTime(parte.pd_hora)}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {/* Botón Ver - siempre visible */}
            <button
              onClick={() => handleView(parte)}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              title="Ver detalle"
            >
              <Eye className="h-4 w-4 text-gray-600" />
            </button>

            {/* Botón Editar - solo para usuarios que pueden editar */}
            <PermissionWrapper hideForConsultor={true}>
              {(parte.pd_tipo === "ENTRADA" ||
                parte.pd_tipo === "SALIDA" ||
                parte.pd_tipo === "CLIMA" ||
                parte.pd_tipo === "ACTIVIDAD" ||
                parte.pd_tipo === "INSUMOS") && (
                <button
                  onClick={() => handleEdit(parte)}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                  title="Editar"
                >
                  <Edit className="h-4 w-4 text-gray-600" />
                </button>
              )}
            </PermissionWrapper>
          </div>
        </div>

        {/* Main description */}
        <div className="mb-3">
          <h3 className="text-gray-900 font-medium text-base leading-relaxed mb-1">
            {parte.pd_descripcion || "Sin descripción"}
          </h3>
          {parte.pd_nota && <p className="text-gray-600 text-sm leading-relaxed">{parte.pd_nota}</p>}
        </div>

        {/* User info only - SIN ESTABLECIMIENTO */}
        <div className="flex items-center text-sm text-gray-500">
          <div className="flex items-center gap-1.5">
            <User className="h-4 w-4" />
            <span>{getUserDisplayName()}</span>
          </div>
        </div>
      </CardContent>

      {/* Drawers existentes */}
      <ViewParteDrawer isOpen={isViewDrawerOpen} onClose={() => setIsViewDrawerOpen(false)} parte={parte} />
      <EditParteDrawer
        isOpen={isEditDrawerOpen}
        onClose={() => setIsEditDrawerOpen(false)}
        parte={parte}
        onSuccess={() => {
          window.dispatchEvent(new CustomEvent("reloadPartesDiarios"))
        }}
      />
      <EditSalidaDrawer
        isOpen={isEditSalidaDrawerOpen}
        onClose={() => setIsEditSalidaDrawerOpen(false)}
        parte={parte}
        onSuccess={() => {
          window.dispatchEvent(new CustomEvent("reloadPartesDiarios"))
        }}
      />
      <EditLluviaDrawer
        isOpen={isEditLluviaDrawerOpen}
        onClose={() => setIsEditLluviaDrawerOpen(false)}
        parte={parte}
        onSuccess={() => {
          window.dispatchEvent(new CustomEvent("reloadPartesDiarios"))
        }}
      />

      {/* Drawer específico para ver lluvia */}
      <VerLluviaDrawer isOpen={isVerLluviaDrawerOpen} onClose={() => setIsVerLluviaDrawerOpen(false)} parte={parte} />

      {/* Drawers de actividad */}
      <VerActividadDrawer
        isOpen={isVerActividadDrawerOpen}
        onClose={() => setIsVerActividadDrawerOpen(false)}
        parte={parte}
      />
      <EditarActividadDrawer
        isOpen={isEditarActividadDrawerOpen}
        onClose={() => setIsEditarActividadDrawerOpen(false)}
        parte={parte}
        onSuccess={() => {
          window.dispatchEvent(new CustomEvent("reloadPartesDiarios"))
        }}
      />

      {/* Drawers de actividad insumos */}
      <VerActividadInsumosDrawer
        isOpen={isVerActividadInsumosDrawerOpen}
        onClose={() => setIsVerActividadInsumosDrawerOpen(false)}
        parte={parte}
      />
      <EditarActividadInsumosDrawer
        isOpen={isEditarActividadInsumosDrawerOpen}
        onClose={() => setIsEditarActividadInsumosDrawerOpen(false)}
        parte={parte}
        onSuccess={() => {
          window.dispatchEvent(new CustomEvent("reloadPartesDiarios"))
        }}
      />

      {/* Drawers de actividad mixta */}
      <VerActividadMixtaDrawer
        isOpen={isVerActividadMixtaDrawerOpen}
        onClose={() => setIsVerActividadMixtaDrawerOpen(false)}
        parte={parte}
      />
      <EditarActividadMixtaDrawer
        isOpen={isEditarActividadMixtaDrawerOpen}
        onClose={() => setIsEditarActividadMixtaDrawerOpen(false)}
        parte={parte}
        onSuccess={() => {
          window.dispatchEvent(new CustomEvent("reloadPartesDiarios"))
        }}
      />

      {/* Drawer de reclasificación */}
      <VerReclasificacionDrawer
        isOpen={isVerReclasificacionDrawerOpen}
        onClose={() => setIsVerReclasificacionDrawerOpen(false)}
        parte={parte}
      />

      <VerTrasladoDrawer
        isOpen={isVerTrasladoDrawerOpen}
        onClose={() => setIsVerTrasladoDrawerOpen(false)}
        parte={parte}
      />

      {/* Drawer de reloteo */}
      <VerReloteoDrawer
        isOpen={isVerReloteoDrawerOpen}
        onClose={() => setIsVerReloteoDrawerOpen(false)}
        parte={parte}
      />

      {/* NUEVOS DRAWERS DE INSUMOS */}

      {/* Drawers para VER insumos */}
      <VerEntradaInsumosDrawer
        isOpen={isVerEntradaInsumosDrawerOpen}
        onClose={() => setIsVerEntradaInsumosDrawerOpen(false)}
        parte={parte}
      />
      <VerSalidaInsumosDrawer
        isOpen={isVerSalidaInsumosDrawerOpen}
        onClose={() => setIsVerSalidaInsumosDrawerOpen(false)}
        parte={parte}
      />

      {/* Drawers para EDITAR insumos */}
      <EditarEntradaInsumosDrawer
        isOpen={isEditarEntradaInsumosDrawerOpen}
        onClose={() => setIsEditarEntradaInsumosDrawerOpen(false)}
        parte={parte}
        onSuccess={() => {
          window.dispatchEvent(new CustomEvent("reloadPartesDiarios"))
        }}
      />
      <EditarSalidaInsumosDrawer
        isOpen={isEditarSalidaInsumosDrawerOpen}
        onClose={() => setIsEditarSalidaInsumosDrawerOpen(false)}
        parte={parte}
        onSuccess={() => {
          window.dispatchEvent(new CustomEvent("reloadPartesDiarios"))
        }}
      />
    </Card>
  )
}
