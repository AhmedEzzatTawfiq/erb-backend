import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserSession } from './entities/user-session.entity';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class UserSessionsService {

  constructor(
    @InjectRepository(UserSession)
    private readonly userSessionRepository: Repository<UserSession>,
  ) { }

  async createSession(user: User): Promise<UserSession> {
    return this.userSessionRepository.save({ user })
  }

  async updateRefreshToken(sessionId: string, refreshTokenHash: string, expiresAt: Date): Promise<void> {
    const result = await this.userSessionRepository.update(
      { id: sessionId },
      {
        refreshTokenHash,
        expiresAt
      })
    console.log('Result:', result);

    if (result.affected === 0) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }
  }

  async findById(sessionId: string): Promise<UserSession | null> {
    return this.userSessionRepository.findOne({
      where: { id: sessionId },
      relations: { user: true }
    });
  }

  async revokeSession(sessionId: string): Promise<void> {
    const result = await this.userSessionRepository.update(sessionId, {
      isRevoked: true,
      revokedAt: new Date()
    })
    if (result.affected === 0) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }
  }

  async revokeAllSessions(userId: string): Promise<void>{
    const result = await this.userSessionRepository.update({userId}, {
      isRevoked: true,
      revokedAt: new Date()
    })
    if (result.affected === 0) {
      throw new NotFoundException(`No sessions found for user ID ${userId}`);
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    const result = await this.userSessionRepository.delete(sessionId)
    if (result.affected === 0) {
      throw new InternalServerErrorException(`Session with ID ${sessionId} not found`);
    }
  }


}
