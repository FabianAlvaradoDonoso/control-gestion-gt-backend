import { User } from '@/domain/user/user.entity'
import { Area } from '@/shared/entities/area.entity'
import { Client } from '@/domain/client/client.entity'
import { AppDataSource } from '@/core/config/database'
import { TimeBlock } from '@/shared/entities/time-blocks.entity'
import { Assignment } from '@/domain/assignment/assignment.entity'
import { ProjectComment } from '@/shared/entities/project-comment.entity'

import { Project } from './project.entity'

import type { ProjectResumen, ProjectListItem, ProjectAssignment } from './project.schema'

export class ProjectRepository {
  private projectRepository = AppDataSource.getRepository(Project)
  private clientRepository = AppDataSource.getRepository(Client)
  private userRepository = AppDataSource.getRepository(User)
  private areaRepository = AppDataSource.getRepository(Area)
  private assignmentRepository = AppDataSource.getRepository(Assignment)
  private commentRepository = AppDataSource.getRepository(ProjectComment)

  async getProjects(showInactive: boolean = false): Promise<ProjectListItem[]> {
    const query = this.projectRepository
      .createQueryBuilder('project')
      .select([
        'project.id AS id',
        'project.name AS name',
        'project.internal_code AS internal_code',
        'project.client_id AS client_id',
        'client.name AS client_name',
        "CAST(project.partners->>'primary' AS UUID) AS partner_id",
        'partner_user.name AS partner_name',
        "CAST(project.managers->>'primary' AS UUID) AS manager_id",
        'manager_user.name AS manager_name',
        'project.status AS status',
        "TO_CHAR(project.start_date, 'YYYY-MM-DD') AS start_date",
        "TO_CHAR(project.end_date, 'YYYY-MM-DD') AS end_date",
        'project.planned_hours AS planned_hours',
        'project.is_active AS is_active',
      ])
      .innerJoin(Client, 'client', 'project.client_id = client.id')
      .innerJoin(
        User,
        'partner_user',
        "partner_user.id = CAST(project.partners->>'primary' AS UUID)"
      )
      .leftJoin(
        User,
        'manager_user',
        "manager_user.id = CAST(project.managers->>'primary' AS UUID)"
      )

    if (!showInactive) {
      query.where('project.is_active = :isActive', { isActive: true })
    }

    query.orderBy('project.name', 'ASC')

    return query.getRawMany()
  }

  async getProjectsResumen(): Promise<ProjectResumen[]> {
    return this.projectRepository
      .createQueryBuilder('project')
      .select([
        'project.id AS id',
        'project.name AS name',
        'project.internal_code AS internal_code',
        'client.name AS client_name',
        'partner_user.name AS partner_name',
        'manager_user.name AS manager_name',
      ])
      .innerJoin(Client, 'client', 'project.client_id = client.id')
      .innerJoin(
        User,
        'partner_user',
        "partner_user.id = CAST(project.partners->>'primary' AS UUID)"
      )
      .leftJoin(
        User,
        'manager_user',
        "manager_user.id = CAST(project.managers->>'primary' AS UUID)"
      )
      .where('project.is_active = :isActive', { isActive: true })
      .orderBy('project.name', 'ASC')
      .getRawMany()
  }

  async getById(projectId: string): Promise<ProjectListItem | null> {
    const result = await this.projectRepository
      .createQueryBuilder('project')
      .select([
        'project.id AS id',
        'project.name AS name',
        'project.internal_code AS internal_code',
        'project.status AS status',
        'project.priority AS priority',
        'project.type AS type',
        'project.client_id AS client_id',
        'client.name AS client_name',
        'project.area_id AS area_id',
        'area.name AS area_name',
        "CAST(project.partners->>'primary' AS UUID) AS partner_id",
        'partner_user.name AS partner_name',
        "CAST(project.managers->>'primary' AS UUID) AS manager_id",
        'manager_user.name AS manager_name',
        'project.planned_hours AS planned_hours',
        'project.executed_hours AS executed_hours',
        'project.start_date AS start_date',
        'project.end_date AS end_date',
        'project.season AS season',
        'project.active_alerts AS active_alerts',
        'project.description AS description',
        'project.gt_planner_id AS gt_planner_id',
        'project.created_user_id AS created_user_id',
        'project.created_at AS created_at',
        'project.updated_at AS updated_at',
        'project.is_active AS is_active',
      ])
      .innerJoin(Client, 'client', 'project.client_id = client.id')
      .innerJoin(
        User,
        'partner_user',
        "partner_user.id = CAST(project.partners->>'primary' AS UUID)"
      )
      .leftJoin(
        User,
        'manager_user',
        "manager_user.id = CAST(project.managers->>'primary' AS UUID)"
      )
      .innerJoin(Area, 'area', 'project.area_id = area.id')
      .where('project.id = :projectId', { projectId })
      .getRawOne()

    return result || null
  }

  async getAssignmentsByProjectId(projectId: string): Promise<ProjectAssignment[]> {
    return AppDataSource.createQueryBuilder()
      .select([
        'user.name AS user_name',
        'assignment.role AS role',
        'SUM(time_block.duration_hours) AS duration_hours',
      ])
      .from(TimeBlock, 'time_block')
      .innerJoin(Assignment, 'assignment', 'time_block.assignment_id = assignment.id')
      .innerJoin(User, 'user', 'assignment.user_id = user.id')
      .innerJoin(Project, 'project', 'assignment.project_id = project.id')
      .where('project.id = :projectId', { projectId })
      .groupBy('user.name, assignment.role')
      .getRawMany()
  }

  async getModelById(projectId: string): Promise<Project | null> {
    return this.projectRepository.findOne({
      where: { id: projectId },
    })
  }

  async create(projectData: Partial<Project>): Promise<Project> {
    const newProject = this.projectRepository.create(projectData)
    await this.projectRepository.save(newProject)
    return newProject
  }

  async update(projectId: string, projectData: Partial<Project>): Promise<Project | null> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    })

    if (!project) {
      return null
    }

    Object.assign(project, projectData)
    await this.projectRepository.save(project)
    return project
  }

  async delete(projectId: string): Promise<boolean> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    })

    if (!project) {
      return false
    }

    await this.projectRepository.remove(project)
    return true
  }

  async toggleActiveStatus(projectId: string): Promise<void> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    })

    if (project) {
      project.is_active = !project.is_active
      await this.projectRepository.save(project)
    }
  }

  async deleteAssignmentsByProjectId(projectId: string): Promise<void> {
    const assignments = await this.assignmentRepository.find({
      where: { project_id: projectId },
    })

    await this.assignmentRepository.remove(assignments)
  }

  async deleteCommentsByProjectId(projectId: string): Promise<void> {
    const comments = await this.commentRepository.find({
      where: { project_id: projectId },
    })
    await this.commentRepository.remove(comments)
  }

  async getByInternalCode(internalCode: string): Promise<Project | null> {
    return this.projectRepository.findOne({
      where: { internal_code: internalCode },
    })
  }

  async getClientById(clientId: string): Promise<Client | null> {
    return this.clientRepository.findOne({
      where: { id: clientId },
    })
  }

  async getAreaById(areaId: number): Promise<Area | null> {
    return this.areaRepository.findOne({
      where: { id: areaId.toString() },
    })
  }

  async getUserById(userId: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id: userId },
    })
  }
}
