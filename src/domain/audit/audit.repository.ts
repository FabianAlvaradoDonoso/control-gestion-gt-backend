import { v4 as uuidv4 } from 'uuid'
import { AppDataSource } from '@/core/config/database'

import { Audit } from './audit.entity'

interface ExtractChangesResult {
  oldChanged: Record<string, any>
  newChanged: Record<string, any>
  changedFields: string[]
}

interface CreateAuditLogParams {
  entity_type: string
  entity_id: string
  action: 'create' | 'update' | 'delete'
  user_id: string
  old_values?: Record<string, any> | null
  new_values?: Record<string, any> | null
  changed_fields?: string[] | null
  metadata_info?: Record<string, any> | null
}

interface AuditUpdateParams {
  entity_type: string
  entity_id: string
  user_id: string
  old_snapshot: Record<string, any>
  new_snapshot: Record<string, any>
  metadata_info?: Record<string, any> | null
  no_compare_field?: boolean
}

interface AuditCreateParams {
  entity_type: string
  entity_id: string
  user_id: string
  new_entity: any
  metadata_info?: Record<string, any> | null
}

interface AuditDeleteParams {
  entity_type: string
  entity_id: string
  user_id: string
  deleted_entity: any
  metadata_info?: Record<string, any> | null
}

export class AuditRepository {
  private auditRepository = AppDataSource.getRepository(Audit)

  async listAudits(entityId: string): Promise<Audit[]> {
    return this.auditRepository
      .createQueryBuilder('audit_log')
      .where('audit_log.entity_id = :entityId', { entityId })
      .orderBy('audit_log.changed_at', 'DESC')
      .getMany()
  }

  private extractChanges(
    old_values: Record<string, any>,
    new_values: Record<string, any>,
    ignore_fields: string[] | null = null
  ): ExtractChangesResult {
    if (ignore_fields === null) {
      ignore_fields = ['updated_at', 'created_at']
    }

    const oldChanged: Record<string, any> = {}
    const newChanged: Record<string, any> = {}
    const changedFields: string[] = []

    const allKeys = new Set([...Object.keys(old_values), ...Object.keys(new_values)])

    for (const key of allKeys) {
      if (ignore_fields.includes(key)) {
        continue
      }

      const oldVal = old_values[key]
      const newVal = new_values[key]

      // Comparación profunda para detectar cambios reales
      if (!this.deepEqual(oldVal, newVal)) {
        oldChanged[key] = oldVal
        newChanged[key] = newVal
        changedFields.push(key)
      }
    }

    return {
      oldChanged,
      newChanged,
      changedFields,
    }
  }

  // Función auxiliar para comparación profunda
  private deepEqual(obj1: any, obj2: any): boolean {
    // Si son idénticos en referencia o valor primitivo
    if (obj1 === obj2) return true

    // Si alguno es null o no es objeto
    if (obj1 == null || obj2 == null) return false
    if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return false

    // Comparar arrays
    if (Array.isArray(obj1) && Array.isArray(obj2)) {
      if (obj1.length !== obj2.length) return false
      return obj1.every((item, index) => this.deepEqual(item, obj2[index]))
    }

    // Si uno es array y el otro no
    if (Array.isArray(obj1) !== Array.isArray(obj2)) return false

    // Comparar objetos
    const keys1 = Object.keys(obj1)
    const keys2 = Object.keys(obj2)

    if (keys1.length !== keys2.length) return false

    return keys1.every((key) => this.deepEqual(obj1[key], obj2[key]))
  }

  private serializeValue(value: any): any {
    if (value === null || value === undefined) {
      return null
    }

    // Handle Date objects
    if (value instanceof Date) {
      return value.toISOString()
    }

    // Handle BigInt
    if (typeof value === 'bigint') {
      return value.toString()
    }

    // Handle ArrayBuffer or Buffer (bytes)
    if (value instanceof ArrayBuffer || Buffer.isBuffer(value)) {
      try {
        const buffer = value instanceof ArrayBuffer ? Buffer.from(new Uint8Array(value)) : value
        return buffer.toString('utf-8')
      } catch {
        return null
      }
    }

    // Handle objects with toISOString (custom date-like objects)
    if (typeof value === 'object' && typeof value.toISOString === 'function') {
      return value.toISOString()
    }

    // Handle objects with toString (UUID-like objects)
    if (
      typeof value === 'object' &&
      typeof value.toString === 'function' &&
      value.constructor.name === 'UUID'
    ) {
      return value.toString()
    }

    return value
  }

  /**
   * Gets a serializable snapshot of a SQLAlchemy/ORM object or plain object.
   * @param obj - ORM model instance or plain object
   * @returns Serialized snapshot
   */
  getModelSnapshot(obj: any): Record<string, any> {
    if (obj === null || obj === undefined) {
      return {}
    }

    // If it's already a plain object/dict
    if (typeof obj === 'object' && obj.constructor === Object) {
      const snapshot: Record<string, any> = {}
      for (const [key, value] of Object.entries(obj)) {
        snapshot[key] = this.serializeValue(value)
      }
      return snapshot
    }

    // If it's an ORM model instance
    const snapshot: Record<string, any> = {}

    // Get all enumerable properties
    for (const key of Object.keys(obj)) {
      // Skip internal properties
      if (key.startsWith('_') || key === 'constructor') {
        continue
      }

      const value = obj[key]

      // Skip functions
      if (typeof value === 'function') {
        continue
      }

      snapshot[key] = this.serializeValue(value)
    }

    return snapshot
  }

  /**
   * Creates an audit log record.
   * @param params - Parameters for creating audit log
   * @returns Created audit log model
   */
  async createAuditLog(params: CreateAuditLogParams): Promise<Audit> {
    const audit: Audit = {
      id: uuidv4(),
      entity_type: params.entity_type,
      entity_id: params.entity_id,
      action: params.action,
      changed_by: params.user_id,
      changed_at: new Date(),
      old_values: params.old_values || null,
      new_values: params.new_values || null,
      changed_fields: params.changed_fields || null,
      metadata_info: params.metadata_info || null,
    }

    try {
      const saved = await this.auditRepository.save(audit)
      return saved
    } catch (error) {
      throw new Error(
        `Failed to save audit log: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Audits an UPDATE operation.
   * @param params - Parameters for audit update
   * @returns Created audit log
   */
  async auditUpdate(params: AuditUpdateParams): Promise<Audit> {
    let oldChanged: Record<string, any>
    let newChanged: Record<string, any>
    let changedFields: string[]

    if (params.no_compare_field) {
      oldChanged = params.old_snapshot
      newChanged = params.new_snapshot
      changedFields = Object.keys(params.new_snapshot)
    } else {
      const changes = this.extractChanges(params.old_snapshot, params.new_snapshot)
      oldChanged = changes.oldChanged
      newChanged = changes.newChanged
      changedFields = changes.changedFields
    }

    return this.createAuditLog({
      entity_type: params.entity_type,
      entity_id: params.entity_id,
      action: 'update',
      user_id: params.user_id,
      old_values: oldChanged,
      new_values: newChanged,
      changed_fields: changedFields,
      metadata_info: params.metadata_info,
    })
  }

  /**
   * Audits a CREATE operation.
   * @param params - Parameters for audit create
   * @returns Created audit log
   */
  async auditCreate(params: AuditCreateParams): Promise<Audit> {
    const newSnapshot = this.getModelSnapshot(params.new_entity)

    return this.createAuditLog({
      entity_type: params.entity_type,
      entity_id: params.entity_id,
      action: 'create',
      user_id: params.user_id,
      old_values: null,
      new_values: newSnapshot,
      changed_fields: Object.keys(newSnapshot),
      metadata_info: params.metadata_info,
    })
  }

  /**
   * Audits a DELETE operation.
   * @param params - Parameters for audit delete
   * @returns Created audit log
   */
  async auditDelete(params: AuditDeleteParams): Promise<Audit> {
    const oldSnapshot =
      typeof params.deleted_entity === 'object' &&
      params.deleted_entity !== null &&
      '__table__' in params.deleted_entity
        ? this.getModelSnapshot(params.deleted_entity)
        : params.deleted_entity

    return this.createAuditLog({
      entity_type: params.entity_type,
      entity_id: params.entity_id,
      action: 'delete',
      user_id: params.user_id,
      old_values: oldSnapshot,
      new_values: null,
      changed_fields: Object.keys(oldSnapshot),
      metadata_info: params.metadata_info,
    })
  }
}
