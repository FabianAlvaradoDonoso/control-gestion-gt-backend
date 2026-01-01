import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity('area')
export class Area {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  name: string
}
