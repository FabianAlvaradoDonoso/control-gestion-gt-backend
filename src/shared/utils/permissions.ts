import type { UserWithRole } from '@/shared/interfaces'

/**
 * Error personalizado para errores de permisos
 */
export class PermissionError extends Error {
  statusCode: number

  constructor(message: string = 'No tienes permiso para acceder a este recurso.') {
    super(message)
    this.statusCode = 403
    this.name = 'PermissionError'
  }
}

/**
 * Obtiene todos los permisos de un usuario basándose en sus roles
 * @param user - Usuario con roles
 * @returns Set con todos los permisos del usuario
 */
export function getUserPermissions(user: UserWithRole): Set<string> {
  const permissions = new Set<string>()
  for (const role of user.roles) {
    for (const permission of role.permissions) {
      permissions.add(permission)
    }
  }
  return permissions
}

/**
 * Verifica si el usuario tiene al menos uno de los permisos permitidos (whitelist).
 * Lanza PermissionError si el usuario no tiene ningún permiso permitido.
 *
 * @param user - Usuario con roles y permisos
 * @param allowedPermissions - Lista de permisos permitidos
 * @throws PermissionError si el usuario no tiene ningún permiso permitido
 */
export function checkWhitelistPermissions(user: UserWithRole, allowedPermissions: string[]): void {
  const userPermissions = getUserPermissions(user)

  const hasPermission = allowedPermissions.some((permission) => userPermissions.has(permission))

  if (!hasPermission) {
    throw new PermissionError()
  }
}

/**
 * Verifica si el usuario NO tiene ninguno de los permisos prohibidos (blacklist).
 * Lanza PermissionError si el usuario tiene algún permiso prohibido.
 *
 * @param user - Usuario con roles y permisos
 * @param forbiddenPermissions - Lista de permisos prohibidos
 * @throws PermissionError si el usuario tiene algún permiso prohibido
 */
export function checkBlacklistPermissions(
  user: UserWithRole,
  forbiddenPermissions: string[]
): void {
  const userPermissions = getUserPermissions(user)

  const hasForbiddenPermission = forbiddenPermissions.some((permission) =>
    userPermissions.has(permission)
  )

  if (hasForbiddenPermission) {
    throw new PermissionError()
  }
}

/**
 * Verifica si el usuario tiene al menos uno de los permisos especificados.
 * Retorna true/false en lugar de lanzar excepción.
 *
 * @param user - Usuario con roles y permisos
 * @param permissions - Lista de permisos a verificar
 * @returns true si el usuario tiene al menos uno de los permisos
 */
export function hasAnyPermission(user: UserWithRole, permissions: string[]): boolean {
  const userPermissions = getUserPermissions(user)
  return permissions.some((permission) => userPermissions.has(permission))
}

/**
 * Verifica si el usuario tiene todos los permisos especificados.
 *
 * @param user - Usuario con roles y permisos
 * @param permissions - Lista de permisos requeridos
 * @returns true si el usuario tiene todos los permisos
 */
export function hasAllPermissions(user: UserWithRole, permissions: string[]): boolean {
  const userPermissions = getUserPermissions(user)
  return permissions.every((permission) => userPermissions.has(permission))
}
