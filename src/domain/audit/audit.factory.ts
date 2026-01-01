import { DefaultMessageStrategy } from './strategies/default'
import { ProjectMessageStrategy } from './strategies/project'
import { TimeBlockMessageStrategy } from './strategies/timeBlock'
import { AssignmentMessageStrategy } from './strategies/assignment'

import type { AuditMessageStrategy } from './strategies/base'

export class AuditMessageStrategyFactory {
  private static strategies: Record<string, new () => AuditMessageStrategy> = {
    time_block: TimeBlockMessageStrategy,
    project: ProjectMessageStrategy,
    assignment: AssignmentMessageStrategy,
  }

  static getStrategy(entityType: string): AuditMessageStrategy {
    const StrategyClass = this.strategies[entityType] || DefaultMessageStrategy
    return new StrategyClass()
  }

  static registerStrategy(entityType: string, strategy: new () => AuditMessageStrategy): void {
    this.strategies[entityType] = strategy
  }
}
