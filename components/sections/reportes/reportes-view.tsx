"use client"

import { useState } from "react"
import { ReportTemplateCard } from "./components/report-template-card"
import { EmptyState } from "./components/empty-state"
import { ReportDrawer } from "./components/report-drawer"
import { mockReportTemplates } from "@/lib/reportes/mocks"
import type { ReportTemplate } from "@/lib/reportes/types"

export default function ReportesView() {
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null)
  const [showWizard, setShowWizard] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const handleUseTemplate = (template: ReportTemplate) => {
    setSelectedTemplate(template)
    setIsDrawerOpen(true)
  }

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false)
    setSelectedTemplate(null)
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reportes</h1>
          <p className="text-gray-600">Elige un reporte y aplica filtros básicos para ver y exportar la información.</p>
        </div>

        {/* Report Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mockReportTemplates.map((template) => (
            <ReportTemplateCard key={template.id} template={template} onUse={() => handleUseTemplate(template)} />
          ))}
        </div>

        {/* Empty State (opcional, para cuando no hay reportes) */}
        {mockReportTemplates.length === 0 && (
          <EmptyState
            title="No hay reportes disponibles"
            description="Comienza creando tu primer reporte personalizado"
            actionLabel="Crear reporte"
            onAction={() => setShowWizard(true)}
          />
        )}

        <ReportDrawer isOpen={isDrawerOpen} onClose={handleCloseDrawer} template={selectedTemplate} />
      </div>
    </div>
  )
}
