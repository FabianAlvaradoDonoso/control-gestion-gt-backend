import z from 'zod'

export interface ProjectDetails {
  name: string
  internal_code: string
  type: string
  priority: string
  start_date: string
  end_date: string
  description: string | null
  status: string
  planned_hours: number | null
  client_name: string
}

export interface ResponsibleUser {
  id: string
  name: string
  is_primary: boolean
  role: 'partner' | 'manager'
}

export interface ProjectDatesInfo {
  start_date: string
  end_date: string
}

export interface ProjectAssignment {
  userId: string
  date: string
  userName: string
  userRole: string
}

export interface UserLeave {
  userId: string
  startDate: Date
  endDate: Date
}

export interface ProjectCommentItem {
  id: number
  parent_id: number | null
  user_id: string
  user_name: string
  content: string
  created_at: Date
  updated_at: Date
}

export interface TeamUser {
  id: string
  name: string
  total_hours: number
  role: string
}

export interface PartnersManagersData {
  ids: string[]
  primary: string | null
}

export const updateResponsibleUsersSchema = z.object({
  user_id: z.string(),
  role: z.string(),
  action: z.string(),
})

export type UpdateResponsibleUsersSchema = z.infer<typeof updateResponsibleUsersSchema>

export const projectCommentCreateSchema = z.object({
  id: z.number().optional(),
  content: z.string(),
  parent_id: z.number().nullable().optional(),
  updated_at: z.string().optional(),
})

export type ProjectCommentCreate = z.infer<typeof projectCommentCreateSchema>
