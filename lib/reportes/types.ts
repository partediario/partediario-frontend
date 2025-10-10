export interface ReportTemplate {
  id: string
  name: string
  description: string
  module: "LLUVIA" | "MOVIMIENTOS" | "INSUMOS" | "EJECUTIVO"
  tags?: string[]
  defaultParams?: any
  layoutSchema?: any
}

export interface ReportDefinition {
  id: string
  name: string
  module: string
  templateId?: string
  ownerId: string
  params: any
  layoutSchema: any
  updatedAt: string
}

export interface ReportSchedule {
  id: string
  reportDefinitionId: string
  rrule: string
  timezone: string
  recipients: {
    emails: string[]
    whatsapps: string[]
  }
  format: "PDF" | "XLSX" | "CSV"
  active: boolean
}
