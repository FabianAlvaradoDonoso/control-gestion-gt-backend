import { Column, Entity, CreateDateColumn, PrimaryGeneratedColumn } from 'typeorm'

@Entity('time_blocks')
export class TimeBlock {
  @PrimaryGeneratedColumn('increment')
  id: number

  @Column({ type: 'uuid', nullable: false })
  assignment_id: string

  @Column({ type: 'date', nullable: false })
  date: string

  @Column({ type: 'time', nullable: false })
  start_time: string

  @Column({ type: 'time', nullable: false })
  end_time: string

  @Column({ type: 'decimal', nullable: false })
  duration_hours: number

  @Column({ default: true, nullable: false })
  is_active: boolean

  @Column({ type: 'varchar', length: 20, nullable: false })
  mode: string

  @Column({ type: 'uuid', nullable: false })
  assign_by_user_id: string

  @Column({ type: 'text', nullable: true })
  comment: string | null

  @CreateDateColumn()
  created_at: Date
}
