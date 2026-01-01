import type { Request, Response, NextFunction } from 'express'

/**
 * Tipo para controladores asíncronos de Express
 */
type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void | Response>

/**
 * Wrapper para manejar errores en controladores asíncronos
 * Elimina la necesidad de try-catch en cada controlador
 *
 * Los errores son automáticamente pasados al siguiente middleware (error handler)
 * @param fn - Función del controlador asíncrono
 * @returns Middleware de Express que maneja errores automáticamente
 */
export const asyncHandler =
  (fn: AsyncRequestHandler) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
