"use client"

import { Sheet, SheetContent } from "@/components/ui/sheet"
import { useConfigNavigation } from "@/contexts/config-navigation-context"
import { cn } from "@/lib/utils"

interface ConfigSubSidebarLayoutProps {
  children: React.ReactNode
  className?: string
}

export function ConfigSubSidebarLayout({ children, className }: ConfigSubSidebarLayoutProps) {
  const { state, setSubSidebarOpen } = useConfigNavigation()

  return (
    <>
      {/* Mobile: Sheet overlay */}
      <div className="md:hidden">
        <Sheet open={state.isSubSidebarOpen} onOpenChange={setSubSidebarOpen}>
          <SheetContent side="left" className="w-64 p-0 bg-[#1F2427]">
            {children}
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop: Fixed sidebar */}
      <div className={cn("hidden md:block w-64 h-screen fixed left-0 top-0 z-10 overflow-y-auto bg-[#1F2427]", className)}>
        {children}
      </div>
    </>
  )
}
