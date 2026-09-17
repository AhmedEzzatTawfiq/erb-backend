import { BaseEntity } from "src/common/entities/base.entity";
import { Role } from "src/common/enums/role.enum";
import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { UserSession } from "src/user-sessions/entities/user-session.entity";
import { PasswordReset } from "src/password-resets/entities/password-reset.entity";

@Entity("users")
export class User extends BaseEntity {

    @OneToMany(() => UserSession, session => session.user)
    sessions: UserSession[]

    @OneToMany(() => PasswordReset, passwordReset => passwordReset.user)
    passwordResets: PasswordReset[];

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

    @Column({
        type: 'enum',
        enum: Role,
        default: Role.EMPLOYEE
    })
    role: Role;




}
