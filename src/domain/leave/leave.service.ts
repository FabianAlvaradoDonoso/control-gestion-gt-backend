import { UserRepository } from '@/domain/user/user.repository'

import { LeaveRepository } from './leave.repository'

import type { CreateLeaveInput } from './leave.schema'

export class LeaveService {
  private LeaveRepository: LeaveRepository
  private UserRepository: UserRepository

  constructor() {
    this.LeaveRepository = new LeaveRepository()
    this.UserRepository = new UserRepository()
  }

  convertData(data: any[], dataType: string) {
    return data.map((entry) => ({
      start_date: entry.start_date,
      end_date: entry.end_date,
      employee_id: entry.employee_id,
      status: entry.status,
      type: dataType,
      title: null,
    }))
  }

  async saveBukLeaves(date?: string) {
    const [vacationsData, licensesData, permissionsData] =
      await this.LeaveRepository.getDataBukLeaves(date)

    const users = await this.UserRepository.findAllWithExtraInfo()
    const vacations = this.convertData(vacationsData, 'vacation')
    const licenses = this.convertData(licensesData, 'license')
    const permissions = this.convertData(permissionsData, 'permission')

    const allLeaves = [...vacations, ...licenses, ...permissions]

    const leaveDataWithUserIds = allLeaves
      .map((leave) => ({
        start_date: leave.start_date,
        end_date: leave.end_date,
        type: leave.type,
        status: leave.status,
        title: leave.title,
        user_id: users.find((u) => u.buk_id === leave.employee_id)?.id || null,
      }))
      .filter((leave) => leave.user_id !== null) as CreateLeaveInput[]

    await this.LeaveRepository.deleteNonHolidayLeavesByDate(date)
    await this.LeaveRepository.saveLeaveBulk(leaveDataWithUserIds)
    return { message: 'Leaves saved successfully' }
  }

  async getLeavesByUserId(userId: string) {
    const leaves = await this.LeaveRepository.getNonHolidayLeaveByUser(userId)

    return leaves.map((leave) => ({
      id: leave.id,
      title: null,
      start_date: new Date(leave.start_date + 'T12:00:00'),
      end_date: new Date(leave.end_date + 'T12:00:00'),
      all_day: true,
    }))
  }

  async saveHolidayLeavesForYear(year: number) {
    const holidaysData = await this.LeaveRepository.getDataHolidays(year)

    const holidayLeaves = holidaysData.map((holiday) => ({
      start_date: new Date(holiday.date + 'T12:00:00Z'),
      end_date: new Date(holiday.date + 'T12:00:00Z'),
      title: holiday.localName,
      type: 'holiday',
      status: 'approved',
      user_id: null,
    }))

    await this.LeaveRepository.deleteHolidayLeavesByYear(year)
    await this.LeaveRepository.saveLeaveBulk(holidayLeaves)

    return { message: 'Holiday leaves saved successfully' }
  }

  async getHolidaysByYear(year: number) {
    let holidays = await this.LeaveRepository.getHolidayLeavesByYear(year)

    if (holidays.length <= 1) {
      await this.saveHolidayLeavesForYear(year)
      holidays = await this.LeaveRepository.getHolidayLeavesByYear(year)
    }

    return holidays.map((leave) => ({
      id: leave.id,
      title: leave.title,
      start_date: leave.start_date,
      end_date: leave.end_date,
      all_day: true,
    }))
  }
}
