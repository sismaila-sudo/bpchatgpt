import Fastify from 'fastify'
import cors from '@fastify/cors'

import { simpleCalcRoutes } from './routes/simple-calc-minimal'

async function buildApp() {
  const fastify = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'development' ? 'info' : 'warn'
    }
  })

  // Register CORS
  await fastify.register(cors, {
    origin: true,
    credentials: true
  })

  // Health check
  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() }
  })

  // Register routes
  await fastify.register(simpleCalcRoutes, { prefix: '/api/simple' })

  return fastify
}

async function start() {
  try {
    const fastify = await buildApp()
    const port = parseInt(process.env.PORT || '3001')

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