import { IsEmail, IsNotEmpty, IsString, IsStrongPassword, MaxLength, MinLength } from "class-validator";
import { Role } from "src/common/enums/role.enum";

export class CreateUserDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    name: string

    @IsEmail()
    @IsNotEmpty()
    @MaxLength(255)
    email: string

    @IsString()
    @MinLength(8)
    @MaxLength(50)
    password: string

    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    role: Role
}
