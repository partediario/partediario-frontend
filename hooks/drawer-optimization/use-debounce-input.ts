"use client"

import { useState, useEffect, useCallback, useRef } from "react"

export function useDebounceInput(initialValue: string = "", delay: number = 300) {
  const [value, setValue] = useState(initialValue)
  const [debouncedValue, setDebouncedValue] = useState(initialValue)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    timerRef.current = handler

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  const handleChange = useCallback((newValue: string) => {
    setValue(newValue)
  }, [])

  const flush = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setDebouncedValue(value)
  }, [value])

  const reset = useCallback((newValue: string = "") => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setValue(newValue)
    setDebouncedValue(newValue)
  }, [])

  return {
    value,
    debouncedValue,
    handleChange,
    reset,
    setValue,
    flush,
  }
}
