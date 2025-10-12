/**
 * Hook de caching API intelligent
 * 
 * Réduit les appels API coûteux (OpenAI, Pinecone) en mémorisant les résultats
 * avec gestion du Time-To-Live (TTL) et invalidation manuelle
 */

import { useState, useEffect, useCallback, useRef } from 'react'

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

interface UseAPICacheOptions {
  /**
   * Durée de vie du cache en millisecondes
   * @default 5 minutes (300000 ms)
   */
  ttl?: number
  
  /**
   * Clé de stockage (pour localStorage)
   * Si fournie, le cache persiste entre les sessions
   */
  storageKey?: string
  
  /**
   * Désactiver le cache (utile pour debug)
   * @default false
   */
  disabled?: number
}

// Cache en mémoire global (partagé entre composants)
const memoryCache = new Map<string, CacheEntry<any>>()

/**
 * Hook de caching API avec TTL et localStorage optionnel
 */
export function useAPICache<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>,
  options: UseAPICacheOptions = {}
) {
  const {
    ttl = 5 * 60 * 1000, // 5 minutes par défaut
    storageKey,
    disabled = false
  } = options

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  // Référence pour éviter les re-fetches multiples
  const abortControllerRef = useRef<AbortController | null>(null)

  /**
   * Vérifie si le cache est valide
   */
  const isCacheValid = useCallback((entry: CacheEntry<T> | null): boolean => {
    if (!entry || disabled) return false
    const now = Date.now()
    return (now - entry.timestamp) < entry.ttl
  }, [disabled])

  /**
   * Récupère les données du cache (mémoire ou localStorage)
   */
  const getCachedData = useCallback((): T | null => {
    // Cache mémoire en priorité
    const memEntry = memoryCache.get(cacheKey)
    if (memEntry && isCacheValid(memEntry)) {
      return memEntry.data
    }

    // localStorage en second
    if (storageKey && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(storageKey)
        if (stored) {
          const entry: CacheEntry<T> = JSON.parse(stored)
          if (isCacheValid(entry)) {
            // Restaurer aussi dans le cache mémoire
            memoryCache.set(cacheKey, entry)
            return entry.data
          }
        }
      } catch (err) {
        console.warn('Erreur lecture cache localStorage:', err)
      }
    }

    return null
  }, [cacheKey, storageKey, isCacheValid])

  /**
   * Sauvegarde les données dans le cache
   */
  const setCachedData = useCallback((newData: T) => {
    const entry: CacheEntry<T> = {
      data: newData,
      timestamp: Date.now(),
      ttl
    }

    // Cache mémoire
    memoryCache.set(cacheKey, entry)

    // localStorage si demandé
    if (storageKey && typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey, JSON.stringify(entry))
      } catch (err) {
        console.warn('Erreur écriture cache localStorage:', err)
      }
    }
  }, [cacheKey, storageKey, ttl])

  /**
   * Fetch les données (avec ou sans cache)
   */
  const fetchData = useCallback(async (force = false) => {
    // Vérifier le cache d'abord
    if (!force && !disabled) {
      const cached = getCachedData()
      if (cached) {
        setData(cached)
        return cached
      }
    }

    // Annuler la requête précédente si elle existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()
    setLoading(true)
    setError(null)

    try {
      const result = await fetchFn()
      setCachedData(result)
      setData(result)
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur inconnue')
      setError(error)
      throw error
    } finally {
      setLoading(false)
      abortControllerRef.current = null
    }
  }, [fetchFn, disabled, getCachedData, setCachedData])

  /**
   * Invalider le cache manuellement
   */
  const invalidateCache = useCallback(() => {
    memoryCache.delete(cacheKey)
    if (storageKey && typeof window !== 'undefined') {
      localStorage.removeItem(storageKey)
    }
    setData(null)
  }, [cacheKey, storageKey])

  /**
   * Rafraîchir les données (force fetch)
   */
  const refresh = useCallback(() => {
    return fetchData(true)
  }, [fetchData])

  // Charger les données au montage
  useEffect(() => {
    fetchData()
  }, []) // On ne dépend PAS de fetchData pour éviter les boucles

  return {
    data,
    loading,
    error,
    refresh,
    invalidateCache,
    isCached: !!getCachedData()
  }
}

/**
 * Hook simplifié pour les requêtes OpenAI (coûteuses)
 * Cache de 30 minutes par défaut
 */
export function useOpenAICache<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>
) {
  return useAPICache(cacheKey, fetchFn, {
    ttl: 30 * 60 * 1000, // 30 minutes
    storageKey: `openai_cache_${cacheKey}`
  })
}

/**
 * Hook simplifié pour les requêtes Pinecone
 * Cache de 15 minutes par défaut
 */
export function usePineconeCache<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>
) {
  return useAPICache(cacheKey, fetchFn, {
    ttl: 15 * 60 * 1000, // 15 minutes
    storageKey: `pinecone_cache_${cacheKey}`
  })
}

/**
 * Utilitaire pour nettoyer tout le cache
 */
export function clearAllCache() {
  memoryCache.clear()
  if (typeof window !== 'undefined') {
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith('openai_cache_') || key.startsWith('pinecone_cache_')) {
        localStorage.removeItem(key)
      }
    })
  }
}

