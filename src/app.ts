import 'reflect-metadata'

import type { Server } from 'http'

import express from 'express'
import { logger } from '@/core/logger'
import { config } from '@/core/config/env'
import { setupRoutes } from '@/core/config/routes'
import { AppDataSource } from '@/core/config/database'
import { setupGracefulShutdown } from '@/core/utils/gracefulShutdown'
import { setupMiddlewares, setupErrorHandler } from '@/core/config/middlewares'

/**
 * Crea y configura la aplicación Express
 */
const createApp = () => {
  const app = express()

  // Configurar middlewares
  setupMiddlewares(app)

  // Configurar rutas
  setupRoutes(app)

  // Configurar error handler (debe ser el último)
  setupErrorHandler(app)

  return app
}

/**
 * Inicia el servidor
 */
const startServer = async (): Promise<Server> => {
  try {
    // Inicializar base de datos
    await AppDataSource.initialize()
    logger.info('Database connected successfully')

    // Crear app
    const app = createApp()

    // Iniciar servidor HTTP
    const server = app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`)
      logger.info(`Swagger docs available at http://localhost:${config.port}/docs`)
      logger.info(`Environment: ${config.nodeEnv}`)
    })

    // Configurar graceful shutdown
    setupGracefulShutdown(server)

    return server
  } catch (error) {
    logger.error({ err: error }, 'Error starting server')
    process.exit(1)
    throw error // This line will never execute but satisfies the linter
  }
}

// Iniciar aplicación
startServer()

// Exportar app para testing
export default createApp()
