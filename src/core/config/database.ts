import { DataSource } from 'typeorm'

import { config } from './env'

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: config.db.host,
  port: config.db.port,
  username: config.db.username,
  password: config.db.password,
  database: config.db.database,
  synchronize: config.nodeEnv === 'development',
  // logging: config.nodeEnv === 'development',
  entities: config.nodeEnv === 'production' ? ['dist/**/*.entity.js'] : ['src/**/*.entity.ts'],
  migrations:
    config.nodeEnv === 'production' ? ['dist/migrations/**/*.js'] : ['src/migrations/**/*.ts'],
  subscribers: [],
})
