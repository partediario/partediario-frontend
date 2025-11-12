"use client"

import { useState, useEffect, useCallback } from "react"

export function useDebounceInput(initialValue: string = "", delay: number = 300) {
  const [value, setValue] = useState(initialValue)
  const [debouncedValue, setDebouncedValue] = useState(initialValue)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  const handleChange = useCallback((newValue: string) => {
    setValue(newValue)
  }, [])

  const reset = useCallback((newValue: string = "") => {
    setValue(newValue)
    setDebouncedValue(newValue)
  }, [])

  return {
    value,
    debouncedValue,
    handleChange,
    reset,
    setValue,
  }
}
