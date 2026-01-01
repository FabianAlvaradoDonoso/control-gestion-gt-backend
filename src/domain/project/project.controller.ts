import type { Request, Response } from 'express'

import { asyncHandler } from '@/core/utils/asyncHandler'

import { ProjectService } from './project.service'
import { createProjectSchema, updateProjectSchema } from './project.schema'

export class ProjectController {
  private projectService: ProjectService

  constructor() {
    this.projectService = new ProjectService()
  }

  getProjects = asyncHandler(async (req: Request, res: Response) => {
    const projects = await this.projectService.getProjects(req.user!)
    res.json(projects)
  })

  getProjectsResumen = asyncHandler(async (req: Request, res: Response) => {
    const projectsResumen = await this.projectService.getProjectsResumen()
    res.json(projectsResumen)
  })

  getProjectById = asyncHandler(async (req: Request, res: Response) => {
    const { project_id } = req.params
    const project = await this.projectService.getProjectById(project_id)
    res.json(project)
  })

  createProject = asyncHandler(async (req: Request, res: Response) => {
    const projectData = createProjectSchema.parse(req.body)
    const newProject = await this.projectService.createProject(projectData, req.user!)
    res.status(201).json(newProject)
  })

  updateProject = asyncHandler(async (req: Request, res: Response) => {
    const { project_id } = req.params
    const projectData = updateProjectSchema.parse(req.body)
    const updatedProject = await this.projectService.updateProject(
      project_id,
      projectData,
      req.user!
    )
    res.json(updatedProject)
  })

  toggleProjectActiveStatus = asyncHandler(async (req: Request, res: Response) => {
    const { project_id } = req.params
    const toggledProject = await this.projectService.toggleProjectActiveStatus(project_id)
    res.json(toggledProject)
  })
}
