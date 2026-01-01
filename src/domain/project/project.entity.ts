import { Entity, Column, CreateDateColumn, UpdateDateColumn, PrimaryGeneratedColumn } from 'typeorm'

@Entity('project')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  name: string

  @Column()
  internal_code: string

  @Column()
  status: string

  @Column()
  priority: string

  @Column()
  type: string

  @Column({ type: 'uuid' })
  client_id: string

  @Column({ type: 'int' })
  area_id: number

  @Column('jsonb')
  partners: object

  @Column('jsonb')
  managers: object

  @Column({ type: 'int', nullable: true })
  planned_hours: number | null

  @Column({ type: 'int', nullable: true })
  executed_hours: number | null

  @Column({ type: 'date' })
  start_date: string

  @Column({ type: 'date' })
  end_date: string

  @Column({ type: 'varchar', nullable: true })
  season: string | null

  @Column({ default: false })
  active_alerts: boolean

  @Column({ type: 'text', nullable: true })
  description: string | null

  @Column({ type: 'varchar', nullable: true, unique: true })
  gt_planner_id: string | null

  @Column({ default: true })
  is_active: boolean

  @Column({ type: 'uuid' })
  created_user_id: string

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date
}
