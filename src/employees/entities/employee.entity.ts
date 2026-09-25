import { Column, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { EmployeeStatus } from "../enums/employee-status.enum";
import { Department } from "src/departments/entities/department.entity";
import { User } from "src/users/entities/user.entity";

export class Employee {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({unique: true})
    email: string;

    @Column({nullable: true})
    phone: string;

    @Column({nullable: true})
    address: string;

    @ManyToOne(() => Department, (department) => department.employees)
    @JoinColumn({name: 'departmentId'})
    department: Department;

    @Column()
    departmentId: string;

    @Column()
    jopTitle: string;

    @Column({type: 'date'})
    hireDate: Date;

    @Column({
        type: 'decimal',
        precision: 12,
        scale: 2
    })
    salary: number;

    @Column({
        type: 'enum',
        enum: EmployeeStatus,
        default: EmployeeStatus.ACTIVE
    })
    status: EmployeeStatus;

    
    
}
