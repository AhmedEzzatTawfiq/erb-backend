import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt'
import * as crypto from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { User } from 'src/users/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { UserSessionsService } from 'src/user-sessions/user-sessions.service';
import { UserSession } from 'src/user-sessions/entities/user-session.entity';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RefreshTokenPayload } from './interfaces/refresh-token-payload.interface';
import { PasswordResetsService } from 'src/password-resets/password-resets.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userSessionsService: UserSessionsService,
    private readonly passwordResetsService: PasswordResetsService,
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

    // create session
    const session = await this.userSessionsService.createSession(user)

    // issue tokens
    const tokens = await this.issueTokens(user, session)

    return {
      message: 'User logged in successfully',
      ...tokens,
    }






  }

  async getProfile(userId: string) {
    const user = await this.usersService.findUserById(userId)
    if (!user) {
      throw new NotFoundException('User not found')
    }
    return user
  }

  async refresh(refreshTokenDto: RefreshTokenDto) {
    const { refreshToken } = refreshTokenDto

    const payload = await this.verifyRefreshToken(refreshToken)

    // retrieve session
    const session = await this.userSessionsService.findById(payload.sessionId)

    // validate session
    if (!session) {
      throw new UnauthorizedException('Invalid refresh token')
    }

    // check if session is revoked
    if (session.isRevoked) {
      throw new UnauthorizedException('Invalid refresh token')
    }

    // check if session expired
    if (session.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // validate refresh token hash
    const hashableToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
    let isRefreshTokenValid = await bcrypt.compare(hashableToken, session.refreshTokenHash)

    // Fallback for older tokens that were not pre-hashed
    if (!isRefreshTokenValid) {
      isRefreshTokenValid = await bcrypt.compare(refreshToken, session.refreshTokenHash)
    }

    if (!isRefreshTokenValid) {
      throw new UnauthorizedException('Invalid refresh token')
    }

    // issue new tokens
    const tokens = await this.issueTokens(session.user, session)
    return tokens


  }

  async logout(refreshTokenDto: RefreshTokenDto) {
    const { refreshToken } = refreshTokenDto;

    const payload = await this.verifyRefreshToken(refreshToken);

    const session = await this.userSessionsService.findById(payload.sessionId);

    if (!session) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (session.isRevoked) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // revoke session
    await this.userSessionsService.revokeSession(session.id);

    return {
      message: 'User logged out successfully',
    };
  }


  async logoutAll(refreshTokenDto: RefreshTokenDto) {
    const { refreshToken } = refreshTokenDto;

    const payload = await this.verifyRefreshToken(refreshToken);

    const session = await this.userSessionsService.findById(payload.sessionId);

    if (!session) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (session.isRevoked) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // revoke all sessions
    await this.userSessionsService.revokeAllSessions(session.userId);

    return {
      message: "User logged out from all devices successfully",
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;

    const user = await this.usersService.findByEmail(email)

    if (user) {
      const token = await this.passwordResetsService.createPasswordResetToken(user.id)
      console.log('Password reset token:', token);

    }
    return {
      message: 'If the email exists, a password reset link has been sent',
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, newPassword } = resetPasswordDto;

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const passwordReset = await this.passwordResetsService.findByTokenHash(tokenHash);

    if (!passwordReset) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    if (passwordReset.expiresAt < new Date()) {
      await this.passwordResetsService.deleteToken(passwordReset?.id)
      throw new NotFoundException('Invalid or expired password reset token')
    }

    const user = await this.usersService.findUserById(passwordReset.userId);

    if (!user) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await this.usersService.updatePassword(
      user.id,
      hashedPassword,
    );

    // Revoke all existing sessions
    await this.userSessionsService.revokeAllSessions(user.id);

    // Delete reset token
    await this.passwordResetsService.deleteToken(passwordReset.id);

    return {
      message: 'Password reset successfully',
    };




  }





  // Private helper methods

  private async generateAccessToken(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role
    }
    console.log('Payload:', payload);

    return this.jwtService.signAsync(payload, {
      secret: this.configService.get('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN'),
    })
  }

  private async generateRefreshToken(userId: string, sessionId: string): Promise<string> {
    const payload = {
      sub: userId,
      sessionId

    }

    return this.jwtService.signAsync(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN'),
    })
  }

  private async issueTokens(
    user: User,
    session: UserSession
  ): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    // generate tokens
    const accessToken = await this.generateAccessToken(user)
    const refreshToken = await this.generateRefreshToken(user.id, session.id)

    // hash new refresh token
    const hashableToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const newRefreshTokenHash = await bcrypt.hash(hashableToken, 10)

    // expiration of refresh token
    const refreshTokenExpiresAt = new Date;

    refreshTokenExpiresAt.setDate(refreshTokenExpiresAt.getDate() + 7)

    // update session
    await this.userSessionsService.updateRefreshToken(session.id, newRefreshTokenHash, refreshTokenExpiresAt)

    // return new tokens
    return {
      accessToken,
      refreshToken,
    }
  }

  private async verifyRefreshToken(refreshToken: string): Promise<RefreshTokenPayload> {
    try {

      // verify refresh token
      return await this.jwtService.verifyAsync<RefreshTokenPayload>(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      })

    } catch {

      throw new UnauthorizedException('Invalid refresh token')

    }
  }



}
