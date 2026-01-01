import type { Request, Response } from 'express'

import { asyncHandler } from '@/core/utils/asyncHandler'

import { LeaveService } from './leave.service'

export class LeaveController {
  private LeaveService: LeaveService

  constructor() {
    this.LeaveService = new LeaveService()
  }

  saveBukLeaves = asyncHandler(async (req: Request, res: Response) => {
    const { date } = req.query
    const result = await this.LeaveService.saveBukLeaves(date as string | undefined)
    return res.status(201).json(result)
  })

  getLeavesByUserId = asyncHandler(async (req: Request, res: Response) => {
    const { user_id: userId } = req.query
    const leaves = await this.LeaveService.getLeavesByUserId(userId as string)
    return res.status(200).json(leaves)
  })

  saveHolidayLeaves = asyncHandler(async (req: Request, res: Response) => {
    const { year } = req.query
    const result = await this.LeaveService.saveHolidayLeavesForYear(Number(year))
    return res.status(201).json(result)
  })

  getHolidayLeaves = asyncHandler(async (req: Request, res: Response) => {
    const { year } = req.query
    const leaves = await this.LeaveService.getHolidaysByYear(Number(year))
    return res.status(200).json(leaves)
  })
}
