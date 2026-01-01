import { AuditMessageStrategy } from './base'

import type { AuditLogModel } from '../audit.schema'

export class TimeBlockMessageStrategy extends AuditMessageStrategy {
  protected fieldLabels: Record<string, string> = {
    hours: 'horas',
    duration_hours: 'horas',
    user_id: 'usuario',
    date: 'fecha',
    start_time: 'hora inicio',
    end_time: 'hora fin',
    comment: 'comentario',
    is_active: 'activo',
  }

  async generateMessage(
    audit: AuditLogModel,
    getUserName?: (userId: string) => string | Promise<string>
  ): Promise<string> {
    const action = audit.action
    const oldValues = audit.old_values || {}
    const newValues = audit.new_values || {}

    // Get affected user name
    const userId = newValues.user_id || oldValues.user_id
    let userName = 'Usuario'
    if (userId && getUserName) {
      userName = await getUserName(userId)
    }

    const messages: string[] = []

    if (action === 'create') {
      const hours = newValues.hours || newValues.duration_hours
      const parsedHours = hours !== null && hours !== undefined ? parseInt(hours) : null
      if (parsedHours !== null) {
        messages.push(`Asignación de ${parsedHours} horas a ${userName}`)
      } else {
        messages.push(`Nuevo bloque de tiempo asignado a ${userName}`)
      }
    } else if (action === 'update') {
      const oldHours = oldValues.hours || oldValues.duration_hours
      const parsedOldHours = oldHours !== null && oldHours !== undefined ? parseInt(oldHours) : null
      const newHours = newValues.hours || newValues.duration_hours
      const parsedNewHours = newHours !== null && newHours !== undefined ? parseInt(newHours) : null

      if (parsedOldHours !== null && parsedNewHours !== null) {
        if (parsedNewHours < parsedOldHours) {
          messages.push(
            `Reducción de horas a ${userName} de ${parsedOldHours} a ${parsedNewHours} horas`
          )
        } else if (parsedNewHours > parsedOldHours) {
          messages.push(
            `Aumento de horas a ${userName} de ${parsedOldHours} a ${parsedNewHours} horas`
          )
        } else {
          messages.push(`Modificación de bloque de tiempo de ${userName}`)
        }
      }

      // Other changed fields
      for (const field of audit.changed_fields || []) {
        if (['hours', 'duration_hours', 'user_id'].includes(field)) {
          continue
        }
        const oldVal = oldValues[field]
        const newVal = newValues[field]
        const label = this.getFieldLabel(field)
        if (oldVal !== null && oldVal !== undefined && newVal !== null && newVal !== undefined) {
          messages.push(
            `${label.charAt(0).toUpperCase() + label.slice(1)} cambió de ${oldVal} a ${newVal}`
          )
        }
      }
    } else if (action === 'delete') {
      const hours = oldValues.hours || oldValues.duration_hours
      if (hours === 'all') {
        messages.push(`Eliminación de todas las horas de ${userName}`)
      } else if (hours !== null && hours !== undefined) {
        const parsedHours = parseInt(hours)
        messages.push(`Eliminación de ${parsedHours} horas de ${userName}`)
      } else {
        messages.push(`Bloque de tiempo eliminado de ${userName}`)
      }
    }

    return messages.length > 0 ? messages.join(' | ') : `Cambio en bloque de tiempo (${action})`
  }

  generateTitle(audit: AuditLogModel): string {
    const actionTitles: Record<string, string> = {
      create: 'Nueva asignación de horas',
      update: 'Modificación de horas',
      delete: 'Eliminación de horas',
    }
    return actionTitles[audit.action] || 'Cambio en asignación de horas'
  }
}
