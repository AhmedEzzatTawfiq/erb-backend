import { IsEnum, IsIn, IsInt, IsOptional, IsString, Min } from "class-validator";
import { UserStatus } from "../enums/user-status.enum";
import { Type } from "class-transformer";
import { Role } from "src/common/enums/role.enum";

export class GetUsersQueryDto {
    @IsEnum(UserStatus)
    @IsOptional()
    status?: UserStatus;

    @IsEnum(Role)
    @IsOptional()
    role?: Role;

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
    limit: number = 6;

    @IsOptional()
    @IsIn(['name', 'role', 'status', 'created', 'createdAt'])
    sortField?: 'name' | 'role' | 'status' | 'created' | 'createdAt';

    @IsOptional()
    @IsIn(['asc', 'desc'])
    sortOrder?: 'asc' | 'desc';
}
