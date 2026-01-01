import { AuditMessageStrategy } from './base'

import type { AuditLogModel } from '../audit.schema'

export class DefaultMessageStrategy extends AuditMessageStrategy {
  async generateMessage(
    audit: AuditLogModel,
    getUserName?: (userId: string) => string | Promise<string>
  ): Promise<string> {
    const action = audit.action
    const entityType = audit.entity_type
    const changedFields = audit.changed_fields || []

    const actionLabels: Record<string, string> = {
      create: 'creado',
      update: 'actualizado',
      delete: 'eliminado',
    }

    const actionLabel = actionLabels[action] || action

    if (changedFields.length > 0) {
      const fieldsStr = changedFields.join(', ')
      return `${entityType.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())} ${actionLabel} (campos: ${fieldsStr})`
    }

    return `${entityType.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())} ${actionLabel}`
  }

  generateTitle(audit: AuditLogModel): string {
    const actionTitles: Record<string, string> = {
      create: 'Registro creado',
      update: 'Registro actualizado',
      delete: 'Registro eliminado',
    }
    const entityName = audit.entity_type.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())
    const actionLabel = actionTitles[audit.action] || 'Cambio'
    return `${entityName}: ${actionLabel}`
  }
}
