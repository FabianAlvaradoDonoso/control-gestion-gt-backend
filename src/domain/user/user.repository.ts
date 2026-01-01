import { In } from 'typeorm'
import { AppDataSource } from '@/core/config/database'

import { User } from './user.entity'

import type { UserNameMap, UserListItem, UserWithExtraInfo } from './user.schema'

export class UserRepository {
  private repository = AppDataSource.getRepository(User)

  async findAll(roles?: string[]): Promise<UserListItem[]> {
    return this.repository.find({
      select: {
        id: true,
        name: true,
        role: true,
        email: true,
        rut: true,
        created_at: true,
      },
      where: roles ? { role: In(roles) } : {},
    })
  }

  async findAllWithExtraInfo(): Promise<UserWithExtraInfo[]> {
    return this.repository.find({
      select: {
        id: true,
        name: true,
        role: true,
        buk_id: true,
        rut: true,
      },
    })
  }

  async findById(userId: string): Promise<User | null> {
    return this.repository.findOne({
      where: { id: userId },
    })
  }

  async findByEmail(userEmail: string): Promise<User | null> {
    return this.repository.findOne({
      where: { email: userEmail },
    })
  }

  async findByRut(userRut: string): Promise<User | null> {
    return this.repository.findOne({
      where: { rut: userRut },
    })
  }

  async create(userData: Partial<User>): Promise<User> {
    const newUser = this.repository.create(userData)
    await this.repository.save(newUser)
    return newUser
  }

  async update(userId: string, userData: Partial<User>): Promise<User | null> {
    const user = await this.findById(userId)
    if (!user) {
      return null
    }

    Object.assign(user, userData)
    await this.repository.save(user)
    return user
  }

  async delete(user: User): Promise<void> {
    await this.repository.remove(user)
  }

  async findUsersNames(): Promise<UserNameMap> {
    const result = await this.repository.find({
      select: {
        id: true,
        name: true,
      },
    })

    const users: UserNameMap = {}
    for (const row of result) {
      users[row.id] = row.name
    }
    return users
  }

  async findUsersNamesByIds(ids?: string[]): Promise<UserNameMap> {
    const result = await this.repository.find({
      select: {
        id: true,
        name: true,
      },
      where: {
        id: ids ? In(ids) : undefined,
      },
    })

    const users: UserNameMap = {}
    for (const row of result) {
      users[row.id] = row.name
    }
    return users
  }
}
