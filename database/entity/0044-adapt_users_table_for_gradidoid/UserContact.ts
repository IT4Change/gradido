import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, DeleteDateColumn } from 'typeorm'

@Entity('user_contacts', { engine: 'InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci' })
export class UserContact extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @Column({
    name: 'type',
    length: 100,
    nullable: true,
    default: null,
    collation: 'utf8mb4_unicode_ci',
  })
  type: string

  @Column({ name: 'user_id', type: 'int', unsigned: true, nullable: false })
  userId: number

  @Column({ length: 255, unique: true, nullable: false, collation: 'utf8mb4_unicode_ci' })
  email: string

  @Column({ name: 'email_hash', type: 'binary', length: 32, default: null, nullable: true })
  emailHash: Buffer

  @Column({ name: 'email_checked', type: 'bool', nullable: false, default: false })
  emailChecked: boolean

  @Column({ length: 255, unique: false, nullable: true, collation: 'utf8mb4_unicode_ci' })
  phone: string

  @Column({ name: 'created', default: () => 'CURRENT_TIMESTAMP', nullable: false })
  createdAt: Date

  @DeleteDateColumn()
  updatedAt: Date | null

  @DeleteDateColumn()
  deletedAt: Date | null
}
