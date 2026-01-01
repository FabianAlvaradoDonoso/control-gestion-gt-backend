import type { Request, Response } from 'express'

import { asyncHandler } from '@/core/utils/asyncHandler'

import { AssignmentService } from './assignment.service'

export class AssignmentController {
  private assignmentService: AssignmentService

  constructor() {
    this.assignmentService = new AssignmentService()
  }

  getAll = asyncHandler(async (req: Request, res: Response): Promise<Response | void> => {
    const { user_id, start_datetime, end_datetime } = req.query
    const assignments = await this.assignmentService.getAll(
      user_id as string,
      start_datetime as string,
      end_datetime as string
    )
    return res.status(200).json(assignments)
  })

  createFixedBlock = asyncHandler(async (req: Request, res: Response): Promise<Response | void> => {
    const fixedBlock = await this.assignmentService.processAssignmentFixedBlocks(req.body)
    return res.status(201).json(fixedBlock)
  })

  simulateCascade = asyncHandler(async (req: Request, res: Response): Promise<Response | void> => {
    const simulationResult = await this.assignmentService.simulateAssignmentCascade(req.body)
    return res.status(201).json(simulationResult)
  })

  userHoursPorcentage = asyncHandler(
    async (req: Request, res: Response): Promise<Response | void> => {
      const { user_id } = req.params
      const percentage = await this.assignmentService.userHoursPorcentage(user_id)
      return res.status(200).json({ percentage })
    }
  )
}
