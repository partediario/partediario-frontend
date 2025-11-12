"use client"

import { useEffect, useState, useRef } from "react"

interface UseKeyboardAwareDrawerOptions {
  isOpen: boolean
  onClose?: () => void
}

export function useKeyboardAwareDrawer({ isOpen, onClose }: UseKeyboardAwareDrawerOptions) {
  const [isInputFocused, setIsInputFocused] = useState(false)
  const [preventClose, setPreventClose] = useState(false)
  const drawerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.getAttribute("contenteditable") === "true"
      ) {
        setIsInputFocused(true)
        setPreventClose(true)
      }
    }

    const handleFocusOut = (e: FocusEvent) => {
      const target = e.target as HTMLElement
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.getAttribute("contenteditable") === "true"
      ) {
        setTimeout(() => {
          setIsInputFocused(false)
          setPreventClose(false)
        }, 300)
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (isInputFocused && preventClose) {
        e.stopPropagation()
      }
    }

    document.addEventListener("focusin", handleFocusIn)
    document.addEventListener("focusout", handleFocusOut)
    document.addEventListener("touchmove", handleTouchMove, { passive: false })

    return () => {
      document.removeEventListener("focusin", handleFocusIn)
      document.removeEventListener("focusout", handleFocusOut)
      document.removeEventListener("touchmove", handleTouchMove)
    }
  }, [isOpen, isInputFocused, preventClose])

  const handleDrawerOpenChange = (open: boolean) => {
    if (!open && preventClose) {
      return
    }
    if (!open && onClose) {
      onClose()
    }
  }

  return {
    drawerRef,
    isInputFocused,
    preventClose,
    handleDrawerOpenChange,
    shouldDismiss: !preventClose,
  }
}
