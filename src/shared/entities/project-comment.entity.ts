import { Column, Entity, CreateDateColumn, UpdateDateColumn, PrimaryGeneratedColumn } from 'typeorm'

@Entity('project_comment')
export class ProjectComment {
  @PrimaryGeneratedColumn('increment')
  id: number

  @Column({ type: 'int', nullable: true })
  parent_id: number | null

  @Column({ type: 'uuid', nullable: false })
  project_id: string

  @Column({ type: 'uuid', nullable: false })
  user_id: string

  @Column({ type: 'varchar', length: 1000, nullable: false })
  content: string

  @Column({ type: 'varchar', length: 100, nullable: false })
  status: string

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn({ nullable: true })
  updated_at: Date
}
