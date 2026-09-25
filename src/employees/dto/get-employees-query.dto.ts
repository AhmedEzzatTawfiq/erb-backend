import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Min } from "class-validator";
import { EmployeeStatus } from "../enums/employee-status.enum";
import { Type } from "class-transformer";

export class GetEmployeesQueryDto {
    @IsEnum(EmployeeStatus)
    @IsOptional()
    status?: EmployeeStatus;

    @IsUUID()
    @IsOptional()
    departmentId?: string;

    @IsString()
    @IsOptional()
    search?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page: number = 1;

    @IsOptional()
    @Min(1)
    @Type(() => Number)
    @IsInt()
    limit: number = 10;
}