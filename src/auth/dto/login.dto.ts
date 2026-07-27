import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator"

export class LoginDto {
    @IsEmail()
    @IsNotEmpty()
    @MaxLength(255)
    email: string

    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    @MinLength(8)
    password: string

}