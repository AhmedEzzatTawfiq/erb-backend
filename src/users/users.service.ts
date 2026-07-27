import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ){}

  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { email },
    })
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true
      }
    })
  }

  async findUserById(id: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true
      }
    })
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create(createUserDto)

    return await this.userRepository.save(user)
  }

  
}
