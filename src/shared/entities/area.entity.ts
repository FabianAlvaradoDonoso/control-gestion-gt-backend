import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity('area')
export class Area {
  @PrimaryGeneratedColumn('increment')
  id: number

  @Column()
  name: string
}
