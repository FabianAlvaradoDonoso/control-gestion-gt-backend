import type { UserWithRole } from '@/shared/interfaces'

import { UserRepository } from '@/domain/user/user.repository'
import { AuditRepository } from '@/domain/audit/audit.repository'
import { ProjectRepository } from '@/domain/project/project.repository'

import { ManagementControlMessages } from './management-control.messages'
import { ManagementControlRepository } from './management-control.repository'

import type {
  ProjectCommentItem,
  ProjectCommentCreate,
  UpdateResponsibleUsersSchema,
} from './management-control.schema'

export class ManagementControlService {
  private managementControlRepository: ManagementControlRepository
  private userRepository: UserRepository
  private projectRepository: ProjectRepository
  private auditRepository: AuditRepository

  constructor() {
    this.managementControlRepository = new ManagementControlRepository()
    this.userRepository = new UserRepository()
    this.projectRepository = new ProjectRepository()
    this.auditRepository = new AuditRepository()
  }

  async _verifyProjectExists(projectId: string | undefined): Promise<string> {
    if (!projectId) {
      throw new Error('project_id is required')
    }
    const project = await this.projectRepository.getById(projectId)
    if (!project) {
      throw new Error('Project not found')
    }
    return projectId
  }

  async getKpis(projectId: string | undefined): Promise<any> {
    const projectIdVerified = await this._verifyProjectExists(projectId)

    const totalHoursPlanned =
      await this.managementControlRepository.getTotalHoursPlanned(projectIdVerified)
    const totalHoursAssigned =
      await this.managementControlRepository.getTotalHoursAssigned(projectIdVerified)

    const kpis = {
      hours: {
        total_planned: totalHoursPlanned,
        total_assigned: totalHoursAssigned,
      },
      risks: {
        total_identified: 0, // Placeholder for future implementation
        mitigated: 0, // Placeholder for future implementation
      },
      deliverables: {
        total: 0, // Placeholder for future implementation
        completed: 0, // Placeholder for future implementation
      },
    }

    return kpis
  }

  async getDetails(projectId: string | undefined): Promise<any> {
    const projectIdVerified = await this._verifyProjectExists(projectId)
    return this.managementControlRepository.getDetails(projectIdVerified)
  }

  async getResponsibleUsers(projectId: string | undefined): Promise<any> {
    const projectIdVerified = await this._verifyProjectExists(projectId)
    return this.managementControlRepository.getResponsibleUsers(projectIdVerified)
  }

  async updateResponsibleUsers(
    projectId: string | undefined,
    data: UpdateResponsibleUsersSchema,
    currentUser: UserWithRole
  ): Promise<any> {
    const projectIdVerified = await this._verifyProjectExists(projectId)

    const responsibleUsers =
      await this.managementControlRepository.getResponsibleUsers(projectIdVerified)
    if (!responsibleUsers) {
      throw new Error('Project not found')
    }

    const { user_id, role, action } = data

    // ===== action == 'add' =====
    if (action === 'add') {
      // verificar si el usuario ya esta en la lista
      for (const user of responsibleUsers) {
        if (user.id === user_id) {
          return responsibleUsers // no hacer nada si ya existe
        }
      }

      const newResponsible = await this.managementControlRepository.addResponsibleUser(
        projectIdVerified,
        user_id,
        role as 'partner' | 'manager'
      )

      // add to audit (create)
      this.auditRepository.auditCreate({
        entity_type: 'project',
        entity_id: projectIdVerified,
        user_id: currentUser.id,
        new_entity: { [role]: { ids: [user_id] } },
      })

      return newResponsible
    }

    // ===== action == 'remove' =====
    else if (action === 'remove') {
      // verificar si el usuario esta en la lista y que no sea el primario
      let userFind = false
      for (const user of responsibleUsers) {
        if (user.id === user_id) {
          userFind = true
          if (user.is_primary) {
            throw new Error(ManagementControlMessages.RESPONSIBLE_USER_CANNOT_REMOVE_PRIMARY)
          }
        }
      }

      if (!userFind) {
        return responsibleUsers // no hacer nada si no existe
      }

      const response = await this.managementControlRepository.removeResponsibleUser(
        projectIdVerified,
        user_id,
        role as 'partner' | 'manager'
      )

      // add to audit (delete)
      this.auditRepository.auditDelete({
        entity_type: 'project',
        entity_id: projectIdVerified,
        user_id: currentUser.id,
        deleted_entity: { [role]: { ids: [user_id] } },
      })

      return response
    }

    // ===== action == 'primary' =====
    else if (action === 'primary') {
      // Verificar si el usuario está en la lista y no es ya el primario
      let userFind = false
      for (const user of responsibleUsers) {
        if (user.id === user_id) {
          userFind = true
          if (user.is_primary) {
            return responsibleUsers // no hacer nada si ya es primario
          }
        }
      }

      if (!userFind) {
        return responsibleUsers // no hacer nada si no existe
      }

      const response = await this.managementControlRepository.setPrimaryResponsibleUser(
        projectIdVerified,
        user_id,
        role as 'partner' | 'manager'
      )

      // add to audit (update)
      const audit = {
        entity_type: 'project',
        entity_id: projectIdVerified,
        user_id: currentUser.id,
        old_snapshot: { [role]: { primary: responsibleUsers.find((u) => u.is_primary)?.id } },
        new_snapshot: { [role]: { primary: user_id } },
        no_compare_field: true,
      }
      console.log({ audit })
      this.auditRepository.auditUpdate(audit)

      return response
    } else {
      throw new Error(ManagementControlMessages.INVALID_RESPONSIBLE_USER_ACTION)
    }
  }

  async getWarnings(projectId: string | undefined): Promise<any> {
    const projectIdVerified = await this._verifyProjectExists(projectId)

    const warningsDates = await this._verifyWarningDatesProject(projectIdVerified)
    const warningsLeavesAssignments =
      await this._verifyWarningOverlapLeavesAssignments(projectIdVerified)

    return [warningsDates, warningsLeavesAssignments].flat()
  }

  async getAssignments(projectId: string | undefined): Promise<any> {
    const projectIdVerified = await this._verifyProjectExists(projectId)

    return this.managementControlRepository.getAssignments(projectIdVerified)
  }

  async getProjectComments(projectId: string | undefined): Promise<any> {
    const projectIdVerified = await this._verifyProjectExists(projectId)
    const comments = await this.managementControlRepository.getProjectComments(projectIdVerified)

    return this._buildNestedComments(comments)
  }

  async postProjectComment(
    projectId: string | undefined,
    payload: ProjectCommentCreate,
    currentUser: UserWithRole
  ): Promise<any> {
    const projectIdVerified = await this._verifyProjectExists(projectId)
    if (!payload.content || payload.content.trim() === '') {
      throw new Error(ManagementControlMessages.COMMENT_CONTENT_REQUIRED)
    }

    // si viene id, es una edicion
    if (payload.id !== undefined) {
      // validar que el comentario a editar exista
      const existingComments = await this.managementControlRepository.getProjectCommentsById(
        payload.id
      )
      if (!existingComments || existingComments.length === 0) {
        throw new Error(ManagementControlMessages.COMMENT_NOT_FOUND)
      }

      // validar que el usuario sea el mismo que creo el comentario
      if (existingComments[0].user_id !== currentUser.id) {
        throw new Error(ManagementControlMessages.COMMENT_EDIT_PERMISSION_DENIED)
      }

      // proceder a la edicion
      const updatedComment = await this.managementControlRepository.updateProjectComment(
        payload.id,
        payload.content
      )
      return updatedComment[0]
    }

    // si no viene id, es un nuevo comentario
    const newComment = await this.managementControlRepository.postProjectComment(
      projectIdVerified,
      payload.content,
      payload.parent_id ?? null,
      currentUser.id,
      'active'
    )
    return newComment[0]
  }

  async getTeamUsers(projectId: string | undefined): Promise<any> {
    const projectIdVerified = await this._verifyProjectExists(projectId)
    return this.managementControlRepository.getTeamUsers(projectIdVerified)
  }

  async deleteTeamUser(
    projectId: string | undefined,
    userId: string,
    currentUser: UserWithRole
  ): Promise<any> {
    const projectIdVerified = await this._verifyProjectExists(projectId)
    if (!userId) {
      throw new Error(ManagementControlMessages.USER_ID_REQUIRED)
    }

    const userToDelete = await this.userRepository.findById(userId)
    if (!userToDelete) {
      throw new Error(ManagementControlMessages.USER_NOT_FOUND)
    }

    console.log('todo bien')

    return this.managementControlRepository.deleteTeamUser(projectIdVerified, userId)
  }

  private async _verifyWarningDatesProject(
    projectId: string
  ): Promise<{ severity: string; title: string; description: string }[]> {
    const warnings: Array<{
      severity: string
      title: string
      description: string
    }> = []

    const datesInfo = await this.managementControlRepository.getDatesInfo(projectId)

    if (datesInfo) {
      const { endDate } = datesInfo

      // alerta si se paso la fecha de fin
      const today = new Date()
      today.setHours(0, 0, 0, 0) // Normalizar a medianoche para comparación justa

      if (endDate && endDate < today) {
        warnings.push({
          severity: 'high',
          title: ManagementControlMessages.WARNINGS_DATE_PASSED_TITLE,
          description: ManagementControlMessages.WARNINGS_DATE_PASSED_DESCRIPTION,
        })
      }

      // alerta si la fecha de fin es en los proximos 15 dias
      if (endDate) {
        const diffTime = endDate.getTime() - today.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        if (diffDays >= 0 && diffDays <= 15) {
          warnings.push({
            severity: diffDays <= 5 ? 'high' : 'medium',
            title: ManagementControlMessages.WARNINGS_DATE_WITHIN_X_DAYS_TITLE,
            description:
              ManagementControlMessages.WARNINGS_DATE_WITHIN_X_DAYS_DESCRIPTION(diffDays),
          })
        }
      }
    }

    return warnings
  }

  private async _verifyWarningOverlapLeavesAssignments(projectId: string): Promise<
    Array<{
      severity: string
      title: string
      description: string
    }>
  > {
    const warnings: Array<{
      severity: string
      title: string
      description: string
    }> = []

    const assignments = await this.managementControlRepository.getAssignments(projectId)
    const userAssignmentsList = Array.from(new Set(assignments.map((a) => a.userId)))

    const leavesUsersAssignments = await this.managementControlRepository.getLeavesUsersAssignments(
      userAssignmentsList,
      projectId
    )

    // Crear diccionario de asignaciones por usuario para acceso O(1)
    const assignmentsByUser: Record<string, typeof assignments> = {}
    for (const assignment of assignments) {
      if (!assignmentsByUser[assignment.userId]) {
        assignmentsByUser[assignment.userId] = []
      }
      assignmentsByUser[assignment.userId].push(assignment)
    }

    // Lógica para generar advertencias basadas en las asignaciones y licencias
    for (const leave of leavesUsersAssignments) {
      const userId = leave.userId
      const leaveStartDate = leave.startDate
      const leaveEndDate = leave.endDate

      // Obtener asignaciones del usuario desde el diccionario (O(1) en lugar de O(n))
      const assignmentsUser = assignmentsByUser[userId] || []

      for (const assignment of assignmentsUser) {
        // Verificar si hay solapamiento entre la licencia y la asignación
        const assignmentDate = new Date(assignment.date + 'T00:00:00')
        assignmentDate.setHours(0, 0, 0, 0)
        if (leaveStartDate <= assignmentDate && leaveEndDate >= assignmentDate) {
          warnings.push({
            severity: 'high',
            title: ManagementControlMessages.WARNINGS_LEAVE_ASSIGNMENT_OVERLAP_TITLE,
            description: ManagementControlMessages.WARNINGS_LEAVE_ASSIGNMENT_OVERLAP_DESCRIPTION({
              userName: assignment.userName,
              leaveStart: new Date(leaveStartDate).toLocaleDateString(),
              leaveEnd: new Date(leaveEndDate).toLocaleDateString(),
              assignmentDate: new Date(assignment.date).toLocaleDateString(),
            }),
          })
        }
      }
    }

    return warnings
  }

  private _buildNestedComments<T extends ProjectCommentItem>(
    dataDict: T[]
  ): Array<T & { depth: number; replies: Array<T & { depth: number; replies: any[] }> }> {
    // Creamos un diccionario de acceso rápido por ID
    const itemsById: Record<string, T & { depth: number; replies: any[] }> = {}

    for (const item of dataDict) {
      itemsById[item.id] = {
        ...structuredClone(item),
        depth: 0,
        replies: [],
      }
    }

    const rootComments: Array<T & { depth: number; replies: any[] }> = []

    for (const item of Object.values(itemsById)) {
      const parentId = item.parent_id
      if (parentId === null) {
        rootComments.push(item)
      } else {
        const parent = itemsById[parentId]
        if (parent) {
          item.depth = parent.depth + 1
          parent.replies.push(item)
        }
      }
    }

    return rootComments
  }
}
