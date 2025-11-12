"use client"

import React, { createContext, useContext, useState, useCallback, useEffect } from "react"

interface CacheEntry<T> {
  data: T
  timestamp: number
}

interface DataCacheContextType {
  getCachedData: <T>(key: string) => T | null
  setCachedData: <T>(key: string, data: T) => void
  invalidateCache: (key: string) => void
  clearCache: () => void
}

const DataCacheContext = createContext<DataCacheContextType | undefined>(undefined)

const CACHE_TTL = 5 * 60 * 1000

export function DataCacheProvider({ children }: { children: React.ReactNode }) {
  const [cache, setCache] = useState<Map<string, CacheEntry<any>>>(new Map())

  const getCachedData = useCallback(
    <T,>(key: string): T | null => {
      const entry = cache.get(key)
      if (!entry) return null

      const now = Date.now()
      if (now - entry.timestamp > CACHE_TTL) {
        setCache((prev) => {
          const newCache = new Map(prev)
          newCache.delete(key)
          return newCache
        })
        return null
      }

      return entry.data as T
    },
    [cache],
  )

  const setCachedData = useCallback(<T,>(key: string, data: T) => {
    setCache((prev) => {
      const newCache = new Map(prev)
      newCache.set(key, {
        data,
        timestamp: Date.now(),
      })
      return newCache
    })
  }, [])

  const invalidateCache = useCallback((key: string) => {
    setCache((prev) => {
      const newCache = new Map(prev)
      newCache.delete(key)
      return newCache
    })
  }, [])

  const clearCache = useCallback(() => {
    setCache(new Map())
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      setCache((prev) => {
        const newCache = new Map(prev)
        let hasExpired = false

        for (const [key, entry] of newCache.entries()) {
          if (now - entry.timestamp > CACHE_TTL) {
            newCache.delete(key)
            hasExpired = true
          }
        }

        return hasExpired ? newCache : prev
      })
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  return (
    <DataCacheContext.Provider
      value={{
        getCachedData,
        setCachedData,
        invalidateCache,
        clearCache,
      }}
    >
      {children}
    </DataCacheContext.Provider>
  )
}

export function useDataCache() {
  const context = useContext(DataCacheContext)
  if (!context) {
    throw new Error("useDataCache must be used within DataCacheProvider")
  }
  return context
}
