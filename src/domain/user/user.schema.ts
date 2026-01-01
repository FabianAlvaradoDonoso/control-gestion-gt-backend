import { z } from 'zod'

export interface UserBukResponse {
  id: number
  name: string
  email: string
}

export interface UserListItem {
  id: string
  name: string
  role: string
  email: string
  rut: string
  created_at: Date
}

export interface UserWithExtraInfo {
  id: string
  name: string
  role: string
  buk_id: number
  rut: string
}

export interface UserNameMap {
  [id: string]: string
}

export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  role: z.string().min(2).max(50),
  rut: z.string().min(8).max(10),
})

export const updateUserSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(2).max(100).optional(),
  role: z.string().min(2).max(50).optional(),
  rut: z.string().min(8).max(10).optional(),
  buk_id: z.number().int().positive().optional(),
})

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>

/**
 * @openapi
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         email:
 *           type: string
 *           format: email
 *         name:
 *           type: string
 *         role:
 *           type: string
 *         rut:
 *           type: string
 *         buk_id:
 *           type: integer
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */
