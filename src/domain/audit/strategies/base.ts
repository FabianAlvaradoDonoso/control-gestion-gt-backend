import type { AuditLogModel } from '../audit.schema'

export abstract class AuditMessageStrategy {
  protected fieldLabels: Record<string, string> = {}

  abstract generateMessage(
    audit: AuditLogModel,
    getUserName?: (userId: string) => string | Promise<string>
  ): Promise<string>

  abstract generateTitle(audit: AuditLogModel): string

  protected getFieldLabel(field: string): string {
    return this.fieldLabels[field] || field
  }
}
