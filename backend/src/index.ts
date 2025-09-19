import Fastify from 'fastify'
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import jwt from '@fastify/jwt'
import env from '@fastify/env'

import { mvpCalculationRoutes } from './routes/mvp-calculations'
import { simpleCalcRoutes } from './routes/simple-calc'

const schema = {
  type: 'object',
  required: ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY'],
  properties: {
    SUPABASE_URL: { type: 'string' },
    SUPABASE_SERVICE_KEY: { type: 'string' },
    JWT_SECRET: { type: 'string', default: 'your-secret-key' },
    REDIS_URL: { type: 'string', default: 'redis://localhost:6379' },
    PORT: { type: 'string', default: '3002' }
  }
}

async function buildApp() {
  const fastify = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'development' ? 'info' : 'warn'
    }
  })

  // Register environment variables
  await fastify.register(env, {
    schema,
    dotenv: true
  })

  // Register CORS
  await fastify.register(cors, {
    origin: process.env.NODE_ENV === 'development'
      ? ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3002', 'http://127.0.0.1:3002']
      : true,
    credentials: true
  })

  // Register multipart for file uploads
  await fastify.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024 // 10MB
    }
  })

  // Register JWT
  await fastify.register(jwt, {
    secret: fastify.config.JWT_SECRET
  })

  // Health check
  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() }
  })

  // Register routes
  await fastify.register(mvpCalculationRoutes, { prefix: '/api/calculations' })
  await fastify.register(simpleCalcRoutes, { prefix: '/api/simple' })

  return fastify
}

async function start() {
  try {
    const fastify = await buildApp()
    const port = parseInt(process.env.PORT || fastify.config.PORT) || 3001

    await fastify.listen({
      port,
      host: '0.0.0.0'
    })

    console.log(`🚀 Server listening on http://localhost:${port}`)
  } catch (err) {
    console.error('Error starting server:', err)
    process.exit(1)
  }
}

if (require.main === module) {
  start()
}

export { buildApp }