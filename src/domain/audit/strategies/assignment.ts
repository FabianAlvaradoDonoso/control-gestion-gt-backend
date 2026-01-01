import { AuditMessageStrategy } from './base'

import type { AuditLogModel } from '../audit.schema'

export class AssignmentMessageStrategy extends AuditMessageStrategy {
  protected fieldLabels: Record<string, string> = {
    user_id: 'Usuario asignado',
    project_id: 'Proyecto',
    role: 'Rol',
    is_active: 'Activo',
  }

  async generateMessage(
    audit: AuditLogModel,
    getUserName?: (userId: string) => string | Promise<string>
  ): Promise<string> {
    const action = audit.action
    const oldValues = audit.old_values || {}
    const newValues = audit.new_values || {}

    const userId = newValues.user_id || oldValues.user_id
    let userName = 'Usuario'
    if (userId && getUserName) {
      userName = await getUserName(userId)
    }

    const messages: string[] = []

    if (action === 'create') {
      messages.push(`Nueva asignación creada para ${userName}`)
    } else if (action === 'update') {
      for (const field of audit.changed_fields || []) {
        if (field === 'user_id') {
          continue
        }
        const oldVal = oldValues[field]
        const newVal = newValues[field]
        const label = this.getFieldLabel(field)
        messages.push(`${label} de ${userName} cambió de ${oldVal} a ${newVal}`)
      }
    } else if (action === 'delete') {
      messages.push(`Asignación eliminada de ${userName}`)
    }

    return messages.length > 0 ? messages.join(' | ') : `Cambio en asignación (${action})`
  }

  generateTitle(audit: AuditLogModel): string {
    const actionTitles: Record<string, string> = {
      create: 'Nueva asignación',
      update: 'Modificación de asignación',
      delete: 'Asignación eliminada',
    }
    return actionTitles[audit.action] || 'Cambio en asignación'
  }
}
