import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number | string | null | undefined): string {
  if (num === null || num === undefined || num === "") return "0"
  const numValue = typeof num === "string" ? Number.parseFloat(num) : num
  if (isNaN(numValue)) return "0"
  return numValue.toLocaleString("es-AR")
}
