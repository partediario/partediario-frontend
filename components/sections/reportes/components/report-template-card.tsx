"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye } from "lucide-react"
import type { ReportTemplate } from "@/lib/reportes/types"

interface ReportTemplateCardProps {
  template: ReportTemplate
  onUse: () => void
}

export function ReportTemplateCard({ template, onUse }: ReportTemplateCardProps) {
  const getModuleBadgeColor = (module: string) => {
    switch (module) {
      case "LLUVIA":
        return "bg-blue-100 text-blue-700 border-blue-200"
      case "MOVIMIENTOS":
        return "bg-green-100 text-green-700 border-green-200"
      case "INSUMOS":
        return "bg-orange-100 text-orange-700 border-orange-200"
      case "EJECUTIVO":
        return "bg-purple-100 text-purple-700 border-purple-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  const getModuleLabel = (module: string) => {
    switch (module) {
      case "LLUVIA":
        return "Clima"
      case "MOVIMIENTOS":
        return "Ganadería"
      case "INSUMOS":
        return "Insumos"
      case "EJECUTIVO":
        return "Ejecutivo"
      default:
        return module
    }
  }

  return (
    <Card className="hover:shadow-lg transition-shadow border-2">
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <CardTitle className="text-lg">{template.name}</CardTitle>
        </div>
        <CardDescription className="mt-2">{template.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="outline" className={getModuleBadgeColor(template.module)}>
            {getModuleLabel(template.module)}
          </Badge>
        </div>
        <Button onClick={onUse} className="w-full bg-black hover:bg-gray-800">
          <Eye className="h-4 w-4 mr-2" />
          Ver / Generar
        </Button>
      </CardContent>
    </Card>
  )
}
