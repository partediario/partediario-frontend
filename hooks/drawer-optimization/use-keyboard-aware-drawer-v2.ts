"use client"

import { useEffect, useState, useRef, useCallback } from "react"

interface UseKeyboardAwareDrawerOptions {
  isOpen: boolean
}

export function useKeyboardAwareDrawer({ isOpen }: UseKeyboardAwareDrawerOptions) {
  const [isInputFocused, setIsInputFocused] = useState(false)
  const drawerContentRef = useRef<HTMLDivElement>(null)
  const focusedElementRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!isOpen) {
      setIsInputFocused(false)
      focusedElementRef.current = null
      return
    }

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.getAttribute("contenteditable") === "true"
      ) {
        setIsInputFocused(true)
        focusedElementRef.current = target
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
          if (document.activeElement !== focusedElementRef.current) {
            setIsInputFocused(false)
            focusedElementRef.current = null
          }
        }, 100)
      }
    }

    document.addEventListener("focusin", handleFocusIn)
    document.addEventListener("focusout", handleFocusOut)

    return () => {
      document.removeEventListener("focusin", handleFocusIn)
      document.removeEventListener("focusout", handleFocusOut)
    }
  }, [isOpen])

  const handleInteractOutside = useCallback(
    (e: Event) => {
      if (isInputFocused) {
        e.preventDefault()
      }
    },
    [isInputFocused],
  )

  const handlePointerDownOutside = useCallback(
    (e: Event) => {
      if (isInputFocused) {
        e.preventDefault()
      }
    },
    [isInputFocused],
  )

  return {
    drawerContentRef,
    isInputFocused,
    handleInteractOutside,
    handlePointerDownOutside,
  }
}
