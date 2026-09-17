import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UserSessionsModule } from 'src/user-sessions/user-sessions.module';
import { PasswordResetsModule } from 'src/password-resets/password-resets.module';

@Module({
  imports: [UserSessionsModule, PasswordResetsModule, UsersModule, JwtModule.registerAsync({
    inject: [ConfigService],
    useFactory: (configService: ConfigService) => ({

      secret: configService.get('JWT_ACCESS_SECRET'),
      signOptions: {
        expiresIn: configService.get('JWT_ACCESS_EXPIRES_IN'),
      }
    })
  })],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtStrategy, JwtModule],
})
export class AuthModule { }
