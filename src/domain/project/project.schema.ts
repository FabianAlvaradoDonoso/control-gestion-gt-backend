import { z } from 'zod'

export enum ProjectStatus {
  NOT_STARTED = 'not_started',
  PLANNING = 'planning',
  IN_PROGRESS = 'in_progress',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum ProjectPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum ProjectType {
  INTERNAL = 'internal',
  EXTERNAL = 'external',
  RESEARCH = 'research',
  MAINTENANCE = 'maintenance',
}

export interface ProjectListItem {
  id: string
  name: string
  internal_code: string
  client_id: string
  client_name: string
  partner_id: string
  partner_name: string
  manager_id: string | null
  manager_name: string | null
  status: string
  start_date: string
  end_date: string
  description: string | null
  planned_hours: number | null
  is_active: boolean
  assignments?: ProjectAssignment[]
}

export interface ProjectResumen {
  id: string
  name: string
  internal_code: string
  client_name: string
  partner_name: string
  manager_name: string | null
}

export interface ProjectDetail {
  id: string
  name: string
  internal_code: string
  status: string
  priority: string
  type: string
  client_id: string
  client_name: string
  area_id: number
  area_name: string
  partner_id: string
  partner_name: string
  manager_id: string | null
  manager_name: string | null
  planned_hours: number | null
  executed_hours: number | null
  start_date: string
  end_date: string
  season: string | null
  active_alerts: boolean
  description: string | null
  gt_planner_id: string | null
  created_user_id: string
  created_at: Date
  updated_at: Date
  is_active: boolean
}

export interface ProjectAssignment {
  user_name: string
  role: string
  duration_hours: number
}

export const createProjectSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2).max(100),
  internal_code: z.string().max(50).optional(),
  status: z.string().min(1),
  priority: z.string().min(1),
  type: z.string().min(1),
  client_id: z.string().uuid(),
  area_id: z.number().int().positive(),
  partner_id: z.string().uuid(),
  manager_id: z.string().uuid().optional(),
  planned_hours: z.number().int().positive().optional(),
  executed_hours: z.number().int().positive().optional(),
  start_date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format',
  }),
  end_date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format',
  }),
  season: z.string().min(1).max(50).optional(),
  active_alerts: z.boolean().optional(),
  description: z.string().max(500).optional().nullable(),
  gt_planner_id: z.string().max(100).optional().nullable(),
})

export const updateProjectSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2).max(100).optional(),
  internal_code: z.string().min(1).max(50).optional(),
  status: z.string().min(1).optional(),
  priority: z.string().min(1).optional(),
  type: z.string().min(1).optional(),
  client_id: z.string().uuid().optional(),
  area_id: z.number().int().positive().optional(),
  partner_id: z.string().uuid().optional(),
  manager_id: z.string().uuid().optional(),
  planned_hours: z.number().int().positive().optional(),
  executed_hours: z.number().int().positive().optional(),
  start_date: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), {
      message: 'Invalid date format',
    })
    .optional(),
  end_date: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), {
      message: 'Invalid date format',
    })
    .optional(),
  season: z.string().min(1).max(50).optional(),
  active_alerts: z.boolean().optional(),
  description: z.string().min(1).max(500).optional(),
  gt_planner_id: z.string().min(1).max(100).optional(),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>

/**
 * @openapi
 * components:
 *   schemas:
 *     CreateProjectInput:
 *       type: object
 *       required:
 *         - id
 *         - name
 *         - internalCode
 *         - status
 *         - priority
 *         - type
 *         - clientId
 *         - areaId
 *         - partnerId
 *         - startDate
 *         - endDate
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID del proyecto (opcional, se genera si no se proporciona)
 *         name:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           description: Nombre del proyecto
 *         internal_code:
 *           type: string
 *           minLength: 1
 *           maxLength: 50
 *           description: Código interno del proyecto
 *         status:
 *           type: string
 *           description: Estado del proyecto
 *         priority:
 *           type: string
 *           description: Prioridad del proyecto
 *         type:
 *           type: string
 *           description: Tipo de proyecto
 *         client_id:
 *           type: string
 *           format: uuid
 *           description: ID del cliente
 *         area_id:
 *           type: integer
 *           minimum: 1
 *           description: ID del área
 *         partner_id:
 *           type: string
 *           format: uuid
 *           description: ID del socio
 *         manager_id:
 *           type: string
 *           format: uuid
 *           description: ID del manager (opcional)
 *         planned_hours:
 *           type: integer
 *           minimum: 1
 *           description: Horas planificadas (opcional)
 *         executed_hours:
 *           type: integer
 *           minimum: 1
 *           description: Horas ejecutadas (opcional)
 *         start_date:
 *           type: string
 *           format: date
 *           description: Fecha de inicio
 *         end_date:
 *           type: string
 *           format: date
 *           description: Fecha de fin
 *         season:
 *           type: string
 *           maxLength: 50
 *           description: Temporada (opcional)
 *         active_alerts:
 *           type: boolean
 *           description: Alertas activas (opcional)
 *         description:
 *           type: string
 *           minLength: 5
 *           maxLength: 500
 *           description: Descripción del proyecto (opcional)
 *         gt_planner_id:
 *           type: string
 *           maxLength: 100
 *           description: ID del planificador GT (opcional)
 *     UpdateProjectInput:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           description: Nombre del proyecto
 *         internal_code:
 *           type: string
 *           minLength: 1
 *           maxLength: 50
 *           description: Código interno del proyecto
 *         status:
 *           type: string
 *           description: Estado del proyecto
 *         priority:
 *           type: string
 *           description: Prioridad del proyecto
 *         type:
 *           type: string
 *           description: Tipo de proyecto
 *         client_id:
 *           type: string
 *           format: uuid
 *           description: ID del cliente
 *         area_id:
 *           type: integer
 *           minimum: 1
 *           description: ID del área
 *         partner_id:
 *           type: string
 *           format: uuid
 *           description: ID del socio
 *         manager_id:
 *           type: string
 *           format: uuid
 *           description: ID del manager
 *         planned_hours:
 *           type: integer
 *           minimum: 1
 *           description: Horas planificadas
 *         executed_hours:
 *           type: integer
 *           minimum: 1
 *           description: Horas ejecutadas
 *         start_date:
 *           type: string
 *           format: date
 *           description: Fecha de inicio
 *         end_date:
 *           type: string
 *           format: date
 *           description: Fecha de fin
 *         season:
 *           type: string
 *           maxLength: 50
 *           description: Temporada
 *         active_alerts:
 *           type: boolean
 *           description: Alertas activas
 *         description:
 *           type: string
 *           minLength: 5
 *           maxLength: 500
 *           description: Descripción del proyecto
 *         gt_planner_id:
 *           type: string
 *           maxLength: 100
 *           description: ID del planificador GT
 *     Project:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         internal_code:
 *           type: string
 *         client_id:
 *           type: string
 *           format: uuid
 *         client_name:
 *           type: string
 *         partner_id:
 *           type: string
 *           format: uuid
 *         manager_id:
 *           type: string
 *           format: uuid
 *         manager_name:
 *           type: string
 *         status:
 *           type: string
 *         start_date:
 *           type: string
 *           format: date
 *         end_date:
 *           type: string
 *           format: date
 *         planned_hours:
 *           type: number
 *         is_active:
 *           type: boolean
 * */
