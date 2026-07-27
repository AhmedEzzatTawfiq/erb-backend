import { BaseEntity } from "src/common/entities/base.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity("users")
export class User extends BaseEntity {

    @Column({
        type: 'varchar',
        length: 100
    })
    name: string

    @Column({
        type: 'varchar',
        length: 255,
        unique: true
    })
    email: string

    @Column({
        type: 'varchar',
        select: false
    })
    password: string




}
