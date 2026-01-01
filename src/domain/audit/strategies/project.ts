import { AuditMessageStrategy } from './base'

import type { AuditLogModel } from '../audit.schema'

export class ProjectMessageStrategy extends AuditMessageStrategy {
  protected fieldLabels: Record<string, string> = {
    status: 'Estado del proyecto',
    priority: 'Prioridad',
    type: 'Tipo',
    name: 'Nombre',
    internal_code: 'Código interno',
    client_id: 'Cliente',
    area_id: 'Área',
    planned_hours: 'Horas planificadas',
    executed_hours: 'Horas ejecutadas',
    start_date: 'Fecha de inicio',
    end_date: 'Fecha de término',
    season: 'Temporada',
    active_alerts: 'Alertas activas',
    description: 'Descripción',
    is_active: 'Proyecto activo',
    partners: 'Socios',
    managers: 'Gerentes',
  }

  private valueTranslations: Record<string, string> = {
    // States
    active: 'Activo',
    inactive: 'Inactivo',
    completed: 'Completado',
    pending: 'Pendiente',
    in_progress: 'En progreso',
    cancelled: 'Cancelado',
    // Priorities
    low: 'Baja',
    medium: 'Media',
    high: 'Alta',
    critical: 'Crítica',
    // Types
    internal: 'Interno',
    external: 'Externo',
  }

  private translateValue(value: any): string {
    if (value === null || value === undefined) {
      return 'N/A'
    }
    if (typeof value === 'string') {
      return this.valueTranslations[value.toLowerCase()] || value
    }
    return String(value)
  }

  private isManagerOrPartnerChange(audit: AuditLogModel): boolean {
    const changedFields = audit.changed_fields || []
    return changedFields.includes('manager') || changedFields.includes('partner')
  }

  private async generateManagerPartnerMessage(
    audit: AuditLogModel,
    getUserName?: (userId: string) => string | Promise<string>
  ): Promise<string[]> {
    const messages: string[] = []
    const action = audit.action
    const oldValues = audit.old_values || {}
    const newValues = audit.new_values || {}
    const changedFields = audit.changed_fields || []

    const roleLabels: Record<string, string> = {
      manager: 'gerente',
      partner: 'socio',
    }

    for (const field of changedFields) {
      if (!['manager', 'partner'].includes(field)) {
        continue
      }

      const roleLabel = roleLabels[field] || field
      const oldData = oldValues[field] || {}
      const newData = newValues[field] || {}

      // Case: Primary change (update)
      if (action === 'update' && oldData?.primary && newData?.primary) {
        const newPrimaryId = newData.primary
        if (newPrimaryId && getUserName) {
          const userName = await getUserName(newPrimaryId)
          messages.push(`Se asignó a ${userName} como ${roleLabel} principal`)
        }
      }
      // Case: Add manager/partner (create)
      else if (action === 'create' && newData) {
        const ids = newData.ids || []
        for (const userId of ids) {
          if (getUserName) {
            const userName = await getUserName(userId)
            messages.push(`${userName} se agregó como ${roleLabel}`)
          }
        }
      }
      // Case: Remove manager/partner (delete)
      else if (action === 'delete' && oldData) {
        const ids = oldData.ids || []
        for (const userId of ids) {
          if (getUserName) {
            const userName = await getUserName(userId)
            messages.push(`${userName} se quitó como ${roleLabel}`)
          }
        }
      }
    }

    return messages
  }

  async generateMessage(
    audit: AuditLogModel,
    getUserName?: (userId: string) => string | Promise<string>
  ): Promise<string> {
    const action = audit.action
    const oldValues = audit.old_values || {}
    const newValues = audit.new_values || {}

    const messages: string[] = []

    // Check if it's a manager or partner change
    if (this.isManagerOrPartnerChange(audit)) {
      const usersName = await getUserName
      messages.push(...(await this.generateManagerPartnerMessage(audit, usersName)))
      // Process other fields that are not manager/partner
      for (const field of audit.changed_fields || []) {
        if (['manager', 'partner'].includes(field)) {
          continue
        }
        const oldVal = oldValues[field]
        const newVal = newValues[field]
        const label = this.getFieldLabel(field)
        const oldDisplay = this.translateValue(oldVal)
        const newDisplay = this.translateValue(newVal)
        messages.push(`${label} cambió de ${oldDisplay} a ${newDisplay}`)
      }
    } else if (action === 'create') {
      const name = newValues.name || ''
      messages.push(`Proyecto creado: ${name}`)
    } else if (action === 'update') {
      for (const field of audit.changed_fields || []) {
        const oldVal = oldValues[field]
        const newVal = newValues[field]
        const label = this.getFieldLabel(field)

        // Translate values if necessary
        const oldDisplay = this.translateValue(oldVal)
        const newDisplay = this.translateValue(newVal)

        messages.push(`${label} cambió de ${oldDisplay} a ${newDisplay}`)
      }
    } else if (action === 'delete') {
      const name = oldValues.name || ''
      messages.push(`Proyecto eliminado: ${name}`)
    }

    return messages.length > 0 ? messages.join(' | ') : `Cambio en proyecto (${action})`
  }

  generateTitle(audit: AuditLogModel): string {
    // Special titles for manager/partner changes
    if (this.isManagerOrPartnerChange(audit)) {
      const changedFields = audit.changed_fields || []
      const action = audit.action

      if (changedFields.includes('manager')) {
        const actions: Record<string, string> = {
          create: 'Gerente agregado',
          delete: 'Gerente eliminado',
          update: 'Cambio de gerente principal',
        }
        return actions[action] || 'Cambio de gerente principal'
      }

      if (changedFields.includes('partner')) {
        const actions: Record<string, string> = {
          create: 'Socio agregado',
          delete: 'Socio eliminado',
          update: 'Cambio de socio principal',
        }
        return actions[action] || 'Cambio de socio principal'
      }
    }

    const actionTitles: Record<string, string> = {
      create: 'Proyecto creado',
      update: 'Actualización de proyecto',
      delete: 'Proyecto eliminado',
    }
    return actionTitles[audit.action] || 'Cambio en proyecto'
  }
}
