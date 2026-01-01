import type { Request, Response } from 'express'

import { asyncHandler } from '@/core/utils/asyncHandler'

import { ConfigService } from './config.service'
import { seasonConfigSchema } from './config.schema'

export class ConfigController {
  private configService: ConfigService

  constructor() {
    this.configService = new ConfigService()
  }

  getSeason = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.configService.getSeason()
    return res.status(200).json(result)
  })

  getWorkingHours = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.configService.getWorkingHours()
    return res.status(200).json(result)
  })

  updateSeason = asyncHandler(async (req: Request, res: Response) => {
    const data = seasonConfigSchema.parse(req.body)
    const result = await this.configService.updateSeason(data.season_mode)
    return res.status(200).json(result)
  })
}
