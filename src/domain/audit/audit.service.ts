import type { UserNameMap } from '@/domain/user/user.schema'

import { UserRepository } from '@/domain/user/user.repository'

import { AuditRepository } from './audit.repository'
import { AuditMessageStrategyFactory } from './audit.factory'
import { AuditResponse, type AuditLogModel, type AuditResponseDict } from './audit.schema'

export class AuditService {
  private auditRepository: AuditRepository
  private userRepository: UserRepository
  private userCache: UserNameMap = {}

  constructor() {
    this.auditRepository = new AuditRepository()
    this.userRepository = new UserRepository()
  }

  private async getUserName(userId: string): Promise<string> {
    if (this.userCache[userId]) {
      return this.userCache[userId]
    }

    const userMap = await this.userRepository.findUsersNamesByIds()
    if (userMap) {
      this.userCache = userMap
      if (this.userCache[userId]) {
        return this.userCache[userId]
      }
    }

    return 'Usuario desconocido'
  }

  private async generateAuditMessage(audit: AuditLogModel): Promise<string> {
    const strategy = AuditMessageStrategyFactory.getStrategy(audit.entity_type)
    return strategy.generateMessage(audit, async (userId) => await this.getUserName(userId))
  }

  private generateAuditTitle(audit: AuditLogModel): string {
    const strategy = AuditMessageStrategyFactory.getStrategy(audit.entity_type)
    return strategy.generateTitle(audit)
  }

  async listAudits(entityId: string): Promise<AuditResponseDict[]> {
    const audits = await this.auditRepository.listAudits(entityId)

    const results: AuditResponseDict[] = []
    for (const audit of audits) {
      const message = await this.generateAuditMessage(audit as AuditLogModel)
      const title = this.generateAuditTitle(audit as AuditLogModel)

      // Get the name of the user who made the change
      let changedByName: string | null = null
      if (audit.changed_by) {
        changedByName = await this.getUserName(audit.changed_by)
      }

      const auditResponse = new AuditResponse(audit as AuditLogModel, title, message, changedByName)
      results.push(auditResponse.toDict())
    }

    return results
  }
}
