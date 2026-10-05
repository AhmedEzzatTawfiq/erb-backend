import { ManyToOne } from "typeorm";
import { BaseEntity } from "../../common/entities/base.entity";
import { Column, Entity, JoinColumn } from "typeorm";
import { User } from "../../users/entities/user.entity";

@Entity("user_sessions")
export class UserSession extends BaseEntity {

    @ManyToOne(() => User, user => user.sessions, {
        onDelete: 'CASCADE'
    })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({
        name: 'user_id',
        type: 'varchar',
    })
    userId: string;

    @Column({
        name: 'refresh_token',
        type: 'varchar',
        length: 255,
        nullable: true
    })
    refreshTokenHash: string;

    @Column({
        name: 'device_name',
        type: 'varchar',
        length: 255,
        nullable: true
    })
    deviceName: string;

    @Column({
        name: 'ip_address',
        type: 'varchar',    
        length: 255,
        nullable: true
    })
    ipAddress: string;

    @Column({
        name: 'expires_at',
        type: 'timestamp',
        nullable: true
    })
    expiresAt: Date;

    @Column({
        name: 'last_used_at',
        type: 'timestamp',
        nullable: true
    })
    lastUsedAt: Date;

    @Column({
        type: 'boolean',
        default: false
    })
    isRevoked: boolean;

    @Column({
        type: 'timestamp',
        nullable: true
    })
    revokedAt: Date | null;
}
