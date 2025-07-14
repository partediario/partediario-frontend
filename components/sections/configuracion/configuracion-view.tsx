"use client"

import { useState } from "react"
import { ConfigurationTabs } from "./configuration-tabs"

export function ConfiguracionView() {
  const [activeTab, setActiveTab] = useState("datos-empresa")

  return <ConfigurationTabs activeTab={activeTab} onTabChange={setActiveTab} />
}

export default ConfiguracionView
