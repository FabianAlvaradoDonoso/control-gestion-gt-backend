import type { Server } from 'http'

import { logger } from '@/core/logger'
import { AppDataSource } from '@/core/config/database'

/**
 * Tiempo máximo de espera para shutdown (30 segundos)
 */
const SHUTDOWN_TIMEOUT = 30000

/**
 * Graceful Shutdown Handler
 * Cierra la aplicación de forma ordenada cuando recibe señales de terminación
 *
 * @param server - Instancia del servidor HTTP
 * @param signal - Señal recibida (SIGTERM, SIGINT, etc.)
 */
export const gracefulShutdown = async (server: Server | null, signal: string): Promise<void> => {
  logger.info(`${signal} signal received: closing HTTP server`)

  // Dejar de aceptar nuevas conexiones
  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed')

      try {
        // Cerrar conexión de base de datos
        if (AppDataSource.isInitialized) {
          await AppDataSource.destroy()
          logger.info('Database connection closed')
        }

        logger.info('Graceful shutdown completed')
        process.exit(0)
      } catch (error) {
        logger.error({ err: error }, 'Error during graceful shutdown')
        process.exit(1)
      }
    })

    // Timeout de seguridad: si después de 30s no terminó, forzar salida
    setTimeout(() => {
      logger.error('Forcing shutdown after timeout')
      process.exit(1)
    }, SHUTDOWN_TIMEOUT)
  } else {
    process.exit(0)
  }
}

/**
 * Configura los listeners para señales de terminación y errores no manejados
 *
 * @param server - Instancia del servidor HTTP
 */
export const setupGracefulShutdown = (server: Server | null): void => {
  // Señales de terminación
  process.on('SIGTERM', () => gracefulShutdown(server, 'SIGTERM'))
  process.on('SIGINT', () => gracefulShutdown(server, 'SIGINT'))

  // Errores no manejados
  process.on('uncaughtException', (error: Error) => {
    logger.error({ err: error }, 'Uncaught Exception')
    gracefulShutdown(server, 'uncaughtException')
  })

  process.on('unhandledRejection', (reason: unknown) => {
    logger.error({ reason }, 'Unhandled Promise Rejection')
    gracefulShutdown(server, 'unhandledRejection')
  })

  logger.info('Graceful shutdown handlers configured')
}
