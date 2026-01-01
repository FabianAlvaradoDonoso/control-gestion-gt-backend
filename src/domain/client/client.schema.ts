import { z } from 'zod'

export interface ClientListItem {
  id: string
  rut: string
  name: string
  description: string
}

export interface ClientDetail {
  id: string
  rut: string
  name: string
  description: string
  is_active: boolean
}

export const createClientSchema = z.object({
  name: z.string().min(2).max(100),
  rut: z.string().min(2).max(50),
  description: z.string().min(0).max(500),
})

export const updateClientSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  rut: z.string().min(2).max(50).optional(),
  description: z.string().min(0).max(500).optional(),
})

export type CreateClientInput = z.infer<typeof createClientSchema>
export type UpdateClientInput = z.infer<typeof updateClientSchema>

/**
 * @openapi
 * components:
 *   schemas:
 *     Client:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         rut:
 *           type: string
 *         description:
 *           type: string
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */
