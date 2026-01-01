import type { Request, Response, NextFunction } from 'express'

import { ZodError } from 'zod'
import { logger } from '@/core/logger'
import { AuthError } from '@/core/services/auth.service'
import { PermissionError } from '@/shared/utils/permissions'

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  // Log del error con contexto
  logger.error(
    {
      err,
      path: req.path,
      method: req.method,
      body: req.body,
      query: req.query,
    },
    'Error handling request'
  )

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation error',
      details: err.issues,
    })
  }

  if (err instanceof AuthError) {
    return res.status(err.statusCode).json({
      error: 'Authentication Error',
      message: err.message,
    })
  }

  if (err instanceof PermissionError) {
    return res.status(err.statusCode).json({
      error: 'Permission Error',
      message: err.message,
    })
  }

  if (err.message === 'User not found') {
    return res.status(404).json({ error: err.message })
  }

  if (err.message === 'Email already exists') {
    return res.status(409).json({ error: err.message })
  }

  return res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  })
}
