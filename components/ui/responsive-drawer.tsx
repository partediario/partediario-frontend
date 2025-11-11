"use client"

import * as React from "react"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
} from "./drawer"

interface ResponsiveDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  title?: string
  description?: string
  footer?: React.ReactNode
  size?: "sm" | "md" | "lg" | "xl" | "full"
  className?: string
}

export function ResponsiveDrawer({
  open,
  onOpenChange,
  children,
  title,
  description,
  footer,
  size = "lg",
  className = "",
}: ResponsiveDrawerProps) {
  const sizeClass = {
    sm: "sm:max-w-sm",
    md: "sm:max-w-md",
    lg: "sm:max-w-lg",
    xl: "sm:max-w-xl",
    full: "sm:max-w-full",
  }[size]

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        className={`w-full h-[95vh] flex flex-col ${sizeClass} overflow-hidden ${className}`}
      >
        {(title || description) && (
          <DrawerHeader className="px-4 py-3 sm:px-6 sm:py-4 border-b shrink-0">
            {title && (
              <DrawerTitle className="text-lg sm:text-xl font-semibold">
                {title}
              </DrawerTitle>
            )}
            {description && (
              <DrawerDescription className="text-sm text-gray-600">
                {description}
              </DrawerDescription>
            )}
          </DrawerHeader>
        )}

        <div className="flex-1 overflow-y-auto px-4 py-3 sm:px-6 sm:py-4">
          {children}
        </div>

        {footer && (
          <DrawerFooter className="px-4 py-3 sm:px-6 sm:py-4 border-t shrink-0">
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:justify-end">
              {footer}
            </div>
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  )
}
