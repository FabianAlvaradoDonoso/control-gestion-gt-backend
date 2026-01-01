import { AppDataSource } from '@/core/config/database'

import { Config } from './config.entity'

export class ConfigRepository {
  private repository = AppDataSource.getRepository(Config)

  async getConfigByKey(key: string): Promise<Config | null> {
    const config = await this.repository.findOneBy({ name: key })
    return config
  }

  async getSeasonConfig(): Promise<Config | null> {
    const config = await this.repository.findOneBy({ name: 'season' })
    return config
  }

  async getWorkingHoursConfig(): Promise<Config | null> {
    const config = await this.repository.findOneBy({ name: 'working_hours' })
    return config as Config | null
  }

  async save(config: Config): Promise<Config> {
    return await this.repository.save(config)
  }

  async update(config: Config): Promise<Config> {
    return await this.repository.save(config)
  }
}
