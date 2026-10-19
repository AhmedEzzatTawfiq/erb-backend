import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { GetUsersQueryDto } from './dto/get-users-query.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserSessionsService } from 'src/user-sessions/user-sessions.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly userSessionsService: UserSessionsService,
    private readonly cloudinaryService: CloudinaryService,
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
        role: true,
        status: true,
        avatar: true,
        avatarPublicId: true,
      }
    })
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exist');
    }

    const user = this.userRepository.create(createUserDto)

    return await this.userRepository.save(user)
  }

  async uploadAvatar(id: string, file: Express.Multer.File) {

    const user = await this.findUserById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const oldPublicId = user.avatarPublicId;

    const newAvatar = await this.cloudinaryService.uploadImage(file, 'erb/users');

    try {

      user.avatar = newAvatar.url;
      user.avatarPublicId = newAvatar.publicId;

      const updatedUser = await this.userRepository.save(user);

      if (oldPublicId) {
        try {
          await this.cloudinaryService.deleteImage(
            oldPublicId,
          );
        } catch (error) {
          console.error(
            'Failed to delete old avatar:',
            error,
          );
        }
      }

      return updatedUser;

    } catch (error) {
      await this.cloudinaryService.deleteImage(newAvatar.publicId);

      throw error;
    }

  }

  async deleteAvatar(id: string) {
    const user = await this.findUserById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const oldPublicId = user.avatarPublicId;

    if (!oldPublicId) {
      return user;
    }

    try {
      await this.cloudinaryService.deleteImage(oldPublicId);

      user.avatar = null;
      user.avatarPublicId = null;

      await this.userRepository.save(user);

      return user;

    } catch (error) {
      throw error;
    }
  }


  async findAll({
    page = 1,
    limit = 6,
    search = '',
    status,
    role,
    sortField = 'createdAt',
    sortOrder = 'desc',
  }: GetUsersQueryDto = new GetUsersQueryDto()) {
    const allowedSortFields: Record<string, string> = {
      name: 'name',
      role: 'role',
      status: 'status',
      created: 'createdAt',
      createdAt: 'createdAt',
    };

    const orderBy = allowedSortFields[sortField] ?? 'createdAt';

    const whereSearch = search
      ? [
        { name: ILike(`%${search}%`) },
        { email: ILike(`%${search}%`) },
      ]
      : undefined;

    const baseWhere = whereSearch
      ? whereSearch.map((item) => ({
        ...item,
        ...(status && { status }),
        ...(role && { role }),
      }))
      : {
        ...(status && { status }),
        ...(role && { role }),
      };

    const [users, total] = await this.userRepository.findAndCount({
      where: baseWhere,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        avatar: true,
        createdAt: true,
      },
      order: {
        [orderBy]: sortOrder.toUpperCase() as 'ASC' | 'DESC',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: users,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
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
