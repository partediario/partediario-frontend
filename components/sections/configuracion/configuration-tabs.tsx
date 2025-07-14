"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DatosEmpresa } from "./tabs/datos-empresa"
import { Establecimientos } from "./tabs/establecimientos"
import { CategoriaAnimales } from "./tabs/categoria-animales"
import { Potreros } from "./tabs/potreros"
import { Lotes } from "./tabs/lotes"
import { Usuarios } from "./tabs/usuarios"
import { PermissionWrapper } from "@/components/permission-wrapper"

interface ConfigurationTabsProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function ConfigurationTabs({ activeTab, onTabChange }: ConfigurationTabsProps) {
  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Configuración</h1>
        <p className="text-slate-600">Gestiona los datos base de tu empresa agropecuaria</p>
      </div>

      <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-6 mb-6">
          <TabsTrigger value="datos-empresa">Datos de empresa</TabsTrigger>
          <TabsTrigger value="establecimientos">Establecimientos</TabsTrigger>
          <TabsTrigger value="categoria-animales">Categoría Animales</TabsTrigger>
          <TabsTrigger value="potreros">Potreros</TabsTrigger>
          <TabsTrigger value="lotes">Lotes</TabsTrigger>

          {/* Tab Usuarios - solo visible para usuarios que pueden ver usuarios */}
          <PermissionWrapper requirePermission="canViewUsers">
            <TabsTrigger value="usuarios">Usuarios</TabsTrigger>
          </PermissionWrapper>
        </TabsList>

        <TabsContent value="datos-empresa">
          <DatosEmpresa />
        </TabsContent>

        <TabsContent value="establecimientos">
          <Establecimientos />
        </TabsContent>

        <TabsContent value="categoria-animales">
          <CategoriaAnimales />
        </TabsContent>

        <TabsContent value="potreros">
          <Potreros />
        </TabsContent>

        <TabsContent value="lotes">
          <Lotes />
        </TabsContent>

        {/* Contenido Usuarios - solo visible para usuarios que pueden ver usuarios */}
        <PermissionWrapper requirePermission="canViewUsers">
          <TabsContent value="usuarios">
            <Usuarios />
          </TabsContent>
        </PermissionWrapper>
      </Tabs>
    </div>
  )
}
