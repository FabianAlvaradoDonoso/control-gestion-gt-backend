import swaggerJsdoc from 'swagger-jsdoc'

import { config } from './env'

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Documentation',
      version: '1.0.0',
      description: 'Backend API Documentation',
    },
    servers:
      config.nodeEnv === 'production'
        ? [
            {
              url: '/',
              description: 'Production server',
            },
          ]
        : [
            {
              url: `http://localhost:${config.port}`,
              description: 'Development server',
            },
          ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token de autenticación',
        },
      },
    },
  },
  apis:
    config.nodeEnv === 'production'
      ? ['./dist/**/*.routes.js', './dist/**/*.schema.js']
      : ['./src/**/*.routes.ts', './src/**/*.schema.ts'],
}

export const swaggerSpec = swaggerJsdoc(options)
