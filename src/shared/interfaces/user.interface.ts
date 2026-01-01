/**
 * Interfaces para el usuario autenticado y sus roles/permisos
 * Basado en el modelo de FastAPI
 */

export interface Application {
  id: string
  name: string
  description: string | null
  isActive: boolean | null
}

export interface UserApplication {
  userId: string
  applicationId: string
  createdAt: string
  application: Application | null
}

export interface Role {
  role_name: string
  permissions: string[]
}

export interface User {
  id: string
  name: string
  email: string
  emailVerified: boolean
  status: string
  organizationId: string | null
  businessLineId: string
  createdAt: string | null
  updatedAt: string | null
  userApplications: UserApplication[]
  image: string | null
}

export interface UserWithRole extends User {
  roles: Role[]
}

/**
 * Extensión de Request de Express para incluir el usuario autenticado
 */
declare global {
  namespace Express {
    interface Request {
      user?: UserWithRole
    }
  }
}
