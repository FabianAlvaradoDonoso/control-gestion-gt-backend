import type { Request, Response } from 'express'

import { asyncHandler } from '@/core/utils/asyncHandler'

import { ManagementControlService } from './management-control.service'
import {
  projectCommentCreateSchema,
  updateResponsibleUsersSchema,
} from './management-control.schema'

export class ManagementControlController {
  private managementControlService: ManagementControlService

  constructor() {
    this.managementControlService = new ManagementControlService()
  }

  getKpis = asyncHandler(async (req: Request, res: Response) => {
    const { project_id } = req.query
    const kpis = await this.managementControlService.getKpis(project_id as string)
    return res.status(200).json(kpis)
  })

  getDetails = asyncHandler(async (req: Request, res: Response) => {
    const { project_id } = req.query
    const details = await this.managementControlService.getDetails(project_id as string)
    return res.status(200).json(details)
  })

  getResponsibleUsers = asyncHandler(async (req: Request, res: Response) => {
    const { project_id } = req.query
    const users = await this.managementControlService.getResponsibleUsers(project_id as string)
    return res.status(200).json(users)
  })

  updateResponsibleUsers = asyncHandler(async (req: Request, res: Response) => {
    const { project_id } = req.query
    const clientData = updateResponsibleUsersSchema.parse(req.body)
    const updatedUsers = await this.managementControlService.updateResponsibleUsers(
      project_id as string,
      clientData,
      req.user!
    )
    return res.status(200).json(updatedUsers)
  })

  getWarnings = asyncHandler(async (req: Request, res: Response) => {
    const { project_id } = req.query
    const warnings = await this.managementControlService.getWarnings(project_id as string)
    return res.status(200).json(warnings)
  })

  getAssignments = asyncHandler(async (req: Request, res: Response) => {
    const { project_id } = req.query
    const assignments = await this.managementControlService.getAssignments(project_id as string)
    return res.status(200).json(assignments)
  })

  getProjectComments = asyncHandler(async (req: Request, res: Response) => {
    const { project_id } = req.query
    const comments = await this.managementControlService.getProjectComments(project_id as string)
    return res.status(200).json(comments)
  })

  postProjectComment = asyncHandler(async (req: any, res: Response) => {
    const { project_id } = req.query
    const payload = projectCommentCreateSchema.parse(req.body)
    const newComment = await this.managementControlService.postProjectComment(
      project_id as string,
      payload,
      req.user
    )
    return res.status(201).json(newComment)
  })

  getTeamUsers = asyncHandler(async (req: Request, res: Response) => {
    const { project_id } = req.query
    const teamUsers = await this.managementControlService.getTeamUsers(project_id as string)
    return res.status(200).json(teamUsers)
  })

  deleteTeamUser = asyncHandler(async (req: any, res: Response) => {
    const { project_id, user_id } = req.query
    const result = await this.managementControlService.deleteTeamUser(
      project_id as string,
      user_id as string,
      req.user
    )
    return res.status(200).json(result)
  })
}
