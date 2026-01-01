import { Config } from './config.entity'
import { ConfigMessages } from './config.messages'
import { ConfigRepository } from './config.repository'

export class ConfigService {
  private configRepository: ConfigRepository

  constructor() {
    this.configRepository = new ConfigRepository()
  }

  async getSeason() {
    const seasonConfig = await this.configRepository.getConfigByKey('season')

    if (!seasonConfig || !seasonConfig.value || !('season_mode' in seasonConfig.value)) {
      return { season_mode: 'auto' }
    }
    return { season_mode: seasonConfig.value.season_mode }
  }

  async getWorkingHours() {
    const workingHoursConfig = await this.configRepository.getConfigByKey('working_hours')

    if (!workingHoursConfig || !workingHoursConfig.value) {
      throw new Error(ConfigMessages.WORKING_HOURS_CONFIG_NOT_FOUND)
    }
    return {
      working_hours: workingHoursConfig.value,
    }
  }

  async updateSeason(seasonMode: string) {
    let seasonConfig = await this.configRepository.getConfigByKey('season')

    if (!seasonConfig) {
      seasonConfig = new Config()
      seasonConfig.name = 'season'
      seasonConfig.value = { season_mode: seasonMode }
    } else {
      seasonConfig.value.season_mode = seasonMode
    }

    return await this.configRepository.update(seasonConfig)
  }
}
