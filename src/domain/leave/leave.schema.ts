export interface LeaveListItem {
  id: number
  start_date: Date
  end_date: Date
  type: string
}

export interface HolidayLeave {
  id: number
  title: string | null
  start_date: Date
  end_date: Date
}

export interface CreateLeaveInput {
  user_id?: string | null
  start_date: Date
  end_date: Date
  status: string
  type: string
  title?: string | null
}

export interface BukVacation {
  data?: any[]
  pagination?: {
    next?: string
    total_pages?: number
  }
}

export interface BukEmployee {
  [key: string]: any
}
