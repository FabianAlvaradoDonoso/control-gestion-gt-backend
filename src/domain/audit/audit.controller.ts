import type { Request, Response } from 'express'

import { asyncHandler } from '@/core/utils/asyncHandler'

import { AuditService } from './audit.service'

export class AuditController {
  private auditService: AuditService

  constructor() {
    this.auditService = new AuditService()
  }

  listAudits = asyncHandler(async (req: Request, res: Response) => {
    const { entity_id } = req.query
    const audits = await this.auditService.listAudits(entity_id as string)
    return res.status(200).json(audits)
  })
}
