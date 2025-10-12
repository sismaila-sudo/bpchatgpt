/**
 * Tests unitaires pour le rate limiting
 */

import { rateLimit, RATE_LIMITS } from '../rateLimit'

describe('Rate Limiting', () => {
  beforeEach(() => {
    // Reset entre chaque test
    jest.clearAllMocks()
  })

  it('should allow requests within limit', () => {
    const result1 = rateLimit('test-user-1', { interval: 60000, limit: 3 })
    expect(result1.success).toBe(true)
    expect(result1.remaining).toBe(2)

    const result2 = rateLimit('test-user-1', { interval: 60000, limit: 3 })
    expect(result2.success).toBe(true)
    expect(result2.remaining).toBe(1)

    const result3 = rateLimit('test-user-1', { interval: 60000, limit: 3 })
    expect(result3.success).toBe(true)
    expect(result3.remaining).toBe(0)
  })

  it('should block requests exceeding limit', () => {
    // 3 requêtes OK
    rateLimit('test-user-2', { interval: 60000, limit: 3 })
    rateLimit('test-user-2', { interval: 60000, limit: 3 })
    rateLimit('test-user-2', { interval: 60000, limit: 3 })

    // 4ème requête bloquée
    const result = rateLimit('test-user-2', { interval: 60000, limit: 3 })
    expect(result.success).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('should reset after interval', async () => {
    const result1 = rateLimit('test-user-3', { interval: 100, limit: 1 })
    expect(result1.success).toBe(true)

    // Immédiatement après, bloqué
    const result2 = rateLimit('test-user-3', { interval: 100, limit: 1 })
    expect(result2.success).toBe(false)

    // Attendre 150ms
    await new Promise(resolve => setTimeout(resolve, 150))

    // Devrait être reset
    const result3 = rateLimit('test-user-3', { interval: 100, limit: 1 })
    expect(result3.success).toBe(true)
  })

  it('should isolate different users', () => {
    rateLimit('user-a', { interval: 60000, limit: 1 })
    rateLimit('user-a', { interval: 60000, limit: 1 }) // Bloqué

    // user-b devrait être OK
    const result = rateLimit('user-b', { interval: 60000, limit: 1 })
    expect(result.success).toBe(true)
  })

  it('should use predefined limits correctly', () => {
    const result = rateLimit('ai-user', RATE_LIMITS.AI_ANALYSIS)
    expect(result.limit).toBe(5) // 5 req/min pour AI Analysis
    expect(result.success).toBe(true)
  })
})

