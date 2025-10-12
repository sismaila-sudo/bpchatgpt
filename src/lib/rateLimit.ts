/**
 * Rate Limiting simple en mémoire
 * Pour production, utiliser Redis/Upstash
 */

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const store: RateLimitStore = {}

// Nettoyer le store toutes les 10 minutes
setInterval(() => {
  const now = Date.now()
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key]
    }
  })
}, 10 * 60 * 1000)

export interface RateLimitOptions {
  interval: number // en millisecondes
  limit: number     // nombre de requêtes max
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

/**
 * Vérifie le rate limit pour un identifiant
 */
export function rateLimit(
  identifier: string,
  options: RateLimitOptions = { interval: 60000, limit: 10 } // 10 req/min par défaut
): RateLimitResult {
  const now = Date.now()
  const key = `rate_limit_${identifier}`

  // Si pas d'entrée ou expirée, créer nouvelle
  if (!store[key] || store[key].resetTime < now) {
    store[key] = {
      count: 1,
      resetTime: now + options.interval
    }

    return {
      success: true,
      limit: options.limit,
      remaining: options.limit - 1,
      reset: store[key].resetTime
    }
  }

  // Incrémenter le compteur
  store[key].count++

  // Vérifier si limite dépassée
  if (store[key].count > options.limit) {
    return {
      success: false,
      limit: options.limit,
      remaining: 0,
      reset: store[key].resetTime
    }
  }

  return {
    success: true,
    limit: options.limit,
    remaining: options.limit - store[key].count,
    reset: store[key].resetTime
  }
}

/**
 * Obtenir l'identifiant depuis la requête (IP ou user ID)
 */
export function getIdentifier(request: Request): string {
  // Essayer d'obtenir l'IP
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : 
             request.headers.get('x-real-ip') || 
             'unknown'

  return ip
}

/**
 * Rate limits préconfiguré par type d'API
 */
export const RATE_LIMITS = {
  AI_GENERATION: { interval: 60000, limit: 10 },     // 10 req/min
  AI_ANALYSIS: { interval: 60000, limit: 5 },        // 5 req/min (plus coûteux)
  DOCUMENT_UPLOAD: { interval: 60000, limit: 20 },   // 20 req/min
  DEFAULT: { interval: 60000, limit: 30 }            // 30 req/min
} as const

