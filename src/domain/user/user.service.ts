import { LeaveRepository } from '@/domain/leave/leave.repository'

import { UserRepository } from './user.repository'

import type { User } from './user.entity'
import type { UserListItem, UserBukResponse } from './user.schema'

export class UserService {
  private userRepository: UserRepository
  private leaveRepository: LeaveRepository

  constructor() {
    this.userRepository = new UserRepository()
    this.leaveRepository = new LeaveRepository()
  }

  async findAll(roles?: string[]): Promise<UserListItem[]> {
    return this.userRepository.findAll(roles)
  }

  async findById(userId: string): Promise<User | null> {
    const user = await this.userRepository.findById(userId)
    if (!user) {
      throw new Error('User not found')
    }
    return user
  }

  async findByEmail(userEmail: string): Promise<User | null> {
    const user = await this.userRepository.findByEmail(userEmail)
    if (!user) {
      throw new Error('User not found')
    }
    return user
  }

  async create(userData: Partial<User>): Promise<User> {
    if (await this.userRepository.findByEmail(userData.email!)) {
      throw new Error('Email already in use')
    }

    if (await this.userRepository.findByRut(userData.rut!)) {
      throw new Error('RUT already in use')
    }

    const bukInfo = await this.checkBuk(userData.rut!)

    const data = {
      ...userData,
      area_id: 1,
      rut: userData.rut?.replace('.', '').replace('-', ''),
      buk_id: bukInfo.id,
    }

    return this.userRepository.create(data)
  }

  async update(userId: string, userData: Partial<User>): Promise<User | null> {
    if (!(await this.findById(userId))) {
      throw new Error('User not found')
    }

    if (userData.email) {
      const existingUser = await this.userRepository.findByEmail(userData.email)
      if (existingUser && existingUser.id !== userId) {
        throw new Error('Email already in use')
      }
    }

    if (userData.rut) {
      const existingUser = await this.userRepository.findByRut(userData.rut)
      if (existingUser && existingUser.id !== userId) {
        throw new Error('RUT already in use')
      }
    }

    return this.userRepository.update(userId, userData)
  }

  async delete(userId: string): Promise<void> {
    const user = await this.findById(userId)
    if (!user) {
      throw new Error('User not found')
    }
    await this.userRepository.delete(user)
  }

  async checkBuk(userRut: string): Promise<UserBukResponse> {
    const userRutClean = userRut.replace('.', '').replace('-', '')
    const employeesData = await this.leaveRepository.getEmployeesBukInfo(userRutClean)

    if (!employeesData) {
      throw new Error('User not found in BUK')
    }

    if (employeesData.data.status !== 'activo') {
      throw new Error('User is inactive in BUK')
    }

    return {
      id: employeesData.data.id,
      name: employeesData.data.full_name,
      email: employeesData.data.email,
    }
  }
}
