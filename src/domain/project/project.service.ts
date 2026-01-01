import type { UserWithRole } from '@/shared/interfaces'

import { AuditRepository } from '@/domain/audit/audit.repository'

import { ProjectRepository } from './project.repository'
import {
  ProjectType,
  ProjectStatus,
  ProjectPriority,
  type ProjectResumen,
  type ProjectListItem,
  type CreateProjectInput,
  type UpdateProjectInput,
} from './project.schema'

import type { Project } from './project.entity'

export class ProjectService {
  private projectRepository: ProjectRepository
  private auditRepository: AuditRepository

  constructor() {
    this.projectRepository = new ProjectRepository()
    this.auditRepository = new AuditRepository()
  }

  async getProjects(currentUser: UserWithRole): Promise<ProjectListItem[]> {
    return this.projectRepository.getProjects(
      currentUser.roles.some((role) => role.role_name.toLowerCase() === 'developer')
    )
  }

  async getProjectsResumen(): Promise<ProjectResumen[]> {
    return this.projectRepository.getProjectsResumen()
  }

  async getProjectById(projectId: string): Promise<ProjectListItem | null> {
    const project = await this.projectRepository.getById(projectId)

    if (!project) {
      throw new Error('Project not found')
    }

    const assignments = await this.projectRepository.getAssignmentsByProjectId(projectId)

    return {
      ...project,
      assignments,
    }
  }

  async createProject(
    projectData: Partial<CreateProjectInput>,
    currentUser: UserWithRole
  ): Promise<any> {
    // Verify unique internal_code
    const existingProject = await this.projectRepository.getByInternalCode(
      projectData.internal_code!
    )
    if (existingProject) {
      throw new Error('Duplicate internal code')
    }

    await this._generic_validations(projectData)

    const newProject = { ...projectData } as Project

    newProject.created_user_id = currentUser.id
    newProject.internal_code = projectData.id!
    newProject.is_active = true
    newProject.active_alerts = false
    newProject.partners = { primary: String(projectData.partner_id), ids: [] }
    newProject.managers = { primary: String(projectData.manager_id), ids: [] }

    const createdProject = await this.projectRepository.create(newProject)

    // TODO: Audit creation - assuming an auditRepository exists
    await this.auditRepository.auditCreate({
      entity_type: 'project',
      entity_id: String(createdProject.id),
      user_id: currentUser.id,
      new_entity: createdProject,
    })

    return createdProject
  }

  async updateProject(projectId: string, projectData: unknown, currentUser: UserWithRole) {
    const existingProject = await this.projectRepository.getById(projectId)

    if (!existingProject) {
      throw new Error('Project not found')
    }

    if (existingProject.is_active === false) {
      throw new Error('Cannot update an inactive project')
    }

    // Validate dates considering existing values if only one date is being updated
    this._validateUpdateDates(projectData as Partial<UpdateProjectInput>, existingProject)

    await this._generic_validations(projectData as Partial<UpdateProjectInput>)

    // Only include diff fields in the update from projectData vs existingProject
    const updateData: Partial<UpdateProjectInput> = {}
    for (const [field, value] of Object.entries(projectData as Partial<UpdateProjectInput>)) {
      if (value !== (existingProject as any)[field]) {
        ;(updateData as any)[field] = value
      }
    }
    // Update partners and managers fields if present in updateData
    if ('partner_id' in updateData) {
      ;(updateData as any).partners = {
        primary: String((updateData as any).partner_id),
        ids: [],
      }
      delete (updateData as any).partner_id
    }
    if ('manager_id' in updateData) {
      ;(updateData as any).managers = {
        primary: String((updateData as any).manager_id),
        ids: [],
      }
      delete (updateData as any).manager_id
    }

    const projectModel = await this.projectRepository.getModelById(projectId)
    if (!projectModel) {
      throw new Error('Project model not found for auditing')
    }

    const oldSnapshot = this.auditRepository.getModelSnapshot(projectModel)

    const updatedProject = await this.projectRepository.update(projectId, updateData)

    const newSnapshot = this.auditRepository.getModelSnapshot(updatedProject)

    this.auditRepository.auditUpdate({
      entity_type: 'project',
      entity_id: String(projectId),
      user_id: currentUser.id,
      old_snapshot: oldSnapshot,
      new_snapshot: newSnapshot,
    })

    return updatedProject
  }

  async toggleProjectActiveStatus(projectId: string) {
    const project = await this.projectRepository.getById(projectId)

    if (!project) {
      throw new Error('Project not found')
    }

    await this.projectRepository.toggleActiveStatus(projectId)

    return { is_active: !project.is_active }
  }

  private _validateUpdateDates(
    projectData: Partial<UpdateProjectInput>,
    existingProject: ProjectListItem
  ) {
    const startDate = new Date(
      'start_date' in projectData && projectData.start_date
        ? projectData.start_date
        : existingProject.start_date
    )

    const endDate = new Date(
      'end_date' in projectData && projectData.end_date
        ? projectData.end_date
        : existingProject.end_date
    )

    if (startDate && endDate && startDate > endDate) {
      throw new Error('Start date must be before end date')
    }
  }

  async _generic_validations(projectData: Partial<CreateProjectInput | UpdateProjectInput>) {
    // For ProjectCreate, validate dates are provided and start_date is before end_date
    if ('start_date' in projectData && 'end_date' in projectData) {
      if (!projectData.start_date || !projectData.end_date) {
        throw new Error('Start date and end date are required')
      }

      const startDate = new Date(projectData.start_date)
      const endDate = new Date(projectData.end_date)

      if (startDate >= endDate) {
        throw new Error('Start date must be before end date')
      }
    }

    // Verify priority is within acceptable range (only if provided)
    if (projectData.priority) {
      const validPriorities = Object.values(ProjectPriority)
      if (!validPriorities.includes(projectData.priority as ProjectPriority)) {
        throw new Error(`Invalid priority. Must be one of: ${validPriorities.join(', ')}`)
      }
    }

    // Verify status is within acceptable values (only if provided)
    if (projectData.status) {
      const validStatuses = Object.values(ProjectStatus)
      if (!validStatuses.includes(projectData.status as ProjectStatus)) {
        throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`)
      }
    }

    // Verify type is within acceptable values (only if provided)
    if (projectData.type) {
      const validTypes = Object.values(ProjectType)
      if (!validTypes.includes(projectData.type as ProjectType)) {
        throw new Error(`Invalid type. Must be one of: ${validTypes.join(', ')}`)
      }
    }

    // Verify if client exists (only if provided)
    if (projectData.client_id) {
      const client = await this.projectRepository.getClientById(projectData.client_id)
      if (!client) {
        throw new Error('Client not found')
      }
    }

    // Verify if area exists (only if provided)
    if (projectData.area_id) {
      const area = await this.projectRepository.getAreaById(projectData.area_id)
      if (!area) {
        throw new Error('Area not found')
      }
    }

    // Verify if partner user exists (only if provided)
    if (projectData.partner_id) {
      const partner = await this.projectRepository.getUserById(projectData.partner_id)
      if (!partner) {
        throw new Error('Partner user not found')
      }
    }

    // Verify if manager user exists (only if provided)
    if (projectData.manager_id) {
      const manager = await this.projectRepository.getUserById(projectData.manager_id)
      if (!manager) {
        throw new Error('Manager user not found')
      }
    }

    // Verify if partner and manager are not the same user
    if (
      projectData.partner_id &&
      projectData.manager_id &&
      projectData.partner_id === projectData.manager_id
    ) {
      throw new Error('Partner and manager cannot be the same user')
    }
  }
}
