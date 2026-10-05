import { IsDateString, IsEmail, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from "class-validator";
import { EmployeeStatus } from "../enums/employee-status.enum";
import { Department } from "src/departments/entities/department.entity";
import { ApiProperty } from "@nestjs/swagger";

export class CreateEmployeeDto {

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsEmail()
    email: string;

    @IsOptional()
    @IsString()
    phone: string;

    @IsOptional()
    @IsString()
    address: string;

    @IsUUID()
    @ApiProperty({
        example: '550e8400-e29b-41d4-a716-446655440000',
        description: 'Department UUID',
    })
    departmentId: string;

    @IsString()
    @IsNotEmpty()
    jobTitle: string;

    @IsDateString()
    hireDate: Date;

    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    salary: number;

    @IsOptional()
    @IsEnum(EmployeeStatus)
    status: EmployeeStatus;

}

