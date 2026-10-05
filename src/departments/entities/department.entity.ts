import { Employee } from "../../employees/entities/employee.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('departments')
export class Department {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({unique: true})
    name: string;

    @OneToMany(() => Employee, (employee) => employee.department)
    employees: Employee[];
}
