import { Employee } from "src/employees/entities/employee.entity";
import { Column, OneToMany, PrimaryGeneratedColumn } from "typeorm";

export class Department {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({unique: true})
    name: string;

    @OneToMany(() => Employee, (employee) => employee.department)
    employees: Employee[];
}
