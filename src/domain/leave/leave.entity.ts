import { Column, Entity, CreateDateColumn, PrimaryGeneratedColumn } from 'typeorm'

@Entity('leave')
export class Leave {
  @PrimaryGeneratedColumn('increment')
  id: number

  @Column({ type: 'uuid', nullable: true })
  user_id: string | null

  @Column({ type: 'date', nullable: false })
  start_date: Date

  @Column({ type: 'date', nullable: false })
  end_date: Date

  @Column({ nullable: false })
  status: string

  @Column({ nullable: false })
  type: string

  @Column({ type: 'varchar', nullable: true })
  title: string | null

  @CreateDateColumn()
  created_at: Date
}
