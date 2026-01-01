import { Not, Between } from 'typeorm'
import { logger } from '@/core/logger'
import { config } from '@/core/config/env'
import { AppDataSource } from '@/core/config/database'

import { Leave } from './leave.entity'

import type {
  BukVacation,
  BukEmployee,
  HolidayLeave,
  LeaveListItem,
  CreateLeaveInput,
} from './leave.schema'

const URL_EMPLOYEES = 'https://gtchile.buk.cl/api/v1/chile/employees'
const URL_VACATIONS = 'https://gtchile.buk.cl/api/v1/chile/vacations'
const URL_LICENCIAS = 'https://gtchile.buk.cl/api/v1/chile/absences/licence'
const URL_PERMISOS = 'https://gtchile.buk.cl/api/v1/chile/absences/permission'

const getHolidaysUrl = (year: number): string =>
  `https://date.nager.at/api/v3/PublicHolidays/${year}/CL`

export class LeaveRepository {
  private repository = AppDataSource.getRepository(Leave)

  // Función genérica para realizar solicitudes
  private async fetchData(url: string): Promise<any> {
    try {
      const response = await fetch(url, {
        headers: {
          auth_token: config.bukApiKey,
        },
      })

      if (response.ok) {
        return await response.json()
      } else {
        logger.error({ url, status: response.status }, `Error fetching from BUK API`)
        return null
      }
    } catch (error) {
      logger.error({ err: error, url }, `Error fetching from BUK API`)
      return null
    }
  }

  private async fetchAllPages(startUrl: string, maxPages?: number): Promise<any[]> {
    const data: any[] = []
    const urls: string[] = [startUrl]
    let pagesFetched = 0

    while (urls.length > 0) {
      if (maxPages !== undefined && pagesFetched >= maxPages) {
        break
      }

      const url = urls.shift()!
      const responseJson: BukVacation = await this.fetchData(url)
      pagesFetched++

      if (responseJson) {
        data.push(...(responseJson.data || []))
        const nextUrl = responseJson.pagination?.next
        const totalPages = responseJson.pagination?.total_pages

        if (nextUrl) {
          urls.push(nextUrl)
        }

        console.log(`${startUrl} => Fetched page ${pagesFetched} of ${totalPages || 'unknown'}`)
      }
    }

    return data
  }

  private async fetchAllVacations(date?: string): Promise<any[]> {
    console.log('Fetching vacations...')
    const parameters: Record<string, any> = {
      date,
      page_size: 100,
    }

    const queryString = Object.entries(parameters)
      .filter(([_, v]) => v !== undefined)
      .map(([k, v]) => `${k}=${v}`)
      .join('&')

    const url = `${URL_VACATIONS}?${queryString}`
    return this.fetchAllPages(url)
  }

  private async fetchAllLicenses(date?: string): Promise<any[]> {
    console.log('Fetching licenses...')
    const parameters: Record<string, any> = {
      date,
      page_size: 100,
    }

    const queryString = Object.entries(parameters)
      .filter(([_, v]) => v !== undefined)
      .map(([k, v]) => `${k}=${v}`)
      .join('&')

    const url = `${URL_LICENCIAS}?${queryString}`
    return this.fetchAllPages(url)
  }

  private async fetchAllPermissions(date?: string): Promise<any[]> {
    console.log('Fetching permissions...')
    const parameters: Record<string, any> = {
      date,
      page_size: 100,
    }

    const queryString = Object.entries(parameters)
      .filter(([_, v]) => v !== undefined)
      .map(([k, v]) => `${k}=${v}`)
      .join('&')

    const url = `${URL_PERMISOS}?${queryString}`
    return this.fetchAllPages(url)
  }

  private async fetchAllEmployees(rut: string): Promise<BukEmployee | null> {
    console.log('Fetching employees...')
    const url = `${URL_EMPLOYEES}/${rut}`
    return this.fetchData(url)
  }

  async getDataBukLeaves(date?: string): Promise<[any[], any[], any[]]> {
    const [vacationsData, licensesData, permissionsData] = await Promise.all([
      this.fetchAllVacations(date),
      this.fetchAllLicenses(date),
      this.fetchAllPermissions(date),
    ])

    return [vacationsData, licensesData, permissionsData]
  }

  async getDataHolidays(year: number): Promise<any[]> {
    try {
      const url = getHolidaysUrl(year)
      const response = await fetch(url)

      if (response.ok) {
        return (await response.json()) as any[]
      } else {
        console.error(`Error fetching holidays: ${response.status}`)
        return []
      }
    } catch (error) {
      console.error('Error fetching holidays:', error)
      return []
    }
  }

  async saveLeaveBulk(leaveData: CreateLeaveInput[]): Promise<void> {
    const leaves = leaveData.map((data) => this.repository.create(data))
    await this.repository.save(leaves)
  }

  async deleteNonHolidayLeavesByDate(startDate?: string): Promise<void> {
    await this.repository.delete({
      start_date: startDate ? Between(new Date(startDate), new Date('2100-12-31')) : undefined,
      type: Not('holiday'),
    })
  }

  async getNonHolidayLeaveByUser(userId: string): Promise<LeaveListItem[]> {
    return this.repository.find({
      select: {
        id: true,
        start_date: true,
        end_date: true,
        type: true,
      },
      where: {
        user_id: userId,
        status: 'approved',
        type: Not('holiday'),
      },
    })
  }

  async deleteHolidayLeavesByYear(year: number): Promise<void> {
    await this.repository.delete({
      start_date: Between(new Date(`${year - 1}-12-31`), new Date(`${year}-12-31`)),
      type: 'holiday',
    })
  }

  async getHolidayLeavesByYear(year?: number): Promise<HolidayLeave[]> {
    const whereClause: any = { type: 'holiday' }

    if (year !== undefined) {
      whereClause.start_date = Between(new Date(`${year}-01-01`), new Date(`${year}-12-31`))
    }

    return this.repository.find({
      select: {
        id: true,
        title: true,
        start_date: true,
        end_date: true,
      },
      where: whereClause,
    })
  }

  async getEmployeesBukInfo(rut: string): Promise<BukEmployee | null> {
    return this.fetchAllEmployees(rut)
  }
}
