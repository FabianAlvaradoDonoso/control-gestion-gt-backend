export interface AuditLogModel {
  id: string
  entity_type: string
  entity_id: string
  action: 'create' | 'update' | 'delete'
  changed_by: string | null
  changed_at: Date | null
  old_values: Record<string, any> | null
  new_values: Record<string, any> | null
  changed_fields: string[] | null
}

export interface AuditResponseDict {
  id: string
  entity_type: string
  action: string
  changed_by_name: string | null
  changed_at: string | null
  title: string
  message: string
}

export class AuditResponse {
  id: string
  entity_type: string
  entity_id: string
  action: string
  changed_by: string | null
  changed_by_name: string | null
  changed_at: Date | null
  old_values: Record<string, any> | null
  new_values: Record<string, any> | null
  changed_fields: string[] | null
  title: string
  message: string

  constructor(
    audit: AuditLogModel,
    title: string,
    message: string,
    changed_by_name: string | null = null
  ) {
    this.id = audit.id
    this.entity_type = audit.entity_type
    this.entity_id = audit.entity_id
    this.action = audit.action
    this.changed_by = audit.changed_by
    this.changed_by_name = changed_by_name
    this.changed_at = audit.changed_at
    this.old_values = audit.old_values
    this.new_values = audit.new_values
    this.changed_fields = audit.changed_fields
    this.title = title
    this.message = message
  }

  toDict(): AuditResponseDict {
    return {
      id: this.id,
      entity_type: this.entity_type,
      action: this.action,
      changed_by_name: this.changed_by_name,
      changed_at: this.changed_at ? this.changed_at.toISOString() : null,
      title: this.title,
      message: this.message,
    }
  }
}
