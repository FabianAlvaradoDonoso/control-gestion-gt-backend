import type { Role, UserWithRole, UserApplication } from '@/shared/interfaces'

import jwt from 'jsonwebtoken'
import { config } from '@/core/config/env'

/**
 * Error personalizado para errores de autenticación
 */
export class AuthError extends Error {
  statusCode: number

  constructor(statusCode: number, message: string) {
    super(message)
    this.statusCode = statusCode
    this.name = 'AuthError'
  }
}

interface TokenPayload {
  dataUser: {
    id: string
    name: string
    email: string
    emailVerified: boolean
    status: string
    organizationId: string | null
    businessLineId: string
    createdAt: string | null
    updatedAt: string | null
    image: string | null
    userApplications: Array<{
      userId: string
      applicationId: string
      createdAt: string
      application: {
        id: string
        name: string
        description: string | null
        isActive: boolean | null
      } | null
    }>
    userRoles: Array<{
      name: string
      permissions: string[] | null
    }>
  }
}

export class AuthService {
  private secretKey: string
  private algorithm: string

  constructor() {
    this.secretKey = config.jwtSecretKey
    this.algorithm = config.jwtAlgorithm
  }

  /**
   * Valida un token JWT y retorna el usuario con sus roles
   * @param token - Token JWT a validar
   * @returns Usuario con sus roles
   * @throws AuthError si el token es inválido
   */
  validateToken(token: string): UserWithRole {
    try {
      if (!token) {
        throw new AuthError(401, 'Token no proporcionado')
      }

      const payload = jwt.verify(token, this.secretKey, {
        algorithms: [this.algorithm as jwt.Algorithm],
      }) as TokenPayload

      const dataUser = payload.dataUser || {}

      const userApplications: UserApplication[] = (dataUser.userApplications || []).map(
        (appData) => ({
          userId: appData.userId,
          applicationId: appData.applicationId,
          createdAt: appData.createdAt,
          application: appData.application
            ? {
                id: appData.application.id,
                name: appData.application.name,
                description: appData.application.description,
                isActive: appData.application.isActive,
              }
            : null,
        })
      )

      const roles: Role[] = (dataUser.userRoles || []).map((role) => ({
        role_name: role.name,
        permissions: role.permissions || [],
      }))

      const user: UserWithRole = {
        id: dataUser.id,
        name: dataUser.name,
        email: dataUser.email,
        emailVerified: dataUser.emailVerified ?? true,
        status: dataUser.status ?? 'active',
        organizationId: dataUser.organizationId,
        businessLineId: dataUser.businessLineId,
        createdAt: dataUser.createdAt,
        updatedAt: dataUser.updatedAt,
        image: dataUser.image,
        userApplications,
        roles,
      }

      return user
    } catch (error) {
      if (error instanceof AuthError) {
        throw error
      }

      if (error instanceof jwt.TokenExpiredError) {
        throw new AuthError(401, 'Token ha expirado')
      }

      if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthError(401, 'Token inválido')
      }

      throw new AuthError(401, 'Error al validar token')
    }
  }

  /**
   * Extrae el token del header Authorization
   * @param authHeader - Header Authorization (formato: "Bearer <token>")
   * @returns El token sin el prefijo Bearer
   * @throws AuthError si el header no tiene el formato correcto
   */
  extractTokenFromHeader(authHeader: string | undefined): string {
    if (!authHeader) {
      throw new AuthError(401, 'Token no proporcionado')
    }

    const parts = authHeader.split(' ')
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new AuthError(401, 'Formato de token inválido. Use: Bearer <token>')
    }

    return parts[1]
  }
}
