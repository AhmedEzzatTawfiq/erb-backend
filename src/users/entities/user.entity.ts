import { BaseEntity } from "../../common/entities/base.entity";
import { Role } from "../../common/enums/role.enum";
import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { UserSession } from "../../user-sessions/entities/user-session.entity";
import { PasswordReset } from "../../password-resets/entities/password-reset.entity";
import { Employee } from "../../employees/entities/employee.entity";
import { UserStatus } from "../enums/user-status.enum";

@Entity("users")
export class User extends BaseEntity {

    @OneToMany(() => UserSession, session => session.user)
    sessions: UserSession[]

    @OneToMany(() => PasswordReset, passwordReset => passwordReset.user)
    passwordResets: PasswordReset[];

    @Column({ type: 'varchar', nullable: true })
    avatar: string | null;

    @Column({ type: 'varchar', nullable: true })
    avatarPublicId: string | null;

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

    @Column({
        type: 'enum',
        enum: UserStatus,
        default: UserStatus.ACTIVE
    })
    status: UserStatus;





}
