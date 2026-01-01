import pino from 'pino'

import { config } from './config/env'

const isDevelopment = config.nodeEnv === 'development'

/**
 * Configuración de Pino Logger
 * - En desarrollo: formato pretty con colores
 * - En producción: formato JSON estructurado
 */
export const logger = pino({
  level: isDevelopment ? 'debug' : 'info',
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  formatters: {
    level: (label) => ({ level: label.toUpperCase() }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
})

/**
 * Helper functions para logging estructurado
 */
export const logError = (error: Error, context?: Record<string, unknown>) => {
  logger.error(
    {
      err: error,
      ...context,
    },
    error.message
  )
}

export const logInfo = (message: string, context?: Record<string, unknown>) => {
  logger.info(context, message)
}

export const logWarning = (message: string, context?: Record<string, unknown>) => {
  logger.warn(context, message)
}

export const logDebug = (message: string, context?: Record<string, unknown>) => {
  logger.debug(context, message)
}
