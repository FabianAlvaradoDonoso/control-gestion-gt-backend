export interface ProjectCountByArea {
  area_id: string
  area_name: string
  project_count: number
}

export interface ProjectByStatus {
  status: string
  count: number
}

export interface ProjectByType {
  type: string
  count: number
}

export interface HoursComparison {
  project_id: string
  project_name: string
  internal_code: string
  planned_hours: number
  executed_hours: number
  area_name: string
}

export interface WorkloadByUser {
  user_id: string
  user_name: string
  area_name: string
  role_in_system: string
  project_id: string
  project_name: string
  internal_code: string
  project_role: string
  project_status: string
  project_priority: string
  assigned_hours: number
}
