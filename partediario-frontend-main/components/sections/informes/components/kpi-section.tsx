"use client"

interface KpiData {
  nacimientos: number
  compra: number
  venta: number
  lluviaTotal: string
}

export default function KpiSection() {
  // Placeholder data - esto se reemplazará con datos reales de Supabase
  const kpi: KpiData = {
    nacimientos: 0,
    compra: 341,
    venta: 0,
    lluviaTotal: "710 mm",
  }

  return (
    
  )
}

interface KpiCardProps {
  title: string
  value: string
}

function KpiCard({ title, value }: KpiCardProps) {
  return (
    <div
      className="p-4 rounded-lg shadow-sm flex flex-col items-center justify-center min-w-[120px]"
      style={{ backgroundColor: "#F0F2F2" }}
    >
      <span className="text-2xl font-bold" style={{ color: "#708D3E" }}>
        {value}
      </span>
      <span className="text-xs text-center font-medium mt-1" style={{ color: "#708D3E" }}>
        {title}
      </span>
    </div>
  )
}
