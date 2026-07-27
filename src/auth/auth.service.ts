import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt'
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class AuthService {

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) { }


  // Public methods

  async register(createUserDto: CreateUserDto) {
    // Check if email exist
    const existingUser = await this.usersService.findByEmail(createUserDto.email)

    if (existingUser) {
      throw new ConflictException('Email alreay taken')
    }

    // hash password 
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10)

    //create a new user
    const userData = {
      ...createUserDto,
      password: hashedPassword,
    }

    const user = await this.usersService.create(userData)

    // access token
    const accessToken = await this.generateAccessToken(user)


    // return a success response
    return {
      message: 'User registered successfully',
      accessToken
    }


  }

  async login(loginDto: LoginDto) {
    // get user from db
    const user = await this.usersService.findByEmailWithPassword(loginDto.email)

    // validate user
    if (!user) {
      throw new UnauthorizedException('Invalid credentials')
    }

    // compare password
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password)

    // validate password
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials')
    }

    // generated jwt
    const accessToken = await this.generateAccessToken(user)

    // return a success response
    return {
      message: 'User logged in successfully',
      accessToken
    }


    

  }

  async getProfile(userId: string) {
    const user = await this.usersService.findUserById(userId)
    if (!user) {
      throw new NotFoundException('User not found')
    }
    return user
  }




// Private helper methods

  private async generateAccessToken(user: User) {
    const payload = {
      sub: user.id,
      email: user.email
    }

    return this.jwtService.signAsync(payload)
  }

  
}
