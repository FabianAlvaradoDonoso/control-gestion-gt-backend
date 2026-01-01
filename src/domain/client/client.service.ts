import { ClientRepository } from './client.repository'

import type { Client } from './client.entity'
import type { ClientDetail, ClientListItem } from './client.schema'

export class ClientService {
  private clientRepository: ClientRepository

  constructor() {
    this.clientRepository = new ClientRepository()
  }

  async getClients(): Promise<ClientListItem[]> {
    return this.clientRepository.getClients()
  }

  async getClientById(clientId: string): Promise<ClientDetail | null> {
    const client = await this.clientRepository.getById(clientId)
    if (!client) {
      throw new Error('Client not found')
    }
    return client
  }

  async createClient(clientData: Partial<Client>): Promise<Client> {
    // if name, rut or description not provided, throw error
    if (!clientData.name || !clientData.rut) {
      throw new Error('Name and RUT are required')
    }

    // check if client with same rut already exists
    const existingClient = await this.clientRepository.findByRut(clientData.rut)
    if (existingClient && existingClient.is_active) {
      throw new Error('Client with the same RUT already exists')
    }
    if (existingClient && !existingClient.is_active) {
      throw new Error(
        'Client with the same RUT exists but is inactive. Please reactivate it instead.'
      )
    }

    return this.clientRepository.create({ ...clientData, is_active: true })
  }

  async updateClient(clientId: string, clientData: Partial<Client>): Promise<Client | null> {
    // check if client exists
    const existingClient = await this.clientRepository.findById(clientId)
    if (!existingClient) {
      throw new Error('Client not found')
    }

    if (existingClient && !existingClient.is_active) {
      throw new Error('Cannot update an inactive client. Please reactivate it first.')
    }

    if (clientData.rut && clientData.rut !== existingClient.rut) {
      const clientWithSameRut = await this.clientRepository.findByRut(clientData.rut)
      if (clientWithSameRut && clientWithSameRut.id !== clientId && clientWithSameRut.is_active) {
        throw new Error('Another active client with the same RUT already exists')
      }
      if (clientWithSameRut && clientWithSameRut.id !== clientId && !clientWithSameRut.is_active) {
        throw new Error(
          'Another client with the same RUT exists but is inactive. Please choose a different RUT or reactivate that client instead.'
        )
      }
    }

    return this.clientRepository.update(clientId, clientData)
  }

  async deleteClient(clientId: string): Promise<void> {
    const existingClient = await this.clientRepository.findById(clientId)
    if (!existingClient) {
      throw new Error('Client not found')
    }

    await this.clientRepository.softDelete(clientId)
  }
}
