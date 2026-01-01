import { Entity, Column, CreateDateColumn, UpdateDateColumn, PrimaryGeneratedColumn } from 'typeorm'

@Entity('assignment')
export class Assignment {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid', nullable: false })
  project_id: string

  @Column({ type: 'uuid', nullable: false })
  user_id: string

  @Column()
  role: string

  @Column({ type: 'text', nullable: true })
  comment: string | null

  @Column()
  status: string

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date
}
