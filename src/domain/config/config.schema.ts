import z from 'zod'

export interface WorkingHoursCommon {
  max_daily_hours: number
  lunch_start_time: string
  lunch_end_time: string
  work_start_time: string
  work_end_time: string
  high_start_date: string
  high_end_date: string
}

export interface WorkingHoursSeasonConfig {
  max_daily_hours_overtime: number
}

export interface WorkingHoursConfigValue {
  common: WorkingHoursCommon
  normal: WorkingHoursSeasonConfig
  high: WorkingHoursSeasonConfig
}

// Type guards para verificar el tipo de configuración
export function isSeasonConfig(value: any): value is SeasonConfigValues {
  return value && typeof value.season_mode === 'string'
}

export function isWorkingHoursConfig(value: any): value is WorkingHoursConfigValue {
  return value && typeof value.common === 'object' && 'max_daily_hours' in value.common
}

export const seasonConfigSchema = z.object({
  season_mode: z.enum(['auto', 'normal', 'high']),
})

export type SeasonConfigValues = z.infer<typeof seasonConfigSchema>

/**
 * @openapi
 * components:
 *   schemas:
 *     SeasonConfigValues:
 *       type: object
 *       required:
 *         - season_mode
 *       properties:
 *         season_mode:
 *           type: string
 *           enum:
 *             - auto
 *             - normal
 *             - high
 *           description: Season mode
 */
