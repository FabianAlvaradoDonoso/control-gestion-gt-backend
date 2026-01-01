import z from 'zod'

export interface TimeBlock {
  id?: number
  date: string
  start_time: string
  end_time: string
  mode?: string
  duration_hours?: number
  comment?: string
}

export interface AssignmentSimulateCascade {
  user_id: string
  project_id: string
  assign_by_user_id: string
  start_date: string
  total_hours: number
}

export interface Project {
  id: string
  start_date: Date
  end_date: Date
}

export interface Leave {
  start_date: Date
  end_date: Date
}

export interface TimeBlockWithProject {
  id: number
  assignment_id: string
  date: string
  start_time: string
  end_time: string
  duration_hours: number
  is_active: boolean
  assign_by_user_id: string
  comment: string | null
  created_at: Date
  project_id: string
  project_name: string
  assignment_role: string
}

export interface CreateTimeBlockInput {
  assignment_id: string
  date: string
  start_time: string
  end_time: string
  duration_hours: number
  assign_by_user_id: string
  comment?: string | null
  mode: string
}

export interface UpdateTimeBlockInput {
  id: number
  date: string
  start_time: string
  end_time: string
  duration_hours: number
  assign_by_user_id: string
  comment?: string | null
}

const modeEnum = z.enum(['manual', 'cascade'])

const timeBlockSchema = z.object({
  id: z.number().optional(),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format',
  }),
  start_time: z.string().refine((time) => /^([0-1]\d|2[0-3]):([0-5]\d)$/.test(time), {
    message: 'Invalid time format, expected HH:mm',
  }),
  end_time: z.string().refine((time) => /^([0-1]\d|2[0-3]):([0-5]\d)$/.test(time), {
    message: 'Invalid time format, expected HH:mm',
  }),
  mode: modeEnum,
})

export const fixedBlockSchema = z.object({
  project_id: z.string().uuid(),
  user_id: z.string().uuid(),
  role: z.string(),
  comments: z.object({
    more_than_8_hours: z.string().optional(),
    out_of_project_range: z.string().optional(),
  }),
  status: z.string(),
  assign_by_user_id: z.string().uuid(),
  time_blocks: z.array(timeBlockSchema),
  edited_time_blocks: z.array(timeBlockSchema),
  deleted_time_block_ids: z.array(z.number()),
})
export type FixedBlockInput = z.infer<typeof fixedBlockSchema>

export const simulatedCascadeSchema = z.object({
  project_id: z.string().uuid(),
  user_id: z.string().uuid(),
  start_date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format',
  }),
  total_hours: z.number().min(0),
  assign_by_user_id: z.string().uuid(),
})
export type SimulatedCascadeInput = z.infer<typeof simulatedCascadeSchema>

/**
 * @openapi
 * components:
 *   schemas:
 *     FixedBlockInput:
 *       type: object
 *       required:
 *         - project_id
 *         - user_id
 *         - role
 *         - comments
 *         - status
 *         - assign_by_user_id
 *       properties:
 *         project_id:
 *           type: string
 *           format: uuid
 *           description: ID del proyecto
 *         user_id:
 *           type: string
 *           format: uuid
 *           description: ID del usuario asignado
 *         role:
 *           type: string
 *           description: Rol del usuario en el proyecto
 *         comments:
 *           type: object
 *           description: Comentarios en formato JSON
 *         status:
 *           type: string
 *           description: Estado de la asignación
 *         assign_by_user_id:
 *           type: string
 *           format: uuid
 *           description: ID del usuario que realiza la asignación
 *         time_blocks:
 *           type: array
 *           description: Bloques de tiempo para la asignación
 *           items:
 *             type: object
 *             required:
 *               - date
 *               - start_time
 *               - end_time
 *               - mode
 *             properties:
 *               id:
 *                 type: number
 *                 description: ID del bloque de tiempo (opcional)
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Fecha del bloque
 *               start_time:
 *                 type: string
 *                 pattern: '^([0-1]\d|2[0-3]):([0-5]\d)$'
 *                 description: Hora de inicio (formato HH:mm)
 *               end_time:
 *                 type: string
 *                 pattern: '^([0-1]\d|2[0-3]):([0-5]\d)$'
 *                 description: Hora de fin (formato HH:mm)
 *               mode:
 *                 type: string
 *                 enum: [manual, cascade]
 *                 description: Modo de asignación
 *         edited_time_blocks:
 *           type: array
 *           description: Bloques de tiempo editados
 *           items:
 *             type: object
 *             required:
 *               - date
 *               - start_time
 *               - end_time
 *               - mode
 *             properties:
 *               id:
 *                 type: number
 *                 description: ID del bloque de tiempo (opcional)
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Fecha del bloque
 *               start_time:
 *                 type: string
 *                 pattern: '^([0-1]\d|2[0-3]):([0-5]\d)$'
 *                 description: Hora de inicio (formato HH:mm)
 *               end_time:
 *                 type: string
 *                 pattern: '^([0-1]\d|2[0-3]):([0-5]\d)$'
 *                 description: Hora de fin (formato HH:mm)
 *               mode:
 *                 type: string
 *                 enum: [manual, cascade]
 *                 description: Modo de asignación
 *         deleted_time_block_ids:
 *           type: array
 *           description: IDs de bloques de tiempo a eliminar
 *           items:
 *             type: number
 *     SimulatedCascadeInput:
 *       type: object
 *       required:
 *         - project_id
 *         - user_id
 *         - start_date
 *         - total_hours
 *         - assign_by_user_id
 *       properties:
 *         project_id:
 *           type: string
 *           format: uuid
 *           description: ID del proyecto
 *         user_id:
 *           type: string
 *           format: uuid
 *           description: ID del usuario asignado
 *         start_date:
 *           type: string
 *           format: date
 *           description: Fecha de inicio de la asignación en cascada
 *         total_hours:
 *           type: number
 *           minimum: 0
 *           description: Total de horas a asignar
 *         assign_by_user_id:
 *           type: string
 *           format: uuid
 *           description: ID del usuario que realiza la asignación
 * */
