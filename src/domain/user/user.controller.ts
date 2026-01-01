import type { Request, Response } from 'express'

import { asyncHandler } from '@/core/utils/asyncHandler'

import { UserService } from './user.service'
import { createUserSchema, updateUserSchema } from './user.schema'

export class UserController {
  private userService: UserService

  constructor() {
    this.userService = new UserService()
  }

  findAll = asyncHandler(async (req: Request, res: Response) => {
    const { role } = req.query
    const roleString = typeof role === 'string' ? role : undefined
    const users = await this.userService.findAll(roleString?.split(','))
    res.json(users)
  })

  findById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const user = await this.userService.findById(id)
    res.json(user)
  })

  findByEmail = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.params
    const user = await this.userService.findByEmail(email as string)
    res.json(user)
  })

  create = asyncHandler(async (req: Request, res: Response) => {
    const userData = createUserSchema.parse(req.body)
    const newUser = await this.userService.create(userData)
    res.status(201).json(newUser)
  })

  update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const userData = updateUserSchema.parse(req.body)
    const updatedUser = await this.userService.update(id, userData)
    res.json(updatedUser)
  })

  delete = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    await this.userService.delete(id)
    res.status(204).send()
  })

  checkBuk = asyncHandler(async (req: Request, res: Response) => {
    const { user_rut: userRut } = req.query
    const userData = await this.userService.checkBuk(userRut as string)
    res.json(userData)
  })
}
