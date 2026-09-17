import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserSessionsService } from 'src/user-sessions/user-sessions.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly userSessionsService: UserSessionsService,
  ) { }

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
        password: true,
        role: true
      }
    })
  }

  async findUserById(id: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    })
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create(createUserDto)

    return await this.userRepository.save(user)
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });
  }

  async updatePassword(userId: string, hashedPassword: string,): Promise<void> {
    await this.userRepository.update(
      { id: userId },
      {
        password: hashedPassword,
      }
    )
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<User> {
    await this.userRepository.update(
      { id: userId },
      updateProfileDto
    )

    const user = await this.userRepository.findOne({
      where: { id: userId },
    })

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.name = updateProfileDto.name;

    return this.userRepository.save(user);
  }


  async updateUser(userId: string, updateUserDto: UpdateUserDto): Promise<User> {

    const user = await this.userRepository.preload({
      id: userId,
      ...updateUserDto
    })

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.userRepository.save(user);

  }


  async removeUser(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Revoke all user's sessions
    await this.userSessionsService.revokeAllSessions(userId);

    const result = await this.userRepository.delete({ id: userId });

    if (result.affected === 0) {
      throw new NotFoundException('User not found');
    }

    // Delete user
    await this.userRepository.remove(user);
  }



}
