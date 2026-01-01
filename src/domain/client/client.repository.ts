import { AppDataSource } from '@/core/config/database'

import { Client } from './client.entity'

import type { ClientDetail, ClientListItem } from './client.schema'

export class ClientRepository {
  private repository = AppDataSource.getRepository(Client)

  async findAll(): Promise<Client[]> {
    return this.repository.find()
  }

  async findById(id: string): Promise<Client | null> {
    return this.repository.findOneBy({ id })
  }

  async findByName(name: string): Promise<Client | null> {
    return this.repository.findOneBy({ name })
  }

  async findByRut(rut: string): Promise<Client | null> {
    return this.repository.findOneBy({ rut })
  }

  async create(clientData: Partial<Client>): Promise<Client> {
    const client = this.repository.create(clientData)
    return this.repository.save(client)
  }

  async update(id: string, clientData: Partial<Client>): Promise<Client | null> {
    await this.repository.update(id, clientData)
    return this.findById(id)
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id)
    return (result.affected ?? 0) > 0
  }

  async softDelete(id: string): Promise<boolean> {
    const result = await this.repository.update(id, { is_active: false })
    return (result.affected ?? 0) > 0
  }

  async getClients(): Promise<ClientListItem[]> {
    return this.repository.find({
      select: {
        id: true,
        rut: true,
        name: true,
        description: true,
      },
      where: {
        is_active: true,
      },
      order: {
        name: 'ASC',
      },
    })
  }

  async getById(clientId: string): Promise<ClientDetail | null> {
    return await this.repository.findOne({
      select: {
        id: true,
        rut: true,
        name: true,
        description: true,
        is_active: true,
      },
      where: { id: clientId },
    })
  }

  async getByName(clientName: string): Promise<ClientDetail | null> {
    return await this.repository.findOne({
      select: {
        id: true,
        rut: true,
        name: true,
        description: true,
        is_active: true,
      },
      where: { name: clientName },
    })
  }
}
