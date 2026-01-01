import rateLimit from 'express-rate-limit'

/**
 * Rate limiter general para toda la aplicación
 * 100 requests por 15 minutos por IP
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,
  message: 'Demasiadas solicitudes desde esta IP, por favor intenta más tarde',
  standardHeaders: true,
  legacyHeaders: false,
})

/**
 * Rate limiter estricto para endpoints de autenticación
 * 5 intentos por 15 minutos por IP
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5,
  message: 'Demasiados intentos de inicio de sesión, por favor intenta más tarde',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // No contar requests exitosos
})

/**
 * Rate limiter para creación de recursos
 * 20 requests por 15 minutos por IP
 */
export const createLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20,
  message: 'Demasiadas solicitudes de creación, por favor intenta más tarde',
  standardHeaders: true,
  legacyHeaders: false,
})

/**
 * Rate limiter para endpoints públicos (más permisivo)
 * 200 requests por 15 minutos por IP
 */
export const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 200,
  message: 'Demasiadas solicitudes, por favor intenta más tarde',
  standardHeaders: true,
  legacyHeaders: false,
})
