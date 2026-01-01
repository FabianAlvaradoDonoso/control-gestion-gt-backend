import { z } from 'zod'
import dotenv from 'dotenv'

dotenv.config({ quiet: true })

/**
 * Schema de validación para variables de entorno
 * Asegura que todas las variables requeridas estén presentes y sean válidas
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('8000').transform(Number).pipe(z.number().positive()),
  API_URL: z.string().url(),
  ALLOWED_ORIGINS: z.string(),

  // JWT Configuration
  SECRET_KEY: z.string().min(1, 'SECRET_KEY es requerida'),
  ALGORITHM: z.string().default('HS256'),

  // Database Configuration
  DB_HOST: z.string().min(1, 'DB_HOST es requerido'),
  DB_PORT: z.string().default('5432').transform(Number).pipe(z.number().positive()),
  DB_USER: z.string().min(1, 'DB_USER es requerido'),
  DB_PASSWORD: z.string().min(1, 'DB_PASSWORD es requerida'),
  DB_NAME: z.string().min(1, 'DB_NAME es requerido'),

  // External APIs
  BUK_API_KEY: z.string(),
})

/**
 * Valida y parsea las variables de entorno
 * Si falla la validación, lanza un error y muestra qué variables faltan
 */
const validateEnv = () => {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map(
        (issue) => `  - ${issue.path.join('.')}: ${issue.message}`
      )

      console.error('❌ Variables de entorno inválidas o faltantes:\n')
      console.error(missingVars.join('\n'))
      console.error(
        '\n💡 Revisa tu archivo .env y asegúrate de que todas las variables requeridas estén configuradas.'
      )

      process.exit(1)
    }
    throw error
  }
}

// Validar al inicio
const env = validateEnv()

/**
 * Configuración de la aplicación con variables de entorno validadas y tipadas
 */
export const config = {
  port: env.PORT,
  nodeEnv: env.NODE_ENV,
  allowedOrigins: env.ALLOWED_ORIGINS,
  apiUrl: env.API_URL,
  bukApiKey: env.BUK_API_KEY,
  // JWT Configuration
  jwtSecretKey: env.SECRET_KEY,
  jwtAlgorithm: env.ALGORITHM,
  db: {
    host: env.DB_HOST,
    port: env.DB_PORT,
    username: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
  },
} as const

// Type para usar en otros lugares si es necesario
export type Config = typeof config
export type Env = z.infer<typeof envSchema>
