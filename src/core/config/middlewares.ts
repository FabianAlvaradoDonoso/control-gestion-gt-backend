import type { Application } from 'express'

import cors from 'cors'
import helmet from 'helmet'
import express from 'express'
import pinoHttp from 'pino-http'
import { logger } from '@/core/logger'
import swaggerUi from 'swagger-ui-express'
import { swaggerSpec } from '@/core/config/swagger'
import { errorHandler } from '@/core/middlewares/errorHandler'
import { generalLimiter } from '@/core/middlewares/rateLimiter'

import { config } from './env'

/**
 * Configuración de CORS según el entorno
 */
const getCorsOptions = () => {
  const allowedOrigins =
    config.nodeEnv === 'production'
      ? config.allowedOrigins?.split(',') || []
      : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:8000']

  return {
    origin: config.nodeEnv === 'production' ? allowedOrigins : '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'auth_token'],
    credentials: true,
  }
}

/**
 * Configura todos los middlewares de la aplicación
 * Se ejecuta en orden específico para funcionamiento correcto
 */
export const setupMiddlewares = (app: Application): void => {
  // 1. Security headers con Helmet
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      crossOriginEmbedderPolicy: false, // Para permitir Swagger UI
    })
  )

  // 2. Rate limiting global
  app.use(generalLimiter)

  // 3. CORS configuration
  app.use(cors(getCorsOptions()))

  // 4. Body parsers con límite de payload
  app.use(express.json({ limit: '10mb' }))
  app.use(express.urlencoded({ extended: true, limit: '10mb' }))

  // 5. HTTP request logging con Pino
  app.use(
    pinoHttp({
      logger,
      autoLogging: {
        ignore: (req) => req.url === '/health' || req.url === '/docs',
      },
    })
  )

  // 6. Swagger documentation
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

  logger.info('Middlewares configured successfully')
}

/**
 * Configura el error handler (debe ser el último middleware)
 */
export const setupErrorHandler = (app: Application): void => {
  app.use(errorHandler)
}
