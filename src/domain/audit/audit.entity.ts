import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity('audit_log')
export class Audit {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  entity_type: string

  @Column({ type: 'uuid' })
  entity_id: string

  @Column()
  action: string

  @Column({ type: 'uuid' })
  changed_by: string

  @Column({ type: 'timestamp' })
  changed_at: Date

  @Column('jsonb', { nullable: true })
  old_values: object | null

  @Column('jsonb', { nullable: true })
  new_values: object | null

  @Column('text', { array: true, nullable: true })
  changed_fields: string[] | null

  @Column('jsonb', { nullable: true })
  metadata_info: object | null
}
