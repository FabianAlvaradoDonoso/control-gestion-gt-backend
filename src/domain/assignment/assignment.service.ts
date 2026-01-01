import { UserRepository } from '@/domain/user/user.repository'
import { AuditRepository } from '@/domain/audit/audit.repository'
import { LeaveRepository } from '@/domain/leave/leave.repository'
import { ConfigRepository } from '@/domain/config/config.repository'
import { ProjectRepository } from '@/domain/project/project.repository'

import { AssignmentMessages } from './assignment.messages'
import { AssignmentRepository } from './assignment.repository'

import type { WorkingHoursConfigValue } from '../config/config.schema'
import type {
  Leave,
  Project,
  TimeBlock,
  FixedBlockInput,
  SimulatedCascadeInput,
} from './assignment.schema'

export class AssignmentService {
  private assignmentRepository: AssignmentRepository
  private userRepository: UserRepository
  private projectRepository: ProjectRepository
  private leaveRepository: LeaveRepository
  private auditRepository: AuditRepository
  private configRepository: ConfigRepository

  constructor() {
    this.assignmentRepository = new AssignmentRepository()
    this.userRepository = new UserRepository()
    this.projectRepository = new ProjectRepository()
    this.leaveRepository = new LeaveRepository()
    this.auditRepository = new AuditRepository()
    this.configRepository = new ConfigRepository()
  }

  async getAll(
    userId: string | undefined,
    startDatetime: string | undefined,
    endDatetime: string | undefined
  ): Promise<any[]> {
    if (!userId || !startDatetime || !endDatetime) {
      throw new Error('Missing required query parameters')
    }

    const data = await this.assignmentRepository.getTimeBlocksByUserAndDatetime(
      userId,
      new Date(startDatetime),
      new Date(endDatetime)
    )

    return data.map((item) => {
      const { project_id, project_name, assignment_role, ...timeBlock } = item
      return {
        TimeBlocksModel: timeBlock,
        project_id,
        project_name,
        assignment_role,
      }
    })
  }

  private async validationsTimeBlocks(
    originalTimeBlocks: TimeBlock[],
    userId: string,
    project: Project,
    comments: { more_than_8_hours: string; out_of_project_range: string } | null = null,
    maxDailyHours: number = 8,
    maxDailyHoursOvertime: number = 10
  ): Promise<void> {
    // Verify if time_blocks start_time is before end_time
    for (const tb of originalTimeBlocks || []) {
      if (tb.start_time >= tb.end_time) {
        throw new Error(
          AssignmentMessages.TIME_BLOCK_INVALID_TIME_RANGE(tb.date, tb.start_time, tb.end_time)
        )
      }
    }

    // TIME BLOCKS VALIDATIONS
    const dailyDurations: Record<string, number> = {}
    for (const tb of originalTimeBlocks || []) {
      if (!(tb.date in dailyDurations)) {
        dailyDurations[tb.date] = 0
      }

      const startDt = new Date(`${tb.date}T${tb.start_time}`)
      const endDt = new Date(`${tb.date}T${tb.end_time}`)
      const durationHours = (endDt.getTime() - startDt.getTime()) / (1000 * 3600)
      dailyDurations[tb.date] += durationHours

      if (
        maxDailyHours < durationHours &&
        durationHours <= maxDailyHoursOvertime &&
        (!comments || !comments.more_than_8_hours)
      ) {
        throw new Error(
          AssignmentMessages.TIME_BLOCK_COMMENT_REQUIRED(
            tb.date,
            tb.start_time,
            tb.end_time,
            maxDailyHours,
            maxDailyHoursOvertime
          )
        )
      }
      if (dailyDurations[tb.date] > maxDailyHoursOvertime) {
        throw new Error(
          AssignmentMessages.TIME_BLOCK_EXCEEDS_DAILY_LIMIT(tb.date, maxDailyHoursOvertime)
        )
      }
    }

    // Validate blocks outside project date range
    const projectStartDate = project.start_date
    const projectEndDate = project.end_date

    for (const tb of originalTimeBlocks || []) {
      const tbDate = new Date(tb.date)

      if (tbDate < projectStartDate) {
        throw new Error(
          AssignmentMessages.TIME_BLOCK_OUTSIDE_PROJECT_DATES(
            tb.date,
            projectStartDate.toISOString(),
            projectEndDate.toISOString()
          )
        )
      }

      if (tbDate > projectEndDate && (!comments || !comments.out_of_project_range)) {
        throw new Error(
          AssignmentMessages.TIME_BLOCK_OUTSIDE_PROJECT_DATES(
            tb.date,
            projectStartDate.toISOString(),
            projectEndDate.toISOString()
          )
        )
      }
    }

    // Verify time blocks don't overlap with existing assignments
    const minDate = originalTimeBlocks.reduce(
      (min, tb) => (tb.date < min ? tb.date : min),
      originalTimeBlocks[0].date
    )
    const maxDate = originalTimeBlocks.reduce(
      (max, tb) => (tb.date > max ? tb.date : max),
      originalTimeBlocks[0].date
    )
    const timeBlocks = await this.assignmentRepository.getTimeBlocksByUserAndDatetime(
      userId,
      new Date(minDate),
      new Date(maxDate)
    )

    const tblocks = timeBlocks.map((item) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { project_id, project_name, assignment_role, ...timeBlocksModel } = item
      return timeBlocksModel
    })

    const existingTimeBlocks = tblocks.map((tb: any) => ({
      id: tb.id,
      date: tb.date,
      start_time: tb.start_time,
      end_time: tb.end_time,
    }))

    // Check overlaps
    for (const newTb of originalTimeBlocks) {
      const newStart = new Date(`${newTb.date}T${newTb.start_time}`)
      const newEnd = new Date(`${newTb.date}T${newTb.end_time}`)

      for (const existingTb of existingTimeBlocks) {
        if (existingTb.id === newTb.id) {
          continue
        }

        if (existingTb.date !== newTb.date) {
          continue
        }

        const existingStart = new Date(`${existingTb.date}T${existingTb.start_time}`)
        const existingEnd = new Date(`${existingTb.date}T${existingTb.end_time}`)

        if (!(newEnd <= existingStart || newStart >= existingEnd)) {
          throw new Error(
            AssignmentMessages.TIME_BLOCK_OVERLAP(newTb.date, newTb.start_time, newTb.end_time)
          )
        }
      }
    }
  }

  private isHighSeason(startHighSeasonDate: string, endHighSeasonDate: string): boolean {
    const today = new Date()
    const currentYear = today.getFullYear()

    const startHighSeason = new Date(`${currentYear}-${startHighSeasonDate}T00:00:00`)
    const endHighSeason = new Date(`${currentYear}-${endHighSeasonDate}T23:59:59`)

    return today >= startHighSeason && today <= endHighSeason
  }

  private async getSeasonMode(
    workingHoursConfig: WorkingHoursConfigValue
  ): Promise<'high' | 'normal'> {
    const seasonConfig = await this.configRepository.getSeasonConfig()
    if (!seasonConfig || !seasonConfig.value) {
      return 'normal'
    }

    const seasonMode = seasonConfig.value.season_mode || 'auto'
    if (seasonMode === 'auto') {
      const highStartDate = workingHoursConfig.common.high_start_date
      const highEndDate = workingHoursConfig.common.high_end_date

      if (this.isHighSeason(highStartDate, highEndDate)) {
        return 'high'
      } else {
        return 'normal'
      }
    } else {
      return seasonMode === 'high' ? 'high' : 'normal'
    }
  }

  async processAssignmentFixedBlocks(
    assignmentData: FixedBlockInput
  ): Promise<{ message: string }> {
    const [project] = await this.commonValidations(assignmentData)
    const comments = this.getCommentsDict(assignmentData)

    const workingHoursConfig = await this.configRepository.getWorkingHoursConfig()
    if (!workingHoursConfig?.value) {
      throw new Error('WORKING_HOURS_CONFIG_NOT_FOUND')
    }
    const workingHours = workingHoursConfig.value
    const seasonMode = await this.getSeasonMode(workingHours)
    const maxDailyHours = workingHours.common.max_daily_hours || 8
    const maxDailyHoursOvertime = workingHours[seasonMode].max_daily_hours_overtime || 10

    // === Deleted time_blocks ===
    if (assignmentData.deleted_time_block_ids && assignmentData.deleted_time_block_ids.length > 0) {
      await this.assignmentRepository.deleteSoftTimeBlocksByIds(
        assignmentData.deleted_time_block_ids
      )

      const countHours = await this.assignmentRepository.getTotalHoursByTimeBlockIds(
        assignmentData.deleted_time_block_ids
      )

      await this.auditRepository.auditDelete({
        entity_type: 'time_block',
        entity_id: project.id,
        user_id: assignmentData.assign_by_user_id,
        deleted_entity: { user_id: assignmentData.user_id, hours: countHours },
      })
    }

    // === Edited time_blocks ===
    if (assignmentData.edited_time_blocks && assignmentData.edited_time_blocks.length > 0) {
      this.validationsTimeBlocks(
        assignmentData.edited_time_blocks,
        assignmentData.user_id,
        project,
        comments,
        maxDailyHours,
        maxDailyHoursOvertime
      )

      const assignment = this.assignmentRepository.getByUserProject(
        assignmentData.user_id,
        assignmentData.project_id
      )

      if (!assignment) {
        throw new Error(AssignmentMessages.ASSIGNMENT_NOT_FOUND_FOR_EDIT)
      }

      const updatedTimeBlocks = []
      for (const tb of assignmentData.edited_time_blocks || []) {
        const startDt = new Date(`${tb.date}T${tb.start_time}`)
        const endDt = new Date(`${tb.date}T${tb.end_time}`)
        const durationHours = (endDt.getTime() - startDt.getTime()) / (1000 * 3600)
        const isOutOfProjectRange =
          new Date(tb.date) < project.start_date || new Date(tb.date) > project.end_date

        let comment = ''
        if (durationHours > maxDailyHours) {
          comment = comments.more_than_8_hours
        }
        if (isOutOfProjectRange) {
          if (comment) {
            comment += ' | '
          }
          comment += comments.out_of_project_range
        }

        updatedTimeBlocks.push({
          id: tb.id!,
          date: tb.date,
          start_time: tb.start_time,
          end_time: tb.end_time,
          comment: comment || null,
          duration_hours: durationHours,
          assign_by_user_id: assignmentData.assign_by_user_id,
          mode: tb.mode,
        })
      }

      const oldTotalHours = await this.assignmentRepository.getTotalAssignedHoursByUserRangeDates(
        assignmentData.user_id
      )

      await this.assignmentRepository.updateTimeBlocksBulk(updatedTimeBlocks)

      const newTotalHours = await this.assignmentRepository.getTotalAssignedHoursByUserRangeDates(
        assignmentData.user_id
      )

      await this.auditRepository.auditUpdate({
        entity_type: 'time_block',
        entity_id: project.id,
        user_id: assignmentData.assign_by_user_id,
        old_snapshot: { user_id: assignmentData.user_id, hours: oldTotalHours },
        new_snapshot: { user_id: assignmentData.user_id, hours: newTotalHours },
        no_compare_field: true,
      })
    }

    // === New time_blocks ===
    if (assignmentData.time_blocks && assignmentData.time_blocks.length > 0) {
      await this.validationsTimeBlocks(
        assignmentData.time_blocks,
        assignmentData.user_id,
        project,
        comments,
        maxDailyHours,
        maxDailyHoursOvertime
      )

      let assignment = await this.assignmentRepository.getByUserProject(
        assignmentData.user_id,
        assignmentData.project_id
      )

      if (!assignment) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { time_blocks: _time_blocks, ...assignmentDataDict } = assignmentData
        assignment = await this.assignmentRepository.create(assignmentDataDict)
      }

      const newTimeBlocks = []
      for (const tb of assignmentData.time_blocks || []) {
        const startDt = new Date(`${tb.date}T${tb.start_time}`)
        const endDt = new Date(`${tb.date}T${tb.end_time}`)
        const durationHours = (endDt.getTime() - startDt.getTime()) / (1000 * 3600)
        const isOutOfProjectRange =
          new Date(tb.date) < project.start_date || new Date(tb.date) > project.end_date

        let comment = ''
        if (durationHours > maxDailyHours) {
          comment = comments.more_than_8_hours
        }
        if (isOutOfProjectRange) {
          if (comment) {
            comment += ' | '
          }
          comment += comments.out_of_project_range
        }

        newTimeBlocks.push({
          assignment_id: assignment.id,
          date: tb.date,
          start_time: tb.start_time,
          end_time: tb.end_time,
          assign_by_user_id: assignmentData.assign_by_user_id,
          comment: comment || null,
          duration_hours: durationHours,
          mode: tb.mode,
        })
      }

      await this.assignmentRepository.createTimeBlocksBulk(newTimeBlocks)

      await this.auditRepository.auditCreate({
        entity_type: 'time_block',
        entity_id: project.id,
        user_id: assignmentData.assign_by_user_id,
        new_entity: {
          user_id: assignmentData.user_id,
          hours: newTimeBlocks.reduce((sum, tb) => sum + tb.duration_hours, 0),
        },
      })
    }

    return { message: AssignmentMessages.FINISH_SUCCESSFULLY }
  }

  async simulateAssignmentCascade(
    assignmentData: SimulatedCascadeInput
  ): Promise<{ generated_time_blocks: TimeBlock[]; message: string }> {
    const [project] = await this.commonValidations(assignmentData)

    const workingHoursConfig = await this.configRepository.getWorkingHoursConfig()
    if (!workingHoursConfig?.value) {
      throw new Error('WORKING_HOURS_CONFIG_NOT_FOUND')
    }
    const workingHours = workingHoursConfig.value
    const maxDailyHours = workingHours.common.max_daily_hours || 8
    const lunchStartTime = workingHours.common.lunch_start_time || '13:00:00'
    const lunchEndTime = workingHours.common.lunch_end_time || '14:00:00'
    const workStartTime = workingHours.common.work_start_time || '09:00:00'
    const workEndTime = workingHours.common.work_end_time || '18:00:00'

    const existingTimeBlocks = await this.assignmentRepository.getTimeBlocksByUserAndDatetime(
      assignmentData.user_id,
      new Date(assignmentData.start_date)
    )

    const existingBlocksDict: Record<string, Array<{ start_time: string; end_time: string }>> = {}
    for (const tb of existingTimeBlocks) {
      const dateStr = tb.date
      if (!(dateStr in existingBlocksDict)) {
        existingBlocksDict[dateStr] = []
      }
      existingBlocksDict[dateStr].push({
        start_time: tb.start_time.slice(0, 8),
        end_time: tb.end_time.slice(0, 8),
      })
    }

    const projectStartDate = project.start_date
    if (new Date(assignmentData.start_date) < projectStartDate) {
      throw new Error(AssignmentMessages.SIMULATION_START_DATE_BEFORE_PROJECT_START)
    }

    const currentDate = new Date(assignmentData.start_date + 'T12:00:00')
    let remainingHours = assignmentData.total_hours
    const generatedTimeBlocks: TimeBlock[] = []

    const userLeaves = await this.leaveRepository.getNonHolidayLeaveByUser(assignmentData.user_id)
    const userLeavesData = userLeaves.map((leave: Leave) => ({
      start_date: new Date(leave.start_date + 'T12:00:00'),
      end_date: new Date(leave.end_date + 'T12:00:00'),
    }))

    const holidaysLeaves = await this.leaveRepository.getHolidayLeavesByYear()
    const holidaysLeavesData = holidaysLeaves.map((leave: Leave) => ({
      start_date: new Date(leave.start_date + 'T12:00:00'),
      end_date: new Date(leave.end_date + 'T12:00:00'),
    }))

    const startDate = new Date(assignmentData.start_date)

    while (remainingHours > 0) {
      if (currentDate.getDay() >= 1 && currentDate.getDay() <= 5) {
        const isUserOnLeave = userLeavesData.some(
          (leave) => currentDate >= leave.start_date && currentDate <= leave.end_date
        )
        if (isUserOnLeave) {
          currentDate.setDate(currentDate.getDate() + 1)
          continue
        }

        const isHoliday = holidaysLeavesData.some(
          (leave) => currentDate >= leave.start_date && currentDate <= leave.end_date
        )
        if (isHoliday) {
          currentDate.setDate(currentDate.getDate() + 1)
          continue
        }
        const currentDateStr = currentDate.toISOString().split('T')[0]
        const maxHoursPerDay = maxDailyHours

        const existingBlocksToday = existingBlocksDict[currentDateStr] || []
        const occupiedHoursToday = this.calculateOccupiedHours(existingBlocksToday)

        let assignedHoursToday = 0
        while (remainingHours > 0) {
          const totalOccupiedToday = occupiedHoursToday + assignedHoursToday
          const remainingHoursToday = maxHoursPerDay - totalOccupiedToday

          if (remainingHoursToday <= 0) {
            break
          }

          const dailyAvailableSlots = this.getAvailableTimeSlots(
            existingBlocksDict[currentDateStr] || [],
            workStartTime,
            workEndTime,
            lunchStartTime,
            lunchEndTime
          )

          if (dailyAvailableSlots.length === 0) {
            break
          }

          const [slotStart, slotEnd] = dailyAvailableSlots[0]

          const slotStartDt = this.parseTime(slotStart)
          const slotEndDt = this.parseTime(slotEnd)
          const slotDuration = (slotEndDt.getTime() - slotStartDt.getTime()) / (1000 * 3600)

          const hoursToAssign = Math.min(slotDuration, remainingHoursToday, remainingHours)

          if (hoursToAssign > 0) {
            const blockEndDt = new Date(slotStartDt.getTime() + hoursToAssign * 3600 * 1000)
            const blockEndStr = blockEndDt.toTimeString().slice(0, 8)

            const timeBlock: TimeBlock = {
              date: currentDateStr,
              start_time: slotStart,
              end_time: blockEndStr,
              duration_hours: hoursToAssign,
              mode: 'cascade',
            }

            generatedTimeBlocks.push(timeBlock)
            assignedHoursToday += hoursToAssign
            remainingHours -= hoursToAssign

            if (!(currentDateStr in existingBlocksDict)) {
              existingBlocksDict[currentDateStr] = []
            }
            existingBlocksDict[currentDateStr].push({
              start_time: slotStart,
              end_time: blockEndStr,
            })
          } else {
            break
          }
        }

        if (assignedHoursToday === 0 && !(currentDateStr in existingBlocksDict)) {
          existingBlocksDict[currentDateStr] = []
        }
      }

      currentDate.setDate(currentDate.getDate() + 1)

      if ((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24) > 365) {
        throw new Error(AssignmentMessages.SIMULATION_EXCEEDS_ONE_YEAR)
      }
    }

    return {
      generated_time_blocks: generatedTimeBlocks,
      message: AssignmentMessages.ASSIGNMENT_SIMULATION_COMPLETED,
    }
  }

  private getAvailableTimeSlots(
    existingBlocks: Array<{ start_time: string; end_time: string }>,
    workStart: string,
    workEnd: string,
    lunchStart: string,
    lunchEnd: string
  ): Array<[string, string]> {
    const occupiedPeriods: Array<[string, string]> = []

    occupiedPeriods.push([lunchStart, lunchEnd])

    for (const block of existingBlocks) {
      occupiedPeriods.push([block.start_time, block.end_time])
    }

    occupiedPeriods.sort((a, b) => (a[0] < b[0] ? -1 : 1))

    const availableSlots: Array<[string, string]> = []
    let currentTime = workStart

    for (const [startTime, endTime] of occupiedPeriods) {
      if (currentTime < startTime) {
        availableSlots.push([currentTime, startTime])
      }
      currentTime = currentTime > endTime ? currentTime : endTime
    }

    if (currentTime < workEnd) {
      availableSlots.push([currentTime, workEnd])
    }

    return availableSlots
  }

  private calculateOccupiedHours(
    existingBlocks: Array<{ start_time: string; end_time: string }>
  ): number {
    let totalHours = 0
    for (const block of existingBlocks) {
      const startDt = this.parseTime(block.start_time)
      const endDt = this.parseTime(block.end_time)
      const hours = (endDt.getTime() - startDt.getTime()) / (1000 * 3600)
      totalHours += hours
    }
    return totalHours
  }

  private parseTime(timeStr: string): Date {
    const [hours, minutes, seconds] = timeStr.split(':').map(Number)
    const date = new Date()
    date.setHours(hours, minutes, seconds, 0)
    return date
  }

  private async commonValidations(
    assignmentData: FixedBlockInput | SimulatedCascadeInput
  ): Promise<[any, any, any]> {
    const project = await this.projectRepository.getById(assignmentData.project_id)
    if (!project) {
      throw new Error(AssignmentMessages.PROJECT_NOT_FOUND)
    }

    const user = await this.userRepository.findById(assignmentData.user_id)
    if (!user) {
      throw new Error(AssignmentMessages.USER_NOT_FOUND)
    }

    const assignByUser = await this.userRepository.findById(assignmentData.assign_by_user_id)
    if (!assignByUser) {
      throw new Error(AssignmentMessages.ASSIGN_BY_USER_NOT_FOUND)
    }

    return [project, user, assignByUser]
  }

  private getCommentsDict(assignmentData: FixedBlockInput): {
    more_than_8_hours: string
    out_of_project_range: string
  } {
    return {
      more_than_8_hours: assignmentData.comments?.more_than_8_hours || '',
      out_of_project_range: assignmentData.comments?.out_of_project_range || '',
    }
  }

  async userHoursPorcentage(userId: string): Promise<unknown> {
    const totalAssigedHours = await this.assignmentRepository.getTotalAssignedHoursByUserRangeDates(
      userId,
      new Date(),
      new Date(new Date().setDate(new Date().getDate() + 60))
    )

    const standardWeeklyHours = 40
    const standardMonthlyHours = standardWeeklyHours * 4

    const percentage = (totalAssigedHours / (standardMonthlyHours * 2)) * 100
    return Math.round(percentage * 100) / 100
  }
}
