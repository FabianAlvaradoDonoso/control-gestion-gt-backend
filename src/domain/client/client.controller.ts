import type { Request, Response } from 'express'

import { asyncHandler } from '@/core/utils/asyncHandler'

import { ClientService } from './client.service'
import { createClientSchema, updateClientSchema } from './client.schema'

export class ClientController {
  private clientService: ClientService

  constructor() {
    this.clientService = new ClientService()
  }

  getClients = asyncHandler(async (req: Request, res: Response) => {
    const clients = await this.clientService.getClients()
    res.json(clients)
  })

  getClientById = asyncHandler(async (req: Request, res: Response) => {
    const clientId = req.params.id
    const client = await this.clientService.getClientById(clientId)
    res.json(client)
  })

  createClient = asyncHandler(async (req: Request, res: Response) => {
    const clientData = createClientSchema.parse(req.body)
    const newClient = await this.clientService.createClient(clientData)
    res.status(201).json(newClient)
  })

  updateClient = asyncHandler(async (req: Request, res: Response) => {
    const clientId = req.params.id
    const clientData = updateClientSchema.parse(req.body)
    const updatedClient = await this.clientService.updateClient(clientId, clientData)
    res.json(updatedClient)
  })

  deleteClient = asyncHandler(async (req: Request, res: Response) => {
    const clientId = req.params.id
    await this.clientService.deleteClient(clientId)
    res.status(204).send()
  })
}
