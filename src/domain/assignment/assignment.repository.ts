import { In } from 'typeorm'
import { AppDataSource } from '@/core/config/database'
import { Project } from '@/domain/project/project.entity'
import { TimeBlock } from '@/shared/entities/time-blocks.entity'

import { Assignment } from './assignment.entity'

import type {
  CreateTimeBlockInput,
  TimeBlockWithProject,
  UpdateTimeBlockInput,
} from './assignment.schema'

export class AssignmentRepository {
  private repository = AppDataSource.getRepository(Assignment)
  private timeBlockRepository = AppDataSource.getRepository(TimeBlock)

  async getAll(userId: string, startDatetime: Date, endDatetime: Date): Promise<Assignment[]> {
    return this.repository
      .createQueryBuilder('assignment')
      .innerJoinAndSelect(
        'assignment.timeBlocks',
        'time_block',
        'time_block.assignment_id = assignment.id'
      )
      .where('assignment.user_id = :userId', { userId })
      .andWhere('time_block.is_active = :isActive', { isActive: true })
      .andWhere('time_block.date >= :startDate', {
        startDate: startDatetime.toISOString().split('T')[0],
      })
      .andWhere('time_block.date <= :endDate', {
        endDate: endDatetime.toISOString().split('T')[0],
      })
      .getMany()
  }

  async getTimeBlocksByUserAndDatetime(
    userId: string,
    startDatetime: Date,
    endDatetime?: Date
  ): Promise<TimeBlockWithProject[]> {
    const query = this.timeBlockRepository
      .createQueryBuilder('time_block')
      .select([
        'time_block.id AS id',
        'time_block.assignment_id AS assignment_id',
        "TO_CHAR(time_block.date, 'YYYY-MM-DD') AS date",
        'time_block.start_time AS start_time',
        'time_block.end_time AS end_time',
        'time_block.duration_hours AS duration_hours',
        'time_block.is_active AS is_active',
        'time_block.assign_by_user_id AS assign_by_user_id',
        'time_block.comment AS comment',
        'time_block.created_at AS created_at',
        'project.id AS project_id',
        'project.name AS project_name',
        'assignment.role AS assignment_role',
      ])
      .innerJoin(Assignment, 'assignment', 'time_block.assignment_id = assignment.id')
      .innerJoin(Project, 'project', 'assignment.project_id = project.id')
      .where('assignment.user_id = :userId', { userId })
      .andWhere('project.is_active = :projectActive', { projectActive: true })
      .andWhere('time_block.is_active = :timeBlockActive', {
        timeBlockActive: true,
      })
      .andWhere('time_block.date >= :startDate', {
        startDate: startDatetime.toISOString().split('T')[0],
      })

    if (endDatetime) {
      query.andWhere('time_block.date <= :endDate', {
        endDate: endDatetime.toISOString().split('T')[0],
      })
    }

    return query.getRawMany()
  }

  async create(assignmentData: Partial<Assignment>): Promise<Assignment> {
    const newAssignment = this.repository.create(assignmentData)
    await this.repository.save(newAssignment)
    return newAssignment
  }

  async getByUserProject(userId: string, projectId: string): Promise<Assignment | null> {
    return this.repository.findOne({
      where: {
        user_id: userId,
        project_id: projectId,
      },
    })
  }

  async createTimeBlocksBulk(timeBlocks: CreateTimeBlockInput[]): Promise<void> {
    const timeBlockModels = timeBlocks.map((tb) =>
      this.timeBlockRepository.create({
        assignment_id: tb.assignment_id,
        date: tb.date,
        start_time: tb.start_time,
        end_time: tb.end_time,
        is_active: true,
        comment: tb.comment || null,
        duration_hours: tb.duration_hours,
        assign_by_user_id: tb.assign_by_user_id,
        mode: tb.mode,
      })
    )

    await this.timeBlockRepository.save(timeBlockModels)
  }

  async getTotalAssignedHoursByUserRangeDates(
    userId: string,
    startDate: Date | undefined = undefined,
    endDate: Date | undefined = undefined
  ): Promise<number> {
    const result = await this.timeBlockRepository
      .createQueryBuilder('time_block')
      .select('SUM(time_block.duration_hours)', 'total')
      .innerJoin(Assignment, 'assignment', 'time_block.assignment_id = assignment.id')
      .innerJoin(Project, 'project', 'assignment.project_id = project.id')
      .where('assignment.user_id = :userId', { userId })
      .andWhere('project.is_active = :isActive', { isActive: true })
      .andWhere('time_block.is_active = :timeBlockActive', {
        timeBlockActive: true,
      })

    if (startDate) {
      result.andWhere('time_block.date >= :startDate', {
        startDate: startDate.toISOString().split('T')[0],
      })
    }

    if (endDate) {
      result.andWhere('time_block.date <= :endDate', {
        endDate: endDate.toISOString().split('T')[0],
      })
    }

    const fetchedResult = await result.getRawOne()

    return fetchedResult?.total ? parseFloat(fetchedResult.total) : 0.0
  }

  async deleteTimeBlocksByIds(timeBlockIds: number[]): Promise<void> {
    await this.timeBlockRepository.delete({
      id: In(timeBlockIds),
    })
  }

  async deleteSoftTimeBlocksByIds(timeBlockIds: number[]): Promise<void> {
    await this.timeBlockRepository.update({ id: In(timeBlockIds) }, { is_active: false })
  }

  async updateTimeBlocksBulk(timeBlocks: UpdateTimeBlockInput[]): Promise<void> {
    for (const tb of timeBlocks) {
      await this.timeBlockRepository.update(
        { id: tb.id },
        {
          date: tb.date,
          start_time: tb.start_time,
          end_time: tb.end_time,
          comment: tb.comment || null,
          duration_hours: tb.duration_hours,
          assign_by_user_id: tb.assign_by_user_id,
        }
      )
    }
  }

  async getTotalHoursByTimeBlockIds(timeBlockIds: number[]): Promise<number> {
    if (timeBlockIds.length === 0) {
      return 0.0
    }

    const result = await this.timeBlockRepository
      .createQueryBuilder('time_block')
      .select('SUM(time_block.duration_hours)', 'total')
      .where('time_block.id IN (:...ids)', { ids: timeBlockIds })
      .getRawOne()

    return result?.total ? parseFloat(result.total) : 0.0
  }
}
