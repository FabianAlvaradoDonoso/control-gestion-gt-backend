import { User } from '@/domain/user/user.entity'
import { Leave } from '@/domain/leave/leave.entity'
import { Client } from '@/domain/client/client.entity'
import { AppDataSource } from '@/core/config/database'
import { Project } from '@/domain/project/project.entity'
import { TimeBlock } from '@/shared/entities/time-blocks.entity'
import { Assignment } from '@/domain/assignment/assignment.entity'
import { ProjectComment } from '@/shared/entities/project-comment.entity'

import type {
  TeamUser,
  UserLeave,
  ProjectDetails,
  ResponsibleUser,
  ProjectAssignment,
  ProjectCommentItem,
  PartnersManagersData,
} from './management-control.schema'

export class ManagementControlRepository {
  private projectRepository = AppDataSource.getRepository(Project)
  private timeBlockRepository = AppDataSource.getRepository(TimeBlock)
  private leaveRepository = AppDataSource.getRepository(Leave)
  private commentRepository = AppDataSource.getRepository(ProjectComment)
  private userRepository = AppDataSource.getRepository(User)
  private assignmentRepository = AppDataSource.getRepository(Assignment)

  async getTotalHoursPlanned(projectId: string): Promise<number> {
    const result = await this.projectRepository
      .createQueryBuilder('project')
      .select('COALESCE(SUM(project.planned_hours), 0)', 'total')
      .where('project.id = :projectId', { projectId })
      .getRawOne()

    return parseFloat(result?.total || 0)
  }

  async getTotalHoursAssigned(projectId: string): Promise<number> {
    const result = await this.timeBlockRepository
      .createQueryBuilder('time_block')
      .select('COALESCE(SUM(time_block.duration_hours), 0)', 'total')
      .innerJoin(Assignment, 'assignment', 'time_block.assignment_id = assignment.id')
      .where('assignment.project_id = :projectId', { projectId })
      .andWhere('time_block.is_active = :isActive', { isActive: true })
      .getRawOne()

    return parseFloat(result?.total || 0)
  }

  async getDetails(projectId: string): Promise<ProjectDetails | null> {
    const result = await this.projectRepository
      .createQueryBuilder('project')
      .select([
        'project.name AS name',
        'project.internal_code AS internal_code',
        'project.type AS type',
        'project.priority AS priority',
        "TO_CHAR(project.start_date, 'YYYY-MM-DD') AS start_date",
        "TO_CHAR(project.end_date, 'YYYY-MM-DD') AS end_date",
        'project.description AS description',
        'project.status AS status',
        'project.planned_hours AS planned_hours',
        'client.name AS client_name',
      ])
      .innerJoin(Client, 'client', 'project.client_id = client.id')
      .where('project.id = :projectId', { projectId })
      .getRawOne()

    return result || null
  }

  async getResponsibleUsers(projectId: string): Promise<ResponsibleUser[] | null> {
    const projectData = await this.projectRepository
      .createQueryBuilder('project')
      .select(['project.partners AS partners', 'project.managers AS managers'])
      .where('project.id = :projectId', { projectId })
      .getRawOne()

    if (!projectData) {
      return null
    }

    const partnersData: PartnersManagersData = projectData.partners || {
      ids: [],
      primary: null,
    }
    const managersData: PartnersManagersData = projectData.managers || {
      ids: [],
      primary: null,
    }

    const partnerIds = partnersData.ids || []
    const managerIds = managersData.ids || []
    const primaryPartnerId = partnersData.primary
    const primaryManagerId = managersData.primary

    // Agregar el primario a la lista de IDs si existe y no está incluido
    const allPartnerIds = [...partnerIds]
    if (primaryPartnerId && !allPartnerIds.includes(primaryPartnerId)) {
      allPartnerIds.push(primaryPartnerId)
    }

    const allManagerIds = [...managerIds]
    if (primaryManagerId && !allManagerIds.includes(primaryManagerId)) {
      allManagerIds.push(primaryManagerId)
    }

    // Obtener información de los partners
    const partners: ResponsibleUser[] = []
    if (allPartnerIds.length > 0) {
      const partnerResults = await this.userRepository
        .createQueryBuilder('user')
        .select(['user.id AS id', 'user.name AS name'])
        .where('user.id IN (:...ids)', { ids: allPartnerIds })
        .getRawMany()

      partners.push(
        ...partnerResults.map((p) => ({
          id: p.id,
          name: p.name,
          is_primary: p.id === primaryPartnerId,
          role: 'partner' as const,
        }))
      )
    }

    // Obtener información de los managers
    const managers: ResponsibleUser[] = []
    if (allManagerIds.length > 0) {
      const managerResults = await this.userRepository
        .createQueryBuilder('user')
        .select(['user.id AS id', 'user.name AS name'])
        .where('user.id IN (:...ids)', { ids: allManagerIds })
        .getRawMany()

      managers.push(
        ...managerResults.map((m) => ({
          id: m.id,
          name: m.name,
          is_primary: m.id === primaryManagerId,
          role: 'manager' as const,
        }))
      )
    }

    return [...partners, ...managers]
  }

  async addResponsibleUser(
    projectId: string,
    userId: string,
    role: 'partner' | 'manager'
  ): Promise<ResponsibleUser[] | null> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    })

    if (!project) {
      return null
    }

    if (role === 'partner') {
      const partnersData: PartnersManagersData = project.partners
        ? typeof project.partners === 'string'
          ? JSON.parse(project.partners)
          : project.partners
        : { ids: [], primary: null }

      partnersData.ids = partnersData.ids || []
      if (!partnersData.ids.includes(userId)) {
        partnersData.ids.push(userId)
      }

      project.partners = partnersData as any
    } else if (role === 'manager') {
      const managersData: PartnersManagersData = project.managers
        ? typeof project.managers === 'string'
          ? JSON.parse(project.managers)
          : project.managers
        : { ids: [], primary: null }

      managersData.ids = managersData.ids || []
      if (!managersData.ids.includes(userId)) {
        managersData.ids.push(userId)
      }

      project.managers = managersData as any
    }

    await this.projectRepository.save(project)
    return this.getResponsibleUsers(projectId)
  }

  async removeResponsibleUser(
    projectId: string,
    userId: string,
    role: 'partner' | 'manager'
  ): Promise<ResponsibleUser[] | null> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    })

    if (!project) {
      return null
    }

    if (role === 'partner') {
      const partnersData: PartnersManagersData = project.partners
        ? typeof project.partners === 'string'
          ? JSON.parse(project.partners)
          : project.partners
        : { ids: [], primary: null }

      partnersData.ids = partnersData.ids || []
      partnersData.ids = partnersData.ids.filter((id) => id !== userId)

      project.partners = partnersData as any
    } else if (role === 'manager') {
      const managersData: PartnersManagersData = project.managers
        ? typeof project.managers === 'string'
          ? JSON.parse(project.managers)
          : project.managers
        : { ids: [], primary: null }

      managersData.ids = managersData.ids || []
      managersData.ids = managersData.ids.filter((id) => id !== userId)

      project.managers = managersData as any
    }

    await this.projectRepository.save(project)
    return this.getResponsibleUsers(projectId)
  }

  async setPrimaryResponsibleUser(
    projectId: string,
    userId: string,
    role: 'partner' | 'manager'
  ): Promise<ResponsibleUser[] | null> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    })

    if (!project) {
      return null
    }

    if (role === 'partner') {
      const partnersData: PartnersManagersData = project.partners
        ? typeof project.partners === 'string'
          ? JSON.parse(project.partners)
          : project.partners
        : { ids: [], primary: null }

      partnersData.ids = partnersData.ids || []
      const oldPrimary = partnersData.primary

      partnersData.primary = userId

      if (partnersData.ids.includes(userId)) {
        partnersData.ids = partnersData.ids.filter((id) => id !== userId)
        if (oldPrimary) {
          partnersData.ids.push(oldPrimary)
        }
      }

      project.partners = partnersData as any
    } else if (role === 'manager') {
      const managersData: PartnersManagersData = project.managers
        ? typeof project.managers === 'string'
          ? JSON.parse(project.managers)
          : project.managers
        : { ids: [], primary: null }

      managersData.ids = managersData.ids || []
      const oldPrimary = managersData.primary

      managersData.primary = userId

      if (managersData.ids.includes(userId)) {
        managersData.ids = managersData.ids.filter((id) => id !== userId)
        if (oldPrimary) {
          managersData.ids.push(oldPrimary)
        }
      }

      project.managers = managersData as any
    }

    await this.projectRepository.save(project)
    return this.getResponsibleUsers(projectId)
  }

  async getDatesInfo(projectId: string): Promise<{ startDate: Date; endDate: Date } | null> {
    const result = await this.projectRepository
      .createQueryBuilder('project')
      .select(['project.start_date AS "startDate"', 'project.end_date AS "endDate"'])
      .where('project.id = :projectId', { projectId })
      .getRawOne()

    return result || null
  }

  async getAssignments(projectId: string): Promise<ProjectAssignment[]> {
    return this.projectRepository
      .createQueryBuilder('project')
      .select([
        'assignment.user_id AS "userId"',
        'TO_CHAR(time_block.date, \'YYYY-MM-DD\') AS "date"',
        'user.name AS "userName"',
        'assignment.role AS "userRole"',
      ])
      .innerJoin(Assignment, 'assignment', 'assignment.project_id = project.id')
      .innerJoin(TimeBlock, 'time_block', 'time_block.assignment_id = assignment.id')
      .innerJoin(User, 'user', 'assignment.user_id = user.id')
      .where('assignment.project_id = :projectId', { projectId })
      .andWhere('time_block.is_active = :isActive', { isActive: true })
      .groupBy('time_block.date, assignment.user_id, user.name, assignment.role')
      .getRawMany()
  }

  async getLeavesUsersAssignments(userIds: string[], projectId: string): Promise<UserLeave[]> {
    if (!userIds || userIds.length === 0) {
      return []
    }

    const projectDates = await this.projectRepository
      .createQueryBuilder('project')
      .select(['project.start_date AS "startDate"', 'project.end_date AS "endDate"'])
      .where('project.id = :projectId', { projectId })
      .getRawOne()

    if (!projectDates) {
      return []
    }

    return this.leaveRepository
      .createQueryBuilder('leave')
      .select([
        'leave.user_id AS "userId"',
        'leave.start_date AS "startDate"',
        'leave.end_date AS "endDate"',
      ])
      .where('leave.user_id IN (:...userIds)', { userIds })
      .andWhere('leave.status = :status', { status: 'approved' })
      .andWhere('leave.start_date <= :endDate', {
        endDate: projectDates.endDate,
      })
      .andWhere('leave.end_date >= :startDate', {
        startDate: projectDates.startDate,
      })
      .getRawMany()
  }

  async getProjectComments(projectId: string): Promise<ProjectCommentItem[]> {
    return this.commentRepository
      .createQueryBuilder('comment')
      .select([
        'comment.id AS id',
        'comment.parent_id AS parent_id',
        'comment.user_id AS user_id',
        'user.name AS user_name',
        'comment.content AS content',
        'comment.created_at AS created_at',
        'comment.updated_at AS updated_at',
      ])
      .innerJoin(User, 'user', 'comment.user_id = user.id')
      .where('comment.project_id = :projectId', { projectId })
      .orderBy('comment.id', 'ASC')
      .getRawMany()
  }

  async getProjectCommentsById(commentId: number): Promise<ProjectCommentItem[]> {
    return this.commentRepository
      .createQueryBuilder('comment')
      .select([
        'comment.id AS id',
        'comment.parent_id AS parent_id',
        'comment.user_id AS user_id',
        'user.name AS user_name',
        'comment.content AS content',
        'comment.created_at AS created_at',
        'comment.updated_at AS updated_at',
      ])
      .innerJoin(User, 'user', 'comment.user_id = user.id')
      .where('comment.id = :commentId', { commentId })
      .orderBy('comment.created_at', 'ASC')
      .getRawMany()
  }

  async postProjectComment(
    projectId: string,
    content: string,
    parentId: number | null,
    userId: string,
    status: string
  ): Promise<ProjectCommentItem[]> {
    const newComment = this.commentRepository.create({
      project_id: projectId,
      parent_id: parentId,
      user_id: userId,
      content,
      status,
    })

    await this.commentRepository.save(newComment)

    return this.getProjectCommentsById(newComment.id)
  }

  async updateProjectComment(commentId: number, newContent: string): Promise<ProjectCommentItem[]> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
    })

    if (comment) {
      comment.content = newContent
      comment.updated_at = new Date()
      await this.commentRepository.save(comment)
    }

    return this.getProjectCommentsById(commentId)
  }

  async getTeamUsers(projectId: string): Promise<TeamUser[]> {
    return this.userRepository
      .createQueryBuilder('user')
      .select([
        'user.id AS id',
        'user.name AS name',
        'SUM(time_block.duration_hours) AS total_hours',
        'assignment.role AS role',
      ])
      .innerJoin(Assignment, 'assignment', 'user.id = assignment.user_id')
      .innerJoin(TimeBlock, 'time_block', 'assignment.id = time_block.assignment_id')
      .where('assignment.project_id = :projectId', { projectId })
      .andWhere('time_block.is_active = :isActive', { isActive: true })
      .groupBy('user.id, user.name, assignment.role')
      .getRawMany()
  }

  async deleteTeamUser(projectId: string, userId: string): Promise<void> {
    const assignments = await this.assignmentRepository.find({
      where: { user_id: userId, project_id: projectId },
      select: ['id'],
    })

    if (assignments.length === 0) {
      return
    }

    await this.timeBlockRepository
      .createQueryBuilder('time_blocks')
      .update()
      .set({ is_active: false })
      .where('time_blocks.assignment_id IN (:...assignmentIds)', {
        assignmentIds: assignments.map((a) => a.id),
      })
      .setParameter('userId', userId)
      .setParameter('projectId', projectId)
      .execute()
  }
}
