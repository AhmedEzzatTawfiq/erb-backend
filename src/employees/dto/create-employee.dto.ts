import { IsDateString, IsEmail, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from "class-validator";
import { EmployeeStatus } from "../enums/employee-status.enum";
import { Department } from "src/departments/entities/department.entity";

export class CreateEmployeeDto {

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsEmail()
    email: string;

    @IsOptional()
    @IsNumber()
    phone: string;

    @IsOptional()
    @IsString()
    address: string;

    @IsUUID()
    departmentId: string;

    @IsString()
    @IsNotEmpty()
    jopTitle: string;

    @IsDateString()
    hireDate: Date;

    @IsNumber({maxDecimalPlaces: 2})
    @Min(0)
    salary: number;

    @IsOptional()
    @IsEnum(EmployeeStatus)
    status: EmployeeStatus;

    
    
}

