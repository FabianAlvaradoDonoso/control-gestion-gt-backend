import type { Request, Response, NextFunction } from 'express'

import { AuthError, AuthService } from '@/core/services/auth.service'
import { PermissionError, checkWhitelistPermissions } from '@/shared/utils/permissions'

const authService = new AuthService()

/**
 * Middleware que valida el token JWT y añade el usuario al request.
 * Debe usarse antes de requirePermissions.
 */
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = authService.extractTokenFromHeader(req.headers.authorization)
    const user = authService.validateToken(token)
    req.user = user
    return next()
  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(error.statusCode).json({
        error: 'Authentication Error',
        message: error.message,
      })
    }
    return res.status(401).json({
      error: 'Authentication Error',
      message: 'Error de autenticación',
    })
  }
}

/**
 * Factory function que crea un middleware para verificar permisos.
 * Valida el token y verifica que el usuario tenga al menos uno de los permisos especificados.
 *
 * Uso:
 * ```typescript
 * router.get('/projects', requirePermissions(['project.view']), controller.getProjects)
 * ```
 *
 * @param permissions - Lista de permisos permitidos (whitelist)
 * @returns Middleware de Express
 */
export const requirePermissions =
  (permissions: string[]) => (req: Request, res: Response, next: NextFunction) => {
    try {
      // Primero validamos el token
      const token = authService.extractTokenFromHeader(req.headers.authorization)
      const user = authService.validateToken(token)

      // Verificamos los permisos
      checkWhitelistPermissions(user, permissions)

      // Añadimos el usuario al request para uso posterior
      req.user = user
      return next()
    } catch (error) {
      if (error instanceof AuthError) {
        return res.status(error.statusCode).json({
          error: 'Authentication Error',
          message: error.message,
        })
      }
      if (error instanceof PermissionError) {
        return res.status(error.statusCode).json({
          error: 'Permission Error',
          message: error.message,
        })
      }
      return res.status(500).json({
        error: 'Internal Error',
        message: 'Error interno del servidor',
      })
    }
  }

/**
 * Middleware que solo valida la autenticación sin verificar permisos específicos.
 * Útil para endpoints que requieren estar autenticado pero no permisos específicos.
 */
export const requireAuth = authenticate
