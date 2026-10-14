import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserSessionsModule } from 'src/user-sessions/user-sessions.module';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
  
@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    CloudinaryModule,
    UserSessionsModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService]
})
export class UsersModule { }
